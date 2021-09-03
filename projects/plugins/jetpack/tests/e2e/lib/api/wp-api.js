import WPAPI from 'wpapi';
import { getSiteCredentials } from '../utils-helper';

export default class WordpressAPI {
	constructor() {
		const credentials = getSiteCredentials();
		this.authenticatedClient = WPAPI.discover( `${ siteUrl }/wp-json` ).then( function ( site ) {
			return site.auth( { username: credentials.username, password: credentials.apiPassword } );
		} );
	}

	async getPlugins() {
		return await this.authenticatedClient
			.then( site => site.plugins() )
			.then( plugins => {
				console.log( plugins );
			} )
			.catch( err => {
				console.log( err );
			} );
	}
}
