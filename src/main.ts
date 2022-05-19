/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

import * as mockttp from 'mockttp';

export const x = true;

export function getAdminServer(options?: mockttp.MockttpAdminServerOptions) {
    return mockttp.getAdminServer(options);
}