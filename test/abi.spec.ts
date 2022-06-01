/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai';
import {
    encodeAbi,
    decodeAbi,
    encodeFunctionSignature
} from '../src/abi'

describe("ABI encoding", () => {
    it("can encode & decode strings", () => {
        const encoded = encodeAbi(['string'], ['hello']);

        expect(encoded).to.match(/^0x/);

        expect(decodeAbi(['string'], encoded)).to.deep.equal(['hello']);
    });

    it("can encode & decode numbers", () => {
        const encoded = encodeAbi(['uint8', 'int256'], [123, 456]);

        expect(encoded).to.match(/^0x/);

        expect(decodeAbi(['uint8', 'int256'], encoded).map(n =>
            n.toNumber ? n.toNumber(): n // Flatten BigNumber into numbers
        )).to.deep.equal([123, 456]);
    });

    it("can encode & decode bytes", () => {
        const encoded = encodeAbi(['bytes'], [[1, 2, 3, 4]]);

        expect(encoded).to.match(/^0x/);

        expect(decodeAbi(['bytes'], encoded)).to.deep.equal(['0x01020304']);
    });

    it("can generate function signature hashes", () => {
        expect(
            encodeFunctionSignature("foobar(string,bool)")
        ).to.equal("0x7fddde58");
    });

    it("can generate function signature hashes from various input formats", () => {
        expect(
            encodeFunctionSignature("foobar(string, bool)") // Space
        ).to.equal("0x7fddde58");

        expect(
            encodeFunctionSignature("function foobar(string, bool)") // Function prefix
        ).to.equal("0x7fddde58");

        expect(
            encodeFunctionSignature("function foobar(string,bool) public view returns (bool)") // Return types & flags
        ).to.equal("0x7fddde58");
    });
});