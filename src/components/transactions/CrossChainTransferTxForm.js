import React from 'react';
import {useForm} from 'react-hook-form';
import {ethers} from 'ethers';
import _ from 'lodash';
import FormField from '../../components/FormField';
import {
    isValidAmount, getAssetBalance, toNativeTokenLargestUnit, toDNC20TokenLargestUnit, truncate
} from '../../utils/Utils';
import {Urls} from '../../constants';
import Warning from '../../components/Warning';
import * as dnerojs from "@dnerolabs/dnero-js";
import BigNumber from "bignumber.js";
import {DTokenAsset, DneroAsset} from "../../constants/assets";
import FlatButton from "../buttons/FlatButton";

export default function CrossChainTransferTxForm(props) {
    const {onSubmit, defaultValues, selectedAccount, formRef, assets, chains, chainId, crossTransferFeeInDToken} = props;
    const {register, handleSubmit, errors, watch, setValue} = useForm({
        mode: 'onChange',
        defaultValues: defaultValues || {
            targetChainId: '',
            to: selectedAccount.address,
            amount: '',
            assetId: ''
        }
    });
    const isSelectedNetworkASubchain = chainId.startsWith('tsub');
    const targetChainId = watch('targetChainId');
    const assetId = watch('assetId');
    const populateMaxAmount = () => {
        if (_.isEmpty(assetId)) {
            return;
        }

        let amount = '';
        const asset = _.find(assets, function (a) {
            return a.id === assetId;
        });

        if (assetId === DTokenAsset.id) {
            // Estimated DTOKEN
            let maxDtokenBN = (new BigNumber(selectedAccount.balances['dtokenwei'])).minus(new BigNumber(dnerojs.utils.toWei(1)));
            maxDtokenBN = maxDtokenBN.minus(new BigNumber(dnerojs.utils.toWei(crossTransferFeeInDToken)));

            amount = toNativeTokenLargestUnit(maxDtokenBN.toString(10)).toString(10);
        } else if (assetId === DneroAsset.id) {
            amount = toNativeTokenLargestUnit(selectedAccount.balances['dnerowei']).toString(10);
        } else {
            const balance = selectedAccount.balances[asset.address] || '0';
            amount = toDNC20TokenLargestUnit(balance, asset.decimals).toString(10);
        }

        setValue('amount', amount);
    }
    const populateMyWallet = () => {
        setValue('to', selectedAccount.address);
    }

    return (
        <form className={'TxForm TxForm--Send'}
              onSubmit={handleSubmit(onSubmit)}
              ref={formRef}
        >
            <FormField title={'Destination Chain'}
                       error={errors.targetChainId && 'Destination chain is required'}
            >
                {
                    isSelectedNetworkASubchain &&
                    <select
                        className={'RoundedInput'}
                        name={'targetChainId'}
                        ref={register({required: !isSelectedNetworkASubchain})}
                    >
                        <option key={'__placeholder__'}
                                value={''}
                                disabled>
                            Main Chain
                        </option>
                    </select>
                }
                {
                    !isSelectedNetworkASubchain &&
                    <select
                        className={'RoundedInput'}
                        name={'targetChainId'}
                        ref={register({required: true})}
                    >
                        <option key={'__placeholder__'}
                                value={''}
                                disabled>
                            Select chain
                        </option>
                        {
                            chains.map((chain) => (
                                <option key={chain.subchainID}
                                        value={chain.subchainID}>
                                    {`${chain.name} (${chain.subchainID})`}
                                </option>
                            ))
                        }
                    </select>
                }
            </FormField>

            <FormField title={'To'}>
                <div className={'RoundedInputWrapper'}>
                    <input name="to"
                           readOnly={true}
                           disabled={true}
                           className={'RoundedInput'}
                           placeholder={'Enter address'}
                           value={`${truncate(selectedAccount.address)} (My Wallet)`}/>
                </div>
            </FormField>
            {/*<FormField title={'To'}*/}
            {/*           error={(errors.to && 'A valid address is required')}*/}
            {/*>*/}
            {/*    <div className={'RoundedInputWrapper'}>*/}

            {/*        <input name="to"*/}
            {/*               readOnly={true}*/}
            {/*               disabled={true}*/}
            {/*               className={'RoundedInput'}*/}
            {/*               placeholder={'Enter address'}*/}
            {/*               value={'LOL'}*/}
            {/*               ref={register({*/}
            {/*                   required: true,*/}
            {/*                   value: "LOL",*/}
            {/*                   validate: (s) => ethers.utils.isAddress(s)*/}
            {/*               })}/>*/}
            {/*        /!*<FlatButton title={'My Wallet'}*!/*/}
            {/*        /!*            size={'small'}*!/*/}
            {/*        /!*            className={'RoundedInputButton'}*!/*/}
            {/*        /!*            onClick={populateMyWallet}/>*!/*/}
            {/*    </div>*/}
            {/*</FormField>*/}

            <FormField title={'Asset'}
                       error={errors.assetId && 'Asset is required'}
            >
                <select
                    className={'RoundedInput'}
                    name={'assetId'}
                    ref={register({required: true})}
                >
                    <option key={'__placeholder__'}
                            value={''}
                            disabled>
                        Select asset
                    </option>
                    {
                        assets.map((asset) => (
                            <option key={asset.symbol}
                                    value={asset.id}>
                                {`${asset.symbol} (${getAssetBalance(selectedAccount, asset)})`}
                            </option>
                        ))
                    }
                </select>
            </FormField>

            <FormField title={'Amount'}
                       error={errors.amount && errors.amount.message}
            >
                <div className={'RoundedInputWrapper'}>
                    <input name="amount"
                           className={'RoundedInput'}
                           placeholder={'Enter amount'}
                           type={'number'}
                           ref={register({
                               required: {
                                   value: true,
                                   message: 'Amount is required'
                               },
                               validate: {
                                   sufficientBalance: (s) => {
                                       const asset = _.find(assets, function (a) {
                                           return a.id === assetId;
                                       });
                                       const isValid = isValidAmount(selectedAccount, asset, s);

                                       return isValid ? true : 'Insufficient balance';
                                   },
                                   moreThanZero: (s) => {
                                       const f = parseFloat(s);

                                       return (f > 0) ? true : 'Invalid amount';
                                   }
                               }
                           })}/>
                    {
                        !_.isEmpty(targetChainId) &&
                        <FlatButton title={'Max'}
                                    size={'small'}
                                    className={'RoundedInputButton'}
                                    onClick={populateMaxAmount}/>
                    }

                </div>
            </FormField>

        </form>
    );
}
