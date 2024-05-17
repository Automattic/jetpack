<?php
/*
!
 * Admin Page: Settings: Licensing settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;  // } Req

// } Act on any edits!
if ( isset( $_POST['editwplflicense'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

	// check nonce
	check_admin_referer( 'zbs-update-settings-license' );

	$license_key_array = zeroBSCRM_getSetting( 'license_key' );

	if ( isset( $_POST['wpzbscrm_license_key'] ) ) {

		$license_key_array['key'] = sanitize_text_field( $_POST['wpzbscrm_license_key'] );

		// if empty, we'll need to clear out the option
		if ( empty( $_POST['wpzbscrm_license_key'] ) ) {

			// reset to default
			$license_key_array = array( 'key' => '' );

		}
	}

	// } This brutally overrides existing!
	$zbs->settings->update( 'license_key', $license_key_array );
	$sbupdated = true;

	// } Also, should also recheck the validity of the key and show message if not valid
	zeroBSCRM_license_check();

}

// reget
$license_key_array = zeroBSCRM_getSetting( 'license_key' );

if ( ! zeroBSCRM_isLocal( true ) ) {

	// check
	if ( ! is_array( $license_key_array ) || empty( $license_key_array['key'] ) ) {

		echo "<div class='ui message'><i class='ui icon info'></i>";
		$msg = __( 'Enter your license key for access to paid extensions and support.', 'zero-bs-crm' );
		##WLREMOVE
		$msg .= ' ' . sprintf( __( 'Please visit <a href="%s" target="_blank">your account</a> for your CRM key and license management.', 'zero-bs-crm' ), esc_url( $zbs->urls['account'] ) );
		$msg .= '<br><br>';
		$msg .= sprintf( __( "Don't have a license yet? Take a look at <a href='%s' target='_blank'>our extension bundles</a>!", 'zero-bs-crm' ), esc_url( $zbs->urls['pricing'] ) );
		##/WLREMOVE
		echo wp_kses( $msg, $zbs->acceptable_restricted_html );
		echo '</div>';

	} else {

		// simplify following:
		$licenseValid = false;
		if ( isset( $license_key_array['validity'] ) ) {
			$licenseValid = ( $license_key_array['validity'] === 'true' );
		}

		if ( ! $licenseValid ) {
			echo "<div class='ui message red'><i class='ui icon info'></i>";
			$msg = __( 'Your license key is either invalid, expired, or not assigned to this site.', 'zero-bs-crm' );

			##WLREMOVE
			$msg .= ' ' . sprintf( __( 'Please visit <a href="%s" target="_blank">your account</a> to verify.', 'zero-bs-crm' ), $zbs->urls['licensekeys'] );

			// add debug (from 2.98.1, to help us determine issues)
			$lastErrorMsg = '';
			$err          = $zbs->DAL->setting( 'licensingerror', false );
			if ( is_array( $err ) && isset( $err['err'] ) ) {
				$lastErrorMsg = $err['err'];
			}
			if ( ! empty( $lastErrorMsg ) ) {
				$serverIP = zeroBSCRM_getServerIP();
				$msg     .= '<br /><br />';
				$msg     .= sprintf( __( 'If you believe you are seeing this in error, please <a href="%s" target="_blank">contact support</a> and share the following debug output:', 'zero-bs-crm' ), esc_url( $zbs->urls['support'] ) );
				$msg     .= '<div style="margin:1em;padding:1em;">Server IP:<br />&nbsp;&nbsp;' . $serverIP;
				$msg     .= '<br />Last Error:<br />&nbsp;&nbsp;' . $lastErrorMsg;
				$msg     .= '</div>';
			}
			##/WLREMOVE
			echo $msg;

			// got any errs?
			// https://wordpress.stackexchange.com/questions/167898/is-it-safe-to-use-sslverify-true-for-with-wp-remote-get-wp-remote-post
			$hasHitError = $zbs->DAL->setting( 'licensingerror', false );

			if ( is_array( $hasHitError ) ) {

				$errorMsg = '<div style="font-size: 12px;padding: 1em;>[' . date( 'F j, Y, g:i a', $hasHitError['time'] ) . '] Reported Error: ' . $hasHitError['err'] . '</div>';

			}

			echo '</div>';
		} else {

			echo '<div class="ui grid">';
			echo '<div class="twelve wide column">';

			echo "<div class='ui message green'><i class='ui icon check'></i>";
			$msg = __( 'Your license key is valid for this site. Thank you!', 'zero-bs-crm' );

			// got updates?
			if ( isset( $license_key_array['extensions_updated'] ) && $license_key_array['extensions_updated'] === false ) {

				$msg .= '<br><br>';
				$msg .= ' ' . sprintf( __( 'You have extensions which need updating. Please <a href="%s">go here</a> to update.', 'zero-bs-crm' ), esc_url( admin_url( 'update-core.php' ) ) );

			}
			echo wp_kses( $msg, $zbs->acceptable_restricted_html );

			echo '</div>';
			echo '</div>';

			// view license
			echo '<div class="four wide column" style="text-align:right;padding-top:1.5em;padding-right:2em"><span class="zbs-license-show-deets ui mini blue button" class="ui link"><i class="id card icon"></i> ' . esc_html__( 'License details', 'zero-bs-crm' ) . '</span></div>';
			echo '</div>'; // / grid

			// extra deets (hidden until "view License" clicked)
			echo '<div class="zbs-license-full-info ui segment grid" style="display:none">';
			echo '<div class="three wide column" style="text-align:center"><i class="id card icon" style="font-size: 3em;margin-top: 0.5em;"></i></div>';
			echo '<div class="thirteen wide column">';

			// key
			echo '<strong>' . esc_html__( 'License Key', 'zero-bs-crm' ) . ':</strong> ';
			if ( isset( $license_key_array['key'] ) ) {
				echo esc_html( $license_key_array['key'] );
			} else {
				echo '-';
			}
			echo '<br />';

			// sub deets
			echo '<strong>' . esc_html__( 'Your Subscription', 'zero-bs-crm' ) . ':</strong> ';
			if ( isset( $license_key_array['access'] ) ) {
				echo esc_html( $zbs->getSubscriptionLabel( $license_key_array['access'] ) );
			} else {
				echo '-';
			}
			echo '<br />';

			##WLREMOVE

			// next renewal
			echo '<strong>' . esc_html__( 'Next Renewal', 'zero-bs-crm' ) . ':</strong> ';
			if ( isset( $license_key_array['expires'] ) && $license_key_array['expires'] > 0 ) {
				echo esc_html( zeroBSCRM_locale_utsToDate( $license_key_array['expires'] ) );
			} else {
				echo '-';
			}
			echo '<br />';

			// links
			echo '<a href="' . esc_url( $zbs->urls['licensinginfo'] ) . '" target="_blank">' . esc_html__( 'Read about Yearly Subscriptions & Refunds', 'zero-bs-crm' ) . '</a>';

			echo '<br><br>';
			echo wp_kses( sprintf( __( 'As needed, please visit <a href="%s" target="_blank">your account</a> to manage your license keys and billing.', 'zero-bs-crm' ), $zbs->urls['account'] ), $zbs->acceptable_restricted_html );
			##/WLREMOVE

			echo '</div>'; // / col

			?><script type="text/javascript">

				jQuery(function(){

					jQuery('.zbs-license-show-deets').on( 'click', function(){

						jQuery('.zbs-license-full-info').show();
						jQuery('.zbs-license-show-deets').hide();

					});

				});


			</script>
			<?php

			echo '</div>'; // / grid

			echo '<div style="clear:both" class="ui divider"></div>';
		}
	}
} // if not local

?>

<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {

		// echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">'; zeroBSCRM_html_msg(0,__('Settings Updated',"zero-bs-crm")); echo '</div>';
		echo zeroBSCRM_UI2_messageHTML( 'info', '', __( 'Settings Updated', 'zero-bs-crm' ) );

	}
}
?>
<?php

##WLREMOVE
// claimed license key?
global $zbsLicenseClaimed;
if ( isset( $zbsLicenseClaimed ) ) {

	echo zeroBSCRM_UI2_messageHTML( 'info', __( 'License Key Notice', 'zero-bs-crm' ), sprintf( __( 'Thank you for entering your license key. This key has been successfully associated with this install. If you would like to change which domain uses this license key, please go <a href="%s">here</a>.', 'zero-bs-crm' ), $zbs->urls['account'] ) );
}
##/WLREMOVE

// if on Local server, don't allow entry of license keys, because we will end up with a license key db full
// + it's hard to license properly on local servers as peeps could have many the same
// ... so for v1.0 at least, 'devmode' in effect
if ( zeroBSCRM_isLocal( true ) ) {

	$guide = '';
	##WLREMOVE
	$guide = '<br /><br /><a href="' . $zbs->urls['kbdevmode'] . '" class="ui button primary" target="_blank">' . __( 'Read More', 'zero-bs-crm' ) . '</a>';
	##/WLREMOVE

	echo zeroBSCRM_UI2_messageHTML( 'info', __( 'Developer Mode', 'zero-bs-crm' ), __( 'This install appears to be running on a local machine. For this reason your CRM is in Developer Mode. You cannot add a license key to developer mode, nor retrieve automatic-updates.', 'zero-bs-crm' ) . $guide );

} else {

	// normal page

	?>
	<div id="sbA">
	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=license" id="zbslicenseform">
		<input type="hidden" name="editwplflicense" id="editwplflicense" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'zbs-update-settings-license' );
		?>


		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'License', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody id="zbscrm-addresses-license-key">

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_license_key"><?php esc_html_e( 'License Key', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Enter your License Key.', 'zero-bs-crm' ); ?></td>
				<td style="width:540px">
					<input style="padding:10px;" name="wpzbscrm_license_key" id="wpzbscrm_license_key" class="form-control" type="text" value="<?php echo empty( $license_key_array['key'] ) ? '' : esc_attr( $license_key_array['key'] ); ?>" />
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

	<script type="text/javascript">

	</script>

	</div>
	<?php

} // normal page
