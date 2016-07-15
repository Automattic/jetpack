<?php

// POST /sites/%s/sync
class Jetpack_JSON_API_Sync_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		$args = $this->input();

		$modules = null;

		if ( isset( $args['clear'] ) && $args['clear'] ) {
			// clear sync queue
			require_once dirname(__FILE__) . '/../../sync/class.jetpack-sync-sender.php';

			$sender = Jetpack_Sync_Sender::getInstance();
			$sender->reset_sync_queue();
		}

		if ( isset( $args['force'] ) && $args['force'] ) {
			// reset full sync lock
			require_once dirname(__FILE__) . '/../../sync/class.jetpack-sync-modules.php';

			$sync_module = Jetpack_Sync_Modules::get_module( 'full-sync' );
			$sync_module->clear_status();
		}

		if ( isset( $args['modules'] ) && !empty( $args['modules'] ) ) {
			$modules = array_map('trim', explode( ',', $args['modules'] ) );
		}

		Jetpack_Sync_Actions::schedule_full_sync( $modules );
		spawn_cron();

		return array( 'scheduled' => true );
	}
}

// GET /sites/%s/sync/status
class Jetpack_JSON_API_Sync_Status_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		require_once dirname(__FILE__) . '/../../sync/class.jetpack-sync-modules.php';
		$sync_module = Jetpack_Sync_Modules::get_module( 'full-sync' );

		require_once dirname(__FILE__) . '/../../sync/class.jetpack-sync-sender.php';
		$queue = Jetpack_Sync_Sender::getInstance()->get_sync_queue();

		return array_merge(
			$sync_module->get_status(),
			array( 
				'is_scheduled' => (bool) wp_next_scheduled( 'jetpack_sync_full' ), 
				'queue_size' => $queue->size(),
				'queue_lag' => $queue->lag()
			)
		);
	}
}

// GET /sites/%s/data-check
class Jetpack_JSON_API_Sync_Check_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		require_once dirname(__FILE__) . '/../../sync/class.jetpack-sync-sender.php';

		$sender = Jetpack_Sync_Sender::getInstance();
		$sync_queue = $sender->get_sync_queue();

		// lock sending from the queue while we compare checksums with the server
		$result = $sync_queue->lock( 30 ); // tries to acquire the lock for up to 30 seconds

		if ( !$result ) {
			$sync_queue->unlock();
			return new WP_Error( 'unknown_error', 'Unknown error trying to lock the sync queue' );
		}

		if ( is_wp_error( $result ) ) {
			$sync_queue->unlock();
			return $result;
		}

		require_once dirname(__FILE__) . '/../../sync/class.jetpack-sync-wp-replicastore.php';

		$store = new Jetpack_Sync_WP_Replicastore();

		$result = $store->checksum_all();

		$sync_queue->unlock();

		return $result;

	}
}

// GET /sites/%s/data-histogram
class Jetpack_JSON_API_Sync_Histogram_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		require_once dirname(__FILE__) . '/../../sync/class.jetpack-sync-sender.php';

		$sender = Jetpack_Sync_Sender::getInstance();
		$sync_queue = $sender->get_sync_queue();

		// lock sending from the queue while we compare checksums with the server
		$result = $sync_queue->lock( 30 ); // tries to acquire the lock for up to 30 seconds

		if ( !$result ) {
			$sync_queue->unlock();
			return new WP_Error( 'unknown_error', 'Unknown error trying to lock the sync queue' );
		}

		if ( is_wp_error( $result ) ) {
			$sync_queue->unlock();
			return $result;
		}

		$args = $this->query_args();

		require_once dirname(__FILE__) . '/../../sync/class.jetpack-sync-wp-replicastore.php';

		$store = new Jetpack_Sync_WP_Replicastore();

		$result = $store->checksum_histogram( $args['object_type'], $args['buckets'], $args['start_id'], $args['end_id'] );

		$sync_queue->unlock();

		return $result;

	}
}

// POST /sites/%s/sync/settings
class Jetpack_JSON_API_Sync_Modify_Settings_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		$args = $this->input();

		require_once dirname(__FILE__) . '/../../sync/class.jetpack-sync-settings.php';

		$sync_settings = Jetpack_Sync_Settings::get_settings();

		foreach( $args as $key => $value ) {
			if ( $value !== false ) {
				if ( is_numeric( $value ) ) {
					$value = (int) $value;
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
class Jetpack_JSON_API_Sync_Get_Settings_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		require_once dirname(__FILE__) . '/../../sync/class.jetpack-sync-settings.php';
		return Jetpack_Sync_Settings::get_settings();
	}
}
