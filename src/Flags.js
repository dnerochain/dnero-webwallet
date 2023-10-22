import _ from 'lodash';
import Dnero from './services/Dnero';
import Networks, {canViewSmartContracts} from './constants/Networks';
import DneroJS from "./libs/dnerojs.esm";
import {getBlockchainConfig} from "./constants/Blockchain";

export function isStakingAvailable(){
    const network = Dnero.getChainID();

    return !network.startsWith('tsub');
}

export function canStakeFromHardwareWallet(){
    return true;
}

export function areSmartContractsAvailable(){
    const network = Dnero.getChainID();

    return canViewSmartContracts(network);
}

export function areCrossChainTransactionsAvailable(){
    const network = Dnero.getChainID();
    let config = getBlockchainConfig(network);

    return (network.startsWith('tsub') || !_.isNil(config));
}

export function getMinStakeAmount(purpose){
    if(purpose === DneroJS.StakePurposes.StakeForValidator){
        return 2000000.0;
    }
    else if(purpose === DneroJS.StakePurposes.StakeForSentry){
        return 2000.0;
    }
    else if(purpose === DneroJS.StakePurposes.StakeForEliteEdge){
        return 20000.0;
    }

    //Unknown
    return 0.0;
}

export function getMaxStakeAmount(purpose){
    if(purpose === DneroJS.StakePurposes.StakeForEliteEdge){
        return 500000.0;
    }

    //No max
    return 100000000000.0;
}

export function getMaxDelegatedStakeAmount(purpose){
    if(purpose === DneroJS.StakePurposes.StakeForSentry){
        return 10000.0;
    }

    //Unknown
    return 0.0;
}
