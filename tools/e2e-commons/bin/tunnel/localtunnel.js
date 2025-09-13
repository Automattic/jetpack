import axios from 'axios';
import localtunnel from 'localtunnel';
import { TunnelManager } from './tunnel.js';

export default class LocalTunnelProvider extends TunnelManager {
	constructor() {
		super( 'localtunnel' );
	}

	/**
	 * Start the localtunnel. If a stored URL is found, it will be reused.
	 * @return {Promise<void>}
	 */
	async start() {
		console.log( 'Starting localtunnel...' );
		const subdomain = this.getTunnelSubdomain();

		console.log( `Opening tunnel. Subdomain: '${ subdomain }'` );
		const tunnel = await localtunnel( {
			host: this.config.host,
			port: this.config.port,
			subdomain,
		} );

		tunnel.on( 'close', () => {
			console.log( `${ tunnel.clientId } tunnel closed` );
		} );

		console.log( `Opened tunnel '${ tunnel.url }'` );
		this.storeUrl( tunnel.url );
		this.storePid( process.pid );
	}

	/**
	 * Stop the localtunnel
	 * @return {Promise<void>}
	 */
	async stop() {
		const subdomain = this.getTunnelSubdomain();

		if ( subdomain ) {
			this.log( `Closing tunnel ${ subdomain }` );
			try {
				this.log( `Sending delete request for ${ subdomain }` );
				const res = await axios.get( `${ this.config.host }/api/tunnels/${ subdomain }/delete` );
				this.log( JSON.stringify( res.data ) );
			} catch ( error ) {
				this.logError( error.message );
			}
		}
	}

	/**
	 * Get tunnel HTTP status code
	 * @param {string} subdomain - Tunnel subdomain
	 * @return {Promise<number>} HTTP status code
	 */
	async getTunnelStatus( subdomain ) {
		let responseStatusCode;

		if ( ! subdomain ) {
			console.log( 'Cannot check tunnel for undefined subdomain!' );
			responseStatusCode = 404;
		} else {
			try {
				const res = await axios.get( `${ this.config.host }/api/tunnels/${ subdomain }/status` );
				console.log( res.status );
				responseStatusCode = res.status;
			} catch ( error ) {
				console.error( error.message );
			}
		}
		return responseStatusCode;
	}
}
