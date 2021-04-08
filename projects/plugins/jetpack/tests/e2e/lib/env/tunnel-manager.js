import localtunnel from 'localtunnel';
import config from 'config';
import fs from 'fs';
import axios from 'axios';

import logger from '../logger';

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
			logger.error( `Failed to get ${ tunnelConfig.subdomain } subdomain. Retrying` );
			await this.close();
			await this.newTunnel( tunnelConfig );
		}

		if ( ! oneOff ) {
			fs.writeFileSync( config.get( 'temp.tunnels' ), this.url );
		}

		return this.url;
	}

	async newTunnel( tunnelConfig ) {
		const creationTimeout = new Promise( resolve => setTimeout( resolve, 10000, 'timeout' ) );
		const tunnelPromise = localtunnel( tunnelConfig );
		const result = await Promise.race( [ tunnelPromise, creationTimeout ] );
		if ( result === 'timeout' ) {
			throw new Error( 'Localtunnel: timeout creating new tunnel' );
		}
		const tunnel = result;

		const url = tunnel.url.replace( 'http:', 'https:' );

		tunnel.on( 'close', () => {
			logger.info( 'Tunnel is closed' );
		} );

		logger.info( `CREATING A TUNNEL! Config: ${ JSON.stringify( tunnelConfig ) }. ${ url }` );

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

		// use already created subdomain if found
		try {
			const urlFromFile = fs.readFileSync( config.get( 'temp.tunnels' ), 'utf8' );
			if ( urlFromFile && urlFromFile.length > 1 ) {
				const subdomain = this.getSubdomain( urlFromFile );
				tunnelConfig.subdomain = subdomain;
			}
		} catch ( error ) {
			if ( error.code === 'ENOENT' ) {
				logger.warn( "Tunnels file doesn't exist" );
			} else {
				logger.error( error );
			}
		}

		return tunnelConfig;
	}

	async close() {
		logger.info( `Closing tunnel ${ this.tunnel.url }` );

		this.tunnel.close();
		try {
			const response = await axios.get( `${ this.host }/api/tunnels/${ this.subdomain }/delete` );
			if ( response ) {
				logger.debug( JSON.stringify( response.data ) );
			}
		} catch ( error ) {
			logger.error( error );
		}
	}

	getSubdomain( url ) {
		return url.replace( /.*?:\/\//g, '' ).split( '.' )[ 0 ];
	}
}
