/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * 
 * @preventMunge
 */

'use strict';

exports.__esModule = true;

// 定义为 必须 new 调用
// function A () {_classCallCheck(this, A)}
// A() => 报错
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var invariant = require('fbjs/lib/invariant');

var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *   CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *         case 'city-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

var Dispatcher = (function () {
  function Dispatcher() {
    _classCallCheck(this, Dispatcher);

    this._callbacks = {};
    this._isDispatching = false;
    this._isHandled = {};
    this._isPending = {};
    this._lastID = 1;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   */

  //  将 callback 注册到 this._callbacks 上，并返回对应的 id（key）
  Dispatcher.prototype.register = function register(callback) {
    var id = _prefix + this._lastID++;
    this._callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   */

  Dispatcher.prototype.unregister = function unregister(id) {
    !this._callbacks[id] ?
      // id 不存在情况下，报错
      process.env.NODE_ENV !== 'production' ?
        invariant(false, 'Dispatcher.unregister(...): `%s` does not map to a registered callback.', id) :
        invariant(false) :
      undefined;
    delete this._callbacks[id];
  };

  /**
   * Dispatches a payload to all registered callbacks.
   */

  Dispatcher.prototype.dispatch = function dispatch(payload) {
    // this._isDispatching 为 true，就报错？
    // 详见：https://github.com/facebook/flux/issues/436
    // 为了预防用户在 register 内部调用 dispatch，导致死循环 这样的瞎写的情况
    // dispatch -> register callback -> dispatch -> 死循环了
    // 例如：
    // var dispatcher = new Dispatcher()
    // dispatcher.register((payload) => {
    //   dispatcher.dispatch(payload);
    //   callbackA();
    // });
    // var payload = {};
    // dispatcher.dispatch(payload)
    !!this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.') : invariant(false) : undefined;
    this._startDispatching(payload);
    try {
      for (var id in this._callbacks) {
        // 问题：如果是同步场景，不会出现上面 _startDispatching 才设置完 false，这里还是 true 的情况
        // 答案：用于处理 waitFor 场景 详细可见 3.wairForDemo.js
        if (this._isPending[id]) {
          continue;
        }
        // 把 payload 给到 **所有** 的 register/注册的 callback
        this._invokeCallback(id);
      }
    } finally {
      this._stopDispatching();
    }
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @internal
   */

  // 初始化 Dispatching 相关状态
  // 将 _isPending、_isHandled 所有的 id 对应的状态都标记为 false
  // 设置 _pendingPayload
  // 设置 _isDispatching 为 true
  Dispatcher.prototype._startDispatching = function _startDispatching(payload) {
    for (var id in this._callbacks) {
      this._isPending[id] = false;
      this._isHandled[id] = false;
    }
    this._pendingPayload = payload;
    this._isDispatching = true;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @internal
   */

  Dispatcher.prototype._invokeCallback = function _invokeCallback(id) {
    // 标记 _isPending[id] true
    this._isPending[id] = true;
    /**
     * NumsDispatcher.dispatch({
          type: NumsActionTypes.DECREASE_COUNT,
          index,
        });
        类似，把 { type: NumsActionTypes.DECREASE_COUNT, index } 给到 **所有** 的 callback
     */
    this._callbacks[id](this._pendingPayload);
    this._isHandled[id] = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */

  // 标记 dispatching 动作完成
  Dispatcher.prototype._stopDispatching = function _stopDispatching() {
    delete this._pendingPayload;
    this._isDispatching = false;
  };

  /**
   * Is this Dispatcher currently dispatching.
   */

  Dispatcher.prototype.isDispatching = function isDispatching() {
    return this._isDispatching;
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   */

  // 需要注意的是，这个 waitFor 不是用于异步场景的
  // 只是用于 **数据依赖** 场景，先更新哪个数据，再更新哪个数据，详细可见 3.waitForDemo.js
  Dispatcher.prototype.waitFor = function waitFor(ids) {
    // _isDispatching 为 false 的话，报错
    !this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): Must be invoked while dispatching.') : invariant(false) : undefined;

    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      // 如果 _isPending[id] 为 true
      if (this._isPending[id]) {
        // 如果 _isHandled[id] 为 false，报错
        !this._isHandled[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): Circular dependency detected while ' + 'waiting for `%s`.', id) : invariant(false) : undefined;

        // 否则跳过，进行下一个循环 （pending，意味着正在变更，就不需要再执行变更了）
        continue;
      }

      // 如果 _isPending[id] 为 false，走到此处
      // 如果 this._callbacks[id] 为 false（不存在），报错
      !this._callbacks[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): `%s` does not map to a registered callback.', id) : invariant(false) : undefined;

      // 否则调用 _invokeCallback （pending 结束，可以调用了）
      this._invokeCallback(id);
    }
  };

  return Dispatcher;
})();

module.exports = Dispatcher;