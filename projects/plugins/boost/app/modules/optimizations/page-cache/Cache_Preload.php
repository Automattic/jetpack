<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
class Cache_Preload implements Pluggable, Is_Always_On {

	public function setup() {
		add_action( 'update_option_jetpack_boost_ds_cornerstone_pages_list', array( $this, 'schedule_preload' ) );
		add_action( 'jetpack_boost_preload_cornerstone_pages', array( $this, 'preload_cornerstone_pages' ) );
	}

	public static function get_slug() {
		return 'cache_preload';
	}

	public static function is_available() {
		return true;
	}

	public function schedule_preload() {
		if ( ! wp_next_scheduled( 'jetpack_boost_preload_cornerstone_pages' ) ) {
			wp_schedule_single_event( time(), 'jetpack_boost_preload_cornerstone_pages' );
		}
	}

	public function preload_cornerstone_pages() {
		$pages = Cornerstone_Utils::get_list();

		foreach ( $pages as $page ) {
			$this->preload_page( $page );
		}
	}

	public function preload_page( $page ) {
		$url = home_url( $page );

		wp_remote_get( $url );
	}
}
