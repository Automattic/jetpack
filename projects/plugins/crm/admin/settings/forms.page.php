<?php
/*
!
 * Admin Page: Settings: Forms settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;  // } Req

$settings = $zbs->settings->getAll();

// } Act on any edits!
if ( isset( $_POST['editwplf'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

	// check nonce
	check_admin_referer( 'zbs-update-settings-forms' );

	$updatedSettings['usegcaptcha'] = 0;
	if ( isset( $_POST['wpzbscrm_usegcaptcha'] ) && ! empty( $_POST['wpzbscrm_usegcaptcha'] ) ) {
		$updatedSettings['usegcaptcha'] = 1;
	}
	$updatedSettings['gcaptchasitekey'] = 0;
	if ( isset( $_POST['wpzbscrm_gcaptchasitekey'] ) && ! empty( $_POST['wpzbscrm_gcaptchasitekey'] ) ) {
		$updatedSettings['gcaptchasitekey'] = sanitize_text_field( $_POST['wpzbscrm_gcaptchasitekey'] );
	}
	$updatedSettings['gcaptchasitesecret'] = 0;
	if ( isset( $_POST['wpzbscrm_gcaptchasitesecret'] ) && ! empty( $_POST['wpzbscrm_gcaptchasitesecret'] ) ) {
		$updatedSettings['gcaptchasitesecret'] = sanitize_text_field( $_POST['wpzbscrm_gcaptchasitesecret'] );
	}

	// } Brutal update
	foreach ( $updatedSettings as $k => $v ) {
		$zbs->settings->update( $k, $v );
	}

	// } $msg out!
	$sbupdated = true;

	// } Reload
	$settings = $zbs->settings->getAll();

}
?>

<p id="sbDesc"><?php esc_html_e( 'Here you can modify the settings for the built-in CRM forms.', 'zero-bs-crm' ); ?>

<?php ##WLREMOVE ?>
<?php echo wp_kses( sprintf( __( 'Want to use third-party forms like Contact Form 7 or Gravity Forms? Check out our <a href="%s" target="_blank">Form Extensions</a>!', 'zero-bs-crm' ), $zbs->urls['products'] ), $zbs->acceptable_restricted_html ); ?></a>
<?php ##/WLREMOVE ?>
</p>

<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {
		echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
		zeroBSCRM_html_msg( 0, __( 'Settings Updated', 'zero-bs-crm' ) );
		echo '</div><br>'; }
}
?>

<div id="sbA">

	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=forms">
		<input type="hidden" name="editwplf" id="editwplf" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'zbs-update-settings-forms' );
		?>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th class="wmid"><?php esc_html_e( 'Forms Settings', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td class="wfieldname">
					<label for="wpzbscrm_usegcaptcha"><?php esc_html_e( 'Enable reCaptcha', 'zero-bs-crm' ); ?></label>
					<p><?php echo wp_kses( __( "This setting enables reCaptcha for the built-in CRM forms. If you'd like to use this to avoid spam, please sign up for a site key and secret <a href='https://www.google.com/recaptcha/admin#list' target='_blank'>here</a>.", 'zero-bs-crm' ), $zbs->acceptable_restricted_html ); ?></p>
					<p><?php esc_html_e( 'Note that only reCaptcha v2 is supported at this time.', 'zero-bs-crm' ); ?></p>
				</td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_usegcaptcha" id="wpzbscrm_usegcaptcha" value="1"
				<?php
				if ( isset( $settings['usegcaptcha'] ) && $settings['usegcaptcha'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_gcaptchasitekey"><?php esc_html_e( 'reCaptcha Site Key', 'zero-bs-crm' ); ?></label><br /></td>
				<td><input type="text" class="winput form-control" name="wpzbscrm_gcaptchasitekey" id="wpzbscrm_gcaptchasitekey" value="<?php echo empty( $settings['gcaptchasitekey'] ) ? '' : esc_attr( $settings['gcaptchasitekey'] ); ?>" placeholder="e.g. 6LekCyoTAPPPALWpHONFsRO5RQPOqoHfehdb4iqG" /></td>
			</tr>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_gcaptchasitesecret"><?php esc_html_e( 'reCaptcha Site Secret', 'zero-bs-crm' ); ?></label><br /></td>
				<td><input type="text" class="winput form-control" name="wpzbscrm_gcaptchasitesecret" id="wpzbscrm_gcaptchasitesecret" value="<?php echo empty( $settings['gcaptchasitesecret'] ) ? '' : esc_attr( $settings['gcaptchasitesecret'] ); ?>" placeholder="e.g. 6LekCyoTAAPPAJbQ1rq81117nMoo9y45fB3OLJVx" /></td>
			</tr>

			</tbody>

		</table>



		<table class="table table-bordered table-striped wtab">
			<tbody>

			<tr>
				<td class="wmid"><button type="submit" class="ui button primary"><?php esc_html_e( 'Save Settings', 'zero-bs-crm' ); ?></button></td>
			</tr>

			</tbody>
		</table>

	</form>

</div>
