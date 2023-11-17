<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 16th June 2020
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

/**
 * Load the file for a given page name
 *
 * @param string $page_name The page file name (e.g. `settings/main`)
 * @param string $alt_path An alternate filepath prefix
 */
function jpcrm_load_admin_page( $page_name, $alt_path = ZEROBSCRM_PATH ) {

	$target_file = $alt_path . "admin/$page_name.page.php";

	if ( file_exists( $target_file ) ) {

		require_once $target_file;

	} else {

		echo zeroBSCRM_UI2_messageHTML( 'warning', '', __( 'Could not load the requested page.', 'zero-bs-crm' ) );

	}
}

/*
======================================================
	Page loading
	====================================================== */

/*
* Dashboard
*/
function zeroBSCRM_pages_dash() {
	jpcrm_load_admin_page( 'dashboard/main' );
}

/*
* Settings page
*/
function zeroBSCRM_pages_settings() {
	jpcrm_load_admin_page( 'settings/main' );
}

/*
* System Status page
*/
function zeroBSCRM_pages_systemstatus() {
	jpcrm_load_admin_page( 'system/main' );
}

/*
* CRM Resources page
*/
function zeroBSCRM_pages_crmresources() {
	jpcrm_load_admin_page( 'crm-resources/main' );
}

/**
 * Load the Support Contact page
 */
function jpcrm_pages_support() {
	jpcrm_load_admin_page( 'support/main' );
}

// Email Box
function zeroBSCRM_pages_emailbox() {
	// load
	jpcrm_load_admin_page( 'email/main' );
	// render
	jpcrm_render_emailbox();
}

// Single send page (subpage of Emailbox?)
function zeroBSCRM_pages_emailsend() {
	// load
	jpcrm_load_admin_page( 'email/main' );
	// render
	zeroBSCRM_pages_admin_sendmail();
}

// User Profile
function zeroBSCRM_pages_admin_your_profile() {

	jpcrm_load_admin_page( 'user-profile/main' );
}

// Reminders
function zeroBSCRM_pages_admin_reminders() {

	jpcrm_load_admin_page( 'user-profile/reminders' );
}

/*
* Contact views:
*/
function zeroBSCRM_pages_admin_view_page_contact( $id = -1 ) {

	// load
	jpcrm_load_admin_page( 'contact/view' );
	// render
	jpcrm_render_contact_view_page( $id );
}

// file add/edit
function zeroBSCRM_pages_add_or_edit_file() {

	jpcrm_load_admin_page( 'contact/add-file' );
	zeroBSCRM_render_add_or_edit_file();
}

/*
* Company views:
*/
function zeroBSCRM_pages_admin_view_page_company( $id = -1 ) {

	// load
	jpcrm_load_admin_page( 'company/view' );
	// render
	jpcrm_render_company_view_page( $id );
}

/**
 * Load the Automations admin page
 *
 * @return void
 */
function jpcrm_pages_automations() {
	jpcrm_load_admin_page( 'automations/main' );
}

/*
======================================================
	/ Page loading
	====================================================== */

/*
======================================================
	Edit Post - multiform data override (for metaboxes)
	====================================================== */

	// } Updated 1.2 so that this only fires on OUR post edit pages
	// } https://www.rfmeier.net/allow-file-uploads-to-a-post-with-wordpress-post_edit_form_tag-action/
function zeroBSCRM_update_edit_form() {

	global $post;

	// if invalid $post object, return
	if ( ! $post ) {
		return;
	}

	// get the current post type
	$post_type = get_post_type( $post->ID );

	// if post type is not 'post', return
	// if('post' != $post_type)
	if ( ! in_array( $post_type, array( 'zerobs_customer', 'zerobs_quote', 'zerobs_invoice', 'zerobs_transaction', 'zerobs_company' ) ) ) {
		return;
	}

	// echo ' enctype="multipart/form-data"';
	printf( ' enctype="multipart/form-data" encoding="multipart/form-data" ' );
}
	add_action( 'post_edit_form_tag', 'zeroBSCRM_update_edit_form' );

/*
======================================================
	/ Edit Post - multiform data override (for metaboxes)
	====================================================== */

/*
======================================================
	/ Edit Post Messages (i.e. "Post Updated => Task Updated")
	/ See: http://ryanwelcher.com/2014/10/change-wordpress-post-updated-messages/
	====================================================== */

add_filter( 'post_updated_messages', 'zeroBSCRM_post_updated_messages' );
function zeroBSCRM_post_updated_messages( $messages ) {

	$post             = get_post();
	$post_type        = get_post_type( $post );
	$post_type_object = get_post_type_object( $post_type );

	$messages['zerobs_event'] = array(
		0  => '', // Unused. Messages start at index 1.
		1  => __( 'Task updated.', 'zero-bs-crm' ),
		2  => __( 'Custom field updated.', 'zero-bs-crm' ),
		3  => __( 'Custom field deleted.', 'zero-bs-crm' ),
		4  => __( 'Task updated.', 'zero-bs-crm' ),
		/* translators: %s: date and time of the revision */
		5  => isset( $_GET['revision'] ) ? sprintf( __( 'Task restored to revision from %s', 'zero-bs-crm' ), wp_post_revision_title( (int) sanitize_text_field( $_GET['revision'] ), false ) ) : false, // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		6  => __( 'Task saved.', 'zero-bs-crm' ),
		7  => __( 'Task saved.', 'zero-bs-crm' ),
		8  => __( 'Task submitted.', 'zero-bs-crm' ),
		9  => sprintf(
			__( 'Task scheduled for: <strong>%1$s</strong>.', 'zero-bs-crm' ),
			// translators: Publish box date format, see http://php.net/date
			date_i18n( 'M j, Y @ G:i', strtotime( $post->post_date ) )
		),
		10 => __( 'Task updated.', 'zero-bs-crm' ),
	);

		// you can also access items this way
		// $messages['post'][1] = "I just totally changed the Updated messages for standards posts";

		// return the new messaging
	return $messages;
}

// } Deactivation error page - show if someone tried to deactivate the core with extensions still installed
function zeroBSCRM_pages_admin_deactivate_error() {
	?>
	<div class='ui segment' style='text-align:center;'>
		<div style='font-size:60px;padding:30px;'>⚠️</div>
		<h3><?php esc_html_e( 'Error', 'zero-bs-crm' ); ?></h3>
		<p style='font-size:18px;'>
			<?php esc_html_e( 'You have tried to deactivate the Core while extensions are still active. Please de-activate extensions first.', 'zero-bs-crm' ); ?>
		</p>
		<p><a class='ui button blue' href="<?php echo esc_url( admin_url( 'plugins.php' ) ); ?>">Back to Plugins</a></p>
	</div>
	<?php
}

// } Team UI page - i.e. to guide vs the wp-users.php
// } Added this to be able to make it easier for people to add team members to the CRM
// } Also to control permissions.
// } WHLOOK - is there a way of us finding out from telemetry how many people are actually using
// } roles that are like the "customer" only role - as discussed I think our CRM has evolved past this
// } and we should have users as "CRMTEAM" members, and then "manage permissions" for them (vs the actual specific "role")
function zeroBSCRM_pages_admin_team() {

	global $ZBSCRM_t,$wpdb;

	// } we can do this via AJAX eventually - but for now lets do it via normal $_POST stuff...
	$searching_users = false;

	// } User Search...
	if ( isset( $_POST['zbs-search-wp-users'] ) ) {

		$search   = sanitize_text_field( $_POST['zbs-search-wp-users'] );
		$users    = new WP_User_Query(
			array(
				'search'         => '*' . esc_attr( $search ) . '*',
				'search_columns' => array(
					'user_nicename',
					'user_email',
				),
			)
		);
		$wp_users = $users->get_results();

		$zbsRoleIDs = array();
		foreach ( $wp_users as $user ) {
			$zbsRoleIDs[] = $user->ID;
		}

		$searching_users = true;

		// zbs_prettyprint($users_found);

	} else {

		// Jetpack CRM team roles - tidied since also use in meta tracking
		$crm_users = zeroBSCRM_crm_users_list();
		foreach ( $crm_users as $user ) {
			$zbsRoleIDs[] = $user->ID;
		}
	}

	?>
	<script type="text/javascript">

		jQuery(function($){

			jQuery('#zbs-search-wp-users').on("click"){
				jQuery("#zbs-users-search").submit();
			}


		});
	</script>

		



	<div class="ui segment zbs-inner-segment">
	<div id="zbs-team-mechanics">

		<form id="zbs-users-search" action="#" method="POST">
		<div class="ui search left" style="background:white;width:300px;float:left">
		<div class="ui icon input" style="width:100%;">
			<input class="prompt" name="zbs-search-wp-users"  type="text" placeholder="Search WordPress Users...">
			<i class="search icon" id="zbs-search-wp-users"></i>
		</div>
		<div class="results"></div>
		</div>
	</form>


		<a style="margin-left:10px;" class="ui button black right" href="<?php echo esc_url( admin_url( 'user-new.php?zbsslug=zbs-add-user' ) ); ?>">
		<i class="add icon"></i> 
			<?php esc_html_e( 'Add New Team Member', 'zero-bs-crm' ); ?>
		</a>

	</div>

	<div class='clear'></div>

	<div class="ui divider"></div>

	<table class="ui fixed single line celled table" id="zbs-team-user-table">
		<tbody>
		<th style="width:40px;"><?php esc_html_e( 'ID', 'zero-bs-crm' ); ?></th>
		<th><?php esc_html_e( 'Team member', 'zero-bs-crm' ); ?></th>
		<th><?php esc_html_e( 'Role', 'zero-bs-crm' ); ?></th>
		<th><?php esc_html_e( 'Last login', 'zero-bs-crm' ); ?></th>
		<th><?php esc_html_e( 'Manage permissions', 'zero-bs-crm' ); ?></th>
		<?php
		foreach ( $zbsRoleIDs as $ID ) {
			$user = get_user_by( 'ID', $ID );

			// zbs_prettyprint($user);

			$edit_url = admin_url( 'user-edit.php?user_id=' . $ID . '&zbsslug=zbs-edit-user' );

			$caps_output = '';
			foreach ( $user->caps as $k => $v ) {
				$caps_output .= ' ' . zeroBSCRM_caps_to_nicename( $k );
			}

			echo '<tr><td>' . esc_html( $ID ) . '</td><td>' . jpcrm_get_avatar( $ID, 30 ) . "<div class='dn'>" . esc_html( $user->display_name ) . '</div></td><td>' . esc_html( $caps_output ) . '</td>';

			echo '<td>' . esc_html( zeroBSCRM_wpb_lastlogin( $ID ) . ' ' . __( 'ago', 'zero-bs-crm' ) ) . '</td>';

			echo "<td><a href='" . esc_url( $edit_url ) . "'' data-uid='" . esc_attr( $ID ) . "' class='zbs-perm-edit ui button mini black'>"; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

			esc_html_e( 'Manage permissions', 'zero-bs-crm' );

			echo '</a></td>';

			echo '</tr>';

			// zbs_prettyprint($user);
		}

		?>

		</tbody>
	</table>


		</div>

	<?php
}

// } this function turns our caps into a nicename for outputting
function zeroBSCRM_caps_to_nicename( $caps = '' ) {

	$nicename = '';

	switch ( $caps ) {
		case 'administrator':
			$nicename = __( 'Full Jetpack CRM Permissions (WP Admin)', 'zero-bs-crm' );
			break;

		case 'zerobs_admin':
			$nicename = __( 'Full Jetpack CRM Permissions (CRM Admin)', 'zero-bs-crm' );
			break;

		case 'zerobs_customermgr':
			$nicename = __( 'Manage Contacts Only', 'zero-bs-crm' );
			break;

		case 'zerobs_invoicemgr':
			$nicename = __( 'Manage Invoices Only', 'zero-bs-crm' );
			break;

		case 'zerobs_quotemgr':
			$nicename = __( 'Manage Quotes Only', 'zero-bs-crm' );
			break;

		case 'zerobs_transactionmgr':
			$nicename = __( 'Manage Transactions Only', 'zero-bs-crm' );
			break;

		case 'zerobs_mailmgr':
			$nicename = __( 'Manage Mail Only', 'zero-bs-crm' );
			break;

		default:
			$nicename = ucfirst( $caps );
			break;

	}

	return $nicename;
}

// } This is NOTIFICATIONS UI on the back on FEEDBACK from customers and Google Forms we were having people
// } saying things like "This is GREAT, just wished it integrated with WooCommerce (i.e. unaware it does)"
// } My thoughts here is it a page which detects certain classes etc (e.g. WooCommerce) and displays a notification
// } about it, and the benefits of them getting WooSync :-)
function zeroBSCRM_pages_admin_notifications() {

	global $zeroBSCRM_notifications;

	// } have a whole plugin here, which does browser notifications etc for Plugin Hunt Theme
	// } have brought it into its own INCLUDE does things like new.comment have replaced it with our
	// } IA actions (new.customer, customer.status.change)

	?>



	<?php
	$zeroBSCRM_notifications = get_option( 'zbs-crm-notifications' );
	if ( $zeroBSCRM_notifications == '' ) {
		$zeroBSCRM_notifications = 0;
	}
	// } WooCommerce for starters -

	zeroBSCRM_notifyme_activity();

	// } Store in a notification here, e.g.
	$recipient = get_current_user_id();
	$sender    = -999; // in this case...  we can call ZBS our -999 user
	$post_id   = 0; // i.e. not a post related activity
	$type      = 'woosync.suggestion';   // this is a extension suggestion type
	// notifyme_insert_notification($recipient,$sender,$post_id,$type);
}

