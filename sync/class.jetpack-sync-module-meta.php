<?php

class Jetpack_Sync_Module_Meta extends Jetpack_Sync_Module {
	private $meta_types = array( 'post', 'comment' );

	public function name() {
		return 'meta';
	}

	/**
	 * This implementation of get_objects_by_id() is a bit hacky since we're not passing in an array of meta IDs,
	 * but instead an array of post or comment IDs for which to retrieve meta for. On top of that,
	 * we also pass in an associative array where we expect there to be 'meta_key' and 'ids' keys present.
	 *
	 * This seemed to be required since if we have missing meta on WP.com and need to fetch it, we don't know what
	 * the meta key is, but we do know that we have missing meta for a given post or comment.
	 *
	 * @param string $object_type The type of object for which we retrieve meta. Either 'post' or 'comment'
	 * @param array $config Must include 'meta_key' and 'ids' keys
	 *
	 * @return array
	 */
	public function get_objects_by_id( $object_type, $config ) {
		global $wpdb;
		if ( ! in_array( $object_type, $this->meta_types ) ) {
			return array();
		}

		if ( ! isset( $config['meta_key'] ) || ! isset( $config['ids'] ) || ! is_array( $config['ids'] ) ) {
			return array();
		}

		$meta_key = $config['meta_key'];
		$ids = $config['ids'];

		if ( ! $this->is_meta_key_allowed( $meta_key ) ) {
			return array();
		}

		if ( 'post' == $object_type ) {
			$table = $wpdb->postmeta;
			$object_id_column = 'post_id';
		} else {
			$table = $wpdb->commentmeta;
			$object_id_column = 'comment_id';
		}

		// Sanitize so that the array only has integer values
		$ids_string = implode( ', ', array_map( 'intval', $ids ) );
		$metas = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE {$object_id_column} IN ( {$ids_string} ) AND meta_key = %s",
				$meta_key
			)
		);

		$meta_objects = array();
		foreach( (array) $metas as $meta_object ) {
			$meta_object = (array) $meta_object;
			$meta_objects[ $meta_object[ $object_id_column ] ] = array(
				'meta_type' => $object_type,
				'meta_id' => $meta_object['meta_id'],
				'meta_key' => $meta_key,
				'meta_value' => $meta_object['meta_value'],
				'object_id' => $meta_object[ $object_id_column ],
			);
		}

		return $meta_objects;
	}

	public function init_listeners( $callable ) {
		foreach ( $this->meta_types as $meta_type ) {
			add_action( "added_{$meta_type}_meta", $callable, 10, 4 );
			add_action( "updated_{$meta_type}_meta", $callable, 10, 4 );
			add_action( "deleted_{$meta_type}_meta", $callable, 10, 4 );

			$whitelist_handler = array( $this, 'filter_meta_' . $meta_type );
			add_filter( "jetpack_sync_before_enqueue_added_{$meta_type}_meta", $whitelist_handler );
			add_filter( "jetpack_sync_before_enqueue_updated_{$meta_type}_meta", $whitelist_handler );
			add_filter( "jetpack_sync_before_enqueue_deleted_{$meta_type}_meta", $whitelist_handler );
		}
	}
	// POST Meta
	function get_post_meta_whitelist() {
		return Jetpack_Sync_Settings::get_setting( 'post_meta_whitelist' );
	}

	function is_whitelisted_post_meta( $meta_key ) {
		// _wpas_skip_ is used by publicize
		return in_array( $meta_key, $this->get_post_meta_whitelist() ) || wp_startswith( $meta_key, '_wpas_skip_' );
	}

	// Comment Meta
	function get_comment_meta_whitelist() {
		return Jetpack_Sync_Settings::get_setting( 'comment_meta_whitelist' );
	}

	function is_whitelisted_comment_meta( $meta_key ) {
		return in_array( $meta_key, $this->get_comment_meta_whitelist() );
	}

	function is_post_type_allowed( $post_id ) {
		$post = get_post( $post_id );
		return ! in_array( $post->post_type, Jetpack_Sync_Settings::get_setting( 'post_types_blacklist' ) );
	}

	function filter_meta_post( $args ) {
		if ( ! $this->is_whitelisted_post_meta( $args[2] ) ) {
			return false;
		}
		return ( $this->is_post_type_allowed( $args[1] ) ? $args : false );
	}

	function filter_meta_comment( $args ) {
		return ( $this->is_whitelisted_comment_meta( $args[2] ) ? $args : false );
	}
	
}
