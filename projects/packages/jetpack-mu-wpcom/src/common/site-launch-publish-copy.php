<?php
/**
 * The "Publish" copy experiment for site launch entry points.
 *
 * Calypso reads the same experiment, so one user sees the same verb on every surface.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;

require_once __DIR__ . '/../utils.php';

if ( ! defined( 'WPCOM_SITE_LAUNCH_PUBLISH_COPY_EXPERIMENT' ) ) {
	/**
	 * The ExPlat experiment. It is registered on the calypso platform, which the server-side assigner
	 * also accepts.
	 */
	define( 'WPCOM_SITE_LAUNCH_PUBLISH_COPY_EXPERIMENT', 'calypso_site_launch_publish_copy_202610_v1' );
}

if ( ! function_exists( 'wpcom_site_launch_uses_publish_copy' ) ) {
	/**
	 * Whether a site launch entry point says "Publish" instead of "Launch" for the current user.
	 *
	 * Call it only where an entry point renders: it assigns the user, and rendering is the exposure.
	 * Code that runs on most requests, such as the launchpad task titles built on `init`, must use
	 * wpcom_site_launch_peek_publish_copy() instead.
	 *
	 * @return bool
	 */
	function wpcom_site_launch_uses_publish_copy() {
		return wpcom_site_launch_get_publish_copy( true );
	}
}

if ( ! function_exists( 'wpcom_site_launch_peek_publish_copy' ) ) {
	/**
	 * Like wpcom_site_launch_uses_publish_copy(), but reads an existing assignment without making one.
	 *
	 * A user with no assignment yet gets the control.
	 *
	 * @return bool
	 */
	function wpcom_site_launch_peek_publish_copy() {
		return wpcom_site_launch_get_publish_copy( false );
	}
}

if ( ! function_exists( 'wpcom_site_launch_get_publish_copy' ) ) {
	/**
	 * Resolves the experiment arm once per request, blog, and user.
	 *
	 * @param bool $assign Whether to assign a user who has no assignment yet.
	 * @return bool
	 */
	function wpcom_site_launch_get_publish_copy( $assign ) {
		/**
		 * Overrides the site launch "Publish" copy experiment assignment, for testing.
		 *
		 * @param bool|null $override True to force the treatment, false to force control, or null to ask ExPlat.
		 */
		$override = apply_filters( 'wpcom_site_launch_publish_copy_override_is_treatment', null );
		if ( null !== $override ) {
			return (bool) $override;
		}

		static $results = array();

		$key = get_current_blog_id() . ':' . get_current_user_id();
		if ( $assign && ! isset( $results[ $key ]['assign'] ) ) {
			$results[ $key ]['assign'] = wpcom_site_launch_resolve_publish_copy( true );
			// A peek later in this request must see the assignment just made.
			$results[ $key ]['peek'] = $results[ $key ]['assign'];
		} elseif ( ! $assign && ! isset( $results[ $key ]['peek'] ) ) {
			$results[ $key ]['peek'] = wpcom_site_launch_resolve_publish_copy( false );
		}

		return $results[ $key ][ $assign ? 'assign' : 'peek' ];
	}
}

if ( ! function_exists( 'wpcom_site_launch_resolve_publish_copy' ) ) {
	/**
	 * Resolves the experiment arm. Use the cached wrappers above.
	 *
	 * Only admins of an unlaunched site are assigned; everyone else gets the control. Agencies launch
	 * their dev sites through their own flow, so Calypso keeps those out too.
	 *
	 * @param bool $assign Whether to assign a user who has no assignment yet.
	 * @return bool
	 */
	function wpcom_site_launch_resolve_publish_copy( $assign ) {
		if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		if ( get_option( 'launch-status' ) !== 'unlaunched' ) {
			return false;
		}

		if ( wpcom_has_blog_sticker( 'a4a-is-dev-site', get_current_blog_id() ) ) {
			return false;
		}

		$user_id   = get_current_user_id();
		$cache_key = 'wpcom-site-launch-publish-copy-' . $user_id . '-' . WPCOM_SITE_LAUNCH_PUBLISH_COPY_EXPERIMENT;
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return (bool) $cached;
		}

		// ExPlat returns null both for the control and for a failed assignment. On Simple the call is
		// local, so a null is not cached. On Atomic it is a request, so any 200 counts as answered and is
		// cached, the control included; only a failed request is retried.
		$variation = null;
		$answered  = false;

		if ( ( new Host() )->is_wpcom_simple() ) {
			if ( $assign && function_exists( '\ExPlat\assign_current_user' ) ) {
				$variation = \ExPlat\assign_current_user( WPCOM_SITE_LAUNCH_PUBLISH_COPY_EXPERIMENT );
			} elseif ( ! $assign && function_exists( '\ExPlat\get_current_user_assignment' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunction -- Defined on WordPress.com, missing from the wpcom stubs.
				$variation = \ExPlat\get_current_user_assignment( WPCOM_SITE_LAUNCH_PUBLISH_COPY_EXPERIMENT );
			}
			$answered = null !== $variation;
		} elseif ( $assign && ( new Connection_Manager( 'jetpack' ) )->is_user_connected() ) {
			// The assignments endpoint always assigns, so a peek on Atomic relies on the cache alone.
			$response = Client::wpcom_json_api_request_as_user(
				add_query_arg(
					array( 'experiment_names' => WPCOM_SITE_LAUNCH_PUBLISH_COPY_EXPERIMENT ),
					'/experiments/0.1.0/assignments/wpcom'
				),
				'2'
			);

			if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
				$data      = json_decode( wp_remote_retrieve_body( $response ), true );
				$variation = $data['variations'][ WPCOM_SITE_LAUNCH_PUBLISH_COPY_EXPERIMENT ] ?? null;
				$answered  = true;
			}
		}

		if ( ! $answered ) {
			return false;
		}

		$is_treatment = 'treatment' === $variation;
		set_transient( $cache_key, $is_treatment ? 1 : 0, HOUR_IN_SECONDS );

		return $is_treatment;
	}
}
