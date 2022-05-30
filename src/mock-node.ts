/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Mockttp from 'mockttp';
import { BalanceRuleBuilder } from './wallet-balance/balance-rule-builder';

export class MockthereumNode {

    constructor(
        private mockttpServer: Mockttp.Mockttp
    ) {}

    start() {
        return this.mockttpServer.start();
    }

    stop() {
        return this.mockttpServer.stop();
    }

    get url() {
        return this.mockttpServer.url;
    }

    forBalance(address?: string) {
        return new BalanceRuleBuilder(address, this.mockttpServer.addRequestRules);
    }

}