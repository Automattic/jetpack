/**
 * External dependencies
 */
import fetch from 'unfetch';

// TODO: Get actual site ID for the site
const SITE_ID = 20115252;
const FIELDS = [ 'title.html', 'author', 'permalink.url.raw' ];

function stringifyArray( fieldName, array ) {
	return array.map( ( element, index ) => `${ fieldName }[${ index }]=${ element }` ).join( '&' );
}

class JetpackSearchAPI {
	getAPIUrl( siteId, query ) {
		return `https://public-api.wordpress.com/rest/v1.3/sites/${ siteId }/search?q=${ encodeURIComponent(
			query
		) }&${ stringifyArray( 'fields', FIELDS ) }`;
	}

	fetch( query ) {
		return fetch( this.getAPIUrl( SITE_ID, query ) );
	}
}

export default JetpackSearchAPI;
