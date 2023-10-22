import './CrossChainTransferPage.css';
import * as dnerojs from "@dnerolabs/dnero-js";
import _ from 'lodash';
import React from "react";
import './SettingsPage.css';
import PageHeader from "../components/PageHeader";
import {getAllAssets} from "../constants/assets";
import {connect} from "react-redux";
import CrossChainTransferTxForm from "../components/transactions/CrossChainTransferTxForm";
import {getCrossTransferFee, getSubchains} from "../constants/Blockchain";
import GradientButton from "../components/buttons/GradientButton";
import {cfg, setBlockchainCfg} from "../services/blockchain/configs";
import {formatNativeTokenAmountToLargestUnit} from "../utils/Utils";
import Alerts from "../services/Alerts";
import {getNetworkForChainId} from '@dnerolabs/dnero-js/src/networks';
import Router from "../services/Router";

const {transferDToken} = require("../services/blockchain/dtokenUtils");
const {transferDNC20} = require("../services/blockchain/transferDNC20");


class CrossChainTransferPage extends React.Component {
    constructor() {
        super();

        this.formRef = React.createRef();
    }

    onSubmit = async (formData) => {
        const {chainId, network, selectedAddress, chains} = this.props;
        let {mainchainChainId} = network;
        let {targetChainId, to, assetId, amount} = formData;

        to = selectedAddress;
        const subchain = _.find(chains, ({subchainIDStr, subchainID}) => {
            return ((subchainIDStr === chainId) || (subchainID === parseInt(targetChainId)))
        });
        setBlockchainCfg((mainchainChainId || chainId), subchain);

        if(assetId === 'dtoken'){
            // DTOKEN transfer
            if(mainchainChainId){
                // Grab the integer chain ID
                mainchainChainId = getNetworkForChainId(mainchainChainId)?.chainIdNum;
                // Subchain -> mainchain
                await transferDToken(selectedAddress, parseInt(mainchainChainId), to, dnerojs.utils.toWei(amount));
            }
            else{
                // Mainchain -> subchain
                await transferDToken(selectedAddress, parseInt(targetChainId), to, dnerojs.utils.toWei(amount));
            }
        }
        else{
            // DNC20 transfer
            if(mainchainChainId){
                // Grab the integer chain ID
                mainchainChainId = getNetworkForChainId(mainchainChainId)?.chainIdNum;
                // Subchain -> mainchain
                await transferDNC20(selectedAddress, assetId, parseInt(mainchainChainId), selectedAddress, dnerojs.utils.toWei(amount));
            }
            else{
                // Mainchain -> subchain
                await transferDNC20(selectedAddress, assetId, parseInt(targetChainId), selectedAddress, dnerojs.utils.toWei(amount));
            }
        }

        Router.push('/wallet');
    };

    onNextClick = () => {
        this.formRef.current.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}));
    };

    render() {
        const {selectedIdentity, selectedAddress, selectedAccount, assets, chainId, collectible, chains, crossTransferFeeInDToken} = this.props;

        return (
            <div className="CrossChainTransferPage">
                <div className="SettingsPage__detail-view">
                    <PageHeader title="Cross Chain Transfer"
                                sticky={true}
                    />

                    <div style={{marginTop: 12, marginBottom: 12}}>
                        <CrossChainTransferTxForm formRef={this.formRef}
                                                  selectedAccount={selectedAccount}
                                                  assets={assets}
                                                  chains={chains}
                                                  chainId={chainId}
                                                  crossTransferFeeInDToken={crossTransferFeeInDToken}
                                                  onSubmit={this.onSubmit}/>
                    </div>

                    <div className="CrossChainTransferPage__fees">
                        <span>Cross Chain Transfer Fee: </span>
                        <span>{`${crossTransferFeeInDToken} DTOKEN + Gas Fees`}</span>
                    </div>

                    <div className={'CreateTransactionModal__footer'}
                         style={{paddingBottom: 20}}
                    >
                        <GradientButton onClick={this.onNextClick}
                                        title={'Transfer'}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const {dneroWallet} = state;
    const selectedAddress = dneroWallet.selectedAddress;
    const identities = dneroWallet.identities;
    const accounts = dneroWallet.accounts;
    const tokens = dneroWallet.tokens;
    const chainId = dneroWallet.network?.chainId;
    const mainchainChainId = dneroWallet.network?.mainchainChainId;

    return {
        chainId: chainId,
        network: dneroWallet.network,

        selectedAddress: selectedAddress,
        selectedIdentity: identities[selectedAddress],
        selectedAccount: accounts[selectedAddress],

        tokens: tokens,
        assets: _.filter(getAllAssets(chainId, tokens), ({id}) => {
            return (id !== 'dnero');
        }),

        chains: getSubchains((mainchainChainId || chainId)),

        crossTransferFeeInDToken: getCrossTransferFee((mainchainChainId || chainId), chainId)
    }
};

export default connect(mapStateToProps)(CrossChainTransferPage);