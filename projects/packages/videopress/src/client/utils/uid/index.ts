export default () => {
	const cryptoArray = new Uint32Array( 10 );
	crypto.getRandomValues( cryptoArray );
	const timestamp = performance.now().toString( 36 );
	const random = Array.from( cryptoArray )
		.map( item => item.toString( 36 ) )
		.join( '' );
	return `${ timestamp }-${ random }`;
};
