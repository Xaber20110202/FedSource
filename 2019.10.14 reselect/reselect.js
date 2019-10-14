function defaultEqualityCheck(a, b) {
  return a === b
}

// 一层 浅 检测
function areArgumentsShallowlyEqual(equalityCheck, prev, next) {
  if (prev === null || next === null || prev.length !== next.length) {
    return false
  }

  // Do this in a for loop (and not a `forEach` or an `every`) so we can determine equality as fast as possible.
  // 这里其实感觉 用 every 也可以退出循环
  const length = prev.length
  for (let i = 0; i < length; i++) {
    if (!equalityCheck(prev[i], next[i])) {
      return false
    }
  }

  return true
}

// 这个函数比较巧妙的是 给 原来的 func 包了一层，返回 newFunc
// 然后将 arguments 和 result 存在了闭包内
// 因为 redux 的更新，要求 大家都以 immutable 的方式变更（返回新的对象 / 数组）
// 所以用 === 判断即可
// 只要 arguments 仍然全等，那么直接返回原有的 lastResult
export function defaultMemoize(func, equalityCheck = defaultEqualityCheck) {
  let lastArgs = null
  let lastResult = null
  // we reference arguments instead of spreading them for performance reasons
  // 不用解构，arguments 会更快
  return function () {
    if (!areArgumentsShallowlyEqual(equalityCheck, lastArgs, arguments)) {
      // apply arguments instead of spreading for performance.
      lastResult = func.apply(null, arguments)
    }

    lastArgs = arguments
    return lastResult
  }
}

function getDependencies(funcs) {
  const dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs

  // 检测是否所有 dependencies 是函数
  if (!dependencies.every(dep => typeof dep === 'function')) {
    const dependencyTypes = dependencies.map(
      dep => typeof dep
    ).join(', ')
    throw new Error(
      'Selector creators expect all input-selectors to be functions, ' +
      `instead received the following types: [${dependencyTypes}]`
    )
  }

  return dependencies
}

export function createSelectorCreator(memoize, ...memoizeOptions) {
  return (...funcs) => {
    // 这玩意儿的作用，估计就是拿来调试，看看 是不是直接返回的缓存 的 lastResult，而不执行此函数
    let recomputations = 0
    // 先提取出获取 结果的 最后一个函数
    const resultFunc = funcs.pop()
    // 其他函数 作为结果函数的 依赖
    const dependencies = getDependencies(funcs)

    const memoizedResultFunc = memoize(
      // 这里 又包了一层 用来标记 recomputations
      function () {
        recomputations++
        // apply arguments instead of spreading for performance.
        return resultFunc.apply(null, arguments)
      },
      // 而剩下的所有参数，仍然原封不动，传递给 memoize
      ...memoizeOptions
    )

    // If a selector is called with the exact same arguments we don't need to traverse our dependencies again.

    // export const totalSelector = createSelector(
    //   subtotalSelector,
    //   taxSelector,
    //   (subtotal, tax) => ({ total: subtotal + tax })
    // )
    // 以 totalSelector 为例子，因为 selector 接受的参数，第一个基本上就是 state。那么如果 state 没变，dependencies 函数数组 不会被重新执行，而是直接返回
    // 但是 如果 state 变了，其实 dependencies 都会执行一遍
    // 而因为 subtotal、tax 没变，所以 memoizedResultFunc 会拿原来的 lastResult 直接返回
    // 这么看起来，createSelector 基于 defaultMemoize，它其实如果一旦 state 改变（每次 redux reducer 变化），dependencies 都会重新执行一遍  （只会作用在最后一个 resultFunc 的缓存）
    // 当然，如果 dependencies 都只是 获取属性值返回，而不涉及计算的话，就还好了
    const selector = memoize(function () {
      const params = []
      const length = dependencies.length

      for (let i = 0; i < length; i++) {
        // apply arguments instead of spreading and mutate a local list of params for performance.
        params.push(dependencies[i].apply(null, arguments))
      }

      // 最终只会说，检测 dependencies 函数数组 执行完之后的，结果进行判断，看是否需要重新执行 resultFunc
      // apply arguments instead of spreading for performance.
      return memoizedResultFunc.apply(null, params)
    })

    selector.resultFunc = resultFunc
    selector.dependencies = dependencies
    selector.recomputations = () => recomputations
    selector.resetRecomputations = () => recomputations = 0
    return selector
  }
}

export const createSelector = createSelectorCreator(defaultMemoize)

// 不赘述 返回一个新函数
// 函数执行的动作
// 只是把 {a (state) { return state.a }, b: (state) { return state.b } } 全部 select 完了之后，再将 select 的结果扔进 a、b 等属性，例如：  {a: 1, b: 2 }
// 注意：selectorCreator 不传递，默认的 是 createSelector 的话
// 其实最终的 func 缓存在闭包中的变量是 [1, 2]，但是如果 state 一改变，其实 dependences 函数数组 每次仍然要执行
export function createStructuredSelector(selectors, selectorCreator = createSelector) {
  if (typeof selectors !== 'object') {
    throw new Error(
      'createStructuredSelector expects first argument to be an object ' +
      `where each property is a selector, instead received a ${typeof selectors}`
    )
  }
  const objectKeys = Object.keys(selectors)
  return selectorCreator(
    objectKeys.map(key => selectors[key]),
    (...values) => {
      return values.reduce((composition, value, index) => {
        composition[objectKeys[index]] = value
        return composition
      }, {})
    }
  )
}