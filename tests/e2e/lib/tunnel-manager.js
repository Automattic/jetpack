import localtunnel from 'localtunnel';
import config from 'config';
import fs from 'fs';

import { execShellCommand } from './utils-helper';

export default class TunnelManager {
	constructor() {
		console.log( 'QQQQQQ TunnelManager created!!!' );
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
		console.log( 'STARTING TO CREATE A TUNNEL!!!' );

		const tunnelConfig = this.getConfig( oneOff );
		const tunnel = await localtunnel( tunnelConfig );
		this.tunnel = tunnel;
		const url = tunnel.url.replace( 'http:', 'https:' );

		await execShellCommand( `yarn wp-env run tests-cli wp option set siteurl "${ url }"` );
		await execShellCommand( `yarn wp-env run tests-cli wp option set home "${ url }"` );

		if ( ! oneOff ) {
			fs.writeFileSync( 'e2e_tunnels.txt', url );
		}
		return url;
	}

	getConfig( oneOff ) {
		const tunnelConfig = { port: 8889, host: this.host };

		if ( oneOff ) {
			return tunnelConfig;
		}

		if ( process.env.SKIP_CONNECT ) {
			return tunnelConfig;
		}

		let urlFromFile;
		try {
			urlFromFile = fs.readFileSync( 'e2e_tunnels.txt', 'utf8' );
		} catch ( error ) {
			console.log( error );
			throw error;
		}

		// use already created subdomain if found
		if ( urlFromFile.length > 1 ) {
			const subdomain = urlFromFile.replace( /.*?:\/\//g, '' ).split( '.' )[ 0 ];
			tunnelConfig.subdomain = subdomain;
		}

		return tunnelConfig;
	}

	close() {
		this.tunnel.close();
	}
}
