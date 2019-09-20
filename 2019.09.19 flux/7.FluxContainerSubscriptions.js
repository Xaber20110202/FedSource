/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FluxContainerSubscriptions
 * @flow
 */

'use strict';

import type FluxStore from 'FluxStore';

const FluxStoreGroup = require('FluxStoreGroup');

// 数组单层（数组项进行全等判断）检测
function shallowArrayEqual(a: Array<FluxStore>, b: Array<FluxStore>): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

class FluxContainerSubscriptions {

  _callbacks: Array<() => void>;
  _storeGroup: ?FluxStoreGroup;
  _stores: ?Array<FluxStore>;
  _tokens: ?Array<{remove: () => void}>;

  constructor() {
    this._callbacks = [];
  }

  setStores(stores: Array<FluxStore>): void {
    // 判断 _stores 内容一致 （数组项引用值判断；因此 store 的更新需要返回新的对象）
    if (this._stores && shallowArrayEqual(this._stores, stores)) {
      return;
    }
    this._stores = stores;
    // 重置 _tokens
    this._resetTokens();
    // 重置 _storeGroup
    this._resetStoreGroup();

    let changed = false;
    let changedStores = [];

    if (__DEV__) {
      // Keep track of the stores that changed for debugging purposes only
      this._tokens = stores.map(store => store.addListener(() => {
        changed = true;
        changedStores.push(store);
      }));
    } else {
      const setChanged = () => { changed = true; };
      this._tokens = stores.map(store => store.addListener(setChanged));
    }

    // 再在 _storeGroup 上注册这一个 callback，等 stores 对应的所有的 dispatcher register callback 调用完后，会执行
    const callCallbacks = () => {
      // 只要有一个调用（代表就有数据变更）
      // 就调用 callbacks
      if (changed) {
        this._callbacks.forEach(fn => fn());
        changed = false;
        if (__DEV__) {
          // Uncomment this to print the stores that changed.
          // console.log(changedStores);
          // 有趣了，竟然通过这样的方式进行 log 打印数据变化
          changedStores = [];
        }
      }
    };
    this._storeGroup = new FluxStoreGroup(stores, callCallbacks);
  }

  // 这些 callback 都最终放在 callCallbacks 一次性执行
  addListener(fn: () => void): void {
    this._callbacks.push(fn);
  }

  reset(): void {
    this._resetTokens();
    this._resetStoreGroup();
    this._resetCallbacks();
    this._resetStores();
  }

  _resetTokens() {
    if (this._tokens) {
      // 因为 this._tokens 内容是由 stores.map(store => store.addListener(setChanged)) 定义
      // 而 store.addListener 实际上就是返回了 this.__emitter.addListener(this.__changeEvent, callback)  详见 4.FluxStore.js
      // 这里也就是移除了上面 监听 change 事件的 setChanged callback
      this._tokens.forEach(token => token.remove());
      this._tokens = null;
    }
  }

  _resetStoreGroup(): void {
    if (this._storeGroup) {
      // 详见 6.FluxStoreGroup.js
      // 取消注册 最后的 storeGroup 注册的 callCallbacks（就是上面的 callCallbacks） （store dispatcher register callback 全部执行后，会运行）
      this._storeGroup.release();
      this._storeGroup = null;
    }
  }

  _resetStores(): void {
    this._stores = null;
  }

  _resetCallbacks(): void {
    this._callbacks = [];
  }
}

module.exports = FluxContainerSubscriptions;