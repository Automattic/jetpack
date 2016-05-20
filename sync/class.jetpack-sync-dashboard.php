<?php

require_once( jetpack_require_lib_dir() . '/admin-pages/class.jetpack-admin-page.php' );

class Jetpack_Sync_Dashboard extends Jetpack_Admin_Page {
	protected $dont_show_if_not_active = false; // TODO: Update to true

	function add_page_actions( $hook ) {

		add_action( "admin_footer-$hook", array( $this, 'js_progress_template' ) );
	}

	function get_page_hook() {
		return add_submenu_page( null, __( 'Jetpack Sync Status', 'jetpack' ), '', 'manage_options', 'jetpack-sync', array(
			$this,
			'render'
		) );
	}

	function page_admin_scripts() {
		wp_register_script(
			'jetpack_sync_reindex_control',
			plugins_url( '_inc/jetpack-sync.js', JETPACK__PLUGIN_FILE ),
			array( 'jquery', 'wp-util' ),
			JETPACK__VERSION,
			true // load it at the bottom of the page
		);

		$strings                  = array(
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
		);
		$initial_queue_status     = json_encode( $this->queue_status() );
		$initial_full_sync_status = json_encode( $this->full_sync_status() );

		wp_localize_script( 'jetpack_sync_reindex_control', 'sync_dashboard', array(
			'possible_status'  => $strings,
			'queue_status'     => $initial_queue_status,
			'full_sync_status' => $initial_full_sync_status
		) );
	}

	function page_render() {
		$this->dashboard_ui();
	}

	function init() {
		add_action( 'wp_ajax_jetpack-sync-queue-status', array( $this, 'ajax_queue_status' ) );
		add_action( 'wp_ajax_jetpack-sync-reset-queue', array( $this, 'ajax_reset_queue' ) );
		add_action( 'wp_ajax_jetpack-sync-unlock-queue', array( $this, 'ajax_unlock_queue' ) );
		add_action( 'wp_ajax_jetpack-sync-begin-full-sync', array( $this, 'ajax_begin_full_sync' ) );
		add_action( 'wp_ajax_jetpack-sync-cancel-full-sync', array( $this, 'ajax_cancel_full_sync' ) );
		add_action( 'wp_ajax_jetpack-sync-full-sync-status', array( $this, 'ajax_full_sync_status' ) );

	}

	// returns size of queue and age of oldest item (aka lag)
	function ajax_queue_status() {
		$response = json_encode( $this->queue_status() );
		echo $response;
		exit;
	}

	function ajax_reset_queue() {
		Jetpack_Sync_Client::getInstance()->reset_sync_queue();
		echo json_encode( array( 'success' => true ) );
		exit;
	}

	function ajax_unlock_queue() {
		Jetpack_Sync_Client::getInstance()->get_sync_queue()->force_checkin();
		echo json_encode( array( 'success' => true ) );
		exit;
	}

	function ajax_begin_full_sync() {
		Jetpack_Sync_Client::getInstance()->get_full_sync_client()->start();
		$this->ajax_full_sync_status();
	}

	function ajax_cancel_full_sync() {
		// TODO	
	}

	function ajax_full_sync_status() {
		$response = json_encode( $this->full_sync_status() );
		echo $response;
		exit;
	}

	function queue_status() {
		$client = Jetpack_Sync_Client::getInstance();
		$queue  = $client->get_sync_queue();

		return array(
			'size' => $queue->size(),
			'lag'  => $queue->lag()
		);
	}

	function full_sync_status() {
		$client = Jetpack_Sync_Client::getInstance();

		return $client->get_full_sync_client()->get_complete_status();
	}

	function dashboard_ui() {
		wp_enqueue_script( 'jetpack_sync_reindex_control' );
		?>
		<div class="wrapper">
			<div class="page-content">
				<div id="sync_status">
					Sync status:
				</div>
				<p><strong>Warning: Clicking either of these buttons can get you out of sync!</strong></p>
				<button class="button" id="reset_queue_button">Reset Queue</button>
				<button class="button" id="unlock_queue_button">Unlock Queue</button>
				<hr/>
				<h2>Full Sync</h2>
				<button class="button" id="full_sync_button">Do full sync</button>
				<div id="full_sync_status"></div>
				<div id="display-sync-status"></div>
			</div>
		</div>
		<?php
	}

	function js_progress_template() { ?>
		<script type="text/html" id="tmpl-sync-progress">
			<div>
				Sync Status: {{ data.phase }}
			</div>
			<div>
				<p>Posts: {{ data.posts && data.posts.progress }} %</p>
				<p>Comments: {{ data.comments && data.comments.progress }} %</p>
				<p>Terms: {{ data.terms && data.terms.progress }} %</p>
				<p>Users: {{ data.users && data.users.progress }} %</p>
				<p>Functions: {{ data.functions && data.functions.progress }} %</p>
				<p>Constants: {{ data.constants && data.constants.progress }} %</p>
				<p>Options: {{ data.options && data.options.progress }} %</p>
			</div>
		</script>
		<?php
	}
}
