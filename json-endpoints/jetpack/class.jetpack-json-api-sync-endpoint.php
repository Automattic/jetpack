<?php

require_once dirname(__FILE__).'/../../sync/class.jetpack-sync-wp-replicastore.php';

class Jetpack_JSON_API_Sync_Endpoint extends Jetpack_JSON_API_Endpoint {
	// POST /sites/%s/sync
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		Jetpack::init();
		/** This action is documented in class.jetpack-sync-client.php */
		Jetpack_Sync_Actions::schedule_full_sync();

		return array( 'scheduled' => true );
	}
}

class Jetpack_JSON_API_Sync_Status_Endpoint extends Jetpack_JSON_API_Endpoint {
	// GET /sites/%s/sync-status
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		$client = Jetpack_Sync_Client::getInstance();
		return $client->get_full_sync_client()->get_status();
	}
}

class Jetpack_JSON_API_Sync_Check_Endpoint extends Jetpack_JSON_API_Endpoint {
	// GET /sites/%s/cached-data-check
	protected $needed_capabilities = 'manage_options';

	protected function result() {

		Jetpack::init();

		$client = Jetpack_Sync_Client::getInstance();
		$sync_queue = $client->get_sync_queue();

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

		$store = new Jetpack_Sync_WP_Replicastore();

		$result = $store->checksum_all();

		$sync_queue->unlock();

		return $result;

	}
}

class Jetpack_JSON_API_Sync_Modify_Settings_Endpoint extends Jetpack_JSON_API_Endpoint {
	// POST /sites/%s/sync/settings
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		$args = $this->input();

		$client = Jetpack_Sync_Client::getInstance();
		$sync_settings = $client->get_settings();

		foreach( $args as $key => $value ) {
			if ( $value !== false ) {
				if ( is_numeric( $value ) ) {
					$value = (int) $value;
				}
				$sync_settings[ $key ] = $value;
			}
		}

		$client->update_settings( $sync_settings );

		// re-fetch so we see what's really being stored
		return $client->get_settings();
	}
}

class Jetpack_JSON_API_Sync_Get_Settings_Endpoint extends Jetpack_JSON_API_Endpoint {
	// GET /sites/%s/sync/settings
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		$client = Jetpack_Sync_Client::getInstance();
		return $client->get_settings();
	}
}
