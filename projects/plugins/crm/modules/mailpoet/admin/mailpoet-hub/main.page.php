<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync: Admin: Hub page
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Page: MailPoet Sync Hub
 */
function jpcrm_mailpoet_render_hub_page() {

	global $zbs;

	// any messages to output
	$general_notices = array();
	$error_notices = array();

	// intercept for attempting restart of initial sync
	if ( isset( $_GET['restart_sync'] ) ) {

		// Show message: are you sure?
		$html = '<p>' . __( 'This will restart syncing your MailPoet subscribers from scratch, using your current settings.', 'zero-bs-crm' ) . '</p>';
		$html .= '<p>' . __( 'This will not remove any existing subscribers or data, but it will update objects if they are reimported and have since changed.', 'zero-bs-crm' ) . '</p>';
		$html .= '<p><a href="' . jpcrm_esc_link( $zbs->modules->mailpoet->slugs['hub'] . '&definitely_restart_sync=1' ) . '" class="ui button teal">' . __( 'Yes, do a full resync', 'zero-bs-crm' ) . '</a>&nbsp;&nbsp;<a href="' . jpcrm_esc_link( $zbs->modules->mailpoet->slugs['hub'] ) . '" class="ui button red">' . __( 'No, cancel and go back to hub', 'zero-bs-crm' ) . '</a></p>';

		echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'Want to restart your sync?', 'zero-bs-crm' ), $html, 'info' );
		exit();

	}

	// intercept for actual restart of initial sync
	if ( isset( $_GET['definitely_restart_sync'] ) ) {

		// restart!
		$zbs->modules->mailpoet->background_sync->set_first_import_status( false );
		$zbs->modules->mailpoet->background_sync->set_resume_from_page( 0 );

		// notice
		$general_notices[] = zeroBSCRM_UI2_messageHTML( 'info', __( 'Sync restarted', 'zero-bs-crm' ), __( 'The MailPoet Sync import has been restarted. This will start running in the background from the beginning.', 'zero-bs-crm' ) );

	}

	// intercept for debug, if we have $_GET['debug_sync'], call that
	if ( isset( $_GET['debug_sync'] ) ){
		
		// render debug mode sync page
		jpcrm_mailpoet_render_hub_page_debug_mode();
		exit();

	}

	$settings = $zbs->modules->mailpoet->settings->getAll();
	$settings_page_url = jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=' . $zbs->modules->mailpoet->slugs['settings'] );

	// retrieve current counts
	$jpcrm_mailpoet_latest_stats = $zbs->modules->mailpoet->get_jpcrm_mailpoet_latest_stats();

	// various states:
	if ( !$zbs->mailpoet_is_active() ){

		$error_notices[] = zeroBSCRM_UI2_messageHTML( 'warning', '', __( 'You do not currently have the MailPoet plugin installed. You\'ll need to install MailPoet to use MailPoet Sync', 'zero-bs-crm' ) ) ;
		$no_mailpoet_found = true;

	}

	// shorthand
	$settings_cog_html = '<a href="' . $settings_page_url . '" title="' . __( 'Change Settings', 'zero-bs-crm' ) . '" target="_blank"><i class="cog icon"></i></a>';
	$settings_cog_button_html = '<a href="' . $settings_page_url . '" title="' . __( 'Change Settings', 'zero-bs-crm' ) . '" target="_blank" class="ui right floated jpcrm-mailpoet-settings-button"><i class="cog icon"></i>' . __( 'MailPoet Sync Settings', 'zero-bs-crm' ) . '</a>';

	?>
	<div id="jpcrm-mailpoet-hub-page">
		<div id="jpcrm-mailpoet-logo">
			<img id="jpcrm-mailpoet-jpcrm-logo" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/jpcrm-logo-horizontal-black.png" alt="CRM" />
			<i class="plus icon"></i>
			<img id="jpcrm-mailpoet-mailpoet-logo" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/mailpoet-logo.svg" alt="MailPoet" />
		</div>
		<?php

		// any notices?
		if ( count( $general_notices ) > 0 ){
			?>
			<div id="jpcrm-mailpoet-messages">
				<?php foreach ( $general_notices as $notice_html ){
					echo $notice_html;
				} ?>
			</div>
			<?php
		}

		?>
		<div class="ui segment" id="jpcrm-mailpoet-page-body">
			<div>
				<div class="jpcrm-mailpoet-stats-header"></div>
				<?php

				// show any detected error messages if possible
				foreach ( $error_notices as $error_notice ) {
					echo $error_notice;
				}

				?>
			</div>

			<?php if ( isset( $no_mailpoet_found ) ){
				
				// No MailPoet ?>
				<h2 class="ui header">
					<i id="jpcrm-mailpoet-status-icon" class="icon hourglass half green"></i>
					<div class="content">
						<?php echo esc_html__( 'Status: ', 'zero-bs-crm' ) . esc_html__( 'Not yet connected', 'zero-bs-crm' ); ?>

						<div class="sub header">
							<p class="jpcrm-mailpoet-recap">
								<?php echo esc_html__( 'Setup Type: ', 'zero-bs-crm' ) . esc_html__( 'No connection', 'zero-bs-crm' ); ?>
							</p>
							<br>
							<span id="jpcrm-mailpoet-status-long-text"><?php echo wp_kses( sprintf( __( 'To get started with MailPoet Sync please make sure <a href="%s">MailPoet is installed</a>.', 'zero-bs-crm' ), esc_url( $zbs->modules->mailpoet->urls['install_mailpoet'] ) ), $zbs->acceptable_restricted_html ); ?></span>
							<i style="display:none" id="jpcrm_failed_ajax" class="grey exclamation circle icon"></i>
							<script>
								var jpcrm_mailpoet_initiate_ajax_sync = false;
								var jpcrm_mailpoet_nonce = '<?php echo esc_js( wp_create_nonce( 'jpcrm_mailpoet_hubsync' ) ); ?>';
							</script>

						</div>
					</div>
				</h2>
			<?php

			} else { 

				// Has plugin ?>
				<h2 class="ui header">
					<i id="jpcrm-mailpoet-status-icon" class="icon hourglass half green"></i>
					<div class="content">
						<?php esc_html_e( 'Status: ', 'zero-bs-crm' ); ?>
						<span id="jpcrm-mailpoet-status-short-text" class="status green"><?php esc_html_e( 'Syncing content from MailPoet...', 'zero-bs-crm' ); ?></span>

						<div class="sub header">
							<p class="jpcrm-mailpoet-recap">
								<?php esc_html_e( 'Setup Type:', 'zero-bs-crm' ); ?> 
								<?php esc_html_e( 'Local', 'zero-bs-crm' ); ?><br />
								<?php echo '<span id="jpcrm-mailpoet-stat-contacts-synced">' . esc_html( $jpcrm_mailpoet_latest_stats['subscribers_synced'] ) . '</span> ' . esc_html__( 'Subscribers Synced', 'zero-bs-crm' ); ?>
								<a href="<?php echo jpcrm_esc_link( 'manage-customers&quickfilters=mailpoet_subscriber' ); ?>" id="jpcrm-mailpoet-recap-link-to-contacts" class="ui tiny blue button<?php if ( $jpcrm_mailpoet_latest_stats['subscribers_synced'] <= 0 ){ echo ' hidden'; } ?>" style="margin-left:10px"><?php esc_html_e( 'View Subscribers in CRM', 'zero-bs-crm' ); ?></a>
							</p>
							<br>
							<span id="jpcrm-mailpoet-status-long-text"><?php esc_html_e( 'MailPoet Sync is importing subscribers...', 'zero-bs-crm' ); ?></span>
							<i style="display:none" id="jpcrm_failed_ajax" class="grey exclamation circle icon"></i>
							<script>
								var jpcrm_mailpoet_initiate_ajax_sync = true;
								var jpcrm_mailpoet_nonce = '<?php echo esc_js( wp_create_nonce( 'jpcrm_mailpoet_hubsync' ) ); ?>';
							</script>
							<div class="ui inline loader" id="jpcrm_firing_ajax" title="<?php esc_attr_e( 'Keeping this page open will improve the background sync speed.', 'zero-bs-crm' ); ?>"></div>

						</div>
					</div>
				</h2>
			<?php } ?>

			<div id="jpcrm-mailpoet-stats" class="ui">
				<?php if ( $jpcrm_mailpoet_latest_stats['subscribers_synced'] < 1 ) { ?>
				<div id="jpcrm-mailpoet-stats-nothing-yet" class="ui active dimmer">
					<div>
						<p><?php esc_html_e( "You don't have any data synced from MailPoet yet.", 'zero-bs-crm' ); ?></p>
						<p>
							<a href="<?php echo esc_url( $settings_page_url ); ?>" target="_blank" class="ui small button">
								<i class="cog icon"></i> 
								<?php esc_html_e( 'Change Settings', 'zero-bs-crm' ); ?>
							</a>
							<?php ##WLREMOVE ?> 
							<a href="<?php echo esc_url( $zbs->urls['kb-mailpoet'] ); ?>" target="_blank" class="ui small blue button">
								<i class="file text outline icon"></i> 
								<?php esc_html_e( 'Visit Setup Guide', 'zero-bs-crm' ); ?>
							</a>
							<?php ##/WLREMOVE ?> 
						</p>
					</div>
				</div>
				<?php } ?>
			</div>
		</div>

		<div id="jpcrm-mailpoet-quiet-restart-link">
			<?php esc_html_e( 'Admin Tools:', 'zero-bs-crm' );

			// settings link
			if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
				?> <a href="<?php echo esc_url( $settings_page_url ); ?>"><?php esc_html_e( 'MailPoet Sync Settings', 'zero-bs-crm' ); ?></a> <?php
			}
			?>
			| <a href="<?php echo jpcrm_esc_link( $zbs->modules->mailpoet->slugs['hub'] . '&restart_sync=1' ); ?>"><?php esc_html_e( 'Restart Sync', 'zero-bs-crm' ); ?></a>
			| <a href="<?php echo jpcrm_esc_link( $zbs->modules->mailpoet->slugs['hub'] . '&debug_sync=1' ); ?>"><?php esc_html_e( 'Run Sync debug', 'zero-bs-crm' ); ?></a>
		</div>
	</div>
	<?php

	// output language labels
	jpcrm_mailpoet_output_language_labels();

}

