import apiFetch from '@wordpress/api-fetch';

export function getSubscriberCount( successCallback, failureCallback ) {
	return apiFetch( {
		path: '/wpcom/v2/subscribers/count?include_publicize_subscribers=false',
	} ).then( ( { count } = {} ) => {
		// Handle error condition
		if ( typeof count !== 'undefined' ) {
			successCallback( count );
		} else {
			failureCallback();
		}
	} );
}

export function getSubscriberCounts( successCallback, failureCallback ) {
	return apiFetch( {
		path: '/wpcom/v2/subscribers/counts',
	} ).then( ( { counts } = {} ) => {
		// Handle error condition
		if ( counts ) {
			successCallback( counts );
		} else {
			failureCallback();
		}
	} );
}
