/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import Web3 from "web3";

import { Mockthereum, expect } from "../test-setup";

describe("Chain state queries", () => {

    const mockNode = Mockthereum.getLocal();

    beforeEach(() => mockNode.start());
    afterEach(() => mockNode.stop());

    it("should return block number 1 by default", async () => {
        const web3 = new Web3(mockNode.url);
        const result = await web3.eth.getBlockNumber();

        expect(result).to.equal(1);
    });

    it("should return gas price 1000 wei by default", async () => {
        const web3 = new Web3(mockNode.url);
        const result = await web3.eth.getGasPrice();

        expect(result).to.equal('1000');
    });

    it("can be mocked to return a specific block number", async () => {
        await mockNode.forBlockNumber().thenReturn(1000);

        const web3 = new Web3(mockNode.url);
        const walletBalance = await web3.eth.getBlockNumber();

        expect(walletBalance).to.equal(1000);
    });

    it("can be mocked to return a specific gas price", async () => {
        await mockNode.forGasPrice().thenReturn(1234);

        const web3 = new Web3(mockNode.url);
        const walletBalance = await web3.eth.getGasPrice();

        expect(walletBalance).to.equal('1234');
    });

});
