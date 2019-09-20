# Flux

## 大图 / 概览图 / 简略图
![flux-flow](flux-flow.png)

大图用于预览 / 回顾，代码调用 / 响应流程基本上从下往上，源码阅读顺序建议从上往下。

在此文件夹内，也已标注好了代码阅读顺序。

* 0.invariant.js
* 1.abstractMethod.js
* 2.Dispatcher.js
* 3.waitForDemo.js
* 4.FluxStore.js
* 5.FluxReduceStore.js
* 6.FluxStoreGroup.js
* 7.FluxContainerSubscriptions.js
* 8.FluxContainer.js
* 9.FluxMixinLegacy.js

## 感受
* 初看，会有点觉得这代码有点乱乱的感觉，组合得七七八八，到跑完 `waitForDemo` 之后，就都明晰了，waitFor 的设计还是比较巧妙的（既确保了只运行一次，也确保了只在最后运行），就是这 `waitFor` 的命名，比较容易让人产生歧义
* 把很多边界情况下的处理，错误的调用方式，都通过代码层面检测限定了，比较完善，特别是 `dispatcher.dispatch` 内部，可以看出是相当严谨了
* 因为 `FluxStoreGroup` 限定了所有传入的 `store` 的 `dispatcher` 必须为同一个，这也就意味着，如果要把不同的 `store` 整合进一个 `component`，那就必须使用相同的 `dispatcher` 去初始化这些 `store`

## Demo
如果想跟随调用方式，更清晰了解 Flux 的运作方式，可以查看此部分代码

![controlpannel - 2.flux](https://github.com/Xaber20110202/flux-redux-demo/tree/master/src/2.flux)