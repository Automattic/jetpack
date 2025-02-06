<?php
/**
 * Publicize_Utils.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

/**
 * Publicize_Utils class.
 */
class Publicize_Utils {

	/**
	 * Whether the current page is the social settings page.
	 */
	public static function is_social_settings_page() {
		$screen = get_current_screen();

		return ! empty( $screen ) && 'jetpack_page_jetpack-social' === $screen->base;
	}

	/**
	 * Whether the current page is the Jetpack settings page.
	 */
	public static function is_jetpack_settings_page() {
		$screen = get_current_screen();

		return ! empty( $screen ) && 'toplevel_page_jetpack' === $screen->base;
	}

	/**
	 * Whether the block editor should have the social features.
	 *
	 * @return bool
	 */
	public static function should_block_editor_have_social() {
		if ( ! is_admin() ) {
			return false;
		}

		$screen = get_current_screen();

		if ( empty( $screen ) || ! $screen->is_block_editor() ) {
			return false;
		}

		$needs_jetpack_connection = ! ( new Host() )->is_wpcom_platform();

		if ( $needs_jetpack_connection && ! self::is_connected() ) {
			return false;
		}

		if ( ! self::is_publicize_active() ) {
			return false;
		}

		$post_type = get_post_type();

		if ( empty( $post_type ) || ! post_type_supports( $post_type, 'publicize' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Helper to check that we have a Jetpack connection.
	 */
	public static function is_connected() {

		$connection = new Manager();

		return $connection->is_connected() && $connection->has_connected_user();
	}

	/**
	 * Check if the Publicize module is active.
	 *
	 * @return bool
	 */
	public static function is_publicize_active() {
		return ( new Modules() )->is_active( 'publicize' );
	}

	/**
	 * Check if we are on WPCOM.
	 *
	 * @return bool
	 */
	public static function is_wpcom() {
		return ( new Host() )->is_wpcom_simple();
	}

	/**
	 * Assert that the method is only called on WPCOM.
	 *
	 * @param string $method The method name.
	 *
	 * @throws \Exception If the method is not called on WPCOM.
	 */
	public static function assert_is_wpcom( $method ) {
		if ( ! self::is_wpcom() ) {
			throw new \Exception( esc_html( "Method $method can only be called on WordPress.com." ) );
		}
	}
}
