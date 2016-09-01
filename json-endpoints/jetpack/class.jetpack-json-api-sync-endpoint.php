<?php

// POST /sites/%s/sync
class Jetpack_JSON_API_Sync_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'manage_options';

	protected function validate_call( $_blog_id, $capability, $check_manage_active = true ) {
		parent::validate_call( $_blog_id, $capability, false );
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

		return array( 'scheduled' => Jetpack_Sync_Actions::schedule_full_sync( $modules ) );
	}
}

// GET /sites/%s/sync/status
class Jetpack_JSON_API_Sync_Status_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-modules.php';
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-sender.php';

		$sync_module = Jetpack_Sync_Modules::get_module( 'full-sync' );
		$sender      = Jetpack_Sync_Sender::get_instance();
		$queue       = $sender->get_sync_queue();
		$full_queue  = $sender->get_full_sync_queue();

		return array_merge(
			$sync_module->get_status(),
			array(
				'is_scheduled'    => Jetpack_Sync_Actions::is_scheduled_full_sync(),
				'queue_size'      => $queue->size(),
				'queue_lag'       => $queue->lag(),
				'full_queue_size' => $full_queue->size(),
				'full_queue_lag'  => $full_queue->lag()
			)
		);
	}
}

// GET /sites/%s/data-check
class Jetpack_JSON_API_Sync_Check_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-sender.php';

		$sender     = Jetpack_Sync_Sender::get_instance();
		$sync_queue = $sender->get_sync_queue();

		// lock sending from the queue while we compare checksums with the server
		$result = $sync_queue->lock( 30 ); // tries to acquire the lock for up to 30 seconds

		if ( ! $result ) {
			$sync_queue->unlock();

			return new WP_Error( 'unknown_error', 'Unknown error trying to lock the sync queue' );
		}

		if ( is_wp_error( $result ) ) {
			$sync_queue->unlock();

			return $result;
		}

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-wp-replicastore.php';

		$store = new Jetpack_Sync_WP_Replicastore();

		$result = $store->checksum_all();

		$sync_queue->unlock();

		return $result;

	}
}

// GET /sites/%s/data-histogram
class Jetpack_JSON_API_Sync_Histogram_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-sender.php';

		$sender     = Jetpack_Sync_Sender::get_instance();
		$sync_queue = $sender->get_sync_queue();

		// lock sending from the queue while we compare checksums with the server
		$result = $sync_queue->lock( 30 ); // tries to acquire the lock for up to 30 seconds

		if ( ! $result ) {
			$sync_queue->unlock();

			return new WP_Error( 'unknown_error', 'Unknown error trying to lock the sync queue' );
		}

		if ( is_wp_error( $result ) ) {
			$sync_queue->unlock();

			return $result;
		}

		$args = $this->query_args();

		if ( isset( $args['columns'] ) ) {
			$columns = array_map( 'trim', explode( ',', $args['columns'] ) );
		} else {
			$columns = null; // go with defaults
		}

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-wp-replicastore.php';

		$store = new Jetpack_Sync_WP_Replicastore();

		$result = $store->checksum_histogram( $args['object_type'], $args['buckets'], $args['start_id'], $args['end_id'], $columns );

		$sync_queue->unlock();

		return $result;

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

		return array(
			'objects' => $codec->encode( $sync_module->get_objects_by_id( $object_type, $object_ids ) )
		);
	}
}

class Jetpack_JSON_API_Sync_Now_Endpoint extends Jetpack_JSON_API_Sync_Endpoint {
	protected function result() {
		$args = $this->input();

		if ( ! isset( $args['queue'] ) ) {
			return new WP_Error( 'invalid_queue', 'Queue name is required', 400 );
		}

		if ( ! in_array( $args['queue'], array( 'sync', 'full_sync' ) ) ) {
			return new WP_Error( 'invalid_queue', 'Queue name should be sync or full_sync', 400 );
		}

		$queue_name = $args['queue'];

		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-sender.php';

		$sender = Jetpack_Sync_Sender::get_instance();
		$response = $sender->do_sync_for_queue( new Jetpack_Sync_Queue( $queue_name ) );

		return array(
			'response' => $response
		);
	}
}
