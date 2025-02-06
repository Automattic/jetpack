<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\Boost_Core\Lib\Transient;

class Premium_Features {

	const CLOUD_CSS             = 'cloud-critical-css';
	const IMAGE_SIZE_ANALYSIS   = 'image-size-analysis';
	const PERFORMANCE_HISTORY   = 'performance-history';
	const IMAGE_CDN_LIAR        = 'image-cdn-liar';
	const IMAGE_CDN_QUALITY     = 'image-cdn-quality';
	const PRIORITY_SUPPORT      = 'support';
	const PAGE_CACHE            = 'page-cache';
	const CORNERSTONE_TEN_PAGES = 'cornerstone-10-pages';

	const TRANSIENT_KEY = 'premium_features';

	public static function has_feature( $feature ) {
		$features = self::get_features();

		if ( is_array( $features ) ) {
			return in_array( $feature, $features, true );
		}
		return false;
	}

	public static function get_features() {
		$available_features = Transient::get( self::TRANSIENT_KEY, false );
		$all_features       = array(
			self::CLOUD_CSS,
			self::IMAGE_SIZE_ANALYSIS,
			self::IMAGE_CDN_LIAR,
			self::IMAGE_CDN_QUALITY,
			self::PERFORMANCE_HISTORY,
			self::PRIORITY_SUPPORT,
			self::CORNERSTONE_TEN_PAGES,
		);

		if ( ! is_array( $available_features ) ) {
			$available_features = Boost_API::get( 'features' );
			if ( ! is_array( $available_features ) ) {
				$available_features = array();
			}
			Transient::set( self::TRANSIENT_KEY, $available_features, 3 * DAY_IN_SECONDS );
		}

		$features = array();
		// Prepare a list of features after applying jetpack_boost_has_feature_* filter for each feature.
		foreach ( $all_features as $feature ) {
			/**
			 * Filter the availability of a feature
			 *
			 * @param bool $has_feature if the feature is available
			 *
			 * @since   1.0.0
			 */
			if ( apply_filters( "jetpack_boost_has_feature_{$feature}", in_array( $feature, $available_features, true ) ) ) {
				$features[] = $feature;
			}
		}

		return $features;
	}

	public static function has_any() {
		return count( self::get_features() ) > 0;
	}

	public static function clear_cache() {
		Transient::delete( self::TRANSIENT_KEY );
	}
}
