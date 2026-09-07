// These two functions are a temporary addition while we wait for @jsnmoon's PR
// to be merged into the qss package: https://github.com/lukeed/qss/pull/8
function toValue( mix, tcBools, tcNumbers ) {
	if ( ! mix ) {
		return '';
	}
	let str;
	try {
		str = decodeURIComponent( mix );
	} catch {
		// Malformed percent-encoding (e.g. an unresolved email merge tag) can't be decoded;
		// treat it as an empty value rather than crash Instant Search init (#50709).
		return '';
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
		if ( out[ k ] !== void 0 ) {
			out[ k ] = [].concat( out[ k ], toValue( tmp.shift(), tcBools, tcNumbers ) );
		} else {
			out[ k ] = toValue( tmp.shift(), tcBools, tcNumbers );
		}
	}

	return out;
}
