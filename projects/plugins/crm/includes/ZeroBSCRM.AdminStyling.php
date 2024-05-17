<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
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

/*
======================================================
	Jetpack CRM Closers - WH - these would be better as transients IMO
	These allow you to "x" things in ZBS and persist the state
	====================================================== */

	// } Returns a timestamp or false, depending on if a "closer" has been logged
	// } see zeroBSCRM_AJAX_logClose
function zeroBSCRM_getCloseState( $key = '' ) {

	if ( ! empty( $key ) ) {
		return get_option( 'zbs_closers_' . $key, false );
	}

	return false;
}
	// } Removes close state
function zeroBSCRM_clearCloseState( $key = '' ) {

	if ( ! empty( $key ) ) {
		return delete_option( 'zbs_closers_' . $key );
	}

	return false;
}
/*
======================================================
	/ Jetpack CRM Closers
	====================================================== */

/*
======================================================
	WordPress Button/Text Overides (could end up in language inc?)
	====================================================== */

	// } WH10 http://wordpress.stackexchange.com/questions/15357/edit-the-post-updated-view-post-link
	// use: add_filter('post_updated_messages', 'zeroBSCRM_improvedPostMsgsBookings'); on init
function zeroBSCRM_improvedPostMsgsCustomers( $messages ) {

	// print_r($messages); exit();

	$messages['post'] = array(
		0  => '', // Unused. Messages start at index 1.
		1  => sprintf(
			/* Translators: %s: link to the main Contacts page */
			__( 'Contact updated. <a href="%s">Back to Contacts</a>', 'zero-bs-crm' ),
			esc_url( 'edit.php?post_type=zerobs_customer&page=manage-customers' )
		),
		2  => __( 'Contact updated.', 'zero-bs-crm' ),
		3  => __( 'Contact field deleted.', 'zero-bs-crm' ),
		4  => __( 'Contact updated.', 'zero-bs-crm' ),
		/* translators: %s: date and time of the revision */
		5  => isset( $_GET['revision'] ) ? sprintf( __( 'Contact restored to revision from %s', 'zero-bs-crm' ), wp_post_revision_title( (int) sanitize_text_field( $_GET['revision'] ), false ) ) : false, // phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		6  => sprintf(
			/* Translators: %s: link to the main Contacts page */
			__( 'Contact added. <a href="%s">Back to Contacts</a>', 'zero-bs-crm' ),
			esc_url( 'edit.php?post_type=zerobs_customer&page=manage-customers' )
		),
		7  => __( 'Contact saved.', 'zero-bs-crm' ),
		8  => sprintf(
			/* Translators: %s: link to the main Contacts page */
			__( 'Contact submitted. <a target="_blank" href="%s">Back to Contacts</a>', 'zero-bs-crm' ),
			esc_url( 'edit.php?post_type=zerobs_customer&page=manage-customers' )
		),
		9  => '',
		10 => sprintf(
			/* Translators: %s: link to the main Contacts page */
			__( 'Contact draft updated. <a target="_blank" href="%s">Back to Contacts</a>', 'zero-bs-crm' ),
			esc_url( 'edit.php?post_type=zerobs_customer&page=manage-customers' )
		),
	);

	return $messages;
}
function zeroBSCRM_improvedPostMsgsCompanies( $messages ) {

	// print_r($messages); exit();

	$messages['post'] = array(
		0  => '', // Unused. Messages start at index 1.
		1  => sprintf( __( jpcrm_label_company() . ' updated. <a href="%s">Back to ' . jpcrm_label_company( true ) . '</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_company&page=manage-companies' ) ), // get_permalink($post_ID) ) ),
		2  => __( jpcrm_label_company() . ' updated.', 'zero-bs-crm' ),
		3  => __( jpcrm_label_company() . ' field deleted.', 'zero-bs-crm' ),
		4  => __( jpcrm_label_company() . ' updated.', 'zero-bs-crm' ),
		/* translators: %s: date and time of the revision */
		5  => isset( $_GET['revision'] ) ? sprintf( __( jpcrm_label_company() . ' restored to revision from %s', 'zero-bs-crm' ), wp_post_revision_title( (int) sanitize_text_field( $_GET['revision'] ), false ) ) : false,
		6  => sprintf( __( jpcrm_label_company() . ' added. <a href="%s">Back to ' . jpcrm_label_company( true ) . '</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_company&page=manage-companies' ) ), // get_permalink($post_ID) ) ),//esc_url( get_permalink($post_ID) ) ),
		7  => __( jpcrm_label_company() . ' saved.', 'zero-bs-crm' ),
		8  => sprintf( __( jpcrm_label_company() . ' submitted. <a target="_blank" href="%s">Back to ' . jpcrm_label_company( true ) . '</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_company&page=manage-companies' ) ), // esc_url( add_query_arg( 'preview', 'true', get_permalink($post_ID) ) ) ),
		9  => '', // sprintf( ), //get_permalink($post_ID) ) ),//esc_url( get_permalink($post_ID) ) ),
		10 => sprintf( __( jpcrm_label_company() . ' draft updated. <a target="_blank" href="%s">Back to ' . jpcrm_label_company( true ) . '</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_customer&page=manage-companies' ) ), // get_permalink($post_ID) ) ),//esc_url( add_query_arg( 'preview', 'true', get_permalink($post_ID) ) ) ),
	);

	return $messages;
}
function zeroBSCRM_improvedPostMsgsInvoices( $messages ) {

	// print_r($messages); exit();

	$messages['post'] = array(
		0  => '', // Unused. Messages start at index 1.
		1  => sprintf( __( 'Invoice updated. <a href="%s">Back to Invoices</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_invoice&page=manage-invoices' ) ), // get_permalink($post_ID) ) ),
		2  => __( 'Invoice updated.', 'zero-bs-crm' ),
		3  => __( 'Invoice field deleted.', 'zero-bs-crm' ),
		4  => __( 'Invoice updated.', 'zero-bs-crm' ),
		/* translators: %s: date and time of the revision */
		5  => isset( $_GET['revision'] ) ? sprintf( __( 'Invoice restored to revision from %s', 'zero-bs-crm' ), wp_post_revision_title( (int) sanitize_text_field( $_GET['revision'] ), false ) ) : false,
		6  => sprintf( __( 'Invoice added. <a href="%s">Back to Invoices</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_invoice&page=manage-invoices' ) ), // get_permalink($post_ID) ) ),//esc_url( get_permalink($post_ID) ) ),
		7  => __( 'Invoice saved.', 'zero-bs-crm' ),
		8  => sprintf( __( 'Invoice submitted. <a target="_blank" href="%s">Back to Invoices</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_invoice&page=manage-invoices' ) ), // esc_url( add_query_arg( 'preview', 'true', get_permalink($post_ID) ) ) ),
		9  => '', // sprintf( ), //get_permalink($post_ID) ) ),//esc_url( get_permalink($post_ID) ) ),
		10 => sprintf( __( 'Invoice draft updated. <a target="_blank" href="%s">Back to Invoices</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_invoice&page=manage-invoices' ) ), // get_permalink($post_ID) ) ),//esc_url( add_query_arg( 'preview', 'true', get_permalink($post_ID) ) ) ),
	);

	return $messages;
}
function zeroBSCRM_improvedPostMsgsQuotes( $messages ) {

	// print_r($messages); exit();

	$messages['post'] = array(
		0  => '', // Unused. Messages start at index 1.
		1  => sprintf( __( 'Quote updated. <a href="%s">Back to Quotes</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_quote&page=manage-quotes' ) ), // get_permalink($post_ID) ) ),
		2  => __( 'Quote updated.', 'zero-bs-crm' ),
		3  => __( 'Quote field deleted.', 'zero-bs-crm' ),
		4  => __( 'Quote updated.', 'zero-bs-crm' ),
		/* translators: %s: date and time of the revision */
		5  => isset( $_GET['revision'] ) ? sprintf( __( 'Quote restored to revision from %s', 'zero-bs-crm' ), wp_post_revision_title( (int) sanitize_text_field( $_GET['revision'] ), false ) ) : false,
		6  => sprintf( __( 'Quote added. <a href="%s">Back to Quotes</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_quote&page=manage-quotes' ) ), // get_permalink($post_ID) ) ),//esc_url( get_permalink($post_ID) ) ),
		7  => __( 'Quote saved.', 'zero-bs-crm' ),
		8  => sprintf( __( 'Quote submitted. <a target="_blank" href="%s">Back to Quotes</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_quote&page=manage-quotes' ) ), // esc_url( add_query_arg( 'preview', 'true', get_permalink($post_ID) ) ) ),
		9  => '', // sprintf( ), //get_permalink($post_ID) ) ),//esc_url( get_permalink($post_ID) ) ),
		10 => sprintf( __( 'Quote draft updated. <a target="_blank" href="%s">Back to Quotes</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_quote&page=manage-quotes' ) ), // get_permalink($post_ID) ) ),//esc_url( add_query_arg( 'preview', 'true', get_permalink($post_ID) ) ) ),
	);

	return $messages;
}
function zeroBSCRM_improvedPostMsgsTransactions( $messages ) {

	// print_r($messages); exit();

	global $zbs;

	$messages['post'] = array(
		0  => '', // Unused. Messages start at index 1.
		1  => sprintf( __( 'Transaction updated. <a href="%s">Back to Transactions</a>', 'zero-bs-crm' ), esc_url( 'admin.php?page=' . $zbs->slugs['managetransactions'] ) ), // get_permalink($post_ID) ) ),
		2  => __( 'Transaction updated.', 'zero-bs-crm' ),
		3  => __( 'Transaction field deleted.', 'zero-bs-crm' ),
		4  => __( 'Transaction updated.', 'zero-bs-crm' ),
		/* translators: %s: date and time of the revision */
		5  => isset( $_GET['revision'] ) ? sprintf( __( 'Transaction restored to revision from %s', 'zero-bs-crm' ), wp_post_revision_title( (int) sanitize_text_field( $_GET['revision'] ), false ) ) : false,
		6  => sprintf( __( 'Transaction added. <a href="%s">Back to Transactions</a>', 'zero-bs-crm' ), esc_url( 'admin.php?&page=' . $zbs->slugs['managetransactions'] ) ), // get_permalink($post_ID) ) ),//esc_url( get_permalink($post_ID) ) ),
		7  => __( 'Transaction saved.', 'zero-bs-crm' ),
		8  => sprintf( __( 'Transaction submitted. <a target="_blank" href="%s">Back to Transactions</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_transaction' ) ), // esc_url( add_query_arg( 'preview', 'true', get_permalink($post_ID) ) ) ),
		9  => '', // sprintf( ), //get_permalink($post_ID) ) ),//esc_url( get_permalink($post_ID) ) ),
		10 => sprintf( __( 'Transaction draft updated. <a target="_blank" href="%s">Back to Transactions</a>', 'zero-bs-crm' ), esc_url( 'edit.php?post_type=zerobs_transaction' ) ), // get_permalink($post_ID) ) ),//esc_url( add_query_arg( 'preview', 'true', get_permalink($post_ID) ) ) ),
	);

	return $messages;
}

