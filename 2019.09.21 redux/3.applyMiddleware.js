import compose from './compose'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
export default function applyMiddleware(...middlewares) {
  // 返回接受 createStore 作为参数的函数
  // 该函数再调用，会进行 createStore 的处理
  // 并且，后续会进行各种 middlewareAPI 的集成
  return createStore => (...args) => {
    const store = createStore(...args)
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      )
    }

    const middlewareAPI = {
      getState: store.getState,
      // 这一步也比较精妙，只要中间有插件调用 store.dispatch 就会报错
      dispatch: (...args) => dispatch(...args)
    }
    // 每个插件，都可以通过 middlewareAPI 调用 getState 进行相应处理
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    // 生成新的 dispatch
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      // 这一步也比较精妙了，把 dispatch 替换掉了原来 createStore 产生的 store 的 dispatch
      // 这样 每次 dispatch 调用，都会先经过各种插件中间的处理
      dispatch
    }
  }
}

/**
 * 接受 middlewares （函数列表）
 * 返回一个函数 A，而这个函数 A 的参数为 createStore
 * 函数 A 的执行结果返回值，仍然是一个函数，B
 * 函数 B 的执行过程，是通过 createStore 创建一个 store，并将 middlewares 进行 map，然后传递给 compose
 * 最终返回 store 和 新的 dispatch
 * 
 * 以 redux-thunk 为例
 * applyMiddleware(thunk) 返回的内容为
 *  (createStore) => (...args) => {
 *    const store = createStore(...args)
      let dispatch = () => {
        throw new Error(
          `Dispatching while constructing your middleware is not allowed. ` +
            `Other middleware would not be applied to this dispatch.`
        )
      }

      const middlewareAPI = {
        getState: store.getState,
        dispatch: (...args) => dispatch(...args)
      }
      const chain = [thunk].map(thunk => thunk(middlewareAPI))
      // thunk(middlewareAPI) 必须返回的，也是一个函数
      // 并且 thunk 内部不可以进行 dispatch 处理

      // 就例如 thunk 此处
      dispatch = compose(...chain)(store.dispatch)

      // 等同于 见 redux-thunk 源码 https://github.com/reduxjs/redux-thunk/blob/master/src/index.js
      dispatch = compose([(next) => (action) => {
        if (typeof action === 'function') {
          return action(dispatch, getState, extraArgument);
        }
        return next(action);
      }])(store.dispatch)

      // 等同于
      (action) => {
        if (typeof action === 'function') {
          return action(dispatch, getState, extraArgument);
        }
        return store.dispatch(action);
      }

      return {
        ...store,
        dispatch
      }
 * }
 */

// 所以以下 正常运行
// function makeASandwichWithSecretSauce(forPerson) {
//   return function(dispatch) {
//     return fetchSecretSauce().then(
//       (sauce) => dispatch(makeASandwich(forPerson, sauce)),
//       (error) => dispatch(apologize('The Sandwich Shop', forPerson, error)),
//     );
//   };
// }
// store.dispatch(makeASandwichWithSecretSauce('Me'));