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
