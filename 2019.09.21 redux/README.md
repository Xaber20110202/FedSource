# Redux

## 概览
在此文件夹内，已标注代码阅读顺序。

* 0.createStore.js —— 创建 store
* 1.combineReducers.js —— 组合多个 reducer 为一个 函数的工具
* 2.compose.js —— 主要用于 精简 多个 `enhancer` 的工具
* 3.applyMiddleware.js —— 插件 系统 / 功能 实现
* 4.bindActionCreators.js —— action 与 dispatch 结合的工具
* 5.index.js —— 入口文件

## 感受
1. 最复杂 / 精妙的地方，在 applyMiddleWare 和 compose 这两处代码，这两块 OK 了，redux 就 OK 了 （本来代码量就少，而且 `combineReducers` 和 `bindActionCreators` 也没有太大看的意义）
2. 设计比 flux 确实精妙多了

## 其他
基于 Flux 的缺陷

> 1. 因为 `FluxStoreGroup` 限定了所有传入的 `store` 的 `dispatcher` 必须为同一个，这也就意味着，如果要把不同的 `store` 整合进一个 `component`，那就必须使用相同的 `dispatcher` 去初始化这些 `store`，其实也就意味着，基本上你只需要一个 `new Dispatcher` 出来
> 2. 多数据 store，可能存在数据间的依赖，尽管 flux 设计了 `waitFor`，也非常巧妙，但在使用者纬度上看起来，还是比较取巧（更希望的是，一次性把数据变更完）
> 3. `Container` 的包裹是以继承原 类型 的形式来做的，最终数据被集成在 `this.state` 内，而函数式组件，数据集成则需要通过 `props` 获取，详细可见：[counter.js - 2.flux](https://github.com/Xaber20110202/flux-redux-demo/blob/master/src/2.flux/counter.js)
> 4. 数据变更的 `log` 记录，需要手动 `xxStore.addListener` 的方式，或者注释掉 Flux 源码内的这行有趣的代码 [FluxContainerSubscriptions console.log](https://github.com/Xaber20110202/FedSource/blob/master/2019.09.19%20flux/7.FluxContainerSubscriptions.js#L79)
> 5. 因为 `getInitialState` 数据定义 和 `reduce` 数据更新方式，限定必须在 Store 的继承类上实现，因此只要一改动 `reduce` 代码，hotreload 进行之后，相应的原来网页上已经触发变化的 数据 状态，又会回到 `initialState`
> 6. 以及两外两个缺陷（引用摘自 [《看漫画，学 Redux》 —— A cartoon intro to Redux](https://github.com/jasonslyvia/a-cartoon-intro-to-redux-cn)）
>     1. 插件体系：不易于扩展，没有合适的位置实现第三方插件
>     2. 时间旅行（撤回 / 重做）功能：~~每次触发 action 时状态对象都被直接改写了~~，个人理解，因为 flux 定义多个 store，而且没有插件系统，难以实现 时间旅行 功能

1. 只有一个 dispatch 方法，在 store 上
2. 单一数据源： 一个 store
3. `Container` 的功能，单独放在 `react-redux` 上，将 `redux` 部分作为精确 / 精简 / 细分的模块，只负责数据更新、插件系统部分
4. 通过 `applyMiddleWare`、`enhancer` 和 `componse`，实现完整 / 完善 / 优美的 插件 / 增强 系统，当然也包括 `logger`、`thunk` 等等
5. 将 `reduce` 部分 和 `store` 部分分开，单独提供了一个 `replaceReducer`，用于实现 hotReload 但是将原来 `store.getState()` 已经变更的数据又重新初始化
6. 另外两个解决
    1. 插件系统，上方已提到
    2. 时间旅行（撤回 / 重做）的工具 [redux-devtools](https://github.com/reduxjs/redux-devtools)


## Demo
如果想跟随调用方式，更清晰了解 Redux 的运作方式，可以查看此部分代码

[controlpannel - 3.redux](https://github.com/Xaber20110202/flux-redux-demo/tree/master/src/3.redux)