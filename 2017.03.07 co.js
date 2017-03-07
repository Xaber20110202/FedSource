
/**
 * slice() reference.
 */

var slice = Array.prototype.slice;

/**
 * Expose `co`.
 */

// module.exports = co['default'] = co.co = co;

/**
 * Wrap the given generator `fn` into a
 * function that returns a promise.
 * This is a separate function so that
 * every `co()` call doesn't create a new,
 * unnecessary closure.
 *
 * @param {GeneratorFunction} fn
 * @return {Function}
 * @api public
 */
// 这个函数的作用，相当于把
// const genFunc = function * (arg){return yield arg};
// co(genFunc, arg);
// co(genFunc, arg);
// 
// 变成了 const genWrap = co.wrap(genFunc);
// genWrap(arg);
// genWrap(arg);
// 这就意味着
// var newArr = arr.map((item) => {
//   co(function*(item) {
//       return yield asyncFun(item);
//   }, item);
// });
// 可以写成
// var newArr = arr.map(co.wrap(function*(item) {
//     return yield asyncFun(item);
// }));
co.wrap = function (fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;
  function createPromise() {
    return co.call(this, fn.apply(this, arguments));
  }
};

/**
 * Execute the generator function or a generator
 * and return a promise.
 *
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

function co(gen) {
  var ctx = this;
  var args = slice.call(arguments, 1)

  // we wrap everything in a promise to avoid promise chaining,
  // which leads to memory leak errors.
  // see https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
    // generator 函数内部也保留this的使用 以及 参数的传递
    if (typeof gen === 'function') gen = gen.apply(ctx, args);
    // 如果不是GeneratorFunc，或单纯只是纯函数，则resolve gen
    // 因此，基本上任何内容都可以进行co 包裹后返回一个Promise对象
    if (!gen || typeof gen.next !== 'function') return resolve(gen);

    onFulfilled();

    /**
     * @param {Mixed} res
     * @return {Promise}
     * @api private
     */

    function onFulfilled(res) {
      var ret;
      // 开始进行 依次next 执行器操作
      // 错误处理
      // 即使中间层有错误，捕获错误，直接通过 最上面的reject 退出当前Promise
      // 将error传递给返回的Promise对象的catch方法对应callback
      try {
        ret = gen.next(res);
      } catch (e) {
        // 即后面的 onRejected
        // 注意这里的return 也是利用了Promise链中间传值的处理，这样，后续就是直接调用catch（onRejected）
        return reject(e);
      }
      next(ret);
    }

    /**
     * @param {Error} err
     * @return {Promise}
     * @api private
     */

    function onRejected(err) {
      var ret;
      // 错误处理
      // 即 onFulfilled 的里面捕获的错误，一层层往后传递，最终将错误展现出来
      // 这在避免回调地狱的同时，其实也解决了node 因为异步的原因，很难进行错误处理的问题
      try {
        ret = gen.throw(err);
      } catch (e) {
        // 同理
        return reject(e);
      }
      next(ret);
    }

    /**
     * Get the next value in the generator,
     * return a promise.
     *
     * @param {Object} ret
     * @return {Promise}
     * @api private
     */

    function next(ret) {
      // 执行器
      if (ret.done) return resolve(ret.value);
      var value = toPromise.call(ctx, ret.value);
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
      return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
    }
  });
}

/**
 * Convert a `yield`ed value into a promise.
 *
 * @param {Mixed} obj
 * @return {Promise}
 * @api private
 */
// 将所有yield出来的内容（即ret.value）转成Promise
// 这是非常关键的一步
function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  // this 仍旧指向 ctx 层层co迭代下去
  // 这里有一个有意思的地方 通过co 即使obj 是GeneratorFunc 或者 generator（因为有next） 都可以进行操作
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  // 只接受thunk函数
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */

function thunkToPromise(fn) {
  var ctx = this;
  return new Promise(function (resolve, reject) {
    // https://github.com/tj/node-thunkify
    // thunk 函数只接受一个callback，因为前置的参数都已经被封装指定了
    fn.call(ctx, function (err, res) {
      if (err) return reject(err);
      // 这里有一个巧妙的操作，thunk函数的callback如果接受多个参数，将其转换成数组进行resolve
      if (arguments.length > 2) res = slice.call(arguments, 1);
      resolve(res);
    });
  });
}

/**
 * Convert an array of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Array} obj
 * @return {Promise}
 * @api private
 */

function arrayToPromise(obj) {
  // 使用Promise.all 将array内部最终得到的Promise 变更为一个Promise对象
  return Promise.all(obj.map(toPromise, this));
}

/**
 * Convert an object of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Object} obj
 * @return {Promise}
 * @api private
 */

function objectToPromise(obj){
  // 构建其obj 构造函数的实例
  // 这样 最终获得的results新对象 可以拥有和obj一样的__proto__ 也就有同样继承的属性和方法
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    // 这一步非常关键 会通过toPromise
    // 一层层 继续迭代进行Promise化 如果属性值是对象 也会经过objectToPromise 包裹
    var promise = toPromise.call(this, obj[key]);
    if (promise && isPromise(promise)) defer(promise, key);
    // false 空字符串 等 !value === true 的场景 设置results的值
    else results[key] = obj[key];
  }
  // 利用了Promise对象 中间return 传参的特性
  // Promise.resolve(1)
  // .then((v) => {return v * 10})
  // .then(console.log)  --> 10
  // 而最后的then 传递的函数，会在前面的promises 处理之后，再做调用
  // 因此return的promise对象的then方法接受的函数，也就接受了results对象
  return Promise.all(promises).then(function () {
    return results;
  });

  // 这个函数还是比较难理解
  function defer(promise, key) {
    // predefine the key in the result
    // 设置实例属性值为undefined（相当于先做一个placeholder，也是覆盖掉原型上的属性）
    // 而该层对应的Promise对象，又会通过promises数组，进行Promise.all处理
    results[key] = undefined;
    promises.push(promise.then(function (res) {
      results[key] = res;
    }));
  }
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
  return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}

/**
 * Check for plain object.
 *
 * @param {Mixed} val
 * @return {Boolean}
 * @api private
 */

function isObject(val) {
  return Object == val.constructor;
}
