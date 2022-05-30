/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { MockthereumNode } from './mock-node';

export function getLocal(options?: Mockttp.MockttpOptions) {
    return new MockthereumNode(Mockttp.getLocal(options));
}

export function getRemote(options?: Mockttp.MockttpOptions) {
    return new MockthereumNode(Mockttp.getRemote(options));
}

export function getAdminServer(options?: Mockttp.MockttpAdminServerOptions) {
    return Mockttp.getAdminServer(options);
}