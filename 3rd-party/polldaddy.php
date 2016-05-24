<?php

class Jetpack_Sync {
	static function sync_options() {
		_deprecated_function( __METHOD__, '4.1.0', 'jetpack_whitelist_options filter' );
		$options = func_get_args();
		// first argument is the file but we don't care about that any more.
		$file = array_shift( $options );
		if ( is_array( $options ) ) {
			$client_sync = Jetpack_Sync_Client::getInstance();
			$client_sync->set_options_whitelist( array_merge( $options, $client_sync->get_options_whitelist() ) );
		}
	}
}
