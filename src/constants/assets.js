import _ from 'lodash';
import * as dnerojs from '@dnerolabs/dnero-js';
import {DDropAddressByChainId, WDneroAddressByChainId} from './index';

const {getKnownToken} = require('@dnerolabs/wallet-metadata');

// TOKEN STANDARDS
const ERC721 = 'ERC721';
const ERC1155 = 'ERC1155';
const ERC20 = 'ERC20';

const getTokenIconUrl = (fileName) => {
    if(_.isEmpty(fileName)){
        return null;
    }
    return `https://assets.dnerochain.xyz/tokens/${fileName}`;
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

const NativeAssetsForSubchain = [
    Object.assign({}, DTokenAsset, {
        symbol: `v${DTokenAsset.symbol}`
    })
];

const DDropAsset = (chainId) => {
    const address = DDropAddressByChainId[chainId];
    let DNC20Asset = null;
    const knownToken = getKnownToken(chainId, address);

    if(address){
        DNC20Asset = {
            id: address,
            name: 'DDROP',
            symbol: 'DDROP',
            contractAddress: address,
            address: address,
            decimals: 18,
            iconUrl:  knownToken?.logoUrl,
            balanceKey: address
        };
    }

    return DNC20Asset;
};

const WDneroAsset = (chainId) => {
    const address = WDneroAddressByChainId[chainId];
    let DNC20Asset = null;
    const knownToken = getKnownToken(chainId, address);

    if(address){
        DNC20Asset = {
            id: address,
            name: 'wDNERO',
            symbol: 'wDNERO',
            contractAddress: address,
            address: address,
            decimals: 18,
            iconUrl:  knownToken?.logoUrl,
            balanceKey: address
        };
    }

    return DNC20Asset;
};

const DefaultAssets = (chainId) => {
    let DNC20Assets = [];
    let ddropAsset = DDropAsset(chainId);
    let wDneroAsset = WDneroAsset(chainId);

    if(ddropAsset){
        DNC20Assets.push(ddropAsset);
    }
    if(wDneroAsset){
        DNC20Assets.push(wDneroAsset);
    }

    return _.concat((_.startsWith(chainId, 'tsub') ? NativeAssetsForSubchain : NativeAssets), DNC20Assets);
};

const getAllAssets = (chainId, tokens) => {
    const ddropAddress = DDropAddressByChainId[chainId]?.toLowerCase();
    const wDneroAddress = WDneroAddressByChainId[chainId]?.toLowerCase();
    const tokenAssets = tokens.map(tokenToAsset);
    const tokenAssetsWithoutDefaultDNC20s = _.filter(tokenAssets, (asset) => {
        const address = asset.contractAddress?.toLowerCase();
        return (address !== ddropAddress && address !== wDneroAddress);
    });

    return _.concat(DefaultAssets(chainId), tokenAssetsWithoutDefaultDNC20s);
};

const tokenToAsset = (token) => {
    const knownToken = (
        getKnownToken(dnerojs.networks.ChainIds.Mainnet, token.address) ||
        getKnownToken(dnerojs.networks.ChainIds.Testnet, token.address)
    );

    return {
        id: token.address,
        name: token.symbol,
        symbol: token.symbol,
        contractAddress: token.address,
        decimals: token.decimals,
        iconUrl: (knownToken ? knownToken.logoUrl : null),
        balanceKey: token.address
    };
};

export {
    DefaultAssets,

    DneroAsset,
    DTokenAsset,
    DDropAsset,
    WDneroAsset,

    tokenToAsset,

    getAllAssets,

    ERC721,
    ERC1155,
    ERC20
};
