/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { v4 as uuid } from 'uuid';

import { encodeAbi, encodeFunctionSignature, parseFunctionSignature } from './abi';
import { RpcCallMatcher, RpcErrorProperties, RpcErrorResponseHandler, RpcResponseHandler } from './jsonrpc';
import { RawTransactionReceipt } from './mock-node';
import { MockedContract } from './mocked-contract';

class ContractRuleBuilder {

    constructor(
        private addRuleCallback: (rule: Mockttp.RequestRuleData) => Promise<Mockttp.MockedEndpoint>,
        protected matchers: Mockttp.matchers.RequestMatcher[] = []
    ) {}

    private paramTypes: string[] | undefined;
    protected returnTypes: string[] | undefined;

    protected async buildRule(
        handler: Mockttp.requestHandlerDefinitions.RequestHandlerDefinition
    ): Promise<MockedContract> {
        const mockedEndpoint = await this.addRuleCallback({ matchers: this.matchers, handler });
        return new MockedContract(mockedEndpoint, this.paramTypes);
    }

    /**
     * Only match requests for a specific function, provided here as a function signature string.
     */
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

    /**
     * Only match requests that send certain parameters. You must provide both a types
     * and a parameters array, unless you've already called `forFunction()` and
     * provided the function signature there.
     */
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

        if (types) {
            this.paramTypes = types;
        }

        this.matchers.push(new Mockttp.matchers.CallbackMatcher(async (req) => {
            const jsonBody: any = await req.body.getJson();
            return (jsonBody.params[0].data as string).slice(10) == encodeAbi(types, params).slice(2);
        }));
        return this;
    }

    /**
     * Timeout, accepting the request but never returning a response.
     *
     * This method completes the rule definition, and returns a promise that resolves to a MockedContract
     * once the rule is active. The MockedContract can be used later to query the seen requests that this
     * rule has matched.
     */
    thenTimeout() {
        return this.buildRule(new Mockttp.requestHandlerDefinitions.TimeoutHandlerDefinition());
    }

    /**
     * Close the connection immediately after receiving the matching request, without sending any response.
     *
     * This method completes the rule definition, and returns a promise that resolves to a MockedContract
     * once the rule is active. The MockedContract can be used later to query the seen requests that this
     * rule has matched.
     */
    thenCloseConnection() {
        return this.buildRule(new Mockttp.requestHandlerDefinitions.CloseConnectionHandlerDefinition());
    }

}

export class CallRuleBuilder extends ContractRuleBuilder {

    /**
     * This builder should not be constructed directly. Call `mockNode.forCall()` instead.
     */
    constructor(
        targetAddress:
            | undefined // All contracts
            | `0x${string}`, // A specific to: address
        addRuleCallback: (rule: Mockttp.RequestRuleData) => Promise<Mockttp.MockedEndpoint>
    ) {
        if (targetAddress) {
            super(addRuleCallback, [new RpcCallMatcher('eth_call', [{
                to: targetAddress
            }])]);
        } else {
            super(addRuleCallback, [new RpcCallMatcher('eth_call')]);
        }
    }

    /**
     * Return one or more values from the contract call. You must provide both a types and a values array,
     * unless you've already called `forFunction()` and provided a function signature there that
     * includes return types.
     *
     * This method completes the rule definition, and returns a promise that resolves to a MockedContract
     * once the rule is active. The MockedContract can be used later to query the seen requests that this
     * rule has matched.
     */
    thenReturn(outputType: string, value: unknown): Promise<MockedContract>;
    thenReturn(values: Array<unknown>): Promise<MockedContract>;
    thenReturn(value: unknown): Promise<MockedContract>;
    thenReturn(outputTypes: Array<string>, values: Array<unknown>): Promise<MockedContract>;
    thenReturn(...args:
        | [string, unknown]
        | [unknown[]]
        | [unknown]
        | [Array<string>, Array<unknown>]
    ): Promise<MockedContract> {
        let types: Array<string>;
        let values: Array<unknown>;

        if (args.length === 1) {
            if (!this.returnTypes) {
                throw new Error(
                    "thenReturn() must be called with an outputTypes array as the first argument, or " +
                    "forFunction() must be called first with a return signature"
                );
            }

            types = this.returnTypes;
            if (Array.isArray(args[0])) {
                values = args[0];
            } else {
                values = [args[0]];
            }
        } else if (!Array.isArray(args[0])){
            types = [args[0]];
            values = [args[1]];
        } else {
            types = args[0];
            values = args[1] as unknown[];
        }

        return this.buildRule(new RpcResponseHandler(encodeAbi(types, values)));
    }