/*
======================================================
	Admin Page Funcs (used for all adm pages)
	====================================================== */

	// } Admin Page header
function zeroBSCRM_pages_header( $subpage = '' ) {
	// TMB: all references in core are removed, so once we confirm extensions don't use this we can delete it
}

	// } Admin Page footer
function zeroBSCRM_pages_footer() {
	// TMB: all references in core are removed, so once we confirm extensions don't use this we can delete it
}

	// } Gross redir page
function zeroBSCRM_pages_logout() {

	?>
		<script type="text/javascript">window.location='<?php echo esc_html( wp_logout_url() ); ?>';</script><h1 style="text-align:center">Logging you out!</h1>
		<?php
}

/*
======================================================
	/ Admin Page Funcs (used for all adm pages)
	====================================================== */

/*
======================================================
	Admin Pages
	====================================================== */

function zerobscrm_show_love( $url = '', $text = 'Jetpack - The WordPress CRM' ) {
	// } Quick function to 'show some love'.. called from PayPal Sync and other locale.
	?>
	<style>
	ul.share-buttons{
	list-style: none;
	padding: 0;
	text-align: center;
	}
	ul.share-buttons li{
	display: inline-block;
	margin-left:4px;
	}
	.logo-wrapper{
	padding:20px;
	}
	.logo-wrapper img{
	width:200px;
	}
	</style>

	<?php $text = htmlentities( $text, ENT_COMPAT ); ?>

	<p style="font-size:16px;text-align:center"><?php echo esc_html__( 'Jetpack CRM is the ultimate CRM tool for WordPress.', 'zero-bs-crm' ) . '<br/ >' . esc_html__( 'Help us get the word out and show some love... You know what to do...', 'zero-bs-crm' ); ?></p>
	<ul class="share-buttons">
	<li><a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fjetpackcrm.com&t=<?php echo esc_attr( $text ); ?>" target="_blank"
	><img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/Facebook.png'; ?>"></a></li>
	<li><a href="https://twitter.com/intent/tweet?source=https%3A%2F%2Fjetpackcrm.com&text=<?php echo esc_attr( $text ); ?>%20https%3A%2F%2Fjetpackcrm.com&via=zerobscrm" target="_blank" title="Tweet"><img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/Twitter.png'; ?>"></a></li>
	<li><a href="https://plus.google.com/share?url=https%3A%2F%2Fjetpackcrm.com" target="_blank" title="Share on Google+" onclick="window.open('https://plus.google.com/share?url=' + encodeURIComponent(<?php echo esc_attr( $url ); ?>)); return false;"><img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/Google+.png'; ?>"></a></li>
	<li><a href="http://www.tumblr.com/share?v=3&u=https%3A%2F%2Fjetpackcrm.com&t=<?php echo esc_attr( $text ); ?>&s=" target="_blank" title="Post to Tumblr"><img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/Tumblr.png'; ?>"></a></li>
	<li><a href="http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fjetpackcrm.com&description=<?php echo esc_attr( $text ); ?>" target="_blank" title="Pin it"><img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/Pinterest.png'; ?>"></a></li>
	<li><a href="https://getpocket.com/save?url=https%3A%2F%2Fjetpackcrm.com&title=<?php echo esc_attr( $text ); ?>" target="_blank" title="Add to Pocket"><img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/Pocket.png'; ?>"></a></li>
	<li><a href="http://www.reddit.com/submit?url=https%3A%2F%2Fjetpackcrm.com&title=<?php echo esc_attr( $text ); ?>" target="_blank" title="Submit to Reddit"><img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/Reddit.png'; ?>"></a></li>
	<li><a href="http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fjetpackcrm.com&title=<?php echo esc_attr( $text ); ?>&summary=&source=https%3A%2F%2Fjetpackcrm.com" target="_blank" title="Share on LinkedIn"><img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/LinkedIn.png'; ?>"></a></li>
	<li><a href="http://wordpress.com/press-this.php?u=https%3A%2F%2Fjetpackcrm.com&t=<?php echo esc_attr( $text ); ?>&s=" target="_blank" title="Publish on WordPress"><img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/WordPress.png'; ?>"></a></li>
	<li><a href="https://pinboard.in/popup_login/?url=https%3A%2F%2Fjetpackcrm.com&title=<?php echo esc_attr( $text ); ?>&description=" target="_blank" title="Save to Pinboard" <img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/Pinboard.png'; ?>"></a></li>
	<li><a href="mailto:?subject=&body=<?php echo esc_attr( $text ); ?>:%20https%3A%2F%2Fjetpackcrm.com" target="_blank" title="Email"><img src="<?php echo esc_url( ZEROBSCRM_URL ) . 'i/Email.png'; ?>"></a></li>
</ul>

	<?php
}

// } Main Config page
function zeroBSCRM_pages_home() {

	global $wpdb, $zbs; // } Req

	if ( ! current_user_can( 'admin_zerobs_manage_options' ) ) {
		wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) ); }

	// } Homepage
	if ( ! zeroBSCRM_isWL() ) {
		// Everyday homepage
		zeroBSCRM_html_home2();
	} else {
		// WL Home
		zeroBSCRM_html_wlHome();
	}

	?>
	<?php
}

// } Extensions page
function zeroBSCRM_pages_extensions() {

	global $wpdb, $zbs; // } Req

	if ( ! current_user_can( 'admin_zerobs_manage_options' ) ) {
		wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) ); }

	// } page
	zeroBSCRM_html_extensions();

	?>
	<?php
}

// Modules page
function jpcrm_pages_modules() {

	global $wpdb, $zbs;

	if ( ! current_user_can( 'admin_zerobs_manage_options' ) ) {
		wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) ); }

	jpcrm_html_modules();

	?>
	<?php
}

