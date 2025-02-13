<?php
namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;

class Minify_Notice_Entry implements Entry_Can_Get, Entry_Can_Set, Lazy_Entry {
	public function get( $_fallback = false ) {
		return (bool) get_site_option( 'jetpack_boost_static_minification' );
	}

	public function set( $value ) {
		return update_site_option( 'jetpack_boost_static_minification', $value );
	}

	public function delete() {
		return delete_site_option( 'jetpack_boost_static_minification' );
	}
}
