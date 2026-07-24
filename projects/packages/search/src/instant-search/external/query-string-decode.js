// These two functions are a temporary addition while we wait for @jsnmoon's PR
// to be merged into the qss package: https://github.com/lukeed/qss/pull/8

// Signals a value that's still undecodable after sanitizing bare `%`; decode() drops that key
// rather than keep a still-encoded string that would get double-encoded by qss's encode() later.
const MALFORMED = Symbol( 'malformed-query-value' );

// A `%` not starting a valid `%XX` escape (bare `%`, or an unresolved merge tag like `%DONOR%`).
// Escaping it to `%25` before decoding recovers the value as plain text instead of throwing.
const BARE_PERCENT = /%(?![0-9A-Fa-f]{2})/g;

function toValue( mix, tcBools, tcNumbers ) {
	if ( ! mix ) {
		return '';
	}
	let str;
	try {
		str = decodeURIComponent( mix.replace( BARE_PERCENT, '%25' ) );
	} catch {
		// Only reachable for well-formed-but-undecodable escapes, e.g. a truncated UTF-8 sequence.
		return MALFORMED;
	}
	if ( tcBools && str === 'false' ) {
		return false;
	}
	if ( tcBools && str === 'true' ) {
		return true;
	}
	return tcNumbers && +str * 0 === 0 ? +str : str;
}

export function decode( str, tcBools, tcNumbers ) {
	let tmp, k;

	const out = {},
		arr = str.split( '&' );

	tcBools = typeof tcBools !== 'undefined' ? tcBools : true;
	tcNumbers = typeof tcNumbers !== 'undefined' ? tcNumbers : true;

	while ( ( tmp = arr.shift() ) ) {
		tmp = tmp.split( '=' );
		k = tmp.shift();
		const value = toValue( tmp.shift(), tcBools, tcNumbers );
		if ( value === MALFORMED ) {
			continue; // Drop rather than crash init (#50709) or keep an unsafe-to-re-encode value.
		}
		if ( out[ k ] !== void 0 ) {
			out[ k ] = [].concat( out[ k ], value );
		} else {
			out[ k ] = value;
		}
	}

	return out;
}
