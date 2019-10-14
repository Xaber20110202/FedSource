# reselect

此文包含：

1. reselect 源码分析
2. reselect 可能的问题（dependences 函数运行）
3. 首参 `state` 的注入，减少重复工作量

## 源码分析
[2019.10.14 reselect/reselect.js](https://github.com/Xaber20110202/FedSource/blob/master/2019.10.14%20reselect/reselect.js)

## 概览
1. 代码量较少，仍旧是 闭包、函数式用得飞起
2. 核心方法就两个：`defaultMemoize`、`createSelectorCreator`
3. 值的缓存功能，作用在最后一个计算函数上，对于中间 dependences 函数数组，尽管也做了 `memoize`，但是基本上就是 state 一个变化，都会执行一遍。但是如果基本只是属性的获取，就没什么影响

## 可能的问题
> “人类的本质是复读机”
> 值的缓存功能，作用在最后一个计算函数上，对于中间 dependences 函数数组，尽管也做了 `memoize`，但是基本上就是 state 一个变化，都会执行一遍。但是如果基本只是属性的获取，就没什么影响

### 问题反映

```js
const shopItemsSelector = state => {
  console.log('shopItemsSelector run')
  return state.shop.items
}
const taxPercentSelector = state => {
  console.log('taxPercentSelector run')
  return state.shop.taxPercent
}
const subtotalSelector = createSelector(
  shopItemsSelector,
  items => {
    console.log('subtotalSelector run')
    return items.reduce((acc, item) => acc + item.value, 0)
  }
)
const taxSelector = createSelector(
  subtotalSelector,
  taxPercentSelector,
  (subtotal, taxPercent) => {
    console.log('taxSelector run')
    return subtotal * (taxPercent / 100)
  }
)
const totalSelector = createSelector(
  subtotalSelector,
  taxSelector,
  (subtotal, tax) => {
    console.log('totalSelector run')
    return ({ total: subtotal + tax })
  }
)
let exampleState = {
  shop: {
    taxPercent: 8,
    items: [
      { name: 'apple', value: 1.20 },
      { name: 'orange', value: 0.95 },
    ]
  }
}
totalSelector(exampleState)
// logs:
// shopItemsSelector run
// subtotalSelector run
// taxPercentSelector run
// taxSelector run
// totalSelector run

// 更新
exampleState = {
  ...exampleState,
}
totalSelector(exampleState)
// logs:
// shopItemsSelector run
// taxPercentSelector run
```

分析：[2019.10.14 reselect/reselect.js#L88](https://github.com/Xaber20110202/FedSource/blob/master/2019.10.14%20reselect/reselect.js#L88)

### 可能的处理方式
将 `selector` 的参数，做最简化整合，例如：

```js
const shopItemsSelector2 = shop => {
  console.log('shopItemsSelector2 run')
  return shop.items
}
const taxPercentSelector2 = shop => {
  console.log('taxPercentSelector2 run')
  return shop.taxPercent
}
const subtotalSelector2 = createSelector(
  shopItemsSelector2,
  items => {
    console.log('subtotalSelector2 run')
    return items.reduce((acc, item) => acc + item.value, 0)
  }
)
const taxSelector2 = createSelector(
  subtotalSelector2,
  taxPercentSelector2,
  (subtotal, taxPercent) => {
    console.log('taxSelector2 run')
    return subtotal * (taxPercent / 100)
  }
)
const totalSelector2 = createSelector(
  subtotalSelector2,
  taxSelector2,
  (subtotal, tax) => {
    console.log('totalSelector2 run')
    return ({ total: subtotal + tax })
  }
)

let exampleState2 = {
  shop: {
    taxPercent: 8,
    items: [
      { name: 'apple', value: 1.20 },
      { name: 'orange', value: 0.95 },
    ]
  }
}
totalSelector2(exampleState2.shop)
// logs:
// shopItemsSelector2 run
// subtotalSelector2 run
// taxPercentSelector2 run
// taxSelector2 run
// totalSelector2 run

exampleState2 = {
  ...exampleState2,
}
totalSelector2(exampleState2.shop)
// logs: no logs
```

1. 将 `selector` 的参数，做最简化整合，即将 `selector` 依赖的数据控制在最小范围，相对的整个 state 改变的话，不会使得 `dependences` 函数数组整个全部执行一遍
2. **但是**
    1. 相对的可能也带来了维护、协作上的复杂度：因为需要在函数调用前，先将 `shop` 提取出来再进行传递，而不是直接把 state 整个扔进去，这方面带来的性能提升相较中间投入的精力，基本上就是得不偿失
    2. `selector` 的首个参数不一致（不是 `state`，可能是 `shop`、`items` 等等），也就无法做 首参 `state` 的注入

## 首参 `state` 的注入，减少重复工作量
```js
import { createSelector } from 'reselect'

export function newSelector(...args) {
  let selector
  const func = args.pop()

  const getSelector = () => {
    return createSelector(args, func)
  }

  return (...params) => {
    if (!selector) selector = getSelector()
    return selector(store.getState(), ...params)
  }
}

// mock redux
const store = {
  getState() {
    return {
      shop: {
        taxPercent: 8,
        items: [
          { name: 'apple', value: 1.20 },
          { name: 'orange', value: 0.95 },
        ]
      }
    }
  }
}

// 应用
const shopItemsSelector = state => state.shop.items
const taxPercentSelector = state => state.shop.taxPercent

const subtotalSelector = newSelector(
  shopItemsSelector,
  items => items.reduce((acc, item) => acc + item.value, 0)
)
const taxSelector = newSelector(
  subtotalSelector,
  taxPercentSelector,
  (subtotal, taxPercent) => subtotal * (taxPercent / 100)
)
const totalSelector = newSelector(
  subtotalSelector,
  taxSelector,
  (subtotal, tax) => ({ total: subtotal + tax })
)

// 调用方式
totalSelector()
```

## 结语
更多层面来看，个人理解，最大的作用还是带来的规范化，避免代码的混乱；带来的缓存计算结果来进行的性能优化，反倒是没有那么特别突出

