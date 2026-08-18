<?php
/**
 * REST controller for the modernized Backup dashboard.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers REST routes that back the modernized dashboard.
 *
 * Each bridge class declares its routes via `register_routes()` and uses
 * the shared `permission_check()` helper for the `manage_options` gate.
 * Routes only register when the modernization filter is on, so the
 * legacy plugin is byte-identical when the flag is off.
 */
class Rest_Controller {

	/**
	 * Hook entry point. Registers all bridge routes if the modernization
	 * filter is enabled.
	 *
	 * @return void
	 */
	public static function register_routes() {
		if ( ! Jetpack_Backup::is_modernized() ) {
			return;
		}

		Capabilities_Bridge::register_routes();
		Activity_Log_Bridge::register_routes();
		File_Browser_Bridge::register_routes();
		Download_Bridge::register_routes();
		Restore_Bridge::register_routes();
	}

	/**
	 * Permission check shared by every modernized-dashboard route.
	 *
	 * Mirrors the activity-log package's pattern: `manage_options` is
	 * necessary but not sufficient — every bridge eventually proxies a
	 * WPCOM endpoint that's user-gated, so a site admin who isn't
	 * personally WPCOM-linked needs a clearer error than the opaque
	 * "Only Administrators can query…" WPCOM returns.
	 *
	 * @return bool|WP_Error True when the current user can call the bridges, WP_Error otherwise.
	 */
	public static function permission_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return new WP_Error(
				'user_not_connected',
				__( 'Your WordPress.com account is not connected to this site.', 'jetpack-backup-pkg' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Returns the site's WPCOM blog id, or a `not_connected` WP_Error
	 * when the site hasn't been registered yet. Shared across the bridges
	 * so the `sprintf( '/sites/%d/…', $blog_id )` upstream path is never
	 * built with an empty id.
	 *
	 * @return int|WP_Error Blog id, or WP_Error when not connected.
	 */
	public static function get_blog_id_or_error() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error(
				'not_connected',
				__( 'This site is not connected to Jetpack.', 'jetpack-backup-pkg' ),
				array( 'status' => 412 )
			);
		}
		return $blog_id;
	}

	/**
	 * Rebuild a restore/download `types` parameter as a named map.
	 *
	 * The PHP counterpart of the client's `serializeTypes`, and the reason
	 * it exists here rather than being trusted from the request: WordPress
	 * validates `'type' => 'object'` with `rest_is_object()`, which is
	 * `is_array()`. A JSON list therefore passes validation and arrives as
	 * a PHP list, whose numeric keys WPCOM reads as category names. The
	 * route schema rejects the realistic version of that, but only because
	 * the members fail a boolean check — shape itself is never asserted —
	 * so the guarantee is made here, where the payload is actually built.
	 *
	 * Only string keys with a truthy value survive, and every surviving
	 * value is normalized to `true`. Values are read with
	 * `rest_sanitize_boolean()` so a form-encoded `"false"` or `"0"` means
	 * skip rather than select.
	 *
	 * @param mixed $types Raw `types` parameter from the request.
	 * @return array<string, true> Named types, empty when none are selected.
	 */
	public static function named_types( $types ) {
		if ( ! is_array( $types ) && ! is_object( $types ) ) {
			return array();
		}

		$named = array();
		foreach ( (array) $types as $key => $value ) {
			if ( is_string( $key ) && '' !== $key && rest_sanitize_boolean( $value ) ) {
				$named[ $key ] = true;
			}
		}
		return $named;
	}
}
