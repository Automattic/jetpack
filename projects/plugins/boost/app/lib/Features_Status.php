<?php
/**
 * Class to check the status of Boost features.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;

/**
 * Class that handles checking the status of Jetpack Boost features.
 */
class Features_Status {

	public static function get_total_problems() {
		$has_problem = self::has_cloud_css_problem();
		return $has_problem ? 1 : 0;
	}

	private static function has_cloud_css_problem() {
		$status = new Status( Critical_CSS::get_slug() );
		if ( ! $status->is_enabled() ) {
			return false;
		}

		$cloud_css = new Critical_CSS_State( 'cloud' );

		return $cloud_css->get_status() === 'error';
	}
}
