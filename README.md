# Hyperapp Action Pack

This is a proof of concept of how to build actions in a service container that you can manage globally.

See [composable-state](https://github.com/mrozbarry/composable-state) for documentation

## Example

### /actions/bootstrap.js

```js
import { create } from 'hyperapp-actionpack';
export const actionPack = create();
```

### /actions/group1.js

```js
import { actionPack } from './bootstrap.js';
import { select, replace } from 'composable-state';

actionPack.declare('group1.thing', (props) => [
  select('foo', replace(props.foo)),
]);
// equivalent of:
/// const thing = (state, props) => ({ ...state, foo: props.foo });
```

### /actions/index.js

```js
import { actionPack } from './bootstrap.js';

import './group1.js';

export { actionPack };
```

### /components/button.js

```js
import { actionPack } from '../actions/index.js';

h('button', { type: 'button', onclick: actionPack.act('group1.thing', { foo: 'test' }) }, text('Click me'));
```

### /index.js

```
import { app } from 'hyperapp';
import { actionPack } from '/actions.index.js';

app({
  // ...
  subscriptions: (state) => [
    mySubscription({ onDone: actionPack.callback('group1.thing') }),
  ],
});
```
