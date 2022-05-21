import _ from 'lodash';
import * as thetajs from '@thetalabs/theta-js';
import {DDropAddressByChainId} from './index';

const {tokensByChainId} = require('@thetalabs/tnt20-contract-metadata');

const getTokenIconUrl = (fileName) => {
    if(_.isEmpty(fileName)){
        return null;
    }
    return `https://s3.us-east-2.amazonaws.com/assets.thetatoken.org/tokens/${fileName}`;
    // return `https://assets.thetatoken.org/tokens/${fileName}`;
};

const DneroAsset = {
    id: 'dnero',
    name: 'Dnero',
    symbol: 'DNERO',
    contractAddress: null,
    decimals: 18,
    iconUrl: getTokenIconUrl('dnero.png'),
    balanceKey: 'dnerowei'
};

const DTokenAsset = {
    id: 'dtoken',
    name: 'Dnero Token',
    symbol: 'DTOKEN',
    contractAddress: null,
    decimals: 18,
    iconUrl: getTokenIconUrl('dtoken.png'),
    balanceKey: 'dtokenwei'
};

const NativeAssets = [
    DneroAsset,
    DTokenAsset
];

const DDropAsset = (chainId) => {
    const ddropAddress = DDropAddressByChainId[chainId];
    let TNT20Asset = null;

    if(ddropAddress){
        TNT20Asset = {
            id: ddropAddress,
            name: 'DDROP',
            symbol: 'DDROP',
            contractAddress: ddropAddress,
            address: ddropAddress,
            decimals: 18,
            iconUrl: getTokenIconUrl(_.get(tokensByChainId, [chainId, ddropAddress, 'logo'])),
            balanceKey: ddropAddress
        };
    }

    return TNT20Asset;
};

const DefaultAssets = (chainId) => {
    const ddropAddress = DDropAddressByChainId[chainId];
    let TNT20Assets = [];
    let ddropAsset = DDropAsset(chainId);

    if(ddropAddress){
        TNT20Assets.push(ddropAsset);
    }

    return _.concat(NativeAssets, TNT20Assets);
};

const getAllAssets = (chainId, tokens) => {
    const ddropAddress = DDropAddressByChainId[chainId];
    const tokenAssets = tokens.map(tokenToAsset);
    const tokenAssetsWithoutTdrop = _.filter(tokenAssets, (asset) => {
        return asset.contractAddress?.toLowerCase() !== ddropAddress?.toLowerCase();
    });

    return _.concat(DefaultAssets(chainId), tokenAssetsWithoutTdrop);
};

const tokenToAsset = (token) => {
    const knownToken = (tokensByChainId[thetajs.networks.ChainIds.Mainnet][token.address] || tokensByChainId[thetajs.networks.ChainIds.Testnet][token.address]);

    return {
        id: token.address,
        name: token.symbol,
        symbol: token.symbol,
        contractAddress: token.address,
        decimals: token.decimals,
        iconUrl: (knownToken ? getTokenIconUrl(knownToken.logo) : null),
        balanceKey: token.address
    };
};

export {
    DefaultAssets,

    DneroAsset,
    DTokenAsset,
    DDropAsset,

    tokenToAsset,

    getAllAssets,
};
