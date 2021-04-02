const fs = require( 'fs' );
const config = require( 'config' );
const localtunnel = require( 'localtunnel' );

( async () => {
	const conf = config.get( 'tunnel' );
	const tunnelConfig = { host: conf.host, port: conf.port };

	// Try to re-use the subdomain by using the tunnel url saved in file.
	// If a valid url is not found do not fail, but create a tunnel
	// with a randomly assigned subdomain (default option)
	try {
		const urlFromFile = fs.readFileSync( config.get( 'temp.tunnels' ), 'utf8' );
		if ( new URL( urlFromFile ) ) {
			tunnelConfig.subdomain = urlFromFile.replace( /.*?:\/\//g, '' ).split( '.' )[ 0 ];
		}
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			console.warn( "Tunnels file doesn't exist" );
		} else {
			console.error( error );
		}
	}

	const tunnel = await localtunnel( tunnelConfig );

	tunnel.on( 'close', () => {
		console.log( 'Tunnel closed' );
	} );

	console.log( 'Tunnel open' );
} )();
