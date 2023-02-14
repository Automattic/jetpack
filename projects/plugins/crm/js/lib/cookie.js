/*!
 * JavaScript Cookie v2.1.3
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
( function ( factory ) {
	let registeredInModuleLoader = false;
	if ( typeof define === 'function' && define.amd ) {
		define( factory );
		registeredInModuleLoader = true;
	}
	if ( typeof exports === 'object' ) {
		module.exports = factory();
		registeredInModuleLoader = true;
	}
	if ( ! registeredInModuleLoader ) {
		const OldCookies = window.Cookies;
		const api = ( window.Cookies = factory() );
		api.noConflict = function () {
			window.Cookies = OldCookies;
			return api;
		};
	}
} )( function () {
	/**
	 *
	 */
	function extend() {
		let i = 0;
		const result = {};
		for ( ; i < arguments.length; i++ ) {
			const attributes = arguments[ i ];
			for ( const key in attributes ) {
				result[ key ] = attributes[ key ];
			}
		}
		return result;
	}

	/**
	 * @param converter
	 */
	function init( converter ) {
		/**
		 * @param key
		 * @param value
		 * @param attributes
		 */
		function api( key, value, attributes ) {
			let result;
			if ( typeof document === 'undefined' ) {
				return;
			}

			// Write

			if ( arguments.length > 1 ) {
				attributes = extend(
					{
						path: '/',
					},
					api.defaults,
					attributes
				);

				if ( typeof attributes.expires === 'number' ) {
					const expires = new Date();
					expires.setMilliseconds( expires.getMilliseconds() + attributes.expires * 864e5 );
					attributes.expires = expires;
				}

				try {
					result = JSON.stringify( value );
					if ( /^[\{\[]/.test( result ) ) {
						value = result;
					}
				} catch ( e ) {}

				if ( ! converter.write ) {
					value = encodeURIComponent( String( value ) ).replace(
						/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,
						decodeURIComponent
					);
				} else {
					value = converter.write( value, key );
				}

				key = encodeURIComponent( String( key ) );
				key = key.replace( /%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent );
				key = key.replace( /[\(\)]/g, escape );

				return ( document.cookie = [
					key,
					'=',
					value,
					attributes.expires ? '; expires=' + attributes.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
					attributes.path ? '; path=' + attributes.path : '',
					attributes.domain ? '; domain=' + attributes.domain : '',
					attributes.secure ? '; secure' : '',
				].join( '' ) );
			}

			// Read

			if ( ! key ) {
				result = {};
			}

			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling "get()"
			const cookies = document.cookie ? document.cookie.split( '; ' ) : [];
			const rdecode = /(%[0-9A-Z]{2})+/g;
			let i = 0;

			for ( ; i < cookies.length; i++ ) {
				const parts = cookies[ i ].split( '=' );
				let cookie = parts.slice( 1 ).join( '=' );

				if ( cookie.charAt( 0 ) === '"' ) {
					cookie = cookie.slice( 1, -1 );
				}

				try {
					const name = parts[ 0 ].replace( rdecode, decodeURIComponent );
					cookie = converter.read
						? converter.read( cookie, name )
						: converter( cookie, name ) || cookie.replace( rdecode, decodeURIComponent );

					if ( this.json ) {
						try {
							cookie = JSON.parse( cookie );
						} catch ( e ) {}
					}

					if ( key === name ) {
						result = cookie;
						break;
					}

					if ( ! key ) {
						result[ name ] = cookie;
					}
				} catch ( e ) {}
			}

			return result;
		}

		api.set = api;
		api.get = function ( key ) {
			return api.call( api, key );
		};
		api.getJSON = function () {
			return api.apply(
				{
					json: true,
				},
				[].slice.call( arguments )
			);
		};
		api.defaults = {};

		api.remove = function ( key, attributes ) {
			api(
				key,
				'',
				extend( attributes, {
					expires: -1,
				} )
			);
		};

		api.withConverter = init;

		return api;
	}

	return init( function () {} );
} );
