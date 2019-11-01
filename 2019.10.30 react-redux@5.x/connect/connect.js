import connectAdvanced from '../components/connectAdvanced'
import shallowEqual from '../utils/shallowEqual'
import defaultMapDispatchToPropsFactories from './mapDispatchToProps'
import defaultMapStateToPropsFactories from './mapStateToProps'
import defaultMergePropsFactories from './mergeProps'
import defaultSelectorFactory from './selectorFactory'

/*
  connect is a facade over connectAdvanced. It turns its args into a compatible
  selectorFactory, which has the signature:

    (dispatch, options) => (nextState, nextOwnProps) => nextFinalProps
  
  connect passes its args to connectAdvanced as options, which will in turn pass them to
  selectorFactory each time a Connect component instance is instantiated or hot reloaded.

  selectorFactory returns a final props selector from its mapStateToProps,
  mapStateToPropsFactories, mapDispatchToProps, mapDispatchToPropsFactories, mergeProps,
  mergePropsFactories, and pure args.

  The resulting final props selector is called by the Connect component instance whenever
  it receives new props or store state.
 */

// 这个函数有点巧妙，就类似 redux 的 compose 高度抽象
// factories 函数数组从尾部开始执行，只要存在 返回值，即返回
function match(arg, factories, name) {
  for (let i = factories.length - 1; i >= 0; i--) {
    const result = factories[i](arg)
    if (result) return result
  }

  return (dispatch, options) => {
    throw new Error(`Invalid value of type ${typeof arg} for ${name} argument when connecting component ${options.wrappedComponentName}.`)
  }
}

function strictEqual(a, b) { return a === b }

// createConnect with default args builds the 'official' connect behavior. Calling it with
// different options opens up some testing and extensibility scenarios
export function createConnect({
  // 只以 connectAdvanced 为例
  connectHOC = connectAdvanced,
  // 只以 defaultMapStateToPropsFactories 为例
  mapStateToPropsFactories = defaultMapStateToPropsFactories,
  // 只以 defaultMapDispatchToPropsFactories 为例
  mapDispatchToPropsFactories = defaultMapDispatchToPropsFactories,
  // 只以 defaultMergePropsFactories 为例
  mergePropsFactories = defaultMergePropsFactories,
  // 只以 defaultSelectorFactory 为例
  selectorFactory = defaultSelectorFactory
} = {}) {
  return function connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    {
      pure = true,
      // 全等
      areStatesEqual = strictEqual,
      // 一层相等匹配
      areOwnPropsEqual = shallowEqual,
      // 一层相等匹配
      areStatePropsEqual = shallowEqual,
      // 一层相等匹配
      areMergedPropsEqual = shallowEqual,
      // 从 connectAdvanaced.js 可知，此处还可以传递 withRef 等等参数
      ...extraOptions
    } = {}
  ) {
    // 给 mapStateToProps 包一层 根据 mapStateToPropsFactories 处理显示
    // mapStateToProps 可以是 falsy value, 或者 func
    const initMapStateToProps = match(mapStateToProps, mapStateToPropsFactories, 'mapStateToProps')
    // 给 mapDispatchToProps 包一层 根据 mapDispatchToPropsFactories 处理显示
    // mapDispatchToProps 可以是 Object, falsy value, 或者 func
    const initMapDispatchToProps = match(mapDispatchToProps, mapDispatchToPropsFactories, 'mapDispatchToProps')
    // 给 mergePropsFactories 包一层 根据 mergePropsFactories 处理显示
    // mapDispatchToProps 可以是 falsy value, 或者 func
    const initMergeProps = match(mergeProps, mergePropsFactories, 'mergeProps')

    // 这里直接当作 connectAdvanced、defaultSelectorFactory
    return connectHOC(selectorFactory, {
      // used in error messages
      methodName: 'connect',

       // used to compute Connect's displayName from the wrapped component's displayName.
      getDisplayName: name => `Connect(${name})`,

      // if mapStateToProps is falsy, the Connect component doesn't subscribe to store state changes
      // 如果 mapStateToProps 是 falsy value, Connect 组件不会去订阅 store 的变化
      shouldHandleStateChanges: Boolean(mapStateToProps),

      // passed through to selectorFactory
      // 需要注意的，这三个玩意儿，全部都是 ”二阶函数“，执行后返回函数A，函数A执行返回函数B = =
      initMapStateToProps,
      initMapDispatchToProps,
      initMergeProps,

      // 默认值就当作 true
      pure,
      // areStatesEqual = strictEqual,
      // areOwnPropsEqual = shallowEqual,
      // areStatePropsEqual = shallowEqual,
      // areMergedPropsEqual = shallowEqual,
      areStatesEqual,
      areOwnPropsEqual,
      areStatePropsEqual,
      areMergedPropsEqual,

      // any extra options args can override defaults of connect or connectAdvanced
      ...extraOptions
    })
  }
}

export default createConnect()
