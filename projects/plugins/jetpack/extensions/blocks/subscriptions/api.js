import apiFetch from '@wordpress/api-fetch';

export function getSubscriberCount( successCallback, failureCallback ) {
	return apiFetch( { path: '/wpcom/v2/subscribers/count' } ).then( count => {
		// Handle error condition
		if ( ! count.hasOwnProperty( 'count' ) ) {
			failureCallback();
		} else {
			successCallback( count.count );
		}
	} );
}
