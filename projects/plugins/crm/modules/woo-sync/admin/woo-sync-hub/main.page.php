<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Admin: Hub page
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Page: WooSync Hub
 */
function jpcrm_woosync_render_hub_page() {

	global $zbs;

	// any messages to output
	$general_notices = array();
	$error_notices = array();

	// from 5.2 we have multi-site syncing
	$sync_sites = $zbs->modules->woosync->get_active_sync_sites();

	// intercept for attempting restart of initial sync
	if ( isset( $_GET['restart_sync'] ) ) {

		// Show message: are you sure?
		$html = '<p>' . __( 'This will restart syncing your WooCommerce orders from scratch, using your current settings.', 'zero-bs-crm' ) . '</p>';
		$html .= '<p>' . __( 'This will not remove any existing orders or data, but it will update objects if they are reimported and have since changed.', 'zero-bs-crm' ) . '</p>';
		$html .= '<p><a href="' . jpcrm_esc_link( $zbs->modules->woosync->slugs['hub'] . '&definitely_restart_sync=1' ) . '" class="ui button teal">' . __( 'Yes, do a full resync', 'zero-bs-crm' ) . '</a>&nbsp;&nbsp;<a href="' . jpcrm_esc_link( $zbs->modules->woosync->slugs['hub'] ) . '" class="ui button red">' . __( 'No, cancel and go back to hub', 'zero-bs-crm' ) . '</a></p>';

		echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'Want to restart your sync?', 'zero-bs-crm' ), $html, 'info' );
		exit();

	}

	// intercept for actual restart of initial sync
	if ( isset( $_GET['definitely_restart_sync'] ) ) {

		// restart all!
		if ( is_array( $sync_sites ) ){

			foreach ( $sync_sites as $site_key => $site_info ){

				// mark that we've 'not completed first import'
				$zbs->modules->woosync->set_sync_site_attribute( $site_key, 'first_import_complete', false);
				$zbs->modules->woosync->set_sync_site_attribute( $site_key, 'resume_from_page', 1);

			}

		}

		// notice
		$general_notices[] = zeroBSCRM_UI2_messageHTML( 'info', __( 'Sync restarted', 'zero-bs-crm' ), __( 'The WooSync import has been restarted. This will start running in the background from the beginning.', 'zero-bs-crm' ) );

	}

	// intercept for debug, if we have $_GET['debug_sync'], call that
	if ( isset( $_GET['debug_sync'] ) ){
		
		// render debug mode sync page
		jpcrm_woosync_render_hub_page_debug_mode();
		exit();

	}

	$settings = $zbs->modules->woosync->settings->getAll();
	$settings_page_url = jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=' . $zbs->modules->woosync->slugs['settings'] );
	$connections_page_url = jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=' . $zbs->modules->woosync->slugs['settings'] . '&subtab=' . $zbs->modules->woosync->slugs['settings_connections'] );

	// retrieve current counts
	$jpcrm_woo_latest_stats = $zbs->modules->woosync->get_jpcrm_woo_latest_stats();

	// from 5.2 we have multi-site syncing (that user may potentially be using)
	$active_connection_stack = array(
		'external'  => array(),
		'local'     => array(),
	);
	$total_active_connections = 0; // this counts active connections (not paused)
	$total_paused_connections = 0;
	$site_connection_errors = 0;

	foreach ( $sync_sites as $site_key => $site_info ){

		// external
		if ( $site_info['mode'] == JPCRM_WOO_SYNC_MODE_API ) {

			// vars
			$domain = $site_info['domain'];
			$key    = $site_info['key'];
			$secret = $site_info['secret'];
			$prefix = $site_info['prefix'];

			$wc_setup_type_text = __( 'External site', 'zero-bs-crm' );

			// if domain setting, show site
			if ( ! empty( $domain ) ) {
				$wc_setup_type_text .= ' - ' . __( 'Domain: ', 'zero-bs-crm' ) . $domain;
			} else {
				$wc_setup_type_text .= ' (' . __( 'No domain specified!', 'zero-bs-crm' ) . ')';
			}

			// confirm settings
			if ( empty( $domain ) || empty( $key ) || empty( $secret ) ) {

				$error_notices[] = zeroBSCRM_UI2_messageHTML( 'warning', '', sprintf( __( 'You have not setup your WooCommerce API details for one of your connections. Please fill in your API details on the <a href="%s" target="_blank">connections page</a>.', 'zero-bs-crm' ), $connections_page_url ) );

				// if no prefix, alert
				// really we could move this out of this block, but it would
				// get messy if they've already started an import
				if ( empty( $prefix ) ) {
					$error_notices[] = zeroBSCRM_UI2_messageHTML( 'info', '', sprintf( __( 'You are set up to import from an external site, but you have not set an order prefix. This is recommended so that orders from external sites do not clash with local/other site orders. Please add a prefix for the connection on the <a href="%s" target="_blank">connections page</a>.', 'zero-bs-crm' ), $connections_page_url ) );
				}

			} else {

				$active_connection_stack['external'][] = $domain;

				// if not paused
				if ( !isset( $site_info['paused'] ) || empty( $site_info['paused'] ) ){

					$total_active_connections++;

				} else {

					$total_paused_connections++;

				}

				// if any recorded errors:
				if ( isset( $site_info['site_connection_errors'] ) && $site_info['site_connection_errors'] > 0 ){

					$site_connection_errors++;

				}

			}

		} else {

			// local install

			$wc_setup_type_text = __( 'Same site (local WooCommerce store)', 'zero-bs-crm' );

			// verify woo installed
			if ( !$zbs->woocommerce_is_active() ) {

				$error_notices[] = zeroBSCRM_UI2_messageHTML( 'warning', '', __( 'You do not have WooCommerce installed. Please first install WooCommerce if you want to sync local store data.', 'zero-bs-crm' ) );

			} else {

				$active_connection_stack['local'][] = site_url();

				// if not paused
				if ( !isset( $site_info['paused'] ) || empty( $site_info['paused'] ) ){

					$total_active_connections++;

				} else {

					$total_paused_connections++;
					
				}
				
			}


		}

	} // / per site connection

	// if we're using multiple connections
	if ( count( $sync_sites ) > 1 ){

		$wc_setup_type_text = __( 'Multiple Site Connections', 'zero-bs-crm' );

		// count them
		$wc_setup_type_text .= sprintf( __( ' (%d active and %d paused)', 'zero-bs-crm' ), $total_active_connections, count( $sync_sites ) - $total_active_connections );

	}

	// catch zero connections active	
	if ( $total_active_connections === 0 ){

		$general_notices[] = zeroBSCRM_UI2_messageHTML( 'info', __( 'No Active Store Connections', 'zero-bs-crm' ), sprintf( __( 'You do not have any active store connections. WooSync is not currently syncing any order data. Please <a href="%s">connect a store</a>.', 'zero-bs-crm' ), $connections_page_url ) );

	} elseif ( $total_paused_connections > 0 ) {

		// some active, some paused!
		$general_notices[] = zeroBSCRM_UI2_messageHTML( 'info', __( 'Paused Store Connections', 'zero-bs-crm' ), sprintf( __( 'One or more of your store connections are paused. WooSync will not currently sync any order data from these sites. Please <a href="%s">connect a store</a>.', 'zero-bs-crm' ), $connections_page_url ) );

	}

	// catch site connection errors
	if ( $site_connection_errors > 0 ){

		$general_notices[] = zeroBSCRM_UI2_messageHTML( 'info', __( 'Store Connection Error', 'zero-bs-crm' ), sprintf( __( 'A Store Connection is having trouble connecting. Please double check your <a href="%s">Store Connections</a>.', 'zero-bs-crm' ), $connections_page_url ) );

	}

	$has_woosync_errors = count( $error_notices ) > 0;

	// shorthand
	$settings_cog_html = '<a href="' . $settings_page_url . '" title="' . __( 'Change Settings', 'zero-bs-crm' ) . '" target="_blank"><i class="cog icon"></i></a>';
	$settings_cog_button_html = '<a href="' . $settings_page_url . '" title="' . __( 'Change Settings', 'zero-bs-crm' ) . '" target="_blank" class="ui right floated jpcrm-woosync-settings-button"><i class="cog icon"></i>' . __( 'WooSync Settings', 'zero-bs-crm' ) . '</a>';

	?>
	<div id="jpcrm-woosync-hub-page">
		<div id="jpcrm-woo-logo">
			<img id="jpcrm-woosync-jpcrm-logo" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/jpcrm-logo-horizontal-black.png" alt="" />
			<i class="plus icon"></i>
			<img id="jpcrm-woosync-woo-logo" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/woocommerce-logo-color-black@2x.png" alt="" />
		</div>
		<?php

		// any notices?
		if ( count( $general_notices ) > 0 ){
			?>
			<div id="jpcrm-woosync-messages">
				<?php foreach ( $general_notices as $notice_html ){
					echo $notice_html;
				} ?>
			</div>
			<?php
		}

		?>
		<div class="ui segment" id="jpcrm-woosync-page-body">
			<div>
				<div class="jpcrm-woosync-stats-header"></div>
				<?php

				// show any detected error messages if possible
				foreach ( $error_notices as $error_notice ) {
					echo $error_notice;
				}

				?>
			</div>

			<?php if ( count( $sync_sites ) == 0 ){
				
				// No connection ?>
				<h2 class="ui header">
					<i id="jpcrm-woosync-status-icon" class="icon hourglass half green"></i>
					<div class="content">
						<?php echo esc_html__( 'Status: ', 'zero-bs-crm' ) . esc_html__( 'Not yet connected', 'zero-bs-crm' ); ?>

						<div class="sub header">
							<p class="jpcrm-woosync-recap">
								<?php echo esc_html__( 'Setup Type: ', 'zero-bs-crm' ) . esc_html__( 'No connection', 'zero-bs-crm' ); ?>
							</p>
							<br>
							<span id="jpcrm-woosync-status-long-text"><?php echo wp_kses( sprintf( __( 'To get started with WooSync please <a href="%s">Connect to a Store</a>.', 'zero-bs-crm' ), $connections_page_url ), $zbs->acceptable_restricted_html ); ?></span>
							<i style="display:none" id="jpcrm_failed_ajax" class="grey exclamation circle icon"></i>
							<script>
								var jpcrm_woo_connect_initiate_ajax_sync = false;
								var jpcrm_woosync_nonce = '<?php echo esc_js( wp_create_nonce( 'jpcrm_woosync_hubsync' ) ); ?>';
							</script>

						</div>
					</div>
				</h2>
			<?php

			} else { 

				// Has Connection(s) 

				// language
				$syncing_biline = __( 'Syncing content from WooCommerce...', 'zero-bs-crm' );
				$initial_action = __( 'WooSync is importing orders...', 'zero-bs-crm' );
				if ( $total_active_connections === 0 ){ 

					$syncing_biline = __( 'Not Currently Syncing', 'zero-bs-crm' );
					$initial_action = '';

				}


				?>
				<h2 class="ui header">
					<i id="jpcrm-woosync-status-icon" class="icon hourglass half green"></i>
					<div class="content">
						<?php esc_html_e( 'Status: ', 'zero-bs-crm' ); ?>
						<span id="jpcrm-woosync-status-short-text" class="status green"><?php echo esc_html( $syncing_biline ); ?></span>

						<div class="sub header">
							<p class="jpcrm-woosync-recap">
								<?php esc_html_e( 'Setup Type:', 'zero-bs-crm' ); ?> 
								<?php echo esc_html( $wc_setup_type_text ); ?>
								<span id="jpcrm-woosync-stat-last-order-synced"><?php echo $jpcrm_woo_latest_stats['last_order_synced']; ?></span>
							</p>
							<br>
							<span id="jpcrm-woosync-status-long-text"><?php echo esc_html( $initial_action ); ?></span>
							<i style="display:none" id="jpcrm_failed_ajax" class="grey exclamation circle icon"></i>
							<script>
								var jpcrm_woo_connect_initiate_ajax_sync = true;
								var jpcrm_woosync_nonce = '<?php echo esc_js( wp_create_nonce( 'jpcrm_woosync_hubsync' ) ); ?>';
							</script>
							<div class="ui inline loader" id="jpcrm_firing_ajax" title="<?php esc_attr_e( 'Keeping this page open will improve the background sync speed when synchronising.', 'zero-bs-crm' ); ?>"></div>

						</div>
					</div>
				</h2>
			<?php } ?>

			<div id="jpcrm-woo-stats" class="ui">
				<?php if ( $jpcrm_woo_latest_stats['contacts_synced'] < 1 && $has_woosync_errors ) { ?>
				<div id="jpcrm-woo-stats-nothing-yet" class="ui active dimmer">
					<div>
						<p><?php esc_html_e( "You don't have any data synced from WooCommerce yet.", 'zero-bs-crm' ); ?></p>
						<p>
							<a href="<?php echo esc_url( $settings_page_url ); ?>" target="_blank" class="ui small button">
								<i class="cog icon"></i> 
								<?php esc_html_e( 'Change Settings', 'zero-bs-crm' ); ?>
							</a>
							<?php ##WLREMOVE ?> 
							<a href="<?php echo esc_url( $zbs->urls['kb-woosync-home'] ); ?>" target="_blank" class="ui small blue button">
								<i class="file text outline icon"></i> 
								<?php esc_html_e( 'Visit Setup Guide', 'zero-bs-crm' ); ?>
							</a>
							<?php ##/WLREMOVE ?> 
						</p>
					</div>
				</div>
				<?php } ?>
				<div class="ui grid" id="jpcrm-woosync-stats-container">
					<div class="five wide column">
						<div class="jpcrm-woosync-stat ui inverted segment blue">
							<div class="jpcrm-woosync-stat-container jpcrm-clickable" data-href="<?php echo esc_attr( zeroBSCRM_getAdminURL( $zbs->slugs['managecontacts'] . '&quickfilters=woo_customer' ) ); ?>"<?php

								// basic style scaling for large numbers.
								// On refining this hub page we should rethink
								if ( strlen( $jpcrm_woo_latest_stats['contacts_synced'] ) > 9 ) {

									// 10 million or more
									echo ' style="font-size:2.1em;"';

								}

							?>>
								<i class="user circle icon"></i><br />
								<span id="jpcrm-woosync-stat-contacts-synced"><?php echo esc_html( $jpcrm_woo_latest_stats['contacts_synced'] ); ?></span>
								<div class="jpcrm-woosync-stat-label"><?php esc_html_e( 'Contacts', 'zero-bs-crm' ); ?></div>
							</div>
						</div>
					</div>
					<div class="five wide column">
						<div class="jpcrm-woosync-stat ui inverted segment blue">
							<div class="jpcrm-woosync-stat-container jpcrm-clickable" data-href="<?php echo esc_attr( zeroBSCRM_getAdminURL( $zbs->slugs['managetransactions'] . '&quickfilters=woo_transaction' ) ); ?>"<?php
								// basic style scaling for large numbers.
								// On refining this hub page we should rethink
								if ( strlen( $jpcrm_woo_latest_stats['transactions_synced'] ) > 9 ) {

									// 10 million or more
									echo ' style="font-size:2.1em;"';

								}

							?>>
								<i class="exchange icon"></i><br />
								<span id="jpcrm-woosync-stat-transactions-synced"><?php echo esc_html( $jpcrm_woo_latest_stats['transactions_synced'] ); ?></span>
								<div class="jpcrm-woosync-stat-label"><?php esc_html_e( 'Transactions', 'zero-bs-crm' ); ?></div>
							</div>
						</div>
					</div>
					<div class="five wide column">
						<div class="jpcrm-woosync-stat ui inverted segment blue">
							<div class="jpcrm-woosync-stat-container"<?php

								// basic style scaling for large numbers.
								// On refining this hub page we should rethink
								if ( strlen( $jpcrm_woo_latest_stats['transaction_total'] ) > 11 ) {

									// millions
									echo ' style="font-size:1.7em;"';

								}

							?>>
								<i class="money bill alternate icon"></i><br />
								<span id="jpcrm-woosync-stat-transaction-total"><?php echo esc_html( $jpcrm_woo_latest_stats['transaction_total'] ); ?></span>
								<div class="jpcrm-woosync-stat-label"><?php esc_html_e( 'WooCommerce Transaction Total', 'zero-bs-crm' ); ?></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div id="jpcrm-woosync-quiet-restart-link">
			<?php esc_html_e( 'Admin Tools:', 'zero-bs-crm' );

			// settings link
			if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
				?> <a href="<?php echo esc_url( $settings_page_url ); ?>"><?php esc_html_e( 'WooSync Settings', 'zero-bs-crm' ); ?></a> <?php
				?>| <a href="<?php echo esc_url( $connections_page_url ); ?>"><?php esc_html_e( 'WooSync Connections', 'zero-bs-crm' ); ?></a> <?php
			}
			?>
			| <a href="<?php echo jpcrm_esc_link( $zbs->modules->woosync->slugs['hub'] . '&restart_sync=1' ); ?>"><?php esc_html_e( 'Restart Sync', 'zero-bs-crm' ); ?></a>
			| <a href="<?php echo jpcrm_esc_link( $zbs->modules->woosync->slugs['hub'] . '&debug_sync=1' ); ?>"><?php esc_html_e( 'Run Sync debug', 'zero-bs-crm' ); ?></a>
		</div>
	</div>
		<?php

	jpcrm_woosync_output_language_labels();

}

