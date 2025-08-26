#!/usr/bin/env node

import childProcess from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from 'config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const SUPPORTED_PROVIDERS = [ 'localtunnel', 'cloudflared' ];

fs.mkdirSync( config.get( 'dirs.temp' ), { recursive: true } );

export class TunnelManager {
	constructor( providerName ) {
		if ( ! SUPPORTED_PROVIDERS.includes( providerName ) ) {
			throw new Error(
				`Unsupported provider: ${ providerName }. Supported providers: ${ SUPPORTED_PROVIDERS.join(
					', '
				) }`
			);
		}
		this.providerName = providerName;
		this.provider = null;
		this.config = config.get( 'tunnel' );
		this.urlFile = config.get( 'dirs.temp' ) + '/' + providerName + '-url';
		this.pidFile = config.get( 'dirs.temp' ) + '/' + providerName + '-pid';
	}

	/**
	 * Load the provider implementation
	 */
	async loadProvider() {
		const providerModule = await import( `./${ this.providerName }.js` );
		const ProviderClass = providerModule.default;
		this.provider = new ProviderClass( this );
	}

	/**
	 * Log a message with provider-specific prefix
	 * @param {...*} args - Arguments to log
	 */
	log( ...args ) {
		console.log( `[${ this.providerName } manager]`, ...args );
	}

	/**
	 * Log an error message with provider-specific prefix
	 * @param {...*} args - Arguments to log
	 */
	logError( ...args ) {
		console.error( `[${ this.providerName } manager]`, ...args );
	}

	/**
	 * Log a warning message with provider-specific prefix
	 * @param {...*} args - Arguments to log
	 */
	logWarn( ...args ) {
		console.warn( `[${ this.providerName } manager]`, ...args );
	}

