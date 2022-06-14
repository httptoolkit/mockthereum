/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { RpcCallMatcher, RpcErrorResponseHandler, RpcResponseHandler } from './jsonrpc';

class SingleValueRuleBuilder {

    constructor(
        private addRuleCallback: (...rules: Mockttp.RequestRuleData[]) => Promise<Mockttp.MockedEndpoint[]>,
        private matchers: Mockttp.matchers.RequestMatcher[] = []
    ) {}

    thenReturn(value: number) {
        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new RpcResponseHandler(`0x${value.toString(16)}`)
        });
    }

    thenError(message: string) {
        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new RpcErrorResponseHandler(message)
        });
    }

    thenTimeout() {
        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new Mockttp.requestHandlerDefinitions.TimeoutHandlerDefinition()
        });
    }

    thenCloseConnection() {
        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new Mockttp.requestHandlerDefinitions.CloseConnectionHandlerDefinition()
        });
    }

}

export class BalanceRuleBuilder extends SingleValueRuleBuilder {

    constructor(
        address: string | undefined,
        addRuleCallback: (...rules: Mockttp.RequestRuleData[]) => Promise<Mockttp.MockedEndpoint[]>
    ) {
        if (address) {
            super(addRuleCallback, [new RpcCallMatcher('eth_getBalance', [address])]);
        } else {
            super(addRuleCallback, [new RpcCallMatcher('eth_getBalance')]);
        }
    }

}

export class BlockNumberRuleBuilder extends SingleValueRuleBuilder {

    constructor(
        addRuleCallback: (...rules: Mockttp.RequestRuleData[]) => Promise<Mockttp.MockedEndpoint[]>
    ) {
        super(addRuleCallback, [new RpcCallMatcher('eth_blockNumber')]);
    }

}

export class GasPriceRuleBuilder extends SingleValueRuleBuilder {

    constructor(
        addRuleCallback: (...rules: Mockttp.RequestRuleData[]) => Promise<Mockttp.MockedEndpoint[]>
    ) {
        super(addRuleCallback, [new RpcCallMatcher('eth_gasPrice')]);
    }

}