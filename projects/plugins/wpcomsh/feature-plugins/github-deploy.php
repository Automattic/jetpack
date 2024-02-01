<?php
/**
 * Adds support for the GitHub deploy feature (see /hosting-config in Calypso)
 *
 * @package wpcomsh
 */

/**
 * Registers a CPT for storing deploy logs. Accessed via the /hosting/github/deployment-logs endpoint.
 */
function wpcomsh_register_github_deploy_log_cpt() {
	register_post_type(
		'wpcom_ghi_deploy_log',
		array(
			'public'       => false,
			'show_in_rest' => false,
		)
	);
}
add_action( 'init', 'wpcomsh_register_github_deploy_log_cpt' );

/**
 * Report a GitHub deploy stat to MC Stats.
 *
 * @param string $bin Bin name. Can use commas to bump multiple e.g. stat1,stat2
 */
function wpcomsh_bump_github_deploy_stats( $bin ) {
	$query_args = array(
		'x_github-deploy' => $bin,

		// Ensure this request doesn't count as a pageview
		'v'               => 'wpcom-no-pv',
	);

	$stats_track_url = 'http://pixel.wp.com/b.gif?' . http_build_query( $query_args );
	$result          = wp_remote_get( $stats_track_url );
	if ( $result instanceof \WP_Error ) {
		error_log( 'WPComSH: ' . $result->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
	}
}

/**
 * Jetpack adds the github deployments menu to WoA sites depending on the result of the
 * jetpack_show_wpcom_github_deployments_menu filter. During development only particular
 * users can see this menu. At launch time this filter will return true for
 * all users.
 *
 * @return bool true if the current user should see the github deployments menu
 */
function wpcomsh_should_show_wpcom_github_deployments_menu() {
	if ( defined( 'WPCOMSH_SHOW_WPCOM_github_deployments_MENU' ) ) {
		return boolval( WPCOMSH_SHOW_WPCOM_GITHUB_DEPLOYMENTS_MENU );
	}

	// Using user_login rather than ID here because user IDs on Atomic sites don't
	// always match WPCOM user IDs. Logins might not be fullproof either, but
	// they're probably better.
	$allowed_users = array(
		'mk9287',
		'philipmjackson',
		'vykesmac',
		'zaguiini',
		'paulopmt1',
		'jeroenpfeil',
	);

	return in_array( wp_get_current_user()->get( 'user_login' ), $allowed_users, true );
}
add_filter( 'jetpack_show_wpcom_github_deployments_menu', 'wpcomsh_should_show_wpcom_github_deployments_menu' );
