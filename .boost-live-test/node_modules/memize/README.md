Memize
======

Memize is a unabashedly-barebones memoization library with an aim toward speed.

Why use Memize?

- 🚀 **It's very fast.** Implemented as a least recently used (LRU) cache, it's heavily optimized for scenarios where the function is called repeatedly with the same arguments.
- 🔬 **It's tiny.** It weighs in at less than 0.3kb minified and gzipped, with no dependencies.
- 🔀 **It supports common arguments patterns**, including multiple arguments and non-primitive arguments (by reference).

## Example

Simply pass your original function as an argument to Memize. The return value is a new, memoized function.

```js
function fibonacci( number ) {
	if ( number < 2 ) {
		return number;
	}

	return fibonacci( number - 1 ) + fibonacci( number - 2 );
}

var memoizedFibonacci = memize( fibonacci );

memoizedFibonnaci( 8 ); // Invoked, cached, and returned
memoizedFibonnaci( 8 ); // Returned from cache
memoizedFibonnaci( 5 ); // Invoked, cached, and returned
memoizedFibonnaci( 8 ); // Returned from cache
```

## Installation

Using [npm](https://www.npmjs.com/) as a package manager:

```
npm install memize
```

## Usage

Memize accepts a function to be memoized, and returns a new memoized function.

```
memize( fn: Function, options: ?{
	maxSize?: number
} ): Function
```

Optionally, pass an options object with `maxSize` defining the maximum size of the cache.

The memoized function exposes a `clear` function if you need to reset the cache:

```js
memoizedFn.clear();
```

## Benchmarks

Implemented as a least recently used (LRU), Memize is heavily optimized for scenarios where the function is called repeatedly with the same arguments. In these scenarios, Memize outperformed most other memoization libraries at the time of initial publication.

To learn more about these benchmarks, important caveats, and how to run them yourself, refer to [`benchmark/README.md`](./benchmark/README.md).

## How it works

If you haven't already, feel free to [glance over the source code](./index.js). The code is heavily commented and should help provide substance to the implementation concepts.

Memize creates a [last-in first-out stack](https://en.wikipedia.org/wiki/Stack_(abstract_data_type)) implemented as a [doubly linked list](https://en.wikipedia.org/wiki/Doubly_linked_list). It biases recent access favoring real-world scenarios where the function is subsequently invoked multiple times with the same arguments. The choice to implement as a linked list is due to dramatically better performance characteristics compared to `Array#unshift` for surfacing an entry to the head of the list ([jsperf](https://jsperf.com/array-unshift-linked-list)). A downside of linked lists is inability to efficiently access arbitrary indices, but iterating from the beginning of the cache list is optimized by guaranteeing the list is sorted by recent access / insertion.

Each node in the list tracks the original arguments as an array. This acts as a key of sorts, matching arguments of the current invocation by performing a shallow equality comparison on the two arrays. Other memoization implementations often use `JSON.stringify` to generate a string key for lookup in an object cache, but this benchmarks much slower than a shallow comparison ([jsperf](https://jsperf.com/lookup-json-stringify-vs-shallow-equality)).

Finally, special care is made toward treatment of `arguments` due to engine-specific deoptimizations which can occur in V8 via [arguments leaking](https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments). Order is important here; we only create a shallow clone when necessary, after the cache has been checked, to avoid creating a clone unnecessarily if a cache entry exists. Looking at the code, you'd not be blamed for thinking that dropping the shallow clone would improve performance, but in fact it would _slow_ execution by approximately 60%. This is due to how the lingering `arguments` reference would carry over by reference ("leaks") in the node's `args` property. _**Update:** As of November 2019, engine improvements are such that `arguments` leaking does not have as dramatic an effect. However, my testing shows that the shallow clone still performs equal or better than referencing `arguments` directly, and as such the implementation has not been revised in order to achieve optimal performance in the most versions of V8._

## License

Copyright 2018-2020 Andrew Duthie

Released under the [MIT License](./LICENSE.md).
