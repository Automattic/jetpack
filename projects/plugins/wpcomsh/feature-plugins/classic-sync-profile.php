<?php
/**
 * Synchronizes user profile data between WordPress.com and the local WordPress installation.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Synchronize the current user's profile data from WordPress.com.
 *
 * Fetches the user profile data via WordPress.com's JSON API and updates the local user profile.
 *
 * @return void
 */
function wpcom_sync_user_profile_data() {
	// Fetch the current user's profile data from wpcom.
	$response = Client::wpcom_json_api_request_as_user(
		'/me/profile',
		'2',
		array(
			'method' => 'GET',
		),
		null,
		'wpcom'
	);

	$response_code         = wp_remote_retrieve_response_code( $response );
	$response_body_content = wp_remote_retrieve_body( $response );
	$profile_data          = json_decode( $response_body_content, true );

	// Check if the API call was successful.
	if ( $response_code === 200 && is_array( $profile_data ) ) {
		$user_id = get_current_user_id();
		$user    = get_userdata( $user_id );

		if ( $user ) {
			// Update the user's profile with the fetched data.
			$userdata = array(
				'ID'                   => $user_id,
				'first_name'           => $profile_data['first_name'],
				'last_name'            => $profile_data['last_name'],
				'nickname'             => $profile_data['nickname'],
				'display_name'         => $profile_data['display_name'],
				'description'          => $profile_data['description'],
				'user_url'             => $profile_data['user_url'],
				'locale'               => $profile_data['locale'],
				'admin_color'          => $profile_data['admin_color'],
				'comment_shortcuts'    => 'true',
				'rich_editing'         => 'true',
				'syntax_highlighting'  => 'true',
				'show_admin_bar_front' => 'true',
			);

			wp_update_user( $userdata );
		}
	}
}

/**
 * Trigger user profile data synchronization when the admin interface setting is updated.
 *
 * @param mixed $new_value The new value of the setting.
 * @param mixed $old_value The old value of the setting.
 * @return void
 */
function wpcom_admin_interface_updated( $new_value, $old_value ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	if ( $new_value === 'calypso' || empty( $new_value ) ) {
		wpcom_sync_user_profile_data();
	}
}

add_filter( 'pre_update_option_wpcom_admin_interface', 'wpcom_admin_interface_updated', 15, 2 );
