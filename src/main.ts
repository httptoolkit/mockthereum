/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { MockthereumNode, MockthereumOptions } from './mock-node';

export function getLocal(options?: Mockttp.MockttpOptions & MockthereumOptions) {
    return new MockthereumNode(Mockttp.getLocal(options), options);
}

export function getRemote(options?: Mockttp.MockttpOptions & MockthereumOptions) {
    return new MockthereumNode(Mockttp.getRemote(options), options);
}

export function getAdminServer(options?: Mockttp.MockttpAdminServerOptions) {
    return Mockttp.getAdminServer(options);
}