/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
    // 标记是否初始化的变量
    var initializing = false,
    // 有意思 算做一个提示
        fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
 
    // The base Class implementation (does nothing)
    // this -> window
    this.Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var _super = this.prototype;
     
        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;
     
        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            // John Resig 还真是偷懒的杰出代表 write less do more
            // 他的判断 以及 return 在多条件判断情况下 从来都是利用 操作符的优先级 而很少使用 if else
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;
                     
                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];
                     
                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);                
                        this._super = tmp;
                     
                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }
     
        // The dummy class constructor
        // extend 中的Class 覆盖了window.Class
        function Class() {
            // All construction is actually done in the init method
            // 在 最上面 new this() 时，进入这个逻辑
            // 然后调用原型链上的init方法  如果存在的话
            // 并且init 方法接受 new 时传入的参数
            // 因此 也就可以在init中做实例属性的一些操作
            if ( !initializing && this.init )
                this.init.apply(this, arguments);
        }
     
        // Populate our constructed prototype object
        Class.prototype = prototype;
        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;
 
        // And make this class extendable
        // 指定同一个extend
        // 不过此时 arguments.callee 在ES 5 strict 模式下已经被取消了
        Class.extend = arguments.callee;
     
        return Class;
    };
})();