<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Executors\Post;

use Automattic\WpcomMcp\AbilitiesRegistry\Helpers\PostQueryHelper;
use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Exception;
use WP_Error;

/**
 * Site Posts Search Executor
 *
 * Contains execution logic for site-specific posts search operations.
 * Does not support site switching - operates only on the current site.
 * Only loaded when the ability is actually executed.
 */
class SitePostsSearchExecutor implements ExecutorInterface {

	/**
	 * Execute the site posts search ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return array|WP_Error The search results or error.
	 */
	public function execute( array $input = array() ) {
		try {
		// Execute post query using helper (no site switching needed).
		$query_results = PostQueryHelper::query_posts( $input );
		$site_info     = PostQueryHelper::get_current_site_info();

		// Return structured response.
		return array_merge( $query_results, array( 'site_info' => $site_info ) );

	} catch ( Exception $e ) {
		// Log the error.
		return new WP_Error(
			'search_error',
			'An error occurred while searching posts: ' . $e->getMessage(),
			array( 'status' => 500 )
		);
		}
	}

	/**
	 * Check permission for the site posts search ability.
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
