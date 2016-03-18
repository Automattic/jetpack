<?php

class Jetpack_Sync_Reindex {

	static function init() {
		add_action( 'wp_ajax_jetpack-sync-reindex-trigger', array( __CLASS__, 'sync_reindex_trigger' ) );
		add_action( 'wp_ajax_jetpack-sync-reindex-status', array( __CLASS__, 'sync_reindex_status' ) );
	}

	static function reindex_if_needed() {
		if ( self::reindex_needed() ) {
			self::reindex_trigger();
		}
	}

	static function reindex_needed() {
		return ( self::_get_post_count_local() != self::_get_post_count_cloud() );
	}

	static function reindex_trigger() {
		$response = array( 'status' => 'ERROR' );

		// Force a privacy check
		Jetpack::check_privacy( JETPACK__PLUGIN_FILE );

		Jetpack::load_xml_rpc_client();
		$client = new Jetpack_IXR_Client( array(
			'user_id' => JETPACK_MASTER_USER,
		) );

		$client->query( 'jetpack.reindexTrigger' );

		if ( ! $client->isError() ) {
			$response = $client->getResponse();
			Jetpack_Options::update_option( 'sync_bulk_reindexing', true );
		}

		return $response;
	}

	public function reindex_status() {
		$response = array( 'status' => 'ERROR' );

		// Assume reindexing is done if it was not triggered in the first place
		if ( false === Jetpack_Options::get_option( 'sync_bulk_reindexing' ) ) {
			return array( 'status' => 'DONE' );
		}

		Jetpack::load_xml_rpc_client();
		$client = new Jetpack_IXR_Client( array(
			'user_id' => JETPACK_MASTER_USER,
		) );

		$client->query( 'jetpack.reindexStatus' );

		if ( ! $client->isError() ) {
			$response = $client->getResponse();
			if ( 'DONE' == $response['status'] ) {
				Jetpack_Options::delete_option( 'sync_bulk_reindexing' );
			}
		}

		return $response;
	}

	static function reindex_ui() {
		$strings = json_encode( array(
			'WAITING'     => array(
				'action' => __( 'Refresh Status', 'jetpack' ),
				'status' => __( 'Indexing request queued and waiting&hellip;', 'jetpack' ),
			),
			'INDEXING'    => array(
				'action' => __( 'Refresh Status', 'jetpack' ),
				'status' => __( 'Indexing posts', 'jetpack' ),
			),
			'DONE'        => array(
				'action' => __( 'Reindex Posts', 'jetpack' ),
				'status' => __( 'Posts indexed.', 'jetpack' ),
			),
			'ERROR'       => array(
				'action' => __( 'Refresh Status', 'jetpack' ),
				'status' => __( 'Status unknown.', 'jetpack' ),
			),
			'ERROR:LARGE' => array(
				'action' => __( 'Refresh Status', 'jetpack' ),
				'status' => __( 'This site is too large, please contact Jetpack support to sync.', 'jetpack' ),
			),
		) );

		wp_enqueue_script(
			'jetpack_sync_reindex_control',
			plugins_url( '_inc/jquery.jetpack-sync.js', JETPACK__PLUGIN_FILE ),
			array( 'jquery' ),
			JETPACK__VERSION
		);

		$template = <<<EOT
			<p class="jetpack_sync_reindex_control" id="jetpack_sync_reindex_control" data-strings="%s">
				<input type="submit" class="jetpack_sync_reindex_control_action button" value="%s" disabled />
				<span class="jetpack_sync_reindex_control_status">&hellip;</span>
			</p>
EOT;

		return sprintf(
			$template,
			esc_attr( $strings ),
			esc_attr__( 'Refresh Status', 'jetpack' )
		);
	}

	private function _get_post_count_local() {
		global $wpdb;

		return (int) $wpdb->get_var(
			"SELECT count(*)
				FROM {$wpdb->posts}
				WHERE post_status = 'publish' AND post_password = ''"
		);
	}

	private function _get_post_count_cloud() {
		$blog_id = Jetpack::init()->get_option( 'id' );

		$body = array(
			'size' => 1,
		);

		$response = wp_remote_post(
			"https://public-api.wordpress.com/rest/v1/sites/$blog_id/search",
			array(
				'timeout'    => 10,
				'user-agent' => 'jetpack_related_posts',
				'sslverify'  => true,
				'body'       => $body,
			)
		);

		if ( is_wp_error( $response ) ) {
			return 0;
		}

		$results = json_decode( wp_remote_retrieve_body( $response ), true );

		return (int) $results['results']['total'];
	}

	static function sync_reindex_trigger() {
		if ( Jetpack::current_user_is_connection_owner() && current_user_can( 'manage_options' ) ) {
			echo json_encode( self::reindex_trigger() );
		} else {
			echo '{"status":"ERROR"}';
		}
		exit;
	}

	static function sync_reindex_status(){
		if ( Jetpack::current_user_is_connection_owner() && current_user_can( 'manage_options' ) ) {
			echo json_encode( self::reindex_status() );
		} else {
			echo '{"status":"ERROR"}';
		}
		exit;
	}
}