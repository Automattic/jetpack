<?php
/*
!
 * Main Email page: This is the main file which renders the (single-send) email layout
 * Jetpack CRM - https://jetpackcrm.com
 *
 * Requires that 'admin/email/ajax.php' is loaded on core init
 *
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

// render the page
// Moved up a layer (adminpages) until we refine MVC/model
// jpcrm_render_emailbox();

/*
* Renders email box (previously zeroBSCRM_emails_UI())
*/
function jpcrm_render_emailbox() {

	global $zbs;

		$sending_mail = false;
	if ( isset( $_GET['zbsprefill'] ) && ! empty( $_GET['zbsprefill'] ) ) {
			$sending_mail = true;
		?>
				<style>
					.zbs-email-list, .zbs-email-content{
						display:none;
					}
				</style>
			<?php
	}

		// } "cal" is the task scheduler. hide the task info on the sidebar, if installed
	if ( ! zeroBSCRM_isExtensionInstalled( 'cal' ) ) {
		?>
		<style>
			.task-cell, .panel-h4, .the-tasks{
				display:none;
			}
		</style>
		<?php
	}

		// more scripts and styles into an enqueue :-)
	?>



	<div class="inbox-wrap">

		<div class="ui vertical menu inverted inbox-nav">

			<a class="item zbs-starred-link">
				<div class="nav-men">
					<i class="ui icon star"></i> <?php esc_html_e( 'Starred', 'zero-bs-crm' ); ?>
				</div>
			</a>


			<a class="item zbs-hide">
				<div class="nav-men">
					<i class="ui icon exclamation triangle"></i><?php esc_html_e( 'Important', 'zero-bs-crm' ); ?>
				</div>
			</a>

			<?php if ( ! $sending_mail ) { ?>
				<a class="active item zbs-sent-link">
			<?php } else { ?>
				<a class="item zbs-sent-link">
			<?php } ?>
				<div class="nav-men">
					<i class="ui icon paper plane"></i> <?php esc_html_e( 'Sent', 'zero-bs-crm' ); ?>
				</div>
			</a>

			<?php do_action( 'zbs_emails_scheduled_nav' ); ?>

			<div class='push-down'>

				<?php do_action( 'zbs_before_email_templates_nav' ); ?>

				<a class="item" href="<?php echo esc_url( admin_url( 'admin.php?page=zbs-email-templates&zbs_template_id=1' ) ); ?>">
					<div class="nav-men">
						<i class="ui icon file alternate outline"></i> <?php esc_html_e( 'Templates', 'zero-bs-crm' ); ?>
					</div>
				</a>

				<a class="item" href="<?php echo esc_url( admin_url( 'admin.php?page=zerobscrm-plugin-settings&tab=mail' ) ); ?>">
					<div class="nav-men">
						<i class="ui icon cog"></i> <?php esc_html_e( 'Settings', 'zero-bs-crm' ); ?>
					</div>
				</a>
			</div>

			
		</div>

		<?php if ( $sending_mail ) { ?>
			<div id='zbs-send-single-email-ui' style='display:block;'>
		<?php } else { ?>
			<div id='zbs-send-single-email-ui' style='display:none;'>
		<?php } ?>
			<?php zeroBSCRM_pages_admin_sendmail(); ?>
		</div>

		<div class='zbs-email-list starred-email-list app-content'>
			<?php
			$email_hist = zeroBSCRM_get_email_history( 0, 50, -1, '', -1, true, -1, true );
			// zbs_prettyprint($email_hist);
			echo '<div class="ui celled list" style="background:white;">';
			$i = 0;
			if ( count( $email_hist ) == 0 ) {
				echo "<div class='no-emails'><i class='ui icon exclamation'></i><br/>" . esc_html__( 'No emails of this type', 'zero-bs-crm' ) . '</div>';
			}
			foreach ( $email_hist as $email ) {
					$contact_meta = zeroBS_getCustomerMeta( $email->zbsmail_target_objid );
					// skip if contact doesn't exist (e.g. was deleted)
				if ( ! $contact_meta ) {
					continue;
				}
					echo '<div class="item zbs-email-list-item zbs-email-list-' . esc_attr( $email->zbsmail_sender_thread ) . '" data-cid="' . esc_attr( $email->zbsmail_target_objid ) . '" data-emid="' . esc_attr( $email->zbsmail_sender_thread ) . '" data-fav="' . esc_attr( $email->zbsmail_starred ) . '">';
						echo "<div class='zbs-contact'>";
						// echo "<input type='checkbox' />";
							echo zeroBS_customerAvatarHTML( $email->zbsmail_target_objid );
							echo "<div class='zbs-who'>" . esc_html( $contact_meta['fname'] ) . ' ' . esc_html( $contact_meta['lname'] ) . '</div>';
						echo '</div>';
				// echo '<img class="ui avatar image" src="/images/avatar/small/helen.jpg">';
					echo '<div class="content">';
					echo '<div class="header">' . esc_html( $email->zbsmail_subject ) . '</div>';
						echo '<div class="the_content">' . esc_html( wp_html_excerpt( $email->zbsmail_content, 200 ) ) . '</div>';

				if ( $email->zbsmail_starred == 1 ) {
					echo "<i class='ui icon star yellow zbs-list-fav zbs-list-fav-" . esc_attr( $email->zbsmail_sender_thread ) . "'></i>";
				} else {
					echo "<i class='ui icon star yellow zbs-list-fav zbs-list-fav-" . esc_attr( $email->zbsmail_sender_thread ) . "' style='display:none;'></i>";
				}

					echo '</div>';
				echo '</div>';
				++$i;
			}

			echo '</div>';

			?>
	  
		</div>

		<div class='zbs-email-list sent-email-list app-content'>
			<?php
			$email_hist = zeroBSCRM_get_email_history( 0, 50, -1, 'sent', -1, true );
			// zbs_prettyprint($email_hist);
			echo '<div class="ui celled list" style="background:white;">';
			$i = 0;

			if ( count( $email_hist ) == 0 ) {
				echo "<div class='no-emails'><i class='ui icon exclamation'></i><br/>" . esc_html__( 'No emails of this type', 'zero-bs-crm' ) . '</div>';
			}

			foreach ( $email_hist as $email ) {
					$contact_meta = zeroBS_getCustomerMeta( $email->zbsmail_target_objid );
					// skip if contact doesn't exist (e.g. was deleted)
				if ( ! $contact_meta ) {
					continue;
				}
					echo '<div class="item zbs-email-list-item zbs-email-list-' . esc_attr( $email->zbsmail_sender_thread ) . '" data-cid="' . esc_attr( $email->zbsmail_target_objid ) . '" data-emid="' . esc_attr( $email->zbsmail_sender_thread ) . '" data-fav="' . esc_attr( $email->zbsmail_starred ) . '">';
						echo "<div class='zbs-contact'>";
						// echo "<input type='checkbox' />";
							echo zeroBS_customerAvatarHTML( $email->zbsmail_target_objid );
							echo "<div class='zbs-who'>" . esc_html( $contact_meta['fname'] ) . ' ' . esc_html( $contact_meta['lname'] ) . '</div>';
						echo '</div>';
				// echo '<img class="ui avatar image" src="/images/avatar/small/helen.jpg">';
					echo '<div class="content">';
					echo '<div class="header">' . esc_html( $email->zbsmail_subject ) . '</div>';
					echo '<div class="the_content">' . esc_html( wp_html_excerpt( $email->zbsmail_content, 200 ) ) . '</div>';

				if ( $email->zbsmail_starred == 1 ) {
					echo "<i class='ui icon star yellow zbs-list-fav zbs-list-fav-" . esc_attr( $email->zbsmail_sender_thread ) . "'></i>";
				} else {
					echo "<i class='ui icon star yellow zbs-list-fav zbs-list-fav-" . esc_attr( $email->zbsmail_sender_thread ) . "' style='display:none;'></i>";
				}

					echo '</div>';
				echo '</div>';
				++$i;
			}

			echo '</div>';

			?>

		</div>

		<div class='zbs-email-content inverted dimmer app-content'>
			<div class="zbs-ajax-loading">
				<div class='click-email-to-load'>
					<i class="ui icon envelope outline zbs-click-email-icon" style="font-size:30px;font-weight:100"></i>
					<h4 class="click-email"><?php esc_html_e( 'Click an email to load details', 'zero-bs-crm' ); ?></h4>
				</div>
				<img alt='<?php esc_attr_e( 'Loading', 'zero-bs-crm' ); ?>' class='spinner-gif' src="<?php echo esc_url( admin_url( 'images/spinner.gif' ) ); ?>" />
			</div>

			<div id="zbs-email-body">
				<div class='zbs-email-actions'>
				<i class="ui icon star outline" id="zbs-star-this"></i>
					<i class="trash alternate outline icon"></i>
				</div>

				<div class='zbs-email-thread'>

				</div>
			</div>

			<div id="zbs-email-send-message-thread">
			<?php
				do_action( 'zbs_email_canned_reply' );
			?>
			<?php
				$editor_settings = array(
					'media_buttons' => false,
					'quicktags'     => false,
					'tinymce'       => array(
						'toolbar1' => 'bold,italic,underline,bullist,numlist,link,unlink,forecolor,undo,redo',
					),
					'editor_class'  => 'ui textarea zbs-email-thread',
				);
				wp_editor( '', 'zbs_send_email_thread', $editor_settings );
				?>
			  
			<?php
				do_action( 'zbs_email_schedule_send_time' );
			?>
			<div class='zbs-send-email-thread-button ui button black'><?php esc_html_e( 'Send', 'zero-bs-crm' ); ?></div>
			</div>


	  
		</div>

		<div class='zbs-email-contact-info app-content'>
				<?php
				// Placeholders
				$customer_panel = array(
					'avatar'      => '',
					'customer'    => array(
						'fname'  => 'John',
						'lname'  => 'Doe',
						'status' => __( 'Lead', 'zero-bs-crm' ),
					),
					'tasks'       => array(),
					'trans_value' => 0,
					'quote_value' => 0,
				);

				echo "<div class='customer-panel-header'>";
					echo "<div class='panel-edit-contact'>";
						echo "<a class='edit-contact-link' href='" . esc_url( admin_url( 'admin.php?page=zbs-add-edit&action=edit&zbsid=' ) ) . "'>" . esc_html__( 'Edit Contact', 'zero-bs-crm' ) . '</a>';
					echo '</div>';
					echo "<div id='panel-customer-avatar'>" . esc_html( $customer_panel['avatar'] ) . '</div>';
					echo "<div id='panel-name'>" . esc_html( $customer_panel['customer']['fname'] . ' ' . $customer_panel['customer']['lname'] ) . '</div>';

					echo '<div id="panel-status">' . esc_html( $customer_panel['customer']['status'] ) . '</div>';

					echo "<div class='simple-actions zbs-hide'>";
						echo "<a class='ui label circular'><i class='ui icon phone'></i></a>";
						echo "<a class='ui label circular'><i class='ui icon envelope'></i></a>";
					echo '</div>';
				echo '</div>';

				$tasks     = 25;
				$progress  = 10;
				$completed = $tasks - $progress;

				echo "<div class='customer-panel-task-summary'>";

					echo "<div class='task-cell'>";
						echo "<div class='the-number total-tasks-panel'>" . esc_html( $tasks ) . '</div>';
						echo "<div class='the-type'>" . esc_html__( 'Tasks', 'zero-bs-crm' ) . '</div>';
					echo '</div>';

					echo "<div class='task-cell'>";
						echo "<div class='the-number completed-tasks-panel'>" . esc_html( $completed ) . '</div>';
						echo "<div class='the-type'>" . esc_html__( 'Completed', 'zero-bs-crm' ) . '</div>';
					echo '</div>';

					echo "<div class='task-cell'>";
						echo "<div class='the-number inprogress-tasks-panel'>" . esc_html( $progress ) . '</div>';
						echo "<div class='the-type'>" . esc_html__( 'In Progress', 'zero-bs-crm' ) . '</div>';
					echo '</div>';

				echo '</div>';

				echo "<div class='clear'></div>";

				echo "<div class='ui divider'></div>";

				echo "<div class='total-paid-wrap'>";
						echo "<div class='total-paid cell'><div class='heading'>" . esc_html__( 'Total Paid', 'zero-bs-crm' ) . "</div><span class='the_value'>" . esc_html( $customer_panel['trans_value'] ) . '</span></div>';
						echo "<div class='total-due cell'><div class='heading'>" . esc_html__( 'Total Due', 'zero-bs-crm' ) . "</div><span class='the_value'>" . esc_html( $customer_panel['quote_value'] ) . '</span></div>';
				echo '</div>';

				echo "<div class='clear'></div>";

				echo "<div class='ui divider'></div>";

				echo "<div class='panel-left-info'>";
					echo "<i class='ui icon envelope outline'></i> <span class='panel-customer-email'></span>";
					echo '<br/>';
					echo "<i class='ui icon phone'></i> <span class='panel-customer-phone'></span>";

				echo "<h4 class='panel-h4'>" . esc_html__( 'Tasks', 'zero-bs-crm' ) . '</h4>';

				echo "<ul class='the-tasks'>";
				foreach ( $customer_panel['tasks'] as $task ) {
					if ( $task['actions']['complete'] == 1 ) {
						echo "<li class='complete'><i class='ui icon check green circle'></i> " . esc_html( $task['title'] ) . '</li>';
					} else {
						echo "<li class='incomplete'>" . esc_html( $task['title'] ) . '</li>';
					}
				}
				echo '</ul>';

				echo "<div class='clear'></div>";

				echo '</div>';

				echo "<div class='clear'></div>";

				?>
		</div>
		<div class='clear'></div>
	</div>

	<script type="text/javascript">

		// WH: 
		// ALTHOUGH THIS WORKS 
		// (Loads a sent msg)
		// It's not currently used, because send message func doesn't return ID, so just loading sent for now
		var zbsMailBoxShowSentID = 
		<?php

			$sentID = -1;

		if ( isset( $_GET['sentID'] ) ) {

			$sentID = (int) sanitize_text_field( $_GET['sentID'] );

		}

		if ( $sentID > 0 ) {
			echo esc_html( $sentID );
		} else {
			echo -1;
		}

		?>
		;

		// WH put here to catch reload of page with 'sent' id
		// ... not sure where rest of your JS sits can't find
		jQuery(function(){

			if (typeof window.zbsMailBoxShowSentID != "undefined" && window.zbsMailBoxShowSentID > 0 && jQuery('.zbs-email-list-' + window.zbsMailBoxShowSentID).length > 0){

				// jump to This (by fake clicking!)
				jQuery('.zbs-email-list-' + window.zbsMailBoxShowSentID).trigger( 'click' );
			}

		});


	</script>
	<?php
}

