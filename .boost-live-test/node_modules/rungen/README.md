RunGen
======

This library provides a generic runtime around async flow in javascript.
This provides something like [co](https://github.com/tj/co) with the ability to extend its behaviour.
This is also largely inspired from [redux-saga](https://github.com/yelouafi/redux-saga). It first started from the idea of decoupling redux-saga from redux.

API
---

If you're familiar with co, The API here is slitely different. Instead of taking a generator and returning a promise.
We can take basically any value (pass in an iterator to have the same behavior as co for generators) and as a result uses callbacks instead of a promise.

```javascript
import {create} from 'rungen'
const myGenerator*() {
  yield new Promise()
}

const runtime = create()
const onSuccess = value => console.log('success : ' + value)
const onError = error => console.log('error : ' + error)
runtime(myGenerator(), onSuccess, onError)
```

If you want to have a similar API than `co`, It's as easy as

```javascript
const runtime = create()
const co = (input, ...args) => new Promise((resolve, reject) =>
  rungen(input.apply(null, args), resolve, reject)
)
co.wrap = input => runtime.bind(this, input)

co(myGenerator, onSuccess, onError)
```

Generic ?
---------

Co allows to you to wrap generators that yields automatically promises, iterators, arrays etc... The idea of genericity here is the ability to perform a custom process on any value depending on your needs.
We call these custom processes : controls.

Built-in Controls
-----------------

By default, you can yield generators, arrays, objects and errors : These are the base controls included in every runtime.

```javascript
import {create} from 'rungen'

// Create a runtime
const runtime = create()

const myGenerator = function*(input) {
  const value = yield input
  return value
}

// Run the generator
runtime(myGenerator, 'any value', value => {
  console.log(value) // 'any value'
}, err => {
  console.log(err)
})
```

Instead of running your generator directly, you can also get a simple function from your generator and run it later

```javascript
const myFunction = runtime.wrap(myGenerator)

// Run it later
myFunction('any value', value => {
  console.log(value) // 'any value'
}, err => {
  console.log(err)
})
```

### Sub-generators

Nesting generators is allowed using the built-in generator control.

```javascript
const increment = function* (input) {
  yield input
  return input + 1
}

runtime(function* () {
  let output = yield increment(1) // nesting
  console.log(output) // 2
  output = yield increment(output)
  console.log(output) // 3
})
```

### Arrays

By using the `all` helper, yield arrays will make the runtime resolve all the values of the array and get the result as an array.
Here is an example combining the array and the subgenerator control.

```javascript
import {all} from 'rungen'

const increment = function* (input) {
  yield input
  return input + 1
}

runtime(function* () {
  let output = yield all([
    increment(1),
    4,
    increment(3)
  ])
  console.log(output) // [2, 4, 3]
})
```

### Objects

By using the `all` helper, in the same way as arrays, yielding javascript objets will resolve all the attributes of the objects
and return an object containing the resolved values.

```javascript
import {all} from 'rungen'

const increment = function* (input) {
  yield input
  return input + 1
}

runtime(function* () {
  let output = yield all({
    a: increment(1),
    b: 4,
    c: increment(3)
  })
  console.log(output) // { a: 2, b: 4, c: 3 }
})
```

Async controls
--------------

RunGen offers you some async controls that allows you to write basically any async flow in a simple declarative way.
These controls are opt-in, this means you can choose to use them or not in your runtime. Here is how to do that.

```javascript
import {create, asyncControls} from 'rungen'

// creating a runtime with these controls
const runtime = create(asyncControls)
```

## Promise

Async controls allows you to yield promises, the runtime resolves the promise and returns the resolved value on success or trigger an error on failure.

```javascript
import {delay} from 'rungen'

runtime(function* {
  yield delay(10) // delay is just a helper that returns a promise resolved after a timeout
  const output = yield Promise.resolve(1)
  console.log(output) // 1
})
```

## fork/join

When dealing with async flows, we need a way to trigger non blocking calls, this can be done easily using the `fork` helper.

```javascript
import {fork, delay} from 'rungen'

const subGenerator = function*(timeout, input) {
  yield delay(timeout)
  console.log(input)
}

runtime(function*() {
  yield fork(subgenerator(10, 1))
  yield fork(subgenerator(5, 2))
})

// this will output 2 than 1
```

We can get the result of a forked generator using the `join` helper (join raises an error if the forked task has already finished)

```javascript
import {fork, join, delay} from 'rungen'

const subGenerator = function*(timeout, input) {
  yield delay(timeout)
  console.log(input)

  return input+1
}

runtime(function*() {
  const task1 = yield fork(subgenerator(10, 1))
  const task2 = yield fork(subgenerator(5, 2))

  yield delay(6)
  const output = yield join(task1)
  console.log(output) // 2
  yield join(task2) // throws an error because task2 is already terminated
})

// this will output 2 than 1
```

## race

Race is a special control that lets you deal with race conditions. For example : timeouts on API calls.

```javascript
import {race, delay} from 'rungen'

runtime(function*() {
  const { result, timeout } = race({
    result: fetch('/myApi'),
    timeout: delay(500)
  })

  if (timeout) {
    // fetch took more than a half second
  } else {
    console.log(result)
  }
})
```

Race can also be used using arrays

```javascript
import {race, delay} from 'rungen'

runtime(function*() {
  const [result, timeout] = race([
    fetch('/myApi'),
    delay(500)
  })

  if (timeout) {
    // fetch took more than a half second
  } else {
    console.log(result)
  }
})
```

Wrap controls
-------------

To ease testing generators without the need of mocks, we have to avoid triggering any side effect (api calls, timeouts...) in the generator.
We use some of those effects in our previous example : calling fork, join or race helpers returs a simple javascript object and doest trigger any side effect.
The wrap controls can be used to extend this mecanism to any function call.

## invoke, call and apply

those are helpers used to tell the runtime to trigger a function call, but the function is not called directory in the generator.

```javascript
import {create, invoke, wrapControls, asyncControls} from 'rungen'

runtime = create([...asyncControls, ...wrapControls])
function myApiCall(input) {
  return fetch('/api/' + input)
}

const myGenerator = function* {
  const result = yield invoke(myApiCall, 'param')

  return result
}

runtime(myGenerator)
```

testing this generator is now straighforward

```javascript
// the generator to test
const gen = myGenerator()
// Asserts
expect(gen.next().value).toEqual(invoke(myApiCall, 'param'))
expect(gen.next('result').toEqual({ done: true, value: 'result' })
```

`apply` and `call` do the same thing as the `invoke` helper with the ability to specify a context (the `this` inside the function call)

```javascript
import {call, apply} from 'rungen'

runtime(function* () {
  let result
  // these two are equivalent
  result = yield call(myFunction, context, arg1, arg2)
  result = yield apply(myFunction, context, [arg1, arg2])
})
```

## cps

In nodejs, libraries often use cps (Continuation-passing style). functions expecting the last argument to be a callback with the following signature : `(err, result) => void`
RunGen provide a helper that wraps these kind of function calls.

```javascript
import {cps} from 'rungen'

function cpsApi(timeout, output, callback) {
  setTimeout(() => callback(false, output), timeout)
}

runtime(function* () {
  const result = yield cps(cpsApi, 1000, 2)
  console.log(result) // displays 2 after one second timeout
})
```

Custom Controls
---------------

A control is an function with the following signature `(value, next) => bool`
 * the function returns a boolean whether or not, it handles the yielded value passed as argument
 * Once the value has been resolved, It should call the `next` callback with the result

Let's say we are going to create a control that allows us to get values from the localStorage
```javascript
import {create} from 'rungen'

// pushing data test
localStorage.set('token', 'myToken')

// Creating the custom control
myCustomLocalStorageControl = (value, next) {
  if (typeof value !== 'object' || value.type !== 'localstorage') return false
  next(localStorage.get(value.key))
  return true
}

// Creating a runtime with this control
runtime = create([ myCustomLocalStorageControl ])

runtime(function* () {
  const output = yield { type: 'localstorage', key: 'token' }
  console.log(output) // outputs : myToken
})
```

While this should be fine for almost all custom controls use cases, there are some cases when you would need to call some specific callbacks.
The full signature of the control is : `(value, next, runtime, yieldNext, yieldError) => bool`
   * the `next` callback : we call this with a resolved value, when we handled the current value and we have no idea about the result (like promises)
   * the `runtime` callback : the runtime itself, can be used to perform nesting
   * the `yieldNext` callback : is a shortcut to avoid infinite loops, it directly yields the resolved value without trying to resolve it as well. This can be usefull to avoid infinte loops, for example in an arrayControl takes an array and yields an array as a result
   * the `yieldError` callback : called to trigger an error (that can be catched using try/catch in the generator)
