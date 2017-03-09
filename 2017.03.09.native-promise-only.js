/*! Native Promise Only
    v0.8.1 (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/

(function UMD(name,context,definition){
    // special form of UMD for polyfilling across evironments
    context[name] = context[name] || definition();
    if (typeof module != "undefined" && module.exports) { module.exports = context[name]; }
    else if (typeof define == "function" && define.amd) { define(function $AMD$(){ return context[name]; }); }
})("Promise",typeof global != "undefined" ? global : this,function DEF(){
    /*jshint validthis:true */
    "use strict";

    var builtInProp, cycle, scheduling_queue,
        ToString = Object.prototype.toString,
        timer = (typeof setImmediate != "undefined") ?
            function timer(fn) { return setImmediate(fn); } :
            setTimeout
    ;

    // dammit, IE8.
    try {
        Object.defineProperty({},"x",{});
        builtInProp = function builtInProp(obj,name,val,config) {
            return Object.defineProperty(obj,name,{
                value: val,
                writable: true,
                configurable: config !== false
            });
        };
    }
    catch (err) {
        builtInProp = function builtInProp(obj,name,val) {
            obj[name] = val;
            return obj;
        };
    }

    // Note: using a queue instead of array for efficiency
    // @@@1 first 和 last 是同一个Item 实例
    // 因而设置 last.next 其实就是设置 first.next
    // 这样的实现 因为只提取属性 或许更快
    // 同样的，Node Stream 的BufferList 其实也是一样的
    // 见：https://github.com/nodejs/node/blob/db1087c9757c31a82c50a1eba368d8cba95b57d0/lib/internal/streams/BufferList.js
    scheduling_queue = (function Queue() {
        var first, last, item;

        function Item(fn,self) {
            this.fn = fn;
            this.self = self;
            this.next = void 0;
        }

        return {
            add: function add(fn,self) {
                item = new Item(fn,self);
                if (last) {
                    last.next = item;
                }
                else {
                    first = item;
                }
                last = item;
                item = void 0;
            },
            drain: function drain() {
                var f = first;
                first = last = cycle = void 0;

                while (f) {
                    f.fn.call(f.self);
                    f = f.next;
                }
            }
        };
    })();

    // @@@2 这里有一个巧妙的点 cycle作为外部变量
    // 如果一次性调用n次schedule，只会先做n次add操作
    // 因为cycle 是在timer callback 中才设置undefined 
    // timer 定时器是一个异步操作
    function schedule(fn,self) {
        scheduling_queue.add(fn,self);
        if (!cycle) {
            cycle = timer(scheduling_queue.drain);
        }
    }

    // promise duck typing
    // @@@3 怎么感觉这个代码是PHP风格的 哈哈
    // 鸭式辨型
    function isThenable(o) {
        var _then, o_type = typeof o;

        if (o != null &&
            (
                o_type == "object" || o_type == "function"
            )
        ) {
            _then = o.then;
        }
        return typeof _then == "function" ? _then : false;
    }

    function notify() {
        for (var i=0; i<this.chain.length; i++) {
            notifyIsolated(
                this,
                // @@17 def.state为2的情况是rejected状态
                (this.state === 1) ? this.chain[i].success : this.chain[i].failure,
                this.chain[i]
            );
        }
        this.chain.length = 0;
    }

    // NOTE: This is a separate function to isolate
    // the `try..catch` so that other code can be
    // optimized better
    function notifyIsolated(self,cb,chain) {
        var ret, _then;
        try {
            // @@18 这里的cb 由@@15 处传进来的内容
            // 而在该调用的最上面，有相关false的判断
            // 而且只要传了false代表就是出错了 见@@17 state为2
            if (cb === false) {
                // @@19 调用的是这个chain 对应的Promise 内部的reject
                // 也就是then中创建的promise对象
                // 而这个错误，因为当前没有传递failure函数处理 会交由下一个then进行接受
                // 并且一直传递下去
                chain.reject(self.msg);
            }
            // @@20 这里其实有隐含情况
            // 如果cb 是success 他可以是function 或者true
            // 如果cb 是failure 他可能是function 或者false
            else {
                // success传递了非函数的情况
                if (cb === true) {
                    ret = self.msg;
                }
                // success函数的情况
                // failure函数的情况
                // 于是进行了then传递的函数的callback调用
                else {
                    // 中间链 return value的情况 否则是undefined
                    ret = cb.call(void 0,self.msg);
                }

                // 具体报错场景
                // Uncaught (in promise) TypeError: Chaining cycle detected for promise #<Promise> at resolvePromise (native)
                // var a = Promise.resolve();
                // var b = a.then(function () {
                //     return b;
                // })

                // 为什么禁止？
                // b作为一个promise对象，其then接受的参数便是自己的promise b，会造成无限递归
                // 永远无法停止
                if (ret === chain.promise) {
                    chain.reject(TypeError("Promise-chain cycle"));
                }
                else if (_then = isThenable(ret)) {
                    // thenable的话 将resolve和reject再传递
                    _then.call(ret,chain.resolve,chain.reject);
                }
                else {
                    // 每次resolve 也就代表then中返回的promise对象也可以调用then方法
                    // 只是中间的链没有return值的话 只能得到undefined
                    chain.resolve(ret);
                }
            }
        }
        catch (err) {
            chain.reject(err);
        }
    }

    // @@7 观察此函数 def的作用其实就是替代 promise对象作为状态管理器的存在
    function resolve(msg) {
        var _then, self = this;

        // already triggered?
        if (self.triggered) { return; }

        self.triggered = true;

        // unwrap
        // @@11 于是代码逻辑走到了这里 进行解包装
        // 之所以用包装 个人理解其实也只是为了绕过triggered的逻辑
        if (self.def) {
            self = self.def;
        }

        try {
            // @@8 isThenable 其实并不是一个纯函数 如果是thenable 会返回then方法
            // 这里判断的主要用途是，用户在调用时，直接resolve了一个thenable（类promise）对象
            if (_then = isThenable(msg)) {
                // @@11 这里schedule就起了作用 因为Promise是异步的
                // schedule使其 “只异步一次” 而不会再各个层次去设置定时器
                schedule(function(){
                    // @@9 最初始的调用 self是一个def对象
                    // 经过包装一层 生成一个MakeDefWrapper 实例
                    // 即
                    // {
                    //     def: def
                    //     triggered: false
                    // }
                    var def_wrapper = new MakeDefWrapper(self);
                    try {
                        // @@10 而后用 thenable的then方法，即msg.then去执行
                        // 最终resovle、reject进行递归
                        _then.call(msg,
                            function $resolve$(){ resolve.apply(def_wrapper,arguments); },
                            function $reject$(){ reject.apply(def_wrapper,arguments); }
                        );
                    }
                    catch (err) {
                        reject.call(def_wrapper,err);
                    }
                })
            }
            else {
                // @@12 正常的resolve值的情况
                // {
                //     promise: promise,
                //     state: 1,
                //     triggered: true,
                //     chain: [],
                //     msg: msg
                // }
                self.msg = msg;
                self.state = 1;
                if (self.chain.length > 0) {
                    schedule(notify,self);
                }
            }
        }
        catch (err) {
            // 跳过 triggered 的判断
            reject.call(new MakeDefWrapper(self),err);
        }
    }

    function reject(msg) {
        var self = this;

        // already triggered?
        if (self.triggered) { return; }

        self.triggered = true;

        // unwrap
        if (self.def) {
            self = self.def;
        }

        self.msg = msg;
        self.state = 2;
        if (self.chain.length > 0) {
            schedule(notify,self);
        }
    }

    function iteratePromises(Constructor,arr,resolver,rejecter) {
        for (var idx=0; idx<arr.length; idx++) {
            (function IIFE(idx){
                Constructor.resolve(arr[idx])
                .then(
                    function $resolver$(msg){
                        resolver(idx,msg);
                    },
                    rejecter
                );
            })(idx);
        }
    }

    function MakeDefWrapper(self) {
        this.def = self;
        this.triggered = false;
    }

    function MakeDef(self) {
        this.promise = self;
        this.state = 0;
        this.triggered = false;
        this.chain = [];
        this.msg = void 0;
    }

    function Promise(executor) {
        if (typeof executor != "function") {
            throw TypeError("Not a function");
        }

        if (this.__NPO__ !== 0) {
            throw TypeError("Not a promise");
        }

        // instance shadowing the inherited "brand"
        // to signal an already "initialized" promise
        // @@@4 标记promise对象 是否初始化
        this.__NPO__ = 1;

        // @@@5 返回的对象
        // {
        //     promise: this,
        //     state: 0,
        //     triggered: false,
        //     chain: [],
        //     msg: void 0
        // }
        var def = new MakeDef(this);

        // @@13 当我们调用then时
        this["then"] = function then(success,failure) {
            var o = {
                success: typeof success == "function" ? success : true,
                failure: typeof failure == "function" ? failure : false
            };
            // Note: `then(..)` itself can be borrowed to be used against
            // a different promise constructor for making the chained promise,
            // by substituting a different `this` binding.
            // @@14 创建一个新的promise对象
            o.promise = new this.constructor(function extractChain(resolve,reject) {
                if (typeof resolve != "function" || typeof reject != "function") {
                    throw TypeError("Not a function");
                }

                o.resolve = resolve;
                o.reject = reject;
            });
            // @@15 因为def是一个引用对象 其在resolve的处理中 state被设置为了1
            // 具体见 @@12
            
            // @@21 而chain的作用在于，当异步的Promise状态还未变更（即这里的def state一直为0）
            // 而用户快速调用了这个Promise对象的n个then方法，于是就创建了n个promise对象
            // 最后 异步返回后 n的then的callback依次执行
            // 并且chain之间是互不影响的
            // 例如：
            // var a = new Promise(function (resolve) {
            //     setTimeout(function () {
            //         resolve(10);
            //     }, 10);
            // });
            // for (i = 10; i--; ) {
            //     a.then(function (v) {
            //         console.log(v)
            //     });
            // }
            def.chain.push(o);

            if (def.state !== 0) {
                // @@16 依次调用 在schedule中notify 指定了第二个参数为this
                schedule(notify,def);
            }

            return o.promise;
        };
        this["catch"] = function $catch$(failure) {
            return this.then(void 0,failure);
        };

        try {
            executor.call(
                void 0,
                function publicResolve(msg){
                    // @@@6 new Promise(callback) 中的callback接受的resolve reject
                    // 调用执行 得到的msg 参数，进行了传递
                    // 并将this 指定为def
                    resolve.call(def,msg);
                },
                function publicReject(msg) {
                    reject.call(def,msg);
                }
            );
        }
        catch (err) {
            reject.call(def,err);
        }
    }

    var PromisePrototype = builtInProp({},"constructor",Promise,
        /*configurable=*/false
    );

    // Note: Android 4 cannot use `Object.defineProperty(..)` here
    Promise.prototype = PromisePrototype;

    // built-in "brand" to signal an "uninitialized" promise
    builtInProp(PromisePrototype,"__NPO__",0,
        /*configurable=*/false
    );

    builtInProp(Promise,"resolve",function Promise$resolve(msg) {
        var Constructor = this;

        // spec mandated checks
        // note: best "isPromise" check that's practical for now
        if (msg && typeof msg == "object" && msg.__NPO__ === 1) {
            return msg;
        }

        return new Constructor(function executor(resolve,reject){
            if (typeof resolve != "function" || typeof reject != "function") {
                throw TypeError("Not a function");
            }

            resolve(msg);
        });
    });

    builtInProp(Promise,"reject",function Promise$reject(msg) {
        return new this(function executor(resolve,reject){
            if (typeof resolve != "function" || typeof reject != "function") {
                throw TypeError("Not a function");
            }

            reject(msg);
        });
    });

    builtInProp(Promise,"all",function Promise$all(arr) {
        var Constructor = this;

        // spec mandated checks
        if (ToString.call(arr) != "[object Array]") {
            return Constructor.reject(TypeError("Not an array"));
        }
        if (arr.length === 0) {
            return Constructor.resolve([]);
        }

        return new Constructor(function executor(resolve,reject){
            if (typeof resolve != "function" || typeof reject != "function") {
                throw TypeError("Not a function");
            }

            var len = arr.length, msgs = Array(len), count = 0;

            iteratePromises(Constructor,arr,function resolver(idx,msg) {
                msgs[idx] = msg;
                if (++count === len) {
                    resolve(msgs);
                }
            },reject);
        });
    });

    builtInProp(Promise,"race",function Promise$race(arr) {
        var Constructor = this;

        // spec mandated checks
        if (ToString.call(arr) != "[object Array]") {
            return Constructor.reject(TypeError("Not an array"));
        }

        return new Constructor(function executor(resolve,reject){
            if (typeof resolve != "function" || typeof reject != "function") {
                throw TypeError("Not a function");
            }

            // 注意，即使这里的then只处理了最快返回的promise对象
            // 但是其他promise仍然照常执行
            iteratePromises(Constructor,arr,function resolver(idx,msg){
                resolve(msg);
            },reject);
        });
    });

    return Promise;
});