/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import { id as idHash } from '@ethersproject/hash';
import { defaultAbiCoder, FunctionFragment } from '@ethersproject/abi';

export const encodeAbi = defaultAbiCoder.encode.bind(defaultAbiCoder);
export const decodeAbi = defaultAbiCoder.decode.bind(defaultAbiCoder);

export function encodeFunctionSignature(functionDefinition: string) {
    const sig = FunctionFragment.from(
        functionDefinition.trim().replace(/^function /, '') // Be flexible with input format
    ).format();
    return idHash(sig).slice(0, 10);
}