function zeroBSCRM_pages_admin_system_emails() {

	global $zbs;

	if ( ! current_user_can( 'admin_zerobs_manage_options' ) ) {
		wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) ); }

	// for now put this here, should probs be stored against template:
	// template id in here = can turn on/off
	$sysEmailsActiveInactive = array( 1, 2, 6 );

	// using tracking?
	$trackingEnabled = $zbs->settings->get( 'emailtracking' );

	?>
	<style>
	.email-stats{
		display: block;
		font-size: .75rem;
		text-transform: uppercase;
		color: #b8b8d9;
		font-weight: 600;
	}
	.email-template-box{
		cursor:pointer;
	}
	.the-templates a{
		color: black;
		font-weight:900;
	}
	time{
		white-space: nowrap;
		text-transform: uppercase;
		font-size: .5625rem;
		margin-left: 5px;
	}
	.hist-label{
		margin-right: 6px !important;
	}
	.email-sending-record{
		padding:10px;
	}
	.template-man-h4{
		font-weight:900;
		margin-bottom:0px;
		padding-top:10px;
	}
	.email-stats-top{
		font-size:13px;
		margin-top:5px;
		margin-bottom:5px;
	}
	.email-template-form label{
		text-transform: uppercase !important;
	}
	.the-templates .active{
	border: 1px solid #3f4347;
	border-left: 3px solid #3f4347;   
	}

	#tinymce{
		margin-left: 12px !important;
	}
	.lead{
		margin-top:5px;
		margin-bottom:5px;
	}
	.email-html-editor-free pre{
		text-align: center;
		padding: 50px;
		background: #f5f5f5;
		border: 2px dotted #ddd;
	}
	.update-nag{
		display:none;
	}
	</style>


	<script type="text/javascript">

		jQuery(function(){

			jQuery('#zbs-sys-email-template-editor i.info.popup').popup({
			//boundary: '.boundary.example .segment'
			});

			jQuery('.zbs-turn-inactive').on("click",function(e){
				if(jQuery(this).hasClass('negative')){
					return false;
				}
				jQuery('#zbs-saving-email-active').addClass('active');
				var theid = jQuery(this).data('emid');
				jQuery('#the-positive-button-' + theid).removeClass('positive');
				jQuery(this).addClass('negative');
				jQuery('.active-to-inactive-' + theid).addClass('negative');

				var t = {
					action: "zbs_save_email_status",
					id:  theid,
					status: 'i',
					security: jQuery( '#zbs-save-email_active' ).val(),
				}  
				i = jQuery.ajax({
					url: ajaxurl,
					type: "POST",
					data: t,
					dataType: "json"
				});
				i.done(function(e) {
				console.log(e);
				jQuery('#zbs-saving-email-active').removeClass('active');
				jQuery('#zbs-list-status-' + theid).removeClass('green').addClass('red');
				jQuery('#zbs-list-status-' + theid).html("<?php esc_html_e( 'Inactive', 'zero-bs-crm' ); ?>");
				}),i.fail(function(e) {
				});
			});


			jQuery('#force-email-create').on("click", function(e){
				jQuery('#zbs-saving-email-create').addClass('active');
		
				var t = {
					action: "zbs_create_email_templates",
					security: jQuery( '#zbs_create_email_nonce' ).val(),
				}  
			  
				i = jQuery.ajax({
					url: ajaxurl,
					type: "POST",
					data: t,
					dataType: "json"
				});
				i.done(function(e) {
				console.log(e);
				jQuery('#zbs-saving-email-create').removeClass('active');
				jQuery('#zbs-emails-result').html("");
				jQuery('.template-generate-results').show();

				// wh: just force reload it here?
				window.location.reload(false); 
			   
				}),i.fail(function(e) {
				});


			});


			jQuery('.zbs-turn-active').on("click",function(e){
			  
				jQuery('#zbs-saving-email-active').addClass('active');

				var theid = jQuery(this).data('emid');
				jQuery('#active-to-inactive-' + theid).removeClass('negative');
				jQuery(this).addClass('positive');
				jQuery('.inactive-to-active-' + theid).addClass('positive');

				//we want to AJAX save it using this action
				// zbs_save_email_status
				// with this nonce. 
				var t = {
					action: "zbs_save_email_status",
					id:  theid,
					status: 'a',
					security: jQuery( '#zbs-save-email_active' ).val(),
				}  
			  
				i = jQuery.ajax({
					url: ajaxurl,
					type: "POST",
					data: t,
					dataType: "json"
				});
				i.done(function(e) {
				console.log(e);
				jQuery('#zbs-saving-email-active').removeClass('active');
				jQuery('#zbs-list-status-' + theid).removeClass('red').addClass('green');
				jQuery('#zbs-list-status-' + theid).html("<?php esc_html_e( 'Active', 'zero-bs-crm' ); ?>");
				}),i.fail(function(e) {
				});


			});

		});

	</script>

	<?php

	$em_templates = '';
	$rec_ac       = 'active';
	$template_id  = -1;
	$tem_set      = '';

	if ( isset( $_GET['zbs_template_id'] ) && ! empty( $_GET['zbs_template_id'] ) ) {
		$em_templates = 'active';
		$rec_ac       = '';
		$template_id  = (int) sanitize_text_field( $_GET['zbs_template_id'] );
		$tem_set      = '';
	} elseif ( isset( $_GET['zbs_template_editor'] ) && ! empty( $_GET['zbs_template_editor'] ) ) {
		$em_templates = '';
		$rec_ac       = '';
		$template_id  = -1;
		$tem_set      = 'active';
	}

	$rec_acc_link = admin_url( 'admin.php?page=zbs-email-templates' );

	?>

	<div class="ui grid" style="margin-right:20px;">
	<div class="eight wide column"></div>
	<div class="eight wide column">
		<div id="email-template-submenu-admin" class="ui secondary menu pointing" style="float:right;">
			<a class="ui item <?php echo esc_attr( $rec_ac ); ?>" href="<?php echo esc_url( $rec_acc_link ); ?>"><?php esc_html_e( 'Recent Activity', 'zero-bs-crm' ); ?></a>
			<a class="ui item <?php echo esc_attr( $em_templates ); ?>" href="<?php echo esc_url( $rec_acc_link ); ?>&zbs_template_id=1"><?php esc_html_e( 'Email Templates', 'zero-bs-crm' ); ?></a>
			<a class="ui item <?php echo esc_attr( $tem_set ); ?>" href="<?php echo esc_url( $rec_acc_link ); ?>&zbs_template_editor=1"><?php esc_html_e( 'Template Settings', 'zero-bs-crm' ); ?></a>
		</div>
	</div>
	</div>


	<?php if ( isset( $_GET['zbs_template_editor'] ) && ! empty( $_GET['zbs_template_editor'] ) ) { ?>

		<div class="ui segment" style="margin-right:20px;">
		<h4 class="template-man-h4"><?php esc_html_e( 'HTML Template', 'zero-bs-crm' ); ?></h4>
		<p class='lead'><?php _e( 'This template is used for all outgoing CRM emails. The <code>##MSG-CONTENT##</code> placeholder represents the per-template content and must not be removed.', 'zero-bs-crm' ); ?></p>
	  
		<div class="ui segment">
			<p class='lead'>
			<?php
			##WLREMOVE
			?>
			<?php _e( 'It is strongly recommended to leave this template unchanged for maximum device support. If you still wish to modify it, you can copy the <code>emails/default-email.html</code> file from the <code>/templates</code> directory of your CRM plugin into a <code>/jetpack-crm</code> directory in your theme, and then edit the file.' ); ?>
			<?php _e( 'You can modify this template by copying the /templates directory from your CRM plugin into your theme directory, then editing the file <code>emails/default-email.html</code>, though it is recommended to leave this template in tact for maximum device support.' ); ?>          
			<br /><a href="<?php echo esc_url( $zbs->urls['kbtemplatefiles'] ); ?>" target="_blank" class="ui basic blue small button"><?php esc_html_e( 'Read more about templating', 'zero-bs-crm' ); ?></a>
			<?php
			##/WLREMOVE
			?>
			</p>
			<div class="ui segment">
			<p><div class="ui label"><?php echo esc_html__( 'Current template file:', 'zero-bs-crm' ); ?></div></p>
			<p>&nbsp;&nbsp;&nbsp;<code>
			<?php

				// retrieve loaded file source
				$variants = jpcrm_retrieve_template_variants( 'emails/default-email.html' );
				$origin   = __( 'core plugin', 'zero-bs-crm' );

			if ( is_array( $variants ) && isset( $variants['emails/default-email.html'] ) ) {

				// retrieve current used source
				echo esc_html( $variants['emails/default-email.html']['full_path'] );
				$origin = $variants['emails/default-email.html']['origin'];

			} else {

				// default
				echo esc_html( ZEROBSCRM_PATH . 'templates/emails/default-email.html' );

			}

			?>
			</code></p>
			<p><div class="ui label"><?php echo esc_html__( 'Origin:', 'zero-bs-crm' ) . '</div> ' . esc_html( $origin ); ?></p>
			</div>
		</div>

	  
		<div class="ui divider"></div>
		<textarea cols="70" rows="25" name="zbstemplatehtml" id="zbstemplatehtml"><?php echo esc_textarea( jpcrm_retrieve_template( 'emails/default-email.html', false ) ); ?></textarea>
		<div class="ui grid" style="margin-right:-15px;margin-top:20px;">
			<div class="eight wide column">
			<?php
				echo '<a href="' . esc_url( $rec_acc_link ) . '" style="text-decoration:underline;font-size:11px;">' . esc_html__( 'Back to Activity', 'zero-bs-crm' ) . '</a>';
			?>
			</div>
			<div class="eight wide column">
			<?php
			echo "<div style='float:right;'>";
				echo '<a href="' . esc_url( site_url( '?zbsmail-template-preview=1' ) ) . '"class="ui button inverted blue small" target="_blank">' . esc_html__( 'Preview', 'zero-bs-crm' ) . '</a>';
			echo '</div>';
			?>
			</div>
		</div>
		</div>
		<?php
	} else {
		?>
	<div class="ui grid" id="zbs-sys-email-template-editor">

		<div class="five wide column the-templates">
			<?php
				// the template list...
				$zbs_system_emails = zeroBSCRM_mailTemplate_getAll();
			if ( count( $zbs_system_emails ) == 0 ) {

				// something went wrong with the creation of the emails...
				echo "<div class='ui segment' style='text-align:center'>";

				echo "<div id ='zbs-emails-result'>";
					echo "<div class='ui inverted dimmer' id='zbs-saving-email-create'><div class='ui text loader'>" . esc_html__( 'Creating templates....', 'zero-bs-crm' ) . '</div></div>';

				echo '<h4 class="template-man-h4">' . esc_html__( 'No Email Templates', 'zero-bs-crm' ) . '</h4>';
				echo "<p class='lead' style='padding:10px;'>" . esc_html__( 'Something went wrong with the email template creation.', 'zero-bs-crm' ) . '<br/></p>';
				echo "<div class='button ui large blue' id='force-email-create'>" . esc_html__( 'Create Now', 'zero-bs-crm' ) . '</div>';

				echo '</div>';

				echo "<div class='template-generate-results' style='display:none;'>";
				echo '<h4>' . esc_html__( 'Template Creation Succeeded', 'zero-bs-crm' ) . '</h4>';
				echo "<a href='" . esc_url( $rec_acc_link ) . "' class='button ui green'>" . esc_html__( 'Reload Page', 'zero-bs-crm' ) . '</a>';
				echo '</div>';

				echo '</div>';

				echo '<input type="hidden" name="zbs_create_email_nonce" id="zbs_create_email_nonce" value="' . esc_attr( wp_create_nonce( 'zbs_create_email_nonce' ) ) . '" />';

			}
			foreach ( $zbs_system_emails as $sys_email ) {
				if ( $sys_email->zbsmail_id > 0 ) {

					if ( $template_id == $sys_email->zbsmail_id ) {
						$class = 'active';
					} else {
						$class = '';
					}

					$link = admin_url( 'admin.php?page=zbs-email-templates&zbs_template_id=' . $sys_email->zbsmail_id );

					echo '<a href="' . esc_url( $link ) . '"><div class="ui segment email-template-box ' . esc_attr( $class ) . ' style="margin-bottom:10px;">';
					echo esc_html( zeroBSCRM_mailTemplate_getSubject( $sys_email->zbsmail_id ) );

					// can be enabled/disabled
					if ( in_array( $sys_email->zbsmail_id, $sysEmailsActiveInactive ) ) {

						if ( $sys_email->zbsmail_active == 1 ) {
							echo "<div class='ui label green tiny' id='zbs-list-status-" . esc_attr( $sys_email->zbsmail_id ) . "' style='float:right;margin-top:10px;'>" . esc_html__( 'Active', 'zero-bs-crm' ) . '</div>';
						} else {
							echo "<div class='ui label red tiny' id='zbs-list-status-" . esc_attr( $sys_email->zbsmail_id ) . "' style='float:right;margin-top:10px;'>" . esc_html__( 'Inactive', 'zero-bs-crm' ) . '</div>';
						}
					}

					// if tracking
					if ( $trackingEnabled == '1' ) {
						echo "<div class='email-stats'>";
						zeroBSCRM_mailDelivery_getTemplateStats( $sys_email->zbsmail_id );
						echo '</div>';
					} else {
						echo '<div class="email-stats">&nbsp;</div>';
					}

					echo '</div></a>';

				}
			}
			?>
			<div style="text-align:center;margin-top:1em">
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['settings'] . '&tab=mail' ) ); ?>" class="ui basic button"><?php esc_html_e( 'Back to Mail Settings', 'zero-bs-crm' ); ?></a>
			</div>
		</div>

		<div class="eleven wide column">
			<div class="segment ui" id="email-segment">
				<?php

				if ( ! empty( $_POST['zbssubject'] )
					&& isset( $_POST['_wpnonce'] )
					&& wp_verify_nonce( $_POST['_wpnonce'], 'jpcrm-update-system-email-template' )
					) {

					/*
					WH switched for mail delivery opts
					$zbsfromname    = sanitize_text_field($_POST['zbsfromname']);

					//using sanitize email, can
					$zbsfromaddress = sanitize_email($_POST['zbsfromaddress']);
					$zbsreplyto     = sanitize_email($_POST['zbsreplyto']);
					$zbsccto        = sanitize_email($_POST['zbsccto']);
					$zbsbccto       = sanitize_email($_POST['zbsbccto']);
					*/

					// Mail Delivery
					$zbsMailDeliveryMethod = sanitize_text_field( $_POST['zbs-mail-delivery-acc'] );
					$zbsbccto              = sanitize_email( $_POST['zbsbccto'] );

					// this sanitizes the post content..
					$zbscontent = wp_kses_post( $_POST['zbscontent'] );
					$zbssubject = sanitize_text_field( $_POST['zbssubject'] );

					if ( isset( $_GET['zbs_template_id'] ) ) {

						$updateID = (int) sanitize_text_field( $_GET['zbs_template_id'] );

						// wh simplified for del methods
						// zeroBSCRM_updateEmailTemplate($updateID,$zbsfromname,$zbsfromaddress,$zbsreplyto, $zbsccto, $zbsbccto,$zbssubject, $zbscontent );
						zeroBSCRM_updateEmailTemplate( $updateID, $zbsMailDeliveryMethod, $zbsbccto, $zbssubject, $zbscontent );

						echo "<div class='ui message green' style='margin-top:45px;margin-right:15px;'>" . esc_html__( 'Template updated', 'zero-bs-crm' ) . '</div>';

					}
				}

				if ( isset( $_GET['zbs_template_id'] ) && ! empty( $_GET['zbs_template_id'] ) ) {

					// the tab number matches the template ID.
					$emailtab = (int) sanitize_text_field( $_GET['zbs_template_id'] );

					$form = '';

					// single template data.
					$data = zeroBSCRM_mailTemplate_get( $emailtab );
					if ( gettype( $data ) == 'object' ) {
						$form = $data;
					}

					if ( ! empty( $form ) ) {

						// will need to nonce this up ... (?)
						if ( isset( $_GET['sendtest'] ) && ! empty( $_GET['sendtest'] ) ) {

							// we are sending a test...
							$current_user = wp_get_current_user();
							$test_email   = $current_user->user_email;

							$html = zeroBSCRM_mailTemplate_emailPreview( $emailtab );

							// send it
							$subject = $form->zbsmail_subject;
							$headers = zeroBSCRM_mailTemplate_getHeaders( $emailtab );

							/*
							old way


							wp_mail( $test_email, $subject, $html, $headers );

							*/

							// discern del method
							$mailDeliveryMethod = zeroBSCRM_mailTemplate_getMailDelMethod( $emailtab );
							if ( ! isset( $mailDeliveryMethod ) || empty( $mailDeliveryMethod ) ) {
								$mailDeliveryMethod = -1;
							}

							// build send array
							$mailArray = array(
								'toEmail'  => $test_email,
								'toName'   => '',
								'subject'  => $subject,
								'headers'  => $headers,
								'body'     => $html,
								'textbody' => '',
								'options'  => array(
									'html' => 1,
								),
							);

							// Sends email
							$sent = zeroBSCRM_mailDelivery_sendMessage( $mailDeliveryMethod, $mailArray );

							echo "<div class='ui message green' style='margin-top:45px;margin-right:15px;'>" . esc_html__( 'Test Email Sent to ', 'zero-bs-crm' ) . '<b>' . esc_html( $test_email ) . '</b></div>';
						}

							// if we're showing any email which requires CRON to send it, we show this message to further guide the end user:
						if ( in_array( $emailtab, array( ZBSEMAIL_TASK_NOTIFICATION ), true ) ) {

							?>
								<div class="ui blue label right floated"><i class="circle info icon link"></i> <?php esc_html_e( 'Note: This email requires cron.', 'zero-bs-crm' ); ?> <a href="<?php echo esc_url( $zbs->urls['kbcronlimitations'] ); ?>"><?php esc_html_e( 'Read about WordPress cron', 'zero-bs-crm' ); ?></a></div>
								<?php

						}

							echo "<h4 class='template-man-h4'>" . esc_html( zeroBSCRM_mailTemplate_getSubject( $emailtab ) ) . '</h4>';

							echo "<div class='email-stats email-stats-top'>";
							zeroBSCRM_mailDelivery_getTemplateStats( $emailtab );
							echo '</div>';

							echo "<div class='ui inverted dimmer' id='zbs-saving-email-active'><div class='ui text loader'>" . esc_html__( 'Saving....', 'zero-bs-crm' ) . '</div></div>';

							wp_nonce_field( 'zbs-save-email_active' );

							echo '<input type="hidden" name="zbs-save-email_active" id="zbs-save-email_active" value="' . esc_attr( wp_create_nonce( 'zbs-save-email_active' ) ) . '" />';

							// can be enabled/disabled
						if ( in_array( $form->zbsmail_id, $sysEmailsActiveInactive ) ) {

							if ( $form->zbsmail_active ) {
								// 1 = active, 0 = inactive..
								echo '<div class="ui buttons tiny" style="float: right;
                                        position: absolute;
                                        top: 19px;
                                        right: 20px;">
                                        <button class="ui positive button zbs-turn-active" id="the-positive-button-' . esc_attr( $emailtab ) . '" data-emid="' . esc_attr( $emailtab ) . '">Active</button>
                                        <div class="or"></div>
                                        <button class="ui button zbs-turn-inactive" id="active-to-inactive-' . esc_attr( $emailtab ) . '" data-emid="' . esc_attr( $emailtab ) . '">Inactive</button>
                                      </div>';
							} else {
								echo '<div class="ui buttons tiny" style="float: right;
                                        position: absolute;
                                        top: 19px;
                                        right: 20px;">
                                        <button class="ui button zbs-turn-active" id="the-positive-button-' . esc_attr( $emailtab ) . '" data-emid="' . esc_attr( $emailtab ) . '">Active</button>
                                        <div class="or"></div>
                                        <button class="ui button zbs-turn-inactive negative" id="active-to-inactive-' . esc_attr( $emailtab ) . '" data-emid="' . esc_attr( $emailtab ) . '">Inactive</button>
                                      </div>';
							}
						}

							echo "<div class='ui divider'></div>";

							$formlink = admin_url( 'admin.php?page=zbs-email-templates&zbs_template_id=' . $emailtab );

							echo "<form class='ui form email-template-form' action='" . esc_url( $formlink ) . "' METHOD='POST'>";

							wp_nonce_field( 'jpcrm-update-system-email-template' );

							echo '<div class="field">';
							echo '<label for="zbssubject">' . esc_html__( 'Subject', 'zero-bs-crm' ) . '</label>';
							echo '<input id="zbssubject" name="zbssubject" type="text" value="' . esc_attr( $form->zbsmail_subject ) . '">';
							echo '</div>';

							// 11/05/18 - delivery methods replace hard-typed opts here
							echo '<div class="field">';

							echo '<div class="ui grid" style="margin-bottom:-0.4em"><div class="four wide column">';
							echo '<label for="zbs-mail-delivery-acc">' . esc_html__( 'Delivery Method', 'zero-bs-crm' ) . '</label>';
							echo '</div><div class="twelve wide column">';
						?>
							<div class="ui teal label right floated"><i class="circle info icon link"></i> <?php esc_html_e( 'You can set up different delivery methods in your ', 'zero-bs-crm' ); ?> <a href="<?php echo jpcrm_esc_link( $zbs->slugs['settings'] ) . '&tab=maildelivery'; ?>"><?php esc_html_e( 'Delivery Methods Settings', 'zero-bs-crm' ); ?></a></div>
							<?php
							echo '</div></div>';

							zeroBSCRM_mailDelivery_accountDDL( $form->zbsmail_deliverymethod );

							echo '</div>';

							/*
							echo '<div class="field">';
							echo '<label>' . __('From Name','zero-bs-crm') .'</label>';
							echo '<input id="zbsfromname" name="zbsfromname" type="text" value="'.$form->zbsmail_fromname.'">';
							echo '</div>';

							echo '<div class="field">';
							echo '<label>' . __('From Email','zero-bs-crm') .'</label>';
							echo '<input id="zbsfromaddess" name="zbsfromaddress" type="text" value="'.$form->zbsmail_fromaddress.'">';
							echo '</div>';

							echo '<div class="field">';
							echo '<label>' . __('Reply To','zero-bs-crm') .'</label>';
							echo '<input id="zbsreplyto" name="zbsreplyto" type="text" value="'.$form->zbsmail_replyto.'">';
							echo '</div>';

							echo '<div class="field zbs-hide">';
							echo '<label>' . __('Cc To','zero-bs-crm') .'</label>';
							echo '<input id="zbsccto" name="zbsccto" type="text" value="'.$form->zbsmail_ccto.'">';
							echo '</div>';
							*/

							echo '<div class="field">';
							echo '<label for="zbsbccto">' . esc_html__( 'Bcc To', 'zero-bs-crm' ) . '</label>';
							echo '<input id="zbsbccto" name="zbsbccto" type="text" value="' . esc_attr( $form->zbsmail_bccto ) . '">';
							echo '</div>';

							echo '<div class="field">';
							echo '<div class="ui grid">';
								echo '<div class="eight wide column"><label class="jpcrm-email-template-label jpcrm-email-template-label-content" for="zbscontent">' . esc_html__( 'Content', 'zero-bs-crm' ) . '</label></div>';

							// placeholder injector
								echo '<div class="eight wide column" style="text-align:right">';

							// select tooling areas (template dependent)
							$tooling_areas = array( 'global' );
							switch ( $emailtab ) {

								case 1: // Your Client Portal
									$tooling_areas = array( 'global', 'contact' );
									break;
								case 2: // Quote Accepted
									$tooling_areas = array( 'global', 'quote', 'contact' );
									break;
								case 3: // You have received an Invoice
									$tooling_areas = array( 'global', 'invoice', 'contact', 'company' );
									break;
								case 4: // You have received a new Proposal
									$tooling_areas = array( 'global', 'quote', 'contact', 'company' );
									break;
								case 5: // Your Task starts soon
									$tooling_areas = array( 'global', 'event', 'contact', 'company' );
									break;
								case 6: // Your Client Portal Password
									$tooling_areas = array( 'global', 'contact' );
									break;
								case 7: // Your Statement
									$tooling_areas = array( 'global', 'invoice', 'contact', 'company' );
									break;

							}

							// load templater
							$placeholder_templating = $zbs->get_templating();
							$placeholder_templating->placeholder_selector(
								'jpcrm-mail-template-editor-placeholders',
								'zbscontent',
								$tooling_areas,
								false
							);

							// close column and grid
								echo '</div></div>';

							$content         = esc_html( $form->zbsmail_body );
							$editor_settings = array(
								'media_buttons' => false,
								'editor_height' => 350,
								'quicktags'     => false,
								'tinymce'       => false,
							);
							wp_editor( $content, 'zbscontent', $editor_settings );
							echo '</div>';
							?>

							<div class="ui grid" style="margin-right:-15px;">
							<div class="eight wide column">
								<?php
								echo '<a href="' . esc_url( $rec_acc_link ) . '&zbs_template_editor=1" style="text-decoration:underline;font-size:11px;">' . esc_html__( 'Edit HTML Template', 'zero-bs-crm' ) . '</a>';
								?>
							</div>
							<div class="eight wide column">
								<?php

								$sendtestlink = admin_url( 'admin.php?page=zbs-email-templates&zbs_template_id=' . $emailtab . '&sendtest=1' );

								echo "<div style='float:right;'>";
								echo '<a href="' . esc_url( site_url( '?zbsmail-template-preview=1&template_id=' . $emailtab ) ) . '" target="_blank" class="ui button inverted blue small">' . esc_html__( 'Preview', 'zero-bs-crm' ) . '</a>';
								echo '<a href="' . esc_url( $sendtestlink ) . '" class="ui button blue small">' . esc_html__( 'Send Test', 'zero-bs-crm' ) . '</a>';
								echo '<input class="ui button green small" type="submit" value="' . esc_attr__( 'Save', 'zero-bs-crm' ) . '">';
								echo '</div>';
								?>
							</div>
							</div>



							</form>

							<?php

					} else {
						echo "<div class='ui message blue'>";
							echo "<i class='icon info'></i>" . esc_html__( 'No templates. Please generate', 'zero-bs-crm' );
						echo '</div>';
					}

					// zbs_prettyprint($data);

				} else {
					?>

						<h4 class="template-man-h4"><?php esc_html_e( 'Sent Emails', 'zero-bs-crm' ); ?></h4>
						<p class='lead'><?php esc_html_e( 'Your latest 50 emails are shown here so you can keep track of activity.', 'zero-bs-crm' ); ?></p>
						<div class="ui divider"></div>

					<?php

					zeroBSCRM_outputEmailHistory();

				}

				?>
			</div>
		</div>
	</div>

	<?php } //end of code for if template setting is being shown... ?>

	<?php
}