/*
* Output <script> JS to pass language labels to JS
*
* @param $additional_labels - array; any key/value pairs here will be expressed in the JS label var
*/
function jpcrm_mailpoet_output_language_labels( $additional_labels = array() ){

	// specify default (generic) labels
	$language_labels = array_merge( array(

		'ajax_fail'             => __( 'Failed retrieving data.', 'zero-bs-crm' ),
		'complete'              => __( 'Completed Sync.', 'zero-bs-crm' ),
		'remaining_pages'       => __( '{0} remaining pages.', 'zero-bs-crm' ),
		'caught_mid_job'        => __( 'Import job is running in the back end. If this message is still shown after some time, please contact support.', 'zero-bs-crm' ),
		'server_error'          => __( 'There was a general server error.', 'zero-bs-crm' ),

		'incomplete_nextpage'   => __( 'Completed page. Next: page {0} of {1} pages. ({2})', 'zero-bs-crm' ),
		'complete_lastpage'     => __( 'Completed last page, (page {0} of {1} pages)', 'zero-bs-crm' ),
		'debug_return'          => __( 'Return: {0}', 'zero-bs-crm' ),
		'retrieving_page'       => __( 'Retrieving page {0}', 'zero-bs-crm' ),

	), $additional_labels );


	?><script>var jpcrm_mailpoet_language_labels = <?php echo json_encode( $language_labels ); ?></script><?php

}


