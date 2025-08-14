#!/usr/bin/env node

import childProcess from 'child_process';
import fs from 'fs';
import config from 'config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const tunnelConfig = config.get( 'tunnel' );

fs.mkdirSync( config.get( 'dirs.temp' ), { recursive: true } );

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
yargs( hideBin( process.argv ) )
	.usage( 'Usage: $0 <cmd>' )
	.demandCommand( 1, 1 )
	.command(
		'on [logfile]',
		'Opens a cloudflare tunnel',
		yarg => {
			yarg.positional( 'logfile', {
				describe: 'File to write tunnel logs to',
				type: 'string',
			} );
		},
		tunnelOn
	)
	.command( 'child', false, () => {}, tunnelChild )
	.command( 'off', 'Closes a cloudflare tunnel', () => {}, tunnelOff )
	.help( 'h' )
	.alias( 'h', 'help' ).argv;

/**
 * Save tunnel URL to cloudflared-specific file
 * @param {string} url - URL
 */
function setTunnelUrl( url ) {
	fs.writeFileSync( config.get( 'dirs.temp' ) + '/cloudflared', url );
}

/**
 * Fork a subprocess to run the cloudflare tunnel.
 *
 * @param {object} argv - Args.
 * @return {Promise<void>}
 */
async function tunnelOn( argv ) {
	const s = argv.logfile ? fs.createWriteStream( argv.logfile, { flags: 'a' } ) : 'ignore';
	if ( argv.logfile ) {
		await new Promise( resolve => {
			s.on( 'open', resolve );
		} );
	}

	const cp = childProcess.fork( import.meta.url.replace( 'file://', '' ), [ 'child' ], {
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
 * Start a cloudflare tunnel using cloudflared
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

	console.log( 'Starting cloudflared tunnel...' );

	return new Promise( ( resolve, reject ) => {
		const cloudflaredProcess = childProcess.spawn(
			'cloudflared',
			[
				'tunnel',
				'--url',
				`localhost:${ tunnelConfig.port }`,
				'--logfile',
				'/tmp/cloudflared.log',
			],
			{
				stdio: [ 'ignore', 'pipe', 'pipe' ],
			}
		);

		let tunnelUrl = '';
		let resolved = false;

		const onData = data => {
			const output = data.toString();
			console.log( output );

			const urlMatch = output.match( /https:\/\/.*\.trycloudflare\.com/ );
			if ( urlMatch && ! resolved ) {
				tunnelUrl = urlMatch[ 0 ];
				console.log( `Cloudflare tunnel started: ${ tunnelUrl }` );

				setTunnelUrl( tunnelUrl );
				fs.writeFileSync( config.get( 'temp.pid' ), `${ cloudflaredProcess.pid }` );

				resolved = true;
				process.send?.( 'ok' );
				resolve();
			}
		};

		cloudflaredProcess.stdout.on( 'data', onData );
		cloudflaredProcess.stderr.on( 'data', onData );

		cloudflaredProcess.on( 'error', error => {
			if ( ! resolved ) {
				console.error( 'Failed to start cloudflared tunnel:', error );
				reject( error );
			}
		} );

		cloudflaredProcess.on( 'exit', code => {
			console.log( `Cloudflared process exited with code ${ code }` );
			if ( ! resolved && code !== 0 ) {
				reject( new Error( `Cloudflared exited with code ${ code }` ) );
			}
		} );

		// Timeout after 30 seconds
		setTimeout( () => {
			if ( ! resolved ) {
				console.error( 'Cloudflared tunnel startup timeout' );
				cloudflaredProcess.kill();
				reject( new Error( 'Tunnel startup timeout' ) );
			}
		}, 30000 );
	} );
}

/**
 * Stop the cloudflare tunnel
 *
 * @return {Promise<void>}
 */
async function tunnelOff() {
	console.log( 'Stopping cloudflared tunnel...' );

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
			console.log( `Terminating cloudflared process ${ pid }` );
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

	// Clean up cloudflared tunnel file
	const cloudflaredPath = config.get( 'dirs.temp' ) + '/cloudflared';
	if ( fs.existsSync( cloudflaredPath ) ) {
		fs.unlinkSync( cloudflaredPath );
	}

	console.log( 'Cloudflare tunnel stopped' );
}
