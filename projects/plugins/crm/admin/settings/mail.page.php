<?php
/*
!
 * Admin Page: Settings: Mail settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;  // } Req

$settings = $zbs->settings->getAll();

// } Act on any edits!
if ( isset( $_POST['editzbsmail'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

	// check nonce
	check_admin_referer( 'zbs-update-settings-mail' );

	// } 2.80+
	$updatedSettings['emailtracking'] = 0;
	if ( isset( $_POST['wpzbscrm_emailtracking'] ) && ! empty( $_POST['wpzbscrm_emailtracking'] ) ) {
		$updatedSettings['emailtracking'] = 1;
	}
	$updatedSettings['directmsgfrom'] = 1;
	if ( isset( $_POST['wpzbscrm_directmsgfrom'] ) && ! empty( $_POST['wpzbscrm_directmsgfrom'] ) ) {
		$updatedSettings['directmsgfrom'] = (int) sanitize_text_field( $_POST['wpzbscrm_directmsgfrom'] );
	}

	// } 2.90+

	// } Unsub msg + page + msg
	$updatedSettings['unsub'] = '';
	if ( isset( $_POST['wpzbs_unsub'] ) ) {
		$updatedSettings['unsub'] = zeroBSCRM_textProcess( $_POST['wpzbs_unsub'] );
	}
	$updatedSettings['unsubpage'] = -1;
	if ( isset( $_POST['wpzbscrm_unsubpage'] ) && ! empty( $_POST['wpzbscrm_unsubpage'] ) ) {
		$updatedSettings['unsubpage'] = (int) sanitize_text_field( $_POST['wpzbscrm_unsubpage'] );
	}
	$updatedSettings['unsubmsg'] = '';
	if ( isset( $_POST['wpzbs_unsubmsg'] ) ) {
		$updatedSettings['unsubmsg'] = zeroBSCRM_textProcess( $_POST['wpzbs_unsubmsg'] );
	}

	// } 2.95.4+
	$updatedSettings['mailignoresslmismatch'] = 0;
	if ( isset( $_POST['wpzbscrm_mailignoresslmismatch'] ) && ! empty( $_POST['wpzbscrm_mailignoresslmismatch'] ) ) {
		$updatedSettings['mailignoresslmismatch'] = 1;
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

<p id="sbDesc"><?php esc_html_e( 'Set up your global mail settings. This, along with Mail Delivery settings and Mail Templates, make up the backbone of the CRM system.', 'zero-bs-crm' ); ?></p>
<p style="padding-top: 18px; text-align:center;margin:1em">
	<?php echo '<a href="' . jpcrm_esc_link( $zbs->slugs['settings'] ) . '&tab=maildelivery' . '" class="ui button green">' . esc_html__( 'Mail Delivery', 'zero-bs-crm' ) . '</a>'; ?>&nbsp;
	<?php echo '<a href="' . jpcrm_esc_link( $zbs->slugs['email-templates'] ) . '" class="ui button green">' . esc_html__( 'Mail Templates', 'zero-bs-crm' ) . '</a>'; ?>
</p>

<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {
		echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
		zeroBSCRM_html_msg( 0, __( 'Settings Updated', 'zero-bs-crm' ) );
		echo '</div>'; }
}
?>

<div id="sbA">

	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=mail">
		<input type="hidden" name="editzbsmail" id="editzbsmail" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'zbs-update-settings-mail' );
		?>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Global Mail Settings', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_emailtracking"><?php esc_html_e( 'Track Open Statistics', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Include tracking pixels in all outbound system emails<br/>(e.g. Welcome to the Client Portal)', 'zero-bs-crm' ); ?>.</td>
				<td style="width:200px"><input type="checkbox" class="winput form-control" name="wpzbscrm_emailtracking" id="wpzbscrm_emailtracking" value="1"
				<?php
				if ( isset( $settings['emailtracking'] ) && $settings['emailtracking'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_mailignoresslmismatch"><?php esc_html_e( 'Disable SSL Verification', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( "Most good servers force ssl matches for outbound mail. This is sensible, but can cause issues when using custom SMTP delivery methods. If you're having issues verifying a delivery method test enabling this setting. If your mail delivery works without this on, it's better to leave this off.", 'zero-bs-crm' ); ?></td>
				<td style="width:200px"><input type="checkbox" class="winput form-control" name="wpzbscrm_mailignoresslmismatch" id="wpzbscrm_mailignoresslmismatch" value="1"
				<?php
				if ( isset( $settings['mailignoresslmismatch'] ) && $settings['mailignoresslmismatch'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>

			</tbody>

		</table>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Direct Mail Settings', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td class="wfieldname"><label for="wpzbscrm_directmsgfrom"><?php esc_html_e( 'Format of Sender Name', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Which format of name should be used when sending direct emails (e.g. Email Contact)', 'zero-bs-crm' ); ?>.</td>
				<td style="width:200px">
					<?php $coname = zeroBSCRM_mailDelivery_defaultFromname(); ?>
					<select class="winput" name="wpzbscrm_directmsgfrom" id="wpzbscrm_directmsgfrom">
						<option value="1" 
						<?php
						if ( isset( $settings['directmsgfrom'] ) && $settings['directmsgfrom'] == '1' ) {
							echo ' selected="selected"';}
						?>
						>
	<?php
						esc_html_e( 'First Name Last Name @ CRM Name (e.g. John Doe @', 'zero-bs-crm' );
						echo ' ' . esc_html( $coname ) . ')';
	?>
</option>
						<option value="2" 
						<?php
						if ( isset( $settings['directmsgfrom'] ) && $settings['directmsgfrom'] == '2' ) {
							echo ' selected="selected"';}
						?>
						>
	<?php
						esc_html_e( 'CRM Name (e.g.', 'zero-bs-crm' );
						echo ' ' . esc_html( $coname ) . ')';
	?>
</option>
						<option value="3" 
						<?php
						if ( isset( $settings['directmsgfrom'] ) && $settings['directmsgfrom'] == '3' ) {
							echo ' selected="selected"';}
						?>
						><?php esc_html_e( 'Mail Delivery Method Sender Name', 'zero-bs-crm' ); ?></option>
					</select>
			</tr>

			</tbody>

		</table>


		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Unsubscribe Settings', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>


			<tr>
				<td class="wfieldname"><label for="wpzbs_unsub"><?php esc_html_e( 'Email Unsubscribe Line', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'This line will be shown in your email templates with the placeholder ##UNSUB-LINE##, we recommend you complete this where it is legal to offer contacts the ability to stop communication. We cannot be held responsible for your emails meeting your local laws. Any text here will append this to your default email templates (Mail Campaigns).', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><input type="text" class="winput form-control" name="wpzbs_unsub" id="wpzbs_unsub" value="<?php echo empty( $settings['unsub'] ) ? '' : esc_attr( $settings['unsub'] ); ?>" placeholder="<?php esc_attr_e( "e.g. You're seeing this because you're registered as a contact of Michael Scott Paper Company, if you'd like to unsubscribe from any future communications please click ##UNSUB-LINK##.", 'zero-bs-crm' ); ?>" /></td>
			</tr>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_unsubpage"><?php esc_html_e( 'Unsubscribe Page', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Select the WordPress page with your unsubscribe shortcode (Required for Mail Campaigns).', 'zero-bs-crm' ); ?>
				</td>
				<td>
					<?php

					// reget
					$pageID = (int) zeroBSCRM_getSetting( 'unsubpage', true );

					// catch unsub recreate
					if ( isset( $_GET['recreateunsubpage'] ) && isset( $_GET['unsubPageNonce'] ) && wp_verify_nonce( $_GET['unsubPageNonce'], 'recreate-unsub-page' ) ) {

						// recreate
						$pageID = zeroBSCRM_unsub_checkCreatePage();

						if ( ! empty( $pageID ) && $pageID > 0 ) {

							// success
							$newPageURL = admin_url( 'post.php?post=' . $pageID . '&action=edit' );
							echo zeroBSCRM_UI2_messageHTML( 'info', __( 'Unsubscribe Page Created', 'zero-bs-crm' ), __( 'Jetpack CRM successfully created a new page for unsubscriptions.', 'zero-bs-crm' ) . '<br /><br /><a href="' . $newPageURL . '" class="ui button primary" target="_blank">' . __( 'View Page', 'zero-bs-crm' ) . '</a>', 'info', 'new-unsub-page' );

						} else {

							// failed
							echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'Page Was Not Created', 'zero-bs-crm' ), __( 'Jetpack CRM could not create a new page for unsubscriptions. If this persists, please contact support.', 'zero-bs-crm' ), 'info', 'new-unsub-page' );

						}
					}

					$args = array(
						'name'             => 'wpzbscrm_unsubpage',
						'id'               => 'wpzbscrm_unsubpage',
						'show_option_none' => __( 'No Page Found!', 'zero-bs-crm' ),
					);
					if ( $pageID != -1 ) {
						$args['selected'] = (int) $pageID;
					} else {
						$args['selected'] = 0;
					}
					wp_dropdown_pages( $args );

					// recreate link
					$recreatePageURL = wp_nonce_url( admin_url( 'admin.php?page=' . $zbs->slugs['settings'] . '&tab=mail&recreateunsubpage=1' ), 'recreate-unsub-page', 'unsubPageNonce' );

					// detect missing page (e.g. it hasn't autocreated for some reason, or they deleted), and offer a 'make page' button
					if ( zeroBSCRM_mail_getUnsubscribePage() == -1 ) {

						echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'No Unsubscription Page Found!', 'zero-bs-crm' ), __( 'Jetpack CRM could not find a published WordPress page associated with Unsubscriptions. Please recreate this page to continue using the mail functionality of Jetpack CRM.', 'zero-bs-crm' ) . '<br /><br /><a href="' . $recreatePageURL . '" class="ui button primary">' . __( 'Recreate Unsubscription Page', 'zero-bs-crm' ) . '</a>', 'info', 'no-unsub-page' );

					} else {

						// no need really?

					}
					?>
				</td>
			</tr>

			<tr>
				<td class="wfieldname"><label for="wpzbs_unsubmsg"><?php esc_html_e( 'Email Unsubscribe Line', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'This message will be shown to contacts after they have unsubscribed.', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><input type="text" class="winput form-control" name="wpzbs_unsubmsg" id="wpzbs_unsubmsg" value="<?php echo empty( $settings['unsubmsg'] ) ? '' : esc_attr( $settings['unsubmsg'] ); ?>" placeholder="e.g. You've been successfully unsubscribed." /></td>
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

		<div style="text-align:center;margin-top:3.5em">
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['settings'] . '&tab=maildelivery' ) ); ?>" class="ui button positive"><?php esc_html_e( 'Setup Mail Delivery', 'zero-bs-crm' ); ?></a>&nbsp;
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['email-templates'] ) ); ?>" class="ui button positive"><?php esc_html_e( 'Edit Email Templates', 'zero-bs-crm' ); ?></a>
		</div>

	</form>


	<script type="text/javascript">

		jQuery(function(){


		});


	</script>

</div>
