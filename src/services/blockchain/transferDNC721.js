const {TokenType, DontCare, getContextFromTargetChainID, getTokenBank} = require("./common.js")
const {mintMockDNCTokensIfNeeded} = require("./mintUtils")
const {approveTokenAccess, transferDNC} = require("./dncUtils")

async function transferDNC721(senderKeyPath, senderKeyPassword, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, tokenID) {
    // Mint mock DNC tokens if sourceChainTokenOrVoucherContractAddr is not a voucher contract
    await mintMockDNCTokensIfNeeded(TokenType.DNC721, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, tokenID, DontCare, senderKeyPath, senderKeyPassword);

    // Approve the TokenBank contract as the spender of the DNC token
    let {sourceChainID, sourceChainIDStr, sourceChainRPC} = getContextFromTargetChainID(targetChainID);
    let spender = getTokenBank(TokenType.DNC721, sourceChainID, DontCare, DontCare);
    await approveTokenAccess(TokenType.DNC721, sourceChainIDStr, sourceChainRPC, sourceChainTokenOrVoucherContractAddr, spender.address, tokenID, DontCare, senderKeyPath, senderKeyPassword)

    // Transfer the tokens/vouchers
    await transferDNC(TokenType.DNC721, senderKeyPath, senderKeyPassword, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, tokenID, DontCare);
}

export {
    transferDNC721
}
