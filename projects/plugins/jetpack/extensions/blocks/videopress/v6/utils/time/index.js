export function convertSecondsToTimeCode( seconds ) {
	const graterThanOneHour = seconds > 3600;

	if ( ! seconds ) {
		return {
			hhmmss: graterThanOneHour ? '00:00:00' : '00:00',
			decimal: '00',
		};
	}

	const hhmmss = graterThanOneHour
		? new Date( seconds * 1000 ).toISOString().substr( 11, 8 )
		: new Date( seconds * 1000 ).toISOString().substr( 14, 5 );

	const decimal = seconds % 1 > 0 ? ( 0 + String( seconds ).split( '.' )[ 1 ] ).slice( -2 ) : '00';

	return { hhmmss, decimal };
}
