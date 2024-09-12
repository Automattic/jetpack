<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Status;

class Premium_Pricing {
	const PRODUCT_SLUG_BASE = 'jetpack_boost';

	/**
	 * Get an object containing the yearly pricing information for Jetpack Boost.
	 *
	 * Used by Jetpack_Boost js constants and data sync.
	 */
	public static function get_yearly_pricing() {
		$yearly_pricing_slug = self::PRODUCT_SLUG_BASE . '_yearly';
		$yearly_pricing      = Wpcom_Products::get_product_pricing( $yearly_pricing_slug );

		if ( empty( $yearly_pricing ) ) {
			// In offline mode, we don't have access to the pricing data and it's not an error.
			if ( ! ( new Status() )->is_offline_mode() ) {
				Analytics::record_user_event( 'upgrade_price_missing', array( 'error_message' => 'Missing pricing information on benefits interstitial page.' ) );
			}
			return null;
		}

		return array(
			'priceBefore'         => $yearly_pricing['full_price'],
			'priceAfter'          => $yearly_pricing['discount_price'],
			'currencyCode'        => $yearly_pricing['currency_code'],
			'isIntroductoryOffer' => $yearly_pricing['is_introductory_offer'] === true,
		);
	}
}
