/**
 * Scripts for Gutenberg Publicize extension.
 *
 * @file Scripts for Gutenberg Publicize extension.
 * @since  5.9.1
 */

/**
 * Internal dependencies
 */
const { gutenberg_publicize_setup, wp } = window;

/**
 * Get connection form set up data.
 *
 * Retrieves array of filtered connection UI data (labels, checked value,
 * URLs, etc.) from window global. This data only updates on refresh.
 *
 * @see ui.php
 *
 * @since 5.9.1
 *
 * @return {object} List of filtered connection UI data.
 */
export function getStaticPublicizeConnections() {
	return JSON.parse( gutenberg_publicize_setup.staticConnectionList );
}

/**
 * Get up-to-date connection list data for post.
 *
 * Retrieves array of filtered connection UI data (labels, checked value).
 * Connection list is queried based on post id because the connection
 * filtering depends on current post.
 *
 * @see ui.php
 *
 * @since 5.9.1
 *
 * @param {integer} postId ID of post to query connection defaults for.
 *
 * @return {Promise} Promise for connection request.
 */
export function requestPublicizeConnections( postId ) {
	return wp.apiRequest( {
		path: '/publicize/posts/' + postId.toString() + '/connections',
		contentType: 'application/json',
		dataType: 'json',
		processData: false,
		method: 'GET',
	} );
}

/**
 * Gets list of all possible connections.
 *
 * Gets list of possible social sites ('twitter', 'facebook, etc..')
 *
 * @since 5.9.1
 *
 * @return {object} List of possible services that can be connected to
 */
export function getAllConnections() {
	return JSON.parse( gutenberg_publicize_setup.allServices );
}
