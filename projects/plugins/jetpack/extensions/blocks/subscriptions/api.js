import apiFetch from '@wordpress/api-fetch';

export function getSubscriberCount( successCallback, failureCallback ) {
	return apiFetch( {
		path: '/wpcom/v2/subscribers/count',
	} ).then( ( { count } = {} ) => {
		// Handle error condition
		if ( Number.isFinite( count ) ) {
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
