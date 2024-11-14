<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\My_Jetpack\Products;

class My_Jetpack {
	public static function get_product() {
		$product = Products::get_product_class( 'boost' );
		if ( ! $product ) {
			return array();
		}

		return array(
			'tiers'            => $product::get_tiers(),
			'features_by_tier' => $product::get_features_by_tier(),
		);
	}
}