/*
* Output <script> JS to pass language labels to JS
*
* @param $additional_labels - array; any key/value pairs here will be expressed in the JS label var
*/
function jpcrm_woosync_output_language_labels( $additional_labels = array() ){

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


	?><script>var jpcrm_woosync_language_labels = <?php echo json_encode( $language_labels ); ?></script><?php

}


/**
 * Styles and scripts for hub page
 */
function jpcrm_woosync_hub_page_styles_scripts(){

	global $zbs;	
	wp_enqueue_script( 'jpcrm-woo-sync', plugins_url( '/js/jpcrm-woo-sync-hub-page'.wp_scripts_get_suffix().'.js', JPCRM_WOO_SYNC_ROOT_FILE ), array( 'jquery' ), $zbs->modules->woosync->version );
	wp_enqueue_style( 'jpcrm-woo-sync-hub-page', plugins_url( '/css/jpcrm-woo-sync-hub-page'.wp_scripts_get_suffix().'.css', JPCRM_WOO_SYNC_ROOT_FILE ) );

}


/**
 * Run a sync in debug mode:
 */
function jpcrm_woosync_render_hub_page_debug_mode(){

	global $zbs;

	?><div id="jpcrm-woosync-hub-page">
		<div id="jpcrm-woo-logo">
			<img id="jpcrm-woosync-jpcrm-logo" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/jpcrm-logo-horizontal-black.png" alt="" />
			<i class="plus icon"></i>
			<img id="jpcrm-woosync-woo-logo" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/woocommerce-logo-color-black@2x.png" alt="" />
		</div>
		<div class="ui segment" id="jpcrm-woosync-page-body">
			<h2>Debug Mode:</h2>

			<div id="jpcrm-woosync-debug-output">
			<?php

				// set debug
				$zbs->modules->woosync->background_sync->debug = true;

				// call job function
				$zbs->modules->woosync->background_sync->sync_orders();

			?></div>
		</div>
		<p style="text-align: center;margin-top:2em"><a href="<?php echo jpcrm_esc_link( $zbs->modules->woosync->slugs['hub'] ) ?>" class="ui button green"><?php esc_html_e( 'Go back to WooSync Hub', 'zero-bs-crm' ); ?></a>
	</div><?php

}