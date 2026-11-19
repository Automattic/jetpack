<?php
/**
 * PayPal Payment Buttons V2 rollout on WordPress.com: a percent of Simple sites, Atomic at 100, behind a kill switch.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Constants;

/**
 * Turns the `paypal-payments-api-managed-buttons` flag on for a percent of sites, and lets WordPress.com force it off.
 *
 * Precedence, highest first: kill switch, the site's Tools > Feature Flags override, the rollout default.
 * Temporary: remove once PERCENT is 100, the flag defaults on everywhere, and the kill switch is retired.
 */
class Wpcom_PayPal_Buttons_Rollout {

	/**
	 * The flag PayPal_Payment_Buttons registers in the paypal-payments package, which this package does not require.
	 */
	const FLAG = 'paypal-payments-api-managed-buttons';

	/**
	 * Network option that, when truthy, turns V2 off on every Simple site. Atomic reads its own options, so use KILLED there.
	 */
	const KILL_SWITCH_OPTION = 'wpcom_paypal_buttons_kill_switch';

	/**
	 * Percent of Simple sites that get V2, 0-100. Atomic gets it at 100. Only ever raise it.
	 */
	const PERCENT = 0;

	/**
	 * True turns V2 off on Simple and Atomic.
	 */
	const KILLED = false;

	/**
	 * Register the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		// Before Wpcom_Feature_Flags::filter_enabled() at 10, so a per-site override beats this default.
		add_filter( 'jetpack_feature_flag_enabled', array( self::class, 'rollout_default' ), 5, 2 );
		add_filter( 'jetpack_feature_flag_enabled_' . self::FLAG, array( self::class, 'apply_kill_switch' ), PHP_INT_MAX );
	}

	/**
	 * Turn the flag on for sites in the rollout and off for the rest.
	 *
	 * Ignores the registered default, so flipping it in the package leaves WordPress.com on the rollout.
	 *
	 * @param bool   $enabled Whether the flag is enabled.
	 * @param string $name    Flag name.
	 * @return bool Whether the flag is enabled.
	 */
	public static function rollout_default( $enabled, $name ) {
		if ( self::FLAG !== $name ) {
			return $enabled;
		}

		if ( Constants::is_true( 'IS_ATOMIC' ) ) {
			return self::percent() >= 100;
		}

		return self::blog_bucket( get_current_blog_id() ) < self::percent();
	}

	/**
	 * Force V2 off while the kill switch is on.
	 *
	 * @param bool $enabled Whether the flag is enabled.
	 * @return bool Whether the flag is enabled.
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
		 * Filters whether PayPal Payment Buttons V2 is forced off on WordPress.com, ahead of every other setting.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $killed Whether V2 is forced off. Defaults to KILLED or the `wpcom_paypal_buttons_kill_switch` network option.
		 */
		return (bool) apply_filters( 'wpcom_paypal_buttons_kill_switch', static::KILLED || wp_validate_boolean( get_site_option( self::KILL_SWITCH_OPTION, false ) ) );
	}

	/**
	 * The rollout percent.
	 *
	 * @return int
	 */
	private static function percent() {
		/**
		 * Filters the PayPal Payment Buttons V2 rollout percent, for tests. Ramp by raising PERCENT.
		 *
		 * @since $$next-version$$
		 *
		 * @param int $percent 0-100. Defaults to PERCENT.
		 */
		return (int) apply_filters( 'wpcom_paypal_buttons_rollout_percent', self::PERCENT );
	}

	/**
	 * The site's bucket, 0-99. Salted with the flag, so each rollout turns on its own set of sites.
	 *
	 * `abs()` after the modulo: 32-bit PHP returns a signed `crc32()`, and `abs( PHP_INT_MIN )` overflows.
	 *
	 * @param int $blog_id Blog ID.
	 * @return int
	 */
	private static function blog_bucket( $blog_id ) {
		return abs( crc32( self::FLAG . ':' . (int) $blog_id ) % 100 );
	}
}
