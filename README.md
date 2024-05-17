# Hyperapp Action Pack

This is a proof of concept of how to build [hyperapp](https://github.com/jorgebucaran/hyperapp) actions in a container that you can manage globally.

See [composable-state](https://github.com/mrozbarry/composable-state) for documentation on state updates.

## Install

```sh
npm install --save @mrbarrysoftware/hyperapp-actionPack
```

## Example

### Simplest

How to wire your actions into your app.

```js
import ActionPack from '@mrbarrysoftware/hyperapp-actionPack';
import { app, h, text } from 'hyperapp';
import { select, replace } from 'composable-state';

const actions = new ActionPack();

actions.declare('++', (props) => composable.select('counter', composable.replace(old => old + 1)));
actions.declare('--', (props) => composable.select('counter', composable.replace(old => old - 1)));

app({
  init: {
    counter: 0,
  },

  view: (state) => {
    return h('div', { style: { display: 'flex', justifyContent: 'center', alignItems: 'center' } }, [
      h('button', { type: 'button', onclick: actions.act('--') }, text('-1')),

      h('div', {}, text(`${state.counter}`)),

      h('button', { type: 'button', onclick: actions.act('++') }, text('+1')),
    ]);
  },
});
```
### Conditional updates based on state

Get access to the global state to decide how to properly update the state.

```js
import ActionPack from '@mrbarrysoftware/hyperapp-actionPack';
import { select, replace, collect } from 'composable-state';

const actions = new ActionPack();

actions.declare('play-sound', (props, state) => (
  state.enabled
    ? select('audioSrc', props.audioSrc)
    : collect([])
));
```

### Composable exposed in stateMutators

As a convenience, all composable-state mutators are available as a third parameter to your state-mutator method.

```js
import ActionPack from 'hyperapp-actionPack';

const actions = new ActionPack();

actions.declare('++', (props, _state, { select, replace }) => select('counter', replace(old => old + 1)));
```

### With effects

And of course, your actions can schedule side-effects, too.

```js
import ActionPack from '@mrbarrysoftware/hyperapp-actionPack';

const actions = new ActionPack();

const effectFx = (dispatch, props) => {
  console.log(`Hello ${props.name} from my side-effect`);
};
const effect = (props) => [effectFx, props];

actions.declare('runMyEffect', (props, _state, { collect }) => [
  collect([]),
  effect({ name: 'world' }),
]));
```

### Chaining actions

Chaining actions together has never been easier

```js
import ActionPack from '@mrbarrysoftware/hyperapp-actionPack';

const actions = new ActionPack();

actions.declare('step1', (props, _state, { collect }) => [
  collect([]),
  actions.andThen('step2', props),
]);

actions.declare('step2', (props, _state, { collect }) => collect([]));
```

### Debugging

For now, debugging is strictly console/devtools based.
To turn it on, just pass the global `console` object into the constructor.
In the future, I may write proper debug/devtools adapter using the console api.

```js
import ActionPack from '@mrbarrysoftware/hyperapp-actionPack';

const actions = new ActionPack(console);

actions.declare('++', (props, _state, { select, replace }) => (
  select('counter', replace(old => old + 1))
);
```