    /**
     * Return an error, rejecting the contract call with the provided error message.
     *
     * This method completes the rule definition, and returns a promise that resolves to a MockedContract
     * once the rule is active. The MockedContract can be used later to query the seen requests that this
     * rule has matched.
     */
    thenRevert(errorMessage: string) {
        return this.buildRule(new RpcErrorResponseHandler(
            `VM Exception while processing transaction: revert ${errorMessage}`, {
                name: 'CallError',
                data: `0x08c379a0${ // String type prefix
                    encodeAbi(['string'], [errorMessage]).slice(2)
                }`
            }
        ));
    }

}

export class TransactionRuleBuilder extends ContractRuleBuilder {

    /**
     * This builder should not be constructed directly. Call `mockNode.forSendTransaction()` or
     * `mockNode.forSendTransactionTo()` instead.
     */
    constructor(
        targetAddress:
            | undefined // All contracts
            | `0x${string}`, // A specific to: address
        addRuleCallback: (rule: Mockttp.RequestRuleData) => Promise<Mockttp.MockedEndpoint>,
        addReceiptCallback: (id: string, receipt: Partial<RawTransactionReceipt>) => Promise<void>
    ) {
        if (targetAddress) {
            super(addRuleCallback, [new RpcCallMatcher('eth_sendTransaction', [{
                to: targetAddress
            }])]);
        } else {
            super(addRuleCallback, [new RpcCallMatcher('eth_sendTransaction')]);
        }

        this.addReceiptCallback = addReceiptCallback;
    }

    private addReceiptCallback: (id: string, receipt: Partial<RawTransactionReceipt>) => Promise<void>;

    /**
     * Return a successful transaction submission, with a random transaction id, and provide the
     * given successfully completed transaction receipt when the transaction status is queried later.
     *
     * The receipt can be any subset of the Ethereum receipt fields, and default values for a successful
     * transaction will be used for any missing fields.
     *
     * This method completes the rule definition, and returns a promise that resolves to a MockedContract
     * once the rule is active. The MockedContract can be used later to query the seen requests that this
     * rule has matched.
     */
    thenSucceed(receipt: Partial<RawTransactionReceipt> = {}) {
        return this.buildRule(new Mockttp.requestHandlerDefinitions.CallbackHandlerDefinition(
            async (req) => {
                // 64 char random hex id:
                const transactionId = `0x${uuid().replace(/-/g, '')}${uuid().replace(/-/g, '')}`;

                const body = await req.body.getJson() as {
                    id: number;
                    params: [{
                        from: string | undefined,
                        to: string | undefined,
                    }]
                };

                await this.addReceiptCallback(transactionId, {
                    status: '0x1',
                    from: body.params[0].from,
                    to: body.params[0].to,
                    ...receipt
                });

                return {
                    headers: { 'transfer-encoding': 'chunked', 'connection': 'keep-alive' },
                    json: {
                        jsonrpc: "2.0",
                        id: body.id,
                        result: transactionId
                    }
                };
            }
        ));
    }

    /**
     * Return a successful transaction submission, with a random transaction id, and provide the
     * given failed & revert transaction receipt when the transaction status is queried later.
     *
     * The receipt can be any subset of the Ethereum receipt fields, and default values for a failed
     * transaction will be used for any missing fields.
     *
     * This method completes the rule definition, and returns a promise that resolves to a MockedContract
     * once the rule is active. The MockedContract can be used later to query the seen requests that this
     * rule has matched.
     */
    thenRevert(receipt: Partial<RawTransactionReceipt> = {}) {
        return this.buildRule(new Mockttp.requestHandlerDefinitions.CallbackHandlerDefinition(
            async (req) => {
                // 64 char random hex id:
                const transactionId = `0x${uuid().replace(/-/g, '')}${uuid().replace(/-/g, '')}`;

                const body = await req.body.getJson() as {
                    id: number;
                    params: [{
                        from: string | undefined,
                        to: string | undefined,
                    }]
                };

                await this.addReceiptCallback(transactionId, {
                    status: '0x',
                    type: '0x2',
                    from: body.params[0].from,
                    to: body.params[0].to,
                    ...receipt
                });

                return {
                    headers: { 'transfer-encoding': 'chunked', 'connection': 'keep-alive' },
                    json: {
                        jsonrpc: "2.0",
                        id: body.id,
                        result: transactionId
                    }
                };
            }
        ));
    }

    /**
     * Reject the transaction submission immediately with the given error message and properties.
     *
     * This method completes the rule definition, and returns a promise that resolves to a MockedContract
     * once the rule is active. The MockedContract can be used later to query the seen requests that this
     * rule has matched.
     */
    thenFailImmediately(errorMessage: string, errorProperties: RpcErrorProperties = {}) {
        return this.buildRule(new RpcErrorResponseHandler(errorMessage, errorProperties));
    }

}