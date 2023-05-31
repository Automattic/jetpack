<?php
/*
!
 * Admin Page: Settings: OAuth Connections
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $zbs;

// Load OAuth
$zbs->load_oauth_handler();

// Catch disconnect an OAuth:
if ( isset( $_GET['disconnect'] ) ) {

	$nonce_str     = ( isset( $_GET['_wpnonce'] ) ? $_GET['_wpnonce'] : '' );
	$nonceVerified = wp_verify_nonce( $nonce_str, 'disconnect_oauth' );

	if ( $nonceVerified ) {

		// attempt disconnect (clear tokens)
		$disconnect_provider = sanitize_text_field( $_GET['disconnect'] );

		if ( $zbs->oauth->legitimate_provider( $disconnect_provider ) ) {

			// retrieve existing token config
			$provider        = $zbs->oauth->get_provider( $disconnect_provider );
			$provider_config = $zbs->oauth->get_provider_config( $disconnect_provider );

			// unset it!
			$zbs->oauth->delete_provider_config( $disconnect_provider );

			zeroBSCRM_html_msg( 0, sprintf( __( 'Successfully disconnected %s', 'zero-bs-crm' ), $provider['name'] ) );

		}
	}
}

// edits?
if ( isset( $_GET['edit-provider'] ) && $zbs->oauth->legitimate_provider( $_GET['edit-provider'] ) ) {

	jpcrm_load_admin_page( 'settings/oauth-connections-edit' );

} else {

	// normal page view

	// here we only show settings where OAuth is enabled (requires PHP 7.3)
	if ( $zbs->oauth->enabled() ) {

		?><table class="table table-bordered table-striped wtab">
			<thead>
				<tr><th colspan="3"><?php esc_html_e( 'OAuth Connections', 'zero-bs-crm' ); ?></th></tr>
			</thead>
			<tbody>

				<?php

					// providers
					$providers = $zbs->oauth->get_providers();

					// cycle through providers & output
				foreach ( $providers as $provider_key => $provider ) {

					// pad this out, logos + connect buttons etc.
					?>
					<tr>
						<td><?php echo esc_html( $provider['name'] ); ?></td>
						<td>
							<p>
							<?php

							// if setup, show 'connect'/'reconnect'/'status'
							echo '<label>' . esc_html__( 'Status:', 'zero-bs-crm' ) . '</label> ' . $zbs->oauth->connection_status_string( $provider_key );

							?>
							</p>
						</td>
						<td style="text-align: center;">
							<?php
							switch ( $zbs->oauth->connection_status_string( $provider_key, true ) ) {

								case 'no-config':
									// nothing but config button

									break;

								case 'config-no-connect':
									// just connect button
									?>
									<button type="button" class="jpcrm-open-popup-href ui tiny green button" data-href="<?php echo esc_url( $zbs->oauth->get_callback_url( $provider_key ) ); ?>" data-title="<?php esc_attr_e( 'Connect to CRM', 'zero-bs-crm' ); ?>" data-width="600" data-height="600"><i class="plug icon"></i> <?php esc_html_e( 'Connect', 'zero-bs-crm' ); ?></button>
									<?php

									break;

								case 'seems-connected':
									// reconnect + disconnect buttons
									?>
									<div class="ui tiny buttons">
										<button type="button" class="jpcrm-open-popup-href ui tiny green button" data-href="<?php echo esc_url( $zbs->oauth->get_callback_url( $provider_key ) ); ?>" data-title="<?php esc_attr_e( 'Connect to CRM', 'zero-bs-crm' ); ?>" data-width="600" data-height="600"><i class="sync icon"></i> <?php esc_html_e( 'Reconnect', 'zero-bs-crm' ); ?></button>                                        
										<a href="<?php echo esc_url( wp_nonce_url( '?page=' . $zbs->slugs['settings'] . '&tab=oauth&disconnect=' . $provider_key, 'disconnect_oauth' ) ); ?>" class="ui tiny orange button"><i class="stop icon"></i> <?php esc_html_e( 'Disconnect', 'zero-bs-crm' ); ?></a>
									</div>
									<hr>
									<?php

									break;

							}
							?>
														
							<a href="<?php echo jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=oauth&edit-provider=' . $provider_key ); ?>" class="ui tiny teal button"><i class="cog icon"></i> <?php esc_html_e( 'Connection Settings', 'zero-bs-crm' ); ?>
						</td>
					</tr>
					<?php

				}

				?>
			</tbody>
		</table>

		<?php
		##WLREMOVE
		?>
		<p style="text-align: center;padding:2em">                            
			<a href="<?php echo esc_url( $zbs->urls['oauthdocs'] ); ?>" target="_blank" class="ui tiny button"><?php esc_html_e( 'OAuth Connection Documentation', 'zero-bs-crm' ); ?></a>
		</p>
		<?php
		##/WLREMOVE
		?>
		<?php

	} else {

		// OAuth not enabled, probably lacking PHP version >= 7.3
		echo wp_kses( sprintf( __( 'Currently your system does not support OAuth API connections. <a href="%s" target="_blank">Read More</a>', 'zero-bs-crm' ), $zbs->urls['kb-oauth-requirements'] ), $zbs->acceptable_restricted_html );

	}
}