/*
======================================================
	/ WordPress Button Overides
	====================================================== */

/*
======================================================
	WordPress Footer Msg
	====================================================== */

// } Footer Text
function jpcrm_footer_credit_thanks( $content ) {

	// return original text if not on a CRM page
	if ( ! zeroBSCRM_isAdminPage() ) {
		return $content;
	}

	##WLREMOVE
	global $zbs;
	$showpoweredby_admin = $zbs->settings->get( 'showpoweredby_admin' ) === 1 ? true : false;
	if ( $showpoweredby_admin ) {
		return '<span id="footer-thankyou">' . sprintf( __( 'Thank you for using <a href="%s">Jetpack CRM</a>.', 'zero-bs-crm' ), $zbs->urls['home'] ) . '</span>';
	}
	##/WLREMOVE

	// return blank if disabled or white label
	return '';
}
add_filter( 'admin_footer_text', 'jpcrm_footer_credit_thanks' );

function jpcrm_footer_credit_version( $content ) {

	// return original text if not on a CRM page
	if ( ! zeroBSCRM_isAdminPage() ) {
		return $content;
	}

	##WLREMOVE
	global $zbs;
	$showpoweredby_admin = $zbs->settings->get( 'showpoweredby_admin' ) === 1 ? true : false;
	if ( $showpoweredby_admin ) {
		return sprintf( 'Jetpack CRM v%s', $zbs->version );
	}
	##/WLREMOVE

	// return blank if disabled or white label
	return '';
}
add_filter( 'update_footer', 'jpcrm_footer_credit_version', 11 );

