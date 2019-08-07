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

function getAPIUrl( siteId, query ) {
	return `https://public-api.wordpress.com/rest/v1.3/sites/${ siteId }/search?query=${ encodeURIComponent(
		query
	) }&${ stringifyArray( 'fields', FIELDS ) }&${ stringifyArray( 'highlight_fields', [
		'title',
	] ) }`;
}

export function search( query ) {
	return fetch( getAPIUrl( SITE_ID, query ) );
}
