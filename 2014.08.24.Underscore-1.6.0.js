//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.


/**
 * 两个空格的代码缩进 = =
 * 
 * @mark
 * @problem
 * @solve   ==>  problem solve / mark
 * 
 * @1.01 - 1.38: 2014.07.04 
 * @2.01 - 2.14: 2014.07.05
 * @3.01 - 3.39: 2014.07.07
 * @4.01 - 4.07: 2014.07.08
 * @5.01 - 5.11: 2014.07.09
 * @6.01 - 6.31: 2014.07.10
 * @7.01 - 7.09: 2014.07.11
 *
 * @8.01 - 8.26: 2014.07.16
 * @9.01 - 9.17: 2014.07.17
 * 
 * @10.01 - 10.08: 2014.07.18
 * 
 * 擦 硬是中间浪费一个月时间  一年也才12个月呢 靠
 * 
 * @11.01 - 11.15: 2014.08.13
 * @12.01 - 12.10: 2014.08.14
 * 
 * 周一 没什么事  总算有些时间看点东西 只剩下模板部分了  好开森
 * @13.01 - 13.33: 2014.08.18
 * 
 * @14.01 - 14.10: 2014.08.19
 * @15.01 - 15.07: 2014.08.24
 *
 * 于此，undersore.js 1000来行的代码阅读完毕。
 * 涨了不少见识，ありがとう.
 * 
 * Commented By Xaber
 * 
 */
