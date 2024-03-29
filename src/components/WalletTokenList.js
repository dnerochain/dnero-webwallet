import _ from 'lodash';
import React from "react";
import './WalletTokenList.css';
import WalletTokenListItem from './WalletTokenListItem'
import Dnero from '../services/Dnero';
import moment from "moment";
import {formatNativeTokenAmountToLargestUnit, formatDNC20TokenAmountToLargestUnit} from "../utils/Utils";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import {store} from "../state";
import {WDneroAsset} from "../constants/assets";
import config from "../Config";

class WalletTokenList extends React.Component {
    onAddTokenClick = () => {
        store.dispatch(showModal({
            type: ModalTypes.TRACK_TOKEN
        }))
    }

    onWrapDNEROClick = () => {
        store.dispatch(showModal({
            type: ModalTypes.CREATE_TRANSACTION,
            props: {
                transactionType: 'wrap-dnero'
            }
        }));
    }

    onUnwrapWDNEROClick = () => {
        store.dispatch(showModal({
            type: ModalTypes.CREATE_TRANSACTION,
            props: {
                transactionType: 'unwrap-dnero'
            }
        }));
    }

    render() {
        const {selectedAccount, tokens, assets, balancesRefreshedAt, chainId, style} = this.props;
        const wDneroAsset = WDneroAsset(chainId);

        return (
            <div className="WalletTokenList"
                 style={style}>
                {
                    selectedAccount && selectedAccount.balances &&
                    assets.map((asset) => {
                        const decimals = asset.decimals;
                        const balanceStr = _.get(selectedAccount.balances, [asset.balanceKey], '0');

                        return (
                            <WalletTokenListItem key={asset.id}
                                                 token={asset}
                                                 balance={formatDNC20TokenAmountToLargestUnit(balanceStr, decimals)}
                                                 onWrap={(asset.id === 'dnero' && !_.isNil(wDneroAsset)) && this.onWrapDNEROClick}
                                                 onUnwrap={(asset.id === wDneroAsset?.id) && this.onUnwrapWDNEROClick}
                            />
                        )
                    })
                }
				
                {
                    !config.isEmbedMode &&
                    <a className='AddTokenCTA'
                       onClick={this.onAddTokenClick}
                    >
                        <img className={'AddTokenCTA__icon'}
                             src={'/img/icons/add-token.svg'}/>
                        <div className={'AddTokenCTA__name'}>Add Token</div>
                    </a>
                }


                {
                    selectedAccount && _.isEmpty(selectedAccount.balances) &&
                    <div className="WalletTokenList__refreshed-message">Loading balances...</div>
                }

                {
                    !_.isNil(balancesRefreshedAt) &&
                    <div
                        className="WalletTokenList__refreshed-message">{`Balances refreshed ${moment(balancesRefreshedAt).fromNow()}`}</div>
                }

                {
                    selectedAccount && !config.isEmbedMode &&
                    <a className="WalletTokenList__explorer-link"
                       href={Dnero.getAccountExplorerUrl(selectedAccount.address)}
                       target={'_blank'}
                       rel='noopener noreferrer'
                    >
                        View Account on Explorer
                    </a>
                }
            </div>
        );
    }
}

export default WalletTokenList;
