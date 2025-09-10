<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Executors\Post;

use Automattic\Jetpack\AbilitiesRegistry\Helpers\PostQueryHelper;
use Automattic\Jetpack\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Exception;
use WP_Error;

/**
 * Posts Search Executor
 *
 * Contains all heavy execution logic for posts search operations.
 * Only loaded when the ability is actually executed.
 */
class PostsSearchExecutor implements ExecutorInterface {

	/**
	 * Execute the posts search ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return array|WP_Error The search results or error.
	 */
	public function execute( array $input = array() ) {
		$original_blog_id = get_current_blog_id();
		$switched         = false;

		try {
			// Handle site switching if wpcom_site is provided.
			if ( ! empty( $input['wpcom_site'] ) ) {
				$target_site    = $input['wpcom_site'];
				$target_blog_id = null;

				// Determine if it's a blog ID or URL.
				if ( ctype_digit( (string) $target_site ) ) {
					$target_blog_id = (int) $target_site;

					// Validate blog ID.
					if ( $target_blog_id < 1 ) {
						return new WP_Error(
							'invalid_site_id',
							'Invalid site ID provided',
							array( 'status' => 400 )
						);
					}

					$blog_details = get_blog_details( $target_blog_id );
				} else {
					// It's a URL - decode and get blog details.
					$target_site = urldecode( $target_site );
					$target_site = str_replace( '::', '/', $target_site );

					$blog_details = apply_filters( 'jetpack_mcp_get_blog_details_for_url', null, $target_site );
					if ( ! $blog_details ) {
						return new WP_Error(
							'site_not_found',
							'Site not found or inaccessible',
							array( 'status' => 404 )
						);
					}
				}

				// Validate blog details.
				if ( ! $blog_details || is_wp_error( $blog_details ) ) {
					return new WP_Error(
						'site_not_found',
						'Site not found or inaccessible',
						array( 'status' => 404 )
					);
				}

				$target_blog_id = (int) $blog_details->blog_id;

				// Only switch if it's a different site.
				if ( $target_blog_id !== $original_blog_id ) {
					// Check if site is restricted (using pattern from centralize.php).
					$is_suspended = apply_filters( 'jetpack_mcp_is_site_suspended', false, $target_blog_id );
					if ( $is_suspended ) {
						return new WP_Error(
							'site_suspended',
							'This site has been suspended',
							array( 'status' => 403 )
						);
					}

					// Check if site is confidential (A8C blogs only).
					$ai_access_allowed = apply_filters( 'jetpack_mcp_site_ai_access_allowed', false, $target_blog_id );
					if ( ! $ai_access_allowed ) {
						return new WP_Error(
							'site_confidential',
							'This site is confidential and cannot be accessed',
							array( 'status' => 403 )
						);
					}

					switch_to_blog( $target_blog_id );
					$switched = true;

					// Trigger action for any additional setup needed.
					if ( has_action( 'rest_api_switched_to_blog' ) ) {
						do_action( 'rest_api_switched_to_blog' );
					}
				}
			}

			// Execute post query using helper.
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
		} finally {
			// Always restore the original blog if we switched.
			if ( $switched ) {
				restore_current_blog();
			}
		}
	}

	/**
	 * Check permission for the posts search ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool {
		$current_user = wp_get_current_user();

		// If no user is logged in, deny access.
		if ( ! $current_user || ! $current_user->exists() ) {
			return false;
		}

		// If a specific site is requested, check capabilities for that site.
		if ( ! empty( $input['wpcom_site'] ) ) {
			$target_site    = $input['wpcom_site'];
			$target_blog_id = null;

			// Determine if it's a blog ID or URL.
			if ( is_numeric( $target_site ) ) {
				$target_blog_id = (int) $target_site;

				// Validate blog ID.
				if ( $target_blog_id < 1 ) {
					return false;
				}

				$blog_details = get_blog_details( $target_blog_id );
			} else {
				// It's a URL - decode and get blog details.
				$target_site = urldecode( $target_site );
				$target_site = str_replace( '::', '/', $target_site );

				$blog_details = apply_filters( 'jetpack_mcp_get_blog_details_for_url', null, $target_site );
				if ( ! $blog_details ) {
					return false;
				}
			}

			// Validate blog details.
			if ( ! $blog_details || is_wp_error( $blog_details ) ) {
				return false;
			}

			$target_blog_id = (int) $blog_details->blog_id;

			// Check if the site is suspended or restricted.
			$is_suspended = apply_filters( 'jetpack_mcp_is_site_suspended', false, $target_blog_id );
			if ( $is_suspended ) {
				return false;
			}

			// Check if site is confidential (A8C blogs only).
			$ai_access_allowed = apply_filters( 'jetpack_mcp_site_ai_access_allowed', false, $target_blog_id );
			if ( ! $ai_access_allowed ) {
				return false;
			}

			// Method 1: Use WordPress.com's current_user_can_for_site function if available.
			return apply_filters( 'jetpack_mcp_user_can_access_site', false, $target_blog_id, 'read' );
		}

		// For the current site, check if user can read posts.
		return current_user_can( 'read' );
	}
}