(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  // @1.01 暂未接触 node 场景 以window为例
  var root = this;

  // Save the previous value of the `_` variable.
  // @1.02 防止冲突
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  // @1.03 渣翻译：建立一个对象 用来获得返回值来跳出一个循环
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  // @1.04 保存引用  为避免访问这些方法时，一次又一次的访问相应构造函数的原型上的方法
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  // @1.05 ES 5的一些快捷方法
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  // @1.06 闭包中的_
  var _ = function(obj) {
    // @1.07 如果obj 是 _ 的实例 直接返回
    if (obj instanceof _) return obj;
    // @1.08 安全模式 直接在内部使用return new 的形式
    // 防止了 遗忘new 或者 以函数形式调用的情况  估计只是想偷懒罢了
    if (!(this instanceof _)) return new _(obj);
    // @1.09 返回的实例 包含获得一个_wrapped属性 指向引用的obj对象
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  // @1.10 node 的场景
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    // @1.11 window的场景 此时原来的window._已被覆盖
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  // @1.12 变量保存快捷方式  而不是多次获取对象属性
  var each = _.each = _.forEach = function(obj, iterator, context) {
    // @1.13 obj 为 undefined 或 null 的场景 
    if (obj == null) return obj;
    // @1.14 如果ES 5 forEach存在  并且 obj.forEach === nativeForEach 即表明obj 是一个数组
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    // @1.15 underscore中很多情况都用了这个 + 号
    // 一般情况下 都是 默认类型转换成 boolean
    // @mark 暂不理解这种强制类型转换成 number / NaN 的场景
    // 字符串是可以进入这个逻辑的  另外也发现个访问字符串相应位置的简便方法
    // '0123456'[0] ==> 0
    } else if (obj.length === +obj.length) {
      // @1.16 length 保存obj.length 为避免在forEach过程中 动态改变 obj内部元素的数量 而导致无限循环 或其他一些情况  如删除了某个等等
      // 另外，也避免了在for循环中 每一次 i < obj.length 判断访问一次obj的length属性
      for (var i = 0, length = obj.length; i < length; i++) {
        // @1.17 在函数的循环上打主意 循环中 函数内部 一个返回值 如果 === breaker 跳出循环
        // iterator 函数接受三个参数 value key obj
        // 而这部分内容，Array.prototype.forEach内部是没有这样的功能的
        // 也就是说  高版本浏览器反而没有这样的特权  但是因为是浏览器内部实现 估计性能快些  这样倒是平均了 呵
        // @problem: 但是breaker 是一个对象 这就有点奇怪了 因为无论 iterator return出什么 它永远不会全等于闭包中的一个对象
        // 如果是 一个 true 或者 !!breaker 或者 将全等换成== 或者去掉 全等的判定 都可以break  所以这里感觉有点问题
        // 
        // @solve: 只要这部分breaker 只要是作为闭包的存在 break 也仅仅用于 underscore中的相应方法(如 _.some / _.every)调用 each时候在内部break的情况下
        // 传递的参数iterator 内部return 出breaker 即 跳出了循环 2014.07.07 10:00
        // 但是 为照顾 _.some / _.every 普通的循环 每次都执行了这个无用的判断
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      // @ 1.22 获得keyLists  _.keys()内部调用 _.has 剔除了原型上的属性方法
      // @ mark 如果是到这步 即each 一个object 循环执行两次..  _.keys中循环了一次 外面又一个for循环..
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        // @1.23 这部分 object each的情况 只要iterator return true 即跳出循环
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    // @1.24 _.each 原来还有返回值呢
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    // @1.25 Array.prototype.map  obj.map === nativeMap 即表明是一个数组
    // map 即 映射 最后会返回一个新数组 而对应的数组元素则是 传入的函数 调用得到的返回值
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    // @1.26 使用外部函数each  list即obj
    // 这里有个有意思的地方  因为 each 传入的函数并不是iterator 而是function(value, index, list) {results.push(iterator.call(context, value, index, list)); }
    // 它是没有返回值的  所以也就不会中途被return 出来
    // 而通过循环、push  results的每一项也就获得了相应的函数调用返回值
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  // @ 2.08 注意 reduce中  Array.prototype.reduce 也是一样  如果value 是object等 传递的都是引用
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    // @ 1.27 Array.prototype.reduce
    if (nativeReduce && obj.reduce === nativeReduce) {

      // @ 2.01 如果传递 context / thisobj  重写iterator为绑定了context的函数
      // iterator 参数 previous, current, index, arr
      // 在没有初始值memo的情况下 index 从 1 开始  函数执行 arr.length - 1 次 
      // 初始值 memo 存在的情况下 index 从 0 开始  函数执行 arr.length 次
      if (context) iterator = _.bind(iterator, context);
      // @ 2.02 memo 则是作为初始值的存在
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    // @ 2.03 可接受 obj对象 的情况  因为用了each
    each(obj, function(value, index, list) {
      // @ 2.04 initial 代表是否拥有 memo 参数 这里表示不存在的情况下 把初始值设置为循环中 数组 / obj 第一个value
      if (!initial) {
        memo = value;
        // @ 2.05 并标记已获得初始值  这是初始值不存在情况下的第一次循环  那么下一次 index 也就从1开始了
        initial = true;
      } else {
        // @ 2.06 之后的循环都进入这个else逻辑 每一次循环 memo 值 更新为 iterator 函数中 return 出的新值
        // 而如果初始值 memo 存在的情况下 第一次循环即进入这个 else 逻辑 index 从 0 开始
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    // @ 2.07 如果连上面的循环都没进入(循环中改变了initial = true) 表明 obj参数 错误
    // 其实 string 和 object情况都可
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  // @ 2.09 和_.reduce基本类似
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    // @ 2.10 arr / string 的情况
    var length = obj.length;
    // @ 2.11 obj的情况
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      // @ 2.12 index 从后倒数 前自减
      index = keys ? keys[--length] : --length;
      // @ 2.13 如果没有初始值memo 第一次循环 也就没有调用initial函数
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        // @ 2.14 获得的相应的参数 都是从后开始的
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    // @ 3.06 内部调用_.any / _.some 闭包调用predicate 函数
    // 如果 返回值 == true 指定 result 为 value 并 返回 true
    // 而any 内部又根据函数的返回值 == true  返回 闭包中的breaker
    // 故：如果是想中间跳出循环而不需要返回值的话请用 _.any 或 _.some 
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  // @ 3.07 返回值 为 一个新数组 保存的是符合 func 筛选规则的 value
  // 需要注意的是 如果value 是引用值 直接保存的引用 而不是复制
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  // @ 3.08 利用 filter 返回的数组 正好是 不符合规则的 的 valueList
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  // @ 3.09 正好和 _.some 相反 必须全部符合过滤条件才返回 true
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      // @ 3.10 循环遍历 只要 predicate函数 一次返回值 != true 跳出循环 返回 !!result
      // @ 利用了运算符的优先级 每次循环 result 获得了 predicate 的返回值
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  // @ 3.02 与Array.prototype.some 类似 但有区别
  // nativeSome 在未传递func的情况下 会报错 ==> undefined is not a function
  // 但underscore 在为传递func时内部指定了函数，故在未传递情况下 返回 ture
  // 接受obj func thisobj作为参数
  var any = _.some = _.any = function(obj, predicate, context) {
    // @ 3.03 如果函数未传递 指定函数为_.identity 即 function (value) { return value; }
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      // @ 3.04 predicate 函数接受 三个参数 value, index, arr / obj / string
      // @mark 为何要在判断前多加一个result 因为 只要函数调用的返回值  == true
      // 即 return breaker 跳出了循环
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    // @ 3.05 双重否定转换为 true / false
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    // @ 3.11 Array.prototype.indexOf
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    // @ 3.12 调用_.any / _.some 内部使用的都是全等判断  故对引用类型的值是无效的
    // 并且传递的函数 直接 使用return value === target; 也就确定了 函数的返回值为 true / false
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  // @ 3.14 
  // 接受两种情况：
  // situation one :  method 为函数 
  //                  返回一个绑定了this 分别为 obj相应value 的函数调用完成的返回值的 数组
  // situation two :  method 为 obj相应value上的方法名(必须是方法名)
  //                  对应的方法绑定的 this 为对应的value  内部调用 _.map 将调用完成后的返回值 push进数组
  // 返回值为 内部_.map 处理后的数组
  // 例如： _.invoke([[5, 1, 7], [3, 2, 1]], Array.prototype.sort); / _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
  // 例如： _.invoke( [{ aa : 1, a : function () { return this.aa; }}, { bb : 2, a : function () { return this.bb } }], 'a');
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  // @ 3.16 通过内部调用_.property(key) 获得 一个获取obj 上 对应key 的value 的函数
  // 传递obj 和 相应函数 给_.map 循环遍历执行 返回一个数组 每个数组元素都是 obj 中元素(arr / obj) 相应key 的value
  // 实例见： http://underscorejs.org/#pluck
  // _.pluck([{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}], 'name');
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    // @ 3.18 利用_.matches(attrs) 返回一个提供obj参数的函数 传递给_.filter
    // 那么内部obj 参数位置接受的 其实是_.filter 内部传入的 value 
    // 那么 value 应该是一个obj / obj / string 类型 而比对的情况 则是value 和 attrs的比对
    // 如果value 拥有和 attrs 相同的属性值
    // _.filter 内部将符合的value push 进 result 数组 返回
    // 再经由这个return 返回出来
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    // @ 3.19 类似_.where 但内部循环 使用的是_.find 而_.find 内部使用的是_.some / _.any
    // 即 内部只要符合一个条件即跳出循环 并返回相应的value值 (因为 是和attrs 的比对)
    // value 是一个引用值
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    // @ 3.21 在不传递函数参数的情况下 obj 必须是一个arr 且元素必须是简单值 且 typeof Number(value) === 'number' (经过测试)
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      // @3.22 利用Math对象上的max 方法 apply 调用传递 arr 返回最大的数值
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      // @3.23 另一种情况 接受一个函数 来对value 进行操作 比对
      // 而作为 大小的 比对 iterator需要返回值 并且最好typeof Number(value) === 'number'
      // 否则 大小的比对都是一个false 最后会返回 -Infinity
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  // @ 3.24 同 _.max
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  // @ 3.27 用于打乱 obj 的顺序 获得 一个打乱的arr(valueList) 
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      // @ 3.28 保存 获得的随机数
      // 不用key 是为考虑 obj 为 object的情况
      rand = _.random(index++);
      // @ 3.29 有点意思 每次循环 index += 1
      // 当循环到最后 index 自加到 arr.length / string.leng / _.keys(obj).length
      // shuffled数组也就获得了对应长度的元素
      // 而每一次先将对应位置 设置为已经 / 或 未保存过的随机位置值 
      // 看了下上面的链接  原来叫做洗牌算法
      // 其实这里应该是叫做一种 Knuth-Durstenfeld Shuffle 的升级版  算法的时间复杂度为O(n) 空间复杂度为O(1)
      // 每次从未处理的数据中随机取出一个数字，然后把该数字放在数组的尾部，即数组尾部存放的是已经处理过的数字
      shuffled[index - 1] = shuffled[rand];
      // @ 3.30 随后将随机位置设置为 obj[index - 1]的value
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    // @ 3.32 @mark 真不懂得这guard 是啥用的
    if (n == null || guard) {
      // @ 3.33 obj的情况
      if (obj.length !== +obj.length) obj = _.values(obj);
      // @ 3.34 返回随机的一个value
      return obj[_.random(obj.length - 1)];
    }
    // @ 3.35 n (数量) 传入的情况下 调用_.shuffle获得随机排列后的数组 再用slice 截取
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  // @ 3.36 闭包中的函数 返回一个函数
  var lookupIterator = function(value) {
    // @ 3.37 不传递参数情况下 返回 function (value) { return value; }
    if (value == null) return _.identity;
    // @ 3.38 value 为func 返回func 的引用
    if (_.isFunction(value)) return value;
    // @ 3.39 否则返回 一个接受 obj参数的 func ==> function (obj) { return obj[value]; }
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    // @ 4.01 貌似比较复杂的一个函数 印象中也挺讨厌各种排序的
    // 通过 lookupIterator 获得一个对应的函数  iterator 可接受的： undefined / func / key(string)
    iterator = lookupIterator(iterator);
    // @ 4.02 双重_.map (_.pluck 内部还有一层map调用)
    // 第一重 通过_.map返回 一个 a 函数调用完返回的 对象数组
    // 
    //        参数位置的iterator   获得的对应criteria属性值
    //        undefined            value
    //        func                 func return value
    //        key(string)          obj[key] return value
    //        之后再经过sort方法 再排序加工
    return _.pluck(_.map(obj, function(value, index, list) { // @4.03 暂且称此函数为a
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      // @ 4.04 先比对criteria 即iterator返回值
      if (a !== b) {
        // @ 4.05 sort 接受的函数 可接收两个参数 分别是 left 和 right
        // 函数的返回值 > 0 表明需要 更换位置
        // 含糊的返回值 < 0 表明不需要更换位置
        // 通常情况下 一般只传递 function (left, right) { return left - right; }
        // 表示 如果 left > right 需要调换位置  即 从小到大
        // 如果 a > b 或a === undefined 返回 1 表示 undefined 排最前 然后按照 iterator 返回值 从小到大排序
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      // @ 4.06 如果a === b 即返回值相等
      // 比对 index  从小到大 即出现的顺序排序
      return left.index - right.index;
    // @ 4.07 第二重 _.map 
    // _.pluck 接受value 参数 获得一个 function (obj) { return obj['value']}的函数 传递给_.map
    // 其实就是再调用一次map 循环 上面 排序完的 对象数组
    // 获得 对象数组元素 的 value push 进result 数组再最后返回 排序完的 arr (value list)
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  // @ 5.01 一个helper函数 参数位置传递一个函数 返回一个函数
  // 函数的调用结果是 返回一个 result 对象
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      // @ 5.02 返回的函数 iterator参数位置 传递的参数 再经由闭包中的lookupIterator 处理出一个函数
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        // @ 5.03 循环遍历 将处理后的iterator函数的返回值 作为key
        var key = iterator.call(context, value, index, obj);
        // @ 5.04 再经由闭包 调用 group 传递的behavior 函数  传递 result(引用传递) key value
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  // @ 5.05 调用 group函数 返回一个函数
  // 内部 在每一次循环时 调用 这个behavior匿名函数

  // 官方例子1  _.groupBy([1.3, 2.1, 2.4], function(num){ return Math.floor(num); });
  // 循环调用的结果 获得的key 依次为 1、2、2
  // 在调用 behavior 时 result 依次更新为 { 1: [1.3] }、{ 1: [1.3]  2: [2.1]}、{ 1: [1.3]  2: [2.1, 2.4] }
  
  // 官方例子2 _.groupBy(['one', 'two', 'three'], 'length');
  // lookupIterator 函数经由 lookupIterator 处理为 function (obj) {return obj['length']; }
  // 循环调用的结果 获得的key 依次为 3、3、5
  // 其余同理  
  // underscore 的函数重用率真不是一般的高  闭包的使用  有点登峰造极的感觉
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  // @ 5.06 这里需要注意的是 要确保 lookupIterator 处理后的 iterator 函数调用返回结果(key)不重复  否则result[key] 会被重写
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  // @ 5.07 调用返回的result 的属性为 对应的iterator 的返回值(即key)
  // result[key] 则为调用结果 出现的次数 
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    // @ 5.08 获得 正确的 iterator 函数 func / function (obj) {return obj;} / function (obj) { return obj[ iterator ]; // 此处iterator 为string }
    iterator = lookupIterator(iterator);
    // @ 5.09 obj参数 只是起一个中途的作用 用于iterator 返回结果
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      // @ 5.10 右移一位 学到了 省去了 Math.floor( (low + high) / 2 )这样的操作 而且速度更快 = =
      var mid = (low + high) >>> 1;
      // @ 5.11 循环中 (类似中分)设置 low 和 high
      // low = mid + 1 的操作 一方面 剔除了 mid 这个选项 另一方面 也为跳出循环
      // @mark 另一方面 有点问题 就是 当iterator.call(context, array[mid]) === value 时 执行的是high 依旧进入循环
      // @solve 这是官方对这个方法的释义：
      // Uses a binary search to determine the index at which the value should be inserted into the list in order to maintain the list's sorted order. 
      // If an iterator function is provided, it will be used to compute the sort ranking of each value, including the value you pass. 
      // 这个方法其实是局限的，用途是拿来获取obj 想要 插入 array 的位置
      // 这也就代表着 array 必须是以一定规则排序好的 且必须从小到大！！！

      // 来看个例子 _.sortedIndex([10, 20, 30, 40, 50, 60], 40);
      // low 0 high 6 mid 3 
      // low 0 high 3 mid 1 
      // low 2 high 3 mid 2 
      // 循环中 只要 iterator.call(context, array[mid]) < value 一直执行 low = mid + 1 操作 直到 mid + 1 === high 跳出循环
      // 而当 iterator.call(context, array[mid]) >= value 则只是将 high 设置为mid 再进入循环
      // 这样也确实保证了 获得的 low 是按照次序最后一个小于 value 的位置

      // 而倒序的情况 就不行了
      // 例如_.sortedIndex([8, 7, 6, 5, 4, 3, 2, 1], 3);
      // low 0 high 8 mid 4
      // low 0 high 4 mid 2
      // low 0 high 2 mid 1
      // low 0 high 1 mid 0
      // 因arr[4] > value    high被设置为 4
      // 再循环下去 都是从 0 - 4 的元素 依次做的操作 循环到最后low 还是为0
      
      // 再例如
      // _.sortedIndex([4, 3, 2, 1], 3);
      // low 0 high 4 mid 2
      // low 3 high 4 mid 3
      // 最后返回 4
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    // @ 6.01 复制一份
    if (_.isArray(obj)) return slice.call(obj);
    // @ 6.02 string 利用 _.map
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    // @ 6.03 object
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    // @ 6.04 array / string                          object的情况 _.keys 内部 _.has 剔除原型链上属性 最后返回keyList的length
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  // @ 6.05 guard == true || n == null  ==> return arr[0] / string[0]
  // n 大于 0 的情况下 返回从首个位置开始 n个数量 的元素数组 / string
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  // @ 6.06
  // guard == true || n == null  ==> return arr / str 的复制
  // else 返回从首个位置开始 length - n个数量 的元素数组 / string
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  // @ 6.07 和_.first 恰好相反
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    // @ 6.08 从第length - n个开始截取到尾部  总共n个
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  // @ 6.08 其实就相当于slice.call(arr, n); 当然在n 不传递的情况下 n 为 1
  // 用途想是基本用在 arguments 的情况下 例如 _.rest(arguments)
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  // @ 6.09 有意思 内部调用 _.filter 而filter 内部是利用的predicate 的返回值 if ( predicate.call(etc.) )
  // 即 _.identity 的返回值  而_.identity 内部是直接return value
  // 即 用来剔除了 !!value === false 的value 选项 然后push 进result 数组 最后 返回
  // 例：_.compact([0, 1, false, 2, '', 3]); ==> [1, 2, 3]
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  // @ 6.11 闭包中的一个helper 方法
  var flatten = function(input, shallow, output) {
    // @ 6.12 shallow : 浅 单层
    // _.every(input, _.isArray) input 每项都是一个arr
    if (shallow && _.every(input, _.isArray)) {
      // @ 6.13 利用apply调用的形式传递input数组 直接完成了简单的一层连接
      // 官方例子: _.flatten([1, [2], [3, [[4]]]], true) ==> [1, 2, 3, [[4]]];
      return concat.apply(output, input);
    }
    // @ 6.14 循环遍历 input(可能是 arr / string / object )
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        // @ 6.15 是否‘浅’调用
        // 浅调用    直接使用 apply 调用 传递 value
        // 非浅调用  递归
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        // @ 6.16 value 不是 arr / arg 的情况 直接push
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    // @ 6.17 直接返回 flatten函数 的返回值数组
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    // @ 6.19 直接调用的_.difference 其实是一样的 不过反而不接受一种情形： 直接array 直接传递一个数组的情况
    // 因为此处只进行了 slice的操作 并未进行 [].concat的操作  详见 @ 6.18
    // 如果传递 [1,2,3]  就相当于 _.difference( array, [ [1,2,3] ] );
    // 这也就背离了 _.difference 的调用形式
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    // @ 6.20 循环 根据predicate 函数调用结果 == true 分别将 value push 进 pass fail数组 并最后返回
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    // @ 6.21 去重方法
    // 根据参数的传递 重新分配 变量名
    // isSorted 的参数位置是可传可不传的  不传/或传递的不是函数 默认为false
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    // @ 6.22 是否传递函数的情况 如果有 传递给iterator获得一个处理后的数组 以初始化数据
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      // @ 6.23 
      // isSorted == true
      //    那么使用的方法比较快捷
      //    每一次 将value push 进 seen 然后每一次都以后面的值比对前一个值
      // isSorted == false
      //    调用_.contains 循环遍历seen数组 不存在 则push 存在 则跳过
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        // @ 6.24 之所以设置results 因循环的是initial 循环中的value 是经过iterator函数处理过的
        // 这里就保证了 push 进的是array中的元素
        // @mark 函数写的简略 也有个问题存在 就是如果iterator 函数未传递
        // 那么每次进行push的内容都是一样的 最后 返回的seen 和 results数组 其实拥有一摸一样的数组项
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    // @ 6.25 先调用_.flatten 传递 arguments 和一个 true 平铺一层出来 获得一个arr
    // 再调用_.unip 进行去重 未传递isSorted  内部 会调用两重循环
    // 例：_.union([1, 2, 3], [101, 2, 1, 10], [2, 1]); ==> [1, 2, 3, 101, 10]
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  // @ 6.26 卧槽 有点叼呢 四个函数的调用 想想内部有多少个循环
  _.intersection = function(array) {
    // @ 6.27 获取其他参数
    var rest = slice.call(arguments, 1);
    // @ 6.28 _.uniq 先对array进行去重 未传递 isSorted 内部有两重循环
    // _.filter 循环 _.uniq 去重后的数组 根据 func1 的返回值 push value 进 result 数组
    return _.filter(_.uniq(array), function(item) { // func1
      // @ 6.29 func1 返回值的判定 循环 rest数组 (第四重循环) 
      // // 不过 _.every 内部会根据 一次 func 2的返回值 为false 而 return 出来
      return _.every(rest, function(other) { // func 2
        // @ 6.30 func2 返回值的判定   _.contains 内部又是重循环(第五重) 使用 _.some 也会根据 一个 other[key] === item 的判定 而return出来
        // 怎么说呢，到底是五重循环 真是有点恐怖
        return _.contains(other, item);
      });
    });
    // @ 6.31 最后返回的arr 是 几个 arr中 都存在的数值
    // 例： _.intersection([1, 2, 3], [101, 2, 1, 10], [2, 1]); ==> [1, 2]
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    // @ 6.18 ArrayProto 其实就是一个[] 之所以这样 估计是为节省 创建一个 []的开销
    // slice.call(arguments, 1) 倒也可以换成 _.rest(arguments); 不过_.rest内部多了一些判断
    // @mark 当然 这里我不明白的是 为何还用一个[] 来对一个 slice.call(arguments, 1) 数组进行一份复制
    // @solve [].concat(1,2,3) ==> [1,2,3]
    //        [].concat([1,2,3]) ==> [1,2,3]
    // 这么写 也就可以使得在array 之后的参数可以以一个个的形式 或者 一个数组的形式传递
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    // @ 6.19 直接利用_.filter 返回一个新数组 而filter内部利用的是each 将符合这个函数过滤的value push 进result数组
    // 过滤的判断是利用_.contains 内部有一个_.some的循环 循环rest 数组
    // 这里的作用也就相当于 两层循环 第一层循环 array  第二层循环rest 将v1 和 v2 以此比对
    // 如果v1 和 v2 都不相等 则 将 v1 push 进 result
    
    // _.difference([1, 2, 3, 4, 5], [5, 2, 10]); ==> [1, 3, 4]
    // _.difference([1, 2, 3, 4, 5], 5, 2, 10); ==> [1, 3, 4]
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    // @ 7.01 调用_.pluck 内部调用 _.map 依次获取 数组的length push 进 result数组 并在最后concat 0
    // 之所以concat 0 是为避免_.pluck 获得的数组为空的情形 即 _.max 内部 一个Math.max.apply(Math, []) 时，其返回的值是 -Infinity
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      // @ 7.02 一个特别技巧 循环次数为最大的数组length
      // 然后 每一次添加的数组项 是调用每一个_.map返回的数组 而传递的 i又作为了key 
      // 因此results数组的每一项 对应的数组 其每一项的值 都是arguments位置传递来的数组key对应位置的值
      // 例： _.zip(['moe', 'larry', 'curly'], [30, 40, 50], [true, false, false]); 
      // ==> [["moe", 30, true], ["larry", 40, false], ["curly", 50, false]]
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      // @ 7.03 argurmtents 接受两种情形 
      // situation1: list和values参数  [key1, key2], [value1, value2]
      // situation2: 一个list参数      [ [key1, value1], [key2, value2] ]
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**), // @ 7.04 笑尿
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      // @ 7.04 这里的逻辑有点叼呢  如果 isSorted 参数位置传入的是个number
      // 只设定 相应的 开始搜索位置 i (还可接受负数)
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        // @ 7.05 如果传递的不是一个数字  并且是已经通过了 if (isSorted) 的判定
        // 需要注意的是 这时的array 必须是以一定规则从小到大排序好的
        // 那么利用_.sortedIndex 找到item该插入的位置 也就是item 所在的位置 并进行比对返回 i 或 -1
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    // @ 7.06 另一方面 其他逻辑 以及上面设定完i后的逻辑都走入下面
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    // @ 7.07 Array.prototype.indexOf 不存在的情况下只好利用循环
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    // @ 7.08 确实不错 尽管 lastIndexOf 没有现有的函数可使用
    // 但是使用while循环 以及i--的形式 那么也就确定了是从后开始遍历  并且少了一两个判断
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  // @ 7.09 来自python 值得拥有 orz
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    // @ 1.29 Function.prototype.bind
    // 返回一个指定了this 的 函数
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    // @ 1.30 获得参数func, context 以外的参数
    args = slice.call(arguments, 2);
    // @ 1.31 还真有点叼呢 这个bind 在 Function.prototype.bind 不存在的情况下
    // @ 1.32 返回的这个bound函数还接受两种情况 一个是函数调用  一个是构造函数new式调用
    return bound = function() {
      // @ 1.33 简单函数调用情况 指定this 为context
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      // @ 1.34 构造函数形式调用情况 也就不管context什么事了
      // 之所以在构造函数情况不直接return func 为避免_.bind(func) 返回的函数是一个引用而在一些情况下被修改
      // 闭包中的ctor函数 指定 prototype对象为func.prototype 即同一个 模拟 构造函数的场景
      ctor.prototype = func.prototype;
      var self = new ctor;
      // @ 1.35 在实例生成完之后 self原型链上拥有了func.prototype将ctor.prototype上的属性重置
      ctor.prototype = null;
      // @ 1.36 传递参数 再将构造函数func 中的this.name 这类 整合进 self对象 
      // 如果构造函数有apply调用下有返回值(比如安全模式 内部 return new / 或者内部return 打断)的情况
      var result = func.apply(self, args.concat(slice.call(arguments)));
      // @ 1.37 其实这里可以用_.isObject的  毕竟实现是一模一样
      if (Object(result) === result) return result;
      // @ 1.38 否则 返回self对象 且已经整合进实例属性的self对象
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  // @ 8.01 用于整合出一个指定了相应参数(已传递)的 新函数  可以接受新的参数
  // 用于放在原函数参数的后面
  // 例：var add = function(a, b) { return a + b; };
  //     var add5 = _.partial(add, 5);  // 指定了第一个参数位置传递的为5
  //     add5(10); ==> 15;
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      // @ 8.02 复制 boundArgs
      var args = boundArgs.slice();
      // @ 8.03 进一步处理 为照顾参数传递_(内部调用)的情况 如果_.partial 参数位置传递了一个 _
      // 过滤掉 并将参数设置为 返回的函数传入的参数
      // @ mark 这样 有一点问题就是
      // var func2 = _.partial(func, _, 1) 
      // 最终执行func2(2, 3) 时  等同于 func(2, 1, 3)  而不是func(1, 2, 3)
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  // @ 8.04 将obj上的传递名称方法重写 强行绑定this 到 obj上 this的改变而改变
  // 例： var a = {name : 'A', show : function () { console.log(this.name);} }
  //      a.show() ==> 'A'
  //      var b = a.show; b(); ==> undefined (this 为 window)
  //      _.bindAll(a, 'show');
  //      var c = a.show; c(); ==> 'A' (this 为 a)
  //      var d = {name : 'D', show : a.show }  d.show() ==> 'A' (this 还是 a)
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    // @ 8.05 一个循环 将参数obj后所有的字符串 通过_.bind 返回一个函数 绑定this 为 obj
    // 返回的函数 this 是已经被指定了的  内部也没有了this 而是 _.bind内部返回的 bound函数的代码 或者 ES 5 的function () { [native code] }
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    // @ 8.06 最后返回改造好后的对象 其实也无所谓返回不返回了  这个对象已经被改造了 (引用)
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
    // @ 8.07 hasher 函数用于对 返回的函数调用时候的 this 做处理, 处理出key 
      var key = hasher.apply(this, arguments);
      // @ 8.08 高  返回的函数 其实和传递的func 调用形式是一样
      // 第一次调用 进入 false 逻辑 执行memo[key] = func.apply(this, arguments) 并将调用结果保存到闭包中的 memo[key]上
      // 之后再调用 而不是调用函数 直接获取 闭包中的memo[key] 返回
      // 用途在于 记录 获取一次结果消耗很大的函数
      // @mark 也有一个问题在于 为何要用这么复杂的方式来保存函数  毕竟下一次调用函数从 memo上取
      //       而如果要获取新的调用结果  需要 修改hasher 函数 / 或者在没有hasher函数情况下 修改返回的函数的第一个参数 (作为key)
      //       其实 可以的话  直接不调用这个函数  而用一个变量保存结果 如果需要重新调用  再用一个变量保存即可  这个函数在一般情况下是根本用不到的
      //       当然 官方给出了这样一个例子，有点神
      //       var fibonacci = _.memoize(function(n) {return n < 2 ? n: fibonacci(n - 1) + fibonacci(n - 2); });
      //       这就不是一般的复杂 又是递归又是闭包的 fibonacci函数还是 ‘原来’的fibonacci函数 调用都没变
      //       只是 每次递归时候 传递 n - 1 、 n - 2 不再通过递归、再递归重新计算 而是直接取的 memo[n-1] meomo[n-2]  
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    // @ 8.09 延迟执行func 延迟时间为wait
    // 这里返回值是定时器的返回值  根据 chrome 调试结果来看  定时器的返回值是一个number  对应页面执行开始的定时器第几个
    // @mark return func.apply(null, args); 的这个返回值 应该是获取不到的
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    // @ 8.10 调用_.delay 传递 1ms 的延时
    // 其实也就是 _.delay (func, 1, args...)
    // 用法主要嘛  也是用来延迟执行
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  // @ 8.26 再走一遍逻辑 这个节流函数确实很棒  特别是在短时间内连续调用函数的情况下 比如 scroll事件
  // 再次注明:    options 的leading 和 trailing 不能同时为false
  // situation1:  leading !== false && trailing !== false
  //              retFunc第一次调用立即执行参数func  第二次如果在wait时间间隔内内调用则设置一个定时器  时间间隔中又调用的话返回result  
  //              而在定时器中func 执行完之后的再次调用 又是立即执行func   亦即是 如果在非常短的间隔内连续调用 例如 scroll事件  其会在定时器时间到时连续调用两次func
  // situation2:  leading === false && trailing !== false
  //              retFunc第一次调用就设置定时器  时间间隔内调用retFunc 则直接返回result
  // situation3:  leading !== false && trailing === false  
  //              retFunc第一次调用时立即执行   在时间间隔内调用 直接返回result  间隔过后重新启用这个流程  没有了定时器的部分      
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
    // @ 8.21 延迟调用的过程中 重新设置 previous
    // 未使得retFunc wait间隔后下次调用时  进入 if (!previous && options.leading === false) 设置previous = now  使得remaining > 0 从而不立即执行函数
    // 也就表示 leading === false 时， 每次retFunc 执行， 在上一个定时器结束之后 不是立即执行新的函数 而是重新设置一个定时器
      previous = options.leading === false ? 0 : _.now();
      // @ 8.22 将闭包中的timeout 清除
      // 那么 wait时间未到 / later函数调用前 调用了retFunc 因闭包的timeout被设置为之前的定时器返回值 并不会进入 else if 那个逻辑
      // 也就不会设置定时器执行函数
      timeout = null;
      // @ 8.23 设置闭包中result
      result = func.apply(context, args);
      // @ 8.24 清除闭包中的引用  垃圾回收
      context = args = null;
    };
    // @ 8.12 返回的函数  暂且称为 retFunc
    return function() {
      // @ 8.13 _.now() 获得当前时间戳
      var now = _.now();
      // @ 8.14 之所以这样判断 因返回的函数调用时 闭包中的 previous 会改变
      // 如果符合 将previous 设置为now 以获得 now - previous === 0 的结果  (第一次调用时 且options.leading === false)
      if (!previous && options.leading === false) previous = now;
      // @ 8.15 剩余时间 ms
      // 在  options.leading !== false 的情况下 previous === 0 那么，remaining为一个负数
      var remaining = wait - (now - previous);
      context = this;
      // @ 8.16 保存参数
      args = arguments;
      // @ 8.17 那么，remaining为负数 / 即options.leading !== false 且 previous === 0 的retFunc第一次调用情况下
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        // @ 8.18 更新previous为当前时间戳
        previous = now;
        // @ 8.19 立即执行函数 然后设置result 返回值
        result = func.apply(context, args);
        context = args = null;
      // @ 8.20 而在wait > 0  、options.trailing !== false 
      // 并且   不是在上一次定时器调用完成前(!timeout) 的调用情况下 进入逻辑
      // 设置一个延时 延迟调用later函数  延迟时间其实就是wait
      // 需要注意的是 options trailing设置为false 时， leading 一定不能为false
      // 因为leading 为false 导致 remaining > 0 跳过了上面的if 逻辑
      // 而trailing 为 false 使得这个else if 逻辑也进入不了
      // func 根本不会执行  result 则为undefined
      // 例： var a = _.throttle(function () { alert(1); return Date.now(); }, 2000, { leading : false, trailing : false }); a();  alert是出不来的
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      // @ 8.25 在retFunc连续执行(间隔小于wait) 当前later未调用 返回之前later中 func 的返回值
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  // @ 9.08         以实际参数过流程 应该会更清晰点
  // @ situation1:  参数 func, 1000, (immediate == true)
  //                0ms时开始调用debFunc 先设置1000ms的延时调用later 之后立即调用 func 返回result
  //                100ms时调用debFunc timeout 已被设置 直接返回result 只是更新了 timestamp 为1ms时的时间戳
  //                1000ms时 定时器的时间到达 调用later 此时 (last = 900ms) < 1000ms 
  //                此时 之所以还要进行 timeout = setTimeout(later, wait - last); 设置 100ms的延时调用later 因为 100ms时候调用过了一次debFunc 返回过了一次result
  //                但是 (immediate == true)情况下 定时器执行到最后 later函数中也只是将timeout置为null罢了 并不会调用func
  //                因此定时器也就只是用来计算时间 在wait 时间到以后  再调用retFunc 会执行func函数罢了
  // @ situation2:  参数 func, 1000, (immediate == false)
  //                0ms时开始调用debFunc 先设置1000ms的延时调用later
  //                100ms时调用debFunc timeout 已被设置 直接返回result 只是更新了 timestamp 为1ms时的时间戳
  //                1000ms时 定时器的时间到达 调用later 此时 (last = 900ms) < 1000ms 
  //                此时 之所以还要进行 timeout = setTimeout(later, wait - last); 设置 100ms的延时调用later 因为 100ms时候调用过了一次debFunc 返回过了一次result
  //                时间到了以后  调用func 仅做更新result操作  在下次调用debFunc 才返回这个result
  //『其实基本一样  
  // situation1:    是每次一开始调用debFunc 就调用func函数更新result 返回结果
  // situation2:    是每次一开始调用debFunc 都设置一个定时器  定时器时间到了 执行一遍func函数 更新result 到下次调用debFunc才返回result
  // 而在wait时间间隔内 都是返回的之前的result
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      // @ 9.07 正常情况下定时器调用的函数 在调用前  被其他函数调用抢占了的话
      // 即 原本设置 wait ms 的延时调用  那么理想情况下 _.now - timestamp === wait
      // last 肯定是会大于wait的
      // 而这里之所以存在last < wait的情况 
      // 因为timestamp 存在于闭包中  每一次调用debFunc 在一开始 即 @9.02处 其将timestamp更新为新的时间戳
      // 使得 在wait时间间隔内 连续调用debFunc 时 last 越来越小
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };
    // @ 9.01 返回的函数 暂称为 debFunc
    return function() {
      context = this;
      args = arguments;
      // @ 9.02 当前时间戳
      timestamp = _.now();
      // @ 9.03 immediate == true 且 timeout 为 null 或 undefined
      var callNow = immediate && !timeout;
      // @ 9.04 debFunc第一次调用 或者 在定时器调用的函数执行完成以后 调用debFunc
      if (!timeout) {
        // @ 9.05 设置定时器 间隔 wait ms  调用闭包中的later函数
        timeout = setTimeout(later, wait);
      }
      // @ 9.06 同时 如果 immediate == true  立即执行func 函数一次  而上面的定时器还是设置的
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  // @ 9.09 闭包保存调用结果
  // 第一次调用_.once 返回的function 其调用之后 将ran置为true 调用一次func并将memo设置为func的返回值
  // 在第二次调用function时 不再执行func  而是只返回原来的调用结果
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  // @ 9.10 调用_.partial 传递wrapper, func 返回的函数 其实是一个wrapper函数指定了第一个参数位置为func (再传递的参数依次放到后面)
  // 官方例子：var hello = function(name) { return "hello: " + name; };  hello2 = _.wrap(hello, function(func) {return "before, " + func("moe") + ", after"; });
  // 其实等同于 function (hello) { return "before, " + hello("moe") + ", after"; }
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      // @ 9.11 这里可写成
      // for (var i = funcs.length; i--; ) {
      for (var i = funcs.length - 1; i >= 0; i--) {
        // @ 9.12 卧槽 有点吊呢  在循环中 不断更新args 并且利用原来的值
        // 这里的意思就比较明显了  依次从闭包中最后的函数开始执行 执行后的返回值作为参数传递给前一个函数
        // 直到所有函数执行完毕
        args = [funcs[i].apply(this, args)];
      }
      // @ 9.13 最后返回所有函数调用完成的返回值
      // 官方例子：
      // var greet    = function(name){ return "hi: " + name; };
      // var exclaim  = function(statement){ return statement.toUpperCase() + "!"; };
      // var welcome = _.compose(greet, exclaim);
      // welcome('moe'); ==> 'hi: MOE!'
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      // @ 9.14 返回的函数调用times次之后 闭包中的times 依次递减到0之后，之后每次的调用 才会调用func 并返回结果
      // 前置自减 在语句开始前执行 也就是减完以后进行比对  当然 前置减号称是更快的 因为减少了一次判断(照搬高级程序设计一书中所述)
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  // @ 1.19 获取keyLists 数组
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    // @1.20 Object.keys()
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    // @1.21 利用 _.has中的hasOwnProperty 剔除原型链上的属性
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    // @ 3.31 获取obj 的keyLists
    var keys = _.keys(obj);
    var length = keys.length;
    // @mark 居然用new Array的形式 = =
    // 可能意图是作为初始化直接设置了数组的长度  之后只是赋值 而不再是数组操作
    // var a = new Array(8); 和  var a = []; a.length = 8;其实类似的
    // 获得的 都是 [undefined x 8] 读取length属性 返回 8
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  // @ 9.15 返回一个数组 数组项分别是一个[key, value]的数组
  // 内部执行了两次循环  _.keys一次循环  for循环一次
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  // @ 9.16 将obj 的key 和value 对换下 返回这个新对象result
  // 需要注意的是 obj 的value 不能是引用值 否则获得的result的key 有可能就是'[object Object]' / '[object Array]'等
  // 估计将对象作为key时 默认进行了toString操作
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  // @ 9.17 获得一个对象上的方法名列表 
  // 注意 未剔除原型链上的方法
  // 倒是发现个有趣的事情:
  // var a = {};  for (var i in a) {console.log(i); }
  // for in 循环 竟然循环不了空白对象的属性 
  // @mark 可能是空白对象{} 自身没有属性 并且访问不了原型链的缘故 / (访问不了__proto__属性)
  // 最后返回的数组还是简单排了下序的 = = 么么哒
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  // @ 10.01 对象扩展方法
  _.extend = function(obj) {
    // @ 10.02 循环 arguments[0] 以后的参数
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        // @ 10.03 这里 会整合进source 原型链上的属性和方法
        // 如果属性和方法是引用值  直接保存的引用
        // 然后 如果source是一个string  = =
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    // @ 10.04 ArrayProto 其实就是一个空数组 [] 前面已说过了 估计是不想再重新创建一个空数组还是怎样 直接利用了这个变量
    // 并且可接受1,2,3,4 或者 [1,2], [3,4]这样的参数形式
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      // @ 10.05 引用值 依然是以引用 保存的
      // 注意：这里包含原型上的属性和方法
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
   // @ 10.06 刚好和_.pick相反  返回不包含 keyList 的对象
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    // @ 10.07 注意： 这里返回的copy对象也包含obj原型上的属性和方法
    return copy;
  };

  // Fill in a given object with default properties.
  // @ 10.08 只有在 obj 属性 undefined的情况下 才将source的属性放入
  // 需要注意的是  _.defaults({}, { a: 1 }, { a: 2 } ) ==> {a : 1}
  // 因循环第一个参数时 获得了 a属性的属性值为1
  // 循环第二个参数时 也就不再赋值
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    // @ 11.01 not object return 
    if (!_.isObject(obj)) return obj;
    // @ 11.02 array slice copy
    // object --> 直接调用extend 做简单“复制”
    // 如果属性是引用值 保存的引用
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  // @ 11.03 简单传递obj 给interceptor函数处理后返回
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  // @ 11.04 渣翻 内部递归比较函数`isEqual`。
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // @ 11.05 渣翻 相同的对象是相等的。 `0===-0`，但它们不相同。
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    // @ 11.06  1 / 0 --> Infinity   and  1 / -0 --> -Infinity
    // 这应该算是语言设计的一种错误还是什么 = =
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    // @ 11.07 这部分用于严格 null 和 undefined 的比对
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    // @ 11.08 获得正确的值 / 引用值
    // 因如果 a / b 以这样的形式调用过 _  a = _(a);
    // a 被设置为一个对象 其_wrapped 属性被设置为原来的a变量 
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    // @ 11.09 先经过第一层过滤 类型不同 怎么谈恋爱
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      // @ 11.10 字符串 / 数字 / 日期 / 布尔 类型使用基于值的比较
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        // @ 11.11 String包装 / 也可以利用 a == a.toString()
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        // @ 11.12 NaN 情况
        // (1) a 是 NaN 则 进入 b != +b 逻辑
        // 如果 b 也是NaN  则返回true 也即是说  这里的判定 针对 NaN 和NaN 返回的是true
        // 如果 b 不是NaN  则返回false
        // (2) a 不是 NaN  则进入 (a == 0 ? 1 / a == 1 / b : a == +b) 逻辑
        // 这里面 又单独做了 0 的情况  而这里之所以跟一开始貌似重复了
        // 大概是为避免 instanceof _ 的情况
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        // @ 11.13 日期对象通过 + 获得毫秒数 进行比对
        // 布尔型 则通过 + 强制类型转换为 1 0进行比对
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        // @ 11.14 正则情况 通过对象的相应属性进行比对
        // 类似 a = /123^4/gi
        // a.source --> '123^4' (相应匹配的字符串形式)
        // a.global --> true (全局 g标识)
        // a.multiline --> false (是否多行匹配)
        // a.ignoreCase --> true (是否忽略大小写的 i标识)
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    // @ 11.15 引用值 在一开始 进行了 a === b的引用值判定
    // 其他情况 例如 function的情况  如果不是同一个引用 则return false
    // @mark 这里还有一种情况 两个完全相同但不是同一个引用的function 返回的是false
    // 这里 还有另一种形式让其返回true  例如 a = function () {alert(1)}; b =  function () {alert(1)};
    // return a.toString() === b.toString()
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    // @ 12.10 @mark 
    // 这部分 貌似找不到这个线性搜索相应的逻辑情况
    // 因为通过递归传递过来时 aStack的最后一个元素是一个 a
    // 而 递归传递过来的 (a)  则是 a下面的一个属性对象
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    // @ 12.01
    // constructor 比对 为防止某个对象的constructor属性经过重写 或者不是同一个构造函数
    // (1)  如果constructor 相同 即 同一个构造函数 / 或者重写为一个原始值  则跳过逻辑
    // (2)  不是同一个构造函数
    //      (2.1) 只要其中一个constructor不是函数 就进入逻辑 返回false
    //      (2.2) aCtor instanceof aCtor  针对 var A = function () {}; var a = new A();
    //            这类的情况  那么a.constructor instanceof a.constructor --> false 进入逻辑  即代表构造函数不是同一个引用
    // (3)  @mark 这里的'constructor' in a 的判断 是否没必要
    //      既然经过上面的层层过滤 留下的a, b 必然是一个object 或者array 
    //      并且无论如何delete 或者 做其他操作  a b 的constructor 永远都是存在的  也就是恒等于true
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    // @ 12.02 堆栈
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      // @ 12.04 这里先判断了 数组个数是否一致  不一致则不进入逻辑 并在最后返回
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // @ 12.05 递归 aStack bStack 引用值的传递 
          // 循环 从最后位置开始 如果 数组相应位置元素 不合要求(返回false) 则在中间跳出循环
          // 这里 有个小细节  每次比对进行到最后  堆栈中推入的内容 在返回result之前 都会推出去pop
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    // @ 12.06 object 情况
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          // @ 12.07 如果 b 不包含a所包含的属性 返回false
          //   而如果有对应的属性 则递归 比对对应的元素
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          // @ 12.08 这里 比较牛  利用了后置自减的特性
          // 这是为防止 a的属性 在 b中都能找到  类似 a 是b子集的情况
          // 通过再一次循环b 进行size自减到0 其实循环了 (size + 1)次
          if (_.has(b, key) && !(size--)) break;
        }
        // @ 12.09 在break的情况下 size 被设置为 -1
        // 这里其实比较绕  
        // 感觉如果在一开始情况下先判断 _.keys(a).length !== _.keys(b).length 会更方便
        // 当然会多一层循环(_.keys内部) 不过会少一些这里的判断(这里先判断了元素 再判断个数)
        // 再来说后置操作符
        // 在上面a的循环中 size 循环了 _.keys(a).length次 (aLen)
        // 而在b的循环中  判断是直接使用的!(size--)
        // 第一次的循环 其size 是aLen
        // 如果是到了break的情况  那么size必然到达0  而b的实际循环则已经执行了 aLen + 1次
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  // @ 13.01 判断一个对象 / 数组是否为空
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  // @ 13.01 判断是否一个dom元素节点
  // 这里其实有一个变态的地方 var a = {nodeType : 1};
  // _.isElement(a) ==> true
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  // @ 3.20 利用ES 5 的Array.isArray / toString.call
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  // @1.18 有意思 用一个Object的构造函数包装
  // 在此 估计Object内部 也有那么一个类似的 if (obj instanceof Object) return obj;
  // 因为除了简单类型外的 所有的对象 都是继承自Object
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
  // @13.02 通过一个循环指定初始的相应判定函数
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  // @ 补充: 这里先是已经指定了_.isArguments 并用它对最外层的匿名的arguments进行验证
  // 实在是妙   如果验证不成功  再利用arguments.callee属性 仅仅作为IE 部分  因此也就没有了ES 5 那部分的问题
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      // @ 6.10 之前一直有点想不明白 arguments 是怎么判定的
      // 原来只是利用了 arguments.callee
      // 但是 有点问题就是 ES 5 strict 下 arguments.callee 是不能访问的
      // TypeError: 'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  // @ 3.13 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
  // typeof /s/ === 'function'; // Chrome 1-12 Non-conform to ECMAScript 5.1
  // typeof alert === 'object'  // IE 6 / 7 / 8  alert / confirm etc.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  // @13.03 判断一个数值是否有限(不是Infinity / -Infinity)
  // isFinite() 内部会先执行一个Number转成数值
  // @mark 关于第二个判断  未找到 isFinite(obj) --> true 以及 parseFloat(obj) --> NaN 的情况
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  // @13.04 这里和普通的NaN不同 而是严格的NaN
  // typeof NaN --> Number
  // window.isNaN({}) --> true
  // window.isNaN('1312') --> false
  // isNaN 内部其实有一个类似Number的操作
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  // @13.05 
  // @mark 这里也没有找到一个布尔值不是true 和false 的情况
  // 那么这里第三个判断是作何用处
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  // @13.06 null 判断
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  // @13.07 因为undefined 在一些版本浏览器中是可以被复制的
  // 而void 0 则严格返回一个undefined
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  // @ 1.21 即obj.hasOwnProperty(key) 剔除原型上的属性和方法
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  // @ 13.08 防冲突方法
  // root 在一开始指向的是外部的this 浏览器中为window
  // previousUnderscore 是原来的变量
  // 而在函数中返回的this 因noConflict是闭包中_的方法  最后返回出来的即是underscore 
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  // @ 3.01 google翻译: 保持恒等函数各地的默认迭代器
  // @mark 没明白什么意思 但是经常用到的是将一个参数(函数) 未传的情况下 将函数指定为这个函数以来调用
  // @solve 因为 参数位置期待的是一个函数 而在 未传递参数的情况下  使用_.identity 返回一个函数  也就避免了很多判断 / 充斥if else 的情形
  _.identity = function(value) {
    return value;
  };

  // @13.09 返回一个函数 返回的函数调用的结果是返回传递给_.constant的参数
  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  // @ 3.15 调用形式类似 var a = _.property(key); a(obj)
  // 感觉是有点绕 其实就是获得一个指定key 的函数 接受一个obj 作为参数
  // 返回的函数的作用就是获取 obj上key的value
  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    // @ 3.17 返回 指定了 attrs的 一个函数
    // 返回的函数 用于obj 和 attrs 这两个对象的属性比对
    // 原型上的属性也包含在内
    // 如果传递的数组，那么必须key的位置也对应
    // 此外 还有种情况 _.matches([1,2,3])({0:1,1:2,2:3}) ==> true
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    // @13.10 用Array构造函数创建一个数组 有new 和无new是一样的 内部应该也是一个安全模式的创建
    var accum = Array(Math.max(0, n));
    // @13.11 执行n次iterator函数 每次接受不同的i参数
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    // @13.12 最后返回这个结果数组
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  // @ 3.25 返回min max 之间(包括min max)的数值
  _.random = function(min, max) {
    // @ 3.26 如果不传递max min 从0 开始 max = min
    // @problem 如果只传递一个负数 那么这个负数是不被包含在内的
    /*if (max == null) {
      if (min > 0) {
        max = min;
        min = 0;
      } else {
        max = 0;
      }
    }*/
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  // @ 8.11 棒棒的 原来还有 Date.now 这样一个内置函数
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  // @ 13.13 google翻译：HTML实体的转义名单
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  // @13.14 通过 _.invert 返回一个数组 其key 和value 和entityMap 位置相反
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };
  // @13.14 即
  // var entityRegexes = {
  //   escape: /[&<>"']/g,  //  @mark 这里为何不用 /&|<|>|"|'/g  难道 /[&<>"']/g 速度更快吗 还是字符数量少了 = =
  //   unescape: /(&amp;|&lt;|&gt;|&quot;|&#x27;)/g
  // };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
  // @13.15 通过循环设置_.escape 和 unescape
    _[method] = function(string) {
      if (string == null) return '';
      // @13.16 利用 '' + string 将参数转换为字符串
      // 这里利用replace参数位置接受函数的特性 非常棒
      // match参数 是由replace 方法传递过来的匹配字符串
      // 而函数的返回值则作为 替换的字符串
      // 这里利用了method 和match 这么简短的代码  做了那么多处理 实在高
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  // @ 13.17 返回一个object的propery属性 如果其是一个方法 则将其绑定在object上调用一次并返回其结果
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    // @13.18 通过 _.functions 获得 obj上的方法名列表 (包括原型链)
    each(_.functions(obj), function(name) {
      // @ 13.19 underscore 构造函数上的(自有) 方法直接指向的obj上的引用方法
      var func = _[name] = obj[name];
      // @ 13.20 underscore类型 原型链上的同名方法
      _.prototype[name] = function() {
        // @ 13.21 先获得 调用 _ 创建对象时参数位置传入的 obj 
        var args = [this._wrapped];
        // @ 13.22 这里的push.apply 将参数合并到args数组中 
        push.apply(args, arguments);
        // @ 13.23 这里的result是闭包中的result函数 见 @13.26
        // 这里通过call调用 this 被指向当前对象（_的实例）
        // 并将 闭包中的func 即obj上的方法(接受args 第一个位置是this._wrapped) 绑定在 _ 上的调用结果 传递给result
        // 而在result函数中 @13.26 还做了一步判断
        // 根据this._chain是否为true 来返回相应的返回值
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    // @ 13.30 idCounter 是这个闭包中的
    // 因此每一次调用获得的 idCounter 都是自加 并且都不相同
    // 并且提供prefix
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g, // @13.32 所有字符的匹配还可使用 /<%(.+?)%>/g
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  // @13.33 保证不匹配任意字符串
  // 正则释义 是 在字符串开始前有一个任意字符(不可能存在)
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };
  // @ 4.08 特殊字符
  //  /
  //  '
  //  \r          回车        行结束符
  //  \n          换行符      行结束符
  //  \t          tab         空格
  //  \u2028      行分隔符    行结束符
  //  \u2029      段落分隔符  行结束符
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // @14.01 google翻译：JavaScript的微型模板，类似于**John Resig**的实现。
  _.template = function(text, data, settings) {
    var render;
    // @14.02 利用提供 settings 供用户自设模板
    // 如果没有相应的配置 使用默认的模板配置
    // _.defaults 先循环settings 将相应属性放置进去  再循环_.templateSettings对象
    // 如果属性不存在  再设置进去对应属性
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    // @14.03 如果用户的默认配置相应的属性 例如 escape 为 false / 0 / null .. 
    // 则使用默认的不匹配任何字符串的正则 noMatch
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');
    // @14.04 如果用户settings 不传  默认的matcher 为  /<%-([\s\S]+?)%>|<%=([\s\S]+?)%>|<%([\s\S]+?)%>|$/g

    // test.1:
    // '1313131231'.replace(/<%-([\s\S]+?)%>|<%=([\s\S]+?)%>|<%([\s\S]+?)%>|$/g, function (i) { console.log(i === ''); return 'a'})
    // console --> true
    // return  --> '1313131231a'

    // test.2:
    // '<%-1231231231231%> kkk'.replace(/<%-([\s\S]+?)%>|<%=([\s\S]+?)%>|<%([\s\S]+?)%>|$/g, function (k) { console.log(k); return 'a'})
    // console --> <%-1231231231231%>
    // console --> ''
    // return  --> 'a kkka'

    // 匹配： 1.相关正则 2.结尾  repalce 第二个参数(函数) 接受的match 是相应的匹配
    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    // @14.05 而这里的escape                 / interpolate                         / evaluate 分别对应三个捕获组
    // 即 <%-([\s\S]+?)%> 括号里匹配的内容 / <%=([\s\S]+?)%>括号里匹配的所有内容 /  <%([\s\S]+?)%>括号里匹配的所有内容
    // 至于+? 这样的正则写法  是为尽可能少的匹配  避免正则直接贪婪匹配到最后
    // offset 是相应的匹配到的字符串的index(位置)
    // 因正则最后一个$ 故最后还会进行一次这个匿名函数  获得的escape / interpolate / evaluate 都是undefined  而最后的index 是text的length
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      // @ 14.06 replace并不改变原字符串
      // 故而在外层replace中
      // 每一次 从text 的index 截取到 offset(offset不包含在内)  后面会更新index
      source += text.slice(index, offset)
        // @4.07 再进行一层替换  将匹配到的文本 进行特殊字符的转义
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      // @ 14.09 分别根据不同的匹配 设置不同的字符串并添加到source上
      // 这里也就表明  匹配以外的内容通过 上面的 slice 和 replace 添加到 source
      // 而匹配到的内容 则通过下面添加到source上  注意一开始"__p+='" 最后的单引号
      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      // 14.10 更新index 从上次的匹配位置 到匹配到的长度 相加
      index = offset + match.length;
      return match;
    });
    source += "';\n";
    // @ 15.01 举个官方的例子来说
    // var list = "<% _.each(people, function(name) { %> <li><%= name %></li> <% }); %>";
    // _.template(list, {people: ['moe', 'curly', 'larry']});
    // 
    // list字符串一开始进入 replace 开头就被匹配了 offset为0  source += ''; @14.06
    // 再然后 进入 evaluate 逻辑 因为其获得了这个匹配组，不是underfined 而是一个字符串
    // source 变成 " __p+='';_.each(people, function(name) { __p+=' "
    // 然后又是没有匹配的  <li>  source 变成 " __p+='';_.each(people, function(name) { __p+=' <li>"
    // 之后又进入匹配  interpolate 的捕获组  依次类推
    // 最后source 是这样的  当然 还是字符串
    // __p+='';
    //  _.each(people, function(name) { 
    // __p+=' <li>'+
    // ((__t=( name ))==null?'':__t)+
    // '</li> ';
    //  }); 
    // __p+='';

    // If a variable is not specified, place data values in local scope.
    // @15.02 如果没有设置特殊的变量名称  则使用with语句
    // 当然这里还只是字符串添加  这部分的作用会在下面给出
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
    // @ 15.03 这里开始进行渲染函数的构建了  使用new Function的形式
    // 而在上面 settings.variable 有无传递 
    // 依旧以上面为例  如果没有传递 函数就是这样的
    // function anonymous(obj,_
    // /**/) {
    //   var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
    //   with(obj||{}){
    //     __p+='';
    //     _.each(people, function(name) { 
    //       __p+=' <li>'+
    //       ((__t=( name ))==null?'':__t)+
    //       '</li> ';
    //     }); 
    //     __p+='';
    //   }
    //   return __p;
    // }
    // 
    // 而如果类似这样的调用 _.template(list, data, { variable : 'people' })
    // 生成的函数如下，
    // function anonymous(people,_
    // /**/) {
    //   var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
        // __p+='';
        // _.each(people, function(name) { 
        //   __p+=' <li>'+
        //   ((__t=( name ))==null?'':__t)+
        //   '</li> ';
        // }); 
        // __p+='';
    //   return __p;
    // }
    // 即是说  在没有settings.variable情况下  其默认去读data下的people属性
    // 而在有的情况下 会将这个变量名作为渲染函数render 的第一个参数的名称  其实也就是直接将data作为第一个参数传递进去
    // 而这里面 最好 settings.variable 是在相应字符串构建的函数内部是有用到的  比如这里的people
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      // @15.04 如果出错了 设置e.source  这样开发起来也能看到错误的信息 点开箭头详情可见 
      // 如 try {new Function (1,2,3)}catch(e) {e.source = 'aaa'; throw e}
      e.source = source;
      throw e;
    }
    // @15.05 如果传递了data 直接渲染完返回出去
    if (data) return render(data, _);
    // @15.06 否则返回一个函数  内部则调用render函数渲染
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    // @15.07 在返回template函数前 还设置了这个函数的source属性
    // 其实也就是 render函数（类似的字符串）  便于于开发者查看
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  // @13.28 这个方法 通过 _.chain() 包装 obj
  _.chain = function(obj) {
    // @13.29 内部通过 _(obj) 得到一个 {_wrapped : obj} (_的实例)
    // 然后调用 _.prototype (原型)上的chain方法 @13.24
    // 返回 this {_wrapped : obj, _chain : true}
    // 
    // 实例： 来自官网的例子

    // var stooges = [{name: 'curly', age: 25}, {name: 'moe', age: 21}, {name: 'larry', age: 23}];
    // var youngest = _.chain(stooges)
    //   .sortBy(function(stooge){ return stooge.age; })
    //   .map(function(stooge){ return stooge.name + ' is ' + stooge.age; })
    //   .first()
    //   .value();
    //     => "moe is 21"

    // 这就有点吊了 **********************
    // 在调用_.chain()之后，再调用sortBy
    // 其实际操作是 _.sortBy(stooges)
    // 因为mixin内部 将原型上的this 绑定在 _ 上
    // 并且第一个参数传入的是 this._wrapped （这里的this 是调用相应方法之前的 即实例对象 ）
    // 到这里 一切也都走通了
    // 在mixin 内部 原型构建中  还通过了下面result函数 的检测判断
    // 如果 _chain 属性为 true 又经过一层 _(obj).chain() 包装 将上一个函数的返回结果 做一个包装 得到 {_chain : true, _wrapped : obj /*这里的obj上次方法的调用结果*/ }
    // 最后的 value方法@13.25 则是退出链式操作 返回相应的结果 即最后一个方法的调用结果
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
  // @13.26 闭包中的result函数
  // 先判断 调用的this (即 _ 的实例) 是否已经调用过chain方法
  // (1) 调用过:    再将obj (即@13.23 处传递进来的func函数调用结果包装一层后再调用chain方法)
  //                最后返回的其实是 { _wrapped : obj, _chain : true }
  // (2) 没调用过:  返回obj
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  // @13.27 这里一个mixin 将 _ 上的自有方法全部设置到 _.prototype上
  // 而在mixin内部 使得 _ 实例 原型上方法(即_.prototype) 调用时  其绑定的this 是 _
  // 此外，其第一个参数位置 传入的是 this.wrapped 即 创建实例时的 obj
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    // @ 13.28 将Array.prototype 上的相应方法 (直接作用在原数组上) 设置到 _.prototype上
    _.prototype[name] = function() {
      var obj = this._wrapped;
      // @ 13.29 这里的this 绑定在 this._wrapped上
      // 这就要求 通过 _(obj) 传递的obj最好是一个数组
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      // @ 13.30 最后返回的结果函数还是经过闭包中的result函数 之后再返回
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      // @ 13.31 将Array.prototype 上的相应方法 (非作用在原数组上) 设置到 _.prototype上
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    // @ 13.24 通过 _(obj) / new _(obj) 创建的对象的原型链上的方法
    // 只要调用过一次 对象上的_chain被设置为true
    // 最后返回的就是当前对象
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    // @ 13.25 调用后 通过 _(obj) / new _(obj) 传递的obj
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);
