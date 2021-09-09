const WPAPI = require( 'wpapi' );
const { getSiteCredentials, resolveSiteUrl } = require( '../utils-helper' );

module.exports = class WordpressAPI {
	constructor( credentials = getSiteCredentials(), siteUrl = resolveSiteUrl() ) {
		this.authenticatedClient = WPAPI.discover( `${ siteUrl }/wp-json` ).then( function ( site ) {
			return site.auth( { username: credentials.username, password: credentials.apiPassword } );
		} );
	}

	async getPlugins() {
		return await this.authenticatedClient
			.then( site => site.plugins() )
			.then( plugins => {
				return plugins;
			} )
			.catch( err => {
				console.log( err );
			} );
	}
};
