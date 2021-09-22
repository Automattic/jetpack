#!/usr/bin/env node

const fs = require( 'fs' );
const config = require( 'config' );
const tunnelConfig = config.get( 'tunnel' );
const { getReusableUrlFromFile } = require( '../helpers/utils-helper' );
const axios = require( 'axios' );
const yargs = require( 'yargs' );
const localtunnel = require( 'localtunnel' );

fs.mkdirSync( config.get( 'dirs.temp' ), { recursive: true } );

// eslint-disable-next-line no-unused-expressions
yargs
	.usage( 'Usage: $0 <cmd>' )
	.demandCommand( 1, 1 )
	.command(
		'on',
		'Opens a local tunnel',
		() => {},
		async () => await tunnelOn()
	)
	.command(
		'off',
		'Closes a local tunnel',
		() => {},
		async () => await tunnelOff()
	)
	.help( 'h' )
	.alias( 'h', 'help' ).argv;

/**
 * Create a new tunnel based on stored configuration
 * If a valid url is saved in the file configured to store it the subdomain will be reused
 * Otherwise localtunnel will create randomly assigned subdomain
 * Once the tunnel is created its url will be written in the file
 *
 * @return {Promise<void>}
 */
async function tunnelOn() {
	const subdomain = await getTunnelSubdomain();

	if ( ! ( await isTunnelOn( subdomain ) ) ) {
		console.log( `Opening tunnel. Subdomain: '${ subdomain }'` );
		const tunnel = await localtunnel( {
			host: tunnelConfig.host,
			port: tunnelConfig.port,
			subdomain,
		} );

		tunnel.on( 'close', () => {
			console.log( `${ tunnel.clientId } tunnel closed` );
		} );

		fs.writeFileSync( config.get( 'temp.tunnels' ), tunnel.url );
		console.log( `Opened tunnel '${ tunnel.url }'` );
	}

	// If this script is not executed by pm2 process.send will be undefined
	// We want to be able to also execute this script directly
	// https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback
	if ( process.send ) {
		process.send( 'ready' );
	}
}

/**
 * Call {host}/api/tunnels/{subdomain}/delete to stop a tunnel
 * Normally the tunnel will get closed if the process running this script is killed.
 * This function forces the deletion of a tunnel, just in case things didn't go according to plan
 *
 * @return {Promise<void>}
 */
async function tunnelOff() {
	const subdomain = await getTunnelSubdomain();

	if ( subdomain ) {
		console.log( `Closing tunnel ${ subdomain }` );
		try {
			const res = await axios.get( `${ tunnelConfig.host }/api/tunnels/${ subdomain }/delete` );
			console.log( JSON.stringify( res.data ) );
		} catch ( error ) {
			console.error( error.message );
		}
	}
}

/**
 * Determines if a tunnel is on by checking the status code of a http call
 * If status is 200 we assume the tunnel is on, and off for any other status
 * This is definitely not bullet proof, as the tunnel can be on while the app is down, this returning a non 200 response
 *
 * @param {string} subdomain tunnel's subdomain
 * @return {Promise<boolean>} tunnel on - true, off - false
 */
async function isTunnelOn( subdomain ) {
	console.log( `Checking if tunnel for ${ subdomain } is on` );
	const statusCode = await getTunnelStatus( subdomain );

	const isOn = statusCode === 200;
	let status = 'OFF';
	if ( isOn ) {
		status = 'ON';
	}
	console.log( `Tunnel for ${ subdomain } is ${ status } (${ statusCode })` );
	return isOn;
}

/**
 * Returns the http status code for tunnel url
 *
 * @param {string} subdomain tunnel's subdomain
 * @return {Promise<number>} http status code
 */
async function getTunnelStatus( subdomain ) {
	let responseStatusCode;

	if ( ! subdomain ) {
		console.log( 'Cannot check tunnel for undefined subdomain!' );
		responseStatusCode = 404;
	} else {
		try {
			const res = await axios.get( `${ tunnelConfig.host }/api/tunnels/${ subdomain }/status` );
			console.log( res.status );
			responseStatusCode = res.status;
		} catch ( error ) {
			console.error( error.message );
		}
	}
	return responseStatusCode;
}

/**
 * Resolves the subdomain of a url written in file
 *
 * @return {Promise<*>} subdomain or undefined if file not found or subdomain cannot be extracted
 */
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
