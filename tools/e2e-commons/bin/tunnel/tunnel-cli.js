#!/usr/bin/env node

import childProcess from 'child_process';
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const SUPPORTED_PROVIDERS = [ 'localtunnel', 'cloudflared' ];

/**
 * Get the appropriate tunnel manager instance based on provider
 * @param {string} providerName - Provider name
 * @return {Promise<object>} Tunnel manager instance
 */
async function getTunnelManager( providerName ) {
	if ( ! SUPPORTED_PROVIDERS.includes( providerName ) ) {
		throw new Error(
			`Unsupported provider: ${ providerName }. Supported providers: ${ SUPPORTED_PROVIDERS.join(
				', '
			) }`
		);
	}
	const providerModule = await import( `./${ providerName }.js` );
	const ProviderClass = providerModule.default;
	return new ProviderClass();
}

/**
 * Fork a subprocess to run the tunnel
 * @param {object} argv         - Args
 * @param {string} providerName - Provider name
 * @return {Promise<void>}
 */
async function tunnelOn( argv, providerName ) {
	const s = argv.logfile ? fs.createWriteStream( argv.logfile, { flags: 'a' } ) : 'ignore';
	if ( argv.logfile ) {
		await new Promise( resolve => {
			s.on( 'open', resolve );
		} );
	}

	const cliPath = import.meta.filename;
	const args = [ 'child', '--provider', providerName ];
	const cp = childProcess.fork( cliPath, args, {
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

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
yargs( hideBin( process.argv ) )
	.usage( 'Usage: $0 <cmd>' )
	.demandCommand( 1, 1 )
	.option( 'provider', {
		alias: 'p',
		describe: 'Tunnel provider to use',
		choices: SUPPORTED_PROVIDERS,
		default: 'localtunnel',
	} )
	.command(
		'on [logfile]',
		'Opens a tunnel',
		yarg => {
			yarg.positional( 'logfile', {
				describe: 'File to write tunnel logs to',
				type: 'string',
			} );
		},
		async argv => {
			await tunnelOn( argv, argv.provider );
		}
	)
	.command(
		'child',
		false,
		() => {},
		async argv => {
			const manager = await getTunnelManager( argv.provider );
			await manager.tunnelChild( argv.provider );
		}
	)
	.command(
		'off',
		'Closes a tunnel',
		() => {},
		async argv => {
			const manager = await getTunnelManager( argv.provider );
			await manager.tunnelOff();
		}
	)
	.command(
		'clear',
		'Clears all stored tunnel data (URL and PID files)',
		() => {},
		async argv => {
			const manager = await getTunnelManager( argv.provider );
			manager.clear();
		}
	)
	.help( 'h' )
	.alias( 'h', 'help' ).argv;
