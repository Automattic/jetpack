// a few helpers to replace jQuery functions
( function() {
	function ready( fn ) {
		if ( document.readyState != 'loading' ) {
			fn();
		} else {
			document.addEventListener( 'DOMContentLoaded', fn );
		}
	}

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
	 * Usage:
	 *
	 * jpQuery.on( 'click', '.mything', function( el, event ) { // do something } )
	 *
	 * @param {string} eventName
	 * @param {string} selector
	 * @param {function} callback
	 */
	function on( eventName, selector, callback ) {
		document.addEventListener(
			eventName,
			function( e ) {
				// loop parent nodes from the target to the delegation node
				for ( var target = e.target; target && target != this; target = target.parentNode ) {
					if ( target.matches( selector ) ) {
						callback.call( target, e );
						break;
					}
				}
			},
			false
		);
	}

	/**
	 * Usage:
	 *
	 * jpQuery.each( '.foo', function( el, index ) { // do something } )
	 *
	 * @param {string} selector
	 * @param {function} callback
	 */
	function each( selector, callback ) {
		var elements = document.querySelectorAll( selector );
		Array.prototype.forEach.call( elements, callback );
	}

	function trigger( el, eventName, data ) {
		if ( window.CustomEvent && typeof window.CustomEvent === 'function' ) {
			var event = new CustomEvent( eventName, { detail: data } );
		} else {
			var event = document.createEvent( 'CustomEvent' );
			event.initCustomEvent( eventName, true, true, data );
		}

		el.dispatchEvent( event );
	}

	window.jpQuery = {
		ready: ready,
		data: data,
		fn: {},
		on: on,
		each: each,
		trigger: trigger,
	};
} )();
