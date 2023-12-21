<?php
/*
!
 * Admin Page: Settings: Client Portal settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
global $wpdb, $zbs; // } Req

if ( ! zeroBSCRM_isExtensionInstalled( 'portal' ) ) {
	global $zbs;
	?>
		<div class="ui grid client-styles-pro" style="margin-top:20px;">
				<div class="column">
				<div class="segment ui">
					<?php
						echo zeroBSCRM_UI2_messageHTML(
							'warning',
							'You do not have the Client Portal Installed',
							'You do not currently have the Client Portal enabled, you can enable it <a href="' . jpcrm_esc_link( $zbs->slugs['modules'] ) . '" target="_blank">here</a>.'
						);
					?>
				</div>
				</div>
		</div>
	<?php
	return;
}

$settings = $zbs->settings->getAll();

// } Act on any edits!
if ( isset( $_POST['editwplf'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

	// check nonce
	check_admin_referer( 'zbs-update-settings-clients' );

	$updatedSettings['portalusers'] = 0;
	if ( isset( $_POST['wpzbscrm_portalusers'] ) && ! empty( $_POST['wpzbscrm_portalusers'] ) ) {
		$updatedSettings['portalusers'] = 1;
	}

	$updatedSettings['portalpage'] = 0;
	if ( isset( $_POST['wpzbscrm_portalpage'] ) && ! empty( $_POST['wpzbscrm_portalpage'] ) ) {
		$updatedSettings['portalpage'] = (int) sanitize_text_field( $_POST['wpzbscrm_portalpage'] );
	}

	// any extra roles to assign?
	$updatedSettings['portalusers_extrarole'] = '';
	if ( isset( $_POST['wpzbscrm_portalusers_extrarole'] ) && ! empty( $_POST['wpzbscrm_portalusers_extrarole'] ) ) {
		$updatedSettings['portalusers_extrarole'] = sanitize_text_field( $_POST['wpzbscrm_portalusers_extrarole'] );
	}

	// status based auto-gen

	/*
	WH - should this be here? */
	// } retrieve value as simple CSV for now - simplistic at best.
	$zbsStatusStr = '';
	// } stored here: $settings['customisedfields']
	if ( isset( $settings['customisedfields']['customers']['status'] ) && is_array( $settings['customisedfields']['customers']['status'] ) ) {
		$zbsStatusStr = $settings['customisedfields']['customers']['status'][1];
	}
	if ( empty( $zbsStatusStr ) ) {
		// } Defaults:
		global $zbsCustomerFields;
		if ( is_array( $zbsCustomerFields ) ) {
			$zbsStatusStr = implode( ',', $zbsCustomerFields['status'][3] );
		}
	}

	// cycle through + check post
	$zbsStatusSetting          = 'all';
	$zbsStatusSettingPotential = array();
	$zbsStatuses               = explode( ',', $zbsStatusStr );
	if ( is_array( $zbsStatuses ) ) {
		foreach ( $zbsStatuses as $statusStr ) {

			// permify
			$statusKey = strtolower( str_replace( ' ', '_', str_replace( ':', '_', $statusStr ) ) );

			// check post
			if ( isset( $_POST[ 'wpzbscrm_portaluser_group_' . $statusKey ] ) ) {
				$zbsStatusSettingPotential[] = $statusKey;
			}
		}
	}

	if ( count( $zbsStatusSettingPotential ) > 0 ) {

		// set that
		$zbsStatusSetting = $zbsStatusSettingPotential;

	}

	// update
	$updatedSettings['portalusers_status'] = $zbsStatusSetting;

	$updatedSettings['zbs_portal_email_content'] = '';
	if ( isset( $_POST['zbs_portal_email_content'] ) && ! empty( $_POST['zbs_portal_email_content'] ) ) {
		$updatedSettings['zbs_portal_email_content'] = wp_kses_post( nl2br( $_POST['zbs_portal_email_content'] ) );
	}

	// 2.84 wh
	$updatedSettings['portal_hidefields'] = '';
	if ( isset( $_POST['wpzbscrm_portal_hidefields'] ) && ! empty( $_POST['wpzbscrm_portal_hidefields'] ) ) {
		$updatedSettings['portal_hidefields'] = sanitize_text_field( $_POST['wpzbscrm_portal_hidefields'] );
	}

	// } 2.86 ms
	$updatedSettings['portalpage'] = 0;
	if ( isset( $_POST['wpzbscrm_portalpage'] ) && ! empty( $_POST['wpzbscrm_portalpage'] ) ) {
		$updatedSettings['portalpage'] = (int) sanitize_text_field( $_POST['wpzbscrm_portalpage'] );
	}

	// } 3.0 - Easy Access Links (hash urls)
	$updatedSettings['easyaccesslinks'] = 0;
	if ( isset( $_POST['wpzbscrm_easyaccesslinks'] ) && ! empty( $_POST['wpzbscrm_easyaccesslinks'] ) ) {
		$updatedSettings['easyaccesslinks'] = 1;
	}

	$updatedSettings['portal_transactions_show_status'] = '';
	if ( isset( $_POST['wpzbscrm_portal_transactions_show_status'] ) && ! empty( $_POST['wpzbscrm_portal_transactions_show_status'] ) ) {
		$updatedSettings['portal_transactions_show_status'] = 1;
	}

	// } Brutal update
	foreach ( $updatedSettings as $k => $v ) {
		$zbs->settings->update( $k, $v );
	}

	// } $msg out!
	$sbupdated = true;

	// } Allow portal pro to hook into the save routine
	do_action( 'zbs_portal_settings_save' );

	// } Reload
	$settings = $zbs->settings->getAll();

}

