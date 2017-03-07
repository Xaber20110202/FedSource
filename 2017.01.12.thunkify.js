/**
 * Module dependencies.
 */

var assert = require('assert');

/**
 * Expose `thunkify()`.
 */

module.exports = thunkify;

/**
 * Wrap a regular callback `fn` as a thunk.
 *
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

function thunkify(fn) {
  assert('function' == typeof fn, 'function required');

  // see https://github.com/tj/node-thunkify
  // 返回func1 主要是利用闭包保存的特性 （fn保存）
  return function() {
    var args = new Array(arguments.length);
    var ctx = this;

    for (var i = 0; i < args.length; ++i) {
      args[i] = arguments[i];
    }

    // func1 接受参数参数args 执行后返回func2
    return function(done) {
      var called;

      // func2 将args数组和 一个done 函数组合起来
      args.push(function() {
        // 并且这个callback只能执行一次
        if (called) return;
        called = true;
        // 相当于 fn([...args], done)
        done.apply(null, arguments);
      });

      try {
        fn.apply(ctx, args);
      } catch (err) {
        done(err);
      }
    }
  }
};

// 示例：
// var readFile = thunkify(fs.readFile);
// var readTheText = readFile('the.txt', 'utf8');
// readTheText(done);

// 好处：
// 1. 有惰性处理的意味，只有在最后调用readTheText 时，才会真正进行读取操作，而前面的参数都是指定的
// 2. 将node api 通过thunkify包裹，和Generator、co结合起来