import localtunnel from 'localtunnel';
import config from 'config';
import fs from 'fs';

import logger from './logger';

export default class TunnelManager {
	constructor() {
		this.host = config.get( 'localtunnel' );
	}

	/**
	 * Creates a tunnel and returns a tunnel URL.
	 * * if `oneOff` is false, tunnel will try to reuse an existing domain.
	 *   It is useful for tests that do not require pre-connection state, such as blocks tests
	 *   The "current" tunnel url is saved in a text file, that allows sharing state between tests
	 *
	 * * if `oneOff` is true, new tunnel would be created, its url would not be persisted.
	 *
	 * @param {boolean} oneOff If the tunnel should be reused.
	 */
	async create( oneOff = false ) {
		const tunnelConfig = this.getConfig( oneOff );

		await this.newTunnel( tunnelConfig );

		if ( tunnelConfig.subdomain && this.subdomain !== tunnelConfig.subdomain ) {
			logger.info( `#### Failed to get ${ tunnelConfig.subdomain } subdomain. Retrying` );
			await this.close();
			await this.newTunnel( tunnelConfig );
		}

		if ( ! oneOff ) {
			fs.writeFileSync( 'e2e_tunnels.txt', this.url );
		}

		return this.url;
	}

	async newTunnel( tunnelConfig ) {
		const tunnel = await localtunnel( tunnelConfig );
		const url = tunnel.url.replace( 'http:', 'https:' );

		tunnel.on( 'close', () => {
			logger.info( '!!!!!! TUNNEL is closed for ', url );
		} );

		logger.info( `#### CREATING A TUNNEL! Config: ${ JSON.stringify( tunnelConfig ) }. ${ url }` );

		this.tunnel = tunnel;
		this.url = url;
		this.subdomain = this.getSubdomain( this.url );
		return tunnel;
	}

	getConfig( oneOff ) {
		const tunnelConfig = { port: 8889, host: this.host, oneOff };

		if ( oneOff ) {
			return tunnelConfig;
		}

		let urlFromFile;
		try {
			urlFromFile = fs.readFileSync( 'e2e_tunnels.txt', 'utf8' );
		} catch ( error ) {
			logger.info( error );
		}

		// use already created subdomain if found
		if ( urlFromFile && urlFromFile.length > 1 ) {
			const subdomain = this.getSubdomain( urlFromFile );
			tunnelConfig.subdomain = subdomain;
		}

		return tunnelConfig;
	}

	async close() {
		logger.info( `#### Closing tunnel ${ this.tunnel.url }` );

		this.tunnel.close();
		await page.goto( `${ this.host }/api/tunnels/${ this.subdomain }/delete` );
		// wait for tunnel to close properly
		await new Promise( r => setTimeout( r, 1000 ) );
	}

	getSubdomain( url ) {
		return url.replace( /.*?:\/\//g, '' ).split( '.' )[ 0 ];
	}
}
