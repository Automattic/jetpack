<?php
/**
 * Example User Sites Resource Ability
 *
 * @package automattic/jetpack-mcp
 */

namespace Automattic\Jetpack\AbilitiesRegistry\Abilities;

use Exception;
use WP_Error;

/**
 * User Sites Ability Class
 *
 * Handles retrieving a list of sites accessible to the current user.
 */
class ExampleUserSitesResourceAbility {

	/**
	 * Constructor - registers the ability.
	 */
	public function __construct() {
		// @phan-suppress-next-line PhanUndeclaredFunction
		wp_register_ability(
			'wpcom-mcp/user-sites-resource',
			$this->get_config()
		);
	}

	/**
	 * Get the ability configuration array.
	 *
	 * @return array The ability configuration.
	 */
	public function get_config(): array {
		return array(
			'label'               => 'User Sites',
			'description'         => 'List of user sites on WordPress.com',
			'input_schema'        => array(),
			'output_schema'       => array(),
			'execute_callback'    => array( $this, 'execute' ),
			'permission_callback' => array( $this, 'check_permission' ),
			'meta'                => array(
				'mimeType' => 'application/json',
				'uri'      => 'WordPress://wpcom-mcp/user-sites-resource',
			),
		);
	}

	/**
	 * Execute the user sites ability.
	 *
	 * @return array|WP_Error The sites list or error.
	 */
	public function execute() {
		try {
			$current_user_id = get_current_user_id();

			if ( ! $current_user_id ) {
				return new WP_Error(
					'no_user',
					'No user is currently logged in',
					array( 'status' => 401 )
				);
			}

			// Get all sites for the user.
			$all_sites = get_ordered_blogs_of_user( $current_user_id, true, true, true );

			if ( ! $all_sites || is_wp_error( $all_sites ) ) {
				return new WP_Error(
					'no_sites',
					'Unable to retrieve user sites',
					array( 'status' => 404 )
				);
			}

			// Return TextResourceContents format as per MCP schema.
			return array(
				array(
					'text'     => wp_json_encode(
						array(
							'sites' => $all_sites,
						)
					),
					'uri'      => 'WordPress://wpcom-mcp/user-sites-resource',
					'mimeType' => 'application/json',
				),
			);

		} catch ( Exception $e ) {
			return new WP_Error(
				'sites_error',
				'An error occurred while retrieving user sites: ' . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Check permission for the user sites ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $input is required for interface compatibility
		$current_user = wp_get_current_user();

		// User must be logged in to access their sites.
		if ( ! $current_user || ! $current_user->exists() ) {
			return false;
		}

		return true;
	}
}
