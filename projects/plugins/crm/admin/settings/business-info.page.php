<?php
/*
!
 * Admin Page: Settings: Business Info Settings
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
	check_admin_referer( 'zbs-update-settings-bizinfo' );

	// moved from invoice builder settings -> biz info 16/7/18

	// } Invoice Chunks
	$updatedSettings['businessname'] = '';
	if ( isset( $_POST['businessname'] ) ) {
		$updatedSettings['businessname'] = zeroBSCRM_textProcess( $_POST['businessname'] );
	}
	$updatedSettings['businessyourname'] = '';
	if ( isset( $_POST['businessyourname'] ) ) {
		$updatedSettings['businessyourname'] = zeroBSCRM_textProcess( $_POST['businessyourname'] );
	}
	$updatedSettings['businessyouremail'] = '';
	if ( isset( $_POST['businessyouremail'] ) ) {
		$updatedSettings['businessyouremail'] = zeroBSCRM_textProcess( $_POST['businessyouremail'] );
	}
	$updatedSettings['businessyoururl'] = '';
	if ( isset( $_POST['businessyoururl'] ) ) {
		$updatedSettings['businessyoururl'] = zeroBSCRM_textProcess( $_POST['businessyoururl'] );
	}
	$updatedSettings['businesstel'] = '';
	if ( isset( $_POST['businesstel'] ) ) {
		$updatedSettings['businesstel'] = zeroBSCRM_textProcess( $_POST['businesstel'] );
	}

	// } Invoice Logo
	$updatedSettings['invoicelogourl'] = '';
	if ( isset( $_POST['wpzbscrm_invoicelogourl'] ) && ! empty( $_POST['wpzbscrm_invoicelogourl'] ) ) {
		$updatedSettings['invoicelogourl'] = sanitize_text_field( $_POST['wpzbscrm_invoicelogourl'] );
	}

	// } Social
	$updatedSettings['twitter'] = ''; if ( isset( $_POST['wpzbs_twitter'] ) ) {
		$updatedSettings['twitter'] = sanitize_text_field( $_POST['wpzbs_twitter'] );
		if ( substr( $updatedSettings['twitter'], 0, 1 ) == '@' ) {
			$updatedSettings['twitter'] = substr( $updatedSettings['twitter'], 1 );
		}
	}
	$updatedSettings['facebook'] = '';
	if ( isset( $_POST['wpzbs_facebook'] ) ) {
		$updatedSettings['facebook'] = sanitize_text_field( $_POST['wpzbs_facebook'] );
	}
	$updatedSettings['linkedin'] = '';
	if ( isset( $_POST['wpzbs_linkedin'] ) ) {
		$updatedSettings['linkedin'] = sanitize_text_field( $_POST['wpzbs_linkedin'] );
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

<p id="sbDesc"><?php esc_html_e( 'Set up your general business information. This is used across Jetpack CRM in features such as invoicing, mail campaigns, and email notifications.', 'zero-bs-crm' ); ?></p>

<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {
		echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
		zeroBSCRM_html_msg( 0, __( 'Settings Updated', 'zero-bs-crm' ) );
		echo '</div><br>'; }
}
?>

<div id="sbA">

<form method="post">
	<input type="hidden" name="editwplf" id="editwplf" value="1" />
	<?php
	// add nonce
	wp_nonce_field( 'zbs-update-settings-bizinfo' );
	?>
	<table class="table table-bordered table-striped wtab">

		<thead>

		<tr>
			<th colspan="2" class="wmid"><?php esc_html_e( 'Your Business Vitals', 'zero-bs-crm' ); ?>:</th>
		</tr>

		</thead>

		<tbody>

		<tr>
			<td class="wfieldname"><label for="businessname"><?php esc_html_e( 'Your Business Name', 'zero-bs-crm' ); ?>:</label></td>
			<td style="width:540px"><input type="text" class="winput form-control" name="businessname" id="businessname" value="<?php echo empty( $settings['businessname'] ) ? '' : esc_attr( $settings['businessname'] ); ?>" placeholder="e.g. Widget Co Ltd." /></td>
		</tr>


		<tr>
			<td class="wfieldname"><label for="wpzbscrm_invoicelogourl"><?php esc_html_e( 'Your Business Logo', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Enter an URL here, or upload a default logo to use on your invoices etc.', 'zero-bs-crm' ); ?></td>
			<td style="width:540px">
				<input style="width:90%;padding:10px;" name="wpzbscrm_invoicelogourl" id="wpzbscrm_invoicelogourl" class="form-control link" type="text" value="<?php echo empty( $settings['invoicelogourl'] ) ? '' : esc_attr( $settings['invoicelogourl'] ); ?>" />
				<button id="wpzbscrm_invoicelogourlAdd" class="button" type="button"><?php esc_html_e( 'Upload Image', 'zero-bs-crm' ); ?></button>
			</td>
		</tr>

		</tbody>
	</table>

	<table class="table table-bordered table-striped wtab">

		<thead>

		<tr>
			<th colspan="2" class="wmid"><?php esc_html_e( 'Your Full Business Information', 'zero-bs-crm' ); ?>:</th>
		</tr>

		</thead>


		<tr>
			<td class="wfieldname"><label for="businessyourname"><?php esc_html_e( 'Owner Name', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'The name of the business owner which will be shown on your invoices.', 'zero-bs-crm' ); ?></td>
			<td style="width:540px"><input type="text" class="winput form-control" name="businessyourname" id="businessyourname" value="<?php echo empty( $settings['businessyourname'] ) ? '' : esc_attr( $settings['businessyourname'] ); ?>" placeholder="e.g. John Doe" /></td>
		</tr>

		<tr>
			<td class="wfieldname"><label for="businessyouremail"><?php esc_html_e( 'Business Contact Email', 'zero-bs-crm' ); ?>:</label></td>
			<td style="width:540px"><input type="text" class="winput form-control" name="businessyouremail" id="businessyouremail" value="<?php echo empty( $settings['businessyouremail'] ) ? '' : esc_attr( $settings['businessyouremail'] ); ?>" placeholder="e.g. email@domain.com" /></td>
		</tr>

		<tr>
			<td class="wfieldname"><label for="businessyoururl"><?php esc_html_e( 'Business Website URL', 'zero-bs-crm' ); ?>:</label></td>
			<td style="width:540px"><input type="text" class="winput form-control" name="businessyoururl" id="businessyoururl" value="<?php echo empty( $settings['businessyoururl'] ) ? '' : esc_attr( $settings['businessyoururl'] ); ?>" placeholder="e.g. https://example.com" /></td>
		</tr>

		<tr>
			<td class="wfieldname"><label for="businesstel"><?php esc_html_e( 'Business Telephone Number', 'zero-bs-crm' ); ?>:</label></td>
			<td style="width:540px"><input type="text" class="winput form-control" name="businesstel" id="businesstel" value="<?php echo empty( $settings['businesstel'] ) ? '' : esc_attr( $settings['businesstel'] ); ?>" placeholder="" /></td>
		</tr>


		</tbody>

	</table>

	<table class="table table-bordered table-striped wtab">

		<thead>

		<tr>
			<th colspan="2" style="text-align:center">
				<strong><?php esc_html_e( 'Your Business Social Info', 'zero-bs-crm' ); ?>:</strong><br />
				<?php esc_html_e( 'Add your social accounts to optionally show them on your mail campaigns, etc.', 'zero-bs-crm' ); ?>
			</th>
		</tr>

		</thead>


		<tr>
			<td class="wfieldname"><label for="wpzbs_twitter"><?php esc_html_e( 'Twitter Handle', 'zero-bs-crm' ); ?>:</label></td>
			<td style="width:540px"><input type="text" class="winput form-control" name="wpzbs_twitter" id="wpzbs_twitter" value="<?php echo empty( $settings['twitter'] ) ? '' : esc_attr( $settings['twitter'] ); ?>" placeholder="e.g. twitter (no @)" /></td>
		</tr>

		<tr>
			<td class="wfieldname"><label for="wpzbs_facebook"><?php esc_html_e( 'Facebook Page', 'zero-bs-crm' ); ?>:</label></td>
			<td style="width:540px"><input type="text" class="winput form-control" name="wpzbs_facebook" id="wpzbs_facebook" value="<?php echo empty( $settings['facebook'] ) ? '' : esc_attr( $settings['facebook'] ); ?>" placeholder="e.g. facebookpagename" /></td>
		</tr>

		<tr>
			<td class="wfieldname"><label for="wpzbs_linkedin"><?php esc_html_e( 'LinkedIn ID', 'zero-bs-crm' ); ?>:</label></td>
			<td style="width:540px"><input type="text" class="winput form-control" name="wpzbs_linkedin" id="wpzbs_linkedin" value="<?php echo empty( $settings['linkedin'] ) ? '' : esc_attr( $settings['linkedin'] ); ?>" placeholder="e.g. linkedinco" /></td>
		</tr>
		<?php ##WLREMOVE ?>
		<tr>
			<th colspan="2" style="text-align:center;padding:1em">
				<strong><?php esc_html_e( "... and don't forget to follow Jetpack CRM on Twitter!", 'zero-bs-crm' ); ?></strong><br /><br />
				<a href="<?php echo esc_url( $zbs->urls['twitter'] ); ?>" class="ui green button" target="_blank"><i class="twitter icon"></i> @jetpackcrm</a><br /><br />
			</th>
		</tr>
		<?php ##/WLREMOVE ?>

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


<script type="text/javascript">

	jQuery(function(){


		// Uploader
		// http://stackoverflow.com/questions/17668899/how-to-add-the-media-uploader-in-wordpress-plugin (3rd answer)
		jQuery('#wpzbscrm_invoicelogourlAdd').on( 'click', function(e) {
			e.preventDefault();
			var image = wp.media({
				title: '<?php esc_html_e( 'Upload Image', 'zero-bs-crm' ); ?>',
				// mutiple: true if you want to upload multiple files at once
				multiple: false
			}).open()
				.on('select', function(e){

					// This will return the selected image from the Media Uploader, the result is an object
					var uploaded_image = image.state().get('selection').first();
					// We convert uploaded_image to a JSON object to make accessing it easier
					// Output to the console uploaded_image
					//console.log(uploaded_image);
					var image_url = uploaded_image.toJSON().url;
					// Let's assign the url value to the input field
					jQuery('#wpzbscrm_invoicelogourl').val(image_url);

				});
		});




	});


</script>

</div>