/*
======================================================
	/ WordPress Footer Msg
	====================================================== */

/*
======================================================
	Color Grabber Admin Colour Schemes
	====================================================== */

// } Admin Colour Schemes
add_action( 'admin_head', 'zbs_color_grabber' );
function zbs_color_grabber() {
	// } Information here to get the colors
	global $_wp_admin_css_colors, $zbsadmincolors;
	$current_color = get_user_option( 'admin_color' );
	echo '<script type="text/javascript">var zbsJS_admcolours = ' . json_encode( $_wp_admin_css_colors[ $current_color ] ) . ';</script>';
	echo '<script type="text/javascript">var zbsJS_unpaid = "' . esc_html__( 'unpaid', 'zero-bs-crm' ) . '";</script>';
	$zbsadmincolors = $_wp_admin_css_colors[ $current_color ]->colors;
	?>
	<style>
		.ranges li{
			color: <?php echo esc_html( $zbsadmincolors[0] ); ?>;
		}
		.max_this{
			color: <?php echo esc_html( $zbsadmincolors[0] ); ?> !important;
		}
		.ranges li:hover, .ranges li.active {
			background: <?php echo esc_html( $zbsadmincolors[0] ); ?> !important;
			border: 1px solid <?php echo esc_html( $zbsadmincolors[0] ); ?> !important;
		}
		.daterangepicker td.active{
			background-color: <?php echo esc_html( $zbsadmincolors[0] ); ?> !important;
		}
		.zerobs_customer{
			background-color: <?php echo esc_html( $zbsadmincolors[0] ); ?> !important;
		}
		.users-php .zerobs_customer {
				background: none !important; 
			}
		.zerobs_transaction{
			background-color: <?php echo esc_html( $zbsadmincolors[2] ); ?> !important;
		}
		.zerobs_invoice{
			background-color: <?php echo esc_html( $zbsadmincolors[1] ); ?> !important;
		}
		.zerobs_quote{
			background-color: <?php echo esc_html( $zbsadmincolors[3] ); ?> !important;
		}
		.graph-box .view-me, .rev{
			color: <?php echo esc_html( $zbsadmincolors[0] ); ?> !important;
		}
		.toplevel_page_sales-dash .sales-graph-wrappers .area, .sales-dashboard_page_gross-revenue .sales-graph-wrappers .area, .sales-dashboard_page_net-revenue .sales-graph-wrappers .area, .sales-dashboard_page_discounts .sales-graph-wrappers .area, .sales-dashboard_page_fees .sales-graph-wrappers .area, .sales-dashboard_page_average-rev .sales-graph-wrappers .area, .sales-dashboard_page_new-customers .sales-graph-wrappers .area, .sales-dashboard_page_total-customers .sales-graph-wrappers .area{
			fill: <?php echo esc_html( $zbsadmincolors[0] ); ?> !important;
		}
		.bar{
			fill: <?php echo esc_html( $zbsadmincolors[0] ); ?> !important;
		}
	</style>
	<?php
}

