export const convertSecondsToTimeCode = ( seconds: number | string ): string => {
	const total = Math.max( 0, Math.floor( Number( seconds ) || 0 ) );
	const h = Math.floor( total / 3600 );
	const m = Math.floor( ( total % 3600 ) / 60 );
	const s = total % 60;
	const mm = String( m ).padStart( 2, '0' );
	const ss = String( s ).padStart( 2, '0' );
	return h > 0 ? `${ String( h ).padStart( 2, '0' ) }:${ mm }:${ ss }` : `${ mm }:${ ss }`;
};
