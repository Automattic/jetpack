<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;

/**
 * Class Boost_Health
 *
 * Represents the health of the Jetpack Boost plugin.
 */
class Boost_Health {

	/**
	 * @var array List of issues affecting the health of the plugin.
	 */
	private $issues = array();

	/**
	 * Boost_Health constructor.
	 *
	 * Initializes the Boost_Health object and checks for any health issues.
	 */
	public function __construct() {
		if ( self::critical_css_needs_regeneration() ) {
			$this->issues[] = __( 'Outdated Critical CSS', 'jetpack-boost' );
		}

		if ( self::critical_css_has_errors() ) {
			$this->issues[] = __( 'Failed to generate Critical CSS', 'jetpack-boost' );
		}
	}

	/**
	 * Get the total number of issues affecting the health of the plugin.
	 *
	 * @return int Total number of issues.
	 */
	public function get_total_issues() {
		return count( $this->issues );
	}

	/**
	 * Get all the issues affecting the health of the plugin.
	 *
	 * @return array List of issues.
	 */
	public function get_all_issues() {
		return $this->issues;
	}

	/**
	 * Check if Critical CSS needs regeneration.
	 *
	 * @return bool True if regeneration is needed, false otherwise.
	 */
	public static function critical_css_needs_regeneration() {
		if ( Cloud_CSS::is_available() ) {
			return false;
		}

		$suggest_regenerate = jetpack_boost_ds_get( 'critical_css_suggest_regenerate' );

		return in_array( $suggest_regenerate, Environment_Change_Detector::get_available_env_change_statuses(), true );
	}

	/**
	 * Check if Critical CSS generation has errors.
	 *
	 * @return bool True if errors are present, false otherwise.
	 */
	public static function critical_css_has_errors() {
		return ( new Critical_CSS_State() )->has_errors();
	}
}
