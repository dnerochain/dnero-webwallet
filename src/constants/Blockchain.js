import _ from 'lodash';

const walletMetadata = require('@dnerolabs/wallet-metadata');

export const getBlockchainConfig = (mainChainIdStr) => {
    if(_.startsWith(mainChainIdStr, 'tsub')){
        return null;
    }

    return walletMetadata.getBlockchain(mainChainIdStr);
}

export const getCrossTransferFee = (mainChainIdStr, subchainIDStr) => {
    const config = getBlockchainConfig(mainChainIdStr);
    if(_.isNil(subchainIDStr) || !_.startsWith(subchainIDStr, 'tsub')){
        return config?.crossChainTransferFeeInDToken;
    }
    const subchain = getSubchain(mainChainIdStr, subchainIDStr);
    if(subchain){
        return subchain.crossChainTransferFeeInDToken;
    }

    // Default to 10
    return 10;
}

export const getSubchains = (mainChainIdStr) => {
    let config = getBlockchainConfig(mainChainIdStr);

    return config?.subchains || [];
}

export const getSubchain = (mainChainIdStr, subchainIDStr) => {
    let chains = getSubchains(mainChainIdStr);

    return _.find(chains, (chain) => {
        return (chain.subchainIDStr === subchainIDStr);
    });
}
