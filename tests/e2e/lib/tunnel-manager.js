import localtunnel from 'localtunnel';
import config from 'config';
import fs from 'fs';

import { execWpCommand } from './utils-helper';

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
		const tunnelConfig = this.getConfig( oneOff );

		const tunnel = await localtunnel( tunnelConfig );
		tunnel.on( 'close', () => {
			// tunnels are closed
			console.log( '!!!!!! TUNNEL is closed for ', tunnel.url );
		} );
		this.tunnel = tunnel;
		const url = tunnel.url.replace( 'http:', 'https:' );

		console.log( '#### CREATING A TUNNEL!!! oneOff: ', oneOff, 'Config: ', tunnelConfig, url );

		// await execShellCommand( `yarn wp-env run tests-cli wp option set siteurl "${ url }"` );
		// await execShellCommand( `yarn wp-env run tests-cli wp option set home "${ url }"` );

		await execWpCommand(
			`bash -c 'wp option set siteurl ${ url } && wp option set home ${ url }'`
		);

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

		let urlFromFile;
		try {
			urlFromFile = fs.readFileSync( 'e2e_tunnels.txt', 'utf8' );
		} catch ( error ) {
			console.log( error );
			// throw error;
		}

		console.log( urlFromFile );

		// use already created subdomain if found
		if ( urlFromFile && urlFromFile.length > 1 ) {
			const subdomain = urlFromFile.replace( /.*?:\/\//g, '' ).split( '.' )[ 0 ];
			tunnelConfig.subdomain = subdomain;
		}

		return tunnelConfig;
	}

	close() {
		this.tunnel.close();
	}
}
