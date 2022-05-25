<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\My_Jetpack\Wpcom_Products;

class Premium_Pricing {
	const PRODUCT_SLUG_BASE = 'jetpack_boost';

	public static function init() {
		add_filter( 'jetpack_boost_js_constants', array( static::class, 'add_js_constants' ) );
	}

	public static function add_js_constants( $constants ) {
		$yearly_pricing_slug  = self::PRODUCT_SLUG_BASE . '_yearly';
		$constants['pricing'] = array(
			'yearly' => Wpcom_Products::get_product_pricing( $yearly_pricing_slug ),
		);

		return $constants;
	}
}
