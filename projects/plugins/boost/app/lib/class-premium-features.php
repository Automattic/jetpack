<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\Boost_Core\Lib\Transient;
use Automattic\Jetpack_Boost\Data_Sync\Modules_State_Entry;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;

class Premium_Features {

	const CLOUD_CSS             = 'cloud-critical-css';
	const PERFORMANCE_HISTORY   = 'performance-history';
	const IMAGE_CDN_LIAR        = 'image-cdn-liar';
	const IMAGE_CDN_QUALITY     = 'image-cdn-quality';
	const PRIORITY_SUPPORT      = 'support';
	const PAGE_CACHE            = 'page-cache';
	const CORNERSTONE_TEN_PAGES = 'cornerstone-10-pages';

	const TRANSIENT_KEY              = 'premium_features';
	const CLOUD_CSS_BASELINE_OPTION  = 'jetpack_boost_cloud_css_plan_baseline';
	const CLOUD_CSS_ACTIVATED_OPTION = 'jetpack_boost_cloud_css_plan_activated';
	const CLOUD_CSS_NOTICE_OPTION    = 'jetpack_boost_ds_cloud_css_upgrade_notice';

	/**
	 * Enable Cloud CSS once when an observed free site gains the feature.
	 *
	 * @since $$next-version$$
	 */
	public static function enable_cloud_css_after_upgrade() {
		if ( false === get_option( self::CLOUD_CSS_BASELINE_OPTION ) ) {
			// Cached empty features may represent an API failure rather than a free plan.
			$available_features = Boost_API::get( 'features' );
			if ( ! is_array( $available_features ) ) {
				return;
			}
			Transient::set( self::TRANSIENT_KEY, $available_features, 3 * DAY_IN_SECONDS );
		}

		$has_cloud_css = self::has_feature( self::CLOUD_CSS );

		// The first observation is a baseline, so existing premium sites keep their setting.
		add_option( self::CLOUD_CSS_BASELINE_OPTION, $has_cloud_css ? 'premium' : 'free', '', false );
		if ( ! $has_cloud_css || 'free' !== get_option( self::CLOUD_CSS_BASELINE_OPTION ) ) {
			return;
		}

		// Claim the upgrade before activation can re-enter feature checks or another request can run it.
		if ( ! add_option( self::CLOUD_CSS_ACTIVATED_OPTION, true, '', false ) ) {
			return;
		}

		$entry = new Modules_State_Entry( array( Cloud_CSS::class ) );
		$entry->set( array( Cloud_CSS::get_slug() => array( 'active' => true ) ) );
		update_option( self::CLOUD_CSS_NOTICE_OPTION, true, false );
	}

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
