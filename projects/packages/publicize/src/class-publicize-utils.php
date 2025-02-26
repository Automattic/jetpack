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

	/**
	 * Check if the new module endpoint is available in the used Jetpack version.
	 * We need the module status in response that's why we do the version check https://github.com/Automattic/jetpack/pull/41461/files#diff-f8e5ef1115599de750b64143dd1901554254eddd95ab4371b6b6b3b2a5914224R638-R642.
	 * More: https://github.com/Automattic/jetpack/pull/41596.
	 *
	 * @return bool
	 */
	public static function should_use_jetpack_module_endpoint() {
		return class_exists( 'Jetpack' ) && defined( 'JETPACK__VERSION' ) && ( version_compare( (string) JETPACK__VERSION, '14.3', '>=' ) );
	}

	/**
	 * Log a warning that a deprecated endpoint was called.
	 *
	 * @param string $function_name        The function name.
	 * @param string $version              The version in which the endpoint was deprecated.
	 * @param string $deprecated_endpoint  The deprecated endpoint.
	 * @param string $alternative_endpoint The alternative endpoint.
	 */
	public static function endpoint_deprecated_warning( $function_name, $version, $deprecated_endpoint, $alternative_endpoint = '' ) {

		$messages = array(
			sprintf(
				/* translators: %s: REST API endpoint. */
				esc_html__( '%1$s endpoint has been deprecated.', 'jetpack-publicize-pkg' ),
				'"' . $deprecated_endpoint . '"'
			),
		);

		if ( ! empty( $alternative_endpoint ) ) {
			$messages[] = sprintf(
				/* translators: %s: alternative endpoint. */
				esc_html__( 'Please use %s endpoint instead.', 'jetpack-publicize-pkg' ),
				'"' . $alternative_endpoint . '"'
			);
		}

		$messages[] = esc_html__( 'Please update all the Jetpack plugins to the latest version.', 'jetpack-publicize-pkg' );

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- We have done it above.
		_doing_it_wrong( esc_html( $function_name ), implode( ' ', $messages ), $version );
	}
}
