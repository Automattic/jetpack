// MediaElement.js loads on-demand in the editor, so look up its helpers at
// call time. Reading them at module evaluation throws ReferenceError when
// blocks that don't otherwise depend on `wp-mediaelement` import this file.

interface MejsModule {
	Utils?: {
		secondsToTimeCode?: ( seconds: number ) => string;
	};
}

const getMejs = (): MejsModule | undefined => ( globalThis as { mejs?: MejsModule } ).mejs;

const getSecondsToTimeCode = (): ( ( seconds: number ) => string ) | null => {
	const mejs = getMejs();
	return typeof mejs?.Utils?.secondsToTimeCode === 'function' ? mejs.Utils.secondsToTimeCode : null;
};

const fallbackConvertSecondsToTimeCode = ( seconds: number | string ): string => {
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

export const convertSecondsToTimeCode = ( seconds: number | string ): string => {
	const secondsToTimeCode = getSecondsToTimeCode();

	return secondsToTimeCode
		? secondsToTimeCode( Number( seconds ) )
		: fallbackConvertSecondsToTimeCode( seconds );
};
