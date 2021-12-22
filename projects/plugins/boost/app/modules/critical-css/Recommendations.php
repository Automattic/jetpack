<?php
namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Options;


class Recommendations {

	protected $dismissed_recommendations;

	public function __construct() {
		$this->dismissed_recommendations = new Options( 'jb-critical-css-dismissed-recommendations' );
	}

	public function attach_hooks() {
		add_filter( 'jetpack_boost_js_constants', array( $this, 'add_boost_js_constants' ) );
		add_action( 'jetpack_boost_uninstall', array( $this, 'reset' ) );
	}

	public function add_boost_js_constants( $constants ) {
		$constants['criticalCssDismissedRecommendations'] = $this->dismissed_recommendations->get();

		return $constants;
	}

	public function dismiss( $recommendation_for_provider ) {
		$this->dismissed_recommendations->append( $recommendation_for_provider );
	}

	public function reset() {
		$this->dismissed_recommendations->delete();
	}

}
