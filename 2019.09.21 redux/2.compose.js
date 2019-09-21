/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */
/**
 * compose 接受函数列表作为参数，返回一个函数
 * 
 * 如果函数列表为空数组，返回的函数等同于 _.identity
 * compose()(1) => 1
 * 
 * 如果函数列表只有一个函数，返回的函数即为该函数，最终该函数的运行结果即为该函数的运行的返回值
 * compose((x) => x + 1)(1) => 2
 * 
 * 最关键、牛逼的 funcs.reduce((a, b) => (...args) => a(b(...args)))
 * 根据 funcs 函数的顺序，依次从末尾的函数开始执行，并将返回值，一层层传递给上一个函数
 * 最终的返回值，即为最终第 0 个函数，接受到的 第 1个函数的返回值（....）作为参数，得到的返回值
 * 
 * compose((x) => x + 1, (x) => x + 2)(1) => ((x) => x + 1)(1 + 2) => 4
 */
export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}