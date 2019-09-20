

var invariant = (...args) => console.log(...args);

var _prefix = 'ID_';
var process = {
  env: {
    NODE_ENV: 'development',
  }
}

var Dispatcher = (function () {
  function Dispatcher() {
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
    !!this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.') : invariant(false) : undefined;
    this._startDispatching(payload);
    try {
      for (var id in this._callbacks) {
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

      console.log('this._invokeCallback(id);', this._callbacks[id])
      // 否则调用 _invokeCallback （pending 结束，可以调用了）
      this._invokeCallback(id);
    }
  };

  return Dispatcher;
})();


var flightDispatcher = new Dispatcher();
// Keeps track of which country is selected
var CountryStore = {country: 'USA'};
// Keeps track of which city is selected
var CityStore = {city: 'nuwyue'};
// Keeps track of the base flight price of the selected city
var FlightPriceStore = {price: 2};

var getDefaultCityForCountry = (country) => {
  if (country === 'australia') return 'sydney'
}

var getFlightPriceStore = (country, city) => {
  console.log(country, city)
  return 1
}

FlightPriceStore.dispatchToken =
  flightDispatcher.register(function(payload) {
    switch (payload.actionType) {
      case 'country-update':
      case 'city-update':
        console.log('FlightPriceStore.dispatchToken', payload)
        flightDispatcher.waitFor([CityStore.dispatchToken]);
        FlightPriceStore.price =
          getFlightPriceStore(CountryStore.country, CityStore.city);
        break;
  }
});

CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
  console.log('CountryStore.dispatchToken', payload)
  if (payload.actionType === 'country-update') {
    CountryStore.country = payload.selectedCountry;
  }
});

CityStore.dispatchToken = flightDispatcher.register(function(payload) {
  console.log('CityStore.dispatchToken', payload)
  if (payload.actionType === 'country-update') {
    // `CountryStore.country` may not be updated.
    flightDispatcher.waitFor([CountryStore.dispatchToken]);
    // `CountryStore.country` is now guaranteed to be updated.
    // Select the default city for the new country
    CityStore.city = getDefaultCityForCountry(CountryStore.country);
  }
});



flightDispatcher.dispatch({
  actionType: 'country-update',
  selectedCountry: 'australia'
});


// 上面的 demo 代码摘自 https://facebook.github.io/flux/docs/dispatcher/，关于 
// 上面的 console 结果

// FlightPriceStore.dispatchToken {actionType: "country-update", selectedCountry: "australia"}

// VM62:151 this._invokeCallback(id); ƒ (payload) {
//   console.log('CityStore.dispatchToken', payload)
//   if (payload.actionType === 'country-update') {
//     // `CountryStore.country` may not be updated.
//     flightDispatcher.waitFor([CountryS…

// VM62:199 CityStore.dispatchToken {actionType: "country-update", selectedCountry: "australia"}

// VM62:151 this._invokeCallback(id); ƒ (payload) {
//   console.log('CountryStore.dispatchToken', payload)
//   if (payload.actionType === 'country-update') {
//     CountryStore.country = payload.selectedCountry;
//   }
// }
// VM62:192 CountryStore.dispatchToken {actionType: "country-update", selectedCountry: "australia"}

// VM62:174 australia sydney

// 即
// flightDispatcher.dispatch 先调用了 FlightPriceStore.dispatchToken 的注册回调函数
// 但是因为其内部有 waitFor，而 waitFor，其实更多意义应该改名为 trigger，即先 让 CityStore.dispatchToken 的注册回调函数先调用
// 同样的，CityStore.dispatchToken 的回调函数内部又 waitFor （trigger） 了 CountryStore.dispatchToken （先调用）
// 如此，数据变更顺序变成了，先改变 country，然后再回到 CityStore.dispatchToken callback 内部，改变 city
// 再回到 FlightPriceStore.dispatchToken  回调函数内部，改变 price
// 跟异步没有半毛钱关系 所以 waitFor 函数名，其实改为 triggerDispatch 更好一些（避免造成歧义）

// 如上状态流
// this._isPending[id] = false; —— 所有callbacks的 id
// this._isHandled[id] = false; —— 所有callbacks的 id
// _isDispatching -> true
// 循环 _callbacks 内部，准备一个个函数调用
// FlightPriceStore.dispatchToken callback 先调用，但是内部 waitFor
// 先调用了 CityStore.dispatchToken callback，内部 waitFor
// 调用了 CountryStore.dispatchToken callback
// this._isPending[id] = true; —— id is CountryStore.dispatchToken callback 对应的id
// this._isHandled[id] = true; —— id is CountryStore.dispatchToken callback 对应的id

// this._isPending[id] = true; —— id is CityStore.dispatchToken callback 对应的id
// this._isHandled[id] = true; —— id is CityStore.dispatchToken callback 对应的id

// this._isPending[id] = true; —— id is CityStore.dispatchToken callback 对应的id
// this._isHandled[id] = true; —— id is CityStore.dispatchToken callback 对应的id

// 所以在 dispatch 内部有
// if (this._isPending[id]) {
//   continue;
// }
// 就是为了避免回调函数被调用多次