import axios from 'axios';
import localtunnel from 'localtunnel';
import BaseTunnelProvider from './base-provider.js';

export default class LocalTunnelProvider extends BaseTunnelProvider {
	/**
	 * Start the localtunnel. If a stored URL is found, it will be reused.
	 * @return {Promise<void>}
	 */
	async start() {
		console.log( 'Starting localtunnel...' );
		const subdomain = this.manager.getTunnelSubdomain();

		console.log( `Opening tunnel. Subdomain: '${ subdomain }'` );
		const tunnel = await localtunnel( {
			host: this.manager.config.host,
			port: this.manager.config.port,
			subdomain,
		} );

		tunnel.on( 'close', () => {
			console.log( `${ tunnel.clientId } tunnel closed` );
		} );

		console.log( `Opened tunnel '${ tunnel.url }'` );
		this.manager.storeUrl( tunnel.url );
		this.manager.storePid( process.pid );
	}

	/**
	 * Stop the localtunnel
	 * @return {Promise<void>}
	 */
	async stop() {
		const subdomain = this.manager.getTunnelSubdomain();

		if ( subdomain ) {
			this.manager.log( `Closing tunnel ${ subdomain }` );
			try {
				this.manager.log( `Sending delete request for ${ subdomain }` );
				const res = await axios.get(
					`${ this.manager.config.host }/api/tunnels/${ subdomain }/delete`
				);
				this.manager.log( JSON.stringify( res.data ) );
			} catch ( error ) {
				this.manager.logError( error.message );
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
				const res = await axios.get(
					`${ this.manager.config.host }/api/tunnels/${ subdomain }/status`
				);
				console.log( res.status );
				responseStatusCode = res.status;
			} catch ( error ) {
				console.error( error.message );
			}
		}
		return responseStatusCode;
	}
}
