/* global mejs */

const getSecondsToTimeCode = () =>
	typeof mejs !== 'undefined' && typeof mejs?.Utils?.secondsToTimeCode === 'function'
		? mejs.Utils.secondsToTimeCode
		: null;

const getTimeCodeToSeconds = () =>
	typeof mejs !== 'undefined' && typeof mejs?.Utils?.timeCodeToSeconds === 'function'
		? mejs.Utils.timeCodeToSeconds
		: null;

const fallbackConvertSecondsToTimeCode = seconds => {
	const totalSeconds = Math.max( 0, Math.floor( Number( seconds ) || 0 ) );
	const hours = Math.floor( totalSeconds / 3600 );
	const minutes = Math.floor( ( totalSeconds % 3600 ) / 60 );
	const remainingSeconds = totalSeconds % 60;

	const paddedMinutes = String( minutes ).padStart( 2, '0' );
	const paddedSeconds = String( remainingSeconds ).padStart( 2, '0' );

	if ( hours > 0 ) {
		return `${ String( hours ).padStart( 2, '0' ) }:${ paddedMinutes }:${ paddedSeconds }`;
	}

	return `${ paddedMinutes }:${ paddedSeconds }`;
};

const fallbackConvertTimeCodeToSeconds = timecode => {
	if ( typeof timecode !== 'string' ) {
		return 0;
	}

	const parts = timecode.split( ':' ).map( part => part.trim() );

	if (
		parts.length < 1 ||
		parts.length > 3 ||
		parts.some( part => part === '' || Number.isNaN( Number( part ) ) )
	) {
		return 0;
	}

	return parts.reduce( ( total, part ) => total * 60 + Number( part ), 0 );
};

// MediaElement.js loads on-demand in the editor, so look the helpers up at call
// time rather than at module-evaluation time. Reading them at import would throw
// ReferenceError if the importing module evaluates before mediaelement is on the
// page, which can happen for blocks that don't otherwise depend on `wp-mediaelement`.
export const convertSecondsToTimeCode = seconds => {
	const secondsToTimeCode = getSecondsToTimeCode();

	return secondsToTimeCode
		? secondsToTimeCode( seconds )
		: fallbackConvertSecondsToTimeCode( seconds );
};

export const convertTimeCodeToSeconds = timecode => {
	const timeCodeToSeconds = getTimeCodeToSeconds();

	return timeCodeToSeconds
		? timeCodeToSeconds( timecode )
		: fallbackConvertTimeCodeToSeconds( timecode );
};
