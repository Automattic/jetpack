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

	/**
	 * Usage:
	 *
	 * jpQuery.on( 'click', '.mything', function( el, event ) { // do something } )
	 *
	 * @param {string} eventName
	 * @param {string} selector
	 * @param {function} callback
	 */
	var on = function( eventName, selector, callback ) {
		document.addEventListener(
			eventName,
			function( e ) {
				// loop parent nodes from the target to the delegation node
				for ( var target = e.target; target && target != this; target = target.parentNode ) {
					if ( target.matches( selector ) ) {
						console.log( 'got click on ', selector, target );
						e.currentTarget = target; // pass along the element that the selector actually matches, not just the element that was clicked
						callback.call( target, e );
						break;
					}
				}
			},
			false
		);
	};

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

	var trigger = function( el, eventName, data ) {
		if ( window.CustomEvent && typeof window.CustomEvent === 'function' ) {
			var event = new CustomEvent( eventName, { detail: data } );
		} else {
			var event = document.createEvent( 'CustomEvent' );
			event.initCustomEvent( eventName, true, true, data );
		}

		el.dispatchEvent( event );
	};

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

	window.jpQuery = {
		ready: ready,
		data: data,
		fn: {},
		on: on,
		each: each,
		trigger: trigger,
		matches: matches,
		indexOf: indexOf,
		elFromString: elFromString,
		viewportWidth: viewportWidth,
		viewportHeight: viewportHeight,
	};
} )();
