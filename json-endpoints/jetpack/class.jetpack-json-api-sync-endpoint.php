<?php

// POST /sites/%s/sync
class Jetpack_JSON_API_Sync_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'manage_options';

	protected function validate_call( $_blog_id, $capability, $check_manage_active = true ) {
		return parent::validate_call( $_blog_id, $capability, false );
	}

	protected function result() {
		$args = $this->input();
		$modules = null;

		// convert list of modules in comma-delimited format into an array
		// of "$modulename => true"
		if ( isset( $args['modules'] ) && ! empty( $args['modules'] ) ) {
			$modules = array_map( '__return_true', array_flip( array_map( 'trim', explode( ',', $args['modules'] ) ) ) );
		}

		foreach ( array( 'posts', 'comments', 'users' ) as $module_name ) {
			if ( 'users' === $module_name && isset( $args[ $module_name ] ) && 'initial' === $args[ $module_name ] ) {
				$modules[ 'users' ] = 'initial';
			} elseif ( isset( $args[ $module_name ] ) ) {
				$ids = explode( ',', $args[ $module_name ] );
				if ( count( $ids ) > 0 ) {
					$modules[ $module_name ] = $ids;
				}
			}
		}

		if ( empty( $modules ) ) {
			$modules = null;
		}
		return array( 'scheduled' => Jetpack_Sync_Actions::do_full_sync( $modules ) );
	}

	protected function validate_queue( $query ) {
		if ( ! isset( $query ) ) {
			return new WP_Error( 'invalid_queue', 'Queue name is required', 400 );
		}

		if ( ! in_array( $query, array( 'sync', 'full_sync' ) ) ) {
			return new WP_Error( 'invalid_queue', 'Queue name should be sync or full_sync', 400 );
		}
		return $query;
	}
}

// GET /sites/%s/sync/status
class Jetpack_JSON_API_Sync_Status_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$args   = $this->query_args();
		$fields = isset( $args['fields'] ) ? $args['fields'] : array();
		return Jetpack_Sync_Actions::get_sync_status( $fields );
	}
}

// GET /sites/%s/data-check
class Jetpack_JSON_API_Sync_Check_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-wp-replicastore.php';
		$store = new Jetpack_Sync_WP_Replicastore();
		return $store->checksum_all();
	}
}

// GET /sites/%s/data-histogram
class Jetpack_JSON_API_Sync_Histogram_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$args = $this->query_args();

		if ( isset( $args['columns'] ) ) {
			$columns = array_map( 'trim', explode( ',', $args['columns'] ) );
		} else {
			$columns = null; // go with defaults
		}

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-wp-replicastore.php';
		$store = new Jetpack_Sync_WP_Replicastore();

		if ( ! isset( $args['strip_non_ascii'] ) ) {
			$args['strip_non_ascii'] = true;
		}
		$histogram = $store->checksum_histogram( $args['object_type'], $args['buckets'], $args['start_id'], $args['end_id'], $columns, $args['strip_non_ascii'], $args['shared_salt'] );

		return array( 'histogram' => $histogram, 'type' => $store->get_checksum_type() );
	}
}

// POST /sites/%s/sync/settings
class Jetpack_JSON_API_Sync_Modify_Settings_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$args = $this->input();

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-settings.php';

		$sync_settings = Jetpack_Sync_Settings::get_settings();

		foreach ( $args as $key => $value ) {
			if ( $value !== false ) {
				if ( is_numeric( $value ) ) {
					$value = (int) $value;
				}

				// special case for sending empty arrays - a string with value 'empty'
				if ( $value === 'empty' ) {
					$value = array();
				}

				$sync_settings[ $key ] = $value;
			}
		}

		Jetpack_Sync_Settings::update_settings( $sync_settings );

		// re-fetch so we see what's really being stored
		return Jetpack_Sync_Settings::get_settings();
	}
}

// GET /sites/%s/sync/settings
class Jetpack_JSON_API_Sync_Get_Settings_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-settings.php';

		return Jetpack_Sync_Settings::get_settings();
	}
}

// GET /sites/%s/sync/object
class Jetpack_JSON_API_Sync_Object extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$args = $this->query_args();

		$module_name = $args['module_name'];

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-modules.php';

		if ( ! $sync_module = Jetpack_Sync_Modules::get_module( $module_name ) ) {
			return new WP_Error( 'invalid_module', 'You specified an invalid sync module' );
		}

		$object_type = $args['object_type'];
		$object_ids  = $args['object_ids'];

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-sender.php';
		$codec = Jetpack_Sync_Sender::get_instance()->get_codec();

		Jetpack_Sync_Settings::set_is_syncing( true );
		$objects = $codec->encode( $sync_module->get_objects_by_id( $object_type, $object_ids ) );
		Jetpack_Sync_Settings::set_is_syncing( false );

		return array(
			'objects' => $objects,
			'codec' => $codec->name(),
		);
	}
}

