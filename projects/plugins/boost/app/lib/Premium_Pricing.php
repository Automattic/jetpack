<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\My_Jetpack\Wpcom_Products;

class Premium_Pricing {
	const PRODUCT_SLUG_BASE = 'jetpack_boost';

	public static function init() {
		add_filter( 'jetpack_boost_js_constants', array( static::class, 'add_js_constants' ) );
	}

	public static function add_js_constants( $constants ) {
		$constants['pricing'] = array();
		$yearly_pricing_slug  = self::PRODUCT_SLUG_BASE . '_yearly';
		$yearly_pricing       = Wpcom_Products::get_product_pricing( $yearly_pricing_slug );

		if ( empty( $yearly_pricing ) ) {
			Analytics::record_user_event( 'upgrade_price_missing', array( 'error_message' => 'Missing pricing information on benefits interstitial page.' ) );
			return $constants;
		}

		$constants['pricing']['yearly'] = array(
			'priceBefore'  => $yearly_pricing['full_price'],
			'priceAfter'   => $yearly_pricing['discount_price'],
			'currencyCode' => $yearly_pricing['currency_code'],
		);
		return $constants;
	}
}
