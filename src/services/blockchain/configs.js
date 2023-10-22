const _ = require('lodash');
const walletMetadata = require('@dnerolabs/wallet-metadata');

let _cfg = null;

function setBlockchainCfg(chainIdStr, subchain) {
    let mainchainConfig = walletMetadata.getBlockchain(chainIdStr);

    // This subchain is overriding the default mainchain token banks
    if(subchain.mainchainDTokenTokenBankAddr){
        mainchainConfig = _.cloneDeep(mainchainConfig);
        mainchainConfig.mainchainDTokenTokenBankAddr = subchain.mainchainDTokenTokenBankAddr;
        mainchainConfig.mainchainDNC20TokenBankAddr = subchain.mainchainDNC20TokenBankAddr;
        mainchainConfig.mainchainDNC721TokenBankAddr = subchain.mainchainDNC721TokenBankAddr;
        mainchainConfig.mainchainDNC1155TokenBankAddr = subchain.mainchainDNC1155TokenBankAddr;
    }

    _cfg = Object.assign({}, mainchainConfig, subchain);
}

function cfg() {
    return _cfg;
}

export {
    cfg,
    setBlockchainCfg
}