/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { CallRuleBuilder } from './call/call-rule-builder';
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

    forBlockNumber() {
        return new BlockNumberRuleBuilder(this.mockttpServer.addRequestRules);
    }

    forGasPrice() {
        return new GasPriceRuleBuilder(this.mockttpServer.addRequestRules);
    }

}