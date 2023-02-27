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
