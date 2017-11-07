<?php

class Jetpack_Stats {
	static function init() {
		if ( is_admin() ) {
			return;
		}
		if ( ! Jetpack::is_active() ) {
			return;
		}
		$plugins = get_plugins();
		$is_store = isset( $plugins[ 'woocommerce/woocommerce.php' ] );
		if ( ! $is_store ) {
			return;
		}
//		print_r( WC_Data::get_data_store() );
//		print_r( WC_Cart::get_cart_from_session() );
		print_r( WC() );
	}
}

add_action( 'init', array( 'Jetpack_Stats', 'init' ) );