	/**
	 * Fork a subprocess to run the tunnel
	 * @param {object} argv - Args
	 * @return {Promise<void>}
	 */
	async tunnelOn( argv ) {
		const s = argv.logfile ? fs.createWriteStream( argv.logfile, { flags: 'a' } ) : 'ignore';
		if ( argv.logfile ) {
			await new Promise( resolve => {
				s.on( 'open', resolve );
			} );
		}

		const cp = childProcess.fork(
			fileURLToPath( import.meta.url ),
			[ 'child', this.providerName ],
			{
				detached: true,
				stdio: [ 'ignore', s, s, 'ipc' ],
			}
		);
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
	 * Run the tunnel in child process
	 * @param {string} providerName - Provider name
	 * @return {Promise<void>}
	 */
	async tunnelChild( providerName ) {
		process.on( 'disconnect', () => {
			delete process.send;
		} );

		// Redirect console stuff to process.send too
		const originalConsoleLog = console.log;
		const originalConsoleError = console.error;

		const wrap =
			func =>
			( ...args ) => {
				const message = args.join( ' ' );
				const prefixedMessage = `[${ providerName } manager] ${ message }`;
				func( prefixedMessage );
				process.send?.( prefixedMessage );
			};
		console.log = wrap( originalConsoleLog );
		console.error = wrap( originalConsoleError );

		await this.loadProvider();
		await this.provider.start();
		process.send?.( 'ok' );
	}

	/**
	 * Stop the tunnel
	 * @return {Promise<void>}
	 */
	async tunnelOff() {
		await this.loadProvider();
		await this.provider.stop();
		await this.genericStop();
	}

	/**
	 * Generic stop logic for process management
	 * @return {Promise<void>}
	 */
	async genericStop() {
		this.log( `Killing ${ this.providerName } process...` );

		const pid = this.getPid();
		if ( pid && pid.match( /^\d+$/ ) && this.processExists( pid ) ) {
			this.log( `Terminating ${ this.providerName } process ${ pid }` );
			process.kill( pid );
			await this.waitForProcessExit( pid );
		}

		// Clean up PID file
		this.clearPid();
	}

	/**
	 * Check if process exists
	 * @param {string|number} pid - Process ID
	 * @return {boolean} Process exists
	 */
	processExists( pid ) {
		try {
			process.kill( pid, 0 );
			return true;
		} catch ( e ) {
			return e.code !== 'ESRCH';
		}
	}

	/**
	 * Wait for process to exit
	 * @param {string|number} pid - Process ID
	 * @return {Promise<void>}
	 */
	waitForProcessExit( pid ) {
		return new Promise( resolve => {
			const check = () => {
				if ( ! this.processExists( pid ) ) {
					resolve();
				} else {
					setTimeout( check, 100 );
				}
			};
			check();
		} );
	}

	/**
	 * Save tunnel URL to file
	 * @param {string} url - URL
	 */
	storeUrl( url ) {
		fs.writeFileSync( this.urlFile, url );
	}

	/**
	 * Write PID file
	 * @param {number} pid - Process ID
	 */
	storePid( pid ) {
		fs.writeFileSync( this.pidFile, `${ pid }` );
	}

	/**
	 * Get stored PID
	 * @return {string|null} PID or null if not found
	 */
	getPid() {
		if ( fs.existsSync( this.pidFile ) ) {
			return fs.readFileSync( this.pidFile ).toString().trim();
		}
		this.logWarn(
			`Cannot find stored PID for ${ this.providerName }. Looking for ${ this.pidFile } file`
		);
		return null;
	}

	/**
	 * Clear/remove PID file
	 */
	clearPid() {
		if ( fs.existsSync( this.pidFile ) ) {
			fs.unlinkSync( this.pidFile );
			this.log( `Removed ${ this.pidFile }` );
		}
	}

	/**
	 * Get stored URL
	 * @return {string|null} URL or null if not found
	 */
	getUrl() {
		if ( fs.existsSync( this.urlFile ) ) {
			return fs.readFileSync( this.urlFile ).toString().trim();
		}
		this.logWarn(
			`Cannot find stored URL for ${ this.providerName }. Looking for ${ this.urlFile } file`
		);
		return null;
	}

	/**
	 * Clear/remove URL file
	 */
	clearUrl() {
		if ( fs.existsSync( this.urlFile ) ) {
			fs.unlinkSync( this.urlFile );
			this.log( `Removed ${ this.urlFile }` );
		}
	}

	/**
	 * Get tunnel subdomain from stored URL
	 * @return {string|undefined} Subdomain or undefined if no URL or invalid URL
	 */
	getTunnelSubdomain() {
		const urlFromFile = this.getUrl();

		if ( urlFromFile ) {
			try {
				const url = new URL( urlFromFile );
				const hostname = url.hostname;
				const subdomain = hostname.split( '.' )[ 0 ];
				return subdomain;
			} catch {
				this.logWarn( `Invalid URL format in stored URL: ${ urlFromFile }` );
				return undefined;
			}
		}
		return undefined;
	}

	/**
	 * Get tunnel hostname from stored URL
	 * @return {string|undefined} Hostname or undefined if no URL or invalid URL
	 */
	getTunnelHostname() {
		const urlFromFile = this.getUrl();

		if ( urlFromFile ) {
			try {
				const url = new URL( urlFromFile );
				return url.hostname;
			} catch {
				this.logWarn( `Invalid URL format in stored URL: ${ urlFromFile }` );
				return undefined;
			}
		}
		return undefined;
	}

	/**
	 * Clear all stored tunnel data (URL and PID files)
	 */
	clear() {
		this.clearUrl();
		this.clearPid();
	}
}

if ( import.meta.url === `file://${ process.argv[ 1 ] }` ) {
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
				const manager = new TunnelManager( argv.provider );
				await manager.tunnelOn( argv );
			}
		)
		.command(
			'child [provider]',
			false,
			yarg => {
				yarg.positional( 'provider', {
					describe: 'Tunnel provider',
					type: 'string',
					default: 'localtunnel',
				} );
			},
			async argv => {
				const manager = new TunnelManager( argv.provider );
				await manager.tunnelChild( argv.provider );
			}
		)
		.command(
			'off',
			'Closes a tunnel',
			() => {},
			async argv => {
				const manager = new TunnelManager( argv.provider );
				await manager.tunnelOff();
			}
		)
		.command(
			'clear',
			'Clears all stored tunnel data (URL and PID files)',
			() => {},
			async argv => {
				const manager = new TunnelManager( argv.provider );
				manager.clear();
			}
		)
		.help( 'h' )
		.alias( 'h', 'help' ).argv;
}
