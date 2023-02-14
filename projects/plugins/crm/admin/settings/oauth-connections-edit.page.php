<?php
/*
!
 * Admin Page: Settings: OAuth Connections: edit
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $zbs;

// Load OAuth
$zbs->load_oauth_handler();

// edits?
if ( isset( $_GET['edit-provider'] ) && $zbs->oauth->legitimate_provider( $_GET['edit-provider'] ) ) {

	// which provider?
	$editing_provider = sanitize_text_field( $_GET['edit-provider'] );

	// retrieve summary and existing token config
	$provider        = $zbs->oauth->get_provider( $editing_provider );
	$provider_config = $zbs->oauth->get_provider_config( $editing_provider );

	// if not set, prepare
	if ( ! is_array( $provider_config ) ) {
		$provider_config = array();
	}

	// anything to update?
	if ( isset( $_POST['edit_provider'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

		// nonce check to prevent CSRF
		if ( isset( $_POST['_wpnonce'] ) && wp_verify_nonce( $_POST['_wpnonce'], 'jpcrm-update-oauth-details' ) ) {

			$provider_config['id']     = ( isset( $_POST[ 'jpcrm_oauth_setting_' . $editing_provider . '_id' ] ) ? sanitize_text_field( $_POST[ 'jpcrm_oauth_setting_' . $editing_provider . '_id' ] ) : '' );
			$provider_config['secret'] = ( isset( $_POST[ 'jpcrm_oauth_setting_' . $editing_provider . '_secret' ] ) ? sanitize_text_field( $_POST[ 'jpcrm_oauth_setting_' . $editing_provider . '_secret' ] ) : '' );

			// direct override
			$zbs->oauth->update_provider_config( $editing_provider, $provider_config );

			// display updated message
			echo zeroBSCRM_UI2_messageHTML( 'info', __( 'Connection settings updated', 'zero-bs-crm' ), __( 'Your OAuth connection settings have been updated.', 'zero-bs-crm' ) . '<br><br><a href="' . jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=oauth' ) . '" class="ui button green">' . __( 'Return to OAuth Connections', 'zero-bs-crm' ) . '</a>' );

			// reload
			$provider_config = $zbs->oauth->get_provider_config( $editing_provider );

		}
	}

	// Draw edit screen
	?>
	<form method="post">
	<?php wp_nonce_field( 'jpcrm-update-oauth-details' ); ?>
	<input type="hidden" name="edit_provider" id="edit_provider" value="1" />
	<table class="table table-bordered table-striped wtab">
			<thead>
				<tr><th colspan=2><?php echo esc_html( sprintf( __( '%s Connection Settings', 'zero-bs-crm' ), $provider['name'] ) ); ?></th></tr>
			</thead>
			<tbody>

				<tr>
					<td><label><?php esc_html_e( 'Redirect URI', 'zero-bs-crm' ); ?></label></td>
					<td>
						<code><?php echo esc_url( $zbs->oauth->get_callback_url( $editing_provider ) ); ?></code>
					</td>
				</tr>

				<tr>
					<td colspan="2">
						<hr />
					</td>
				</tr>

				<tr>
					<td><label for="jpcrm_oauth_setting_<?php echo esc_attr( $editing_provider ); ?>_id"><?php esc_html_e( 'Client ID', 'zero-bs-crm' ); ?></label></td>
					<td>
						<div class="ui fluid input" style="min-width: 150px;">
							<input type="text" name="jpcrm_oauth_setting_<?php echo esc_attr( $editing_provider ); ?>_id" id="jpcrm_oauth_setting_<?php echo esc_attr( $editing_provider ); ?>_id" placeholder="<?php echo esc_attr( sprintf( __( 'e.g. %s', 'zero-bs-crm' ), '595387679191-32p8h47uwks4e0kfcct50irbsj8o8rmp.apps.domain.com' ) ); ?>" value="<?php echo ! empty( $provider_config['id'] ) ? esc_attr( $provider_config['id'] ) : ''; ?>" />
						</div>
					</td>
				</tr>

				<tr>
					<td><label for="jpcrm_oauth_setting_<?php echo esc_attr( $editing_provider ); ?>_secret"><?php esc_html_e( 'Client Secret', 'zero-bs-crm' ); ?></label></td>
					<td>
						<div class="ui fluid input" style="min-width: 150px;">
							<input type="text" name="jpcrm_oauth_setting_<?php echo esc_attr( $editing_provider ); ?>_secret" id="jpcrm_oauth_setting_<?php echo esc_attr( $editing_provider ); ?>_secret" placeholder="<?php echo esc_attr( sprintf( __( 'e.g. %s', 'zero-bs-crm' ), 'KEOCPW-uRiDf-CZsGlXDrtWM2ZJXUqj10aT' ) ); ?>" value="<?php echo ! empty( $provider_config['secret'] ) ? esc_attr( $provider_config['secret'] ) : ''; ?>" />
						</div>
					</td>
				</tr>

				<?php

				// if we have a token for this provider, let's say so here for clarity
				if ( isset( $provider_config['token'] ) && ! empty( $provider_config['token'] ) ) {
					?>
				<tr>
					<td><?php esc_html_e( 'Connection Status:', 'zero-bs-crm' ); ?></td>
					<td>
					<?php

						$status_output = false;

					if ( isset( $provider_config['expires'] ) ) {

						if ( $provider_config['expires'] < time() ) {

							esc_html_e( 'Previously had connection, but has expired.', 'zero-bs-crm' );
							$status_output = true;

						} else {

							echo esc_html( sprintf( __( 'Connected, expires %s', 'zero-bs-crm' ), date( 'F j, Y, g:i a', $provider_config['expires'] ) ) );
							$status_output = true;

						}
					}

					if ( ! $status_output ) {

						esc_html_e( 'Has connection without expiry specified.', 'zero-bs-crm' );

					}

					?>
					</td>
				</tr>
					<?php

				}

				?>
				<tr>
					<td colspan="2">
						<p style="text-align:center;padding:2em;">
							<button type="submit" class="ui button primary"><?php esc_html_e( 'Save Settings', 'zero-bs-crm' ); ?></button>
							<?php
							if ( isset( $provider['docs_url'] ) ) {
								?>
								<a href="<?php echo esc_url( $provider['docs_url'] ); ?>" target="_blank" class="ui teal button"><?php esc_html_e( 'Documentation', 'zero-bs-crm' ); ?></a>
								<?php
							}
							?>
							<a href="<?php echo jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=oauth' ); ?>" class="ui button"><?php esc_html_e( 'Return to OAuth Connections', 'zero-bs-crm' ); ?></a>
						</p>
					</td>
				</tr>

				</tbody></table></form>
			<?php

}
