/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { RpcCallMatcher, RpcErrorResponseHandler, RpcResponseHandler } from './jsonrpc';

class SingleValueRuleBuilder {

    constructor(
        private addRuleCallback: (rule: Mockttp.RequestRuleData) => Promise<Mockttp.MockedEndpoint>,
        private matchers: Mockttp.matchers.RequestMatcher[] = []
    ) {}

    /**
     * Successfully return a given value.
     */
    thenReturn(value: number) {
        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new RpcResponseHandler(`0x${value.toString(16)}`)
        });
    }

    /**
     * Fail and return an error message.
     */
    thenError(message: string) {
        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new RpcErrorResponseHandler(message)
        });
    }

    /**
     * Timeout, accepting the request but never returning a response.
     *
     * This method completes the rule definition, and returns a promise that resolves once the rule is active.
     */
    thenTimeout() {
        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new Mockttp.requestHandlerDefinitions.TimeoutHandlerDefinition()
        });
    }

    /**
     * Close the connection immediately after receiving the matching request, without sending any response.
     *
     * This method completes the rule definition, and returns a promise that resolves once the rule is active.
     */
    thenCloseConnection() {
        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new Mockttp.requestHandlerDefinitions.CloseConnectionHandlerDefinition()
        });
    }

}

/**
 * A rule builder to allow defining rules that mock an Ethereum wallet balance.
 */
export class BalanceRuleBuilder extends SingleValueRuleBuilder {

    /**
     * This builder should not be constructed directly. Call `mockNode.forBalance()` instead.
     */
    constructor(
        address: string | undefined,
        addRuleCallback: (rule: Mockttp.RequestRuleData) => Promise<Mockttp.MockedEndpoint>
    ) {
        if (address) {
            super(addRuleCallback, [new RpcCallMatcher('eth_getBalance', [address])]);
        } else {
            super(addRuleCallback, [new RpcCallMatcher('eth_getBalance')]);
        }
    }

}

/**
 * A rule builder to allow defining rules that mock the current block number.
 */
export class BlockNumberRuleBuilder extends SingleValueRuleBuilder {

    /**
     * This builder should not be constructed directly. Call `mockNode.forBlockNumber()` instead.
     */
    constructor(
        addRuleCallback: (rule: Mockttp.RequestRuleData) => Promise<Mockttp.MockedEndpoint>
    ) {
        super(addRuleCallback, [new RpcCallMatcher('eth_blockNumber')]);
    }

}

/**
 * A rule builder to allow defining rules that mock the current gas price.
 */
export class GasPriceRuleBuilder extends SingleValueRuleBuilder {

    /**
     * This builder should not be constructed directly. Call `mockNode.forGasPrice()` instead.
     */
    constructor(
        addRuleCallback: (rule: Mockttp.RequestRuleData) => Promise<Mockttp.MockedEndpoint>
    ) {
        super(addRuleCallback, [new RpcCallMatcher('eth_gasPrice')]);
    }

}