class Jetpack_JSON_API_Sync_Now_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$args = $this->input();
		$queue_name = $this->validate_queue( $args['queue'] );

		if ( is_wp_error( $queue_name ) ){
			return $queue_name;
		}

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-sender.php';

		$sender = Jetpack_Sync_Sender::get_instance();
		$response = $sender->do_sync_for_queue( new Jetpack_Sync_Queue( $args['queue'] ) );

		return array(
			'response' => $response
		);
	}
}

class Jetpack_JSON_API_Sync_Checkout_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$args = $this->input();
		$queue_name = $this->validate_queue( $args['queue'] );

		if ( is_wp_error( $queue_name ) ){
			return $queue_name;
		}

		if ( $args[ 'number_of_items' ] < 1 || $args[ 'number_of_items' ] > 100  ) {
			return new WP_Error( 'invalid_number_of_items', 'Number of items needs to be an integer that is larger than 0 and less then 100', 400 );
		}

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-queue.php';
		$queue = new Jetpack_Sync_Queue( $queue_name );

		if ( 0 === $queue->size() ) {
			return new WP_Error( 'queue_size', 'The queue is empty and there is nothing to send', 400 );
		}

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-sender.php';
		$sender = Jetpack_Sync_Sender::get_instance();

		// try to give ourselves as much time as possible
		set_time_limit( 0 );

		// let's delete the checkin state
		if ( $args['force'] ) {
			$queue->unlock();
		}

		$buffer = $this->get_buffer( $queue, $args[ 'number_of_items' ] );

		// Check that the $buffer is not checkout out already
		if ( is_wp_error( $buffer ) ) {
			return new WP_Error( 'buffer_open', "We couldn't get the buffer it is currently checked out", 400 );
		}

		if ( ! is_object( $buffer ) ) {
			return new WP_Error( 'buffer_non-object', 'Buffer is not an object', 400 );
		}

		Jetpack_Sync_Settings::set_is_syncing( true );
		list( $items_to_send, $skipped_items_ids, $items ) = $sender->get_items_to_send( $buffer, $args['encode'] );
		Jetpack_Sync_Settings::set_is_syncing( false );

		return array(
			'buffer_id'      => $buffer->id,
			'items'          => $items_to_send,
			'skipped_items'  => $skipped_items_ids,
			'codec'          => $args['encode'] ? $sender->get_codec()->name() : null,
			'sent_timestamp' => time(),
		);
	}

	protected function get_buffer( $queue, $number_of_items ) {
		$start = time();
		$max_duration = 5; // this will try to get the buffer

		$buffer = $queue->checkout( $number_of_items );
		$duration = time() - $start;

		while( is_wp_error( $buffer ) && $duration < $max_duration ) {
			sleep( 2 );
			$duration = time() - $start;
			$buffer = $queue->checkout( $number_of_items );
		}

		if ( $buffer === false ) {
			return new WP_Error( 'queue_size', 'The queue is empty and there is nothing to send', 400 );
		}

		return $buffer;
	}
}

class Jetpack_JSON_API_Sync_Close_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$request_body = $this->input();
		$queue_name = $this->validate_queue( $request_body['queue'] );

		if ( is_wp_error( $queue_name ) ) {
			return $queue_name;
		}
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-queue.php';

		if ( ! isset( $request_body['buffer_id'] ) ) {
			return new WP_Error( 'missing_buffer_id', 'Please provide a buffer id', 400 );
		}

		if ( ! isset( $request_body['item_ids'] ) || ! is_array( $request_body['item_ids'] ) ) {
			return new WP_Error( 'missing_item_ids', 'Please provide a list of item ids in the item_ids argument', 400 );
		}

		//Limit to A-Z,a-z,0-9,_,-
		$request_body ['buffer_id'] = preg_replace( '/[^A-Za-z0-9]/', '', $request_body['buffer_id'] );
		$request_body['item_ids'] = array_filter( array_map( array( 'Jetpack_JSON_API_Sync_Close_Endpoint', 'sanitize_item_ids' ), $request_body['item_ids'] ) );

		$buffer = new Jetpack_Sync_Queue_Buffer( $request_body['buffer_id'], $request_body['item_ids'] );
		$queue = new Jetpack_Sync_Queue( $queue_name );

		$response = $queue->close( $buffer, $request_body['item_ids'] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return array(
			'success' => $response
		);
	}

	protected static function sanitize_item_ids( $item ) {
		// lets not delete any options that don't start with jpsq_sync-
		if ( substr( $item, 0, 5 ) !== 'jpsq_' ) {
			return null;
		}
		//Limit to A-Z,a-z,0-9,_,-,.
		return preg_replace( '/[^A-Za-z0-9-_.]/', '', $item );
	}
}

class Jetpack_JSON_API_Sync_Unlock_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$args = $this->input();

		if ( ! isset( $args['queue'] ) ) {
			return new WP_Error( 'invalid_queue', 'Queue name is required', 400 );
		}

		if ( ! in_array( $args['queue'], array( 'sync', 'full_sync' ) ) ) {
			return new WP_Error( 'invalid_queue', 'Queue name should be sync or full_sync', 400 );
		}

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-queue.php';
		$queue = new Jetpack_Sync_Queue( $args['queue'] );

		// False means that there was no lock to delete.
		$response = $queue->unlock();
		return array(
			'success' => $response
		);
	}
}
