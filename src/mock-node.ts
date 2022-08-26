/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { CallRuleBuilder, TransactionRuleBuilder } from './contract-rule-builder';
import { RpcCallMatcher, RpcErrorResponseHandler, RpcResponseHandler } from './jsonrpc';
import { BalanceRuleBuilder, BlockNumberRuleBuilder, GasPriceRuleBuilder } from './single-value-rule-builders';

export class MockthereumNode {

    constructor(
        private mockttpServer: Mockttp.Mockttp
    ) {}

    async start() {
        await this.mockttpServer.start();
        await this.addBaseRules();
    }

    stop() {
        return this.mockttpServer.stop();
    }

    get url() {
        return this.mockttpServer.url;
    }

    private async addBaseRules() {
        await Promise.all([
            this.mockttpServer.addRequestRules({
                matchers: [new RpcCallMatcher('eth_call')],
                priority: Mockttp.RulePriority.FALLBACK,
                handler: new RpcErrorResponseHandler(
                    "No Mockthereum rules found matching Ethereum contract call"
                )
            }),
            this.mockttpServer.addRequestRules({
                matchers: [new RpcCallMatcher('eth_sendTransaction')],
                priority: Mockttp.RulePriority.FALLBACK,
                handler: new RpcErrorResponseHandler(
                    "No Mockthereum rules found matching Ethereum transaction"
                )
            }),
            this.mockttpServer.addRequestRules({
                matchers: [new RpcCallMatcher('eth_sendRawTransaction')],
                priority: Mockttp.RulePriority.FALLBACK,
                handler: new RpcErrorResponseHandler(
                    "No Mockthereum rules found matching Ethereum transaction"
                )
            }),
            this.mockttpServer.addRequestRules({
                matchers: [new RpcCallMatcher('eth_getTransactionReceipt')],
                priority: Mockttp.RulePriority.FALLBACK,
                handler: new RpcResponseHandler(null)
            }),
            this.mockttpServer.addRequestRules({
                matchers: [new RpcCallMatcher('eth_getBalance')],
                priority: Mockttp.RulePriority.FALLBACK,
                handler: new RpcResponseHandler("0x0")
            }),
            this.mockttpServer.addRequestRules({
                matchers: [new RpcCallMatcher('eth_blockNumber')],
                priority: Mockttp.RulePriority.FALLBACK,
                handler: new RpcResponseHandler("0x1")
            }),
            this.mockttpServer.addRequestRules({
                matchers: [new RpcCallMatcher('eth_getBlockByNumber')],
                priority: Mockttp.RulePriority.FALLBACK,
                handler: new RpcResponseHandler(null)
            }),
            this.mockttpServer.addRequestRules({
                matchers: [new RpcCallMatcher('eth_gasPrice')],
                priority: Mockttp.RulePriority.FALLBACK,
                handler: new RpcResponseHandler(`0x${(1000).toString(16)}`)
            })
        ]);
    }

    forBalance(address?: `0x${string}`) {
        return new BalanceRuleBuilder(address, this.mockttpServer.addRequestRules);
    }

    forCall(address?: `0x${string}`) {
        return new CallRuleBuilder(address, this.mockttpServer.addRequestRules);
    }

    forSendTransaction() {
        return new TransactionRuleBuilder(
            undefined,
            this.mockttpServer.addRequestRules,
            this.addReceipt.bind(this)
        );
    }

    forSendTransactionTo(address: `0x${string}`) {
        return new TransactionRuleBuilder(
            address,
            this.mockttpServer.addRequestRules,
            this.addReceipt.bind(this)
        );
    }

    private async addReceipt(id: string, receipt: Partial<RawTransactionReceipt>) {
        await this.mockttpServer.addRequestRules({
            matchers: [new RpcCallMatcher('eth_getTransactionReceipt', [id])],
            handler: new RpcResponseHandler({
                status: '0x1',
                transactionHash: id,
                blockNumber: '0x100',
                blockHash: '0x1',
                from: '0x0',
                to: '0x0',
                cumulativeGasUsed: '0x1',
                gasUsed: '0x1',
                effectiveGasPrice: '0x0',
                contractAddress: null,
                logs: [],
                logsBloom: '0x0',
                type: '0x0',
                ...receipt
            })
        });
    }

    forBlockNumber() {
        return new BlockNumberRuleBuilder(this.mockttpServer.addRequestRules);
    }

    forGasPrice() {
        return new GasPriceRuleBuilder(this.mockttpServer.addRequestRules);
    }

}

/**
 * The type of the raw JSON response for a transaction receipt.
 *
 * Note that unlike Web3-Core's TransactionReceipt and similar, this is the raw data, so
 * does not include processed formats (e.g. numbers, instead of hex strings) etc.
 */
export interface RawTransactionReceipt {
    status: string;
    type: string;
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    blockNumber: number;
    from: string;
    to: string;
    contractAddress?: string;
    cumulativeGasUsed: string;
    gasUsed: number;
    effectiveGasPrice: string;
    logs: never[]; // Not supported, for now
}