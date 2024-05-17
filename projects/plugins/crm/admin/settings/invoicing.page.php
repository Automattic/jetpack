<?php
/*
!
 * Admin Page: Settings: Invoicing settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;  // } Req

$settings = $zbs->settings->getAll();

// } #WH OR - need these lists?

// } load currency list
global $whwpCurrencyList;
if ( ! isset( $whwpCurrencyList ) ) {
	require_once ZEROBSCRM_INCLUDE_PATH . 'wh.currency.lib.php';
}
/*
// } load country list
global $whwpCountryList;
if(!isset($whwpCountryList)) require_once( ZEROBSCRM_INCLUDE_PATH . 'wh.countrycode.lib.php');

*/

// } Act on any edits!
if ( isset( $_POST['editwplf'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

	// check nonce
	check_admin_referer( 'zbs-update-settings-invbuilder' );

	/*
	Moved to bizinfo settings page 16/7/18
	#} Invoice Logo
		$updatedSettings['invoicelogourl'] = ''; if (isset($_POST['wpzbscrm_invoicelogourl']) && !empty($_POST['wpzbscrm_invoicelogourl'])) $updatedSettings['invoicelogourl'] = sanitize_text_field($_POST['wpzbscrm_invoicelogourl']);

	#} Invoice Chunks
	$updatedSettings['businessname'] = ''; if (isset($_POST['businessname'])) $updatedSettings['businessname'] = zeroBSCRM_textProcess($_POST['businessname']);
	$updatedSettings['businessyourname'] = ''; if (isset($_POST['businessyourname'])) $updatedSettings['businessyourname'] = zeroBSCRM_textProcess($_POST['businessyourname']);
	$updatedSettings['businessyouremail'] = ''; if (isset($_POST['businessyouremail'])) $updatedSettings['businessyouremail'] = zeroBSCRM_textProcess($_POST['businessyouremail']);
	$updatedSettings['businessyoururl'] = ''; if (isset($_POST['businessyoururl'])) $updatedSettings['businessyoururl'] = zeroBSCRM_textProcess($_POST['businessyoururl']);
	*/

	$updatedSettings['reftype']    = '';
	$updatedSettings['defaultref'] = '';
	$updatedSettings['refprefix']  = '';
	$updatedSettings['refnextnum'] = '';
	$updatedSettings['refsuffix']  = '';
	$updatedSettings['reflabel']   = '';

	if ( isset( $_POST['reftype'] ) ) {
		$updatedSettings['reftype'] = zeroBSCRM_textProcess( $_POST['reftype'] );
	}

	if ( isset( $_POST['defaultref'] ) ) {
		$updatedSettings['defaultref'] = zeroBSCRM_textProcess( $_POST['defaultref'] );
	}

	if ( isset( $_POST['refprefix'] ) ) {
		$updatedSettings['refprefix'] = zeroBSCRM_textProcess( $_POST['refprefix'] );
	}
	if ( isset( $_POST['refsuffix'] ) ) {
		$updatedSettings['refsuffix'] = zeroBSCRM_textProcess( $_POST['refsuffix'] );
	}
	if ( isset( $_POST['refnextnum'] ) ) {
		$updatedSettings['refnextnum'] = zeroBSCRM_textProcess( $_POST['refnextnum'] );
	}

	if ( isset( $_POST['reflabel'] ) ) {
		$updatedSettings['reflabel'] = zeroBSCRM_textProcess( $_POST['reflabel'] );
	}

	$updatedSettings['businessextra'] = '';
	if ( isset( $_POST['businessextra'] ) ) {
		$updatedSettings['businessextra'] = zeroBSCRM_textProcess( $_POST['businessextra'] );
	}
	$updatedSettings['paymentinfo'] = '';
	if ( isset( $_POST['paymentinfo'] ) ) {
		$updatedSettings['paymentinfo'] = zeroBSCRM_textProcess( $_POST['paymentinfo'] );
	}
	$updatedSettings['paythanks'] = '';
	if ( isset( $_POST['paythanks'] ) ) {
		$updatedSettings['paythanks'] = zeroBSCRM_textProcess( $_POST['paythanks'] );
	}

	// } Invoice sending settings
	$updatedSettings['invfromemail'] = '';
	if ( isset( $_POST['invfromemail'] ) ) {
		$updatedSettings['invfromemail'] = zeroBSCRM_textProcess( $_POST['invfromemail'] );
	}
	$updatedSettings['invfromname'] = '';
	if ( isset( $_POST['invfromname'] ) ) {
		$updatedSettings['invfromname'] = zeroBSCRM_textProcess( $_POST['invfromname'] );
	}

	// } Hide Invoice ID
	$updatedSettings['invid'] = 0;
	if ( isset( $_POST['wpzbscrm_invid'] ) && ! empty( $_POST['wpzbscrm_invid'] ) ) {
		$updatedSettings['invid'] = 1;
	}

	// } Allow Invoice Hash (view and pay without being logged into the portal)
	// moved to client portal settings 3.0 - $updatedSettings['invhash'] = 0; if (isset($_POST['wpzbscrm_invhash']) && !empty($_POST['wpzbscrm_invhash'])) $updatedSettings['invhash'] = 1;

	// } Tax etc
	$updatedSettings['invtax'] = 0;
	if ( isset( $_POST['wpzbscrm_invtax'] ) && ! empty( $_POST['wpzbscrm_invtax'] ) ) {
		$updatedSettings['invtax'] = 1;
	}
	$updatedSettings['invdis'] = 0;
	if ( isset( $_POST['wpzbscrm_invdis'] ) && ! empty( $_POST['wpzbscrm_invdis'] ) ) {
		$updatedSettings['invdis'] = 1;
	}
	$updatedSettings['invpandp'] = 0;
	if ( isset( $_POST['wpzbscrm_invpandp'] ) && ! empty( $_POST['wpzbscrm_invpandp'] ) ) {
		$updatedSettings['invpandp'] = 1;
	}

	// } Statements
	$updatedSettings['statementextra'] = '';
	if ( isset( $_POST['zbsi_statementextra'] ) ) {
		$updatedSettings['statementextra'] = zeroBSCRM_textProcess( $_POST['zbsi_statementextra'] );
	}

	// templating
	$updatedSettings['inv_pdf_template'] = '';
	if ( isset( $_POST['inv_pdf_template'] ) && jpcrm_template_file_path( $_POST['inv_pdf_template'] ) ) {
		$updatedSettings['inv_pdf_template'] = zeroBSCRM_textProcess( $_POST['inv_pdf_template'] );
	}
	$updatedSettings['inv_portal_template'] = '';
	if ( isset( $_POST['inv_portal_template'] ) && jpcrm_template_file_path( $_POST['inv_portal_template'] ) ) {
		$updatedSettings['inv_portal_template'] = zeroBSCRM_textProcess( $_POST['inv_portal_template'] );
	}
	$updatedSettings['statement_pdf_template'] = '';
	if ( isset( $_POST['statement_pdf_template'] ) && jpcrm_template_file_path( $_POST['statement_pdf_template'] ) ) {
		$updatedSettings['statement_pdf_template'] = zeroBSCRM_textProcess( $_POST['statement_pdf_template'] );
	}

	// template additions, custom fields:
	$updatedSettings['invcustomfields'] = '';
	if ( isset( $_POST['jpcrm_invcustomfields'] ) ) {
		$updatedSettings['invcustomfields'] = zeroBSCRM_textProcess( $_POST['jpcrm_invcustomfields'] );
	}
	$updatedSettings['contactcustomfields'] = '';
	if ( isset( $_POST['jpcrm_contactcustomfields'] ) ) {
		$updatedSettings['contactcustomfields'] = zeroBSCRM_textProcess( $_POST['jpcrm_contactcustomfields'] );
	}
	$updatedSettings['companycustomfields'] = '';
	if ( isset( $_POST['jpcrm_companycustomfields'] ) ) {
		$updatedSettings['companycustomfields'] = zeroBSCRM_textProcess( $_POST['jpcrm_companycustomfields'] );
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

<p id="sbDesc"><?php esc_html_e( 'Tailor CRM invoicing to work for your business or organisation.', 'zero-bs-crm' ); ?></p>

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
		wp_nonce_field( 'zbs-update-settings-invbuilder' );
		?>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'General Invoice Settings:', 'zero-bs-crm' ); ?></th>
			</tr>

			</thead>
			<tbody>

			<tr>
				<td class="wfieldname">
						<label><?php esc_html_e( 'Reference type', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Select the default reference system for your invoices', 'zero-bs-crm' ); ?>
					<div style="margin-top:10px">
						<input type="radio" style="margin:0 5px 0 10px" class="winput form-control" name="reftype" id="reftype-manual" value="manual" <?php echo ( isset( $settings['reftype'] ) && $settings['reftype'] === 'manual' ? 'checked' : ! isset( $settings['reftype'] ) ) ? 'checked' : ''; ?>/>
						<label for="reftype-manual"><?php echo esc_html__( 'Manual input', 'zero-bs-crm' ); ?></label>
						<br>
						<input type="radio" style="margin:0 5px 0 10px" class="winput form-control" name="reftype" id="reftype-autonumber" value="autonumber" <?php echo isset( $settings['reftype'] ) && $settings['reftype'] === 'autonumber' ? 'checked' : ''; ?> /> <label for="reftype-autonumber"><?php echo esc_html__( 'Auto-generated reference', 'zero-bs-crm' ); ?></label>
					</div>
				</td>
				<td style="width:540px; vertical-align: middle" class="zbs-settings-custom-fields" >
					<div id="reftype-manual-block" class="reftype-block <?php echo ( isset( $settings['reftype'] ) && $settings['reftype'] === 'manual' ? 'reftype-set' : ! isset( $settings['reftype'] ) ) ? 'reftype-set' : ''; ?>">
						<div class="zbs-cf-type-autonumber-input-wrap">
							<div class="ui labeled input">
								<div class="ui label"><?php echo esc_html__( 'Default input', 'zero-bs-crm' ); ?></div>
								<input type="text" class="form-control zbs-generic-hide zbs-cf-type-autonumber" name="defaultref" value="<?php echo isset( $settings['defaultref'] ) ? esc_attr( $settings['defaultref'] ) : ''; ?>" placeholder="e.g. inv-" style="display: inline-block;">
							</div>
						</div>
					</div>
					<div id="reftype-autonumber-block" class="zbs-cf-type-autonumber-wrap zbs-generic-hide zbs-cf-type-autonumber reftype-block <?php echo isset( $settings['reftype'] ) && $settings['reftype'] === 'autonumber' ? 'reftype-set' : ''; ?>">

						<!-- Prefix -->
						<div class="zbs-cf-type-autonumber-input-wrap">
							<div class="ui labeled input">
								<div class="ui label"><?php echo esc_html__( 'Prefix', 'zero-bs-crm' ); ?></div>
								<input type="text" class="form-control zbs-generic-hide zbs-cf-type-autonumber" name="refprefix" value="<?php echo isset( $settings['refprefix'] ) ? esc_attr( $settings['refprefix'] ) : ''; ?>" placeholder="Prefix (e.g. ABC-)" style="display: inline-block;">
							</div>
						</div>
						<!-- Next number -->
						<div class="zbs-cf-type-autonumber-input-wrap">
							<div class="ui labeled input">
								<div class="ui label"><?php echo esc_html__( 'Next number', 'zero-bs-crm' ); ?></div>
								<input type="text" class="form-control zbs-generic-hide zbs-cf-type-autonumber" name="refnextnum" value="<?php echo isset( $settings['refnextnum'] ) ? esc_attr( $settings['refnextnum'] ) : '1'; ?>" placeholder="Next Number (e.g. 1)" style="display: inline-block;">
							</div>
						</div>
						<!-- Suffix -->
						<div class="zbs-cf-type-autonumber-input-wrap">
							<div class="ui labeled input">
								<div class="ui label"><?php echo esc_html__( 'Suffix', 'zero-bs-crm' ); ?></div>
								<input type="text" class="form-control zbs-generic-hide zbs-cf-type-autonumber" name="refsuffix" value="<?php echo isset( $settings['refsuffix'] ) ? esc_attr( $settings['refsuffix'] ) : ''; ?>" placeholder="Suffix (e.g. -FINI)" style="display: inline-block;">
							</div>
						</div>
					</div>
				</td>
			</tr>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_invtax"><?php esc_html_e( 'Enable tax:', 'zero-bs-crm' ); ?></label><br /><?php esc_html_e( 'Tick if you plan to charge tax.', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_invtax" id="wpzbscrm_invtax" value="1"
				<?php
				if ( isset( $settings['invtax'] ) && $settings['invtax'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_invdis"><?php esc_html_e( 'Enable discounts:', 'zero-bs-crm' ); ?></label><br /><?php esc_html_e( 'Tick if you want to add discounts.', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_invdis" id="wpzbscrm_invdis" value="1"
				<?php
				if ( isset( $settings['invdis'] ) && $settings['invdis'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_invpandp"><?php esc_html_e( 'Enable shipping:', 'zero-bs-crm' ); ?></label><br /><?php esc_html_e( 'Tick if you want to add shipping (postage and packaging).', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_invpandp" id="wpzbscrm_invpandp" value="1"
				<?php
				if ( isset( $settings['invpandp'] ) && $settings['invpandp'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>
			</tbody>
		</table>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Invoice Display Settings:', 'zero-bs-crm' ); ?></th>
			</tr>

			</thead>
			<tbody>

			<tr>
				<td class="wfieldname">
					<?php ##WLREMOVE ?>
					<div class="ui teal label right floated"><i class="circle info icon link"></i>  <a href="<?php echo esc_url( $zbs->urls['kbtemplatefiles'] ); ?>" target="_blank"><?php esc_html_e( 'Read more', 'zero-bs-crm' ); ?></a></div>
					<?php ##/WLREMOVE ?>
					<label for="inv_pdf_template"><?php esc_html_e( 'Invoice PDF Template', 'zero-bs-crm' ); ?>:</label><br />
					<?php esc_html_e( 'Select a template for invoice PDFs.', 'zero-bs-crm' ); ?>
				</td>
				<td>
				<?php

					// render a select containing template variant options
					jpcrm_render_setting_template_variant_block( 'invoices/invoice-pdf.html', 'inv_pdf_template', $settings );

				?>
				</td>
			</tr>

			<tr>
				<td class="wfieldname">
					<?php ##WLREMOVE ?>
					<div class="ui teal label right floated"><i class="circle info icon link"></i>  <a href="<?php echo esc_url( $zbs->urls['kbtemplatefiles'] ); ?>" target="_blank"><?php esc_html_e( 'Read more', 'zero-bs-crm' ); ?></a></div>
					<?php ##/WLREMOVE ?>
					<label for="inv_portal_template"><?php esc_html_e( 'Invoice Portal Template', 'zero-bs-crm' ); ?>:</label><br />
					<?php esc_html_e( 'Select a template for invoices on the Portal.', 'zero-bs-crm' ); ?>
				</td>
				<td>
				<?php

					// render a select containing template variant options
					jpcrm_render_setting_template_variant_block( 'invoices/portal-invoice.html', 'inv_portal_template', $settings );

				?>
				</td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="reflabel">
						<?php esc_html_e( 'Invoice reference label', 'zero-bs-crm' ); ?>:</label><br />
					<?php esc_html_e( "What should we call this ID? (The default label is 'Reference'.)", 'zero-bs-crm' ); ?>
				</td>
				<td>
					<input type="text" class="winput form-control" id="reflabel" name="reflabel" placeholder="e.g. Ref." value="<?php echo isset( $settings['reflabel'] ) ? esc_attr( $settings['reflabel'] ) : esc_attr__( 'Reference', 'zero-bs-crm' ); ?>"/>
				</td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="businessextra"><?php esc_html_e( 'Extra Invoice Info', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'This information is (optionally) added to your invoice', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><textarea class="winput form-control" name="businessextra" id="businessextra"  placeholder="<?php esc_attr_e( 'e.g. Your Address', 'zero-bs-crm' ); ?>" ><?php echo empty( $settings['businessextra'] ) ? '' : wp_kses( $settings['businessextra'], $zbs->acceptable_restricted_html ); ?></textarea></td>
			</tr>


			<tr>
				<td class="wfieldname"><label for="paymentinfo"><?php esc_html_e( 'Payment Info', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'This information is (optionally) added to your invoice', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><textarea class="winput form-control" name="paymentinfo" id="paymentinfo"  placeholder="<?php esc_attr_e( 'e.g. BACS details', 'zero-bs-crm' ); ?>" ><?php echo empty( $settings['paymentinfo'] ) ? '' : wp_kses( $settings['paymentinfo'], $zbs->acceptable_restricted_html ); ?></textarea></td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_invid"><?php esc_html_e( 'Hide Invoice ID', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Tick if you want to hide the invoice ID in the invoice editor. This is a system-generated ID that auto-increments.', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_invid" id="wpzbscrm_invid" value="1"
				<?php
				if ( isset( $settings['invid'] ) && $settings['invid'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="jpcrm_invcustomfields"><?php esc_html_e( 'Invoice custom fields to display', 'zero-bs-crm' ); ?>:</label><br /><?php _e( 'Enter the slug for each invoice custom field you wish to display, separated by commas (e.g. <code>approved,newbatch</code>).', 'zero-bs-crm' ); ?></td>
				<td style="width:540px">
					<input type="text" class="winput form-control" id="jpcrm_invcustomfields" name="jpcrm_invcustomfields" placeholder="" value="<?php echo isset( $settings['invcustomfields'] ) ? esc_attr( $settings['invcustomfields'] ) : ''; ?>"/>
					<?php

						// show available fields
						$contact_custom_fields = $zbs->DAL->getActiveCustomFields( array( 'objtypeid' => ZBS_TYPE_INVOICE ) );
					if ( is_array( $contact_custom_fields ) && count( $contact_custom_fields ) > 0 ) {

						echo '<div class="ui segment jpcrm-custom-field-builder" data-target="jpcrm_invcustomfields">' . esc_html__( 'Available custom fields:', 'zero-bs-crm' ) . '<br>';
						foreach ( $contact_custom_fields as $field_key => $field_label ) {
							echo '<span class="ui label teal" style="margin-top:3px">' . esc_html( $field_key ) . '</span>&nbsp;';
						}
						echo '</div>';
					}

					?>
				</td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="jpcrm_contactcustomfields"><?php esc_html_e( 'Contact custom fields to display', 'zero-bs-crm' ); ?>:</label><br /><?php _e( 'Enter slugs for each contact custom field you wish to display, separated by commas (e.g. <code>hobby,specialism</code>).', 'zero-bs-crm' ); ?></td>
				<td style="width:540px">
					<input type="text" class="winput form-control" id="jpcrm_contactcustomfields" name="jpcrm_contactcustomfields" placeholder="" value="<?php echo isset( $settings['contactcustomfields'] ) ? esc_attr( $settings['contactcustomfields'] ) : ''; ?>"/>
					<?php

						// show available fields
						$contact_custom_fields = $zbs->DAL->getActiveCustomFields( array( 'objtypeid' => ZBS_TYPE_CONTACT ) );
					if ( is_array( $contact_custom_fields ) && count( $contact_custom_fields ) > 0 ) {

						echo '<div class="ui segment jpcrm-custom-field-builder" data-target="jpcrm_contactcustomfields">' . esc_html__( 'Available custom fields:', 'zero-bs-crm' ) . '<br>';
						foreach ( $contact_custom_fields as $field_key => $field_label ) {
							echo '<span class="ui label teal" style="margin-top:3px">' . esc_html( $field_key ) . '</span>&nbsp;';
						}
						echo '</div>';
					}

					?>
				</td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="jpcrm_companycustomfields"><?php esc_html_e( 'Company custom fields to display', 'zero-bs-crm' ); ?>:</label><br /><?php _e( 'Enter slugs for each company custom field you wish to display, separated by commas (e.g. <code>division,area</code>).', 'zero-bs-crm' ); ?></td>
				<td style="width:540px">
					<input type="text" class="winput form-control" id="jpcrm_companycustomfields" name="jpcrm_companycustomfields" placeholder="" value="<?php echo isset( $settings['companycustomfields'] ) ? esc_attr( $settings['companycustomfields'] ) : ''; ?>"/>
					<?php

						// show available fields
						$company_custom_fields = $zbs->DAL->getActiveCustomFields( array( 'objtypeid' => ZBS_TYPE_COMPANY ) );
					if ( is_array( $company_custom_fields ) && count( $company_custom_fields ) > 0 ) {

						echo '<div class="ui segment jpcrm-custom-field-builder" data-target="jpcrm_companycustomfields">' . esc_html__( 'Available custom fields:', 'zero-bs-crm' ) . '<br>';
						foreach ( $company_custom_fields as $field_key => $field_label ) {
							echo '<span class="ui label teal" style="margin-top:3px">' . esc_html( $field_key ) . '</span>&nbsp;';
						}
						echo '</div>';
					}

					?>
				</td>
			</tr>

			</tbody>

		</table>


		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Statement Settings:', 'zero-bs-crm' ); ?></th>
			</tr>

			</thead>
			<tbody>

			<tr>
				<td class="wfieldname"><label for="zbsi_statementextra"><?php esc_html_e( 'Extra Statement Info', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'This information is (optionally) added to your statements (e.g. How to pay)', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><textarea class="winput form-control" name="zbsi_statementextra" id="zbsi_statementextra"  placeholder="<?php esc_attr_e( 'e.g. BACS details', 'zero-bs-crm' ); ?>" ><?php echo empty( $settings['statementextra'] ) ? '' : wp_kses( $settings['statementextra'], $zbs->acceptable_restricted_html ); ?></textarea></td>
			</tr>

			<tr>
				<td class="wfieldname">
					<?php ##WLREMOVE ?>
					<div class="ui teal label right floated"><i class="circle info icon link"></i>  <a href="<?php echo esc_url( $zbs->urls['kbtemplatefiles'] ); ?>" target="_blank"><?php esc_html_e( 'Read more', 'zero-bs-crm' ); ?></a></div>
					<?php ##/WLREMOVE ?>
					<label for="statement_pdf_template"><?php esc_html_e( 'Statement PDF Template', 'zero-bs-crm' ); ?>:</label><br />
					<?php esc_html_e( 'Select a template for statement PDFs.', 'zero-bs-crm' ); ?>
				</td>
				<td>
				<?php

					// render a select containing template variant options
					jpcrm_render_setting_template_variant_block( 'invoices/statement-pdf.html', 'statement_pdf_template', $settings );

				?>
				</td>
			</tr>


			</tbody>

		</table>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Invoice Portal Settings:', 'zero-bs-crm' ); ?></th>
			</tr>

			</thead>

			<tbody>


			<tr>
				<td class="wfieldname"><label for="paythanks"><?php esc_html_e( 'Thank You', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'If text is specified, it will be shown after a user pays for their invoice via portal.', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><textarea class="winput form-control" name="paythanks" id="paythanks"  placeholder="<?php esc_attr_e( 'e.g. Thank you for your custom. If you have any questions let us know', 'zero-bs-crm' ); ?>" ><?php echo empty( $settings['paythanks'] ) ? '' : wp_kses( $settings['paythanks'], $zbs->acceptable_restricted_html ); ?></textarea></td>
			</tr>

			<tr>
				<td colspan="2">
					<p style="text-align:center"><?php esc_html_e( 'Looking for easy-access link settings? You can turn configure those via the Client Portal settings page.', 'zero-bs-crm' ); ?></p>
					<p style="text-align:center">
						<a href="<?php echo jpcrm_esc_link( $zbs->slugs['settings'] ); ?>&tab=clients" class="ui mini button blue"><?php esc_html_e( 'View Client Portal Settings', 'zero-bs-crm' ); ?></a>
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


	<script type="text/javascript">

		jQuery(function(){

			jQuery('#wpzbscrm_invpro_pay').on( 'change', function(){

				if (jQuery(this).val() == "1"){
					jQuery('.zbscrmInvProPayPalReq').hide();
					jQuery('.zbscrmInvProStripeReq').show();
				} else {
					jQuery('.zbscrmInvProPayPalReq').show();
					jQuery('.zbscrmInvProStripeReq').hide();
				}


			});

			jQuery( '[name="reftype"]' ).on( 'change', function() {
				let reftype = jQuery( '[name="reftype"]:checked' ).val();
				jQuery( '.reftype-set' ).removeClass( 'reftype-set' );
				jQuery( '#reftype-' + reftype + '-block' ).addClass( 'reftype-set' );
			} );

		});


	</script>

</div>