// } Data Tools Page
function zeroBSCRM_pages_datatools() {

	global $wpdb, $zbs; // } Req

	if ( ! current_user_can( 'admin_zerobs_manage_options' ) ) {
		wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) ); }

	// } Settings
	zeroBSCRM_html_datatools();

	?>
</div>
	<?php
}

// } Install Extensions helper page
function zeroBSCRM_pages_installextensionshelper() {

	global $wpdb, $zbs;  // } Req

	if ( ! current_user_can( 'admin_zerobs_manage_options' ) ) {
		wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) ); }
	// } Settings
	zeroBSCRM_html_installextensionshelper();

	?>
</div>
	<?php
}

// } No rights to this (customer/company)
function zeroBSCRM_pages_norights() {

	global $wpdb, $zbs;  // } Req

	if (
	! zeroBSCRM_permsCustomers()
	&& ! zeroBSCRM_permsQuotes()
	&& ! zeroBSCRM_permsInvoices()
	&& ! zeroBSCRM_permsTransactions()
	) {
		wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) ); }

	// } Post Deletion page
	zeroBSCRM_html_norights();

	?>
</div>
	<?php
}

// Whitelabel homepage.
function zeroBSCRM_html_wlHome() {

	global $zbs;

	?>
	<div>
	<h1 style="font-size: 34px;margin-left: 50px;color: #e06d17;margin-top: 1em;"><?php esc_html_e( 'Welcome to Jetpack CRM', 'zero-bs-crm' ); ?></h1>
	<p style="font-size: 16px;margin-left: 50px;padding: 12px 20px 10px 20px;"><?php esc_html_e( 'This CRM Plugin is managed by Jetpack CRM', 'zero-bs-crm' ); ?>. <?php esc_html_e( 'If you have any questions, please', 'zero-bs-crm' ); ?> <a href="<?php echo esc_url( $zbs->urls['support'] ); ?>"><?php esc_html_e( 'email us', 'zero-bs-crm' ); ?></a>.</p>
	<?php

	// let wl users add content
	do_action( 'zerobscrm_wl_homepage' );
}

