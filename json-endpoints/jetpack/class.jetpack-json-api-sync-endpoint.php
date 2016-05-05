<?php

require_once '../../sync/class.jetpack-sync-wp-replicastore.php';

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

class Jetpack_JSON_API_Sync_Check_Endpoint extends Jetpack_JSON_API_Endpoint {
	// POST /sites/%s/cached-data-check

	public function callback( $path = '', $_blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $_blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		Jetpack::init();
		/** This action is documented in class.jetpack.php */

		$sync_queue = Jetpack_Sync_Client::getInstance()->get_sync_queue();

		// lock sending from the queue while we compare checksums with the server
		$result = $sync_queue->lock( 30 ); // tries to acquire the lock for up to 30 seconds

		if ( !$result ) {
			return new WP_Error( 'unknown_error', 'Unknown error trying to lock the sync queue' );
		}

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$store = new Jetpack_Sync_WP_Replicastore();

		return $store->checksum_all();
	}
}