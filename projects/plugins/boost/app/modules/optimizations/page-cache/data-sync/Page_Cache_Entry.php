<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Lib\Excludes_URLs_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;

class Page_Cache_Entry implements Entry_Can_Get, Entry_Can_Set {
	public function get( $_fallback = false ) {
		$cache_settings = Boost_Cache_Settings::get_instance();

		$settings = array(
			'bypass_patterns' => $cache_settings->get_bypass_patterns(),
			'logging'         => $cache_settings->get_logging(),
		);

		return $settings;
	}

	public function set( $value ) {
		$cache_settings = Boost_Cache_Settings::get_instance();

		$value['bypass_patterns'] = Excludes_URLs_Utils::sanitize_value( $value['bypass_patterns'] );

		$cache_settings->set( $value );
	}
}