// } MS - 3rd Dec 2018 - new function for the home page - function name the same, old function below
function zeroBSCRM_html_home2() {

	global $zbs;

	/*
	to highlight the benefits of Jetpack CRM and going pro. Link into the new fature page
	show "Go Pro" offer and some testimonials :)
	need to remove top menu from this page ... do with ze CSS :-)
	*/

	// $add_new_customer_link = admin_url('admin.php?page=zbs-add-edit&action=edit&zbstype=contact');
	$add_new_customer_link = jpcrm_esc_link( 'create', -1, 'zerobs_customer' );

	// change this to true when ELITE is out
	$isv3 = false;

	// WH added: Is now polite to License-key based settings like 'entrepreneur' doesn't try and upsell
	// this might be a bit easy to "hack out" hmmmm
	$bundle = false;
	if ( $zbs->hasEntrepreneurBundleMin() ) {
		$bundle = true;
	}

	// this stops hopscotch ever loading on this page :)
	?>
	<script type="text/javascript">var zbscrmjs_hopscotch_squash = true;</script>

	<div id="zbs-welcome">
	<div class="container">

		<div class="intro">
			<div class="block" style="text-align:center;margin-top:-50px;">
						<img src="<?php echo esc_url( jpcrm_get_logo( false ) ); ?>" alt="Jetpack CRMt" id="jetpack-crm-welcome" style="text-align:center;padding:30px;"> 
						<h6><?php esc_html_e( 'Thank you for choosing Jetpack CRM - The Ultimate Entrepreneurs\' CRM for WordPress', 'zero-bs-crm' ); ?></h6>
			</div>
		</div>

		<div id="action-buttons" class='block'>
		<h6>
		<?php
		esc_html_e( 'Jetpack CRM makes it easy for you to manage your contacts using WordPress. To get started, read our guide on how create your first contact', 'zero-bs-crm' );
		echo ':';
		?>
		</h6>
		<div class='zbs-button-wrap'>
			<div class="left">
			<a href="<?php echo esc_url( $add_new_customer_link ); ?>" class="jpcrm-button font-14px"><?php esc_html_e( 'Add Your First Contact', 'zero-bs-crm' ); ?></a>
			</div>
			<div class="right">
			<a href="<?php echo esc_url( $zbs->urls['kbfirstcontact'] ); ?>" target="_blank" class="jpcrm-button white-bg font-14px"><?php esc_html_e( 'Read the full guide', 'zero-bs-crm' ); ?></a>
			</div>
			<div class="clear"></div>
		</div>
		</div>


	</div><!-- / .container -->

	<div class="container margin-top30">
		<div class="intro">
			<div class="block" style="text-align:center;margin-top:-50px;">
				<img src="<?php echo esc_url( plugins_url( '/i/ext/woocommerce-logo-horizontal-black.png', ZBS_ROOTFILE ) ); ?>" alt="WooCommerce" id="woocommerce-logo" style="text-align:center;padding:30px;padding-bottom:15px;max-width:440px;">
				<h6><?php esc_html_e( 'Jetpack CRM is WooCommerce ready!', 'zero-bs-crm' ); ?></h6>
			</div>
		</div>

		<div id="action-buttons" class='block'>
		<h6><?php esc_html_e( 'Connect today your WooCommerce Store and start importing your orders and customers into Jetpack CRM.', 'zero-bs-crm' ); ?></h6>
		<div class='zbs-button-wrap'>
			<a href="<?php echo esc_url( wp_nonce_url( '?page=' . $zbs->slugs['module-activate-redirect'] . '&jpcrm-module-name=woo-sync', 'jpcrmmoduleactivateredirectnonce' ) ); ?>" class='jpcrm-button font-14px'><?php esc_html_e( 'Connect your WooCommerce Store to Jetpack CRM', 'zero-bs-crm' ); ?></a>
		</div>
		</div>


	</div><!-- / .container -->


	<div class="container margin-top30">
		<div class="intro zbs-features">

		<div class="block">
				<h1><?php esc_html_e( 'Jetpack CRM Features and Extensions', 'zero-bs-crm' ); ?></h1>
				<h6><?php esc_html_e( 'Made for you, from the ground up. Jetpack CRM is both easy-to-use, and extremely flexible. Whatever your business, Jetpack CRM is the no-nonsense way of keeping a contact database', 'zero-bs-crm' ); ?></h6>
			</div>


		<div class="feature-list block">

					<div class="feature-block first">
						<img alt="<?php esc_attr_e( 'CRM Dashboard', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( plugins_url( '/i/crm-dash.png', ZBS_ROOTFILE ) ); ?>">
						<h5><?php esc_html_e( 'CRM Dashboard', 'zero-bs-crm' ); ?></h5>
						<p><?php esc_html_e( 'See at a glance the key areas of your CRM: e.g. Contact Activity, Contact Funnel, and Revenue snapshot.', 'zero-bs-crm' ); ?></p>
					</div>

					<div class="feature-block last">
						<img alt="<?php esc_html_e( 'Limitless Contacts', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( plugins_url( '/i/customers.png', ZBS_ROOTFILE ) ); ?>">
						<h5><?php esc_html_e( 'Limitless Contacts', 'zero-bs-crm' ); ?></h5>
						<p><?php esc_html_e( 'Add as many contacts as you like. No limits to the number of contacts you can add to your CRM.', 'zero-bs-crm' ); ?></p>
					</div>

					<div class="feature-block first">
						<img alt="<?php esc_attr_e( 'Quote Builder', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( plugins_url( '/i/quotes.png', ZBS_ROOTFILE ) ); ?>">
						<h5><?php esc_html_e( 'Quote Builder', 'zero-bs-crm' ); ?></h5>
						<p><?php esc_html_e( 'Do you find yourself writing similar quotes/proposals over and over? Quote Builder makes it easy for your team.', 'zero-bs-crm' ); ?></p>
					</div>

					<div class="feature-block last">
						<img alt="<?php esc_attr_e( 'Invoicing', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( plugins_url( '/i/invoices.png', ZBS_ROOTFILE ) ); ?>">
						<h5><?php esc_html_e( 'Invoicing', 'zero-bs-crm' ); ?></h5>
						<p><?php esc_html_e( 'Got clients or people to bill? Easily create invoices, and get paid online (pro). Clients can see all Invoices in one place on the Client Portal.', 'zero-bs-crm' ); ?></p>
					</div>

					<div class="feature-block first">
						<img alt="<?php esc_attr_e( 'Transactions', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( plugins_url( '/i/transactions.png', ZBS_ROOTFILE ) ); ?>">
						<h5><?php esc_html_e( 'Transactions', 'zero-bs-crm' ); ?></h5>
						<p><?php esc_html_e( 'Log transactions against contacts or companies, and reconcile to invoices. Track payments, ecommerce data, and LTV (lifetime value).', 'zero-bs-crm' ); ?></p>
					</div>

					<div class="feature-block last">
						<img alt="<?php esc_attr_e( 'B2B Mode', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( plugins_url( '/i/b2b.png', ZBS_ROOTFILE ) ); ?>">
						<h5><?php esc_html_e( 'B2B Mode', 'zero-bs-crm' ); ?></h5>
						<p><?php esc_html_e( 'Manage leads working at Companies? B2B mode lets you group contacts under a Company and keep track of sales easier.', 'zero-bs-crm' ); ?></p>
					</div>

					<div class="feature-block first">
						<img alt="<?php esc_attr_e( 'Automations', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( plugins_url( '/i/auto.png', ZBS_ROOTFILE ) ); ?>">
						<h5><?php esc_html_e( 'Automations', 'zero-bs-crm' ); ?><span class='pro'>Entrepreneur</span></h5>
						<p><?php esc_html_e( 'Set up rule-based triggers and actions to automate your CRM work. Automatically Email new contacts, Distribute Leads, plus much more.', 'zero-bs-crm' ); ?></p>
					</div>

					<div class="feature-block last">
						<img alt="<?php esc_attr_e( 'Send SMS', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( plugins_url( '/i/sms.png', ZBS_ROOTFILE ) ); ?>">
						<h5><?php esc_html_e( 'Send SMS', 'zero-bs-crm' ); ?><span class='pro'>Entrepreneur</span></h5>
						<p><?php esc_html_e( 'Want to get in front of your contacts, wherever they are? Send SMS messages to your contacts from their CRM record.', 'zero-bs-crm' ); ?></p>
					</div>

					<div class="feature-block first">
						<img alt="<?php esc_attr_e( 'Client Portal Pro', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( plugins_url( '/i/cpp.png', ZBS_ROOTFILE ) ); ?>">
						<h5><?php esc_html_e( 'Client Portal Pro', 'zero-bs-crm' ); ?><span class='pro'>Entrepreneur</span></h5>
						<p><?php esc_html_e( 'Create a powerful client portal in one click! Easily share files with clients via their contact record. Tweak the portal to fit your branding, and more!', 'zero-bs-crm' ); ?></p>
					</div>

					<div class="feature-block last">
						<img alt="<?php esc_attr_e( 'Mail Campaigns', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( plugins_url( '/i/mail.png', ZBS_ROOTFILE ) ); ?>">
			<?php if ( $isv3 ) { ?>
						<h5><?php esc_html_e( 'Mail Campaigns', 'zero-bs-crm' ); ?><span class='pro-elite'>Elite</span></h5>
			<?php } else { ?>
						<h5><?php esc_html_e( 'Mail Campaigns', 'zero-bs-crm' ); ?><span class='pro'>Entrepreneur</span></h5>
			<?php } ?>
						<p><?php echo wp_kses( __( 'Send Email Broadcasts and Sequences to your CRM contacts using our <strong>powerful</strong> Mail Campaigns v2.0. which is linked directly into your CRM data!', 'zero-bs-crm' ), $zbs->acceptable_restricted_html ); ?></p>
					</div>

			</div>

		<div class="clear"></div>

		<div class='zbs-button-wrap'>
			<a href="https://jetpackcrm.com/features/" target="_blank" class="jpcrm-button white-bg font-14px"><?php esc_html_e( 'See All Features', 'zero-bs-crm' ); ?></a>
		</div>

		</div><!-- / .intro.zbs-features -->
	</div><!-- / .container -->
	
		<?php if ( ! $bundle ) { ?>
	<div class="container margin-top30">
		<div class="intro zbs-features">
		<div class="block" style="padding-bottom:0;">

						<h1>Testimonials</h1>

						<div class="testimonial-block">
							<img alt="Thumbnail of Michael Short" src="<?php echo esc_url( plugins_url( '/i/mb.jpg', ZBS_ROOTFILE ) ); ?>">
							<p><?php esc_html_e( 'My mind is blown away by how much attention has been placed on all the essential details built into Jetpack CRM. It\'s a polished, professional product that I love being able to bake into my Website as a Service (WaaS), multisite network. It adds true value for my customers and completes my product offering. I\'ve not been able to find any tool quite like it (and trust me, I\'ve looked!) If you\'re looking to offer true value to your customers, this is worth its weight in gold!', 'zero-bs-crm' ); ?></p>
				<p class='who'><strong>Michael Short</strong>
			</div>

						<div class="testimonial-block">
							<img alt="Thumbnail of Dave Scribner" src="<?php echo esc_url( plugins_url( '/i/scribner.png', ZBS_ROOTFILE ) ); ?>">
							<p><?php esc_html_e( 'We can sit back and relax safe in the knowledge that Jetpack CRM is working tirelessly behind the scenes distributing leads automatically to our clients.', 'zero-bs-crm' ); ?></p>
				<p class='who'><strong>Dave Scribner</strong> 
				</div>

				</div><!-- / .block -->

		</div><!-- / .intro.zbs-features -->

	</div><!-- / .container -->

	<div class="container final-block">
		<div class="upgrade-cta upgrade">
			<div class="block">
				<h2>Upgrade to ENTREPRENEUR</h2>
				<div class="upgrade-cta__features">
					<ul>
						<li style="width:100%;text-align:center;margin-bottom: 30px;"><?php esc_html_e( 'Access to 30+ Extensions:', 'zero-bs-crm' ); ?></li>
						<li><span class="dashicons dashicons-yes"></span> PayPal Connect</li>
						<li><span class="dashicons dashicons-yes"></span> Invoicing Pro</li>
						<li><span class="dashicons dashicons-yes"></span> Stripe Connect</li>
						<li><span class="dashicons dashicons-yes"></span> User Registration</li>
						<li><span class="dashicons dashicons-yes"></span> Lead Capture</li>
						<li><span class="dashicons dashicons-yes"></span> Client Portal Pro</li>
						<li><span class="dashicons dashicons-yes"></span> Sales Dashboard</li>
						<li><span class="dashicons dashicons-yes"></span> Zapier</li>
						<li><span class="dashicons dashicons-yes"></span> Automations</li>
						<li><span class="dashicons dashicons-yes"></span> Mail Campaigns</li>
					</ul>
				</div>
			<div class="clear"></div>
			</div> <!-- / .block -->
			<div class="zbs-button-wrap">
			<a href="<?php echo esc_url( $zbs->urls['upgrade'] ); ?>" rel="noopener noreferrer" target="_blank" class="jpcrm-button font-14px"><?php esc_html_e( 'Upgrade your CRM today', 'zero-bs-crm' ); ?></a>
		</div>
		</div> <!-- / .upgrade-cta -->
	</div>

			<?php
		}
		##WLREMOVE
		else {

			// bundle owners:

			?>


	<div class="container final-block">
		<div class="block">
		<div class='zbs-button-wrap' style="padding-bottom:2em">

			<h4><?php esc_html_e( 'Your Account:', 'zero-bs-crm' ); ?></h4>

			<a href="<?php echo jpcrm_esc_link( $zbs->slugs['extensions'] ); ?>" class='jpcrm-button font-14px'><?php esc_html_e( 'Manage Extensions', 'zero-bs-crm' ); ?></a>
			<a href="<?php echo esc_url( $zbs->urls['account'] ); ?>" target="_blank" class='jpcrm-button white-bg font-14px'><?php esc_html_e( 'Download Extensions', 'zero-bs-crm' ); ?></a>

			<div class="clear"></div>
		</div>
		</div>
	</div>
			<?php

		}

		##/WLREMOVE
		?>

	</div><!-- / zbs-welcome -->

	<?php
}

