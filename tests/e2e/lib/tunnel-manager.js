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
	 * * if `oneOff is false, tunnel will try to reuse an existing domain.
	 *   It is useful for tests that does not require pre-connection state, such as blocks tests
	 *   The "current" tunnel url is saved in a text file, that allows sharing state between tests
	 *
	 * * if `oneOff` is true, new tunnel would be created, it's url would not be persisted.
	 *
	 * @param {boolean} oneOff Is the tunnel should be reused
	 */
	async create( oneOff = false ) {
		const tunnelConfig = this.getConfig( oneOff );

		let tunnel = await localtunnel( tunnelConfig );

		const url = tunnel.url.replace( 'http:', 'https:' );

		logger.info(
			`#### CREATING A TUNNEL! oneOff: ${ oneOff } Config: ${ JSON.stringify(
				tunnelConfig
			) }. ${ url }`
		);

		const subdomain = this.getSubdomain( url );
		if ( tunnelConfig.subdomain && subdomain !== tunnelConfig.subdomain ) {
			logger.info( `#### Failed to get ${ tunnelConfig.subdomain } subdomain. Retrying` );
			await this.close();
			await new Promise( r => setTimeout( r, 3000 ) );

			tunnel = await localtunnel( tunnelConfig );

			logger.info(
				`#### CREATING ANOTHER TUNNEL! Config: ${ JSON.stringify( tunnelConfig ) }. ${ tunnel.url }`
			);
		}

		tunnel.on( 'close', () => {
			logger.info( '!!!!!! TUNNEL is closed for ', this.url );
		} );

		this.tunnel = tunnel;

		if ( ! oneOff ) {
			fs.writeFileSync( 'e2e_tunnels.txt', this.tunnel.url );
		}

		this.url = this.tunnel.url;
		return this.url;
	}

	getConfig( oneOff ) {
		const tunnelConfig = { port: 8889, host: this.host };

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
		this.tunnel.emit( 'close' );
		this.tunnel.close();
		this.tunnel.close();
		// wait for tunnel to close properly
		await new Promise( r => setTimeout( r, 3000 ) );
	}

	getSubdomain( url ) {
		return url.replace( /.*?:\/\//g, '' ).split( '.' )[ 0 ];
	}
}
