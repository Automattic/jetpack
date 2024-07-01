#!/usr/bin/env node

/* eslint-disable no-process-exit */

import childProcess from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import config from 'config';
import localtunnel from 'localtunnel';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getReusableUrlFromFile } from '../helpers/utils-helper.js';

const tunnelConfig = config.get( 'tunnel' );

fs.mkdirSync( config.get( 'dirs.temp' ), { recursive: true } );

// eslint-disable-next-line no-unused-expressions
yargs( hideBin( process.argv ) )
	.usage( 'Usage: $0 <cmd>' )
	.demandCommand( 1, 1 )
	.command(
		'on [logfile]',
		'Opens a local tunnel',
		yarg => {
			yarg.positional( 'logfile', {
				describe: 'File to write tunnel logs to',
				type: 'string',
			} );
		},
		tunnelOn
	)
	.command( 'child', false, () => {}, tunnelChild )
	.command( 'off', 'Closes a local tunnel', () => {}, tunnelOff )
	.help( 'h' )
	.alias( 'h', 'help' ).argv;

/**
 * This allows overriding the tunnel with a custom tunnel like ngrok.
 * Useful when running e2e tests locally and you want to use a tunnel that's
 * closer to you than the localtunnel instance.
 *
 * For example:
 * ```
 * TUNNEL_URL=https://somethingsomething.ngrok.io npm run test-e2e:start
 * ```
 *
 * @returns {string|undefined} URL
 */
function getTunnelOverrideURL() {
	return process.env.TUNNEL_URL;
}

/**
 * Save tunnel URL to file
 * @param {string} url - URL
 */
function saveTunnelUrlToFile( url ) {
	fs.writeFileSync( config.get( 'temp.tunnels' ), url );
}

/**
 * Fork a subprocess to run the tunnel.
 *
 * The `localtunnel` needs a process to keep running for the entire time the tunnel is up.
 * This function forks a subprocess to do that, then exits when that subprocess indicates
 * that the tunnel actually is up so the caller can proceed with running tests or whatever.
 *
 * @param {object} argv - Args.
 * @returns {Promise<void>}
 */
async function tunnelOn( argv ) {
	const s = argv.logfile ? fs.createWriteStream( argv.logfile, { flags: 'a' } ) : 'ignore';
	if ( argv.logfile ) {
		await new Promise( resolve => {
			s.on( 'open', resolve );
		} );
	}

	const cp = childProcess.fork( fileURLToPath( import.meta.url ), [ 'child' ], {
		detached: true,
		stdio: [ 'ignore', s, s, 'ipc' ],
	} );
	cp.on( 'exit', code => process.exit( code ) );
	cp.on( 'message', m => {
		if ( m === 'ok' ) {
			process.exit( 0 );
		} else {
			console.log( m );
		}
	} );
}

/**
 * Create a new tunnel based on stored configuration
 * If a valid url is saved in the file configured to store it the subdomain will be reused
 * Otherwise localtunnel will create randomly assigned subdomain
 * Once the tunnel is created its url will be written in the file
 *
 * @returns {Promise<void>}
 */
async function tunnelChild() {
	process.on( 'disconnect', () => {
		delete process.send;
	} );

	// Redirect console stuff to process.send too.
	const wrap = func => m => {
		func( m );
		process.send?.( m );
	};
	console.log = wrap( console.log );
	console.error = wrap( console.error );

	const customTunnelUrl = getTunnelOverrideURL();
	if ( customTunnelUrl ) {
		console.log( `Using custom tunnel URL: ${ customTunnelUrl }` );
		saveTunnelUrlToFile( customTunnelUrl );
		process.exit( 0 );
	}

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

		console.log( `Opened tunnel '${ tunnel.url }'` );
		saveTunnelUrlToFile( tunnel.url );
		fs.writeFileSync( config.get( 'temp.pid' ), `${ process.pid }` );
	}

	process.send?.( 'ok' );
}

/**
 * Call {host}/api/tunnels/{subdomain}/delete to stop a tunnel
 * Normally the tunnel will get closed if the process running this script is killed.
 * This function forces the deletion of a tunnel, just in case things didn't go according to plan
 *
 * @returns {Promise<void>}
 */
async function tunnelOff() {
	const subdomain = await getTunnelSubdomain();

	if ( subdomain ) {
		console.log( `Closing tunnel ${ subdomain }` );

		const pidfile = config.get( 'temp.pid' );
		if ( fs.existsSync( pidfile ) ) {
			const pid = fs.readFileSync( pidfile ).toString();
			const processExists = p => {
				try {
					process.kill( p, 0 );
					return true;
				} catch ( e ) {
					return e.code !== 'ESRCH';
				}
			};
			if ( pid.match( /^\d+$/ ) && processExists( pid ) ) {
				console.log( `Terminating tunnel process ${ pid }` );
				process.kill( pid );
				await new Promise( resolve => {
					const check = () => {
						if ( ! processExists( pid ) ) {
							resolve();
						} else {
							setTimeout( check, 100 );
						}
					};
					check();
				} );
			}
			fs.unlinkSync( pidfile );
		}

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
 * @param {string} subdomain - tunnel's subdomain
 * @returns {Promise<boolean>} tunnel on - true, off - false
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
 * @param {string} subdomain - tunnel's subdomain
 * @returns {Promise<number>} http status code
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
 * @returns {Promise<*>} subdomain or undefined if file not found or subdomain cannot be extracted
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
