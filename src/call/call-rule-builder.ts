/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { encodeAbi, encodeFunctionSignature } from '../abi';
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

    forFunction(signature: string) {
        this.matchers.push(new Mockttp.matchers.CallbackMatcher(async (req) => {
            const jsonBody: any = await req.body.getJson();
            return (jsonBody.params[0].data as string).startsWith(encodeFunctionSignature(signature));
        }));
        return this;
    }

    withParams(types: Array<string>, params: Array<any>) {
        this.matchers.push(new Mockttp.matchers.CallbackMatcher(async (req) => {
            const jsonBody: any = await req.body.getJson();
            return (jsonBody.params[0].data as string).slice(10) == encodeAbi(types, params).slice(2);
        }));
        return this;
    }

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