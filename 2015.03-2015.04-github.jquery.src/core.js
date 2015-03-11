define([
	"./var/arr",
	"./var/document",
	"./var/slice",
	"./var/concat",
	"./var/push",
	"./var/indexOf",
	"./var/class2type",
	"./var/toString",
	"./var/hasOwn",
	"./var/support"
], function( arr, document, slice, concat, push, indexOf, class2type, toString, hasOwn, support ) {

var
	version = "@VERSION",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		// @@@ 见/core/init.js Jquery对象的初始化 都是通过 Jquery.fn.init这个构造函数生成的
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android<4.1
	// Make sure we trim BOM and NBSP
	// @@@ 1.1 替换一些不可见字符 包括BOM的一些特殊字符以及&nbsp;等等  此部分内容 参见
	// MDN开发手册  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
	// 字符内容替换  https://www.imququ.com/post/bom-and-javascript-trim.html
	// 感谢分享：JerryQu
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// Matches dashed string for camelizing
	// @@@ 2.1 参见 http://book.51cto.com/art/201402/430694.htm
	// 即 jQuery.camelCase
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	// @@@ 2.3 函数获得的参数  分别是 match, pattern1, pattern2... offset string
	// 故 background-color --> backgroundColor
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num != null ?

			// Return just the one element from the set
			( num < 0 ? this[ num + this.length ] : this[ num ] ) :

			// Return all the elements in a clean array
			slice.call( this );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	each: function( callback ) {
		return jQuery.each( this, callback );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

// @@@ 3.1
jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		// @@@ 目标对象 如果没有参数传入 则设置为空对象
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		// 默认浅拷贝
		deep = false;

	// Handle a deep copy situation
	// 如果第一个参数是一个布尔值
	// 是否深度拷贝
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		// 第一个参数是布尔值  那么将第二个参数作为目标对象
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	// 如果传入的作为目标的不是对象  并且不是数组  将目标设置为空对象
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	// $.extend(other)  $.extend(true, other) 
	// $.fn.extend(other) $.fn.extend(true, other)
	// 那么就将目标对象设置为自身  即将other上的属性拷贝到$上
	// 通过 当第一个参数是布尔值时 i++ 然后此部分进行 i--
	// 将i设置为 所有source 对象的最开始的 参数位置index
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		// 仅处理不是null和undefined的情况
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				// 原始属性
				src = target[ name ];
				// 供拷贝的属性
				copy = options[ name ];

				// Prevent never-ending loop
				// @problem: 原则上应该不会有死循环
				// 只是会有太多无用的拷贝操作
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				// 深度复制
				if ( deep && copy && ( jQuery.isPlainObject(copy) ||
					// 注： isPlainObject isArray 在extend方法定义时仍未存在
					// 但没有调用 所以不会抱错
					// 之后 jQuery.extend() 混入静态属性时 获得了这两个方法
					// 从而在后续的使用中可以调用执行
					(copyIsArray = jQuery.isArray(copy)) ) ) {

					// 供拷贝的该属性是一个数组
					if ( copyIsArray ) {
						// 重置开关
						copyIsArray = false;
						// 原始属性src也是一个数组 则使用src
						// 否则 使用一个新数组
						clone = src && jQuery.isArray(src) ? src : [];

					// 供拷贝的该属性是一个对象
					} else {
						// 原始属性src也是一个对象 则使用src
						// 否则 使用一个新对象
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					// 递归拷贝
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				// undefined的属性滚粗 嗯哼
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	// 返回这个新对象
	return target;
};

// @@@ 3.2 在extend之后 jQuery 已获得了以下这些属性和方法 因而就可以正常调用执行
jQuery.extend({
	// Unique for each copy of jQuery on the page
	// 唯一的序列值 通过 JQuery + 　( 版本号 + Math.random() )替换掉小数点
	// 例如 jQuery1110021066264971159399
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	// 官方解释：http://api.jquery.com/jquery.noop/
	// You can use this empty function when you wish to pass around a function that will do nothing.
    // This is useful for plugin authors who offer optional callbacks; in the case that no callback is given, something like jQuery.noop could execute.
    // 其实就是一个空函数 用于一些插件作者需要一些回调  然后其实你什么都不想做 就可以传递这个方法
	noop: function() {},

	// underscore.js 的function 检测可能更完美一点
	// 不只是toString.call()
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	// 这应该是ES 5的 可能我现在在看的是2.x版本
	isArray: Array.isArray,

	// window.window === window
	isWindow: function( obj ) {
		return obj != null && obj === obj.window;
	},

	// 见 http://api.jquery.com/jquery.isnumeric/
	isNumeric: function( obj ) {
		// parseFloat NaNs numeric-cast false positives (null|true|false|"")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		// adding 1 corrects loss of precision from parseFloat (#15100)
		// 添加1 大概是IEEE754 精度原因
		// obj 作为被减数 减去 某一数字大于等于0的前提是 obj在 数据类型转换之后 是一个数值类型
		return !jQuery.isArray( obj ) && (obj - parseFloat( obj ) + 1) >= 0;
	},

	// 判断是否是用对象直接量 {} 或 new Object() 创建的对象
	isPlainObject: function( obj ) {
		// Not plain objects:
		// - Any object or value whose internal [[Class]] property is not "[object Object]"
		// Object.prototype.toString.call( obj ) 返回的不是 [object Object]
		// - DOM nodes  $.type(window) -> object
		// - window  	$.type($('div')[0]) -> object
		if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		// 如果对象 obj 满足以下所有条件,则认为不是由构造函数 Object() 创建,而是由自定义构造函数创建,返回 false
		// @@@ problem 此处使用 obj.constructor 并不知道深意 或许只是随手那么一写
		// 任何东西都是对象 而 对象其实都拥有 constructor属性
		// @@@《jQuery技术内幕》这本书中说，如果对象 obj 没有属性 constructor,则说明该对象必然是通过对象字面量 {} 创建的。
		// 但其实 ({}).constructor --> function Object() { [native code] }
		// 而，因所有的内置类型都是从Obejct继承而来，而isPrototypeOf是Object所特有的
		if ( obj.constructor &&
				!hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
			return false;
		}

		// If the function hasn't returned already, we're confident that
		// |obj| is a plain object, created by {} or constructed with new Object
		return true;
	},

	// for-in 循环会同时枚举非继承属性和从原型对象继承的属性
	// jQuery.isEmptyObject( {} )
	// jQuery.isEmptyObject( new Object() )
	// jQuery.isEmptyObject( { foo: "bar" } )
	// 注：JS内置类型原型上的属性和方法是不被枚举的[native Code] 
	// 例如Object.prototype.toString Array.prototype.join RegExp.prototype.source
	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	// @@@ 3.6 注：在初始化 class2type时 其执行each时 each循环开始之前 调用的是 isArraylike
	//里面又调用了type 此时 class2type还只是一个空对象
	type: function( obj ) {
		if ( obj == null ) {
			// 'undefined' 'null'
			return obj + "";
		}
		// Support: Android<4.0 (functionish RegExp)
		// @@@ 3.7 因此 初始化时 typeof "Boolean Number String Function Array Date RegExp Object Error".split(" ") 为 'object'
		// class2type[ toString.call(obj) ] 未定义
		// 最后返回 object
		return typeof obj === "object" || typeof obj === "function" ?
			// @@@ 3.9 后续的type 方法检测判断 就进入了 toString.call的新纪元
			class2type[ toString.call(obj) ] || "object" :
			typeof obj;
	},

	// Evaluates a script in a global context
	// 这里相当于确认了这个版本是jQuery 2.x
	// 通过创建一个script标签 执行相应代码后再移除
	// 1.x 代码则是
	/*
	if ( data && rnotwhite.test( data ) ) {
		// We use execScript on Internet Explorer
		// We use an anonymous function so that context is window // rather than jQuery in Firefox
		( window.execScript || function( data ) {
		window[ "eval" ].call( window, data ); } )( data );
	}
	 */
	globalEval: function( code ) {
		var script = document.createElement( "script" );

		script.text = code;
		document.head.appendChild( script ).parentNode.removeChild( script );
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Support: IE9-11+
	// Microsoft forgot to hump their vendor prefix (#9572)
	// @@@ 2.2 转换连字符式的字符串为驼峰式，用于CSS模块和数据缓存模块
	
	// rmsPrefix用于匹配字符串中前缀“-ms-”，匹配部分会被替换为“ms-”。
	// 这么做是因为在IE中，连字符式的样式名前缀“-ms-”对应小写的“ms”，而不是驼峰式的“Ms”。
	// 正如上面英文的翻译：微软忘了将他们的供应商前缀驼峰化。
	// 例如，“-ms-transform”对应“msTransform”而不是“MsTransform”。
	// 在IE以外的浏览器中，连字符式的样式名则可以正确地转换为驼峰式，例如，“-moz-transform”对应“MozTransform”。
	
	// 第二个替换 是传递函数来替换
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	// 用于检查 DOM 元素的节点名称(即属性 nodeName) 与指定的值是否相等,检查时忽略大小写
	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// @@@ 3.4 然后在each的过程中 调用了isArraylike函数
	each: function( obj, callback ) {
		var i = 0,
			length = obj.length,
			isArray = isArraylike( obj );
		// jQuery的each也支持中间跳出循环
		// 只要循环的过程中，调用的返回值是false即默认跳出循环
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		} else {
			for ( i in obj ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		}

		// 用于链式调用
		return obj;
	},

	// Support: Android<4.1
	// @@@ 1.2
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	// arr --> isArraylike
	// 			  string 		--> $.merge(ret, [arr])
	// 			  obj || array  --> $.merge(ret, arr)
	// other --> ret.push(arr)
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		// 直接利用的ES5的Array.prototype.indexOf
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	// Support: Android<4.1, PhantomJS<2
	// push.apply(_, arraylike) throws on ancient WebKit
	// 将第二个数组的数组项依次放入到第一个数组后面
	merge: function( first, second ) {
		// 至于这里使用+second.length的形式
		// 是因为second可能是类数组而不是真的数组
		// 见$.makeArray
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		// @@@problem: 是否多此一举？
		first.length = i;

		return first;
	},

	/*
	$.grep([1,2,3], function (value, index) {
		if (value === 2) return true;
	}, 1);
	--> [1, 3]

	$.grep([1,2,3], function (value, index) {
		if (value === 2) return true;
	});
	--> [2]
	 */
	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			// 取反 转成布尔值
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			// 将函数调用结果取反 转成布尔值
			callbackInverse = !callback( elems[ i ], i );
			// 如果传入的第三个参数和函数调用结果 取反之后不一致
			// 则将对应的元素放入matches数组
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	/*
	$.map([1,2,3], function (value, index, arg) {
		return arg + ' ' + value;
	}, 'it is')
	--> ["it is 1", "it is 2", "it is 3"]
	*/
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		// 将嵌套的数组整平
		/*
		$.map( [0,1,2], function(n){
  			return [ n, n + 1 ];
		});
		--> [0, 1, 1, 2, 2, 3]
		如果直接return ret的话，输出将会是：[[0,1], [1,2], [2,3]]
		 */
		/* 注意：
		[1,2,3].map(function (value, index, array) {return [index, value]})
		--> [[0,1], [1,2], [2,3]]
		并且 array参数位置接收的就是[1, 2, 3]数组
		吐槽：真是觉得jQuery的代码写的比underscore的丑太多了
		 */
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	// 类似bind 接受两种形式
	// jQuery.proxy( function, context [, additionalArguments ] ) function 函数调用 this指向context
	// jQuery.proxy( context, name [, additionalArguments ] )  name是context的属性 context[name]方法调用的this指向context
	/*
	$('#myElement').click(function() {
	    setTimeout($.proxy(function() {
	        $(this).addClass('aNewClass');
	    }, this), 1000);
	});
	 */
	proxy: function( fn, context ) {
		var tmp, args, proxy;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		// 最后返回的是这个新的函数 additionalArguments 作为proxy这个新函数的前面几个参数被传入到proxy中
		/*
		var add = function (a, b) {return a + b;};
		var add5 = $.proxy(add, undefined, 5);
		add5(3) --> 8
		 */
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		// 做一个标记
		// @@@ problem 当然 现在还不知道它的具体用处
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	now: Date.now,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	// 见/var/support.js 用于存放所有模块的支持检测情况
	support: support
});

// Populate the class2type map
// @@@ 3.3 这里为初始化 class2type 调用了 $.each
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),
function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

// @@@ 3.5 到了isArraylike函数 里面又调用了jQuery.type
// 关于类数组的一点释义 http://segmentfault.com/blog/f2e/1190000000415572
// 有length 属性 值是number类型
// 属性是 1 2 3 ...
// Array.prototype.slice.call({aa:2, ength:3}) -> [undefined × 3]
// Array.prototype.slice.call({1:2, length:3})  -> [undefined × 1, 2, undefined × 1]
// 是不是有点意思？
function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

	if ( type === "function" || jQuery.isWindow( obj ) ) {
		return false;
	}

	// @@@ problem 按照常理说 nodeType === 1的说明其是一个dom元素
	// 那么又哪来的length属性？
	// 而NodeList、HTMLCollection尽管有length 但是其nodeType是不存在的
	// 真是见了鬼了，卡了一个小时
	// 这个判断意义何在
	if ( obj.nodeType === 1 && length ) {
		return true;
	}
	// @@@ 3.8 尽管初始化 class2type 时候 得到的 type 是 object
	// 但是由于"Boolean Number String Function Array Date RegExp Object Error".split(" ") 本身就是一个数组
	// 使得返回的 就是一个true
	// 之后一层层返回回去 代码执行 将class2type 初始化完成
	return type === "array" || length === 0 ||
		// || 与 && 是同级操作符 上面这两个判断一旦为 true 便立即返回
		// 而到达typeof length === "number" 时候 需要 后面全部返回true才最终返回true
		// ( length -1 ) in obj只是多做一层检测
		// isArraylike({5:6,length:6}) -> true
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}

return jQuery;
});
