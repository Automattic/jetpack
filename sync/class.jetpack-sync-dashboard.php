<?php

class Jetpack_Sync_Dashboard {
	static function init() {
		add_action( 'wp_ajax_jetpack-sync-queue-status', array( __CLASS__, 'ajax_queue_status' ) );
		add_action( 'wp_ajax_jetpack-sync-reset-queue', array( __CLASS__, 'ajax_reset_queue' ) );
		add_action( 'wp_ajax_jetpack-sync-unlock-queue', array( __CLASS__, 'ajax_unlock_queue' ) );
		add_action( 'wp_ajax_jetpack-sync-begin-full-sync', array( __CLASS__, 'ajax_begin_full_sync' ) );
		add_action( 'wp_ajax_jetpack-sync-cancel-full-sync', array( __CLASS__, 'ajax_cancel_full_sync' ) );
		add_action( 'wp_ajax_jetpack-sync-full-sync-status', array( __CLASS__, 'ajax_full_sync_status' ) );
	}

	// returns size of queue and age of oldest item (aka lag)
	static function ajax_queue_status() {
		$response = json_encode( self::queue_status() );
		echo $response;
		exit;
	}

	static function ajax_reset_queue() {
		Jetpack_Sync_Client::getInstance()->reset_sync_queue();
		echo json_encode( array( 'success' => true ) );
		exit;
	}

	static function ajax_unlock_queue() {
		Jetpack_Sync_Client::getInstance()->get_sync_queue()->force_checkin();
		echo json_encode( array( 'success' => true ) );
		exit;
	}

	static function ajax_begin_full_sync() {
		Jetpack_Sync_Client::getInstance()->get_full_sync_client()->start();
		self::ajax_full_sync_status();
	}

	static function ajax_cancel_full_sync() {
		// TODO	
	}

	static function ajax_full_sync_status() {		
		$response = json_encode( self::full_sync_status() );
		echo $response;
		exit;
	}

	static function queue_status() {
		$client = Jetpack_Sync_Client::getInstance();
		$queue = $client->get_sync_queue();

		return array(
			'size' => $queue->size(),
			'lag' => $queue->lag()
		);
	}

	static function full_sync_status() {
		$client = Jetpack_Sync_Client::getInstance();
		return $client->get_full_sync_client()->get_complete_status();
	}

	static function jetpack_sync_admin_head() {
		$initial_queue_status = json_encode( self::queue_status() );
		$initial_full_sync_status = json_encode( self::full_sync_status() );
		?>
		<script type="text/javascript">
			jQuery( document ).ready( function($) {
				$( '#sync_status' ).syncStatus( <?php echo $initial_queue_status ?> );
				$( '#reset_queue_button').resetQueueButton();
				$( '#unlock_queue_button').unlockQueueButton();
				$( '#full_sync_button' ).fullSyncButton();
				$( '#full_sync_status' ).fullSyncStatus( $( '#full_sync_button' ) );
			} );
		</script>
		<?php 
	}

	static function dashboard_ui() {			
		if ( ! current_user_can( 'manage_options' ) )
			wp_die( esc_html__('You do not have sufficient permissions to access this page.', 'jetpack' ) );

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
			plugins_url( '_inc/jetpack-sync.js', JETPACK__PLUGIN_FILE ),
			array( 'jquery' ),
			JETPACK__VERSION
		);

// 		$template = <<<EOT
// 			<p class="jetpack_sync_reindex_control" id="jetpack_sync_reindex_control" data-strings="%s">
// 				<input type="submit" class="jetpack_sync_reindex_control_action button" value="%s" disabled />
// 				<span class="jetpack_sync_reindex_control_status">&hellip;</span>
// 			</p>
// EOT;

		

		$template = <<<EOT
			<div id="sync_status">
				Sync status:
			</div>
			<p><strong>Warning: Clicking either of these buttons can get you out of sync!</strong></p>
			<button id="reset_queue_button">Reset Queue</button> 
			<button id="unlock_queue_button">Unlock Queue</button> 
			<hr />
			<h2>Full Sync</h2>
			<button id="full_sync_button">Do full sync</button>
			<div id="full_sync_status"></div>
EOT;

		echo sprintf(
			$template,
			esc_attr( $strings ),
			esc_attr__( 'Refresh Status', 'jetpack' )
		);
	}

}