/*
======================================================
	/ Color Grabber Admin Colour Schemes
	====================================================== */

/*
======================================================
	WP Override specifically
	====================================================== */

function zeroBSCRM_stopFrontEnd() {

	// } Harsh redir!
	global $zbs;

	if ( ! zeroBSCRM_isAPIRequest() && ! zeroBSCRM_isClientPortalPage() ) {

		if ( is_user_logged_in() ) {
			// } No need here :)
			header( 'Location: ' . admin_url( 'admin.php?page=' . $zbs->slugs['managecontacts'] ) );
			exit();

		} else {
			// } No need here :)
			header( 'Location: ' . wp_login_url() );
			exit();
		}
	}
}

function zeroBSCRM_catchDashboard() {

	// debug echo 'api:'.zeroBSCRM_isAPIRequest().' portal:'.zeroBSCRM_isClientPortalPage().'!'; exit();

		// } Only if not API / Client portal
	if ( ! zeroBSCRM_isAPIRequest() && ! zeroBSCRM_isClientPortalPage() ) {

		// } Admin side, zbs users

		// this is quick hack code and doesn't work!

		if ( is_admin() && zeroBSCRM_permsIsZBSUser() ) {

			// } Doesnt work:
			// require_once(ABSPATH . 'wp-admin/includes/screen.php');
			// $screen = get_current_screen();

			// } Does:
			global $pagenow,$zbs;

			if ( $pagenow == 'profile.php' || $pagenow == 'index.php' ) {// $screen->base == 'dashboard' ) {

				// } Customers quotes or invs?
				// this forwards non-wp users :) from dash/profile to their corresponding page
				if ( ! zeroBSCRM_permsWPEditPosts() ) {

						$sent = false;
					if ( zeroBSCRM_permsCustomers() ) {
						wp_redirect( jpcrm_esc_link( $zbs->slugs['managecontacts'] ) );
						$sent = 1;
					}
					if ( ! $sent && zeroBSCRM_permsQuotes() ) {
						wp_redirect( jpcrm_esc_link( $zbs->slugs['managequotes'] ) );
						$sent = 1;
					}
					if ( ! $sent && zeroBSCRM_permsInvoices() ) {
						wp_redirect( jpcrm_esc_link( $zbs->slugs['manageinvoices'] ) );
						$sent = 1;
					}
					if ( ! $sent && zeroBSCRM_permsTransactions() ) {
						wp_redirect( jpcrm_esc_link( $zbs->slugs['managetransactions'] ) );
						$sent = 1;
					}
					if ( ! $sent ) {

						// ?
						wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) );
					}
				}
			}
		}
	} // / if API request / portal
}

