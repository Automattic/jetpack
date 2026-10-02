# EquivalentKeyMap

`EquivalentKeyMap` is a variant of a [`Map` object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) which enables lookup by _equivalent_ (deeply equal) object and array keys.

## Example

With a standard `Map`, a value is only returned if its key is strictly equal to the one used in assigning its value.

```js
const map = new Map();
map.set( { a: 1 }, 10 );
map.get( { a: 1 } );
// ⇒ undefined
```

By contrast, `EquivalentKeyMap` considers key equality of objects and arrays deeply:

```js
const map = new EquivalentKeyMap();
map.set( { a: 1 }, 10 );
map.get( { a: 1 } );
// ⇒ 10
```

## Installation

EquivalentKeyMap is published as an [npm](https://www.npmjs.com/) package:

```
npm install equivalent-key-map
```

Browser-ready versions are available from [unpkg](https://unpkg.com/equivalent-key-map/dist/equivalent-key-map.min.js). The browser-ready version assigns itself on the global scope as `EquivalentKeyMap`.

```html
<script src="https://unpkg.com/equivalent-key-map/dist/equivalent-key-map.min.js"></script>
<script>
var map = new EquivalentKeyMap();

// ...
</script>
```

## Usage

`EquivalentKeyMap` is intended to recreate the same API properties and methods available for `Map`:

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

**Note:** Currently, only methods and properties supported by IE11 are implemented (see [Browser compatibility](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Browser_compatibility)).

## Performance Considerations

There is inevitably some overhead in tracking object and array references deeply, contrasted with the standard Map object. This is a compromise you should consider when deciding whether you need deep key equality behavior.

That said, `EquivalentKeyMap` was implemented with performance in mind, and is significantly faster — and importantaly, more [correct](https://github.com/aduth/equivalent-key-map/blob/210f42bbd431c7c10da33d310cf56ef3b3ca96e7/test/index.js#L67-L71) — than a number of [alternative naive approaches](https://github.com/aduth/equivalent-key-map/tree/master/benchmark/impl). It also optimizes for repeated calls with the same object reference, memoizing the latest invocation of `get` to shortcut lookups.

### Benchmarks

The following benchmark results describe the behavior of `EquivalentMap#get` with keys of varying property lengths. 

>**`EquivalentKeyMap (2 properties, equal reference) x 38,726,559 ops/sec ±1.25% (87 runs sampled)`**  
>**`EquivalentKeyMap (8 properties, equal reference) x 43,395,727 ops/sec ±0.64% (91 runs sampled)`**  
>**`EquivalentKeyMap (18 properties, equal reference) x 51,334,445 ops/sec ±0.54% (87 runs sampled)`**  
>
>**`EquivalentKeyMap (2 properties) x 2,419,300 ops/sec ±1.37% (85 runs sampled)`**  
>**`EquivalentKeyMap (8 properties) x 1,362,012 ops/sec ±0.40% (90 runs sampled)`**  
>**`EquivalentKeyMap (18 properties) x 569,431 ops/sec ±0.93% (88 runs sampled)`**  
>
>`JSONStringifyNaiveMap (2 properties) x 1,958,910 ops/sec ±0.33% (94 runs sampled)`  
>`JSONStringifyNaiveMap (8 properties) x 1,038,380 ops/sec ±0.34% (94 runs sampled)`  
>`JSONStringifyNaiveMap (18 properties) x 600,017 ops/sec ±0.39% (91 runs sampled)`  
>
>`JSONStringifyOptimizedMap (2 properties) x 2,143,323 ops/sec ±0.36% (94 runs sampled)`  
>`JSONStringifyOptimizedMap (8 properties) x 1,088,846 ops/sec ±0.51% (92 runs sampled)`  
>`JSONStringifyOptimizedMap (18 properties) x 627,801 ops/sec ±0.31% (91 runs sampled)`  
>
>`JSONStableStringifyMap (2 properties) x 279,919 ops/sec ±0.91% (85 runs sampled)`  
>`JSONStableStringifyMap (8 properties) x 129,635 ops/sec ±0.55% (93 runs sampled)`  
>`JSONStableStringifyMap (18 properties) x 64,372 ops/sec ±0.40% (94 runs sampled)`  
>
>`FasterStableStringifyMap (2 properties) x 383,185 ops/sec ±0.79% (85 runs sampled)`  
>`FasterStableStringifyMap (8 properties) x 174,948 ops/sec ±0.48% (88 runs sampled)`  
>`FasterStableStringifyMap (18 properties) x 89,142 ops/sec ±0.46% (94 runs sampled)`  
>
>`TupleStringifyMap (2 properties) x 885,499 ops/sec ±0.50% (92 runs sampled)`  
>`TupleStringifyMap (8 properties) x 404,241 ops/sec ±0.56% (90 runs sampled)`  
>`TupleStringifyMap (18 properties) x 206,659 ops/sec ±0.74% (93 runs sampled)`  
>
>`StableQuerystringMap (2 properties) x 920,191 ops/sec ±0.72% (86 runs sampled)`  
>`StableQuerystringMap (8 properties) x 343,097 ops/sec ±0.40% (92 runs sampled)`  
>`StableQuerystringMap (18 properties) x 157,483 ops/sec ±0.50% (93 runs sampled)`  

You can run these on your own machine by cloning the repository, installing dependencies, and running `npm run benchmark`.

```
git clone https://github.com/aduth/equivalent-key-map.git
cd equivalent-key-map
npm install
npm run benchmark
```

## Browser Support

`EquivalentKeyMap` is implemented using `Map` and follows the corresponding [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Browser_compatibility). Notably, this includes all modern browsers and Internet Explorer 11. The `Map` methods not supported by Internet Explorer 11 are not used by `EquivalentKeyMap` and can be safely overlooked.

If you need support for older browsers, it's recommended that you use a polyfill such as [`core-js`](https://github.com/zloirock/core-js) or [polyfill.io](https://polyfill.io/v2/docs/).

## License

Copyright 2018 Andrew Duthie

Released under the [MIT License](https://github.com/aduth/equivalent-key-map/tree/master/LICENSE.md).
