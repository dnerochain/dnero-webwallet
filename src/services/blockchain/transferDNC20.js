const {BigNumber} = require("@ethersproject/bignumber");
const {TokenType, DontCare, getContextFromTargetChainID, getTokenBank} = require("./common.js")
const {approveTokenAccess, transferDNC} = require("./dncUtils")
const {showLoader, hideLoader} = require("../../state/actions/ui");
const {store} = require("../../state");
const {updateAccountBalances} = require("../../state/actions/Wallet");
const dnerojs = require("@dnerolabs/dnero-js");
const Alerts = require("../Alerts").default;

export async function transferDNC20(from, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, amount) {
    try {
        store.dispatch(showLoader('Fetching Token Bank...'));

        let {sourceChainID, sourceChainIDStr, sourceChainRPC} = getContextFromTargetChainID(targetChainID);
        let spender = getTokenBank(TokenType.DNC20, sourceChainID);


        store.dispatch(showLoader('Sending Approval Transaction...'));

        // Approve the TokenBank contract as the spender of the DNC token
        await approveTokenAccess(TokenType.DNC20, from, sourceChainIDStr, sourceChainRPC, sourceChainTokenOrVoucherContractAddr, spender.address, DontCare, amount)

        // Transfer the tokens/vouchers
        await transferDNC(TokenType.DNC20, from, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, DontCare, amount);

        store.dispatch(updateAccountBalances());

        store.dispatch(hideLoader());
    }
    catch (e){
        store.dispatch(hideLoader());

        const humanizedErrorMessage = dnerojs.errors.humanizeErrorMessage(e.message);
        Alerts.showError(humanizedErrorMessage);

    }
}

//
// MAIN
//

//
// Privatenet examples (where the mainchain chainID is 5652)
//
// Mainchain to Subchain Transfer (lock tokens on the mainchain):
//    node transferDNC20.js privatenet 0x4fb87c52Bb6D194f78cd4896E3e574028fedBAB9 360777 0x2E833968E5bB786Ae419c4d13189fB081Cc43bab 12345 ~/.dnerocli/keys/encrypted/2E833968E5bB786Ae419c4d13189fB081Cc43bab qwertyuiop
//
// Subchain to Mainchain Transfer (burn vouchers on the subchain):
//    node transferDNC20.js privatenet 0x7D7e270b7E279C94b265A535CdbC00Eb62E6e68f 5652 0x2E833968E5bB786Ae419c4d13189fB081Cc43bab 1111 ~/.dnerocli/keys/encrypted/2E833968E5bB786Ae419c4d13189fB081Cc43bab qwertyuiop
//

//
// Testnet examples (where the mainchain chainID is 5651)
//
// Mainchain to Subchain Transfer (lock tokens on the mainchain):
//    node transferDNC20.js testnet 0xC74c9a64d243bD2bc14C561E4D6B7DAAE19C73eA 360777 0x2E833968E5bB786Ae419c4d13189fB081Cc43bab 12345 ~/.dnerocli/keys/encrypted/2E833968E5bB786Ae419c4d13189fB081Cc43bab qwertyuiop
//
// Subchain to Mainchain Transfer (burn vouchers on the subchain):
//    node transferDNC20.js testnet 0x7D7e270b7E279C94b265A535CdbC00Eb62E6e68f 5651 0x2E833968E5bB786Ae419c4d13189fB081Cc43bab 1111 ~/.dnerocli/keys/encrypted/2E833968E5bB786Ae419c4d13189fB081Cc43bab qwertyuiop
//

// if (process.argv && process.argv.length != 9) {
//     console.log("Usage:");
//     console.log("  node transferDNC20.js <networkType> <sourceChainTokenOrVoucherContractAddr> <targetChainID> <targetChainReceiver> <amount> <senderKeyPath> [senderKeyPassword]");
//     console.log("");
//     process.exit(1);
// }
//
// let networkType = process.argv[2];
// setCfg(networkType);
//
// let sourceChainTokenOrVoucherContractAddr = process.argv[3];
// let targetChainID = process.argv[4];
// let targetChainReceiver = process.argv[5];
// let amount = BigNumber.from(process.argv[6]);
// let senderKeyPath = process.argv[7];
// let senderKeyPassword = process.argv[8];
//
// transferDNC20(senderKeyPath, senderKeyPassword, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, amount);