/*
* Renders singular 'send' pane of email box
*/
function zeroBSCRM_pages_admin_sendmail() {

	// declaring default
	$customerID = -1;

	// check perms
	if ( zeroBSCRM_permsSendEmailContacts() ) {

		global $zbs;

		$customerMeta = array();

		// prefill?
		if ( isset( $_GET['zbsprefill'] ) && ! empty( $_GET['zbsprefill'] ) ) {
			// WH modernised for you:
			$customerMeta = $zbs->DAL->contacts->getContact(
				(int) sanitize_text_field( $_GET['zbsprefill'] ),
				array( 'ignoreowner' => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT ) )
			);

			// zbs_prettyprint($customerMeta);

			$customerID = (int) sanitize_text_field( $_GET['zbsprefill'] );
			$toEmail    = $customerMeta['email'];

		}

		if ( isset( $_POST['zbs-send-email-to'] ) && ! empty( $_POST['zbs-send-email-to'] ) ) {

			// retrieve email
			$send_to_email = sanitize_email( $_POST['zbs-send-email-to'] );

			// mail delivery method (slug, e.g. 'zbs-whatever'):
			$delivery_method = -1; if ( isset( $_POST['zbs-mail-delivery-acc'] ) ) {
				$delivery_method = sanitize_text_field( $_POST['zbs-mail-delivery-acc'] );
			}
			if ( empty( $delivery_method ) ) {
				$delivery_method = -1;
			}

			// send
			jpcrm_send_single_email_from_box( $send_to_email, -1, $delivery_method, false, true );

		}

		?>

	<div class="ui grid">

		<div class="sixteen wide column">

		<?php
					// check for unsub flag + make aware
		if ( isset( $customerID ) && $customerID > 0 && $zbs->DAL->contacts->getContactDoNotMail( $customerID ) ) {

			$label = zeroBSCRM_UI2_label( 'red', '', __( 'Email Unsubscribed', 'zero-bs-crm' ), __( '(Do Not Email Flag)', 'zero-bs-crm' ), 'do-not-email' );
			echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'This contact has a flag against them:', 'zero-bs-crm' ), $label . '<br/>' . __( '(This means they\'ve asked you not to email them (Unsubscribed). You can still email them here, if you so choose.', 'zero-bs-crm' ) );

		}
		?>
			<form autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); ?>" id="zbs-send-single-email" class="ui form" action="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['emails'] ) ); ?>" method="POST">

			<?php
			if ( is_array( $customerMeta ) && array_key_exists( 'fname', $customerMeta ) ) {
				$custName = $customerMeta['fname'] . ' ' . $customerMeta['lname'];
				$toEmail  = $customerMeta['email'];
			} else {
				$custName = '';
				$toEmail  = '';
			}

			// determine whether or not to show error message
			$show_no_email_error = ( $toEmail == '' && isset( $customerID ) && $customerID > 0 );

			echo zeroBSCRM_UI2_messageHTML( 'red' . ( $show_no_email_error ? '' : ' hidden' ), '', __( 'No email exists for this contact. No message will be sent. Please edit the contact and add an email address.', 'zero-bs-crm' ), 'ui danger', 'email_contact_selector' );

			echo zeroBSCRM_CustomerTypeList( 'zbscrmjs_customer_setCustomerEmail', $custName, true );
			wp_nonce_field( 'jpcrm-update-client-details' );
			?>
  
			<input type="hidden" id="zbs-send-email-to" name="zbs-send-email-to" value="<?php echo esc_attr( $toEmail ); ?>"/>
			<br/>
			<?php zeroBSCRM_mailDelivery_accountDDL( 1 ); ?>
			<br/>
			<br/>
			<input type="text" id="zbs-send-email-title" name="zbs-send-email-title" placeholder="<?php esc_attr_e( 'Your email subject', 'zero-bs-crm' ); ?>"/>
			<br/><br/>
			<label><?php esc_html_e( 'Message', 'zero-bs-crm' ); ?></label>
			<?php
				do_action( 'zbs_email_canned_reply_single' );
			?>
			<?php
				$editor_settings = array(
					'media_buttons' => false,
					'editor_height' => 220,
					'quicktags'     => false,
					'tinymce'       => array(
						'toolbar1' => 'bold,italic,underline,bullist,numlist,link,unlink,forecolor,undo,redo',
					),
					'editor_class'  => 'ui textarea',
				);
				wp_editor( '', 'zbs_send_email_content', $editor_settings );

				?>
			<br/>
			<input type="submit" class="jpcrm-button" value="<?php esc_attr_e( 'Send Email', 'zero-bs-crm' ); ?>" />

			<?php
			do_action( 'zbs_single_email_schedule', $customerID );
			do_action( 'zbs_end_emails_ui' );
			?>

			<!--
			<div class='ui button large left save-draft-email' style="float:right"><?php // _e('Save Draft','zero-bs-crm'); ?></div>
				-->
			</form>
		</div>

		<style>
		.email-sending-record {
			padding: 10px;
		}
		time {
			white-space: nowrap;
			text-transform: uppercase;
			font-size: .5625rem;
			margin-left: 5px;
		}
		.hist-label {
			margin-right: 6px !important;
		}

		</style>



	</div>

	<script type="text/javascript">

	var zbsEmailSingleLang = {

		couldnotload: '<?php echo esc_html( zeroBSCRM_slashOut( __( 'Could not load email thread, please try again', 'zero-bs-crm' ), true ) ); ?>'
	}
	var zbsContactEditPrefix = '<?php echo jpcrm_esc_link( 'edit', -1, 'zerobs_customer', true ); ?>';

	</script>

		<?php

	} else {

		// no rights
		esc_html_e( 'You do not have permissions to access this page', 'zero-bs-crm' );

	}
}
