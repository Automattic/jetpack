// a few helpers to replace jQuery functions
( function() {
	var ready = function( fn ) {
		if ( document.readyState != 'loading' ) {
			fn( this );
		} else {
			document.addEventListener( 'DOMContentLoaded', fn.bind( null, this ) );
		}
	};

	// @todo - not needed?
	var data = {
		_storage: new WeakMap(),
		put: function( element, key, obj ) {
			if ( ! this._storage.has( element ) ) {
				this._storage.set( element, new Map() );
			}
			this._storage.get( element ).set( key, obj );
		},
		get: function( element, key ) {
			return this._storage.get( element ).get( key );
		},
		has: function( element, key ) {
			return this._storage.has( element ) && this._storage.get( element ).has( key );
		},
		remove: function( element, key ) {
			var ret = this._storage.get( element ).delete( key );
			if ( ! this._storage.get( element ).size === 0 ) {
				this._storage.delete( element );
			}
			return ret;
		},
	};

	/**
	 * Returns true if the element matches the selector
	 *
	 * @param {HTMLElement} el
	 * @param {string} selector
	 */
	var matches = function( el, selector ) {
		return (
			el.matches ||
			el.matchesSelector ||
			el.msMatchesSelector ||
			el.mozMatchesSelector ||
			el.webkitMatchesSelector ||
			el.oMatchesSelector
		).call( el, selector );
	};

	function isElement(o){
		return (
			typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
			o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
		);
	}

	/**
	 * Usage:
	 *
	 * jpQuery.on( 'click', '.mything', function( el, event ) { // do something } )
	 *
	 * @param {string} eventName
	 * @param {*} selectorOrElement
	 * @param {function} callback
	 */
	var on = function( eventName, selectorOrElement, callback ) {
		var selector = typeof(selectorOrElement) === 'string' ? selectorOrElement : null;
		var listenEl = isElement(selectorOrElement) ? selectorOrElement : document;
		listenEl.addEventListener(
			eventName,
			function( e ) {
				if ( selector ) {
					// loop parent nodes from the target to the delegation node
					for ( var target = e.target; target && target != this; target = target.parentNode ) {
						if ( target.matches( selector ) ) {
							callback.call( target, e );
							break;
						}
					}
				} else {
					callback.call( e.target, e );
				}
			},
			false
		);
	};

	/**
	 * Returns the index of a HTML element in a NodeList
	 *
	 * @param {NodeList} nodeList
	 * @param {HTMLElement} el
	 */
	var indexOf = function( nodeList, el ) {
		var count = 0;
		var index = -1;
		nodeList.forEach( function( node ) {
			if ( el === node && index === -1 ) {
				index = count;
			}
			count += 1;
		} );
		return index;
	};

	/**
	 * Usage:
	 *
	 * jpQuery.each( '.foo', function( el, index ) { // do something } )
	 *
	 * @param {string} selector
	 * @param {function} callback
	 */
	var each = function( selector, callback ) {
		var elements = document.querySelectorAll( selector );
		Array.prototype.forEach.call( elements, callback );
	};

	/**
	 * Trigger a custom event
	 * @param {HTMLElement} el
	 * @param {string} eventName
	 * @param {*} data
	 */
	var trigger = function( el, eventName, data ) {
		if ( window.CustomEvent && typeof window.CustomEvent === 'function' ) {
			var event = new CustomEvent( eventName, { detail: data } );
		} else {
			var event = document.createEvent( 'CustomEvent' );
			event.initCustomEvent( eventName, true, true, data );
		}

		el.dispatchEvent( event );
	};

	var width = function( el ) {
		return parseFloat(getComputedStyle(el, null).width.replace("px", ""))
	}

	/**
	 * Usage:
	 *
	 * var myEl = jpQuery.elFromString( '<div class="foo">hi there</div>' );
	 *
	 * @param {string} str The HTML string
	 */
	var elFromString = function( str ) {
		var div = document.createElement('div');
		div.innerHTML = str.trim();
		return div.firstChild;
	}

	var viewportWidth = function() {
		return window.innerWidth   || document.documentElement.clientWidth  || document.body.clientWidth;
	}

	var viewportHeight = function() {
		return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	}

	var fn = {};

	// quick a dirty wrapper so that jpQuery.fn.blah(el, arg1, arg2) can be bound to jpQuery(myElement).blah(arg1, arg2)
	// note that unlike
	var wrap = function( el ) {
		for ( var pluginName in this ) {
			el[pluginName] = this[pluginName].bind( el );
		}
		// other functions that take an element
		el.trigger = trigger.bind( el, el );
		return el;
	}

	// ensure that `this` gives wrap access to the props assigned below
	var jpQuery = wrap.bind(fn);

	Object.assign( jpQuery, {
		wrap: wrap,
		ready: ready,
		data: data,
		fn: fn,
		on: on,
		each: each,
		trigger: trigger,
		matches: matches,
		indexOf: indexOf,
		elFromString: elFromString,
		viewportWidth: viewportWidth,
		viewportHeight: viewportHeight,
		width: width,
	} );

	console.log("functions are ", jpQuery.fn);

	window.jpQuery = jpQuery;
} )();
