<?php

namespace Automattic\Jetpack_Boost\Lib;

class Premium_Features {

	const CLOUD_CSS        = 'cloud-critical-css';
	const PRIORITY_SUPPORT = 'support';

	const TRANSIENT_KEY = 'premium_features';

	public static function has_feature( $feature ) {
		$features = self::get_features();
		return in_array( $feature, $features, true );
	}

	public static function get_features() {
		$features = Transient::get( self::TRANSIENT_KEY, null );

		if ( ! $features ) {
			$features = Boost_API::get( 'features' );
			Transient::set( self::TRANSIENT_KEY, $features, 3 * DAY_IN_SECONDS );
		}

		return $features;
	}
}
