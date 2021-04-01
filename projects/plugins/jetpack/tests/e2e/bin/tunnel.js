const fs = require( 'fs' );
const config = require( 'config' );
const localtunnel = require( 'localtunnel' );

( async () => {
	console.log( 'Opening tunnel' );

	console.log( JSON.stringify( config, null, 2 ) );
	const conf = config.get( 'tunnel' );

	// re-use subdomain
	try {
		const urlFromFile = fs.readFileSync( config.get( 'temp.tunnels' ), 'utf8' );
		if ( new URL( urlFromFile ) ) {
			conf.subdomain = getSubdomain( urlFromFile );
		}
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			console.warn( "Tunnels file doesn't exist" );
		} else {
			console.error( error );
		}
	}

	const tunnel = await localtunnel( conf );

	tunnel.on( 'close', () => {
		console.log( 'Tunnel is closed' );
	} );
} )();

function getSubdomain( url ) {
	return url.replace( /.*?:\/\//g, '' ).split( '.' )[ 0 ];
}
