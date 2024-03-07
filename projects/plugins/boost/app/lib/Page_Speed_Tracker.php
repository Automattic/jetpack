<?php

namespace Automattic\Jetpack_Boost\Lib;

class Page_Speed_Change_Tracker {

	public static function init() {
		add_action( 'jetpack_boost_speed_score_response_success', array( __CLASS__, 'response_received' ) );
	}

	public static function response_received( $response ) {
		// @todo - if prompt is dismissed, don't track anything.

		$change = self::get_score_change( $response );

		// Don't track small changes between scores.
		if ( absint( $change ) <= 5 ) {
			return;
		}

		$tracker = jetpack_boost_ds_get( 'speed_scores_change' );

		if ( $change > 0 ) {
			++$tracker;
		} else {
			--$tracker;
		}

		jetpack_boost_ds_set( 'speed_scores_change', $tracker );
	}

	public static function get_score_change( $response ) {
		if ( empty( $response['scores'] ) ) {
			return 0;
		}

		if ( empty( $response['scores']['current'] ) || empty( $response['scores']['noBoost'] ) ) {
			return 0;
		}

		$current  = $response['scores']['current']['mobile'] + $response['scores']['current']['desktop'];
		$no_boost = $response['scores']['noBoost']['mobile'] + $response['scores']['noBoost']['desktop'];

		return $current - $no_boost;
	}
}
