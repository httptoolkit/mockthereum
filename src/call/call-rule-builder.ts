/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { encodeAbi, encodeFunctionSignature, parseFunctionSignature } from '../abi';
import { RpcCallMatcher, RpcErrorResponseHandler, RpcResponseHandler } from '../jsonrpc';

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

    private paramTypes: string[] | undefined;
    private returnTypes: string[] | undefined;

    forFunction(signature: string) {
        const func = parseFunctionSignature(signature);
        this.paramTypes = func.inputs.map(i => i.type);
        this.returnTypes = signature.includes(" returns ")
            ? func.outputs?.map(i => i.type)
            : undefined; // When returns is missing, outputs is [], so we have to force undefine it

        const encodedSignature = encodeFunctionSignature(func);

        this.matchers.push(new Mockttp.matchers.CallbackMatcher(async (req) => {
            const jsonBody: any = await req.body.getJson();
            return (jsonBody.params[0].data as string).startsWith(encodedSignature);
        }));
        return this;
    }

    withParams(params: Array<unknown>): this;
    withParams(types: Array<string>, params: Array<unknown>): this;
    withParams(...args: [Array<unknown>] | [Array<string>, Array<unknown>]) {
        const [types, params] = (args.length === 1)
            ? [this.paramTypes, args[0]]
            : args;

        if (!types) {
            throw new Error(
                "If no function signature was provided with forFunction, withParams must be called " +
                "with a paramTypes array as the first argument"
            );
        }

        this.matchers.push(new Mockttp.matchers.CallbackMatcher(async (req) => {
            const jsonBody: any = await req.body.getJson();
            return (jsonBody.params[0].data as string).slice(10) == encodeAbi(types, params).slice(2);
        }));
        return this;
    }

    thenReturn(outputType: string, value: unknown): Promise<Mockttp.MockedEndpoint>;
    thenReturn(values: Array<unknown>): Promise<Mockttp.MockedEndpoint>;
    thenReturn(outputTypes: Array<string>, values: Array<unknown>): Promise<Mockttp.MockedEndpoint>;
    thenReturn(...args:
        | [string, unknown]
        | [unknown[]]
        | [Array<string>, Array<unknown>]
    ): Promise<Mockttp.MockedEndpoint> {
        const [types, values] = (args.length === 1)
                ? [this.returnTypes, args[0]]
            : !Array.isArray(args[0])
                ? [[args[0]], [args[1]]]
            : args as| [Array<string>, Array<unknown>];

        if (!types) {
            throw new Error(
                "forCall()'s thenReturn() must be called with a outputTypes array as the first argument unless " +
                "forFunction is called first with a return signature"
            );
        }

        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new RpcResponseHandler(encodeAbi(types, values))
        }).then(r => r[0]);
    }

    thenRevert(errorMessage: string) {
        return this.addRuleCallback({
            matchers: this.matchers,
            handler: new RpcErrorResponseHandler(
                `VM Exception while processing transaction: revert ${errorMessage}`, {
                    name: 'CallError',
                    data: `0x08c379a0${ // String type prefix
                        encodeAbi(['string'], [errorMessage]).slice(2)
                    }`
                }
            )
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