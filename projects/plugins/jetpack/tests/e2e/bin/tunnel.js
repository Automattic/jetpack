#!/usr/bin/env node

const fs = require( 'fs' );
const config = require( 'config' );
const tunnelConfig = config.get( 'tunnel' );
const { getReusableUrlFromFile } = require( '../lib/utils-helper' );
const https = require( 'https' );
const yargs = require( 'yargs' );
const localtunnel = require( 'localtunnel' );

// eslint-disable-next-line no-unused-expressions
yargs
	.usage( 'Usage: $0 <cmd>' )
	.demandCommand( 1, 1 )
	.command(
		'on',
		'Opens a local tunnel',
		() => {},
		() => tunnelOn()
	)
	.command(
		'off',
		'Closes a local tunnel',
		() => {},
		() => tunnelOff()
	)
	.help( 'h' )
	.alias( 'h', 'help' ).argv;

async function tunnelOn() {
	const subdomain = await getTunnelSubdomain();

	if ( ! ( await isTunnelOn( subdomain ) ) ) {
		await openTunnel( {
			host: tunnelConfig.host,
			port: tunnelConfig.port,
			subdomain,
		} );
	}
}

async function tunnelOff() {
	const subdomain = await getTunnelSubdomain();

	if ( subdomain ) {
		console.log( `Closing tunnel ${ subdomain }` );
		const req = await https.get(
			`${ tunnelConfig.host }/api/tunnels/${ subdomain }/delete`,
			res => {
				res.on( 'data', data => {
					process.stdout.write( data );
					console.log();
				} );
			}
		);

		req.on( 'error', error => {
			console.error( error );
		} );

		req.end();
	}
}

async function openTunnel( conf ) {
	console.log( `Opening tunnel. Subdomain: '${ conf.subdomain }'` );

	const tunnel = await localtunnel( conf );

	tunnel.on( 'close', () => {
		console.log( `${ tunnel.subdomain } tunnel closed` );
	} );

	fs.writeFileSync( config.get( 'temp.tunnels' ), tunnel.url );
	console.log( `Opened tunnel for '${ tunnel.opts.subdomain }'` );
}

async function isTunnelOn( subdomain ) {
	console.log( `Checking if tunnel for ${ subdomain } is on` );

	const isOn = ( await getTunnelStatus( subdomain ) ) === 200;
	let status = 'OFF';
	if ( isOn ) {
		status = 'ON';
	}
	console.log( `Tunnel for ${ subdomain } is ${ status }` );
	return isOn;
}

async function getTunnelStatus( subdomain ) {
	let responseStatusCode;

	if ( ! subdomain ) {
		console.log( 'Cannot check tunnel for undefined subdomain!' );
	} else {
		const req = await https.get(
			`${ tunnelConfig.host }/api/tunnels/${ subdomain }/status`,
			res => {
				console.log( `statusCode: ${ res.statusCode }` );
				responseStatusCode = res.statusCode;
			}
		);

		req.on( 'error', error => {
			console.error( error );
		} );

		req.end();
	}
	return responseStatusCode;
}

async function getTunnelSubdomain() {
	let subdomain;

	// Try to re-use the subdomain by using the tunnel url saved in file.
	// If a valid url is not found do not fail, but create a tunnel
	// with a randomly assigned subdomain (default option)
	const urlFromFile = getReusableUrlFromFile();

	if ( urlFromFile && new URL( urlFromFile ) ) {
		subdomain = urlFromFile.replace( /.*?:\/\//g, '' ).split( '.' )[ 0 ];
	}
	return subdomain;
}
