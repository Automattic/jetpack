<?php
/**
 * Critical CSS Generate manager.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Collection;

/**
 * Class Recommendations.
 */
class Recommendations {

	/**
	 * Dismissed recommendations.
	 *
	 * @var Collection Dismissed recommendations.
	 */
	protected $dismissed_recommendations;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->dismissed_recommendations = new Collection( 'jb-critical-css-dismissed-recommendations' );
	}

	/**
	 * Initialize hooks.
	 */
	public function attach_hooks() {
		add_filter( 'jetpack_boost_js_constants', array( $this, 'add_boost_js_constants' ) );
		add_action( 'jetpack_boost_uninstall', array( $this, 'reset' ) );
	}

	/**
	 * Add recommendation JS constants.
	 *
	 * @param array $constants JS constants.
	 */
	public function add_boost_js_constants( $constants ) {
		$constants['criticalCssDismissedRecommendations'] = $this->dismissed_recommendations->get();

		return $constants;
	}

	/**
	 * Dismiss recommendation.
	 *
	 * @param string $recommendation_for_provider Recommendation provider name.
	 */
	public function dismiss( $recommendation_for_provider ) {
		$this->dismissed_recommendations->append( $recommendation_for_provider );
	}

	/**
	 * Reset recommendation.
	 */
	public function reset() {
		$this->dismissed_recommendations->delete();
	}
}
