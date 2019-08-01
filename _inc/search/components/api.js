/**
 * External dependencies
 */
import fetch from 'unfetch';

const FIELDS = [ 'title_html', 'author', 'permalink.url.raw' ];

function stringifyArray( fieldName, array ) {
	return array.map( ( element, index ) => `${ fieldName }[${ index }]=${ element }` ).join( '&' );
}

function getAPIUrl( siteId, query ) {
	return `https://public-api.wordpress.com/rest/v1.3/sites/${ siteId }/search?query=${ encodeURIComponent(
		query
	) }&${ stringifyArray( 'fields', FIELDS ) }`;
}

export function search( siteId, query ) {
	return fetch( getAPIUrl( siteId, query ) );
}
