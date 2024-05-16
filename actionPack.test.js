import assert from 'node:assert/strict';
import { describe, it, beforeEach } from "node:test";

import { ActionPack } from './actionPack.js';
import { select, replace } from 'composable-state';

const fakeFn = (func) => {
  const calls = [];
  const wrapper = (...args) => {
    const result = func(...args);
    calls.push({
      args,
      result,
    });
    return result;
  };

  wrapper.calls = calls;

  return wrapper;
}

describe('lib/actionPack.js', () => {
  /** @type {?ActionPack} */
  let actionPack = null;

  beforeEach(() => {
    actionPack = new ActionPack();
  });

  describe('declare', () => {
    it('wraps an state update into an action function', () => {
      actionPack.declare(
        'foobar',
        (_props) => select('foo', replace('baz'))
      );

      assert.equal('function', typeof actionPack.callback('foobar'));
      assert.deepEqual([{ foo: 'baz' }], actionPack.run('foobar', {}, { foo: 'bar' }));
    });

    it('wraps an state with a prop update into an action function', () => {
      actionPack.declare(
        'foobar',
        (props) => select('foo', replace(props.value))
      );

      assert.equal('function', typeof actionPack.callback('foobar'));
      assert.deepEqual([{ foo: 'test' }], actionPack.run('foobar', { value: 'test' }, { foo: 'bar' }));
    });

    it('wraps an state update with an effect into an action function', () => {
      const fx = () => {};

      actionPack.declare(
        'foobar',
        (_props) => [
          select('foo', replace('baz')),
          [fx, {}],
        ],
      );

      assert.equal('function', typeof actionPack.callback('foobar'));
      assert.deepEqual([{ foo: 'baz' }, [fx, {}]], actionPack.run('foobar', {}, { foo: 'bar' }));
    });

    it('does not redeclare an action', () => {
      actionPack.declare(
        'foobar',
        (_props) => select('foo', replace('baz'))
      );

      assert.throws(() => 
        actionPack.declare(
          'foobar',
          (_props) => select('foo', replace('baz'))
        )
      );
    });
  });

  describe('callback', () => {
    let actionFunction = null;

    beforeEach(() => {
      actionFunction = actionPack.declare('test', () => replace(true));
    });

    it('returns the same action function', () => {
      assert.equal('function', typeof actionPack.callback('test'));
      assert.strictEqual(actionFunction, actionPack.callback('test'));
      assert.strictEqual(actionPack.callback('test'), actionPack.callback('test'));
    });

    it('throws if the action has not been declared', () => {
      assert.throws(() => actionPack.callback('foo'));
    });
  });

  describe('act', () => {
    let actionFunction = null;

    beforeEach(() => {
      actionFunction = actionPack.declare('test', () => replace(true));
    });

    it('returns a tuple', () => {
      const props = { foo: 'bar' };

      assert.deepEqual([actionFunction, props], actionPack.act('test', props));
    });
  });

  describe('andThenFx', () => {
    let actionFunction = null;

    beforeEach(() => {
      actionFunction = actionPack.declare('test', () => replace(true));
    });

    it('dispatches the action through an effect', () => {
      const dispatch = fakeFn(() => {});
      const props = { foo: 'bar' };

      actionPack.andThenFx(dispatch, { fn: actionFunction, props });

      assert.equal(1, dispatch.calls.length);
      assert.deepEqual([actionFunction, props], dispatch.calls[0].args);
    });
  });

  describe('andThen', () => {
    let actionFunction = null;

    beforeEach(() => {
      actionFunction = actionPack.declare('test', () => replace(true));
    });

    it('dispatches the action through an effect', () => {
      const dispatch = fakeFn(() => {});
      const props = { foo: 'bar' };

      assert.deepEqual([actionPack.andThenFx, { fn: actionFunction, props }], actionPack.andThen('test', props));
    });
  });
});

