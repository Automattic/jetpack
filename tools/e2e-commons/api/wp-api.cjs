const WpApi = require( 'wpapi' );

module.exports = class WordpressAPI {
	constructor( credentials, siteUrl ) {
		this.authenticatedClient = WpApi.discover( `${ siteUrl }/wp-json` ).then( function ( site ) {
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
