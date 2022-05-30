/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';

export class RpcCallMatcher extends Mockttp.matchers.JsonBodyFlexibleMatcher {

    constructor(
        method: string,
        params: string[] = []
    ) {
        super({
            jsonrpc: "2.0",
            method,
            params
        });
    }

}

export class RpcResponseHandler extends Mockttp.requestHandlerDefinitions.CallbackHandlerDefinition {

    constructor(
        result: string
    ) {
        super(async (req) => ({
            json: {
                jsonrpc: "2.0",
                id: (await req.body.getJson() as { id: number }).id,
                result
            }
        }));
    }

}