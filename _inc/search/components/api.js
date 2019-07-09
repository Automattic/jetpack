/**
 * External dependencies
 */
import fetch from 'unfetch';

class JetpackSearchAPI {
	getAPIUrl( query ) {
		let url = 'https://public-api.wordpress.com/rest/v1.3/sites/20115252/search?q=';
		url += encodeURIComponent( query );
		url += '&fields=author';
		return url;
	}

	fetch( query ) {
		return fetch( this.getAPIUrl( query ) );
	}
}

export default JetpackSearchAPI;
