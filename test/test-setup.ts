/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import { expect } from "chai";

import * as Mockthereum from '../src/main';
export {
    expect,
    Mockthereum
};

export const delay = (durationMs: number) =>
    new Promise((resolve) => setTimeout(resolve, durationMs));

const isNode = typeof process === 'object' && process.version;
export const nodeOnly = (fn: Function) => {
    if (isNode) fn();
};