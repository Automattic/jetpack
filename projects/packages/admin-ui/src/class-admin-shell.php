<?php
/**
 * Admin shell: switch between Jetpack wp-build dashboards without a page load.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

/**
 * Decides whether the admin shell is on, and which dashboards have joined it.
 */
class Admin_Shell {

	/**
	 * Feature flag that turns the shell on. Off by default.
	 */
	const FLAG = 'jetpack-admin-shell';

	/**
	 * Query argument that turns the shell off for one request when set to `0`.
	 */
	const DISABLE_QUERY_ARG = 'jetpack_admin_shell';

	/**
	 * Member keys that must be non-empty strings.
	 */
	const REQUIRED_STRING_KEYS = array( 'build_prefix', 'build_page', 'title' );

	/**
	 * Register the feature flag.
	 *
	 * @return void
	 */
	public static function register_feature_flag() {
		Feature_Flags::register(
			self::FLAG,
			array(
				'default'     => false,
				'description' => 'Switch between Jetpack dashboards in wp-admin without a page load.',
				'owner'       => 'jetpack-admin-ui',
			)
		);
	}

	/**
	 * Whether the shell is on for this request.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only opt-out; it can only turn the shell off.
		if ( isset( $_GET[ self::DISABLE_QUERY_ARG ] ) && '0' === $_GET[ self::DISABLE_QUERY_ARG ] ) {
			return false;
		}

		/**
		 * Filters whether Jetpack dashboards share one wp-admin page.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether the shell is on. Defaults to the `jetpack-admin-shell` feature flag.
		 */
		return (bool) apply_filters( 'jetpack_admin_shell_enabled', Feature_Flags::is_enabled( self::FLAG ) );
	}

	/**
	 * Member dashboards, keyed by admin page slug. Entries that don't match the contract are dropped.
	 *
	 * @return array<string, array{build_prefix: string, build_page: string, init_modules: string[], title: string, default_path: string|null, load: callable, capability: string, handles: string[]}>
	 */
	public static function get_members() {
		/**
		 * Filters the dashboards that share the admin shell.
		 *
		 * Each entry is keyed by its admin page slug and holds:
		 * - build_prefix (string)   The wp-build prefix of the generated page functions.
		 * - build_page (string)     The wp-build page name.
		 * - init_modules (string[]) Script modules to import before the app boots.
		 * - title (string)          Document title while the page is shown.
		 * - default_path (string)   Optional. The `p` a bare menu link opens.
		 * - load (callable)         Registers the page's scripts and prints its initial data. Must be safe to run twice, and must not redirect, print or write options.
		 * - capability (string)     Optional, default `manage_options`. Required to load the page into the shell.
		 * - handles (string[])      Optional. Script and style handles the shell may return for the page.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $members Member definitions keyed by admin page slug.
		 */
		$members = apply_filters( 'jetpack_admin_shell_members', array() );
		if ( ! is_array( $members ) ) {
			return array();
		}

		$valid = array();
		foreach ( $members as $slug => $member ) {
			$normalized = self::normalize_member( $slug, $member );
			if ( null === $normalized ) {
				_doing_it_wrong(
					__METHOD__,
					esc_html( sprintf( 'Admin shell member "%s" is missing a required key or has one of the wrong type, so it was skipped.', is_scalar( $slug ) ? $slug : '' ) ),
					'$$next-version$$'
				);
				continue;
			}
			$valid[ $slug ] = $normalized;
		}

		return $valid;
	}

	/**
	 * Fill in a member's defaults, or return null when it can't be used.
	 *
	 * @param mixed $slug   Admin page slug.
	 * @param mixed $member Member definition.
	 * @return array|null
	 */
	private static function normalize_member( $slug, $member ) {
		if ( ! is_string( $slug ) || sanitize_key( $slug ) !== $slug || '' === $slug || ! is_array( $member ) ) {
			return null;
		}

		foreach ( self::REQUIRED_STRING_KEYS as $key ) {
			if ( ! isset( $member[ $key ] ) || ! is_string( $member[ $key ] ) || '' === $member[ $key ] ) {
				return null;
			}
		}

		if ( ! isset( $member['load'] ) || ! is_callable( $member['load'] ) ) {
			return null;
		}

		$member = array_merge(
			array(
				'init_modules' => array(),
				'default_path' => null,
				'capability'   => 'manage_options',
				'handles'      => array(),
			),
			$member
		);

		if (
			! self::is_string_list( $member['init_modules'] )
			|| ! self::is_string_list( $member['handles'] )
			|| ! is_string( $member['capability'] ) || '' === $member['capability']
			|| ( null !== $member['default_path'] && ! is_string( $member['default_path'] ) )
		) {
			return null;
		}

		return $member;
	}

	/**
	 * Whether a value is a list of strings.
	 *
	 * @param mixed $value Value to check.
	 * @return bool
	 */
	private static function is_string_list( $value ) {
		if ( ! is_array( $value ) || array_values( $value ) !== $value ) {
			return false;
		}
		foreach ( $value as $item ) {
			if ( ! is_string( $item ) ) {
				return false;
			}
		}
		return true;
	}
}
