import childProcess from 'child_process';
import { TunnelManager } from './tunnel.js';

export default class CloudflaredProvider extends TunnelManager {
	constructor() {
		super( 'cloudflared' );
	}

	/**
	 * Start the cloudflared tunnel
	 * @return {Promise<void>}
	 */
	async start() {
		console.log( 'Starting cloudflared tunnel...' );

		return new Promise( ( resolve, reject ) => {
			const cloudflaredProcess = childProcess.spawn(
				'cloudflared',
				[ 'tunnel', '--url', `localhost:${ this.config.port }` ],
				{
					stdio: [ 'ignore', 'pipe', 'pipe' ],
				}
			);

			let tunnelUrl = '';
			let resolved = false;

			const onData = data => {
				const output = data.toString();
				console.log( output );

				const urlMatch = output.match( /https:\/\/(?!api\.)[a-z0-9-]+\.trycloudflare\.com/ );
				if ( urlMatch && ! resolved ) {
					tunnelUrl = urlMatch[ 0 ];
					console.log( `Cloudflare tunnel started: ${ tunnelUrl }` );

					this.storeUrl( tunnelUrl );
					this.storePid( cloudflaredProcess.pid );
					resolved = true;
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
	 * Stop the cloudflared tunnel
	 * @return {Promise<void>}
	 */
	async stop() {
		this.log( 'Stopping cloudflared tunnel...' );
		this.clearUrl();
		this.log( 'Cloudflare tunnel stopped' );
	}
}
