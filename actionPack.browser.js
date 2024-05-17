define((function () { 'use strict';

  const composable = (state, immutableAction) => typeof immutableAction === 'function'
    ? immutableAction(state)
    : immutableAction;

  const merge = (immutableAction) => (state) => ({
    ...state,
    ...composable(state, immutableAction),
  });

  const concat = (immutableAction) => (state) => state
    .concat(composable(state, immutableAction));

  const setIn = (key, immutableAction) => (state) => {
    const value = Array.isArray(state)
      ? [...state]
      : { ...state };

    value[key] = composable(value[key], immutableAction);

    return value;
  };

  const replace = (object) => (previous) => typeof object === 'function'
    ? object(previous)
    : object;

  const selectArray = (path, immutableAction) => (state) => {
    if (path.length === 0) {
      return composable(state, immutableAction);
    }

    const key = path[0];

    return composable(state, setIn(
      key,
      selectArray(path.slice(1), immutableAction)
    ));
  };

  const pathSplitRegexp = /(\w+|\[[^\]]+\])/gm;

  const pathSplit = (path) => Array.from(path.match(pathSplitRegexp))
    .map(entry => entry.replace('[', '').replace(']', ''));

  const select = (path, immutableAction) => selectArray(
    pathSplit(path),
    immutableAction,
  );

  const selectAll = (pathsWithActions) => (state) => {
    return Object.keys(pathsWithActions).reduce((memo, path) => {
      return composable(memo, select(path, pathsWithActions[path]));
    }, state);
  };

  const collect = (immutableActions) => (state) => {
    return immutableActions.reduce(
      (memo, action) => composable(memo, action),
      state,
    );
  };

  const map = (fn) => replace(
    array => array.map((value, index) => composable(value, fn(value, index)))
  );

  const range = (start, length, immutableAction) => state => (
    state.slice(0, start)
      .concat(composable(state.slice(start, start + length), immutableAction))
      .concat(state.slice(start + length))
  );

  var composable$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    collect: collect,
    composable: composable,
    concat: concat,
    map: map,
    merge: merge,
    pathSplit: pathSplit,
    range: range,
    replace: replace,
    select: select,
    selectAll: selectAll,
    selectArray: selectArray,
    setIn: setIn
  });

  const nullLogger = {
    groupCollapsed: () => {},
    groupEnd: () => {},
    log: () => {},
  };

  const action = (name, fn, middleware = [], logger = nullLogger) => {
    return (state, props) => {
      logger.groupCollapsed('actionPack.run', name);

      logger.log('middleware', middleware);
      logger.log('state', state);
      logger.log('props', props);

      const [actionMutations, ...effects] = [].concat(fn(props, state, composable$1));
      logger.log('mutations', actionMutations);
      logger.log('effects', effects);

      const nextState = composable(state, collect([...middleware.map(callback => callback(props)), actionMutations]));
      logger.log('computed state', nextState);

      logger.groupEnd();

      return [nextState, ...effects];
    };
  };

  class ActionPack
  {
    #logger = null;
    #actions = {};

    /**
     * @param {Console} logger
     */
    constructor(logger) {
      this.#logger = logger || nullLogger;

      this.declare = this.declare.bind(this);
      this.callback = this.callback.bind(this);
      this.act = this.act.bind(this);
      this.run = this.run.bind(this);
      this.andThen = this.andThen.bind(this);
    }

    /**
     * @param {string} name
     * @param {Function} stateMutator
     * @returns {Function}
     */
    declare(name, stateMutator) {
      if (name in this.#actions) {
        throw new Error(`Cannot redeclare action "${name}"`);
      }

      this.#actions[name] = action(name, stateMutator, [], this.#logger);
      return this.#actions[name];
    }

    /**
     * @param {string} name
     * @returns {Function}
     */
    callback(name) {
      if (!(name in this.#actions)) {
        throw new Error(`Cannot find action "${name}", it was not declared`);
      }
      return this.#actions[name];
    }

    /**
     * @param {string} name
     * @returns {Array}
     */
    act(name, props) {
      return [this.callback(name), props];
    }

    /**
     * @param {string} name
     * @props {Object} props
     * @props {Object} initialState
     * @returns {Array}
     */
    run(name, props, initialState) {
      const runner = this.callback(name);
      this.#logger.log('run', name, runner);
      return runner(initialState, props);
    }

    andThenFx(dispatch, { fn, props }) {
      return dispatch(fn, props);
    }

    /**
     * @param {string} name
     * @props {Object} props
     * @returns {Array}
     */
    andThen(name, props) {
      return [this.andThenFx, { fn: this.callback(name), props }];
    }
  }

  const factory = () => {
    let directory = {};

    /**
     * @param {string} name
     * @param {Console} logger
     * @returns {ActionPack}
     */
    return (name = 'default', logger = nullLogger) => {
      if (!(name in directory)) {
        directory[name] = new ActionPack(logger);
      }
      return directory[name];
    };
  };

  ActionPack.singleton = factory();

  return ActionPack;

}));
