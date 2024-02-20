<?php
/**
 * Adds support for the GitHub Deployments feature (see /github-deployments/%s in Calypso)
 *
 * @package wpcomsh
 */

/**
 * Jetpack adds the github deployments menu to WoA sites depending on the result of the
 * jetpack_show_wpcom_github_deployments_menu filter. During development only particular
 * users can see this menu. At launch time this filter will return true for
 * all users.
 *
 * @return bool true if the current user should see the github deployments menu
 */
function wpcomsh_should_show_wpcom_github_deployments_menu() {
	return request_github_deployments_available();
}

add_filter( 'jetpack_show_wpcom_github_deployments_menu', 'wpcomsh_should_show_wpcom_github_deployments_menu' );

/**
 * Check if the GitHub Deployments feature is enabled for the given site.
 * This is for testing purposes only.
 */
function request_github_deployments_available() {
	$wpcom_blog_id = Jetpack_Options::get_option( 'id' );
	$endpoint      = "/sites/{$wpcom_blog_id}/hosting/github/available";

	$response = Jetpack_Client::wpcom_json_api_request_as_blog(
		$endpoint,
		'v2',
		array( 'method' => 'GET' ),
		null,
		'wpcom'
	);

	if ( is_wp_error( $response ) || 200 !== $response['response']['code'] || empty( $response['body'] ) ) {
		return false;
	}

	$response = json_decode( wp_remote_retrieve_body( $response ), true );
	return $response['available'];
}
