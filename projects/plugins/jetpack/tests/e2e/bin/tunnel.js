const fs = require( 'fs' );
const config = require( 'config' );
const localtunnel = require( 'localtunnel' );
const { getReusableUrlFromFile } = require( '../lib/utils-helper' );

( async () => {
	const conf = config.get( 'tunnel' );
	const tunnelConfig = { host: conf.host, port: conf.port };

	// Try to re-use the subdomain by using the tunnel url saved in file.
	// If a valid url is not found do not fail, but create a tunnel
	// with a randomly assigned subdomain (default option)
	const urlFromFile = getReusableUrlFromFile();

	if ( urlFromFile && new URL( urlFromFile ) ) {
		tunnelConfig.subdomain = urlFromFile.replace( /.*?:\/\//g, '' ).split( '.' )[ 0 ];
	}

	const tunnel = await localtunnel( tunnelConfig );

	tunnel.on( 'close', () => {
		console.log( 'Tunnel closed' );
	} );

	fs.writeFileSync( config.get( 'temp.tunnels' ), tunnel.url );
} )();
