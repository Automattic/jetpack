<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Sub_Feature;
use Automattic\Jetpack_Boost\Modules\Image_Guide\Image_Guide;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN\Image_CDN;
use Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN\Liar;
use Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN\Quality_Settings;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\Lcp;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_Common;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_JS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Cache_Preload;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Render_Blocking_JS\Render_Blocking_JS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules\Speculation_Rules;
use Automattic\Jetpack_Boost\Modules\Performance_History\Performance_History;

class Features_Index {

	/**
	 * @var class-string<Feature>[] - Classes that handle all Jetpack Boost features.
	 */
	const FEATURES = array(
		Critical_CSS::class,
		Cloud_CSS::class,
		Lcp::class,
		Minify_JS::class,
		Minify_CSS::class,
		Render_Blocking_JS::class,
		Image_Guide::class,
		Image_CDN::class,
		Performance_History::class,
		Page_Cache::class,
		Speculation_Rules::class,
	);

	/**
	 * @var class-string<Sub_Feature>[] - Classes that handle all Jetpack Boost subfeatures.
	 */
	const SUB_FEATURES = array(
		Minify_Common::class,
		Liar::class,
		Quality_Settings::class,
		Cache_Preload::class,
	);

	/**
	 * Get all features and subfeatures.
	 *
	 * @return class-string<Feature>[]
	 */
	public static function get_all_features() {
		return array_merge( self::FEATURES, self::SUB_FEATURES );
	}

	/**
	 * Get the subfeatures of a feature.
	 *
	 * @param Feature $feature The feature to get the subfeatures of.
	 * @return class-string<Sub_Feature>[] The subfeatures of the feature.
	 */
	public static function get_sub_features_of( Feature $feature ) {
		/**
		 * @var class-string<Sub_Feature>[]
		 */
		$subfeatures   = array();
		$feature_class = get_class( $feature );
		foreach ( self::SUB_FEATURES as $subfeature ) {
			if ( in_array( $feature_class, $subfeature::get_parent_features(), true ) ) {
				$subfeatures[] = $subfeature;
			}
		}
		return $subfeatures;
	}
}
