/** Placeholder for drafting logic for this. May end up at stats.wp.com */

/**
 * Ensure there are 2 referrers:
 * 1. original referrer tk_ro
 * 2. latest referrer tk_rl
 */
 var tkCookie = new Cookie || {};

// Check that referrer is not from current domain && if there is a document.referrer
var isReferrerCurrentDomain = document.referrer.indexOf( location.protocol + '//' + location.host ) === 0;
if ( document.referrer && isReferrerCurrentDomain ) {
	date = new Date();
	var expDate = 31536000000; // 1 year
	// Check if tk_ro cookie exists
	if ( ! tkCookie.get( 'tk_ro' ) ) {
		// 1. Original Referrer - tk_ro
		tkCookie.set( 'tk_ro', document.referrer, { maxage: expDate * 5 } );
	}
	// 2. Latest Referrer - tk_rl
	tkCookie.set( 'tk_rl', document.referrer, { maxage: expDate } );
}

// Cookies
var Cookie = function() {
  return {
		set: function( name, value, options ) {
			options = options || {};
		  var str = encode( name ) + '=' + encode( value );

		  if ( null == value ) options.maxage = -1;

		  if ( options.maxage ) {
		    options.expires = new Date( +new Date + options.maxage );
		  }

		  if ( options.path ) str += '; path=' + options.path;
		  if ( options.domain ) str += '; domain=' + options.domain;
		  if ( options.expires ) str += '; expires=' + options.expires.toUTCString();
		  if ( options.secure ) str += '; secure';

		  document.cookie = str;
		},
		all: funciton() {
			var str;
		  try {
		    str = document.cookie;
			  return parse( str );
		  } catch ( err ) {
		    if ( typeof console !== 'undefined' && typeof console.error === 'function' ) {
		      console.error( err.stack || err );
		    }
		    return {};
		  }
		},
		get: function( name ) {
			return this.all()[ name ];
		},
	}
};

// Helpers

/**
 * Parse cookie `str`.
 *
 * @param {String} str
 * @return {Object}
 */

function parse( str ) {
  var obj = {};
  var pairs = str.split(/ *; */);
  var pair;
  if ( '' == pairs[ 0 ] ) return obj;
  for ( var i = 0; i < pairs.length; ++i ) {
    pair = pairs[ i ].split( '=' );
    obj[ decode( pair[ 0 ] ) ] = decode( pair[ 1 ] );
  }
  return obj;
}

/**
 * Encode.
 */

function encode( value ){
  try {
    return encodeURIComponent( value );
  } catch ( e ) {
		if ( typeof console !== 'undefined' && typeof console.error === 'function' ) {
    	console.error( 'error `encode(%o)` - %o', value, e );
		}
  }
}

/**
 * Decode.
 */

function decode( value ) {
  try {
    return decodeURIComponent( value );
  } catch ( e ) {
		if ( typeof console !== 'undefined' && typeof console.error === 'function' ) {
    	console.error( 'error `decode(%o)` - %o', value, e );
		}
  }
}
