<?php
/**
 * Admin shell rollout on WordPress.com: on for Automatticians, behind a kill switch.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Turns the `jetpack-admin-shell` flag on for Automatticians, and lets WordPress.com force it off.
 *
 * Precedence, highest first: kill switch, the site's Tools → Feature Flags override, the Automattician default.
 * Temporary: remove the default once the flag defaults on, and the class once the kill switch is no longer needed.
 */
class Wpcom_Admin_Shell_Rollout {

	/**
	 * The flag Admin_Shell registers in the admin-ui package, which this package does not require.
	 */
	const FLAG = 'jetpack-admin-shell';

	/**
	 * Network option that, when truthy, turns the shell off for every site on the network.
	 */
	const KILL_SWITCH_OPTION = 'wpcom_admin_shell_kill_switch';

	/**
	 * Register the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		// Before Wpcom_Feature_Flags::filter_enabled() at 10, so a per-site override beats this default.
		add_filter( 'jetpack_feature_flag_enabled', array( self::class, 'default_on_for_a11ns' ), 5, 2 );
		// Both: the flag hook keeps direct flag reads honest, the shell hook beats any later shell filter.
		add_filter( 'jetpack_feature_flag_enabled_' . self::FLAG, array( self::class, 'apply_kill_switch' ), PHP_INT_MAX );
		add_filter( 'jetpack_admin_shell_enabled', array( self::class, 'apply_kill_switch' ), PHP_INT_MAX );
	}

	/**
	 * Turn the shell's flag on when the visitor is an Automattician.
	 *
	 * @param bool   $enabled Whether the flag is enabled.
	 * @param string $name    Flag name.
	 * @return bool Whether the flag is enabled.
	 */
	public static function default_on_for_a11ns( $enabled, $name ) {
		if ( self::FLAG !== $name || $enabled ) {
			return $enabled;
		}

		return Wpcom_Feature_Flags::is_a11n();
	}

	/**
	 * Force the shell off while the kill switch is on.
	 *
	 * @param bool $enabled Whether the shell is on.
	 * @return bool Whether the shell is on.
	 */
	public static function apply_kill_switch( $enabled ) {
		return self::is_killed() ? false : (bool) $enabled;
	}

	/**
	 * Whether the kill switch is on.
	 *
	 * @return bool
	 */
	public static function is_killed() {
		/**
		 * Filters whether the admin shell is forced off on WordPress.com, ahead of every other setting.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $killed Whether the shell is forced off. Defaults to the `wpcom_admin_shell_kill_switch` network option.
		 */
		return (bool) apply_filters( 'wpcom_admin_shell_kill_switch', wp_validate_boolean( get_site_option( self::KILL_SWITCH_OPTION, false ) ) );
	}
}
