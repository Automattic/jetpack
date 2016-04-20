<?php

class Jetpack_Sync_Dashboard {
	static function init() {
		add_action( 'wp_ajax_jetpack-sync-queue-status', array( __CLASS__, 'queue_status' ) );
	}

	// returns size of queue and age of oldest item (aka lag)
	public function queue_status() {
		$client = Jetpack_Sync_Client::getInstance();
		$queue = $client->get_sync_queue();

		return array(
			'size' => $queue->size(),
			'lag' => $queue->lag()
		);
	}

	static function jetpack_sync_admin_head() {
		?>
		<script type="text/javascript">
			jQuery( document ).ready( function($) {
				console.log("loaded");
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
			plugins_url( '_inc/jquery.jetpack-sync.js', JETPACK__PLUGIN_FILE ),
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
			<p class="jetpack_sync_reindex_control" id="jetpack_sync_reindex_control" data-strings="%s">
				This is a test 
				<input type="submit" class="jetpack_sync_reindex_control_action button" value="%s" disabled />
				<span class="jetpack_sync_reindex_control_status">&hellip;</span>
			</p>
EOT;

		echo sprintf(
			$template,
			esc_attr( $strings ),
			esc_attr__( 'Refresh Status', 'jetpack' )
		);
	}

}