/**
 * Styles and scripts for hub page
 */
function jpcrm_mailpoet_hub_page_styles_scripts(){

	global $zbs;	
	wp_enqueue_script( 'jpcrm-mailpoet', plugins_url( '/js/jpcrm-mailpoet-hub-page'.wp_scripts_get_suffix().'.js', JPCRM_MAILPOET_ROOT_FILE ), array( 'jquery' ), $zbs->version );
	wp_enqueue_style( 'jpcrm-mailpoet-hub-page', plugins_url( '/css/jpcrm-mailpoet-hub-page'.wp_scripts_get_suffix().'.css', JPCRM_MAILPOET_ROOT_FILE ) );
	zeroBSCRM_global_admin_styles();

}


/**
 * Run a sync in debug mode:
 */
function jpcrm_mailpoet_render_hub_page_debug_mode(){

	global $zbs;

	?><div id="jpcrm-mailpoet-hub-page">
		<div id="jpcrm-mailpoet-logo">
			<img id="jpcrm-mailpoet-jpcrm-logo" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/jpcrm-logo-horizontal-black.png" alt="" />
			<i class="plus icon"></i>
			<img id="jpcrm-mailpoet-mailpoet-logo" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/mailpoet-logo.svg" alt="MailPoet" />
		</div>
		<div class="ui segment" id="jpcrm-mailpoet-page-body">
			<h2>Debug Mode:</h2>

			<div id="jpcrm-mailpoet-debug-output">
			<?php

				// set debug
				$zbs->modules->mailpoet->background_sync->debug = true;

				// call job function
				$zbs->modules->mailpoet->background_sync->sync_subscribers();

			?></div>
		</div>
		<p style="text-align: center;margin-top:2em"><a href="<?php echo jpcrm_esc_link( $zbs->modules->mailpoet->slugs['hub'] ) ?>" class="ui button green"><?php esc_html_e( 'Go back to MailPoet Sync Hub', 'zero-bs-crm' ); ?></a>
	</div><?php

}