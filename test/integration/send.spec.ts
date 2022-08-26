/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import Web3 from "web3";

import { Mockthereum, expect, delay } from "../test-setup";

const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
const FROM_ADDRESS = '0x1111111111111111111111111111111111111111';
const OTHER_ADDRESS = '0x9999999999999999999999999999999999999999';

describe("Contract send calls", () => {

    const mockNode = Mockthereum.getLocal();

    // Start & stop your mock node to reset state between tests
    beforeEach(() => mockNode.start());
    afterEach(() => mockNode.stop());

    describe("with eth_sendTransaction", () => {

        it("should return an error for unmatched contract sends by default", async () => {
            const web3 = new Web3(mockNode.url);
            const result = await web3.eth.sendTransaction({
                from: FROM_ADDRESS,
                to: CONTRACT_ADDRESS,
                value: 1
            }).catch(e => e);

            expect(result).to.be.instanceOf(Error);
            expect(result.message).to.equal(
                "Returned error: No Mockthereum rules found matching Ethereum transaction"
            );
        });

        it("can be matched by 'to' address for direct send()", async () => {
            await mockNode.forSendTransactionTo(CONTRACT_ADDRESS)
                .thenSucceed();

            const web3 = new Web3(mockNode.url);
            const matchingResult = await web3.eth.sendTransaction({
                from: FROM_ADDRESS,
                to: CONTRACT_ADDRESS,
                value: 1
            }).catch(e => e);
            const nonMatchingResult = await web3.eth.sendTransaction({
                from: FROM_ADDRESS,
                to: OTHER_ADDRESS,
                value: 1
            }).catch(e => e);

            expect(matchingResult).to.deep.include({
                status: true,
                blockNumber: 256,
                blockHash: '0x1',
                from: FROM_ADDRESS,
                to: CONTRACT_ADDRESS,
                cumulativeGasUsed: 1,
                gasUsed: 1,
                effectiveGasPrice: 0,
                contractAddress: null,
                logs: [],
                logsBloom: '0x0',
                type: '0x0',
                transactionIndex: undefined
            });
            expect(nonMatchingResult).to.be.instanceOf(Error);
        });

        it("can reject contract sends with a custom error on submission", async () => {
            await mockNode.forSendTransactionTo(CONTRACT_ADDRESS)
                .thenFailImmediately("Mock error");

            const web3 = new Web3(mockNode.url);
            const errorResult = await web3.eth.sendTransaction({
                to: CONTRACT_ADDRESS,
                from: FROM_ADDRESS
            }).catch(e => e);

            expect(errorResult).to.be.instanceOf(Error);
            expect(errorResult.message).to.equal(
                "Returned error: Mock error"
            );
        });

        it("can reject contract sends with a custom revert error in processing", async () => {
            await mockNode.forSendTransactionTo(CONTRACT_ADDRESS)
                .thenRevert();

            const web3 = new Web3(mockNode.url);
            const errorResult = await web3.eth.sendTransaction({
                to: CONTRACT_ADDRESS,
                from: FROM_ADDRESS
            }).catch(e => e);

            expect(errorResult).to.be.instanceOf(Error);
            expect(errorResult.message).to.match(
                /^Transaction has been reverted by the EVM:/
            );
        });

        it("can be mocked to close the connection", async () => {
            await mockNode.forSendTransaction().thenCloseConnection();

            const web3 = new Web3(mockNode.url);
            const result = await web3.eth.sendTransaction({
                to: CONTRACT_ADDRESS,
                from: FROM_ADDRESS
            }).catch(e => e);

            expect(result).to.be.instanceOf(Error);
            expect(result.message).to.include('CONNECTION ERROR');
        });

        it("can be mocked to timeout", async () => {
            await mockNode.forSendTransaction().thenTimeout();

            const web3 = new Web3(mockNode.url);
            const result = await Promise.race([
                web3.eth.sendTransaction({
                    to: CONTRACT_ADDRESS,
                    from: FROM_ADDRESS
                }).catch(e => e),
                delay(500).then(() => 'timeout')
            ]);

            expect(result).to.equal('timeout');
        });
    });
});