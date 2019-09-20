/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule abstractMethod
 * 
 */

'use strict';

// https://github.com/facebook/fbjs/blob/d308fa83c99c93e8e588de3396cf55b31e56b14e/packages/fbjs/src/__forks__/invariant.js
// 或者 参考 ./invariant.js （已经复制过来）
var invariant = require('fbjs/lib/invariant');

// 只是用于 抽象 方法定义检测
// 例如： A.prototype.hello = function () { abstractMethod('A', 'hello') }
// 那么 继承 A 的 B，如果没有定义 hello 方法，就会调用到 A.prototype.hello 而报错
function abstractMethod(className, methodName) {
  !false ? 
    process.env.NODE_ENV !== 'production' ?
      invariant(false, 'Subclasses of %s must override %s() with their own implementation.', className, methodName) :
      invariant(false) :
    undefined;
}

module.exports = abstractMethod;