// } DataTools HTML
// } Only exposed when a data tools plugin is installed:
// } - CSV Importer
function zeroBSCRM_html_datatools() {

	global $wpdb, $zbs;  // } Req

	$deleting_data = false;

	if ( current_user_can( 'manage_options' ) ) {

		// DELETE ALL DATA (Not Settings)
		if ( isset( $_POST['zbs-delete-data'] ) && $_POST['zbs-delete-data'] == 'DO IT' ) {
			$link = admin_url( 'admin.php?page=' . $zbs->slugs['datatools'] );
			$str  = __( 'REMOVE ALL DATA', 'zero-bs-crm' );
			echo "<div class='ui segment' style='margin-right:20px;text-align:center;'>";

			echo '<h3>' . esc_html__( 'Delete all CRM data', 'zero-bs-crm' ) . '</h3>';

			echo "<div style='font-size:60px;margin:0.5em;'>⚠️</div>";
			echo "<p class='lead' style='font-size:16px;color:#999;padding-top:15px;'>";

			esc_html_e( 'This Administrator level utility will remove all data in your CRM. This cannot be undone. Proceed with caution.', 'zero-bs-crm' );

			echo '</p>';

						$del_link = $link . '&zbs-delete-data=1';
			$action               = 'zbs_delete_data';
			$name                 = 'zbs_delete_nonce';

			$nonce_del_link = wp_nonce_url( $del_link, $action, $name );
			echo "<a class='ui button red' href='" . esc_url( $nonce_del_link ) . "'>" . esc_html( $str ) . '</a>';

			echo "<a class='ui button green inverted' href='" . esc_url( $link ) . "'>" . esc_html__( 'CANCEL', 'zero-bs-crm' ) . '</a>';
			echo '</div>';
			$deleting_data = true;

		} elseif ( isset( $_GET['zbs-delete-data'] ) && $_GET['zbs-delete-data'] == 1 ) {

				// additional nonce check
			if ( ! isset( $_GET['zbs_delete_nonce'] ) || ! wp_verify_nonce( $_GET['zbs_delete_nonce'], 'zbs_delete_data' ) ) {

				echo "<div class='ui segment' style='margin-right:20px;text-align:center;'>";
				echo "<div class='ui message red' style='margin-right:20px;font-size:20px;'><i class='ui icon'></i>" . esc_html__( 'Data not deleted. Invalid permissions', 'zero-bs-crm' ) . '</div>';
				echo '</div>';

			} else {
				echo "<div class='ui segment' style='margin-right:20px;text-align:center;'>";
				echo "<div class='ui message green' style='margin-right:20px;font-size:20px;'><i class='ui icon check circle'></i>" . esc_html__( 'All CRM data deleted.', 'zero-bs-crm' ) . '</div>';
				echo '</div>';

				// run the delete code
				zeroBSCRM_database_reset();

			}
		}

		// DELETE ALL DATA (INCLUDING Settings)
		if ( isset( $_POST['zbs-delete-all-data'] ) && $_POST['zbs-delete-all-data'] == 'FACTORY RESET' ) {

			$link = admin_url( 'admin.php?page=' . $zbs->slugs['datatools'] );
			$str  = __( 'REMOVE ALL DATA', 'zero-bs-crm' );
			echo "<div class='ui segment' style='margin-right:20px;text-align:center;'>";

			echo '<h3>' . esc_html__( 'Factory Reset CRM', 'zero-bs-crm' ) . '</h3>';

			echo "<div style='font-size:60px;margin:0.5em'>⚠️</div>";
			echo "<p class='lead' style='font-size:16px;color:#999;padding-top:15px;'>";

			esc_html_e( 'This Administrator level utility will remove all data in your CRM, including your CRM settings. This cannot be undone. Proceed with caution.', 'zero-bs-crm' );

			echo '</p>';

						$del_link = $link . '&zbs-delete-all-data=1';
			$action               = 'zbs_delete_data';
			$name                 = 'zbs_delete_nonce';

			$nonce_del_link = wp_nonce_url( $del_link, $action, $name );
			echo "<a class='ui button red' href='" . esc_url( $nonce_del_link ) . "'>" . esc_html( $str ) . '</a>';

			echo "<a class='ui button green inverted' href='" . esc_url( $link ) . "'>" . esc_html__( 'CANCEL', 'zero-bs-crm' ) . '</a>';
			echo '</div>';
			$deleting_data = true;

		} elseif ( isset( $_GET['zbs-delete-all-data'] ) && $_GET['zbs-delete-all-data'] == 1 ) {

				// additional nonce check
			if ( ! isset( $_GET['zbs_delete_nonce'] ) || ! wp_verify_nonce( $_GET['zbs_delete_nonce'], 'zbs_delete_data' ) ) {

				echo "<div class='ui segment' style='margin-right:20px;text-align:center;'>";
				echo "<div class='ui message red' style='margin-right:20px;font-size:20px;'><i class='ui icon'></i>" . esc_html__( 'Data not deleted. Invalid permissions', 'zero-bs-crm' ) . '</div>';
				echo '</div>';

			} else {
				echo "<div class='ui segment' style='margin-right:20px;text-align:center;'>";
				echo "<div class='ui message green' style='margin-right:20px;font-size:20px;'><i class='ui icon check circle'></i>" . esc_html__( 'CRM Factory Reset', 'zero-bs-crm' ) . '</div>';
				echo '</div>';

				// run the delete code
				/*
				___________________    . , ; .
				(___________________|~~~~~X.;' .
									' `" ' `
							TNT

				*/
				zeroBSCRM_database_nuke();

			}
		}
	}

	if ( ! $deleting_data ) {
		?>
			
		<div id="zero-bs-tools" class="ui segment" style="margin-right:20px;">
			<h2 class="sbhomep"><?php esc_html_e( 'Welcome to Jetpack CRM Tools', 'zero-bs-crm' ); ?></h2>
			<p class="sbhomep"><?php esc_html_e( 'This is the home for all of the different admin tools for Jetpack CRM which import data, excluding the Sync Extensions.', 'zero-bs-crm' ); ?></p>
			<p class="sbhomep">
			<strong><?php esc_html_e( 'Free Data Tools', 'zero-bs-crm' ); ?>:</strong><br />
			<?php if ( ! zeroBSCRM_isExtensionInstalled( 'csvpro' ) ) { ?>
			<a class="ui button black primary" href="<?php echo esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['csvlite'] ) ); ?>"><?php esc_html_e( 'Import from CSV', 'zero-bs-crm' ); ?></a>
		<?php } ?>
		</p>
			<p class="sbhomep">
			<strong><?php esc_html_e( 'Data Tool Extensions Installed', 'zero-bs-crm' ); ?>:</strong><br /><br />
				<?php

				// } MVP
				$zbsDataToolsInstalled = 0;
				global $zeroBSCRM_CSVImporterslugs;
				if ( zeroBSCRM_isExtensionInstalled( 'csvpro' ) && isset( $zeroBSCRM_CSVImporterslugs ) ) {

					?>
					<button type="button" class="ui button primary" onclick="javascript:window.location='?page=<?php echo esc_attr( $zeroBSCRM_CSVImporterslugs['app'] ); ?>';" class="ui button primary" style="padding: 7px 16px;font-size: 16px;height: 46px;margin-bottom:8px;"><?php esc_html_e( 'CSV Importer', 'zero-bs-crm' ); ?></button><br />
					<?php
					// tagger post v1.1
					if ( isset( $zeroBSCRM_CSVImporterslugs['tagger'] ) ) {
						?>
					<button type="button" class="ui button primary" onclick="javascript:window.location='?page=<?php echo esc_attr( $zeroBSCRM_CSVImporterslugs['tagger'] ); ?>';" class="ui button primary" style="padding: 7px 16px;font-size: 16px;height: 46px;margin-bottom:8px;"><?php esc_html_e( 'CSV Tagger', 'zero-bs-crm' ); ?></button><br />
						<?php
					}
					++$zbsDataToolsInstalled;

				}

				if ( $zbsDataToolsInstalled == 0 ) {
					##WLREMOVE
					?>
					<?php esc_html_e( 'You do not have any Pro Data Tools installed as of yet', 'zero-bs-crm' ); ?>! <a href="<?php echo esc_url( $zbs->urls['productsdatatools'] ); ?>" target="_blank"><?php esc_html_e( 'Get some now', 'zero-bs-crm' ); ?></a>
					<?php
					##/WLREMOVE
				}

				?>
							
			</p><p class="sbhomep">
				<!-- #datatoolsales -->
			<strong><?php esc_html_e( 'Import Tools', 'zero-bs-crm' ); ?>:</strong><br /><br />
				<a href="<?php echo esc_url( $zbs->urls['productsdatatools'] ); ?>" target="_blank" class="ui button black primary"><?php esc_html_e( 'View Available Import Tools', 'zero-bs-crm' ); ?></a>              
			</p>
			<div class="sbhomep">
				<strong><?php esc_html_e( 'Export Tools', 'zero-bs-crm' ); ?>:</strong><br/>
				<p><?php esc_html_e( 'Want to use the refined object exporter? ', 'zero-bs-crm' ); ?></p>
				<p><a class="ui black button" href="<?php echo esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['export-tools'] ) ); ?>">Export Tools</a></p>
			</div>
	</div>
	<div class="ui grid">
	<div class="eight wide column">
	  
		<div class="ui segment" style="margin-right:20px;">
			<div class='mass-delete' style="text-align:center;">
				<h4 style="font-weight:900;"><?php esc_html_e( 'Delete CRM Data', 'zero-bs-crm' ); ?></h4>
				<p>
				<?php $str = sprintf( __( "To remove all CRM data (e.g. contacts, transactions, etc.), type '%s' in the box below and click 'Delete All Data'.", 'zero-bs-crm' ), 'DO IT' ); ?>
				<?php echo esc_html( $str ); ?>
				</p>
				<div class="zbs-delete-box" style="max-width:70%;margin:auto;">
				<p class='ui message warning'>
					<i class='ui icon exclamation'></i><b> <?php esc_html_e( 'Warning: This cannot be undone', 'zero-bs-crm' ); ?></b>
				</p>
				<form id="reset-data" class="ui form" action="#" method="POST">
					<input class="form-control" id="zbs-delete-data" name="zbs-delete-data" type="text" value="" placeholder="DO IT" style="text-align:center;font-size:25px;"/>
					<input type="submit" class="ui button red" value="<?php esc_attr_e( 'DELETE ALL DATA', 'zero-bs-crm' ); ?>" style="margin-top:10px;"/>
				</form>
				</div>            
			</div>
		</div>

	</div>
	<div class="eight wide column">
	  
		<div class="ui segment" style="margin-right:20px;">
			<div class='mass-delete' style="text-align:center;">
				<h4 style="font-weight:900;"><?php esc_html_e( 'Factory Reset CRM', 'zero-bs-crm' ); ?></h4>
				<p>
				<?php $str = sprintf( __( "To delete CRM data and all settings, type '%s' in the box below and click 'Reset CRM'.", 'zero-bs-crm' ), 'FACTORY RESET' ); ?>
				<?php echo esc_html( $str ); ?>
				</p>
				<div class="zbs-delete-box" style="max-width:70%;margin:auto;">
				<p class='ui message warning'>
					<i class='ui icon exclamation'></i><b> <?php esc_html_e( 'Warning: This cannot be undone', 'zero-bs-crm' ); ?></b>
				</p>
				<form id="factory-reset" class="ui form" action="#" method="POST">
					<input class="form-control" id="zbs-delete-all-data" name="zbs-delete-all-data" type="text" value="" placeholder="FACTORY RESET" style="text-align:center;font-size:25px;"/>
					<input type="submit" class="ui button red" value="<?php esc_attr_e( 'Reset CRM', 'zero-bs-crm' ); ?>" style="margin-top:10px;"/>
				</form>
				</div>          
			</div>
		</div>

	</div>

	
	
	
		<?php

	}
}

// } Install Extensions helper page
function zeroBSCRM_html_installextensionshelper() {

	global $wpdb, $zbs;  // } Req

	// } 27th Feb 2019 - MS pimp this page a little - but WL remove the salesy bit. bring into semantic UI properly too
	?>
			<style>
			.intro{
				font-size:18px !important;;
				font-weight:200;
				line-height:20px;
				margin-bottom:10px;
				margin-top:20px;
			}
			.zbs-admin-segment-center{
				text-align:center;
			}
			h2{
				font-weight:900;
				padding-bottom:30px;
			}
			.intro-buttons{
				padding:20px;
			}
			</style>
			<div class="ui segment zbs-admin-segment-center" style="margin-right:15px;">
	<?php
			##WLREMOVE
			zeroBSCRM_extension_installer_promo();
			##/WLREMOVE
	?>
			<h2><?php esc_html_e( 'Installing Extensions for Jetpack CRM', 'zero-bs-crm' ); ?></h2>
			<p class="intro"><?php echo wp_kses( sprintf( __( 'To control which modules are active, please go the <a href="%s">Core Module page</a>.', 'zero-bs-crm' ), esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['modules'] ) ) ), $zbs->acceptable_restricted_html ); ?></p>
			<p class="intro"><?php echo wp_kses( sprintf( __( 'To install premium extensions, purchased in a bundle or individually please go to <a href="%s">Plugins</a> and add your new extensions there.', 'zero-bs-crm' ), esc_url( admin_url( 'plugins.php' ) ) ), $zbs->acceptable_restricted_html ); ?></p>
			<p class="intro-buttons">
			<a href="<?php echo esc_url( admin_url( 'plugins.php' ) ); ?>" class="ui button primary"><i class="fa fa-plug" aria-hidden="true"></i> <?php esc_html_e( 'Upload Purchased Extensions', 'zero-bs-crm' ); ?></a>
			<?php ##WLREMOVE ?>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['extensions'] ) ); ?>" class="ui button green"><i class="fa fa-search" aria-hidden="true"></i> <?php esc_html_e( 'Browse Extensions', 'zero-bs-crm' ); ?></a>
			<?php ##/WLREMOVE ?>
			</p>
	</div>
	
	<?php
}

function zeroBSCRM_extension_installer_promo() {
	// extra function here to output additional bullie type stuff.
	?>
	<div class="bullie">
	<img src="<?php echo esc_url( jpcrm_get_logo( false ) ); ?>" alt="<?php esc_attr_e( 'Jetpack CRM logo', 'zero-bs-crm' ); ?>">
	</div>
	<?php
}

function zeroBSCRM_html_extensions_forWelcomeWizard() {

	global $wpdb, $zbs;  // } Req
	?>



			
		<div id="sbSubPage" style="width:100%;max-width:1000px"><h2 class="sbhomep"><?php esc_html_e( 'Power Up your CRM', 'zero-bs-crm' ); ?></h2>
			<p class="sbhomep"><?php esc_html_e( 'We hope that you love using Jetpack CRM and that you agree with our mentality of stripping out useless features and keeping things simple. Cool.', 'zero-bs-crm' ); ?></p>
			<p class="sbhomep"><?php esc_html_e( "We offer a few extensions which supercharge your CRM. As is our principle, though, you wont find any bloated products here. These are simple, effective power ups for Jetpack CRM. And compared to pay-monthly costs, they're affordable! Win!", 'zero-bs-crm' ); ?></p>
			<div style="width:100%"><a href="<?php echo esc_url( $zbs->urls['products'] ); ?>" target="_blank"><img style="width:100%;max-width:100%;margin-left:auto;margin-right:auto;" src="<?php echo esc_url( $zbs->urls['extimgrepo'] . 'extensions.png' ); ?>" alt="" /></a></div>
			<p class="sbhomep">
			<a href="<?php echo esc_url( $zbs->urls['products'] ); ?>" class="ui button primary" style="padding: 7px 16px;font-size: 22px;height: 46px;" target="_blank"><?php esc_html_e( 'View More', 'zero-bs-crm' ); ?></a>    
			</p>
	</div>
	<?php
}

// } helper for extension page (installs/uninstalls at init)
function zeroBSCRM_extensions_init_install() {

	// } Anything to install/uninstall?
	if ( isset( $_GET['zbsinstall'] ) && ! empty( $_GET['zbsinstall'] ) ) {

		global $zbs, $zbsExtensionInstallError;

		// } Validate
		global $zeroBSCRM_extensionsCompleteList;

		if (
		wp_verify_nonce( $_GET['_wpnonce'], 'zbscrminstallnonce' )
		&&
		// } Ext exists
		array_key_exists( $_GET['zbsinstall'], $zeroBSCRM_extensionsCompleteList ) ) {

			// Extension data
			$toActOn            = sanitize_text_field( $_GET['zbsinstall'] );
			$function_safe_name = str_replace( '-', '_', $toActOn );
			$extension_details  = zeroBSCRM_returnExtensionDetails( $toActOn );
			$installName        = 'Unknown';
			if ( isset( $extension_details['name'] ) ) {
				$installName = $extension_details['name'];
			}
			$helpurl = isset( $extension_details['meta'] ) && isset( $extension_details['meta']['helpurl'] ) && ! empty( $extension_details['meta']['helpurl'] ) ? $extension_details['meta']['helpurl'] : $zbs->urls['docs'];

			// Action
			if ( zeroBSCRM_isExtensionInstalled( $toActOn ) ) {
				$act = 'uninstall';
			} else {
				$act = 'install';
			}

			$successfullyInstalled = false;

			// } Try it
			try {

				if ( $act == 'install' ) {

					// } INSTALL

					// } If install func exists
					if ( function_exists( 'zeroBSCRM_extension_install_' . $function_safe_name ) ) {

						// } try it (returns bool)
						$successfullyInstalled = call_user_func( 'zeroBSCRM_extension_install_' . $function_safe_name );

					}
				} else {

							// } UNINSTALL

							// } If install func exists
					if ( function_exists( 'zeroBSCRM_extension_uninstall_' . $function_safe_name ) ) {

						// } try it (returns bool)
						$successfullyInstalled = call_user_func( 'zeroBSCRM_extension_uninstall_' . $function_safe_name );

					}
				}
			} catch ( Exception $ex ) {

						// meh

			}

			// set transient to pass any relevant messages
			$extension_messages = array(
				'success'           => $successfullyInstalled,
				'extension_name'    => $toActOn,
				'extension_details' => $extension_details,
				'pretty_name'       => $installName,
				'action'            => $act,
				'helpurl'           => $helpurl,
				'error_msg'         => $zbsExtensionInstallError,
			);

			set_transient( 'jpcrm_extension_messages', $extension_messages, MINUTE_IN_SECONDS );
			wp_redirect( jpcrm_esc_link( $zbs->slugs['modules'] ) );

		}
	}
}

