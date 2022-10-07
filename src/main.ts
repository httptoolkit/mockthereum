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

// Export various internal types:
export type { MockthereumNode, MockthereumOptions };
export type { CallRuleBuilder, TransactionRuleBuilder } from './contract-rule-builder';
export type { BalanceRuleBuilder, BlockNumberRuleBuilder, GasPriceRuleBuilder } from './single-value-rule-builders';
export type { MockedContract } from './mocked-contract';
export type { RpcErrorProperties } from './jsonrpc';
export type { RawTransactionReceipt } from './mock-node';