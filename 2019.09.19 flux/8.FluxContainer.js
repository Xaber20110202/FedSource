/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FluxContainer
 * @flow
 */

'use strict';

import type FluxStore from 'FluxStore';

const FluxContainerSubscriptions = require('FluxContainerSubscriptions');
const React = require('react');

const invariant = require('invariant');
const shallowEqual = require('shallowEqual');

const {Component} = React;

type Options = {
  pure?: ?boolean,
  withProps?: ?boolean,
  withContext?: ?boolean,
};

const DEFAULT_OPTIONS = {
  pure: true,
  withProps: false,
  withContext: false,
};

/**
 * A FluxContainer is used to subscribe a react component to multiple stores.
 * The stores that are used must be returned from a static `getStores()` method.
 *
 * The component receives information from the stores via state. The state
 * is generated using a static `calculateState()` method that each container
 * must implement. A simple container may look like:
 *
 *   class FooContainer extends Component {
 *     static getStores() {
 *       return [FooStore];
 *     }
 *
 *     static calculateState() {
 *       return {
 *         foo: FooStore.getState(),
 *       };
 *     }
 *
 *     render() {
 *       return <FooView {...this.state} />;
 *     }
 *   }
 *
 *   module.exports = FluxContainer.create(FooContainer);
 *
 * Flux container also supports some other, more advanced use cases. If you need
 * to base your state off of props as well:
 *
 *   class FooContainer extends Component {
 *     ...
 *
 *     static calculateState(prevState, props) {
 *       return {
 *         foo: FooStore.getSpecificFoo(props.id),
 *       };
 *     }
 *
 *     ...
 *   }
 *
 *   module.exports = FluxContainer.create(FooContainer, {withProps: true});
 *
 * Or if your stores are passed through your props:
 *
 *   class FooContainer extends Component {
 *     ...
 *
 *     static getStores(props) {
 *       const {BarStore, FooStore} = props.stores;
 *       return [BarStore, FooStore];
 *     }
 *
 *     static calculateState(prevState, props) {
 *       const {BarStore, FooStore} = props.stores;
 *       return {
 *         bar: BarStore.getState(),
 *         foo: FooStore.getState(),
 *       };
 *     }
 *
 *     ...
 *   }
 *
 *   module.exports = FluxContainer.create(FooContainer, {withProps: true});
 */
function create<DefaultProps, Props, State>(
  Base: ReactClass<Props>,
  options?: ?Options,
): ReactClass<Props> {
  // Base 必须有 getStores 和 calculateState 静态方法
  enforceInterface(Base);

  // Construct the options using default, override with user values as necessary.
  const realOptions = {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
  };

  const getState = (state, maybeProps, maybeContext) => {
    // 根据 options.withProps，是否传递 原来的 props 进来给 calculateState
    const props = realOptions.withProps ? maybeProps : undefined;
    // 根据 options.withContext，是否传递 原来的 context 进来给 calculateState
    const context = realOptions.withContext ? maybeContext : undefined;
    // Base 必须有 calculateState 方法
    return Base.calculateState(state, props, context);
  };

  const getStores = (maybeProps, maybeContext) => {
    const props = realOptions.withProps ? maybeProps : undefined;
    const context = realOptions.withContext ? maybeContext : undefined;
    // 同上
    return Base.getStores(props, context);
  };

  // Build the container class.
  // 有趣的是，”包裹“ 实际上是继承原来的组件
  class ContainerClass extends Base {
    _fluxContainerSubscriptions: FluxContainerSubscriptions;

    constructor(props: Props, context: any) {
      super(props, context);
      this._fluxContainerSubscriptions = new FluxContainerSubscriptions();
      // 把 stores 做成一个 fluxStoreGroup
      // 硬性要求：getStores 返回的所有的 stores，必须有相同的 dispatcher （这么看起来 dispatcher 只能有一个？？）
      this._fluxContainerSubscriptions.setStores(getStores(props, context));
      this._fluxContainerSubscriptions.addListener(() => {
        // ===============================================================================================
        // 这样也就有了 dispatch action，对应的 
        // 所有传递了该 dispatcher 而创建的的 FluxStore 实例接受到 action payload
        // fluxStore 实例的 __invokeOnDispatch 进行 reduce，判断数据是否变化，再进行 change 事件发送 
        // FluxStoreGroup 给 所有的 传递的 fluxStore 编成一组，并增加另一个 register callback，每次 dispatch 发生，也会调用这个 callback
        // 但是 FluxContainerSubscriptions 内部，通过 store.addListener 进行了处理，只有收到 change 事件，才会 setChanged
        // 传递给 FluxStoreGroup 的 callCallbacks 也是需要这个 changed 才会进行调用
        // 即，进行这个 callback，进行 this.setState
        // ===============================================================================================
        this.setState(
          (prevState, currentProps) => getState(
            prevState,
            currentProps,
            context,
          ),
        );
      });
      // 即 Base.calculateState 返回值
      const calculatedState = getState(undefined, props, context);
      // 初始化 this.state
      this.state = {
        ...(this.state || {}),
        ...calculatedState,
      };
    }

    componentWillReceiveProps(nextProps: any, nextContext: any): void {
      // 仍然调用 父级的 componentWillReceiveProps
      // 这么看，其实调用 Base.componentWillReceiveProps 也行
      if (super.componentWillReceiveProps) {
        super.componentWillReceiveProps(nextProps, nextContext);
      }

      if (realOptions.withProps || realOptions.withContext) {
        // Update both stores and state.
        // 如果 配置了，realOptions.withProp / realOptions.withContext
        // 重新设置 stores
        this._fluxContainerSubscriptions.setStores(
          // 根据最新的 nextProps, nextContext 重新获取 stores
          // _fluxContainerSubscriptions.setStores 这里有一个点，可以提一下
          // 前面内部有 shallowArrayEqual 检测，因此如果 stores 数据项引用值不变的话，不会重置
          getStores(nextProps, nextContext),
        );
        this.setState(prevState => getState(prevState, nextProps, nextContext));
      }
    }

    componentWillUnmount() {
      if (super.componentWillUnmount) {
        super.componentWillUnmount();
      }

      // 清除
      this._fluxContainerSubscriptions.reset();
    }
  }

  // Make sure we override shouldComponentUpdate only if the pure option is
  // specified. We can't override this above because we don't want to override
  // the default behavior on accident. Super works weird with react ES6 classes.
  const container = realOptions.pure
    ? createPureComponent(ContainerClass)
    : ContainerClass;

  // Update the name of the container before returning
  // 换个名字 （俺是你儿子但是比你强）
  const componentName = Base.displayName || Base.name;
  container.displayName = 'FluxContainer(' + componentName + ')';
  return container;
}

