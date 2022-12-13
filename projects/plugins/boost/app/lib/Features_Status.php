<?php
/**
 * Class to check the status of Boost features.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;

/**
 * Class that handles checking the status of Jetpack Boost features.
 */
class Features_Status {

	const GOOD = 'good';
	const BAD  = 'bad';

	public static function get_total_problems() {
		$status = self::get_cloud_css_state_status();
		return $status === self::GOOD ? 0 : 1;
	}

	private static function get_cloud_css_state_status() {
		$is_enabled = '1' === get_option( 'jetpack_boost_status_critical-css' );
		if ( ! $is_enabled ) {
			return self::GOOD;
		}

		$cloud_css = new Critical_CSS_State( 'cloud' );

		return $cloud_css->get_status() === 'error' ? self::BAD : self::GOOD;
	}
}
