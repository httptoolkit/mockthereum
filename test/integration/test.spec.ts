/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Mockthereum,
    expect
} from "../test-setup";

describe("A test", () => {
    it("passes", () => {
        console.log('Running a test');
        expect(Mockthereum.x).to.equal(true);
    });
});