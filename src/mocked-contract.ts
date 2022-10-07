/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { decodeAbi } from './abi';

/**
 * A mocked contract. This is returned by a rule builder when the rule is created, and can
 * be used to query the requests that have been seen by the mock rule.
 */
export class MockedContract {

    constructor(
        private endpoint: Mockttp.MockedEndpoint,
        private paramTypes?: string[] | undefined
    ) {}

    /**
     * Returns a promise that resolves to an array of requests seen by the mock rule.
     *
     * For each request, this includes:
     * - `to`: the contract address
     * - `from`: the sender address, if used, or undefined for contract calls
     * - `value`: the value sent, if any, or undefined for contract calls
     * - `params`: the decoded params, if a function signature or param types were provided
     *   using `forFunction` or `withParams` methods when creating the rule.
     * - `rawRequest` - the raw HTTP request sent to the node
     */
    async getRequests() {
        const requests = await this.endpoint.getSeenRequests();

        return Promise.all(requests.map(async (req) => {
            const jsonBody: any = (await req.body.getJson());
            const {
                data,
                value,
                to,
                from
            } = jsonBody?.params[0] ?? {};
            const encodedCallParams = data ? `0x${data.slice(10)}` : undefined;

            return {
                rawRequest: req,
                to,
                from,
                value,
                params: (this.paramTypes && encodedCallParams)
                    ? decodeAbi(this.paramTypes, encodedCallParams)
                    : undefined
            };
        }));
    }

}