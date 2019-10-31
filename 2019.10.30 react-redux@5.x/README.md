
## 核心内容
1. Context
2. connect 内的 wrapWithConnect
3. subscribe

## 先了解下 Context
1. [context-demo.html](TODO:)

PS：

1. 这里因为图方便，直接拿的 react-redux@5.x 的源码，使用的是老的 即将废弃的 Context API [https://react.docschina.org/docs/legacy-context.html](https://react.docschina.org/docs/legacy-context.html)
2. 当然，新的 Context API 性能会好一些，但是就 react-redux 实现思路上，差距不大

## 解疑与问题
TODO:
1. 简单描述就是，context 只是用来共享数据，获取用的，而不是拿来做 context 数据变更响应用 「不是 context 变更，自动触发更新哦」
2. context 是 store，但是我们平时 dispatch 也只会更改 store 下面某一个数据值，不会改变 store 本身。那 context 引用值都没变，react-redux 又是怎么触发更新的呢？ 那么怎么触发的更新？

答案 —— subscribe

## 分析
### Provider
1. createProvider

一笔带过，没啥东西，可以参考源代码：TODO:

### connect
备注： `createConnect` 有不少参数，但是 connect 函数是由 `createConnect` 默认参数返回的，因此这里，全部使用默认参数做分析。

1. `createConnect` 函数调用 返回 connect 函数
2. `connect` 函数，实际执行的是以下代码

  ```js
  return connectAdvanced(finalPropsSelectorFactory, {
    // used in error messages
    methodName: 'connect',

      // used to compute Connect's displayName from the wrapped component's displayName.
    getDisplayName: name => `Connect(${name})`,

    // if mapStateToProps is falsy, the Connect component doesn't subscribe to store state changes
    // 如果 mapStateToProps 是 falsy value, Connect 组件不会去订阅 store 的变化
    shouldHandleStateChanges: Boolean(mapStateToProps),

    // passed through to selectorFactory
    // 需要注意的，这三个玩意儿，全部都是 ”二阶函数“，执行后返回函数A，函数A执行返回函数B = =
    initMapStateToProps: match(mapStateToProps, mapStateToPropsFactories, 'mapStateToProps'),
    initMapDispatchToProps: match(mapDispatchToProps, mapDispatchToPropsFactories, 'mapDispatchToProps'),
    initMergeProps: match(mergeProps, mergePropsFactories, 'mergeProps'),

    // 默认值就当作 true
    pure,
    areStatesEqual: strictEqual,
    areOwnPropsEqual: shallowEqual,
    areStatePropsEqual: shallowEqual,
    areMergedPropsEqual: shallowEqual,

    // any extra options args can override defaults of connect or connectAdvanced
    ...extraOptions
  })
  ```

3. `connectAdvanced` 函数调用，返回 `wrapWithConnect` 函数
4. `wrapWithConnect(WrappedComponent)` 就一切都通了
5. `connect(mapStateToProps, mapDispatchToProps, mergeProps, { pure, areStatesEqual, areOwnPropsEqual, areStatePropsEqual, areMergedPropsEqual, ...extraOptions })(Component)` 得到新的 Connect 组件
6. 最终的调用其实，都汇聚在 `connectAdvanced` 和 `wrapWithConnect` 内部，对应以下两个函数执行
    * `connect(mapStateToProps, mapDispatchToProps, mergeProps, { pure, areStatesEqual, areOwnPropsEqual, areStatePropsEqual, areMergedPropsEqual, ...extraOptions })(Component)`
    * `connectResultFunc(Component)`
7. **更准确的说，应该是 `wrapWithConnect` （包含了几乎全部的调用），即 `connectAdvanced.js 内的 wrapWithConnect`**

### 内容过多请移步 XXX

## 其他
说一千道一万，react-redux 7.x 也是类似

同理，flux 的 Container 也是通过 subscribe 实现的，感兴趣的可以瞄一眼 —— TODO: flux 分析链接 【PS：不过建议不用看，毕竟是次世代产物，看了也记不住浪费时间 微笑】