/*
	Base.js, version 1.1a
	Copyright 2006-2010, Dean Edwards
	License: http://www.opensource.org/licenses/mit-license.php
*/

/*
	中文注释为个人添加
	分为三次：
	@@@once: 	按照个人理解所做初步解析
	@@@twice: 	第二次通过第一层继承 / 初始化 加深理解 也修正一些错误观点
	@@@third: 	第三次通过第二 / 三层继承 做更深度剖析
	有不到之处，请指点一二，谢谢
	Commented By Xaber
	2014.06.28
*/

var Base = function() {
	// dummy
};

/*--------------------------------------------------------------
 *	@@@ once
 *--------------------------------------------------------------
 */
Base.extend = function(_instance, _static) {
	// 获得Base.prototype.extend方法的引用
	var extend = Base.prototype.extend;
	
	// 标记正在构建原型  这个状态标记主要用于call调用原型上extend方法时内部指定extend
	Base._prototyping = true;
	// 创建实例
	var proto = new this;
	// 调用实例上的extend, 指定this为当前构造函数的实例  
	// 传入一个参数_instance作为source  整合出原型对象
	extend.call(proto, _instance);

	// 初步指定base方法
	proto.base = function() {};
	// 清除标记
	delete Base._prototyping;
	
	// 标记整合后的constructor属性
	var constructor = proto.constructor;

	// 重写proto constructor构造函数
	var klass = proto.constructor = function() {
		if (!Base._prototyping) {
			if (this._constructing || this.constructor == klass) { // instantiation
				this._constructing = true;
				// constructor apply调用的情况  这里的this 指向new 调用时创建的的实例对象
				// 其实也就相当于将 原来constructor 中的 this.name = name  这类的 通过传入的参数 设置相应的实例属性值
				// 因为上方的proto = new this  并未获得构造函数中内部通过参数位置指定的属性
				constructor.apply(this, arguments);
				delete this._constructing;

			// 没看懂 没找到进入这个逻辑的场景
			} else if (arguments[0] != null) { // casting
				return (arguments[0].extend || extend).call(arguments[0], proto);
			}
		}
	};
	
	// 指定继承的子类的相应方法，即为Base上的相应方法  都是同一个  只是this不同罢了
	// 这部分构造函数上的属性没必要用来继承
	klass.ancestor = this;
	klass.extend = this.extend;
	klass.forEach = this.forEach;
	klass.implement = this.implement;
	klass.toString = this.toString;
	klass.valueOf = function(type) {
		//return (type == "object") ? klass : constructor; //-dean
		return (type == "object") ? klass : constructor.valueOf();
	};

	// 指定构造函数原型对象
	klass.prototype = proto;

	// 调用extend 重写相应的构造函数上的属性和方法
	extend.call(klass, _static);
	// class initialisation
	if (typeof klass.init == "function") klass.init();
	return klass;
};

