import * as composable from 'composable-state';

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

    const [actionMutations, ...effects] = [].concat(fn(props, state, composable));
    logger.log('mutations', actionMutations);
    logger.log('effects', effects);

    const nextState = composable.composable(state, composable.collect([...middleware.map(callback => callback(props)), actionMutations]));
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

export default ActionPack;
