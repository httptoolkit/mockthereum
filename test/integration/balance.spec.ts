/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import Web3 from "web3";

import { Mockthereum, expect } from "../test-setup";

describe("Wallet balance", () => {

    const mockNode = Mockthereum.getLocal();

    // Start & stop your mock node to reset state between tests
    beforeEach(() => mockNode.start());
    afterEach(() => mockNode.stop());

    it("should be mocked to return a specific value3", async () => {
        await mockNode.forBalance('0x0000000000000000000000000000000000000000').thenReturn(1000);

        const web3 = new Web3(mockNode.url);
        const walletBalance = await web3.eth.getBalance('0x0000000000000000000000000000000000000000');

        expect(walletBalance).to.equal("1000");
    });
});
