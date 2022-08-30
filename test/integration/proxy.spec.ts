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

        it("should allow observing forwarded requests", async () => {
            const web3 = new Web3(mockNode.url);

            await web3.eth.getBalance('0x1230000000000000000000000000000000000000');

            const seenBalanceCalls = await mockNode.getSeenMethodCalls('eth_getBalance');
            expect(seenBalanceCalls).to.have.lengthOf(1);
            expect(seenBalanceCalls[0].params).to.deep.equal([
                '0x1230000000000000000000000000000000000000',
                'latest'
            ]);
        });

    });
});