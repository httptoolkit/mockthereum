/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import Web3 from "web3";
import * as ganache from 'ganache';

import { expect, nodeOnly, Mockthereum } from '../test-setup';

nodeOnly(() => {
    describe("Proxying traffic to a real Ethereum node", () => {

        const NODE_PORT = 8555;
        let realNode: ganache.Server;

        before(async () => {
            realNode = ganache.server();
            return new Promise((resolve, reject) => {
                realNode.listen(NODE_PORT);
                realNode.on('open', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        after(() => realNode.close());

        const mockNode = Mockthereum.getLocal({
            unmatchedRequests: { proxyTo: 'http://localhost:8555' }
        });

        beforeEach(() => mockNode.start());
        afterEach(() => mockNode.stop());

        it("should forward unmatched requests", async () => {
            const web3 = new Web3(mockNode.url);

            const nodeInfo = await web3.eth.getNodeInfo();

            expect(nodeInfo).to.include("Ganache");
        });

    });
});