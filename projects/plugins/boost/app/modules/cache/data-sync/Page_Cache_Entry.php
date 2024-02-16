<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Boost_Cache_Settings;

class Page_Cache_Entry implements Entry_Can_Get, Entry_Can_Set {
	public function get( $_fallback = false ) {
		$cache_settings = Boost_Cache_Settings::get_instance();

		$settings = array(
			'excludes' => is_array( $cache_settings->get( 'excludes' ) ) ? $cache_settings->get( 'excludes' ) : array(),
			'logging'  => $cache_settings->get( 'logging' ),
		);

		return $settings;
	}

	public function set( $value ) {
		$cache_settings = Boost_Cache_Settings::get_instance();

		$cache_settings->set( $value );
	}
}
