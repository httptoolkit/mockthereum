/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { decodeAbi } from './abi';

export class MockedContract {

    constructor(
        private endpoint: Mockttp.MockedEndpoint,
        private paramTypes?: string[] | undefined
    ) {}

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