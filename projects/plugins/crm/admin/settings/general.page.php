<?php
/*
!
 * Admin Page: Settings: General settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;  // } Req

$confirmAct = false;

// } Retrieve all settings
$settings = $zbs->settings->getAll();

// } #WH OR - need these lists?
// } Autologgers:
$autoLoggers = array(
	array(
		'fieldname' => 'autolog_customer_new',
		'title'     => 'Contact Creation',
	),
	array(
		'fieldname' => 'autolog_customer_statuschange',
		'title'     => 'Contact Status Change',
	),
	array(
		'fieldname' => 'autolog_company_new',
		'title'     => jpcrm_label_company() . ' Creation',
	),
	array(
		'fieldname' => 'autolog_quote_new',
		'title'     => 'Quote Creation',
	),
	array(
		'fieldname' => 'autolog_quote_accepted',
		'title'     => 'Quote Acceptance',
	),
	array(
		'fieldname' => 'autolog_invoice_new',
		'title'     => 'Invoice Creation',
	),
	array(
		'fieldname' => 'autolog_transaction_new',
		'title'     => 'Transaction Creation',
	),
	array(
		'fieldname' => 'autolog_event_new',
		'title'     => 'Task Creation',
	),
	array(
		'fieldname' => 'autolog_clientportal_new',
		'title'     => 'Client Portal User Creation',
	),
);

// extensions add to list :D
$autoLoggers = apply_filters( 'zbs_autologger_list', $autoLoggers );

/*
// } load country list
global $whwpCountryList;
if(!isset($whwpCountryList)) require_once( ZEROBSCRM_INCLUDE_PATH . 'wh.countrycode.lib.php');

*/

