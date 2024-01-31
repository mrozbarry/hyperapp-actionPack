import { collect, composable } from 'composable-state';

export const create = () => {
  const actions = {};
  let middleware = [];

  const declare = (name, callback) => {
    if (name in actions) {
      throw new Error(`Cannot redeclare action "${name}"`);
    }

    actions[name] = (middlewareFns = []) => (state, props) => {
      const [actionMutations, ...effects] = [].concat(callback(props, state));
      const nextState = composable(state, collect([...middlewareFns.map(fn => fn(props)), actionMutations]));
      return [nextState, ...effects];
    };

    return actions[name];
  };

  const act = (name, props) => {
    if (!(name in actions)) {
      throw new Error(`Cannot run action "${name}", it was not declared`);
    }
    const tuple = [actions[name](middleware), props];
    middleware = [];

    return tuple;
  };

  const callback = (name) => {
    if (!(name in actions)) {
      throw new Error(`Cannot run action "${name}", it was not declared`);
    }
    const action = actions[name](middleware);
    middleware = [];
    return action;
  };

  const andThenFx = (dispatch, { args }) => dispatch(...args);
  const andThen = (name, props = {}) => [andThenFx, { args: act(name, props) }];

  const withMiddleware = (middlewareFns = []) => {
    middleware = middleware.concat(middlewareFns);
    return {
      withMiddleware,
      act,
      callback,
    };
  };

  return {
    declare,
    act,
    callback,
    withMiddleware,
    andThen,
  };
};
