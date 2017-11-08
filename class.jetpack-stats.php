<?php

class Jetpack_Stats {
	static private function woocommerce_loaded() {
		echo "<pre>";
//		print_r( WC_Data::get_data_store() );
//		print_r( WC_Cart::get_cart_from_session() );
		print_r( WC()->cart->cart_contents );
//		global $wp_query;
//		print_r($wp_query);
		echo "</pre>";
	}
	static function init() {
		if ( is_admin() ) {
			return;
		}
		if ( ! Jetpack::is_active() ) {
			return;
		}
		if ( ! in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ) {
			return;
		}
		Jetpack_Stats::woocommerce_loaded();
//		add_action( ‘woocommerce_init’, array( $this, ‘woocommerce_loaded’ ) );
	}
}

add_action( 'init', array( 'Jetpack_Stats', 'init' ) );
