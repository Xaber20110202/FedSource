/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FluxReduceStore
 * 
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FluxStore = require('./FluxStore');

var abstractMethod = require('./abstractMethod');
var invariant = require('fbjs/lib/invariant');

/**
 * This is the basic building block of a Flux application. All of your stores
 * should extend this class.
 *
 *   class CounterStore extends FluxReduceStore<number> {
 *     getInitialState(): number {
 *       return 1;
 *     }
 *
 *     reduce(state: number, action: Object): number {
 *       switch(action.type) {
 *         case: 'add':
 *           return state + action.value;
 *         case: 'double':
 *           return state * 2;
 *         default:
 *           return state;
 *       }
 *     }
 *   }
 */

var FluxReduceStore = (function (_FluxStore) {
  // 继承 FluxStore
  _inherits(FluxReduceStore, _FluxStore);

  function FluxReduceStore(dispatcher) {
    _classCallCheck(this, FluxReduceStore);

    _FluxStore.call(this, dispatcher);

    // 设置初始数据状态
    this._state = this.getInitialState();
  }

  /**
   * Getter that exposes the entire state of this store. If your state is not
   * immutable you should override this and not expose _state directly.
   */

  FluxReduceStore.prototype.getState = function getState() {
    return this._state;
  };

  /**
   * Constructs the initial state for this store. This is called once during
   * construction of the store.
   */

  // FluxReduceStore 的子类型，必须包含  getInitialState 方法，例如
  // getInitialState() {
  //  return [0, 0, 0];
  // }
  FluxReduceStore.prototype.getInitialState = function getInitialState() {
    return abstractMethod('FluxReduceStore', 'getInitialState');
  };

  /**
   * Used to reduce a stream of actions coming from the dispatcher into a
   * single state object.
   */

   // FluxReduceStore 的子类型，必须包含  reduce 方法，例如
  //  reduce(state, action) {
  //   switch (action.type) {
  //     case NumsActionTypes.INCREASE_COUNT: {
  //       const nums = [...state]
  //       nums[action.index] += 1
  //       return nums;
  //     }

  //     case NumsActionTypes.DECREASE_COUNT: {
  //       const nums = [...state]
  //       nums[action.index] = nums[action.index] > 0 ? nums[action.index] - 1 : 0
  //       return nums;
  //     }

  //     default:
  //       return state;
  //   }
  // }
  FluxReduceStore.prototype.reduce = function reduce(state, action) {
    return abstractMethod('FluxReduceStore', 'reduce');
  };

  /**
   * Checks if two versions of state are the same. You do not need to override
   * this if your state is immutable.
   */

  FluxReduceStore.prototype.areEqual = function areEqual(one, two) {
    return one === two;
  };

  // 覆盖 _FluxStore.prototype.__invokeOnDispatch
  FluxReduceStore.prototype.__invokeOnDispatch = function __invokeOnDispatch(action) {
    // 标记未更新
    this.__changed = false;

    // Reduce the stream of incoming actions to state, update when necessary.
    // 未更新前状态
    var startingState = this._state;
    // 将前面
    // NumsDispatcher.dispatch({
    //   type: NumsActionTypes.DECREASE_COUNT,
    //   index,
    // });
    //  这个 payload {
    //   type: NumsActionTypes.DECREASE_COUNT,
    //   index,
    // } 传递给 reduce 方法，得到最新的 state 状态
    var endingState = this.reduce(startingState, action);

    // This means your ending state should never be undefined.
    // reduce 处理，**必须返回数据**
    // 必须有 default 返回，因为所有的 dispatcher.dispatch 的 action，都会经过 reduce，如果 action.type 不匹配，会直接报错
    !(endingState !== undefined) ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s returned undefined from reduce(...), did you forget to return ' + 'state in the default case? (use null if this was intentional)', this.constructor.name) : invariant(false) : undefined;

    // 直接进行全等判断（引用值更改不会触发），如果发现有更新
    if (!this.areEqual(startingState, endingState)) {
      // 更新数据
      this._state = endingState;

      // `__emitChange()` sets `this.__changed` to true and then the actual
      // change will be fired from the emitter at the end of the dispatch, this
      // is required in order to support methods like `hasChanged()`

      // 调用 this.__emitChange(来自 FluxStore.prototype.__emitChange)
      // 标记 this.__changed 为 true
      this.__emitChange();
    }

    // 触发 change 事件更新
    if (this.__changed) {
      this.__emitter.emit(this.__changeEvent);
    }
  };

  // 好了，dispatch, action, store 这三个部分代码就是这样，下面开始 Container 部分

  return FluxReduceStore;
})(FluxStore);

module.exports = FluxReduceStore;