// 原型上的方法
Base.prototype = {	
	extend: function(source, value) {
		// 这个extend 接受两种情况，第一种：两个参数及以上，第一个 / 第二个分别为key 和 value
		if (arguments.length > 1) { // extending with a name/value pair
			// 实例上的属性
			var ancestor = this[source];
			// 如果这个属性即ancestor存在，并且第二个参数位置传入的是一个函数
			if (ancestor && (typeof value == "function") && // overriding a method?
				// the valueOf() comparison is to avoid circular references
				// 并且（ancestor的valueof不存在  或者   ancestor的valueOf 和value的valueOf不相等 即不是同一个引用）
				// 之所以用valueOf  为获取ancestor正确的原来的函数内容   因为下面就是把ancestor重写了 
				// 但是改写了valueOf方法，返回闭包中保存的原有的函数引用
				(!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
				// 并且value内部拥有base这个完整字符 即变量或属性
				/\bbase\b/.test(value)) {
				// 其实感觉这部分逻辑也并不是很严谨   如果ancestor是一个true  value内部有一个base变量 也就跳过这个逻辑了
				// 感觉既然是需要保存父类型方法  那么在第一个位置一个ancestor是函数的判断更好

				// get the underlying method
				// 用method保存value  即原来的函数内容
				var method = value.valueOf();
				// override
				// 重写value
				value = function() {
					// 保存原来的base方法
					var previous = this.base || Base.prototype.base;
					// 指定现在的base方法为ancestor
					// 可能有很多函数，内部都有一个this.base()
					// 但JavaScript是单线程的 在每一次调用函数时，通过这些步骤，每一次都重写 / 指定了不同的base方法
					// 因此也就区分开来了
					this.base = ancestor;
					// 因为method内部包含 this.base()  所以内部会调用ancestor方法
					var returnValue = method.apply(this, arguments);
					// 调用完成，再将base指定回去
					// 类似Douklas Crockford类式继承的 depth++ 和 depth--
					// 每一次调用，内部如果有base()方法，都会进行回溯  回溯调用完成以后再回到之前的状态
					this.base = previous;
					return returnValue;
				};
				// point to the underlying method
				// 重写 / 覆盖value的valueOf方法  
				// 如果type == 'object' 返回重写后的value的引用
				// 否则返回参数位置传进来的value函数原有的引用 即保存的method
				value.valueOf = function(type) {
					return (type == "object") ? value : method;
				};
				// 重写 / 覆盖 value的toString方法
				value.toString = Base.toString;
			}
			// 注意这个逻辑是在上面的if 之外
			// 指定这个方法为value
			// 如果是进入了上面的if逻辑则是重写后的value 否则只是简单赋值
			this[source] = value;

		// 只有一个参数的情况  这部分其实并不严谨
		// 如果只传入一个字符串  那就很搞笑了
		// 如for (i in 'abcd') { console.log(i, 'abcd'[i]) } ==> 0 a 1 b 2 c 4 d
		} else if (source) { // extending with an object literal
			// 获得当前extend方法的引用  即Base.prototype.extend
			var extend = Base.prototype.extend;
			// if this object has a customised extend method then use it
			
			// 这部分的判定，因构造函数出会标记_prototyping属性
			// 其实也就是根据调用的场景不同，指定不同的extend
			// 如果是在上面构造原型处调用，则不进入这个逻辑
			// 或者只是以函数形式调用，同理
			// 而当以对象上的方法的形式调用时，则进入这个if逻辑
			// 指定extend为自身 或者原型上的extend方法
			if (!Base._prototyping && typeof this != "function") {
				extend = this.extend || extend;
			}
			// 这个toSource什么用不懂
			// 可能只是作为和source对象的一个比对吧
			var proto = {toSource: null};
			// do the "toString" and other methods manually
			var hidden = ["constructor", "toString", "valueOf"];
			// if we are prototyping then include the constructor
			// 如果是在构造原型处调用，则也整合进constructor属性
			var i = Base._prototyping ? 0 : 1;
			while (key = hidden[i++]) {
				// 一般情况下，在类型相同时，在source重写 / 覆盖了原有"constructor", "toString", "valueOf"属性的情况下
				// 进入if逻辑  call调用 指定this / 实例上相应属性为source上的相应属性
				if (source[key] != proto[key]) {
					extend.call(this, key, source[key]);

				}
			}
			// copy each of the source object's properties to this object
			// 复制其他属性
			for (var key in source) {
				// 因为 "constructor", "toString", "valueOf" 这三个已经整合过了 无论是否被整合进去
				// 所以不希望再整合一遍
				// 不用hasOwnProperty的原因  source的原型链上可能还有其他想要被整合的方法
				if (!proto[key]) extend.call(this, key, source[key]);
			}
		}
		return this;
	}
};

// initialise
// 初始化
Base = Base.extend({
	constructor: function() {
		// 妙用 
		// 在 new 调用时，可接受一个obj作为参数  直接整合进实例对象
		this.extend(arguments[0]);
	}
}, {
	ancestor: Object,
	version: "1.1",
	
	forEach: function(object, block, context) {
		for (var key in object) {
			// 感觉这部分其实并不太科学  大概的意思可能是想要过滤object原型上的属性
			// 但是却以当前构造函数原型作为过滤目标
			// 按理说，应该是
			// if( object.hasOwnPropety(key) ) {
			if (this.prototype[key] === undefined) {
				block.call(context, object[key], key, object);
			}
		}
	},
		
	implement: function() {
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] == "function") {
				// if it's a function, call it
				arguments[i](this.prototype);
			} else {
				// add the interface using the extend method
				// 整合属性进原型
				this.prototype.extend(arguments[i]);
			}
		}
		return this;
	},
	
	toString: function() {
		return String(this.valueOf());
	}
});

