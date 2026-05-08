/* global mejs */

// MediaElement.js loads on-demand in the editor, so look up its helpers at
// call time. Reading them at module evaluation throws ReferenceError when
// blocks that don't otherwise depend on `wp-mediaelement` import this file.
const getSecondsToTimeCode = () =>
	typeof mejs !== 'undefined' && typeof mejs?.Utils?.secondsToTimeCode === 'function'
		? mejs.Utils.secondsToTimeCode
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

export const convertSecondsToTimeCode = seconds => {
	const secondsToTimeCode = getSecondsToTimeCode();

	return secondsToTimeCode
		? secondsToTimeCode( seconds )
		: fallbackConvertSecondsToTimeCode( seconds );
};