function zeroBSCRM_html_extensions() {

	// globals
	global $zbs, $zeroBSCRM_extensionsInstalledList;

	// new design - for the fact we are adding new extensions all the time and now won't need to
	// keep on remembering to update this array and it will keep up to date. Also with things
	// like livestorm "connect" needed an on the flyfix.

	// WH added: Is now polite to License-key based settings like 'entrepreneur' doesn't try and upsell
	// this might be a bit easy to "hack out" hmmmm
	$bundle = false;
	if ( $zbs->hasEntrepreneurBundleMin() ) {
		$bundle = true;
	}

	echo '<div class="zbs-extensions-manager">';

	// get the products, from our sites JSON custom REST endpoint - that way only need to manage there and not remember to update all the time
	// each product has our extkey so can do the same as the built in array here ;) #progress #woop-da-woop
	if ( isset( $_GET['extension_id'] ) && ! empty( $_GET['extension_id'] ) ) {
		##WLREMOVE
			echo '<div class="zbs-page-wrap thinner" id="error-stuff">';
			$id      = (int) sanitize_text_field( $_GET['extension_id'] );
			$request = wp_safe_remote_get( 'https://jetpackcrm.com/wp-json/zbsextensions/v1/extensions/' . $id );

		if ( is_wp_error( $request ) ) {

			echo '<div class="zbs-page-wrap">';
			echo '<div class="ui message alert warning" style="display:block;margin-bottom: -25px;"><i class="wifi icon"></i> ';
				esc_html_e( 'You must be connected to the internet to view our live extensions page.', 'zero-bs-crm' );
			echo '</div>';
			echo '</div>';

			return false;
		}

			$body      = wp_remote_retrieve_body( $request );
			$extension = json_decode( $body );
			$info      = $extension->product;

		if ( $info == 'error' ) {
			echo '<div class="zbs-page-wrap">';
				echo '<div class="ui message alert error" style="display:block;margin-bottom: -25px;"><i class="exclamation icon"></i> ';
				esc_html_e( 'Product does not exist.', 'zero-bs-crm' );
				echo ' <a href="' . esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['extensions'] ) ) . '">' . esc_html__( 'Go Back', 'zero-bs-crm' ) . '</a>';
			echo '</div>';
			echo '</div>';
			return false;
		}
			echo '</div>';
			// end of #error-stuff

			echo '<div class="zbs-page-wrap thinner single-info-start">';

			echo '<div class="ui segment main-header-img">';
				echo '<div class="back">';
				echo '<a href="' . esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['extensions'] ) ) . '"><i class="chevron left icon"></i> ' . esc_html__( 'Back', 'zero-bs-crm' ) . '</a>';
				echo '</div>';

				echo '<div class="main-image full-size-image">';
				echo '<img src="' . esc_url( $info->image ) . '" alt="' . esc_attr( $info->name ) . '"/>';
				echo '</div>';

				echo '<div class="below-main-image about-author-block">';
					// start the about block
					echo '<div class="about-img"><img alt="Jetpack CRM logo" src="' . esc_url( $info->by ) . '"/>';
					echo '<div class="top-info-block">';
					echo '<h4 class="extension-name">' . esc_html( $info->name ) . '</h4>';
					echo '<div class="who">' . esc_html__( 'by ', 'zero-bs-crm' ) . '<a class="by-url" href="' . esc_url( $zbs->urls['home'] ) . '" target="_blank">Jetpack CRM</a></div>';
					echo '</div>';
					echo '</div>';
					// end the about block

					// action block (installed / not)
					$extkey     = $info->extkey;
					$sales_link = $zbs->urls['home'] . '/product/' . $info->slug;

					$installed = zeroBSCRM_isExtensionInstalled( $extkey );
					$docs      = $info->docs;
					echo '<div class="actions-block"><div class="install-ext">';
		if ( $installed ) {
			echo '<span class="ui label green large"><i class="check circle icon"></i> ' . esc_html__( 'Installed', 'zero-bs-crm' ) . '</span>';
		} elseif ( $bundle ) {
			echo '<a href="' . esc_url( $zbs->urls['account'] ) . '" class="ui blue button" target="_blank"><i class="download icon"></i> ' . esc_html__( 'Download', 'zero-bs-crm' ) . '</a>';
		} else {
			echo '<a href="' . esc_url( $sales_link ) . '" class="ui blue button" target="_blank"><i class="cart icon"></i> ' . esc_html__( 'Buy', 'zero-bs-crm' ) . '</a>';
		}
		if ( ! empty( $docs ) ) {
			echo '<a class="docs-url ui button" href="' . esc_url( $docs ) . '" target="_blank"><i class="book icon"></i>' . esc_html__( 'View Docs', 'zero-bs-crm' ) . '</a>';
		}
					echo '</div>';
					echo '</div>';
					// end action block
				echo '</div>';
				// end the about-author-block

				echo '<div class="clear"></div>'; // clear stuff

			echo '</div>';  // end the whole header image block

			echo '</div>';
			// end the start of the info block (top block)

			echo '<div class="zbs-page-wrap thinner single-bundle-wrap">';
		if ( ! $bundle ) {
			echo '<div class="bullie-wrap">';
			echo '<div class="bullie">';
				echo '<img src="' . esc_url( jpcrm_get_logo() ) . '" alt="Jetpack CRM" style="height:48px;padding:10px;">';
				echo '<div class="upgrade">' . esc_html__( 'Purchase the Entrepreneur Bundle to get access to all of our CRM extensions.', 'zero-bs-crm' ) . '</div>';
				echo '<a class = "ui button green mini upgrade-bullie-box" href="' . esc_url( $zbs->urls['upgrade'] ) . '" target = "_blank"><i class="cart plus icon"></i> ' . esc_html__( 'Start', 'zero-bs-crm' ) . '</a>';
			echo '</div>';
			echo '</div>';
			echo '<div class="clear"></div>';
		}
			echo '</div>';

			echo '<div class="zbs-page-wrap thinner" id="single-ext-desc">';
			echo '<div class="ui segment main-talk">';
				echo '<div class="extension-description">';

					// semantic ui switch html from bootstrap ones (grids basically)
					$desc = str_replace( 'class="row"', 'class="ui grid"', $info->description );
					$desc = str_replace( ' row"', ' ui grid"', $desc );
					$desc = str_replace( 'col-md-6', 'eight wide column', $desc );
					$desc = str_replace( 'col-sm-8', 'ten wide column', $desc );
					$desc = str_replace( 'col-lg-1', '', $desc );
					$desc = str_replace( 'col-lg-2', 'four wide column', $desc );

					echo $desc;
				echo '</div>';
				// buy
		if ( ! $installed && ! $bundle ) {
			echo '<hr /><div style="margin:2em;text-align:center"><a href="' . esc_url( $sales_link ) . '" class = "ui large blue button" target="_blank"><i class="cart icon"></i> ' . esc_html__( 'Buy Extension', 'zero-bs-crm' ) . '</a></div>';
		}
			echo '</div>';
			echo '</div>';
			// id="single-ext-desc"

		##/WLREMOVE
	} else {

		##WLREMOVE
			$showLinkButton = true;

			// get the JSON response from woocommerce REST endpoint.
			$request = wp_safe_remote_get( $zbs->urls['checkoutapi'] );
		if ( is_wp_error( $request ) ) {
			// if there's an error, server the JSON in the function
			$extensions = json_decode( zeroBSCRM_serve_cached_extension_block() );
			echo '<div class="zbs-page-wrap">';
				echo '<div class="ui message alert warning" style="display:block;margin-bottom: -25px;"><i class="wifi icon"></i> ';
				esc_html_e( 'You must be connected to the internet to view our live extensions page. You are being shown an offline version.', 'zero-bs-crm' );
			echo '</div>';
			echo '</div>';
			$showLinkButton = false;
		} else {
			$body       = wp_remote_retrieve_body( $request );
			$extensions = json_decode( $body );
		}

			// if we somehow still haven't got actual obj, use cached:
			// .. This was happening when our mainsite json endpoint is down
		if ( ! is_array( $extensions->paid ) ) {
			$extensions = json_decode( zeroBSCRM_serve_cached_extension_block() );
		}

			echo '<div class="zbs-page-wrap">';
		if ( ! $bundle ) {
			echo '<div class="bullie-wrap">';
			echo '<div class="bullie">';
			echo '<img src="' . esc_url( jpcrm_get_logo( false ) ) . '" alt="Jetpack CRM" style="height: 48px; padding:10px;">';
			echo '<div class="upgrade">' . esc_html__( 'Purchase the Entrepreneur Bundle to get access to all of our CRM extensions.', 'zero-bs-crm' ) . '</div>';
			echo '<a class="ui button green mini upgrade-bullie-box" href="' . esc_url( $zbs->urls['upgrade'] ) . '" target = "_blank"><i class="cart plus icon"></i> ' . esc_html__( 'Buy  Now', 'zero-bs-crm' ) . '</a>';
			echo '</div>';
			echo '</div>';
			echo '<div class="clear"></div>';
		}
			echo '<div class="ui top attached header premium-box"><h3 class="box-title">' . esc_html__( 'Premium Extensions', 'zero-bs-crm' ) . '</h3>   <a class="guides ui button black mini" href="' . esc_url( $zbs->urls['docs'] ) . '" target="_blank"><i class="book icon"></i> ' . esc_html__( 'Knowledge-base', 'zero-bs-crm' ) . '</a> <a style="color: black !important;box-shadow: 0px 0px 0px 1px black inset !important;" class="guides ui button blue basic mini" href="' . esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['modules'] ) ) . '"><i class="puzzle piece icon"></i> ' . esc_html__( 'Core Modules', 'zero-bs-crm' ) . '</a>   </div>';
			echo '<div class="clear"></div>';
			echo '<div class="ui segment attached">';
				echo '<div class="ui internally celled grid">';

				$e = 0;
		$count     = 0;
		$idsToHide = array( 17121, 17119 );
		if ( is_array( $extensions->paid ) ) {

			$top_woo_extension_slugs = array( 'advanced-segments', 'sales-dashboard', 'automations', 'client-portal-pro', 'csv-importer-pro', 'wordpress-utilities' );
			$extensions_to_display   = array();
			$top_woo_extensions      = array();
			$has_woosync             = zeroBSCRM_isExtensionInstalled( 'woo-sync' );

			// We want to prioritize the top 5 Woo modules in the list if 'woosync' is active, but otherwise alphabetize everything.
			foreach ( $extensions->paid as $extension ) {
				if ( $has_woosync && ! empty( $extension->slug ) && in_array( $extension->slug, $top_woo_extension_slugs, true ) ) {
					$top_woo_extensions[] = $extension;
					continue;
				}
				$extensions_to_display[] = $extension;
			}

			if ( count( $top_woo_extensions ) !== 0 ) {
				usort(
					$top_woo_extensions,
					function (
					$str1,
					$str2
					) {
						return strcasecmp( $str1->name, $str2->name );
					}
				);
			}

			usort(
				$extensions_to_display,
				function (
				$str1,
				$str2
				) {
					return strcasecmp( $str1->name, $str2->name );
				}
			);

			$extensions_to_display = array_merge( $top_woo_extensions, $extensions_to_display );

			foreach ( $extensions_to_display as $extension ) {
				// hide bundles
				if ( ! in_array( $extension->id, $idsToHide ) ) {

					$more_url = admin_url( 'admin.php?page=' . $zbs->slugs['extensions'] . '&extension_id=' . $extension->id );

					$extkey    = $extension->extkey;
					$installed = zeroBSCRM_isExtensionInstalled( $extkey );
					if ( $e == 0 ) {
						echo '<div class="row">';
					}

					echo "<div class='two wide column'>";
						echo "<img alt='" . esc_attr( $extension->name ) . "' src='" . esc_url( $extension->image ) . "'/>";
					echo '</div>';

					echo "<div class='six wide column ext-desc'>";
					if ( $installed ) {
						echo '<div class="ui green right corner label"><i class="check icon"></i></div>';
					}
					echo "<div class='title'>" . esc_html( $extension->name ) . '</div>';
					echo "<div class='content'>" . $extension->short_desc . '</div>';

					if ( $showLinkButton ) {
							echo '<div class="hover"></div><div class="hover-link">';

							$sales_link = $zbs->urls['home'] . '/product/' . $extension->slug;

							// api connector skips these
						if ( $extkey == 'apiconnector' ) {

							// api connector

							// view
							echo "<a href='" . esc_url( $zbs->urls['apiconnectorsales'] ) . "' target='_blank'><span class='ui button orange mini'>" . esc_html__( 'View', 'zero-bs-crm' ) . '</span></a>';

							// download or buy
							if ( $bundle ) {
								echo "<a href='" . esc_url( $zbs->urls['account'] ) . "' target='_blank'><span class='ui button green mini'>" . esc_html__( 'Download', 'zero-bs-crm' ) . '</span></a>';
							} else {
								echo "<a href='" . esc_url( $sales_link ) . "' target='_blank'><span class='ui button green mini'>" . esc_html__( 'Buy', 'zero-bs-crm' ) . '</span></a>';
							}
						} else {

												// non api connector
												echo "<a href='" . esc_url( $more_url ) . "'><span class='ui button orange mini'>" . esc_html__( 'View', 'zero-bs-crm' ) . '</span></a>';

							if ( ! $installed ) {

								if ( $bundle ) {
									echo "<a href='" . esc_url( $zbs->urls['account'] ) . "' target='_blank'><span class='ui button green mini'>" . esc_html__( 'Download', 'zero-bs-crm' ) . '</span></a>';
								} else {
									echo "<a href='" . esc_url( $sales_link ) . "' target='_blank'><span class='ui button green mini'>" . esc_html__( 'Buy', 'zero-bs-crm' ) . '</span></a>';
								}
							} elseif ( isset( $extension->docs ) && ! empty( $extension->docs ) ) {
								echo "<a href='" . esc_url( $extension->docs ) . "' target='_blank'><span class='ui button blue mini'>" . esc_html__( 'Docs', 'zero-bs-crm' ) . '</span></a>';
							}
						}
						echo '</div>';
					}

							echo '</div>';

							++$e;
							++$count;
					if ( $e > 1 ) {
						echo '</div>';
						$e = 0;
					}
				} // / if not hidde

			}
		}

				// add on the coming soon block
		if ( $e == 1 ) {

			// End of row

				echo "<div class='two wide column'>";
				echo "<img alt='" . esc_attr__( 'Coming Soon', 'zero-bs-crm' ) . "' src='" . esc_url( plugins_url( 'i/soon.png', ZBS_ROOTFILE ) ) . "'/>";
				echo '</div>';

				echo "<div class='six wide column ext-desc'>";
				echo "<div class='title'>" . esc_html__( 'Coming soon', 'zero-bs-crm' ) . '</div>';
				echo "<div class='content'>" . esc_html__( 'See and vote for what extensions we release next', 'zero-bs-crm' ) . '</div>';

				echo '<div class="hover"></div>';
				echo "<a class='hover-link' href='" . esc_url( $zbs->urls['soon'] ) . "' target='_blank'><span class='ui button orange mini'>" . esc_html__( 'View', 'zero-bs-crm' ) . '</span></a>';
				echo '</div>';

		} else {

			// Row to itself

			echo '<div class="row">';

			echo "<div class='two wide column'>";
			echo "<img alt='" . esc_attr__( 'Coming Soon', 'zero-bs-crm' ) . "' src='" . esc_url( plugins_url( 'i/soon.png', ZBS_ROOTFILE ) ) . "'/>";
			echo '</div>';

			echo "<div class='six wide column ext-desc'>";

			echo "<div class='title'>" . esc_html__( 'Coming soon', 'zero-bs-crm' ) . '</div>';
			echo "<div class='content'>" . esc_html__( 'See and vote for what extensions we release next', 'zero-bs-crm' ) . '</div>';

			echo '<div class="hover"></div>';
			echo "<a class='hover-link' href='" . esc_url( $zbs->urls['soon'] ) . "' target='_blank'><span class='ui button orange mini'>" . esc_html__( 'View', 'zero-bs-crm' ) . '</span></a>';
			echo '</div>';

		}

				// coming soon end row
				echo '</div>'; // end the row (as it will be adding on)

				echo '</div>';
			echo '</div>';
			echo '</div>';  // end page wrap.

			##/WLREMOVE

	}

	echo '</div>';
}

