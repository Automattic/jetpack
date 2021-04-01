const localtunnel = require( 'localtunnel' );

( async () => {
	console.log( 'Opening tunnel' );

	const tunnel = await localtunnel( {
		port: 8889,
		host: 'http://a8c-localtunnel.cyou',
		subdomain: 'terrible-chicken-79',
	} );

	tunnel.on( 'close', () => {
		console.log( 'Tunnel is closed' );
	} );

	return tunnel;
} )();
