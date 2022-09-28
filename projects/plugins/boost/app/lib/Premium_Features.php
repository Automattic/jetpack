<?php

namespace Automattic\Jetpack_Boost\Lib;

class Premium_Features {

	const CLOUD_CSS        = 'cloud-critical-css';
	const PRIORITY_SUPPORT = 'support';

	const TRANSIENT_KEY = 'premium_features';

	public static function has_feature( $feature ) {
		$features = self::get_features();
		$result   = in_array( $feature, $features, true );

		return apply_filters( "jetpack_boost_has_feature_$feature", $result );
	}

	public static function get_features() {
		$features = Transient::get( self::TRANSIENT_KEY, false );

		if ( ! is_array( $features ) ) {
			$features = Boost_API::get( 'features' );
			if ( ! is_array( $features ) ) {
				$features = array();
			}
			Transient::set( self::TRANSIENT_KEY, $features, 3 * DAY_IN_SECONDS );
		}

		return $features;
	}

	public static function clear_cache() {
		Transient::delete( self::TRANSIENT_KEY );
	}
}