/*--------------------------------------------------------------
 *	@@@twice 	拿上面的初始化过一遍流程
 *--------------------------------------------------------------
 */
Base.extend = function(_instance, _static) {
	// 1.获得Base.prototype.extend方法的引用
	var extend = Base.prototype.extend;
	
	// 2.标记正在构建原型
	Base._prototyping = true;
	// 3.创建实例  第一次是一个空白对象
	var proto = new this;
	// 4.调用实例上的extend, 指定this为当前构造函数的实例  
	// 5.传入第一个参数位置的_instance 即 constructor: function() { this.extend(arguments[0]); }作为source  整合出原型对象
	extend.call(proto, _instance);

	// 17. 初步指定base方法
	proto.base = function() {};
	// 18. 清除标记
	delete Base._prototyping;
	
	// 19. 标记整合后的constructor属性 即 function() { this.extend(arguments[0]); }
	var constructor = proto.constructor;

	// 20. 再次重写proto constructor构造函数
	var klass = proto.constructor = function() {
		if (!Base._prototyping) {
			if (this._constructing || this.constructor == klass) {
				this._constructing = true;
				// 21. 调用 constructor 内部的extend  当前arguments其实并不存在
				constructor.apply(this, arguments);
				delete this._constructing;

			} else if (arguments[0] != null) { // casting
				return (arguments[0].extend || extend).call(arguments[0], proto);
			}
		}
	};
	
	klass.ancestor = this;
	klass.extend = this.extend;

	// 22. 注意 此处两个方法还并未指定 是undefined
	klass.forEach = this.forEach;
	klass.implement = this.implement;
	// 23. 而toString则是还未经过重写的
	klass.toString = this.toString;
	// 24. 重写valueOf
	klass.valueOf = function(type) {
		//return (type == "object") ? klass : constructor; //-dean
		return (type == "object") ? klass : constructor.valueOf();
	};

	// 25. 指定构造函数原型对象
	klass.prototype = proto;

    // 26. 再次调用extend 同理，因为没有内部没有base  也都只是简单重写  不过是指定构造函数上的自有方法
	extend.call(klass, _static);
	// class initialisation
	if (typeof klass.init == "function") klass.init();
	return klass;
};

