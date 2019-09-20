/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FluxStore
 * 
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

// https://github.com/facebook/emitter#readme
// 事件 EventEmitter；不做赘述
var _require = require('fbemitter');
var EventEmitter = _require.EventEmitter;

var invariant = require('fbjs/lib/invariant');

/**
 * This class represents the most basic functionality for a FluxStore. Do not
 * extend this store directly; instead extend FluxReduceStore when creating a
 * new store.
 */

var FluxStore = (function () {
  // Store 创建时，必须有一个 dispatcher 传递
  // 即，一个 dispatcher 对应一个 Store
  function FluxStore(dispatcher) {
    var _this = this;

    _classCallCheck(this, FluxStore);

    this.__className = this.constructor.name;

    this.__changed = false;
    this.__changeEvent = 'change';
    this.__dispatcher = dispatcher;
    this.__emitter = new EventEmitter();

    // dispatcher 每次 dispatcher.dispatch 都会调用 这个 callback，进行 _this.__invokeOnDispatch(payload);
    this._dispatchToken = dispatcher.register(function (payload) {
      _this.__invokeOnDispatch(payload);
    });
  }

  /**
   * This method encapsulates all logic for invoking __onDispatch. It should
   * be used for things like catching changes and emitting them after the
   * subclass has handled a payload.
   */

  // 忽略，此 __invokeOnDispatch 方法会被 FluxReduceStore.prototype.__invokeOnDispatch覆盖
  FluxStore.prototype.__invokeOnDispatch = function __invokeOnDispatch(payload) {
    // 标记未变化
    this.__changed = false;
    // 去 进行 dispatch 更新
    this.__onDispatch(payload);

    // 这里怎么会是 true？
    // —— 忽略，此 __invokeOnDispatch 方法会被 FluxReduceStore.prototype.__invokeOnDispatch 覆盖
    // 或者，就是 子类型，在 __onDispatch 中将 __changed 设置为 true，才能作用
    // 同理，FluxReduceStore.prototype.__invokeOnDispatch 也就是这么干的（调用 __emitChange 将 __changed 标记为 true）
    if (this.__changed) {

      // 发送 change 事件
      this.__emitter.emit(this.__changeEvent);
    }
  };

  /**
   * The callback that will be registered with the dispatcher during
   * instantiation. Subclasses must override this method. This callback is the
   * only way the store receives new data.
   */
  // 子类型必须覆盖 __onDispatch 方法，否则调用 __onDispatch 会报错
  FluxStore.prototype.__onDispatch = function __onDispatch(payload) {
    !false ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s has not overridden FluxStore.__onDispatch(), which is required', this.__className) : invariant(false) : undefined;
  };


  FluxStore.prototype.addListener = function addListener(callback) {
    // 监听 change 事件
    return this.__emitter.addListener(this.__changeEvent, callback);
  };

  FluxStore.prototype.getDispatcher = function getDispatcher() {
    return this.__dispatcher;
  };

  /**
   * This exposes a unique string to identify each store's registered callback.
   * This is used with the dispatcher's waitFor method to declaratively depend
   * on other stores updating themselves first.
   */

  FluxStore.prototype.getDispatchToken = function getDispatchToken() {
    return this._dispatchToken;
  };

  /**
   * Returns whether the store has changed during the most recent dispatch.
   */

  FluxStore.prototype.hasChanged = function hasChanged() {
    // 如果 this.__dispatcher.isDispatching() 正在 dispatching，调用 hasChanged 就报错
    !this.__dispatcher.isDispatching() ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s.hasChanged(): Must be invoked while dispatching.', this.__className) : invariant(false) : undefined;
    return this.__changed;
  };

  FluxStore.prototype.__emitChange = function __emitChange() {
    // 如果 this.__dispatcher.isDispatching() 正在 dispatching，调用 __emitChange 就报错
    !this.__dispatcher.isDispatching() ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s.__emitChange(): Must be invoked while dispatching.', this.__className) : invariant(false) : undefined;
    
    // 标记 __changed 为 true
    this.__changed = true;
  };

  return FluxStore;
})();

module.exports = FluxStore;

// private

// protected, available to subclasses