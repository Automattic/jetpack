<?php
/*
!
 * Admin Page: Settings: Company settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;  // } Req

// } Act on any edits!
if ( zeroBSCRM_isZBSAdminOrAdmin() && isset( $_POST['editcompanysettings'] ) ) {

	// check nonce
	check_admin_referer( 'jpcrm-update-settings-company' );

	// get setting - label
	$label = 'co';
	if ( isset( $_POST['jpcrm_setting_coororg'] ) ) {

		if ( isset( $_POST['jpcrm_setting_coororg'] ) && ! empty( $_POST['jpcrm_setting_coororg'] ) && $_POST['jpcrm_setting_coororg'] == 'org' ) {
			$label = 'org';
		}
		if ( isset( $_POST['jpcrm_setting_coororg'] ) && ! empty( $_POST['jpcrm_setting_coororg'] ) && $_POST['jpcrm_setting_coororg'] == 'domain' ) {
			$label = 'domain';
		}
	}

	// update
	$zbs->settings->update( 'coororg', $label );

	// get setting - statuses
	$customisedFields = $zbs->settings->get( 'customisedfields' );
	$companyStatusStr = '';
	if ( isset( $_POST['jpcrm-status-companies'] ) && ! empty( $_POST['jpcrm-status-companies'] ) ) {
		$companyStatusStr = sanitize_text_field( $_POST['jpcrm-status-companies'] );
	}

	// } any here? or 1?
	if ( strpos( $companyStatusStr, ',' ) > -1 ) {

		// } Trim them...
		$zbsStatusArr        = array();
		$zbsStatusUncleanArr = explode( ',', $companyStatusStr );
		foreach ( $zbsStatusUncleanArr as $x ) {
			$z = trim( $x );
			if ( ! empty( $z ) ) {
				$zbsStatusArr[] = $z;
			}
		}

		$customisedFields['companies']['status'][1] = implode( ',', $zbsStatusArr ); // $zbsStatusArr;

	} else {

		// } only 1? or empty?
		if ( ! empty( $companyStatusStr ) ) {
			$customisedFields['companies']['status'][1] = $companyStatusStr;
		}
	}

	$zbs->settings->update( 'customisedfields', $customisedFields );

}

// reget
$label            = $zbs->settings->get( 'coororg' );
$customisedFields = $zbs->settings->get( 'customisedfields' );

?>

<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {
		echo zeroBSCRM_UI2_messageHTML( 'success', __( 'Settings Updated', 'zero-bs-crm', '' ) );
	}
}
?>

<div id="sbA">
	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=companies" id="jpcrmcompanysettingsform">
		<input type="hidden" name="editcompanysettings" id="editcompanysettings" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'jpcrm-update-settings-company' );
		?>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'General B2B Settings', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>
			<tr>
				<td class="wfieldname"><label for="jpcrm_setting_coororg"><?php esc_html_e( 'Company Label', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Use the label "Company" or "Organisation" for your B2B setup?', 'zero-bs-crm' ); ?></td>
				<td><select class="winput short" name="jpcrm_setting_coororg" id="jpcrm_setting_coororg">
						<option value="co"
						<?php
						if ( isset( $label ) && $label == 'co' ) {
							echo ' selected="selected"';}
						?>
						><?php esc_html_e( 'Company', 'zero-bs-crm' ); ?></option>
						<option value="org"
						<?php
						if ( isset( $label ) && $label == 'org' ) {
							echo ' selected="selected"';}
						?>
						><?php esc_html_e( 'Organisation', 'zero-bs-crm' ); ?></option>
						<option value="domain"
						<?php
						if ( isset( $label ) && $label == 'domain' ) {
							echo ' selected="selected"';}
						?>
						><?php esc_html_e( 'Domain', 'zero-bs-crm' ); ?></option>
					</select>

				</td>
			</tr>
			</tbody>

		</table>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th class="wmid"><?php esc_html_e( 'Company Field Options', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td style="padding:2%;">

					<table class="table table-bordered table-striped wtab">
						<tbody id="jpcrm-statusprefix-custom-fields">



						<tr>
							<td width="94">
								<label for="jpcrm-status-companies"><?php esc_html_e( 'Company Status', 'zero-bs-crm' ); ?></label>
							</td>
							<td>
								<?php

								// } retrieve value as simple CSV for now - simplistic at best.
								$companyStatusStr = '';
								// } stored here: $settings['customisedfields']
								if ( isset( $customisedFields['companies']['status'] ) && is_array( $customisedFields['companies']['status'] ) ) {
									$companyStatusStr = $customisedFields['companies']['status'][1];
								}
								if ( empty( $companyStatusStr ) ) {
									// } Defaults:
									global $zbsCompanyFields;
									if ( is_array( $zbsCompanyFields ) ) {
										$companyStatusStr = implode( ',', $zbsCompanyFields['status'][3] );
									}
								}

								?>
								<input type="text" name="jpcrm-status-companies" id="jpcrm-status-companies" value="<?php echo esc_attr( $companyStatusStr ); ?>" class="form-control" />
								<p style="margin-top:4px"><?php esc_html_e( 'Default is', 'zero-bs-crm' ); ?>:<br /><span style="background:#ceeaea;padding:0 4px">Lead,Customer,Refused,Blacklisted</span></p>
							</td>
						</tr>

						</tbody>
					</table>


				</td>
			</tr>

			</tbody>

		</table>

		<table class="table table-bordered table-striped wtab">
			<tbody>

			<tr>
				<td class="wmid">
					<button type="submit" class="ui button primary"><?php esc_html_e( 'Save Settings', 'zero-bs-crm' ); ?></button>
				</td>
			</tr>

			</tbody>
		</table>

	</form>

	<div style="text-align: center;margin-top:2.5em">
		<span class="ui label"><?php esc_html_e( 'Other Tools:', 'zero-bs-crm' ); ?></span> <a href="<?php echo jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=customfields#zbscrm-companies-custom-fields' ); ?>"><?php esc_html_e( 'Manage Custom Fields', 'zero-bs-crm' ); ?></a>
	</div>

</div>
