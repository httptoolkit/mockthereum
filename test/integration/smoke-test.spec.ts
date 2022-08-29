/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AbiItem } from 'web3-utils'
import Web3 from "web3";

import { Mockthereum, expect } from "../test-setup";

// Parameters for some real Web3 contract:
const CONTRACT_ADDRESS = "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5";
const JSON_CONTRACT_ABI = [
    {
        type: "function",
        name: "getText",
        stateMutability: "view",
        inputs: [
            { name: "key", type: "string" }
        ],
        outputs: [{ internalType: "string", name: "", type: "string" }]
    }
] as AbiItem[];

describe("Smoke test", () => {

    const mockNode = Mockthereum.getLocal();

    // Start & stop your mock node to reset state between tests
    beforeEach(() => mockNode.start());
    afterEach(() => mockNode.stop());

    it("lets you mock behaviour and assert on Ethereum interactions", async () => {
        // Mock any address balance
        await mockNode.forBalance('0x0000000000000000000000000000000000000001')
            .thenReturn(1000);

        // Mock any contract's function call:
        const mockedFunction = await mockNode.forCall(CONTRACT_ADDRESS) // Match any contract address
            // Optionally, match specific functions and parameters:
            .forFunction('function getText(string key) returns (string)')
            .withParams(["test"])
            // Mock contract results:
            .thenReturn('Mock result');

        // Real code to make client requests to the Ethereum node:
        const web3 = new Web3(mockNode.url);

        const walletBalance = await web3.eth.getBalance('0x0000000000000000000000000000000000000001');
        expect(walletBalance).to.equal("1000"); // Returns our mocked wallet balance

        const contract = new web3.eth.Contract(JSON_CONTRACT_ABI, CONTRACT_ADDRESS);
        const contractResult = await contract.methods.getText("test").call();

        // Check contract call returns our fake contract result:
        expect(contractResult).to.equal("Mock result");

        // Assert on inputs, to check we saw the contract calls we expected:
        const mockedCalls = await mockedFunction.getRequests();
        expect(mockedCalls.length).to.equal(1);

        expect(mockedCalls[0]).to.deep.include({
            // Examine full interaction data, included decoded parameters etc:
            to: CONTRACT_ADDRESS,
            params: ["test"]
        });
    });
});