// pure 的话，再包一层，是个孙子
function createPureComponent<DefaultProps, Props, State>(
  BaseComponent: ReactClass<Props>
): ReactClass<Props> {
  class PureComponent extends BaseComponent {
    shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
      return (
        !shallowEqual(this.props, nextProps) ||
        !shallowEqual(this.state, nextState)
      );
    }
  }
  return PureComponent;
}


function enforceInterface(o: any): void {
  invariant(
    o.getStores,
    'Components that use FluxContainer must implement `static getStores()`'
  );
  invariant(
    o.calculateState,
    'Components that use FluxContainer must implement `static calculateState()`'
  );
}

/**
 * This is a way to connect stores to a functional stateless view. Here's a
 * simple example:
 *
 *   // FooView.js
 *
 *   function FooView(props) {
 *     return <div>{props.value}</div>;
 *   }
 *
 *   module.exports = FooView;
 *
 *
 *   // FooContainer.js
 *
 *   function getStores() {
 *     return [FooStore];
 *   }
 *
 *   function calculateState() {
 *     return {
 *       value: FooStore.getState();
 *     };
 *   }
 *
 *   module.exports = FluxContainer.createFunctional(
 *     FooView,
 *     getStores,
 *     calculateState,
 *   );
 *
 */
function createFunctional<Props, State, A, B>(
  viewFn: (props: State) => React.Element<State>,
  getStores: (props?: ?Props, context?: any) => Array<FluxStore>,
  calculateState: (prevState?: ?State, props?: ?Props, context?: any) => State,
  options?: Options,
): ReactClass<Props> {
  class FunctionalContainer extends Component<void, Props, State> {
    state: State;
    static getStores(props?: ?Props, context?: any): Array<FluxStore> {
      return getStores(props, context);
    }

    static calculateState(
      prevState?: ?State,
      props?: ?Props,
      context?: any,
    ): State {
      return calculateState(prevState, props, context);
    }

    // 函数式组件 包了一层， state 在 viewFn 内变成 props
    // 而上面的 create 调用， store 中整合进的数据，仍然是 state 
    render(): React.Element<State> {
      return viewFn(this.state);
    }
  }
  // Update the name of the component before creating the container.
  const viewFnName = viewFn.displayName || viewFn.name || 'FunctionalContainer';
  FunctionalContainer.displayName = viewFnName;
  return create(FunctionalContainer, options);
}

module.exports = {create, createFunctional};