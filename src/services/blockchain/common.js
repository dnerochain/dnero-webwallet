
const dnerojs = require("@dnerolabs/dnero-js");
const { BigNumber } = require("@ethersproject/bignumber");
const {cfg} = require("./configs.js")
const {DTokenTokenBankContract, DNC20TokenBankContract, DNC721TokenBankContract, DNC1155TokenBankContract} = require("../../constants/contracts");

const TokenType = {
    DToken: 0,
    DNC20: 20,
    DNC721: 721,
    DNC1155: 1155
}

const DontCare = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function assertEq(bn1, bn2) {
    if (!BigNumber.from(bn1).eq(bn2)) {
        throw `${bn1} != ${bn2}`;
    }
};

function expandTo18Decimals(n) {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}

// For privatenet, simply input: qwertyuiop
async function promptForWalletPassword() {
    let password = null
    return password;
}

function createProvider(chainIDStr, rpc) {
    // console.log("createProvider, chainIDStr:", chainIDStr, ", rpc:", rpc)
    const provider = new dnerojs.providers.HttpProvider(chainIDStr, rpc);
    return provider;
}

function getWallet(chainIDStr, rpc, keyPath, keyPassword) {
    const provider = createProvider(chainIDStr, rpc);
    const wallet = createWallet(provider, keyPath, keyPassword);
    return wallet;
}

// Create wallet
function createWallet(provider, keyPath, password) {
    if (keyPath == null) {
        const wallet = dnerojs.Wallet.createRandom();
        return wallet.connect(provider);
    } else {
        const json = null;
        const wallet = dnerojs.Wallet.fromEncryptedJson(json, password);
        return wallet.connect(provider);
    }
}

function getContextFromSourceChainID(sourceChainID) {
    let targetChainID
    if (sourceChainID === cfg().mainchainID) {
        targetChainID = cfg().subchainID
    } else if (sourceChainID === cfg().subchainID) {
        targetChainID = cfg().mainchainID
    } else {
        throw new Error("getContextFromSourceChainID: invalid target chain ID")
    }
    return getContextFromTargetChainID(targetChainID)
}

function getContextFromTargetChainID(targetChainID) {
    let sourceChainID, sourceChainIDStr, sourceChainRPC, targetChainIDStr, targetChainRPC
    if (targetChainID === cfg().subchainID) {
        sourceChainID = cfg().mainchainID
        sourceChainIDStr = cfg().mainchainIDStr
        sourceChainRPC = cfg().mainchainRPC
        targetChainIDStr = cfg().subchainIDStr
        targetChainRPC = cfg().subchainRPC
    } else if (targetChainID === cfg().mainchainID) {
        sourceChainID = cfg().subchainID
        sourceChainIDStr = cfg().subchainIDStr
        sourceChainRPC = cfg().subchainRPC
        targetChainIDStr = cfg().mainchainIDStr
        targetChainRPC = cfg().mainchainRPC
    } else {
        throw new Error("getContextFromTargetChainID: invalid target chain ID")
    }   
    return {sourceChainID, sourceChainIDStr, sourceChainRPC, targetChainID, targetChainIDStr, targetChainRPC}
}

async function printSenderReceiverBalances(tokenType, sourceChainIDStr, sourceChainRPC, sourceChainTokenAddr, sourceChainTokenID, sourceChainSenderAddr, 
    targetChainIDStr, targetChainRPC, targetChainTokenAddr, targetChainTokenID, targetChainReceiverAddr, balanceGetter) {
        
        let senderBalance, receiverBalance;
        if (is0x0(sourceChainTokenAddr)) {
            senderBalance = 0;
        } else {
        senderBalance = await balanceGetter(tokenType, sourceChainIDStr, sourceChainRPC, sourceChainTokenAddr, sourceChainTokenID, sourceChainSenderAddr);
    }
    if (is0x0(targetChainTokenAddr)) {
        receiverBalance = 0;
    } else {
        receiverBalance = await balanceGetter(tokenType, targetChainIDStr, targetChainRPC, targetChainTokenAddr, targetChainTokenID, targetChainReceiverAddr);
    }
    console.log("Source chain token/voucher contract:", sourceChainTokenAddr);
    console.log("Target chain token/voucher contract:", targetChainTokenAddr);
    console.log("Sender  ", sourceChainSenderAddr, "balance on the source chain:", senderBalance.toString());
    console.log("Receiver", targetChainReceiverAddr, "balance on the target chain:", receiverBalance.toString());
    console.log("") 
    return {senderBalance, receiverBalance}
}

