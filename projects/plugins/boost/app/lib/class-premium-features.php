<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\Boost_Core\Lib\Transient;
use Automattic\Jetpack_Boost\Data_Sync\Modules_State_Entry;
use Automattic\Jetpack_Boost\Modules\Module;
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
	 * Record a verified plan baseline when the site connects, without activating Cloud CSS.
	 *
	 * @since $$next-version$$
	 */
	public static function record_cloud_css_baseline() {
		if ( false !== get_option( self::CLOUD_CSS_BASELINE_OPTION ) ) {
			return;
		}
		self::clear_cache();
		$verified = null;
		$features = self::get_features( $verified );
		if ( $verified ) {
			self::remember_cloud_css_baseline( $features );
		}
	}

	private static function remember_cloud_css_baseline( $features ) {
		// A stored Cloud CSS choice survives a plan that lapsed before the first observation.
		$has_cloud_css_choice = null !== get_option( Status::get_option_name( Cloud_CSS::get_slug() ), null );
		$baseline             = $has_cloud_css_choice || in_array( self::CLOUD_CSS, $features, true ) ? 'premium' : 'free';
		add_option( self::CLOUD_CSS_BASELINE_OPTION, $baseline, '', false );
	}

	/**
	 * Enable Cloud CSS once when an observed free site gains the feature.
	 *
	 * @since $$next-version$$
	 */
	public static function enable_cloud_css_after_upgrade() {
		$verified = null;
		$features = self::get_features( $verified );
		if ( ! $verified ) {
			return;
		}
		$has_cloud_css = in_array( self::CLOUD_CSS, $features, true );

		self::remember_cloud_css_baseline( $features );
		if ( ! $has_cloud_css || 'free' !== get_option( self::CLOUD_CSS_BASELINE_OPTION ) ) {
			return;
		}
		if ( ! ( new Module( new Cloud_CSS() ) )->is_available() ) {
			return;
		}

		// Claim the upgrade before activation can re-enter feature checks or another request can run it.
		if ( ! add_option( self::CLOUD_CSS_ACTIVATED_OPTION, true, '', false ) ) {
			return;
		}

		$entry = new Modules_State_Entry( array( Cloud_CSS::class ) );
		$entry->set( array( Cloud_CSS::get_slug() => array( 'active' => true ) ) );
		jetpack_boost_ds_set( 'cloud_css_upgrade_notice', true );
	}

	public static function has_feature( $feature ) {
		$features = self::get_features();

		if ( is_array( $features ) ) {
			return in_array( $feature, $features, true );
		}
		return false;
	}

	/**
	 * Get features and report whether a valid response was fetched in this call.
	 *
	 * @param bool|null $verified Receives whether a valid unfiltered response was fetched in this call.
	 * @return string[]
	 */
	public static function get_features( &$verified = null ) {
		$available_features = Transient::get( self::TRANSIENT_KEY, false );
		$verified           = false;
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
			$verified           = is_array( $available_features );
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
