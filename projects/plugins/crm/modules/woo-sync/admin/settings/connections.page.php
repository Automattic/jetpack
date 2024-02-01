<?php
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Admin: Connections page
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Page: WooSync Connections
 */
function jpcrm_settings_page_html_woosync_connections() {

	global $zbs;

	$show_disconnect_prompt = false;

	$settings = $zbs->modules->woosync->settings->getAll();

	// retrieve connected store(s)
	$sync_sites = $zbs->modules->woosync->get_active_sync_sites( 'default', true );

	// did we just authenticate?
	if ( isset( $_GET['success'] ) ){

		$success_value = (int)sanitize_text_field( $_GET['success'] );

		if ( $success_value == 1 ){

			echo zeroBSCRM_UI2_messageHTML( 'success', '', __( 'Successfully authenticated remote store.', 'zero-bs-crm' ), 'info' );

		} else {

			echo zeroBSCRM_UI2_messageHTML( 'warning', '', __( 'Attempt to authenticate remote store failed.', 'zero-bs-crm' ), 'info' );

		}

	}

	$nonce_str = ( isset( $_GET['_wpnonce'] ) ? $_GET['_wpnonce'] : '' );

	// catch disconnect requests
	if ( isset( $_GET['disconnect'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

		$site_key_to_disconnect = sanitize_text_field( $_GET['disconnect'] );

		if ( !empty( $site_key_to_disconnect ) && isset( $sync_sites[ $site_key_to_disconnect ] ) ) {

			// show warning or act
			if ( !isset( $_GET['definitely_disconnect'] ) ){

				// warning prompt
				$show_disconnect_prompt = true;

			} else {

				// act

				$nonceVerified = wp_verify_nonce( $nonce_str, 'disconnect_woosync_site_connection_' . $site_key_to_disconnect );

				if ( $nonceVerified ){

					// disconnect/delete site
					if ( $zbs->modules->woosync->remove_sync_site( $site_key_to_disconnect ) ) {

						// success message
						zeroBSCRM_html_msg( 0, __( 'Successfully disconnected connection:', 'zero-bs-crm' ) . ' ' . $sync_sites[ $site_key_to_disconnect ]['domain'] );

						// re-retrieve connected store(s)
						$sync_sites = $zbs->modules->woosync->get_active_sync_sites( 'default', true );

					}
				} else {

					zeroBSCRM_html_msg( 1, __( 'Unable to disconnect connection:', 'zero-bs-crm' ) . ' ' . $sync_sites[ $site_key_to_disconnect ]['domain'] );
		
				}

			}

		}

	}

	// catch pause request
	else if ( isset( $_GET['pause'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

		$did_resume = false;
		$site_key_to_pause = sanitize_text_field( $_GET['pause'] );
		$nonceVerified = wp_verify_nonce( $nonce_str, 'pause_woosync_site_connection_' . $site_key_to_pause );

		if ( $nonceVerified ) {

			$site_info = $zbs->modules->woosync->pause_sync_site( $site_key_to_pause );

			if ( !empty( $site_info['paused'] ) ) {

				$did_resume = true;

				// re-retrieve connected store(s)
				$sync_sites = $zbs->modules->woosync->get_active_sync_sites( 'default', true );
			}

		}

		// output message
		if ( $did_resume ) {
			zeroBSCRM_html_msg( 0, __( 'Successfully paused sync for connection:', 'zero-bs-crm' ) . ' ' . $sync_sites[ $site_key_to_pause ]['domain'] );
		} else {
			zeroBSCRM_html_msg( 1, __( 'Unable to pause sync for connection:', 'zero-bs-crm' ) . ' ' . $sync_sites[ $site_key_to_pause ]['domain'] );
		}

	}

	// catch resume request
	else if ( isset( $_GET['resume'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

		$did_pause = false;
		$site_key_to_resume = sanitize_text_field( $_GET['resume'] );
		$nonceVerified = wp_verify_nonce( $nonce_str, 'resume_woosync_site_connection_' . $site_key_to_resume );


		if ( $nonceVerified ) {

			$site_info = $zbs->modules->woosync->resume_sync_site( $site_key_to_resume );

			if ( empty( $site_info['paused'] ) ) {

				$did_pause = true;

				// re-retrieve connected store(s)
				$sync_sites = $zbs->modules->woosync->get_active_sync_sites( 'default', true );
			}

		}

		// output message
		if ( $did_pause ) {
			zeroBSCRM_html_msg( 0, __( 'Successfully resumed sync for connection:', 'zero-bs-crm' ) . ' ' . $sync_sites[ $site_key_to_resume ]['domain'] );
		} else {
			zeroBSCRM_html_msg( 1, __( 'Unable to resume sync for connection:', 'zero-bs-crm' ) . ' ' . $sync_sites[ $site_key_to_resume ]['domain'] );
		}

	}

	if ( $show_disconnect_prompt ) {

		?>
			<div class="ui icon big warning message">
				<i class="times circle outline icon"></i>
				<div class="content">
					<div class="header">
						<?php _e('Are you sure?',"zero-bs-crm"); ?>
					</div>
					<p><?php echo sprintf( __( 'Are you sure you want to disconnect the connection to the store at <br><code>%s</code>?', 'zero-bs-crm' ), $sync_sites[ $site_key_to_disconnect ]['domain'] ); ?></p>
					<p><?php esc_html_e( 'This will pernamently remove this connection. No new data will be synchronised from this external store unless you add a new connection to it at a later date. This will not remove any existing data.', 'zero-bs-crm' ); ?></p>
					<p><?php

									// actions
									echo '<a href="' . esc_url( wp_nonce_url( '?page=' . $zbs->slugs['settings'] . '&tab=' . $zbs->modules->woosync->slugs['settings'] . '&subtab=' . $zbs->modules->woosync->slugs['settings_connections'] . '&disconnect=' . $site_key_to_disconnect . '&definitely_disconnect=1', 'disconnect_woosync_site_connection_' . $site_key_to_disconnect ) ) . '" class="ui orange button right floated"><i class="trash alternate icon"></i> ' . esc_html__( 'Disconnect Store Connection', 'zero-bs-crm' ) . '</a>';
									echo '<a href="' . jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=' . $zbs->modules->woosync->slugs['settings'] . '&subtab=' . $zbs->modules->woosync->slugs['settings_connections'] ) . '" class="ui green button right floated"><i class="angle double left icon"></i> ' . esc_html__('Back to Connections', 'zero-bs-crm' ) . '</a>';
									
					?></p>
				</div>
			</div>
		<?php

	} else {

		// normal page load  ?>
		<p><?php echo wp_kses( sprintf( __( 'From this page you can manage connections between Jetpack CRM and one or more WooCommerce stores. <a href="%s" target="_blank">Read more about connecting Jetpack CRM to WooCommerce</a>.', 'zero-bs-crm' ), esc_url( $zbs->urls['connect-multi-woo'] ) ), $zbs->acceptable_restricted_html ); ?></p>

		<h3 style="text-align: center;" class="ui blue header"><?php esc_html_e( 'WooCommerce Connections', 'zero-bs-crm'); ?></h3>
		<table class="table table-striped wtab">
			<tbody>
				<td>
					<?php

						// first up we want to pick any local connections out of the stack
						if ( isset( $sync_sites['local'] ) ){

							// draw it
							jpcrm_woosync_connections_page_single_connection( 'local', $sync_sites['local'] );

						}


						foreach ( $sync_sites as $site_key => $site_info ){

							// skip local as dealt with above
							if ( $site_key == 'local' ) continue;

							// draw it
							jpcrm_woosync_connections_page_single_connection( $site_key, $site_info );

						}



						// if no connections show message:
						if ( count( $sync_sites ) == 0 ){

							echo zeroBSCRM_UI2_messageHTML( 
								'info',
								__( 'No WooCommerce connections', 'zero-bs-crm' ),
								__( '<a href="%s">Connect to an external WooCommerce store</a> or install WooCommerce to get started.', 'zero-bs-crm' ),
								'',
								'jpcrm-no-woo-connections-notice'
							);

						}

					?>
				</td>
			</tbody>
			<tfoot>

				<tr>
					<td colspan="2" class="wmid" style="padding-top:1.5em">
						<button class="ui blue button" id="jpcrm-woosync-connect-to-store"><i class="plug icon"></i> <?php 
						if ( count( $sync_sites ) == 0 ){
							
							esc_html_e( 'Connect a Store', 'zero-bs-crm' );
							
						} else {
							
							esc_html_e( 'Connect another Store', 'zero-bs-crm' );

						}
						?></button>
						<?php 
						echo sprintf(
							'<a href="%s" class="ui basic positive button" style="margin-top:1em"><i class="shopping cart icon"></i> %s</a>',
							jpcrm_esc_link( $zbs->slugs['woosync'] ),
							esc_html__( 'WooSync Hub', 'zero-bs-crm' )
						); ?>
					</td>
				</tr>

			</tfoot>
		</table>

		<script type="text/javascript">

			jQuery(document).ready(function(){

			});


		</script>

		<?php

	} // / normal page load

}

/*
* Draws html for a WooCommerce connection
*/
function jpcrm_woosync_connections_page_single_connection( $site_key, $site_info ){	

	global $zbs;

	if ( !is_array( $site_info  ) ){

		return '';

	}

	// connected?
	switch ( $site_info['mode'] ){

		case JPCRM_WOO_SYNC_MODE_LOCAL:
			
			// always connected, as long as Woo is here
			if ( $zbs->woocommerce_is_active() ){

				$connection_status = true;
				$connection_explainer_str = '';

			} else {

				$connection_status = false;
				$connection_explainer_str = __( 'Cannot find WooCommerce', 'zero-bs-crm' );

			}

			break;

		case JPCRM_WOO_SYNC_MODE_API: 
			
			// verify creds:
			if ( $zbs->modules->woosync->verify_api_connection( $site_key ) ){

				$connection_status = true;
				$connection_explainer_str = '';

				// clear connection error count
				$zbs->modules->woosync->set_sync_site_attribute( $site_key, 'site_connection_errors', 0 );

			} else {

				$connection_status = false;
				$connection_explainer_str = __( 'Could not connect to WooCommerce', 'zero-bs-crm' );

				// increment connection error count
				$zbs->modules->woosync->increment_sync_site_count( $site_key, 'site_connection_errors' );

			}

			break;

	}

	?><div class="jpcrm-woocommerce-connection ui segment" id="jpcrm-woocommerce-connection-<?php echo esc_attr( $site_key ); ?>">

		<div class="ui grid">
			<div class="twelve wide column">
				<div class="jpcrm-woocommerce-site">
					<?php

						$additional_button_html = '';

						if ( $connection_status ) {

							$label_color = 'green';
							$label_str = __( 'Connected', 'zero-bs-crm' );
							
							// pause/resume
							if ( !isset( $site_info['paused'] ) || !$site_info['paused'] ){

								// pause
								$additional_button_html = sprintf(
									'<a href="%s&tab=%s&subtab=%s&pause=%s&_wpnonce=%s" class="ui small basic fluid button" style="margin-top:1em"><i class="pause icon"></i> %s</a>',
									jpcrm_esc_link($zbs->slugs['settings']),
									$zbs->modules->woosync->slugs['settings'],
									$zbs->modules->woosync->slugs['settings_connections'],
									$site_key,
									wp_create_nonce( 'pause_woosync_site_connection_' . $site_key ),
									__( 'Pause Sync', 'zero-bs-crm' )
								);

							} else {

								// resume
								$additional_button_html = sprintf(
									'<a href="%s&tab=%s&subtab=%s&resume=%s&_wpnonce=%s" class="ui small basic orange fluid button" style="margin-top:1em"><i class="play icon"></i> %s</a>',
									jpcrm_esc_link($zbs->slugs['settings']),
									$zbs->modules->woosync->slugs['settings'],
									$zbs->modules->woosync->slugs['settings_connections'],
									$site_key,
									wp_create_nonce( 'resume_woosync_site_connection_' . $site_key ),
									__( 'Resume Sync', 'zero-bs-crm' )
								);

							}

						} else {

							$label_color = 'grey';
							$label_str = __( 'Not connected', 'zero-bs-crm' );

						} 

						echo '<span class="ui right floated large label jpcrm-woocommerce-connection-state ' . esc_attr( $label_color ) . '">' . esc_html( $label_str ) . '</span>';


						switch ( $site_info['mode'] ){

							case JPCRM_WOO_SYNC_MODE_LOCAL:

								echo '<span class="ui large label teal"><i class="home icon"></i> ' . esc_html__( 'Local', 'zero-bs-crm' ) . '</span>';

								break;

							case JPCRM_WOO_SYNC_MODE_API:

								echo '<span class="ui large label blue"><i class="plug icon"></i> ' . esc_html__( 'External', 'zero-bs-crm' ) . '</span>';

								break;

						}

						echo '<span class="jpcrm-woocommerce-site-url">' . esc_html( $site_info['domain'] ) . '</span>';

					?>
				</div>

				<?php

				// extra detail?
				if ( $site_info['last_sync_fired'] != -1 || isset( $site_info['total_order_count'] ) ){

					?><div class="jpcrm-woocommerce-connection-details"><?php

						// last synced
						if ( $site_info['last_sync_fired'] != -1 ) {
							echo '<div class="jpcrm-woocommerce-last-synced jpcrm-woocommerce-connection-detail">' . esc_html( sprintf( __( 'Last Synced Data: %s', 'zero-bs-crm' ), zeroBSCRM_locale_utsToDatetime( $site_info['last_sync_fired'] ) ) ) . '</div>';
						}
						if ( isset( $site_info['total_order_count'] ) ){
							echo '<div class="jpcrm-woocommerce-total-order-count jpcrm-woocommerce-connection-detail">' . esc_html( sprintf( __( 'Total Orders Imported: %s', 'zero-bs-crm' ), zeroBSCRM_prettifyLongInts( $site_info['total_order_count'] ) ) ) . '</div>';
						}

					?></div><?php
				}

				?>

			</div>
			<div class="four wide column jpcrm-woocommerce-connection-column">

				<?php

				// edit
				$edit_button = sprintf(
					'<a href="%s&tab=%s&subtab=%s&site_key=%s" class="ui small basic fluid button" style="margin-top:1em"><i class="pencil alternate icon"></i> %s</a>',
					jpcrm_esc_link( $zbs->slugs['settings'] ),
					esc_attr( $zbs->modules->woosync->slugs['settings'] ),
					esc_attr( $zbs->modules->woosync->slugs['settings_connection_edit'] ),
					esc_attr( $site_key ),
					esc_html__( 'Edit', 'zero-bs-crm' )
				);

				// actions
				switch ( $site_info['mode'] ){

					case JPCRM_WOO_SYNC_MODE_LOCAL:

						if ( $connection_status ){

							// All Okay

							// visit store
							echo '<a href="' . esc_url( $zbs->modules->woosync->get_local_woo_admin_url() ) . '" target="_blank" class="ui small blue fluid button"><i class="building alternate icon"></i> ' . esc_html__( 'WooCommerce Admin', 'zero-bs-crm' ) . '</a>';

							// edit
							echo $edit_button;

							// any extras? (pause)
							echo $additional_button_html;

						} else {

							// Some issue with connection, could be lack of WooCommerce (was active, isn't now)
							esc_html_e( 'There was an error connecting to your local WooCommerce store. Please make sure WooCommerce is active, after which if this error message persists, please contact support.', 'zero-bs-crm' );

						}

						break;

					case JPCRM_WOO_SYNC_MODE_API:

						if ( $connection_status ){

							// already connected, nothing to do

							// visit store
							echo '<a href="' . esc_url( $zbs->modules->woosync->get_external_woo_admin_url( $site_info['domain'] ) ) . '" target="_blank" class="ui small blue fluid button"><i class="external square alternate icon"></i> ' . esc_html__( 'WooCommerce Admin', 'zero-bs-crm' ) . '</a>'; 

							// edit
							echo $edit_button;

							// any extras? (pause)
							echo $additional_button_html;

							// delete
							echo sprintf(
								'<a href="%s&tab=%s&subtab=%s&disconnect=%s" class="ui small basic negative fluid button" style="margin-top:1em"><i class="times circle outline icon"></i> %s</a>',
								jpcrm_esc_link( $zbs->slugs['settings'] ),
								esc_attr( $zbs->modules->woosync->slugs['settings'] ),
								esc_attr( $zbs->modules->woosync->slugs['settings_connections'] ),
								esc_attr( $site_key ),
								esc_html__( 'Delete Connection', 'zero-bs-crm' )
							);

						} else {

							// edit
							echo $edit_button;

							// delete
							echo sprintf(
								'<a href="%s&tab=%s&subtab=%s&disconnect=%s" class="ui small basic negative fluid button" style="margin-top:1em"><i class="times circle outline icon"></i> %s</a>',
								jpcrm_esc_link( $zbs->slugs['settings'] ),
								esc_attr( $zbs->modules->woosync->slugs['settings'] ),
								esc_attr( $zbs->modules->woosync->slugs['settings_connections'] ),
								esc_attr( $site_key ),
								esc_html__( 'Delete Connection', 'zero-bs-crm' )
							);
						}

						break;

					}

					// explainer?
					if ( !empty( $connection_explainer_str ) ) {
						echo '<br>' . esc_html( $connection_explainer_str );
					}

			?></div>
		</div>
	</div><?php

}


/**
 * Styles and scripts for connections
 */
function jpcrm_woosync_connections_styles_scripts(){

	global $zbs;	
	wp_enqueue_script( 'jpcrm-woo-sync-connections-page', plugins_url( '/js/jpcrm-woo-sync-settings-connections'.wp_scripts_get_suffix().'.js', JPCRM_WOO_SYNC_ROOT_FILE ), array( 'jquery' ), $zbs->modules->woosync->version );
	wp_enqueue_style( 'jpcrm-woo-sync-connections-page', plugins_url( '/css/jpcrm-woo-sync-settings-connections'.wp_scripts_get_suffix().'.css', JPCRM_WOO_SYNC_ROOT_FILE ) );

}