// moving the CRM modules into a new function so can be found easier
function jpcrm_html_modules() {

	global $zbs;

	if ( ! isset( $_GET['zbsinstall'] ) ) {

		$transient_key   = 'jpcrm_extension_messages';
		$module_messages = get_transient( $transient_key );
		delete_transient( $transient_key );
	}

	// Install/uninstall message
	if ( ! empty( $module_messages ) ) {
		echo '<div class="zbs-page-wrap install-message-list" style="margin-top:10px;">';
		if ( $module_messages['success'] ) {

			$msgHTML = '<i class="fa fa-check" aria-hidden="true"></i> ';
			if ( $module_messages['action'] === 'install' ) {
				$msgHTML .= __( 'Successfully activated module:', 'zero-bs-crm' );
			} else {
				$msgHTML .= __( 'Successfully deactivated module:', 'zero-bs-crm' );
			}
			$msgHTML .= ' ' . $module_messages['pretty_name'];

			// if API, catch and give further info (e.g. no key)
			if ( $module_messages['action'] === 'install' && $module_messages['pretty_name'] === 'API' ) {

				// installed API
				// get if set
				$api_key    = zeroBSCRM_getAPIKey();
				$api_secret = zeroBSCRM_getAPISecret();
				// $endpoint_url = zeroBSCRM_getAPIEndpoint();
				if ( empty( $api_key ) ) {

					// assume no keys yet, tell em
					$msgHTML .= '<hr />' . __( 'You can now generate API Keys and send data into your CRM via API:', 'zero-bs-crm' ) . '<p style="padding:1em"><a href="' . jpcrm_esc_link( $zbs->slugs['settings'] ) . '&tab=api" class="ui button green">' . __( 'Generate API Keys', 'zero-bs-crm' ) . '</a></p>';

				}
			}

			// if WooSync, Signpost hub page
			if ( $module_messages['action'] == 'install' && $module_messages['extension_name'] == 'woosync' ) {

				// assume no keys yet, tell em
				$msgHTML .= '<hr />' . __( 'To get started importing your WooCommerce orders, visit the WooSync hub:', 'zero-bs-crm' ) . '<p style="padding:1em"><a href="' . jpcrm_esc_link( $zbs->slugs['woosync'] ) . '" class="ui button green">' . __( 'Get started with WooSync', 'zero-bs-crm' ) . '</a></p>';

			}

			// Show a help url if present
			if ( $module_messages['action'] === 'install' ) {

				$msgHTML .= '<br /><i class="fa fa-info-circle" aria-hidden="true"></i> <a href="' . $module_messages['helpurl'] . '" target="_blank">' . __( 'View Help Documentation', 'zero-bs-crm' ) . '</a>';

			}

			echo zeroBSCRM_html_msg( 0, $msgHTML );

		} else {

			$errmsg = __( 'Unable to activate module:', 'zero-bs-crm' ) . ' ' . $module_messages['pretty_name'] . '<br>' . sprintf( __( 'Please contact <a href="%s" target="_blank">Support</a> if this persists.', 'zero-bs-crm' ), $zbs->urls['support'] );

			if ( isset( $module_messages['error_msg'] ) ) {
				$errmsg .= '<br />' . __( 'Installer Error:', 'zero-bs-crm' ) . ' ' . $module_messages['error_msg'];
			}

			echo zeroBSCRM_html_msg( -1, $errmsg );

		}

		echo '</div>';

	}

	echo '<div class="zbs-extensions-manager">';

			// this block should be in here for rebranded people who want to turn on or off features.
			echo '<div class="zbs-page-wrap free-block-wrap">';
			echo '<h3 class="ui top attached header free-box" id="core-modules">' . esc_html__( 'Core Modules', 'zero-bs-crm' ) . '</h3>';
			echo '<div class="ui segment attached free-ext-area">';
			echo '<div class="ui internally celled grid">';

				// output the free stuff :-) with turn on / off.
				$e = 0;
	foreach ( zeroBSCRM_extensions_free() as $k => $v ) {

		if ( is_array( $v ) ) {

					$modify_url = wp_nonce_url( 'admin.php?page=' . $zbs->slugs['modules'] . '&zbsinstall=' . $k, 'zbscrminstallnonce' );

					$installed = zeroBSCRM_isExtensionInstalled( $k );

			if ( $e == 0 ) {
				echo '<div class="row">';
			}

					echo "<div class='two wide column free-ext-img'>";
						echo "<img src='" . esc_url( plugins_url( 'i/' . $v['i'], ZBS_ROOTFILE ) ) . "'/>";
					echo '</div>';

					echo "<div class='six wide column ext-desc'>";
						$amend       = __( 'Activate', 'zero-bs-crm' );
						$amend_color = 'green';
			if ( $installed ) {
				echo '<div class="ui green right corner label"><i class="check icon"></i></div>';
				$amend       = __( 'Deactivate', 'zero-bs-crm' );
				$amend_color = 'red';
			} else {
				echo '<div class="ui red right corner label"><i class="times icon"></i></div>';
			}
						echo "<div class='title'>" . esc_html( $v['name'] ) . '</div>';
						echo "<div class='content'>" . $v['short_desc'] . '</div>';

						echo '<div class="hover"></div>';
						echo "<a class='hover-link' href='" . esc_url( $modify_url ) . "'><span class='ui button " . esc_attr( $amend_color ) . " mini'>" . esc_html( $amend ) . '</span></a>';

					echo '</div>';

					++$e;
			if ( $e > 1 ) {
				echo '</div>';
				$e = 0;
			}
		} // / if is array (csvimporterlite = false so won't show here)

	} // /foreach

			echo '</div>';
			echo '</div>';
		echo '</div>';

		echo '</div>';
}

// } post-deletion page
function zeroBSCRM_html_norights() {

	global $wpdb, $zbs;  // } Req

	// } Discern type of norights:
	$noaccessType = '?'; // Customer
	$noaccessstr  = '?'; // Mary Jones ID 123
	$noaccessID   = -1;
	$isRestore    = false;
	$backToPage   = 'edit.php?post_type=zerobs_customer&page=manage-customers';

	// } Discern type + set back to page
	$noAccessType = '';

	// DAL3 switch
	if ( $zbs->isDAL3() ) {

		// DAL 3
		$objID      = $zbs->zbsvar( 'zbsid' ); // -1 or 123 ID
		$objTypeStr = $zbs->zbsvar( 'zbstype' ); // -1 or 'contact'

		// if objtypestr is -1, assume contact (default)
		if ( $objTypeStr == -1 ) {
			$objType = ZBS_TYPE_CONTACT;
		} else {
			$objType = $zbs->DAL->objTypeID( $objTypeStr );
		}

		// if got type, link to list view
		// else give dash link
		$slugToSend      = '';
		$noAccessTypeStr = '';

		// back to page
		if ( $objType > 0 ) {
			$slugToSend = $zbs->DAL->listViewSlugFromObjID( $objType );
		}
		if ( empty( $slugToSend ) ) {
			$slugToSend = $zbs->slugs['dash'];
		}
		$backToPage = 'admin.php?page=' . $slugToSend;

		// obj type str
		if ( $objType > 0 ) {
			$noAccessTypeStr = $zbs->DAL->typeStr( $objType );
		}
		if ( empty( $noAccessTypeStr ) ) {
			$noAccessTypeStr = __( 'Object', 'zero-bs-crm' );
		}
	} else {

		// PRE DAL3:

		if ( isset( $_GET['post_type'] ) && ! empty( $_GET['post_type'] ) ) {
			$noAccessType = $_GET['post_type'];
		} elseif ( isset( $_GET['id'] ) ) {
			$noAccessType = get_post_type( $_GET['id'] );
		}

		switch ( $noAccessType ) {

			case 'zerobs_customer':
				$backToPage      = 'edit.php?post_type=zerobs_customer&page=manage-customers';
				$noAccessTypeStr = __( 'Contact', 'zero-bs-crm' );

				break;

			case 'zerobs_company':
				$backToPage      = 'edit.php?post_type=zerobs_company&page=manage-companies';
				$noAccessTypeStr = __( jpcrm_label_company(), 'zero-bs-crm' );

				break;

			default:
				// Dash
				$backToPage      = 'admin.php?page=' . $zbs->slugs['dash'];
				$noAccessTypeStr = __( 'Resource', 'zero-bs-crm' );

				break;

		}
	}

	?>
	<div id="zbsNoAccessPage">
		<div id="zbsNoAccessMsgWrap">
		<div id="zbsNoAccessIco"><i class="fa fa-archive" aria-hidden="true"></i></div>
		<div class="zbsNoAccessMsg">
			<h2><?php esc_html_e( 'Access Restricted', 'zero-bs-crm' ); ?></h2>
			<p><?php esc_html_e( 'You do not have access to this ' . $noAccessTypeStr . '.', 'zero-bs-crm' ); ?></p>
		</div>
		<div class="zbsNoAccessAction">
			<button type="button" class="ui button primary" onclick="javascript:window.location='<?php echo esc_url( $backToPage ); ?>'"><?php esc_html_e( 'Back', 'zero-bs-crm' ); ?></button>

		</div>
		</div>
	</div>        
	<?php
}

/*
======================================================
	/ Admin Pages
	====================================================== */

/*
======================================================
	HTML Output Msg (alerts)
	====================================================== */

	// } wrapper here for lib
function whStyles_html_msg( $flag, $msg, $includeExclaim = false ) {

	zeroBSCRM_html_msg( $flag, $msg, $includeExclaim );
}

	// } Outputs HTML message - 27th Feb 2019 - modified for Semantic UI (still had sgExclaim!)
function zeroBSCRM_html_msg( $flag, $msg, $includeExclaim = false ) {

	if ( $includeExclaim ) {
		$msg = '<div id="sgExclaim">!</div>' . $msg . ''; }
	if ( $flag == -1 ) {
		echo '<div class="ui message alert danger">' . $msg . '</div>';
	}
	if ( $flag == 0 ) {
		echo '<div class="ui message alert success">' . $msg . '</div>';
	}
	if ( $flag == 1 ) {
		echo '<div class="ui message alert warning">' . $msg . '</div>';
	}
	if ( $flag == 2 ) {
		echo '<div class="ui message alert info">' . $msg . '</div>';
	}
}

/*
======================================================
	/ HTML Output Msg (alerts)
	====================================================== */