Base.prototype = {
	extend: function(source, value) {
		if (arguments.length > 1) {
			// 14. proto的constructor指向原来的Base构造函数
			var ancestor = this[source];
			// 15. 跳过这个逻辑
			if (ancestor && (typeof value == "function") && 
				(!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
				/\bbase\b/.test(value)) {

				var method = value.valueOf();
				value = function() {
					var previous = this.base || Base.prototype.base;
					this.base = ancestor;
					var returnValue = method.apply(this, arguments);
					this.base = previous;
					return returnValue;
				};
				value.valueOf = function(type) {
					return (type == "object") ? value : method;
				};
				value.toString = Base.toString;
			}
			// 16. 指定consructor为新的constructor
			this[source] = value;

		// 6.进入这个逻辑
		} else if (source) {
			// 7.获得当前extend方法的引用  即Base.prototype.extend
			var extend = Base.prototype.extend;
			
			// 8.因为_prototyping 跳过这个逻辑
			if (!Base._prototyping && typeof this != "function") {
				extend = this.extend || extend;
			}
			var proto = {toSource: null};
			var hidden = ["constructor", "toString", "valueOf"];
			// 9. i 从0开始
			var i = Base._prototyping ? 0 : 1;
			while (key = hidden[i++]) {
				// 10. 因为传递进来的constructor是重写了的
				// 11. 进入if逻辑  call调用 指定this / 实例上相应属性为source上的相应属性
				if (source[key] != proto[key]) {
					// 12. 根据上面call调用 this指向proto对象
					// 13. 仅传入 constructor 和那个函数
					extend.call(this, key, source[key]);

				}
			}
			// 复制其他属性
			for (var key in source) {
				if (!proto[key]) extend.call(this, key, source[key]);
			}
		}
		return this;
	}
};


var Animal = Base.extend({
	constructor: function(name) {
		this.name = name;
	},
	
	name: "",
	
	eat: function() {
		this.say("Yum!");
	},
	
	say: function(message) {
		alert(this.name + ": " + message);
	}
});

var Cat = Animal.extend({
	eat: function(food) {
		if (food instanceof Mouse) this.base();
		else this.say("Yuk! I only eat mice.");
	}
});
var Mouse = Animal.extend();

new Cat('Tom').eat( new Mouse('Jerry') );

/*--------------------------------------------------------------
 *	@@@third 	第二 / 三重类式继承 Animal / Cat / A / C
 *--------------------------------------------------------------
 */
Base.extend = function(_instance, _static) {
	var extend = Base.prototype.extend;
	
	Base._prototyping = true;
	// A1. this 为新的Base 
	// A2. proto对象的原型对象上 也获得了 base extend consturctor这几个属性
	
	// C1. Animal的extend方法也是这个函数  只是指定的this不同罢了
	// C2. proto对象的原型对象上 也获得了 base extend consturctor eat say name 这几个属性
	var proto = new this;
	
	extend.call(proto, _instance);

	// A5. 重写base方法 避免proto原型上的base方法的干扰
	proto.base = function() {};
	delete Base._prototyping;
	
	// A6. 保存重写后的function(name) {this.name = name;} 的引用
	var constructor = proto.constructor;

	var klass = proto.constructor = function() {
		if (!Base._prototyping) {
			if (this._constructing || this.constructor == klass) {
				this._constructing = true;
				// A7. 使用new Animal时候 也就得到了 对应的包含name的实例
				constructor.apply(this, arguments);
				delete this._constructing;

			} else if (arguments[0] != null) {
				return (arguments[0].extend || extend).call(arguments[0], proto);
			}
		}
	};
	
	// A8. 直接指定方法  基本是这几个主要的方法  也不再做继承和复杂的判断
	klass.ancestor = this;
	klass.extend = this.extend;
	klass.forEach = this.forEach;
	klass.implement = this.implement;
	klass.toString = this.toString;
	klass.valueOf = function(type) {
		return (type == "object") ? klass : constructor.valueOf();
	};

	klass.prototype = proto;

	extend.call(klass, _static);
	if (typeof klass.init == "function") klass.init();
	return klass;
};

Base.prototype = {	
	extend: function(source, value) {
		if (arguments.length > 1) {
			// 	C4. ancestor保存原型上的eat
			var ancestor = this[source];
			if (ancestor && (typeof value == "function") && 
				(!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
				/\bbase\b/.test(value)) {

				// C5. method保存传入的eat函数的引用
				var method = value.valueOf();
				// C6. 重写eat函数
				value = function() {
					var previous = this.base || Base.prototype.base;
					// C7. 指定base
					this.base = ancestor;
					// C8. 调用原来的eat 且内部因为拥有base 故调用一次上级的eat方法 
					// C8. 并保存正确的eat调用返回值
					var returnValue = method.apply(this, arguments);
					this.base = previous;
					return returnValue;
				};
				// C9. 去掉这部分 尽管调用什么都正常  但是console.log( new Cat() .eat ) 会出现Range Error的未明原因 
				value.valueOf = function(type) {
					return (type == "object") ? value : method;
				};
				value.toString = Base.toString;
			}
			// C10. 指定eat方法为重写后的eat
			this[source] = value;

		} else if (source) {
			var extend = Base.prototype.extend;
			
			if (!Base._prototyping && typeof this != "function") {
				extend = this.extend || extend;
			}
			var proto = {toSource: null};
			var hidden = ["constructor", "toString", "valueOf"];
			var i = Base._prototyping ? 0 : 1;
			while (key = hidden[i++]) {
				// A3. 重新指定constructor
				if (source[key] != proto[key]) {
					extend.call(this, key, source[key]);

				}
			}
			// A4. 整合eat say name 这几个属性进 上方call调用的proto原型对象
			
			// C3. 整合eat属性
			for (var key in source) {
				if (!proto[key]) extend.call(this, key, source[key]);
			}
		}
		return this;
	}
};


// 其他的测试
var obj = new Base();
obj.method = function() {
	alert("Hello World!");
};
// 利用extend方法 指定了base方法为上一个method方法
obj.extend({
	method: function() {
		this.base();
		alert("Hello again!");
	}
});
obj.method();