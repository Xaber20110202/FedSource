/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FluxStoreGroup
 * @flow
 */

'use strict';

import type Dispatcher from 'Dispatcher';
import type FluxStore from 'FluxStore';

var invariant = require('invariant');

type DispatchToken = string;

function _getUniformDispatcher(stores: Array<FluxStore>): Dispatcher<any> {
  // 必须传递 至少一个 FluxStore 实例
  invariant(
    stores && stores.length,
    'Must provide at least one store to FluxStoreGroup'
  );
  // 获取第一个 store 的dispatcher 返回
  var dispatcher = stores[0].getDispatcher();

  // 开发环境 增加判断
  if (__DEV__) {
    for (var store of stores) {
      invariant(
        // 所有的传递给 FluxStoreGroup 的 FluxStore 实例， **dispatcher** 必须相同
        // 所以 这样 才能组成 一个 Group
        store.getDispatcher() === dispatcher,
        'All stores in a FluxStoreGroup must use the same dispatcher'
      );
    }
  }
  return dispatcher;
}

/**
 * FluxStoreGroup allows you to execute a callback on every dispatch after
 * waiting for each of the given stores.
 */
class FluxStoreGroup {
  _dispatcher: Dispatcher<any>;
  _dispatchToken: DispatchToken;

  constructor(stores: Array<FluxStore>, callback: Function): void {
    this._dispatcher = _getUniformDispatcher(stores);

    // Precompute store tokens.
    // 尽管 所有的 FluxStore dispatcher 都是相同的
    // 但是因为 dispatchToken 是通过 register 返回的，因此 dispatchToken 是不同的
    var storeTokens = stores.map(store => store.getDispatchToken());

    // Register with the dispatcher.
    // 针对 当前的 FluxStoreGroup 单独注册一个 callback，并且让这个 callback放到其他 callback 调用完后再调用
    this._dispatchToken = this._dispatcher.register(payload => {
      this._dispatcher.waitFor(storeTokens);
      callback();
    });
  }

  release(): void {
    this._dispatcher.unregister(this._dispatchToken);
  }
}

module.exports = FluxStoreGroup;