// } Act on any edits!
if ( isset( $_POST['editwplf'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

	// check nonce
	check_admin_referer( 'zbs-update-settings-general' );

	// } Retrieve
	$updatedSettings = array();

	$updatedSettings['menulayout'] = 2;
	if ( isset( $_POST['wpzbscrm_menulayout'] ) && ! empty( $_POST['wpzbscrm_menulayout'] ) ) {
		$updatedSettings['menulayout'] = (int) sanitize_text_field( $_POST['wpzbscrm_menulayout'] );
	}

	$updatedSettings['showprefix'] = 0;
	if ( isset( $_POST['wpzbscrm_showprefix'] ) && ! empty( $_POST['wpzbscrm_showprefix'] ) ) {
		$updatedSettings['showprefix'] = 1;
	}
	$updatedSettings['showaddress'] = 0;
	if ( isset( $_POST['wpzbscrm_showaddress'] ) && ! empty( $_POST['wpzbscrm_showaddress'] ) ) {
		$updatedSettings['showaddress'] = 1;
	}
	$updatedSettings['secondaddress'] = 0;
	if ( isset( $_POST['wpzbscrm_secondaddress'] ) && ! empty( $_POST['wpzbscrm_secondaddress'] ) ) {
		$updatedSettings['secondaddress'] = 1;
	}
	$updatedSettings['secondaddresslabel'] = __( 'Second Address', 'zero-bs-crm' );
	if ( isset( $_POST['wpzbscrm_secondaddresslabel'] ) && ! empty( $_POST['wpzbscrm_secondaddresslabel'] ) ) {
		$updatedSettings['secondaddresslabel'] = sanitize_text_field( $_POST['wpzbscrm_secondaddresslabel'] );
	}
	$updatedSettings['countries'] = 0;
	if ( isset( $_POST['wpzbscrm_countries'] ) && ! empty( $_POST['wpzbscrm_countries'] ) ) {
		$updatedSettings['countries'] = 1;
	}
	$updatedSettings['perusercustomers'] = 0;
	if ( isset( $_POST['wpzbscrm_perusercustomers'] ) && ! empty( $_POST['wpzbscrm_perusercustomers'] ) ) {
		$updatedSettings['perusercustomers'] = 1;
	}
	$updatedSettings['usercangiveownership'] = 0;
	if ( isset( $_POST['wpzbscrm_usercangiveownership'] ) && ! empty( $_POST['wpzbscrm_usercangiveownership'] ) ) {
		$updatedSettings['usercangiveownership'] = 1;
	}
	$updatedSettings['taskownership'] = 0;
	if ( isset( $_POST['wpzbscrm_taskownership'] ) && ! empty( $_POST['wpzbscrm_taskownership'] ) ) {
		$updatedSettings['taskownership'] = 1;
	}
	$updatedSettings['clicktocall'] = 0;
	if ( isset( $_POST['wpzbscrm_clicktocall'] ) && ! empty( $_POST['wpzbscrm_clicktocall'] ) ) {
		$updatedSettings['clicktocall'] = 1;
	}
	$updatedSettings['clicktocalltype'] = 1;
	if ( isset( $_POST['wpzbscrm_clicktocalltype'] ) && ! empty( $_POST['wpzbscrm_clicktocalltype'] ) ) {
		$updatedSettings['clicktocalltype'] = (int) sanitize_text_field( $_POST['wpzbscrm_clicktocalltype'] );
	}
	$updatedSettings['objnav'] = 0;
	if ( isset( $_POST['wpzbscrm_objnav'] ) && ! empty( $_POST['wpzbscrm_objnav'] ) ) {
		$updatedSettings['objnav'] = 1;
	}
	$updatedSettings['usesocial'] = 0;
	if ( isset( $_POST['wpzbscrm_usesocial'] ) && ! empty( $_POST['wpzbscrm_usesocial'] ) ) {
		$updatedSettings['usesocial'] = 1;
	}
	$updatedSettings['useaka'] = 0;
	if ( isset( $_POST['wpzbscrm_useaka'] ) && ! empty( $_POST['wpzbscrm_useaka'] ) ) {
		$updatedSettings['useaka'] = 1;
	}
	$updatedSettings['wpzbscrm_avatarmode'] = 1;
	if ( isset( $_POST['wpzbscrm_avatarmode'] ) && ! empty( $_POST['wpzbscrm_avatarmode'] ) ) {
		$updatedSettings['avatarmode'] = (int) sanitize_text_field( $_POST['wpzbscrm_avatarmode'] );
	}

	$updatedSettings['wptakeovermode'] = 0;
	if ( isset( $_POST['wpzbscrm_wptakeovermode'] ) && ! empty( $_POST['wpzbscrm_wptakeovermode'] ) ) {
		$updatedSettings['wptakeovermode'] = 1;
	}
	$updatedSettings['wptakeovermodeforall'] = 0;
	if ( isset( $_POST['wpzbscrm_wptakeovermodeforall'] ) && ! empty( $_POST['wpzbscrm_wptakeovermodeforall'] ) ) {
		$updatedSettings['wptakeovermodeforall'] = 1;
	}
	$updatedSettings['loginlogourl'] = '';
	if ( isset( $_POST['wpzbscrm_loginlogourl'] ) && ! empty( $_POST['wpzbscrm_loginlogourl'] ) ) {
		$updatedSettings['loginlogourl'] = sanitize_text_field( $_POST['wpzbscrm_loginlogourl'] );
	}
	$updatedSettings['customheadertext'] = '';
	if ( isset( $_POST['wpzbscrm_customheadertext'] ) && ! empty( $_POST['wpzbscrm_customheadertext'] ) ) {
		$updatedSettings['customheadertext'] = sanitize_text_field( $_POST['wpzbscrm_customheadertext'] );
	}
	$updatedSettings['killfrontend'] = 0;
	if ( isset( $_POST['wpzbscrm_killfrontend'] ) && ! empty( $_POST['wpzbscrm_killfrontend'] ) ) {
		$updatedSettings['killfrontend'] = 1;
	}
	$updatedSettings['shareessentials'] = 0;
	if ( isset( $_POST['wpzbscrm_shareessentials'] ) && ! empty( $_POST['wpzbscrm_shareessentials'] ) ) {
		$updatedSettings['shareessentials'] = 1;
	}
	$updatedSettings['showpoweredby_public'] = empty( $_POST['jpcrm_showpoweredby_public'] ) ? 0 : 1;
	$updatedSettings['showpoweredby_admin']  = empty( $_POST['jpcrm_showpoweredby_admin'] ) ? 0 : 1;

	$fileTypesUpload = $settings['filetypesupload'];
	foreach ( $zbs->acceptable_mime_types as $filetype => $mimedeet ) {
		$fileTypesUpload[ $filetype ] = 0;
		if ( isset( $_POST[ 'wpzbscrm_ft_' . $filetype ] ) && ! empty( $_POST[ 'wpzbscrm_ft_' . $filetype ] ) ) {
			$fileTypesUpload[ $filetype ] = 1;
		}
	}
	$fileTypesUpload['all'] = 0;
	if ( isset( $_POST['wpzbscrm_ft_all'] ) && ! empty( $_POST['wpzbscrm_ft_all'] ) ) {
		$fileTypesUpload['all'] = 1;
	}
	$updatedSettings['filetypesupload'] = $fileTypesUpload;

	foreach ( $autoLoggers as $autoLog ) {
		$updatedSettings[ $autoLog['fieldname'] ] = 0;
		if ( isset( $_POST[ 'wpzbscrm_' . $autoLog['fieldname'] ] ) && ! empty( $_POST[ 'wpzbscrm_' . $autoLog['fieldname'] ] ) ) {
			$updatedSettings[ $autoLog['fieldname'] ] = 1;
		}
	}

	// } Brutal update
	foreach ( $updatedSettings as $k => $v ) {
		$zbs->settings->update( $k, $v );
	}

	// } $msg out!
	$sbupdated = true;

	// } Reload
	$settings = $zbs->settings->getAll( true );

}

// } catch resets.
if ( zeroBSCRM_isZBSAdminOrAdmin() && isset( $_GET['resetsettings'] ) ) {
	if ( $_GET['resetsettings'] == 1 ) {

		$nonceVerified = wp_verify_nonce( $_GET['_wpnonce'], 'resetclearzerobscrm' );

		if ( ! isset( $_GET['imsure'] ) || ! $nonceVerified ) {

			// } Needs to confirm!
			$confirmAct         = true;
			$actionStr          = 'resetsettings';
			$actionButtonStr    = __( 'Reset Settings to Defaults?', 'zero-bs-crm' );
			$confirmActStr      = __( 'Reset All Settings?', 'zero-bs-crm' );
			$confirmActStrShort = __( 'Are you sure you want to reset these settings to the defaults?', 'zero-bs-crm' );
			$confirmActStrLong  = __( 'Once you reset these settings you cannot retrieve your previous settings.', 'zero-bs-crm' );

		} elseif ( $nonceVerified ) {

			// } Reset
			$zbs->settings->resetToDefaults();
			$settings = $zbs->settings->getAll();

			// } Msg out!
			$sbreset = true;
		}
	}
}

if ( ! $confirmAct ) {

	?>

	<p id="sbDescOLD"><?php echo wp_kses( sprintf( __( 'From this page you can choose global settings for your CRM, and using the tabs above you can set up different <a href="%s" target="_blank">Extensions</a>', 'zero-bs-crm' ), esc_url( $zbs->urls['products'] ) ), $zbs->acceptable_restricted_html ); ?></p>

	<?php
	if ( isset( $sbupdated ) ) {
		if ( $sbupdated ) {
			echo '<div>';
			zeroBSCRM_html_msg( 0, __( 'Settings Updated', 'zero-bs-crm' ) );
			echo '</div>'; }
	}
	?>
	<?php
	if ( isset( $sbreset ) ) {
		if ( $sbreset ) {
			echo '<div>';
			zeroBSCRM_html_msg( 0, __( 'Settings Reset', 'zero-bs-crm' ) );
			echo '</div>'; }
	}
	?>

	<div id="sbA">

	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>">
		<input type="hidden" name="editwplf" id="editwplf" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'zbs-update-settings-general' );
		?>

		<table class="table table-bordered table-striped wtab">
			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'WordPress Menu Layout', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_menulayout"><?php esc_html_e( 'Menu Layout', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'How do you want your WordPress Admin Menu to Display?', 'zero-bs-crm' ); ?></td>
				<td style="width:540px">
					<select class="winput" name="wpzbscrm_menulayout" id="wpzbscrm_menulayout">
						<!-- common currencies first -->
						<option value="1" 
						<?php
						if ( isset( $settings['menulayout'] ) && $settings['menulayout'] == '1' ) {
							echo ' selected="selected"';}
						?>
						><?php esc_html_e( 'Full', 'zero-bs-crm' ); ?></option>
						<option value="2" 
						<?php
						if ( isset( $settings['menulayout'] ) && $settings['menulayout'] == '2' ) {
							echo ' selected="selected"';}
						?>
						><?php esc_html_e( 'Slimline', 'zero-bs-crm' ); ?></option>
						<option value="3" 
						<?php
						if ( isset( $settings['menulayout'] ) && $settings['menulayout'] == '3' ) {
							echo ' selected="selected"';}
						?>
						><?php esc_html_e( 'CRM Only', 'zero-bs-crm' ); ?></option>
					</select>
					<br />
					<div>
						<?php esc_html_e( 'Are you looking for your other WordPress menu items? (e.g.', 'zero-bs-crm' ); ?> <a href="<?php echo esc_url( admin_url( 'plugins.php' ) ); ?>"><?php esc_html_e( 'Plugins', 'zero-bs-crm' ); ?></a>, <?php esc_html_e( 'or', 'zero-bs-crm' ); ?> <a href="<?php echo esc_url( admin_url( 'users.php' ) ); ?>"><?php esc_html_e( 'Users', 'zero-bs-crm' ); ?></a>)?<br />
						<?php esc_html_e( "If you can't see these, (and you want to), select 'Slimline' or 'Full' from the above menu, then make sure 'Override WordPress (For All WP Users):' is disabled below", 'zero-bs-crm' ); ?> (<a href="#override-allusers"><?php esc_html_e( 'here', 'zero-bs-crm' ); ?></a>).<br />
						<?php ##WLREMOVE ?>
						<a href="<?php echo esc_url( $zbs->urls['kbshowwpmenus'] ); ?>" target="_blank"><?php esc_html_e( 'View Guide', 'zero-bs-crm' ); ?></a>
						<?php ##/WLREMOVE ?>
					</div>
				</td>
			</tr>

			</tbody>
		</table>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'General Settings', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

				<tr>
					<td class="wfieldname"><label for="wpzbscrm_showprefix"><?php esc_html_e( 'Show Prefix', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Untick to hide the prefix (mr, mrs, etc)', 'zero-bs-crm' ); ?></td>
					<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_showprefix" id="wpzbscrm_showprefix" value="1"
					<?php
					if ( isset( $settings['showprefix'] ) && $settings['showprefix'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/></td>
				</tr>



				<tr>
					<td class="wfieldname"><label for="wpzbscrm_showaddress"><?php esc_html_e( 'Show Contact Address Fields', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Untick to hide the address fields (useful for online business)', 'zero-bs-crm' ); ?></td>
					<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_showaddress" id="wpzbscrm_showaddress" value="1"
					<?php
					if ( isset( $settings['showaddress'] ) && $settings['showaddress'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/></td>
				</tr>

				<tr>
					<td class="wfieldname"><label for="wpzbscrm_secondaddress"><?php esc_html_e( 'Second Address Fields', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Allow editing of a "second address" against a contact', 'zero-bs-crm' ); ?></td>
					<td style="width:540px">
						<input type="checkbox" class="winput form-control" name="wpzbscrm_secondaddress" id="wpzbscrm_secondaddress" value="1"
						<?php
						if ( isset( $settings['secondaddress'] ) && $settings['secondaddress'] == '1' ) {
							echo ' checked="checked"';}
						?>
						/>
				</tr>
				<tr>
					<td class="wfieldname"><label for="pzbscrm_secondaddresslabel"><?php esc_html_e( 'Second Address Label', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Edit what text is displayed (defaults to Second Address)', 'zero-bs-crm' ); ?></td>
					<td style="width:540px">
						<input type="text" class="wpinput form-control" name="wpzbscrm_secondaddresslabel" id="pzbscrm_secondaddresslabel" value="<?php echo empty( $settings['secondaddresslabel'] ) ? '' : esc_attr( $settings['secondaddresslabel'] ); ?>" placeholder="<?php esc_html_e( 'Second Address (if left blank)', 'zero-bs-crm' ); ?>" />
					</td>
				</tr>

				<tr>
					<td class="wfieldname"><label for="wpzbscrm_countries"><?php esc_html_e( 'Use "Countries" in Address Fields', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Untick to hide country from address fields (useful for local business)', 'zero-bs-crm' ); ?></td>
					<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_countries" id="wpzbscrm_countries" value="1"
					<?php
					if ( isset( $settings['countries'] ) && $settings['countries'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/></td>
				</tr>

				<tr>
					<td class="wfieldname"><label for="wpzbscrm_perusercustomers"><?php esc_html_e( 'Contact Assignment', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'If ticked, each contact can be assigned to a CRM user.', 'zero-bs-crm' ); ?></td>
					<td><input type="checkbox" class="winput form-control" name="wpzbscrm_perusercustomers" id="wpzbscrm_perusercustomers" value="1"
					<?php
					if ( isset( $settings['perusercustomers'] ) && $settings['perusercustomers'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/></td>
				</tr>
				<tr>
					<td class="wfieldname"><label for="wpzbscrm_usercangiveownership"><?php esc_html_e( 'Assign Ownership', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Allow users to assign contacts to another CRM user', 'zero-bs-crm' ); ?></td>
					<td><input type="checkbox" class="winput form-control" name="wpzbscrm_usercangiveownership" id="wpzbscrm_usercangiveownership" value="1"
					<?php
					if ( isset( $settings['usercangiveownership'] ) && $settings['usercangiveownership'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/></td>
				</tr>

				<tr>
					<td class="wfieldname"><label for="wpzbscrm_taskownership"><?php esc_html_e( 'Task Scheduler Ownership', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Show only scheduled tasks owned by a user (Admin sees all).', 'zero-bs-crm' ); ?></td>
					<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_taskownership" id="wpzbscrm_taskownership" value="1"
					<?php
					if ( isset( $settings['taskownership'] ) && $settings['taskownership'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/></td>
				</tr>

				<tr>
					<td class="wfieldname"><label for="wpzbscrm_clicktocall"><?php esc_html_e( 'Show Click 2 Call links', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Show a clickable telephone link next to any available telephone number', 'zero-bs-crm' ); ?></td>
					<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_clicktocall" id="wpzbscrm_clicktocall" value="1"
					<?php
					if ( isset( $settings['clicktocall'] ) && $settings['clicktocall'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/></td>
				</tr>


				<tr>
					<td class="wfieldname"><label for="wpzbscrm_clicktocalltype"><?php esc_html_e( 'Click 2 Call link type', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Use Skype or Standard Click to Call?', 'zero-bs-crm' ); ?></td>
					<td style="width:540px">
						<select class="winput form-control" name="wpzbscrm_clicktocalltype" id="wpzbscrm_clicktocalltype">
							<option value="1"
							<?php
							if ( isset( $settings['clicktocalltype'] ) && $settings['clicktocalltype'] == '1' ) {
								echo ' selected="selected"';}
							?>
							>Click to Call (tel:)</option>
							<option value="2"
							<?php
							if ( isset( $settings['clicktocalltype'] ) && $settings['clicktocalltype'] == '2' ) {
								echo ' selected="selected"';}
							?>
							>Skype Call (callto:)</option>
						</select>
					</td>
				</tr>

				<tr>
					<td class="wfieldname"><label for="wpzbscrm_objnav"><?php esc_html_e( 'Use Navigation Mode', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Shows Previous & Next buttons on each contact and company, allowing quick navigation through your list.', 'zero-bs-crm' ); ?></td>
					<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_objnav" id="wpzbscrm_objnav" value="1"
					<?php
					if ( isset( $settings['objnav'] ) && $settings['objnav'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/></td>
				</tr>

				<tr>
					<td class="wfieldname"><label for="wpzbscrm_usesocial"><?php esc_html_e( 'Show Social Accounts', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Show fields for social media accounts for each contact.', 'zero-bs-crm' ); ?></td>
					<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_usesocial" id="wpzbscrm_usesocial" value="1"
					<?php
					if ( isset( $settings['usesocial'] ) && $settings['usesocial'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/></td>
				</tr>


				<tr>
					<td class="wfieldname"><label for="wpzbscrm_useaka"><?php esc_html_e( 'Use AKA Mode', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Allow each contact to have several email addresses as aliases.', 'zero-bs-crm' ); ?></td>
					<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_useaka" id="wpzbscrm_useaka" value="1"
					<?php
					if ( isset( $settings['useaka'] ) && $settings['useaka'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/></td>
				</tr>

				<tr>
					<td class="wfieldname"><label for="wpzbscrm_avatarmode"><?php esc_html_e( 'Contact Image Mode', 'zero-bs-crm' ); ?>:</label></td>
					<td style="width:540px">
						<select class="winput form-control" name="wpzbscrm_avatarmode" id="wpzbscrm_avatarmode">
							<?php /* // 1 = gravitar only, 2 = custom imgs, 3 = none */ ?>
							<option value="1"
							<?php
							if ( isset( $settings['avatarmode'] ) && $settings['avatarmode'] === 1 ) {
								echo ' selected="selected"';}
							?>
							>Gravatars</option>
							<option value="2"
							<?php
							if ( isset( $settings['avatarmode'] ) && $settings['avatarmode'] === 2 ) {
								echo ' selected="selected"';}
							?>
							>Custom Images</option>
							<option value="3"
							<?php
							if ( isset( $settings['avatarmode'] ) && $settings['avatarmode'] === 3 ) {
								echo ' selected="selected"';}
							?>
							>None</option>
						</select>
					</td>
				</tr>

			</tbody>

		</table>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid" id="override-allusers"><?php esc_html_e( 'WordPress Override Mode', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_wptakeovermode"><?php esc_html_e( 'Override WordPress', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Enabling this setting hides the WordPress header, menu items, and Dashboard for users assigned CRM roles', 'zero-bs-crm' ); ?></td>
				<td><input type="checkbox" class="winput form-control" name="wpzbscrm_wptakeovermode" id="wpzbscrm_wptakeovermode" value="1"
				<?php
				if ( isset( $settings['wptakeovermode'] ) && $settings['wptakeovermode'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_wptakeovermodeforall"><?php esc_html_e( 'Override WordPress (For All WP Users)', 'zero-bs-crm' ); ?>:</label></td>
				<td>
					<input type="checkbox" class="winput form-control" name="wpzbscrm_wptakeovermodeforall" id="wpzbscrm_wptakeovermodeforall" value="1"
					<?php
					if ( isset( $settings['wptakeovermodeforall'] ) && $settings['wptakeovermodeforall'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/>
					<br /><small><?php esc_html_e( 'Enabling this setting hides the WordPress header, menu items, and Dashboard for all WordPress Users', 'zero-bs-crm' ); ?></small>
					<br /><small><?php esc_html_e( 'It does not affect access to your Client Portal, API, or Proposals.', 'zero-bs-crm' ); ?></small>
				</td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_loginlogourl"><?php esc_html_e( 'Login Logo Override', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Enter an URL here, or upload a logo to override the WordPress login logo!', 'zero-bs-crm' ); ?></td>
				<td style="width:540px">
					<input style="width:90%;padding:10px;" name="wpzbscrm_loginlogourl" id="wpzbscrm_loginlogourl" class="form-control link" type="text" value="<?php echo empty( $settings['loginlogourl'] ) ? '' : esc_attr( $settings['loginlogourl'] ); ?>" />
					<button id="wpzbscrm_loginlogourlAdd" class="button" type="button"><?php esc_html_e( 'Upload Image', 'zero-bs-crm' ); ?></button>
				</td>
			</tr>


			<tr>
				<td class="wfieldname"><label for="wpzbscrm_customheadertext"><?php esc_html_e( 'Custom CRM Header', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Naming your CRM with the above \'Override WordPress\' option selected will show a custom header with that name', 'zero-bs-crm' ); ?></td>
				<td><input type="text" class="winput form-control" name="wpzbscrm_customheadertext" id="wpzbscrm_customheadertext" value="<?php echo empty( $settings['customheadertext'] ) ? '' : esc_attr( $settings['customheadertext'] ); ?>" placeholder="e.g. <?php esc_html_e( 'Your CRM', 'zero-bs-crm' ); ?>" /></td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_killfrontend"><?php esc_html_e( 'Disable Front-End', 'zero-bs-crm' ); ?>:</label></td>
				<td>
					<input type="checkbox" class="winput form-control" name="wpzbscrm_killfrontend" id="wpzbscrm_killfrontend" value="1"
					<?php
					if ( isset( $settings['killfrontend'] ) && $settings['killfrontend'] == '1' ) {
						echo ' checked="checked"';}
					?>
					/>
					<br /><small><?php esc_html_e( 'Enabling this setting will disable the front-end of this WordPress install, (redirecting it to your login url!)', 'zero-bs-crm' ); ?></small>
					<br /><small><?php esc_html_e( 'This will effectively disable your Client Portal (if installed), but will not affect your API.', 'zero-bs-crm' ); ?></small>
				</td>
			</tr>

			<?php ##WLREMOVE ?>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_shareessentials"><?php esc_html_e( 'Usage Tracking', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Share CRM usage with us. No contact or sensitive CRM data is shared.', 'zero-bs-crm' ); ?>
				<a href="<?php echo esc_url( $zbs->urls['usageinfo'] ); ?>" target="_blank"><?php esc_html_e( 'Learn More', 'zero-bs-crm' ); ?>.</a>
				</td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_shareessentials" id="wpzbscrm_shareessentials" value="1"
				<?php
				if ( isset( $settings['shareessentials'] ) && $settings['shareessentials'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>

			<tr>
				<td class="wfieldname">
					<label for="jpcrm_showpoweredby_public"><?php esc_html_e( 'Show public credits', 'zero-bs-crm' ); ?>:</label><br />
					<?php esc_html_e( 'Love Jetpack CRM and willing to share? Show us some love by displaying "Powered by Jetpack CRM" footers on the CRM login page, CRM forms, CRM emails, and the Client Portal.', 'zero-bs-crm' ); ?>
				</td>
				<td style="width:540px">
					<input type="checkbox" class="winput form-control" name="jpcrm_showpoweredby_public" id="jpcrm_showpoweredby_public" value="1"<?php echo empty( $settings['showpoweredby_public'] ) ? '' : ' checked="checked"'; ?> />
				</td>
			</tr>

			<tr>
				<td class="wfieldname">
					<label for="jpcrm_showpoweredby_admin"><?php esc_html_e( 'Show admin credits', 'zero-bs-crm' ); ?>:</label><br />
					<?php esc_html_e( 'Show "Powered by Jetpack CRM" footers on backend admin pages.', 'zero-bs-crm' ); ?>
				</td>
				<td style="width:540px">
					<input type="checkbox" class="winput form-control" name="jpcrm_showpoweredby_admin" id="jpcrm_showpoweredby_admin" value="1"<?php echo isset( $settings['showpoweredby_admin'] ) && $settings['showpoweredby_admin'] === 0 ? '' : ' checked="checked"'; ?> />
				</td>
			</tr>
			<?php ##/WLREMOVE ?>

			</tbody>

		</table>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'File Attachment Settings', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>


			<tr>
				<td class="wfieldname"><label><?php esc_html_e( 'Accepted Upload File Types', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'This setting specifies which file types are acceptable for uploading against contacts, quotes, or invoices.', 'zero-bs-crm' ); ?></td>
				<td style="width:540px">
					<?php foreach ( $zbs->acceptable_mime_types as $filetype => $mimedeet ) { ?>
						<input type="checkbox" class="winput form-control" name="<?php echo esc_attr( 'wpzbscrm_ft_' . $filetype ); ?>" id="<?php echo esc_attr( 'wpzbscrm_ft_' . $filetype ); ?>" value="1"
																							<?php
																							if ( isset( $settings['filetypesupload'] ) && isset( $settings['filetypesupload'][ $filetype ] ) && $settings['filetypesupload'][ $filetype ] == '1' ) {
																								echo ' checked="checked"';}
																							?>
						/> <?php echo esc_html( '.' . $filetype ); ?><br />
					<?php } ?>
				</td>
			</tr>

			<tr>
				<td class="wfieldname"><label><?php esc_html_e( 'Allow CRM team members to upload all filetypes', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'This setting overrides the above accepted upload file types, and will allow CRM team members to upload any files to the CRM. For security reasons, we don\'t recommend doing this unless necessary.', 'zero-bs-crm' ); ?></td>
				<td style="width:540px">
					<input type="checkbox" class="winput form-control" name="<?php echo 'wpzbscrm_ft_all'; ?>" id="<?php echo 'wpzbscrm_ft_all'; ?>" value="1"
																						<?php
																						if ( isset( $settings['filetypesupload'] ) && isset( $settings['filetypesupload']['all'] ) && $settings['filetypesupload']['all'] == '1' ) {
																							echo ' checked="checked"';}
																						?>
					/> Accept all files from admins<br />
				</td>
			</tr>

			</tbody>

		</table>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Auto-logging Settings', 'zero-bs-crm' ); ?>:<br />(<?php esc_html_e( 'Automatically create log on action', 'zero-bs-crm' ); ?>)</th>
			</tr>

			</thead>

			<tbody>

			<?php
			foreach ( $autoLoggers as $autoLog ) {
				?>

				<tr>
					<td class="wfieldname"><label for="wpzbscrm_<?php echo esc_attr( $autoLog['fieldname'] ); ?>"><?php esc_html_e( 'Auto-log: ' . $autoLog['title'], 'zero-bs-crm' ); ?>:</label></td>
					<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_<?php echo esc_attr( $autoLog['fieldname'] ); ?>" id="wpzbscrm_<?php echo esc_attr( $autoLog['fieldname'] ); ?>" value="1"
																														<?php
																														if ( isset( $settings[ $autoLog['fieldname'] ] ) && $settings[ $autoLog['fieldname'] ] == '1' ) {
																															echo ' checked="checked"';}
																														?>
					/></td>
				</tr>

			<?php } ?>

			</tbody>

		</table>


		<table class="table table-bordered table-striped wtab">
			<tbody>

			<tr>
				<td class="wmid"><button type="submit" class="ui primary button"><?php esc_html_e( 'Save Settings', 'zero-bs-crm' ); ?></button></td>
			</tr>

			</tbody>
		</table>

	</form>


	<table class="table table-bordered table-striped wtab" style="margin-top:40px;">

		<thead>
		<tr>
			<th class="wmid"><?php esc_html_e( 'Jetpack CRM Plugin: Extra Tools', 'zero-bs-crm' ); ?></th>
		</tr>
		</thead>

		<tbody>
		<tr>
			<td>
				<p style="padding: 10px;text-align:center;">
					<button type="button" class="ui primary button" onclick="javascript:window.location='?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&resetsettings=1';"><?php esc_html_e( 'Restore default settings', 'zero-bs-crm' ); ?></button>
				</p>
			</td>
		</tr>
		</tbody>
	</table>

	<script type="text/javascript">

		jQuery(function(){


			// Uploader
			// http://stackoverflow.com/questions/17668899/how-to-add-the-media-uploader-in-wordpress-plugin (3rd answer)
			jQuery('#wpzbscrm_loginlogourlAdd').on( 'click', function(e) {
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
						jQuery('#wpzbscrm_loginlogourl').val(image_url);

					});
			});




		});


	</script>

	</div>
	<?php

} else {

	?>
	<div id="clpSubPage" class="whclpActionMsg six">
	<p><strong><?php echo esc_html( $confirmActStr ); ?></strong></p>
	<h3><?php echo esc_html( $confirmActStrShort ); ?></h3>
	<?php echo esc_html( $confirmActStrLong ); ?><br /><br />
	<button type="button" class="ui button primary" onclick="javascript:window.location='<?php echo esc_attr( wp_nonce_url( '?page=' . $zbs->slugs['settings'] . '&' . $actionStr . '=1&imsure=1', 'resetclearzerobscrm' ) ); ?>';"><?php echo esc_html( $actionButtonStr ); ?></button>
	<button type="button" class="button button-large" onclick="javascript:window.location='?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>';"><?php esc_html_e( 'Cancel', 'zero-bs-crm' ); ?></button>
	<br />
	</div>
	<?php
}
