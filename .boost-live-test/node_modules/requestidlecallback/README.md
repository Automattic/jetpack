#`requestIdleCallback` polyfill/shim [![Build Status](https://api.travis-ci.org/aFarkas/requestIdleCallback.svg?branch=master)](https://travis-ci.org/aFarkas/requestIdleCallback)

This is a polyfill/shim for the `requestIdleCallback` and `cancelIdleCallback` API. Also fixes early API implementation. 

For more information see the [Cooperative Scheduling of Background Tasks Draft](http://www.w3.org/TR/requestidlecallback/).

##Installation
Include the "index.js" in your website and use `requestIdleCallback` and `cancelIdleCallback` according to the specification.

##How it works
`requestIdleCallback` can't be really polyfilled. Therefore `requestIdleCallback` basically includes a throttle like function, that uses some heuristics to detect a) long running frames and b) user input as also DOM mutations to adapt accordingly. `requestIdleCallback` also tries to get the time right after a frame commit. The `deadline.timeRemaining()` either starts with 7ms or with 22ms for the first scheduled callback.

If multiple functions are scheduled with the `requestIdleCallback` shim for the same idle time, the shim makes sure to split those functions as soon as `timeRemaining()` is exceeded.

##Usage

If you have a fast or a non-splittable task:

```js
requstIdleCallback(function(){
	//your task
});
```

In case you have a heavy and splittable task you can use efficient script yielding technique:

```js
requestIdleCallback(function(deadline){
	while(tasks.length && deadline.timeRemaining() > 0){
		tasks.shift()();
	}
	
	if(tasks.length){
		requestIdleCallback(runTasks);
	}
});
```

**Reading vs writing layout:** `requestIdleCallback` is mainly for layout neutral or layout reading/measuring tasks. In case you want to write layout/manipulate the DOM consider using `requestAnimationFrame` instead.

Of course `requestIdleCallback` can also be combined with `requestAnimationFrame`:

```js
requstIdleCallback(function(){
	var width = element.offsetWidth;
	
	requestAnimationFrame(function(){
		element.classList[width > 600 ? 'add' : 'remove']('is-large');
	});
});
```
