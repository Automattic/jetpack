#!/usr/bin/env node

import fs from 'fs';
import childProcess from 'child_process';
import { fileURLToPath } from 'url';
import config from 'config';
import { getReusableUrlFromFile } from '../helpers/utils-helper.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import ngrok from 'ngrok';

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
 * Fork a subprocess to run the tunnel.
 *
 * The `ngrok` needs a process to keep running for the entire time the tunnel is up.
 * This function forks a subprocess to do that, then exits when that subprocess indicates
 * that the tunnel actually is up so the caller can proceed with running tests or whatever.
 *
 * @param {Object} argv - Args.
 * @return {Promise<void>}
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
 * Otherwise ngrok will create randomly assigned subdomain
 * Once the tunnel is created its url will be written in the file
 * If TEST_ENV_URL is provided, use that URL instead of creating a new one.
 * If TEST_ENV_TOKEN is provided, use that as the authtoken.
 *
 * @return {Promise<void>}
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

	let tunnelUrl;

	// So everything depends on the auth token.
	const authtoken = process.env.TEST_ENV_TOKEN || tunnelConfig.authtoken;

	if ( ! tunnelUrl && process.env.TEST_ENV_URL ) {
		tunnelUrl = process.env.TEST_ENV_URL;
	}

	if ( ! tunnelUrl && authtoken ) {
		tunnelUrl = await ngrok.connect( {
			proto: 'http',
			addr: tunnelConfig.port,
			authtoken,
			// Use the domain if it's provided
			domain: process.env.TEST_ENV_DOMAIN ?? '',
		} );
	}

	if ( ! tunnelUrl ) {
		throw new Error( 'Failed to find an URL to use for the tunnel' );
	}

	console.log( `Opened tunnel '${ tunnelUrl }'` );

	console.log( '[TUNA] Writing to', config.get( 'temp.tunnels' ), tunnelUrl );
	fs.writeFileSync( config.get( 'temp.tunnels' ), tunnelUrl );
	console.log( '[TUNA] Writing to', config.get( 'temp.pid' ), process.pid );
	fs.writeFileSync( config.get( 'temp.pid' ), `${ process.pid }` );

	process.send?.( 'ok' );
}

/**
 * Call ngrok.disconnect(url) to stop a tunnel
 * Normally the tunnel will get closed if the process running this script is killed.
 * This function forces the deletion of a tunnel, just in case things didn't go according to plan
 *
 * @return {Promise<void>}
 */
async function tunnelOff() {
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

	const tunnelUrl = getReusableUrlFromFile();
	if ( tunnelUrl && ! process.env.TEST_ENV_URL ) {
		await ngrok.disconnect( tunnelUrl ); // stops one
		console.log( `Tunnel ${ tunnelUrl } disconnected` );
	}
}