##WLREMOVE
if ( current_user_can( 'admin_zerobs_manage_options' ) && ! zeroBSCRM_isExtensionInstalled( 'clientportalpro' ) ) {

	// upsell button
	?>
	<a href="<?php echo esc_url( $zbs->urls['extcpp'] ); ?>" target="_blank" class="ui button orange right floated"><?php esc_html_e( 'Get Portal PRO', 'zero-bs-crm' ); ?></a>
	<?php

}
##/WLREMOVE

?>

<p id="sbDesc"><?php esc_html_e( 'Configure your Client Portal settings here.', 'zero-bs-crm' ); ?></p>
<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {
		echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
		zeroBSCRM_html_msg( 0, __( 'Settings Updated', 'zero-bs-crm' ) );
		echo '</div><br>'; }
}
?>

<div id="sbA">
	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=clients">
		<input type="hidden" name="editwplf" id="editwplf" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'zbs-update-settings-clients' );
		?>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Client Portal Settings', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td class="wfieldname">

					<?php ##WLREMOVE ?>
					<div class="ui teal label right floated"><i class="circle info icon link"></i>  <a href="<?php echo esc_url( $zbs->urls['kbclientportal'] ); ?>" target="_blank"><?php esc_html_e( 'Read more', 'zero-bs-crm' ); ?></a></div>
					<?php ##/WLREMOVE ?>
					<label for="wpzbscrm_portalpage"><?php esc_html_e( 'Client Portal page', 'zero-bs-crm' ); ?></label><br /><?php esc_html_e( 'Select the page with your client portal shortcode.', 'zero-bs-crm' ); ?>
				</td>
				<td>
					<?php

					// reget
					$portalPage = (int) zeroBSCRM_getSetting( 'portalpage', true );

					// catch portal recreate
					if ( isset( $_GET['recreateportalpage'] ) && isset( $_GET['portalPageNonce'] ) && wp_verify_nonce( $_GET['portalPageNonce'], 'recreate-portal-page' ) ) {

						// recreate
						$portalPage = zeroBSCRM_portal_checkCreatePage();

						if ( ! empty( $portalPage ) && $portalPage > 0 ) {

							// success
							$newCPPageURL = admin_url( 'post.php?post=' . $portalPage . '&action=edit' );
							echo zeroBSCRM_UI2_messageHTML( 'info', __( 'Portal Page Created', 'zero-bs-crm' ), __( 'CRM successfully created a new page for the Client Portal.', 'zero-bs-crm' ) . '<br /><br /><a href="' . $newCPPageURL . '" class="ui button primary">' . __( 'View Portal Page', 'zero-bs-crm' ) . '</a>', 'info', 'new-portal-page' );

						} else {

							// failed
							echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'Portal Page Was Not Created', 'zero-bs-crm' ), __( 'CRM could not create a new page for the Client Portal. If this persists, please contact support.', 'zero-bs-crm' ), 'info', 'new-portal-page' );

						}
					}

					$args = array(
						'name'             => 'wpzbscrm_portalpage',
						'id'               => 'wpzbscrm_portalpage',
						'show_option_none' => __( 'No Portal Page Found!', 'zero-bs-crm' ),
					);
					if ( $portalPage != -1 ) {
						$args['selected'] = (int) $portalPage;
					} else {
						$args['selected'] = 0;
					}
					wp_dropdown_pages( $args );

					// recreate link
					$recreatePortalPageURL = wp_nonce_url( admin_url( 'admin.php?page=' . $zbs->slugs['settings'] . '&tab=clients&recreateportalpage=1' ), 'recreate-portal-page', 'portalPageNonce' );

					// detect missing page (e.g. it hasn't autocreated for some reason, or they deleted), and offer a 'make page' button
					if ( zeroBSCRM_portal_getPortalPage() == -1 ) {

						echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'No Portal Page Found!', 'zero-bs-crm' ), __( 'CRM could not find a published WordPress page associated with the Client Portal. Please recreate this page to continue using the Client Portal.', 'zero-bs-crm' ) . '<br /><br /><a href="' . $recreatePortalPageURL . '" class="ui button primary">' . __( 'Recreate Portal Page', 'zero-bs-crm' ) . '</a>', 'info', 'no-portal-page' );

					} else {

						// no need really?

					}
					?>
				</td>
			</tr>

			<tr>
				<td class="wfieldname">
					<?php ##WLREMOVE ?>
					<div class="ui teal label right floated"><i class="circle info icon link"></i>  <a href="<?php echo esc_url( $zbs->urls['kbeasyaccess'] ); ?>" target="_blank"><?php esc_html_e( 'Read more', 'zero-bs-crm' ); ?></a></div>
					<?php ##/WLREMOVE ?>
					<label for="wpzbscrm_easyaccesslinks"><?php esc_html_e( 'Allow Easy-Access links', 'zero-bs-crm' ); ?></label><br /><?php esc_html_e( 'Tick to allow logged-out users to view quotes and invoices via a secure hash URL.', 'zero-bs-crm' ); ?>
				</td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_easyaccesslinks" id="wpzbscrm_easyaccesslinks" value="1"
				<?php
				if ( isset( $settings['easyaccesslinks'] ) && $settings['easyaccesslinks'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_portal_transactions_show_status"><?php esc_html_e( 'Show transaction status', 'zero-bs-crm' ); ?></label><br /><?php esc_html_e( 'Tick to show the transaction status in the transactions page in Client Portal.', 'zero-bs-crm' ); ?>
				</td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_portal_transactions_show_status" id="wpzbscrm_portal_transactions_show_status" value="1"
				<?php
				if ( isset( $settings['portal_transactions_show_status'] ) && $settings['portal_transactions_show_status'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>

			</tbody>
		</table>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Client Portal User Accounts', 'zero-bs-crm' ); ?></th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td colspan="2" class="wmid">
					<?php
					esc_html_e( 'WordPress users are required for each contact to access to your Client Portal if Easy-Access links are not enabled.', 'zero-bs-crm' );
					echo '<br>';
					esc_html_e( 'You can generate these manually from any contact record, or automatically by enabling the setting below.', 'zero-bs-crm' );
					?>
					<hr />
					<?php esc_html_e( 'The following options all concern the automatic creation of client portal user accounts.', 'zero-bs-crm' ); ?>
					<div class="zbs-explainer-ico"><i class="fa fa-id-card" aria-hidden="true"></i></div>
				</td>
			</tr>


			<tr>
				<td class="wfieldname">
					<?php ##WLREMOVE ?>
					<div class="ui teal label right floated"><i class="circle info icon link"></i>  <a href="<?php echo esc_url( $zbs->urls['kbdisablewelcome'] ); ?>" target="_blank"><?php esc_html_e( 'Read more', 'zero-bs-crm' ); ?></a></div>
					<?php ##/WLREMOVE ?>
					<label for="wpzbscrm_portalusers"><?php esc_html_e( 'Generate WordPress users for new contacts', 'zero-bs-crm' ); ?></label><br /><?php esc_html_e( "By default this will automatically email the new contact a welcome email as soon as they're added. If you prefer to not have this email sent, you can disable this email template.", 'zero-bs-crm' ); ?>
				</td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_portalusers" id="wpzbscrm_portalusers" value="1"
				<?php
				if ( isset( $settings['portalusers'] ) && $settings['portalusers'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>

			<tr>
				<td class="wfieldname"><label><?php esc_html_e( 'Only generate users for statuses', 'zero-bs-crm' ); ?></label><br />
					<br />
					<?php
					// reword suggested by omar - https://zerobscrmcommunity.slack.com/archives/C64JJ5B5W/p1544775973033900
					// _e('If automatically generating users, you can restrict which users automatically get accounts here, (based on contact status).',"zero-bs-crm");
					// _e('This will automatically disable/enable client portal accounts based on status changes.',"zero-bs-crm");
					esc_html_e( 'Only users with the following status will have a portal account generated for them. If the status is not checked a user will not be generated. If the contact already has a portal account and they are moved to an unchecked status, their portal account will be disabled until they are moved to another checked status.', 'zero-bs-crm' );
					?>
					<br /><br /><strong><?php esc_html_e( 'Note: This only applies when Automatic Generation is ticked above.', 'zero-bs-crm' ); ?></strong></td>
				<td style="width:540px" id="zbs-portal-users-statuses">
					<?php

					// } retrieve value as simple CSV for now - simplistic at best.
					$zbsStatusStr = '';
					// } stored here: $settings['customisedfields']
					if ( isset( $settings['customisedfields']['customers']['status'] ) && is_array( $settings['customisedfields']['customers']['status'] ) ) {
						$zbsStatusStr = $settings['customisedfields']['customers']['status'][1];
					}
					if ( empty( $zbsStatusStr ) ) {
						// } Defaults:
						global $zbsCustomerFields;
						if ( is_array( $zbsCustomerFields ) ) {
							$zbsStatusStr = implode( ',', $zbsCustomerFields['status'][3] );
						}
					}

					// setting - if set this'll be:
					// "all"
					// or array of status perms :)
					$selectedStatuses = 'all';
					if ( isset( $settings['portalusers_status'] ) ) {
						$selectedStatuses = $settings['portalusers_status'];
					}

					$zbsStatuses = explode( ',', $zbsStatusStr );
					if ( is_array( $zbsStatuses ) ) {

						// each status
						foreach ( $zbsStatuses as $statusStr ) {

							// permify
							$statusKey = strtolower( str_replace( ' ', '_', str_replace( ':', '_', $statusStr ) ) );

							// checked?
							$checked = false;
							if (
								( ! is_array( $selectedStatuses ) && $selectedStatuses == 'all' )
								||
								( is_array( $selectedStatuses ) && in_array( $statusKey, $selectedStatuses ) )
							) {
								$checked = true;
							}

							?>
							<div class="zbs-status">
							<input type="checkbox" value="1" name="wpzbscrm_portaluser_group_<?php echo esc_attr( $statusKey ); ?>" id="wpzbscrm_portaluser_group_<?php echo esc_attr( $statusKey ); ?>"
																										<?php
																										if ( $checked ) {
																											echo ' checked="checked"';}
																										?>
							/>
							<label for="wpzbscrm_portaluser_group_<?php echo esc_attr( $statusKey ); ?>"><?php echo esc_html( $statusStr ); ?></label>
							</div>
							<?php

						}
					} else {
						esc_html_e( 'No Statuses Found', 'zero-bs-crm' );
					}

					?>
				</td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_portalusers_extrarole"><?php esc_html_e( 'Assign extra role when generating users', 'zero-bs-crm' ); ?></label><br /><?php esc_html_e( "If you'd like to add a secondary role to users which Jetpack CRM creates automatically, you can do so here. This may be useful when integrating with third-party plugins.", 'zero-bs-crm' ); ?></td>
				<td style="width:540px">
					<?php

					$roles = zeroBSCRM_getWordPressRoles();

					if ( is_array( $roles ) && count( $roles ) > 0 ) {

						?>
						<select name="wpzbscrm_portalusers_extrarole" id="wpzbscrm_portalusers_extrarole">
						<option value=""><?php esc_html_e( 'None', 'zero-bs-crm' ); ?></option>
						<option disabled="disabled" value="">====</option>
						<?php

						foreach ( $roles as $roleKey => $roleArr ) {

							// for their protection, gonna NOT include admin roles here..
							$blocked_array = array( 'zerobs_admin', 'administrator' );
							// in fact no other zbs role... either...
							if ( str_starts_with( $roleKey, 'zerobs_' ) && ! in_array( $roleKey, $blocked_array, true ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

								?>
								<option value="<?php echo esc_attr( $roleKey ); ?>"
								<?php
								if ( isset( $settings['portalusers_extrarole'] ) && $settings['portalusers_extrarole'] == $roleKey ) {
									echo ' selected="selected"';
								}
								?>
								>
								<?php
								if ( is_array( $roleArr ) && isset( $roleArr['name'] ) ) {
									echo esc_html( $roleArr['name'] );
								} else {
									echo esc_html( $roleKey );
								}
								?>
								</option>
								<?php

							}
						}

						?>
						</select>
						<?php

					} else {
						echo '-';
					}

					?>
				</td>
			</tr>

			<tr>
				<td width="94">
					<label for="wpzbscrm_portal_hidefields"><?php esc_html_e( 'Fields to hide on Portal', 'zero-bs-crm' ); ?></label><br /><?php esc_html_e( 'These fields will not be shown to the client in the client portal under "Your Details" (and so will not be editable).', 'zero-bs-crm' ); ?>
				</td>
				<td>
					<?php

					// } retrieve value as simple CSV for now - simplistic at best.
					$portalHiddenFields = 'status,email';
					if ( isset( $settings['portal_hidefields'] ) ) {
						$portalHiddenFields = $settings['portal_hidefields'];
					}

					?>
					<input type="text" name="wpzbscrm_portal_hidefields" id="wpzbscrm_portal_hidefields" value="<?php echo esc_attr( $portalHiddenFields ); ?>" class="form-control" />
					<small style="margin-top:4px"><?php esc_html_e( 'Default setting', 'zero-bs-crm' ); ?>:<br /><span style="background:#ceeaea;padding:0 4px">status,email</span></small>
				</td>
			</tr>


			</tbody>

		</table>

		<?php
		// } Hook in for client portal settings additions
		do_action( 'zbs_portal_after_settings' );
		?>

		<table class="table table-bordered table-striped wtab">
			<tbody>

			<?php

			$portalLink = zeroBS_portal_link();

			?>

			<tr>
				<td class="wmid"><button type="submit" class="ui button primary"><?php esc_html_e( 'Save Settings', 'zero-bs-crm' ); ?></button><a target="_blank" href="<?php echo esc_url( $portalLink ); ?>" class="ui button green"><?php esc_html_e( 'Preview Portal', 'zero-bs-crm' ); ?></a></td>
			</tr>

			</tbody>
		</table>

	</form>

</div>
