/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import Web3 from "web3";

import { Mockthereum, expect, delay } from "../test-setup";

describe("Wallet balance", () => {

    const mockNode = Mockthereum.getLocal();

    // Start & stop your mock node to reset state between tests
    beforeEach(() => mockNode.start());
    afterEach(() => mockNode.stop());

    it("should return 0 by default", async () => {
        const web3 = new Web3(mockNode.url);
        const walletBalance = await web3.eth.getBalance('0x0000000000000000000000000000000000000000');

        expect(walletBalance).to.equal("0");
    });

    it("can be mocked to return a specific value for all wallets", async () => {
        await mockNode.forBalance().thenReturn(1000);

        const web3 = new Web3(mockNode.url);
        const walletBalance = await web3.eth.getBalance('0x0000000000000000000000000000000000000000');

        expect(walletBalance).to.equal("1000");
    });

    it("can be mocked to return a specific value per wallet", async () => {
        await mockNode.forBalance('0x0000000000000000000000000000000000000001').thenReturn(1);
        await mockNode.forBalance('0x0000000000000000000000000000000000000002').thenReturn(2);
        await mockNode.forBalance('0x0000000000000000000000000000000000000003').thenReturn(3);

        const web3 = new Web3(mockNode.url);
        const [w3, w2, w1] = await Promise.all([
            // Reverse order, just to ensure 100% we are mapping results correctly:
            web3.eth.getBalance('0x0000000000000000000000000000000000000003'),
            web3.eth.getBalance('0x0000000000000000000000000000000000000002'),
            web3.eth.getBalance('0x0000000000000000000000000000000000000001')
        ]);

        expect(w1).to.equal('1');
        expect(w2).to.equal('2');
        expect(w3).to.equal('3');
    });

    it("can be mocked to return an RPC error", async () => {
        await mockNode.forBalance().thenError("Mock error");

        const web3 = new Web3(mockNode.url);
        const result = await web3.eth.getBalance('0x0000000000000000000000000000000000000000').catch(e => e);

        expect(result).to.be.instanceOf(Error);
        expect(result.message).to.equal(
            "Returned error: Mock error"
        );
    });

    it("can be mocked to close the connection", async () => {
        await mockNode.forBalance().thenCloseConnection();

        const web3 = new Web3(mockNode.url);
        const result = await web3.eth.getBalance('0x0000000000000000000000000000000000000000').catch(e => e);

        expect(result).to.be.instanceOf(Error);
        expect(result.message).to.equal(
            'Invalid JSON RPC response: ""'
        );
    });

    it("can be mocked to timeout", async () => {
        await mockNode.forBalance().thenTimeout();

        const web3 = new Web3(mockNode.url);
        const result = await Promise.race([
            web3.eth.getBalance('0x0000000000000000000000000000000000000000').catch(e => e),
            delay(500).then(() => 'timeout')
        ]);

        expect(result).to.equal('timeout');
    });

});
