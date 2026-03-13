<?php
/**
 * Device detection for Jetpack.
 *
 *  Since WPSC doesn't use an autoloader or composer, this is a simplified version of the package
 *  as of November 11, 2025.
 *
 * @package automattic/jetpack-device-detection
 */

namespace Automattic\WPSC;

require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/class-user-agent-info.php';

use Automattic\WPSC\Device_Detection\User_Agent_Info;
use function Automattic\WPSC\Device_Detection\wp_unslash;

/**
 * Class Automattic\WPSC\Device_Detection
 *
 * Determine if the current User Agent matches the passed $kind.
 *
 * Note: str_contains() and other PHP8+ functions that have a polyfill in core are not used here,
 * as wp-includes/compat.php may not be loaded yet.
 */
class Device_Detection {

	/**
	 * Detects phone devices.
	 *
	 * @return bool
	 */
	public static function is_phone() {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			return false;
		}

		$ua_info = new User_Agent_Info( $_SERVER['HTTP_USER_AGENT'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Handled in User_Agent_Info

		$agent = strtolower( filter_var( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) );
		if ( strpos( $agent, 'ipad' ) ) {
			return false;
		}

		// Remove Samsung Galaxy tablets (SCH-I800) from being mobile devices.
		if ( strpos( $agent, 'sch-i800' ) ) {
			return false;
		}

		if ( $ua_info->is_android_tablet() && false === $ua_info->is_kindle_touch() ) {
			return false;
		}

		if ( $ua_info->is_blackberry_tablet() ) {
			return false;
		}

		// checks for iPhoneTier devices & RichCSS devices.
		if ( $ua_info->isTierIphone() || $ua_info->isTierRichCSS() ) {
			return true;
		}

		$dumb_agents = $ua_info->dumb_agents;

		foreach ( $dumb_agents as $dumb_agent ) {
			if ( false !== strpos( $agent, $dumb_agent ) ) {
				return true;
			}
		}

		if ( isset( $_SERVER['HTTP_X_WAP_PROFILE'] ) ) {
			return true;
		} elseif ( isset( $_SERVER['HTTP_ACCEPT'] ) && ( preg_match( '/wap\.|\.wap/i', $_SERVER['HTTP_ACCEPT'] ) || false !== strpos( strtolower( $_SERVER['HTTP_ACCEPT'] ), 'application/vnd.wap.xhtml+xml' ) ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- This is doing the validating.
			return true;
		}

		return false;
	}
}