function zeroBSCRM_CustomisedLogin_Header() {

	$loginLogo = zeroBSCRM_getSetting( 'loginlogourl' );
	if ( ! empty( $loginLogo ) ) {
		?>
		<style type="text/css">

			.login h1 a {

				background-image: url( <?php echo esc_html( $loginLogo ); ?> );
				background-size: contain;
				width: auto;
				max-width: 90%;

			}

		</style>
		<?php
	}
}
add_action( 'login_head', 'zeroBSCRM_CustomisedLogin_Header' );

// changes wordpress.org to site.com :)
function zeroBSCRM_CustomisedLogin_logo_url() {

	return site_url();
}
add_filter( 'login_headerurl', 'zeroBSCRM_CustomisedLogin_logo_url' );

// changes the title :) (Powered by WordPress) to site title :)
function zeroBSCRM_CustomisedLogin_logo_url_title() {

	return get_bloginfo( 'name' );
}
add_filter( 'login_headertext', 'zeroBSCRM_CustomisedLogin_logo_url_title' );

##WLREMOVE
// add powered by Jetpack CRM to WP login footer if "override all" mode and public credits are enabled
function jpcrm_wplogin_footer() {

	global $zbs;
	$wptakeovermodeforall = $zbs->settings->get( 'wptakeovermodeforall' ) === 1 ? true : false;
	$showpoweredby_public = $zbs->settings->get( 'showpoweredby_public' ) === 1 ? true : false;

	if ( $wptakeovermodeforall && $showpoweredby_public ) {
		echo '<div style="text-align:center;margin-top:1em;font-size:12px"><a href="' . esc_url( $zbs->urls['home'] ) . '" title="' . esc_attr__( 'Powered by Jetpack CRM', 'zero-bs-crm' ) . '" target="_blank">' . esc_html__( 'Powered by Jetpack CRM', 'zero-bs-crm' ) . '</a></div>';
	}
}
add_action( 'login_footer', 'jpcrm_wplogin_footer' );
##/WLREMOVE

// } For (if shown mobile) - restrict things shown
add_action( 'admin_bar_menu', 'remove_wp_items', 100 );
function remove_wp_items( $wp_admin_bar ) {

	global $zbs;

	// } Retrieve setting
	$customheadertext = $zbs->settings->get( 'customheadertext' );

	// } Only for zbs custom user role users or all if flagged
	$takeoverModeAll = $zbs->settings->get( 'wptakeovermodeforall' );
	$takeoverModeZBS = $zbs->settings->get( 'wptakeovermode' );

	$takeoverMode = false;

	if ( $takeoverModeAll || ( zeroBSCRM_permsIsZBSUser() && $takeoverModeZBS ) ) {
		$takeoverMode = true;
	}

	if ( $takeoverMode ) {

		$wp_admin_bar->remove_menu( 'wp-logo' );
		$wp_admin_bar->remove_menu( 'site-name' );
		$wp_admin_bar->remove_menu( 'comments' );
		$wp_admin_bar->remove_menu( 'new-content' );
		$wp_admin_bar->remove_menu( 'my-account' );
		// $wp_admin_bar->remove_menu('top-secondary');

		if ( ! empty( $customheadertext ) ) {

			// https://codex.wordpress.org/Class_Reference/WP_Admin_Bar/add_menu
			// https://codex.wordpress.org/Function_Reference/add_node
			$wp_admin_bar->add_node(
				array(

					'id'    => 'zbshead',
					'title' => '<div class="wp-menu-image dashicons-before dashicons-groups" style="display: inline-block;margin-right: 6px;"><br></div>' . $customheadertext,
					'href'  => zeroBSCRM_getAdminURL( $zbs->slugs['dash'] ),
					'meta'  => array(
						// 'class' => 'wp-menu-image dashicons-before dashicons-groups'
					),

				)
			);

		}
	}
}

/*
======================================================
	/ WP Override specifically
	====================================================== */

/*
======================================================
	Thumbnails
	====================================================== */

// } Can you even do this via plugin?
function zeroBSCRM_addThemeThumbnails() {

	if ( function_exists( 'add_theme_support' ) ) {
		add_theme_support( 'post-thumbnails' );
	}
}

/*
======================================================
	/ Thumbnails
	====================================================== */
