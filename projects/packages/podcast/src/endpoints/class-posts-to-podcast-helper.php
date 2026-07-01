<?php
/**
 * Helper for the Posts to Podcast feature.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

/**
 * Gating + permission helpers for the Posts to Podcast REST endpoint.
 */
class Posts_To_Podcast_Helper {

	/**
	 * Whether the Posts to Podcast feature is active for the current request.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Filter to allow disabling the Posts to Podcast feature on a per-site basis.
		 * Defaults to true wherever the podcast package is active; flip this to false
		 * to hide the section during a staged rollout without disabling the package.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $enabled Whether the feature is enabled. Default true.
		 */
		return (bool) apply_filters( 'jetpack_posts_to_podcast_is_enabled', true );
	}

	/**
	 * Permission callback for the local proxy REST endpoint.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 *
	 * @return true|\WP_Error
	 */
	public static function get_status_permission_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to use this feature on this site.', 'jetpack-podcast' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}
}
