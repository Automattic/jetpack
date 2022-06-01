import { addQueryArgs, getQueryArg, isURL } from '@wordpress/url';

/**
 * @param { string } postId - ID of the current post
 * @param { string } connectURL - Stripe connect URL
 * @returns { null | string } URL
 */
export default function getConnectUrl( postId, connectURL ) {
	if ( ! isURL( connectURL ) ) {
		return null;
	}

	let url = connectURL;

	try {
		const state = getQueryArg( connectURL, 'state' );
		const decodedState = JSON.parse( atob( state ) );

		if ( postId ) {
			// Coming from the block editor
			decodedState.from_editor_post_id = postId;
		} else {
			// Coming from the site editor
			const queryParams = new URLSearchParams( window.location.search );

			decodedState.from_site_editor_post_id = queryParams.get( 'postId' );
			decodedState.from_site_editor_post_type = queryParams.get( 'postType' );
		}

		url = addQueryArgs( connectURL, { state: btoa( JSON.stringify( decodedState ) ) } );
	} catch ( err ) {
		if ( process.env.NODE_ENV !== 'production' ) {
			console.error( err ); // eslint-disable-line no-console
		}
	}

	return url;
}
