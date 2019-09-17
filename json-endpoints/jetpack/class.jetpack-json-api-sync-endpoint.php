<?php

use Automattic\Jetpack\Sync\Actions;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Queue;
use Automattic\Jetpack\Sync\Queue_Buffer;
use Automattic\Jetpack\Sync\Replicastore;
use Automattic\Jetpack\Sync\Sender;
use Automattic\Jetpack\Sync\Settings;

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
		return array( 'scheduled' => Actions::do_full_sync( $modules ) );
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
		return Actions::get_sync_status( $fields );
	}
}

// GET /sites/%s/data-check
class Jetpack_JSON_API_Sync_Check_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$store = new Replicastore();
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

		$store = new Replicastore();

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

		$sync_settings = Settings::get_settings();

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

		Settings::update_settings( $sync_settings );

		// re-fetch so we see what's really being stored
		return Settings::get_settings();
	}
}

// GET /sites/%s/sync/settings
class Jetpack_JSON_API_Sync_Get_Settings_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {

		return Settings::get_settings();
	}
}

// GET /sites/%s/sync/object
class Jetpack_JSON_API_Sync_Object extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$args = $this->query_args();

		$module_name = $args['module_name'];

		if ( ! $sync_module = Modules::get_module( $module_name ) ) {
			return new WP_Error( 'invalid_module', 'You specified an invalid sync module' );
		}

		$object_type = $args['object_type'];
		$object_ids  = $args['object_ids'];

		$codec = Sender::get_instance()->get_codec();

		Settings::set_is_syncing( true );
		$objects = $codec->encode( $sync_module->get_objects_by_id( $object_type, $object_ids ) );
		Settings::set_is_syncing( false );

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

		$sender = Sender::get_instance();
		$response = $sender->do_sync_for_queue( new Queue( $args['queue'] ) );

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

		$queue = new Queue( $queue_name );

		if ( 0 === $queue->size() ) {
			return new WP_Error( 'queue_size', 'The queue is empty and there is nothing to send', 400 );
		}

		$sender = Sender::get_instance();

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

		Settings::set_is_syncing( true );
		list( $items_to_send, $skipped_items_ids, $items ) = $sender->get_items_to_send( $buffer, $args['encode'] );
		Settings::set_is_syncing( false );

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

		if ( ! isset( $request_body['buffer_id'] ) ) {
			return new WP_Error( 'missing_buffer_id', 'Please provide a buffer id', 400 );
		}

		if ( ! isset( $request_body['item_ids'] ) || ! is_array( $request_body['item_ids'] ) ) {
			return new WP_Error( 'missing_item_ids', 'Please provide a list of item ids in the item_ids argument', 400 );
		}

		//Limit to A-Z,a-z,0-9,_,-
		$request_body ['buffer_id'] = preg_replace( '/[^A-Za-z0-9]/', '', $request_body['buffer_id'] );
		$request_body['item_ids'] = array_filter( array_map( array( 'Jetpack_JSON_API_Sync_Close_Endpoint', 'sanitize_item_ids' ), $request_body['item_ids'] ) );

		$queue = new Queue( $queue_name );

		$items = $queue->peek_by_id( $request_body['item_ids'] );

		/** This action is documented in packages/sync/src/modules/Full_Sync.php */
		$full_sync_module = Modules::get_module( 'full-sync' );

		$full_sync_module->update_sent_progress_action( $items );

		$buffer = new Queue_Buffer( $request_body['buffer_id'], $request_body['item_ids'] );
		$response = $queue->close( $buffer, $request_body['item_ids'] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return array(
			'success' => $response,
			'status' => Actions::get_sync_status(),
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

		$queue = new Queue( $args['queue'] );

		// False means that there was no lock to delete.
		$response = $queue->unlock();
		return array(
			'success' => $response
		);
	}
}

class Jetpack_JSON_API_Sync_Object_Id_Range extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$args = $this->query_args();

		$module_name = $args['sync_module'];
		$batch_size  = $args['batch_size'];

		if ( ! $this->is_valid_sync_module( $module_name ) ) {
			return new WP_Error( 'invalid_module', 'This sync module cannot be used to calculate a range.', 400 );
		}

		$module = Modules::get_module( $module_name );

		return array(
			'ranges' => $module->get_min_max_object_ids_for_batches( $batch_size ),
		);
	}

	protected function is_valid_sync_module( $module_name ) {
		return in_array(
			$module_name,
			array(
				'comments',
				'posts',
				'terms',
				'term_relationships',
				'users',
			),
			true
		);
	}
}
