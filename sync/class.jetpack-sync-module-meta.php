<?php

class Jetpack_Sync_Module_Meta extends Jetpack_Sync_Module {
	private $meta_types = array( 'post', 'comment' );

	public function name() {
		return "meta";
	}

	public function init_listeners( $callable ) {
		$whitelist_handler = array( $this, 'filter_meta' );

		foreach ( $this->meta_types as $meta_type ) {
			add_action( "added_{$meta_type}_meta", $callable, 10, 4 );
			add_action( "updated_{$meta_type}_meta", $callable, 10, 4 );
			add_action( "deleted_{$meta_type}_meta", $callable, 10, 4 );

			add_filter( "jetpack_sync_before_enqueue_added_{$meta_type}_meta", $whitelist_handler );
			add_filter( "jetpack_sync_before_enqueue_updated_{$meta_type}_meta", $whitelist_handler );
			add_filter( "jetpack_sync_before_enqueue_deleted_{$meta_type}_meta", $whitelist_handler );
		}
	}

	function filter_meta( $args ) {
		if ( $args[2][0] === '_' && ! in_array( $args[2], Jetpack_Sync_Defaults::$default_whitelist_meta_keys ) ) {
			return false;
		}

		return $args;
	}
}
