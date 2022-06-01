/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { encodeAbi } from '../abi';
import { RpcCallMatcher, RpcResponseHandler } from '../jsonrpc';

export class CallRuleBuilder {

    constructor(
        targetAddress:
            | undefined // All contracts
            | `0x${string}`, // A specific to: address
        private addRuleCallback: (...rules: Mockttp.RequestRuleData[]) => Promise<Mockttp.MockedEndpoint[]>
    ) {
        if (targetAddress) {
            this.matchers.push(new RpcCallMatcher('eth_call', [{ to: targetAddress }]));
        } else {
            this.matchers.push(new RpcCallMatcher('eth_call'));
        }
    }

    private matchers: Mockttp.matchers.RequestMatcher[] = [];

    thenReturn(types: string | string[], value: any) {
        if (!Array.isArray(types)) {
            types = [types];
            value = [value];
        }

        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new RpcResponseHandler(encodeAbi(types, value))
        });
    }

}