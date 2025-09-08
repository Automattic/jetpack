import fs from 'fs';
import path from 'path';
import config from 'config';

export class TunnelManager {
	constructor( providerName ) {
		this.providerName = providerName;
		this.config = config.get( 'tunnel' );

		fs.mkdirSync( config.get( 'dirs.temp' ), { recursive: true } );

		this.urlFile = path.resolve( `${ config.get( 'dirs.temp' ) }/${ providerName }-url` );
		this.pidFile = path.resolve( `${ config.get( 'dirs.temp' ) }/${ providerName }-pid` );
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
	 * Log a debug message with provider-specific prefix (only if TUNNEL_DEBUG is enabled)
	 * @param {...*} args - Arguments to log
	 */
	logDebug( ...args ) {
		if ( process.env.TUNNEL_DEBUG ) {
			console.log( `[${ this.providerName } manager]`, ...args );
		}
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
				try {
					process.send?.( prefixedMessage );
					// eslint-disable-next-line no-unused-vars
				} catch ( e ) {
					// Ignore IPC errors, console output should still work
				}
			};
		console.log = wrap( originalConsoleLog );
		console.error = wrap( originalConsoleError );

		try {
			await this.start();
			const storedUrl = this.getUrl();
			if ( storedUrl ) {
				console.log( `Tunnel URL: ${ storedUrl }` );
			}
			process.send?.( 'ok' );
		} catch ( error ) {
			console.error( `Failed to start tunnel: ${ error.message }` );
			process.exit( 1 );
		}
	}

	/**
	 * Stop the tunnel
	 * @return {Promise<void>}
	 */
	async tunnelOff() {
		await this.stop();
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
			this.logDebug( `Found stored PID for ${ this.providerName }: ${ this.pidFile }` );
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
			this.logDebug( `Removed ${ this.pidFile }` );
		}
	}

	/**
	 * Get stored URL
	 * @return {string|null} URL or null if not found
	 */
	getUrl() {
		if ( fs.existsSync( this.urlFile ) ) {
			this.logDebug( `Found stored URL for ${ this.providerName }: ${ this.urlFile }` );
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
			this.logDebug( `Removed ${ this.urlFile }` );
		} else {
			this.logWarn(
				`Cannot find stored URL for ${ this.providerName }. Looking for ${ this.urlFile } file`
			);
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
