<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Executors\Post;

use Automattic\WpcomMcp\AbilitiesRegistry\Helpers\PostQueryHelper;
use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Exception;

/**
 * Site Post Get Executor
 *
 * Contains execution logic for single post retrieval within the current site.
 * Does not support site switching - operates only on the current site.
 * Only loaded when the ability is actually executed.
 */
class SitePostGetExecutor implements ExecutorInterface {

	/**
	 * Execute the site post get ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return array The post data or error response.
	 */
	public function execute( array $input = array() ): array {
		try {
			// Validate input.
			if ( empty( $input['post_id'] ) && empty( $input['post_url'] ) ) {
				return array(
					'success' => false,
					'error'   => array(
						'code'    => 'missing_post_identifier',
						'message' => 'Either post_id or post_url must be provided',
						'status'  => 400,
					),
				);
			}

			// Get single post using helper (no site switching needed).
			$post_data = PostQueryHelper::get_single_post( $input );

			if ( ! $post_data ) {
				return array(
					'success' => false,
					'error'   => array(
						'code'    => 'post_not_found',
						'message' => 'Post not found or inaccessible',
						'status'  => 404,
					),
				);
			}

			$site_info = PostQueryHelper::get_current_site_info();

			// Return structured response.
			return array(
				'post'      => $post_data,
				'site_info' => $site_info,
			);

		} catch ( Exception $e ) {
			// Log the error.
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'get_post_error',
					'message' => 'An error occurred while retrieving post: ' . $e->getMessage(),
					'status'  => 500,
				),
			);
		}
	}

	/**
	 * Check permission for the site post get ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $input is required for interface compatibility
		$current_user = wp_get_current_user();

		// If no user is logged in, deny access.
		if ( ! $current_user || ! $current_user->exists() ) {
			return false;
		}

		// Check if user can read posts on the current site.
		return current_user_can( 'read' );
	}
}
