<?php

/**
* Jetpack_Google_Analytics_Options provides a single interface to module options
*
* @author allendav 
*/

/**
* Bail if accessed directly
*/
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jetpack_Google_Analytics_Options {
	public static function get_option( $option_name, $default = false ) {
		$o = get_option( 'jetpack_wga' );
		return isset( $o[ $option_name ] ) ? $o[ $option_name ] : $default;
	}

	public static function get_tracking_code() {
		return self::get_option( 'code', '' );
	}

	public static function has_tracking_code() {
		$code = self::get_tracking_code();
		return ! empty( $code );
	}

	// Options used by both legacy and universal analytics
	public static function anonymize_ip_is_enabled() {
		return self::get_option( 'anonymize_ip' );
	}

	// eCommerce options used by both legacy and universal analytics
	public static function track_purchases_is_enabled() {
		return self::get_option( 'ec_track_purchases' );
	}

	public static function track_add_to_cart_is_enabled() {
		return self::get_option( 'ec_track_add_to_cart' );
	}

	// Enhanced eCommerce options
	public static function enhanced_ecommerce_tracking_is_enabled() {
		return self::get_option( 'enh_ec_tracking' );
	}

	public static function track_remove_from_cart_is_enabled() {
		return self::get_option( 'enh_ec_track_remove_from_cart' );
	}

	public static function track_product_impressions_is_enabled() {
		return self::get_option( 'enh_ec_track_prod_impression' );
	}

	public static function track_product_clicks_is_enabled() {
		return self::get_option( 'enh_ec_track_prod_click' );
	}

	public static function track_product_detail_view_is_enabled() {
		return self::get_option( 'enh_ec_track_prod_detail_view' );
	}

	public static function track_checkout_started_is_enabled() {
		return self::get_option( 'enh_ec_track_checkout_started' );
	}
}