async function detectTargetChainReceiverBalanceChanges(targetChainIDStr, targetChainRPC, tokenType, denom,
    targetChainTokenBankContract, targetChainTokenOrVoucherAddr, tokenID, receiverAddr, receiverPreviousBalance, balanceGetter) {
    while (true) {
        await sleep(1000);
        console.log("Waiting for the cross-chain transfer to finalize...")
        if (tokenType !== TokenType.DToken && is0x0(targetChainTokenOrVoucherAddr)) {
            // the voucher contract on the target chain may not be deployed yet, need to continue to query
            targetChainTokenOrVoucherAddr = await targetChainTokenBankContract.getVoucher(denom)
        }

        let receiverBalance = await balanceGetter(tokenType, targetChainIDStr, targetChainRPC, 
            targetChainTokenOrVoucherAddr, tokenID, receiverAddr);

        if (!BigNumber.from(receiverBalance).eq(BigNumber.from(receiverPreviousBalance))) {
            break
        }
    }
}

function buildDenom(originChainID, tokenTypeStr, originChainTokenContractAddr) {
    let denom = originChainID.toString() + "/" + tokenTypeStr + "/" + originChainTokenContractAddr;
    return denom.toLowerCase();
}

function extractOriginChainIDFromDenom(denom) {
    let parts = denom.split("/");
    return parts[0];
}

function extractContractAddressFromDenom(denom) {
    let parts = denom.split("/");
    return parts[parts.length - 1];
}

function getTokenBank(tokenType, chainID) {
    let chainIDStr, chainRPC
    if (chainID === cfg().mainchainID) {
        chainIDStr = cfg().mainchainIDStr
        chainRPC = cfg().mainchainRPC
    } else if (chainID === cfg().subchainID) {
        chainIDStr = cfg().subchainIDStr
        chainRPC = cfg().subchainRPC
    } else {
        throw new Error("getDNCTokenBank: invalid chainID")
    }

    const provider = createProvider(chainIDStr, chainRPC);

    let tokenBank;
    if (chainID === cfg().mainchainID) {
        if (tokenType === TokenType.DToken) {
            tokenBank = new dnerojs.Contract(cfg().mainchainDTokenTokenBankAddr, DTokenTokenBankContract.abi, provider);
        } else if (tokenType === TokenType.DNC20) {
            tokenBank = new dnerojs.Contract(cfg().mainchainDNC20TokenBankAddr, DNC20TokenBankContract.abi, provider);
        } else if (tokenType === TokenType.DNC721) {
            tokenBank = new dnerojs.Contract(cfg().mainchainDNC721TokenBankAddr, DNC721TokenBankContract.abi, provider);
        } else if (tokenType === TokenType.DNC1155) {
            tokenBank = new dnerojs.Contract(cfg().mainchainDNC1155TokenBankAddr, DNC1155TokenBankContract.abi, provider);
        } else {
            throw new Error("getDNCTokenBank: Invalid tokenType (mainchain)");
        }
    } else if (chainID === cfg().subchainID) {
        if (tokenType === TokenType.DToken) {
            tokenBank = new dnerojs.Contract(cfg().subchainDTokenTokenBankAddr, DTokenTokenBankContract.abi, provider);
        } else if (tokenType === TokenType.DNC20) {
            tokenBank = new dnerojs.Contract(cfg().subchainDNC20TokenBankAddr, DNC20TokenBankContract.abi, provider);
        } else if (tokenType === TokenType.DNC721) {
            tokenBank = new dnerojs.Contract(cfg().subchainDNC721TokenBankAddr, DNC721TokenBankContract.abi, provider);
        } else if (tokenType === TokenType.DNC1155) {
            tokenBank = new dnerojs.Contract(cfg().subchainDNC1155TokenBankAddr, DNC1155TokenBankContract.abi, provider);
        } else {
            throw new Error("getDNCTokenBank: Invalid tokenType (subchain)");
        }
    }

    return tokenBank;
}

function is0x0(address){
    return (address === 0 || address === 0x0 || address === '0x0' || address === '0x0000000000000000000000000000000000000000');
}

export {
    DTokenTokenBankContract,
    DNC20TokenBankContract,
    DNC721TokenBankContract,
    DNC1155TokenBankContract,
    TokenType,
    DontCare,
    sleep,
    assertEq,
    expandTo18Decimals,
    promptForWalletPassword,
    createProvider,
    getWallet,
    createWallet,
    getContextFromSourceChainID,
    getContextFromTargetChainID,
    printSenderReceiverBalances,
    detectTargetChainReceiverBalanceChanges,
    buildDenom,
    extractOriginChainIDFromDenom,
    extractContractAddressFromDenom,
    getTokenBank,
    is0x0
}