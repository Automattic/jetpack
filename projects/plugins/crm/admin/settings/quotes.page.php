<?php
/*
!
 * Admin Page: Settings: Quotes settings
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
	check_admin_referer( 'zbs-update-settings-quotebuilder' );

	$updatedSettings['usequotebuilder'] = 0;
	if ( isset( $_POST['wpzbscrm_usequotebuilder'] ) && ! empty( $_POST['wpzbscrm_usequotebuilder'] ) ) {
		$updatedSettings['usequotebuilder'] = 1;
	}

	// wp_templating_constants()
	$updatedSettings['quote_pdf_template'] = '';
	if ( isset( $_POST['quote_pdf_template'] ) && jpcrm_template_file_path( $_POST['quote_pdf_template'] ) ) {
		$updatedSettings['quote_pdf_template'] = zeroBSCRM_textProcess( $_POST['quote_pdf_template'] );
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
<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {
		echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
		zeroBSCRM_html_msg( 0, __( 'Settings Updated', 'zero-bs-crm' ) );
		echo '</div><br>'; }
}
?>

<div id="sbA">

	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=quotebuilder">
		<input type="hidden" name="editwplf" id="editwplf" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'zbs-update-settings-quotebuilder' );
		?>
		<style>td{width:50%;}</style>
		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Quotes Settings', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_usequotebuilder"><?php esc_html_e( 'Enable Quote Builder', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Disabling this will remove the quote-writing element of Quotes. This is useful if you\'re only logging quotes, not writing them.', 'zero-bs-crm' ); ?>.</td>
				<td style=""><input type="checkbox" class="winput form-control" name="wpzbscrm_usequotebuilder" id="wpzbscrm_usequotebuilder" value="1"
				<?php
				if ( isset( $settings['usequotebuilder'] ) && $settings['usequotebuilder'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>
			<tr>
				<td class="wfieldname">
					<div class="ui teal label right floated"><i class="circle info icon link"></i>  <a href="<?php echo esc_url( $zbs->urls['kbtemplatefiles'] ); ?>" target="_blank"><?php esc_html_e( 'Read more', 'zero-bs-crm' ); ?></a></div>
					<label for="quote_pdf_template"><?php esc_html_e( 'Quote PDF Template', 'zero-bs-crm' ); ?>:</label><br />
					<?php esc_html_e( 'Select a template for quote PDFs.', 'zero-bs-crm' ); ?>                                
				</td>
				<td>
				<?php

					// render a select containing template variant options
					jpcrm_render_setting_template_variant_block( 'quotes/quote-pdf.html', 'quote_pdf_template', $settings );

				?>
				</td>
			</tr>


			<tr>
				<td colspan="2">
					<p style="text-align:center"><?php esc_html_e( 'Looking for easy-access quote links? You can now turn easy-access links on via the client portal settings page', 'zero-bs-crm' ); ?></p>
					<p style="text-align:center">
						<a href="<?php echo esc_url_raw( jpcrm_esc_link( $zbs->slugs['settings'] ) . '&tab=clients' ); ?>" class="ui mini button blue"><?php esc_html_e( 'View Client Portal Settings', 'zero-bs-crm' ); ?></a>
						<?php ##WLREMOVE ?>
						<a href="<?php echo esc_url( $zbs->urls['easyaccessguide'] ); ?>" target="_blank" class="ui mini button green"><?php esc_html_e( 'View Easy-Access Links Guide', 'zero-bs-crm' ); ?></a>
						<?php ##/WLREMOVE ?>
					</p>
				</td>
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


	<div style="text-align: center;margin-top:2.5em">
		<span class="ui label"><?php esc_html_e( 'Other Tools:', 'zero-bs-crm' ); ?></span> <a href="<?php echo jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=customfields#zbscrm-quotes-custom-fields' ); ?>"><?php esc_html_e( 'Manage Custom Fields', 'zero-bs-crm' ); ?></a>
	</div>

</div>
