<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.4+
 *
 * Copyright 2020 Automattic
 *
 * Date: 05/02/2017
 */

// block access to this file
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

/*
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!
!   THIS FILE IS FOR WordPress Menu related changes - later to be unified into one .Menu file
!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
*/

/*
When positioning menus, consider the following order:

* 1-9: important menu items (e.g. dashboard, contacts, quotes, invoices)
* 10-49: good for semi-important modules/extensions (e.g. WooSync)
* 50-89: less-important menu items (e.g. segments, forms, tasks)
* 90+: config/settings/administrative stuff (e.g. Settings, Extensions, Modules, Feedback)

*/

/*
======================================================
	v3 ZBS Menu Arr -> WP Admin Menu Associated Funcs
	====================================================== */

// This builds out our ZBS menu array()
// ... which ultimately forms the "default" zbs menu
// ... which the core then uses to inject what it needs to into wp admin menus :)
function zeroBSCRM_menu_buildMenu() {

	global $zbs;

	// Get the admin layout option 1 = Full, 2 = Slimline, 3 = CRM Only
	$crm_menu_mode = zeroBSCRM_getSetting( 'menulayout' );

	if ( ! isset( $crm_menu_mode ) || ! in_array( $crm_menu_mode, array( 1, 2, 3 ) ) ) {
		$crm_menu_mode = ZBS_MENU_SLIM; // Defaults to slimline
	}

	// Get other settings

	// b2b mode
	$is_b2b_mode = zeroBSCRM_getSetting( 'companylevelcustomers' ) == 1;

	// other feats
	$use_quotes       = zeroBSCRM_getSetting( 'feat_quotes' ) == 1;
	$use_invoices     = zeroBSCRM_getSetting( 'feat_invs' ) == 1;
	$use_transactions = zeroBSCRM_getSetting( 'feat_transactions' ) == 1;
	$use_forms        = zeroBSCRM_isExtensionInstalled( 'forms' ) == 1; // zeroBSCRM_getSetting('feat_forms');
	$use_calendar     = zeroBSCRM_getSetting( 'feat_calendar' ) == 1;

	// Menu Builder, in a POST CPT world

	/*
		array(
			'zbscrm' => array(
				'ico' => 'icon',
				'title' => 'title',
				'url' => 'url',
				'perms' => 'admin_zerobs_customers', (user capability)
				'order' => 99, // this is internal ordering (e.g. in zbs menus)
				'wpposition' => 99, // this is passed to wp
				'subitems' => array,
				'callback' => zeroBSCRM_pages_home
				'stylefuncs' => array
			),

			'hidden' => array(
				'subitems' => array() // THIS is all pages which need adding to WP but not adding to menus
			)

		)
	*/

	// this is the "first build" function, so begin with this :)
	$menu = array(
		'hidden' => array(
			'perms'    => 'zbs_dash',
			'subitems' => array(),
		),
	);

	// ===================================================
	// ======= Slimline Main Menu
	// ===================================================
	if ( $crm_menu_mode === ZBS_MENU_SLIM ) {

		// handle main menu position based on special cases
		if ( is_plugin_active( 'jetpack/jetpack.php' ) ) {
			// Check if it's in the context of WoA (Atomic infrastructure).
			if ( class_exists( '\Automattic\Jetpack\Status\Host' ) && ( new \Automattic\Jetpack\Status\Host() )->is_woa_site() ) {
				$menu_position = 52;
			} else {
				$menu_position = 4;
			}
		} else {
			$menu_position = 2;
		}

		// ZBS Slimline Main Menu (Top Level)
		$menu['jpcrm'] = array(
			'ico'        => 'dashicons-groups',
			'title'      => 'Jetpack CRM',
			'url'        => $zbs->slugs['dash'],
			'perms'      => 'zbs_dash',
			'order'      => 1,
			'wpposition' => $menu_position,
			'subitems'   => array(),
			'callback'   => 'zeroBSCRM_pages_dash',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_chartjs', 'zeroBSCRM_admin_styles_homedash' ),
		);

		/**
		 * Start slimline submenu items
		 */
		// Dash (sub)
		$menu['jpcrm']['subitems']['dashboard'] = array(
			'title'      => __( 'Dashboard', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['dash'],
			'perms'      => 'zbs_dash',
			'order'      => 1,
			'wpposition' => 1,
			'callback'   => 'zeroBSCRM_pages_dash',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_chartjs', 'zeroBSCRM_admin_styles_homedash' ),
		);

		// Contacts (sub)
		$menu['jpcrm']['subitems']['contacts'] = array(
			'title'      => __( 'Contacts', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['managecontacts'],
			'perms'      => 'admin_zerobs_view_customers',
			'order'      => 2,
			'wpposition' => 2,
			'callback'   => 'zeroBSCRM_render_customerslist_page',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
		);

		if ( $is_b2b_mode ) {
			// Companies (sub)
			$menu['jpcrm']['subitems']['companies'] = array(
				'title'      => jpcrm_label_company( true ),
				'url'        => $zbs->slugs['managecompanies'],
				'perms'      => 'admin_zerobs_view_customers',
				'order'      => 2.1,
				'wpposition' => 2.1,
				'callback'   => 'zeroBSCRM_render_companyslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);
		}

		if ( $use_quotes ) {

			// Quotes (sub)
			$menu['jpcrm']['subitems']['quotes'] = array(
				'title'      => __( 'Quotes', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['managequotes'],
				'perms'      => 'admin_zerobs_view_quotes',
				'order'      => 3,
				'wpposition' => 3,
				'callback'   => 'zeroBSCRM_render_quoteslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);

			// Templates (sub)
			$menu['jpcrm']['subitems']['quotetemplates'] = array(
				'title'      => __( 'Quote Templates', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['quote-templates'],
				'perms'      => 'admin_zerobs_quotes',
				'order'      => 3.1,
				'wpposition' => 3.1,
				'callback'   => 'zeroBSCRM_render_quotetemplateslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);

		}

		if ( $use_invoices ) {
			// Invoices (sub)
			$menu['jpcrm']['subitems']['invoices'] = array(
				'title'      => __( 'Invoices', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['manageinvoices'],
				'perms'      => 'admin_zerobs_view_invoices',
				'order'      => 4,
				'wpposition' => 4,
				'callback'   => 'zeroBSCRM_render_invoiceslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);
		}

		if ( $use_transactions ) {
			// Transactions (sub)
			$menu['jpcrm']['subitems']['transactions'] = array(
				'title'      => __( 'Transactions', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['managetransactions'],
				'perms'      => 'admin_zerobs_view_transactions',
				'order'      => 5,
				'wpposition' => 5,
				'callback'   => 'zeroBSCRM_render_transactionslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);
		}

		if ( $use_calendar ) {
			// Calendar (sub)
			$menu['jpcrm']['subitems']['calendar'] = array(
				'title'      => __( 'Task Scheduler', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['manage-events'],
				'perms'      => 'admin_zerobs_view_events',
				'order'      => 50,
				'wpposition' => 50,
				'callback'   => 'zeroBSCRM_render_eventscalendar_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_calendar_admin_styles' ),
			);
		}

		// Segments (sub)
		$menu['jpcrm']['subitems']['segments'] = array(
			'title'      => __( 'Segments', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['segments'],
			'perms'      => 'admin_zerobs_customers',
			'order'      => 51,
			'wpposition' => 51,
			'callback'   => 'zeroBSCRM_render_segmentslist_page',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
		);

		if ( $use_forms ) {
			// Forms (sub)
			$menu['jpcrm']['subitems']['forms'] = array(
				'title'      => __( 'Forms', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['manageformscrm'],
				'perms'      => 'admin_zerobs_forms',
				'order'      => 52,
				'wpposition' => 52,
				'callback'   => 'zeroBSCRM_render_formslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);
		}

		$menu['jpcrm']['subitems']['modules'] = array(
			'title'      => '<span>' . __( 'Core Modules', 'zero-bs-crm' ) . '</span>',
			'url'        => $zbs->slugs['modules'],
			'perms'      => 'admin_zerobs_customers',
			'order'      => 97,
			'wpposition' => 97,
			'callback'   => 'jpcrm_pages_modules',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_extension_admin_styles', 'zeroBSCRM_settingspage_admin_styles' ),
		);

		##WLREMOVE
		// Install Extensions (sub)
		if ( current_user_can( 'manage_options' ) ) {
			$menu['jpcrm']['subitems']['installext'] = array(
				'title'      => __( 'Extensions', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['extensions'],
				'perms'      => 'admin_zerobs_customers',
				'order'      => 98,
				'wpposition' => 98,
				'callback'   => 'zeroBSCRM_pages_extensions',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_extension_admin_styles', 'zeroBSCRM_settingspage_admin_styles' ),
			);
		}
		##/WLREMOVE

		// System Status (sub)
		$menu['jpcrm']['subitems']['systemstatus'] = array(
			'title'      => __( 'System Assistant', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['systemstatus'],
			'perms'      => 'admin_zerobs_manage_options',
			'order'      => 99,
			'wpposition' => 99,
			'callback'   => 'zeroBSCRM_pages_systemstatus',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'jpcrm_admin_scripts_systems_page' ),
		);

		// Settings (sub)
		$menu['jpcrm']['subitems']['settings'] = array(
			'title'      => __( 'CRM Settings', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['settings'],
			'perms'      => 'admin_zerobs_manage_options',
			'order'      => 100,
			'wpposition' => 100,
			'callback'   => 'zeroBSCRM_pages_settings',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_settingspage_admin_styles' ),
		);

		##WLREMOVE

		// Feedback (sub)
		$menu['jpcrm']['subitems']['crmresources'] = array(
			'title'      => '<span style="color: #64ca43;">' . __( 'Resources', 'zero-bs-crm' ) . '</span>',
			'url'        => $zbs->slugs['crmresources'],
			'perms'      => 'admin_zerobs_manage_options',
			'order'      => 101,
			'wpposition' => 101,
			'callback'   => 'zeroBSCRM_pages_crmresources',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'jpcrm_crm_resources_page_styles_scripts' ),
		);

		##/WLREMOVE

	}
	/**
	 * End slimline submenu items
	 */

	// ===================================================
	// ======= / Slimline Main Menu
	// ===================================================

	// ===================================================
	// ======= Non-slimline menus
	// ===================================================
	else { // $crm_menu_mode !== ZBS_MENU_SLIM

		// Jetpack CRM (Top Level)
		$menu['jpcrm'] = array(
			'ico'        => 'dashicons-groups',
			'title'      => __( 'Jetpack CRM', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['dash'],
			'perms'      => 'zbs_dash',
			'order'      => 1,
			'wpposition' => 2,
			'subitems'   => array(),
			'callback'   => 'zeroBSCRM_pages_dash',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_chartjs', 'zeroBSCRM_admin_styles_homedash' ),
		);

		/**
		 * Start Jetpack CRM submenu items
		*/
		// Dash (sub)
		$menu['jpcrm']['subitems']['dashboard'] = array(
			'title'      => __( 'Dashboard', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['dash'],
			'perms'      => 'zbs_dash',
			'order'      => 1,
			'wpposition' => 1,
			'callback'   => 'zeroBSCRM_pages_dash',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_chartjs', 'zeroBSCRM_admin_styles_homedash' ),
		);

		// Core modules (sub)
		$menu['jpcrm']['subitems']['modules'] = array(
			'title'      => '<span>' . __( 'Core Modules', 'zero-bs-crm' ) . '</span>',
			'url'        => $zbs->slugs['modules'],
			'perms'      => 'admin_zerobs_customers',
			'order'      => 97,
			'wpposition' => 97,
			'callback'   => 'jpcrm_pages_modules',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_extension_admin_styles', 'zeroBSCRM_settingspage_admin_styles' ),
		);

		##WLREMOVE
		// Extensions (sub)
		if ( current_user_can( 'manage_options' ) ) {
			$menu['jpcrm']['subitems']['installext'] = array(
				'title'      => __( 'Extensions', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['extensions'],
				'perms'      => 'admin_zerobs_customers',
				'order'      => 98,
				'wpposition' => 98,
				'callback'   => 'zeroBSCRM_pages_extensions',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_extension_admin_styles', 'zeroBSCRM_settingspage_admin_styles' ),
			);
		}
		##/WLREMOVE

		// System Status (sub)
		$menu['jpcrm']['subitems']['systemstatus'] = array(
			'title'      => __( 'System Assistant', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['systemstatus'],
			'perms'      => 'admin_zerobs_manage_options',
			'order'      => 99,
			'wpposition' => 99,
			'callback'   => 'zeroBSCRM_pages_systemstatus',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'jpcrm_admin_scripts_systems_page' ),
		);

		// Settings (sub)
		$menu['jpcrm']['subitems']['settings'] = array(
			'title'      => __( 'CRM Settings', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['settings'],
			'perms'      => 'admin_zerobs_manage_options',
			'order'      => 100,
			'wpposition' => 100,
			'callback'   => 'zeroBSCRM_pages_settings',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_settingspage_admin_styles' ),
		);

		// Feedback (sub)
		$menu['jpcrm']['subitems']['feedback'] = array(
			'title'      => '<span style="color: #64ca43;">' . __( 'Resources', 'zero-bs-crm' ) . '</span>',
			'url'        => $zbs->slugs['crmresources'],
			'perms'      => 'admin_zerobs_manage_options',
			'order'      => 101,
			'wpposition' => 101,
			'callback'   => 'zeroBSCRM_pages_crmresources',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'jpcrm_crm_resources_page_styles_scripts' ),
		);
		/**
		 * End Jetpack CRM submenu items
		 */

		// Contacts (Top Level)
		$menu['contacts'] = array(
			'ico'        => 'dashicons-admin-users',
			'title'      => __( 'Contacts', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['managecontacts'],
			'perms'      => 'admin_zerobs_view_customers',
			'order'      => 25,
			'wpposition' => 25,
			'subitems'   => array(),
			'callback'   => 'zeroBSCRM_render_customerslist_page',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
		);

		/**
		 * Start contact submenu items
		 */
		// Tags (sub)
		$menu['contacts']['subitems']['tags'] = array(
			'title'      => __( 'Contact Tags', 'zero-bs-crm' ),
			'url'        => 'admin.php?page=' . $zbs->slugs['tagmanager'] . '&tagtype=contact',
			'perms'      => 'admin_zerobs_customers',
			'order'      => 1,
			'wpposition' => 1,
			'callback'   => '', // not used...this is just a 'link'
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
		);

		// Segments (sub)
		$menu['contacts']['subitems']['segments'] = array(
			'title'      => __( 'Segments', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['segments'],
			'perms'      => 'admin_zerobs_customers',
			'order'      => 2,
			'wpposition' => 2,
			'callback'   => 'zeroBSCRM_render_segmentslist_page',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
		);

		// Export Tools (sub)
		$menu['contacts']['subitems']['export'] = array(
			'title'      => __( 'Export', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['export-tools'],
			'perms'      => 'admin_zerobs_customers',
			'order'      => 3,
			'wpposition' => 3,
			'callback'   => 'zeroBSCRM_page_exportRecords',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_exportTools' ),
		);

		// Add New (sub)
		$menu['contacts']['subitems']['addnew'] = array(
			'title'      => __( 'Add New Contact', 'zero-bs-crm' ),
			'url'        => 'admin.php?page=' . $zbs->slugs['addedit'] . '&action=edit&zbstype=contact',
			'perms'      => 'admin_zerobs_customers',
			'order'      => 99,
			'wpposition' => 99,
			'callback'   => '', // not used...this is just a 'link'
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
		);

		/**
		 * End contact submenu items
		 */

		if ( $is_b2b_mode ) {

			// Companies (Top Level)
			$menu['companies'] = array(
				'ico'        => 'dashicons-store',
				'title'      => jpcrm_label_company( true ),
				'url'        => $zbs->slugs['managecompanies'],
				'perms'      => 'admin_zerobs_view_customers',
				'order'      => 26,
				'wpposition' => 26,
				'subitems'   => array(),
				'callback'   => 'zeroBSCRM_render_companyslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);

			/**
			 * Start company submenu items
			 */
			// Tags (sub)
			$menu['companies']['subitems']['tags'] = array(
				'title'      => jpcrm_label_company() . ' ' . __( 'Tags', 'zero-bs-crm' ),
				'url'        => 'admin.php?page=' . $zbs->slugs['tagmanager'] . '&tagtype=company',
				'perms'      => 'admin_zerobs_customers',
				'order'      => 1,
				'wpposition' => 1,
				'callback'   => '',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
			);

			// Add New (sub)
			$menu['companies']['subitems']['addnew'] = array(
				'title'      => __( 'Add New', 'zero-bs-crm' ) . ' ' . jpcrm_label_company(),
				'url'        => 'admin.php?page=' . $zbs->slugs['addedit'] . '&action=edit&zbstype=company',
				'perms'      => 'admin_zerobs_customers',
				'order'      => 99,
				'wpposition' => 99,
				'callback'   => '', // not used? this is just a 'link'?
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
			);

			/**
			 * End company submenu items
			 */

		}

		if ( $use_quotes ) {

			// Quotes (Top Level)
			$menu['quotes'] = array(
				'ico'        => 'dashicons-clipboard',
				'title'      => __( 'Quotes', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['managequotes'],
				'perms'      => 'admin_zerobs_view_quotes',
				'order'      => 27,
				'wpposition' => 27,
				'subitems'   => array(),
				'callback'   => 'zeroBSCRM_render_quoteslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);

			/**
			 * Start quotes submenu items
			 */
			// Tags (sub)
			$menu['quotes']['subitems']['tags'] = array(
				'title'      => __( 'Quote Tags', 'zero-bs-crm' ),
				'url'        => 'admin.php?page=' . $zbs->slugs['tagmanager'] . '&tagtype=quote',
				'perms'      => 'admin_zerobs_quotes',
				'order'      => 1,
				'wpposition' => 1,
				'callback'   => '',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
			);

			// Templates (sub)
			$menu['quotes']['subitems']['templates'] = array(
				'title'      => __( 'Quote Templates', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['quote-templates'],
				'perms'      => 'admin_zerobs_quotes',
				'order'      => 2,
				'wpposition' => 2,
				'callback'   => 'zeroBSCRM_render_quotetemplateslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);

			// Add New (sub)
			$menu['quotes']['subitems']['addnew'] = array(
				'title'      => __( 'Add New Quote', 'zero-bs-crm' ),
				'url'        => 'admin.php?page=' . $zbs->slugs['addedit'] . '&action=edit&zbstype=quote',
				'perms'      => 'admin_zerobs_quotes',
				'order'      => 99,
				'wpposition' => 99,
				'callback'   => '', // not used? this is just a 'link'?
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
			);
			/**
			 * End quotes submenu items
			 */

		}

		if ( $use_invoices ) {

			// Invoices (Top Level)
			$menu['invoices'] = array(
				'ico'        => 'dashicons-media-text',
				'title'      => __( 'Invoices', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['manageinvoices'],
				'perms'      => 'admin_zerobs_view_invoices',
				'order'      => 28,
				'wpposition' => 28,
				'subitems'   => array(),
				'callback'   => 'zeroBSCRM_render_invoiceslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ), // zeroBSCRM_scriptStyles_admin_invoiceBuilder
			);

			/**
			 * Start invoices submenu items
			 */
			// Tags (sub)
			$menu['invoices']['subitems']['tags'] = array(
				'title'      => __( 'Invoice Tags', 'zero-bs-crm' ),
				'url'        => 'admin.php?page=' . $zbs->slugs['tagmanager'] . '&tagtype=invoice',
				'perms'      => 'admin_zerobs_view_invoices',
				'order'      => 1,
				'wpposition' => 1,
				'callback'   => '',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
			);

			// Add New (sub)
			$menu['invoices']['subitems']['addnew'] = array(
				'title'      => __( 'Add New Invoice', 'zero-bs-crm' ),
				'url'        => 'admin.php?page=' . $zbs->slugs['addedit'] . '&action=edit&zbstype=invoice',
				'perms'      => 'admin_zerobs_view_invoices',
				'order'      => 99,
				'wpposition' => 99,
				'callback'   => '', // not used? this is just a 'link'?
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_scriptStyles_admin_invoiceBuilder' ),
			);

			/**
			 * End invoices submenu items
			 */

		}

		if ( $use_transactions ) {

			// Transactions (Top Level)
			$menu['transactions'] = array(
				'ico'        => 'dashicons-cart',
				'title'      => __( 'Transactions', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['managetransactions'],
				'perms'      => 'admin_zerobs_view_transactions',
				'order'      => 29,
				'wpposition' => 29,
				'subitems'   => array(),
				'callback'   => 'zeroBSCRM_render_transactionslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);

			/**
			 * Start transactions submenu items
			 */
			// Tags (sub)
			$menu['transactions']['subitems']['tags'] = array(
				'title'      => __( 'Transaction Tags', 'zero-bs-crm' ),
				'url'        => 'admin.php?page=' . $zbs->slugs['tagmanager'] . '&tagtype=transaction',
				'perms'      => 'admin_zerobs_view_transactions',
				'order'      => 1,
				'wpposition' => 1,
				'callback'   => '',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
			);

			// Add New (sub)
			$menu['transactions']['subitems']['addnew'] = array(
				'title'      => __( 'Add New Transaction', 'zero-bs-crm' ),
				'url'        => 'admin.php?page=' . $zbs->slugs['addedit'] . '&action=edit&zbstype=transaction',
				'perms'      => 'admin_zerobs_view_transactions',
				'order'      => 99,
				'wpposition' => 99,
				'callback'   => '', // not used? this is just a 'link'?
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
			);

			/**
			 * End transactions submenu items
			 */

		}

		if ( $use_calendar ) {

			// Task Scheduler (Top Level)
			$menu['calendar'] = array(
				'ico'        => 'dashicons-calendar-alt',
				'title'      => __( 'Task Scheduler', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['manage-events'],
				'perms'      => 'admin_zerobs_events',
				'order'      => 50,
				'wpposition' => 50,
				'subitems'   => array(),
				'callback'   => 'zeroBSCRM_render_eventscalendar_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_calendar_admin_styles' ),
			);

			/**
			 * Start tasks submenu items
			 */
			// Listview (sub)
			$menu['calendar']['subitems']['list'] = array(
				'title'      => __( 'Task List', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['manage-events-list'],
				'perms'      => 'admin_zerobs_customers',
				'order'      => 1,
				'wpposition' => 1,
				'callback'   => 'zeroBSCRM_render_eventslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);

			// Tags (sub)
			$menu['calendar']['subitems']['tags'] = array(
				'title'      => __( 'Task Tags', 'zero-bs-crm' ),
				'url'        => 'admin.php?page=' . $zbs->slugs['tagmanager'] . '&tagtype=event',
				'perms'      => 'admin_zerobs_customers',
				'order'      => 2,
				'wpposition' => 2,
				'callback'   => '',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
			);

			// Add New (sub)
			$menu['calendar']['subitems']['addnew'] = array(
				'title'      => __( 'Add New Task', 'zero-bs-crm' ),
				'url'        => 'admin.php?page=' . $zbs->slugs['addedit'] . '&action=edit&zbstype=event',
				'perms'      => 'admin_zerobs_events',
				'order'      => 99,
				'wpposition' => 99,
				'callback'   => '', // not used? this is just a 'link'?
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_calendar_admin_styles' ),
			);

			/**
			 * End tasks submenu items
			 */
		}

		if ( $use_forms ) {

			// Forms (Top Level)
			$menu['forms'] = array(
				'ico'        => 'dashicons-welcome-widgets-menus',
				'title'      => __( 'Forms', 'zero-bs-crm' ),
				'url'        => $zbs->slugs['manageformscrm'],
				'perms'      => 'admin_zerobs_forms',
				'order'      => 51,
				'wpposition' => 51,
				'subitems'   => array(),
				'callback'   => 'zeroBSCRM_render_formslist_page',
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
			);

			// Add New (sub)
			$menu['forms']['subitems']['addnew'] = array(
				'title'      => __( 'Add New Form', 'zero-bs-crm' ),
				'url'        => 'admin.php?page=' . $zbs->slugs['addedit'] . '&action=edit&zbstype=form',
				'perms'      => 'admin_zerobs_forms',
				'order'      => 99,
				'wpposition' => 99,
				'callback'   => '', // not used? this is just a 'link'?
				'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_scriptStyles_admin_formBuilder' ),
			);

		}
	}

	// ===================================================
	// ======= / Non-slimline menus
	// ===================================================

	// ===================================================
	// ======= Hidden
	// ===================================================

	// Welcome to CRM (sub)
	$menu['hidden']['subitems']['welcome'] = array(
		'title'      => __( 'Welcome', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['home'],
		'perms'      => 'admin_zerobs_manage_options',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_home',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_intro_admin_styles' ),
	);

	// Data Tools (sub)
	$menu['hidden']['subitems']['datatools'] = array(
		'title'      => __( 'Data Tools', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['datatools'],
		'perms'      => 'admin_zerobs_manage_options',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_datatools',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// Add/Edit (hidden)
	$menu['hidden']['subitems']['addedit'] = array(
		'title'      => __( 'Add New', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['addedit'],
		'perms'      => 'admin_zerobs_customers',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_admin_addedit',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_editview', 'zeroBSCRM_load_libs_js_momentdatepicker' ),
	);

	// File Edit (hidden)
	$menu['hidden']['subitems']['fileedit']   = array(
		'title'      => __( 'Edit File', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['editfile'],
		'perms'      => 'admin_zerobs_customers',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_add_or_edit_file',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);
	$menu['hidden']['subitems']['fileaddnew'] = array(
		'title'      => __( 'New File', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['addnewfile'],
		'perms'      => 'admin_zerobs_customers',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_add_or_edit_file',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// Tag Manager (hidden)
	$menu['hidden']['subitems']['tagmanager'] = array(
		'title'      => __( 'Tags', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['tagmanager'],
		'perms'      => 'admin_zerobs_customers',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_admin_tags',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_editview' ),
	);

	// Export Tools (hidden)
	$menu['hidden']['subitems']['exporttools'] = array(
		'title'      => __( 'Export Tools', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['export-tools'],
		'perms'      => 'admin_zerobs_manage_options',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_page_exportRecords',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_exportTools' ),
	);

	// Notifications (hidden)
	$menu['hidden']['subitems']['notifications'] = array(
		'title'      => __( 'Notifications', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['notifications'],
		'perms'      => 'admin_zerobs_notifications',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_admin_notifications',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// Team (hidden)
	$menu['hidden']['subitems']['team'] = array(
		'title'      => __( 'Team', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['team'],
		'perms'      => 'manage_options',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_admin_team',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// Send Email (hidden)
	$menu['hidden']['subitems']['sendemail'] = array(
		'title'      => __( 'Send Email', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['sendmail'],
		'perms'      => 'admin_zerobs_customers',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_emailsend',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_email_styles' ),
	);

	// Emails (hidden)
	$menu['hidden']['subitems']['emails'] = array(
		'title'      => __( 'Emails', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['emails'],
		'perms'      => 'admin_zerobs_sendemails_contacts',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_emailbox',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_email_styles' ),
	);

	// Email Templates (hidden)
	$menu['hidden']['subitems']['emailtemplates'] = array(
		'title'      => __( 'Email Templates', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['email-templates'],
		'perms'      => 'admin_zerobs_manage_options',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_admin_system_emails',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// Deactivation Error (hidden)
	$menu['hidden']['subitems']['deactivationerr'] = array(
		'title'      => __( 'Deactivation error', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['extensions-active'],
		'perms'      => 'admin_zerobs_manage_options',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_admin_deactivate_error',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// Your Profile (hidden)
	$menu['hidden']['subitems']['yourprofile'] = array(
		'title'      => __( 'Your Profile', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['your-profile'],
		'perms'      => 'admin_zerobs_customers',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_admin_your_profile',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// Reminders (hidden)
	$menu['hidden']['subitems']['reminders'] = array(
		'title'      => __( 'Reminders', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['reminders'],
		'perms'      => 'admin_zerobs_customers',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_admin_reminders',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// Trashed (hidden)
	$menu['hidden']['subitems']['trashed'] = array(
		'title'      => __( 'Trashed', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['zbs-deletion'],
		'perms'      => 'admin_zerobs_customers',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_postdelete',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// No Permissions (hidden)
	$menu['hidden']['subitems']['norights'] = array(
		'title'      => __( 'No Permission', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['zbs-noaccess'],
		'perms'      => 'admin_zerobs_customers',
		'order'      => 1,
		'wpposition' => 1,
		'callback'   => 'zeroBSCRM_pages_norights',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// Events - Listview (sub)
	$menu['hidden']['subitems']['eventlist'] = array(
		'title'      => __( 'Task List', 'zero-bs-crm' ),
		'url'        => $zbs->slugs['manage-events-list'],
		'perms'      => 'admin_zerobs_customers',
		'order'      => 1,
		'wpposition' => 3,
		'callback'   => 'zeroBSCRM_render_eventslist_page',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'zeroBSCRM_admin_styles_ui2_listview' ),
	);

	// Events - Tags (sub)
	$menu['hidden']['subitems']['eventtags'] = array(
		'title'      => __( 'Task Tags', 'zero-bs-crm' ),
		'url'        => 'admin.php?page=' . $zbs->slugs['tagmanager'] . '&tagtype=event',
		'perms'      => 'admin_zerobs_customers',
		'order'      => 3,
		'wpposition' => 3,
		'callback'   => '',
		'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
	);

	// ===================================================
	// ======= / Hidden
	// ===================================================

	return $menu;
}

// takes ZBS formatted menu items + adds via wp menu system.
function zeroBSCRM_menu_applyWPMenu( $menu = array() ) {
	// takeover mode, if active
	$menu = zeroBSCRM_menu_applyTakeover( $menu );

	// cycle through menu + submenus + add to wp
	if ( is_array( $menu ) ) {
		foreach ( $menu as $menuItemKey => $menuItem ) {
			// pump em through
			zeroBSCRM_menu_add_toplevel( $menuItemKey, $menuItem );
		}
	}
}

// Takeover mode
// v3.0 +
// identify if takeover mode on, if so, murder the wp menus other than zbs (this setting needs a WARNING!)
function zeroBSCRM_menu_applyTakeover( $menu = false ) {

	global $zbs;

	// Get the admin layout option 1 = Full, 2 = Slimline, 3 = CRM Only
	$crm_menu_mode = zeroBSCRM_getSetting( 'menulayout' );
	if ( ! isset( $crm_menu_mode ) || ! in_array( $crm_menu_mode, array( 1, 2, 3 ) ) ) {
		$crm_menu_mode = 2; // Defaults to slimline
	}

	// Only for zbs custom user role users or all if flagged
	$takeoverModeAll = $zbs->settings->get( 'wptakeovermodeforall' );
	$takeoverModeZBS = $zbs->settings->get( 'wptakeovermode' );
	$takeoverMode    = false;

	if ( $takeoverModeAll || ( zeroBSCRM_permsIsZBSUser() && $takeoverModeZBS ) ) {
		$takeoverMode = true;
	}

	// Menu mode specific overrides
	if ( $crm_menu_mode == ZBS_MENU_CRMONLY ) {
		$takeoverModeAll = true;
		$takeoverModeZBS = true;
		$takeoverMode    = true;
	}

	if ( $takeoverMode ) {

		// if (isset($settings['wptakeovermode']) && $settings['wptakeovermode'] == 1 && zeroBSCRM_permsIsZBSUser()) {
		// https://codex.wordpress.org/Function_Reference/remove_menu_page
		remove_menu_page( 'index.php' );                       // Dashboard
		remove_menu_page( 'edit-tags.php?taxonomy=category' ); // They appear to have for posts...

		// They wont have perms for all these anyhow :)
		/*
		remove_menu_page( 'edit.php' );                   // Posts
		remove_menu_page( 'upload.php' );                 // Media
		remove_menu_page( 'edit.php?post_type=page' );    // Pages
		remove_menu_page( 'edit-comments.php' );          // Comments
		remove_menu_page( 'themes.php' );                 // Appearance
		remove_menu_page( 'plugins.php' );                // Plugins
		remove_menu_page( 'users.php' );                  // Users
		remove_menu_page( 'tools.php' );                  // Tools
		remove_menu_page( 'options-general.php' );        // Settings
		*/

		if ( $takeoverModeAll ) {

			remove_menu_page( 'edit-tags.php?taxonomy=category' ); // They appear to have for posts weirdly
			remove_menu_page( 'index.php' );                  // Dashboard
			remove_menu_page( 'edit.php' );                   // Posts
			remove_menu_page( 'upload.php' );                 // Media
			remove_menu_page( 'edit.php?post_type=page' );    // Pages
			remove_menu_page( 'edit-comments.php' );          // Comments
			remove_menu_page( 'themes.php' );                 // Appearance
			remove_menu_page( 'plugins.php' );                // Plugins
			remove_menu_page( 'users.php' );                  // Users
			remove_menu_page( 'tools.php' );                  // Tools
			remove_menu_page( 'options-general.php' );        // Settings

		}

		// Remove profile :) http://stackoverflow.com/questions/4524612/remove-profile-admin-menu-from-administrative-panel
		remove_menu_page( 'profile.php' );

		// Logout :)
		// $adminMenuLogout = add_menu_page( __('Log Out',"zero-bs-crm"), __('Log Out',"zero-bs-crm"), 'read', $zbs->slugs['logout'], 'zeroBSCRM_pages_logout', 'dashicons-unlock',100);
		// add_action( "admin_print_styles-{$adminMenuLogout}", 'zeroBSCRM_global_admin_styles' );

		// Add logout (Top Level)
		$menu['logout'] = array(
			'ico'        => 'dashicons-unlock',
			'title'      => __( 'Log Out', 'zero-bs-crm' ),
			'url'        => $zbs->slugs['logout'],
			'perms'      => 'read',
			'order'      => 999,
			'wpposition' => 999,
			'subitems'   => array(),
			'callback'   => 'zeroBSCRM_pages_logout',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles' ),
		);

	}

	return $menu;
}

// Works through each menu item + subitem and validates current user has perms to see it
function zeroBSCRM_menu_securityGuard( $menu = array() ) {

	// WORTH NOTING:
	// 'hidden' array checks for zbs_dash permissions. So all hidden wp pages are not going to work
	// ... for users who can't 'zbs_dash'

	$nMenu    = array();
	$userCaps = zeroBSCRM_getCurrentUserCaps();

	if ( is_array( $menu ) ) {

		foreach ( $menu as $topMenuKey => $topMenu ) {

			// got perms?
			if ( isset( $topMenu['perms'] ) && ! empty( $topMenu['perms'] ) ) {

				// user has perm for this top level menu?
				if ( in_array( $topMenu['perms'], $userCaps ) ) {

					// user has permissions, lets add, but check each sub item too
					$toAdd             = $topMenu;
					$toAdd['subitems'] = array();

					// check sub items
					if ( is_array( $topMenu['subitems'] ) ) {

						foreach ( $topMenu['subitems'] as $subMenuKey => $subMenu ) {

							// got perms?
							if ( isset( $subMenu['perms'] ) && ! empty( $subMenu['perms'] ) ) {

								// user has perm for this sub level menu?
								if ( in_array( $subMenu['perms'], $userCaps ) ) {

									// user has permissions, add to top menu subitems arr
									$toAdd['subitems'][ $subMenuKey ] = $subMenu;

								}
							}
						}
					} // / check sub items

					// add
					$nMenu[ $topMenuKey ] = $toAdd;

				} // / user has cap for top menu

			} // / top menu has perms attr

		}
	} // / top level menu item

	return $nMenu;
}

// Order menu items + subitems based on 'order'
function zeroBSCRM_menu_order( $menu = array() ) {

	$nMenu = array();

	// first sort subitems
	if ( is_array( $menu ) ) {

		foreach ( $menu as $topMenuKey => $topMenu ) {

			// user has permissions, lets add, but check each sub item too
			$toAdd = $topMenu;

			// got subitems?
			if ( isset( $topMenu['subitems'] ) && ! empty( $topMenu['subitems'] ) ) {

				// sort subitems
				uasort( $toAdd['subitems'], 'zeroBSCRM_menu_order_sort' );

			} // / top menu has subitems attr

			// add
			$nMenu[ $topMenuKey ] = $toAdd;

		}
	} // / top level menu item (sort subitems)

	// Now sort toplevel:
	uasort( $nMenu, 'zeroBSCRM_menu_order_sort' );

	// return ordered menu
	return $nMenu;
}

// Sort Func for: Order menu items + subitems based on 'order'
function zeroBSCRM_menu_order_sort( $a, $b ) {
	// catch
	if ( ! is_array( $a ) || ! is_array( $b ) ) {
		return 0;
	}
	if ( ! isset( $a['order'] ) || ! isset( $b['order'] ) ) {
		return 0;
	}
	if ( $a['order'] == $b['order'] ) {
		return 0;
	}
	return ( $a['order'] < $b['order'] ) ? -1 : 1;
}

// adds a toplevel menu item, and its subitems to wp menus:
function zeroBSCRM_menu_add_toplevel( $menuItemKey = '', $menuItem = -1 ) {
	if ( is_array( $menuItem ) ) {

		// echo 'adding '.$menuItemKey.' ('.count($menuItem['subitems']).')<br>';

		// here's a catch, this catches all "hidden" (null) submenu items,
		// a hack which lets us add wp pages which are not menu-listed.
		if ( $menuItemKey == 'hidden' ) {

			// Hidden subitems only in this one.

			// Any (hidden) subpages to add?
			if ( isset( $menuItem['subitems'] ) && is_array( $menuItem['subitems'] ) ) {
				foreach ( $menuItem['subitems'] as $subMenuKey => $subMenuItem ) {

					// Add the item
					// ...passing false for toplevel item, which sets these to hidden
					zeroBSCRM_menu_add_sublevel( false, $subMenuKey, $subMenuItem );

				} // / foreach subitem

			} // / if subitems

		} else {

			// NORMAL menu item + subitems

			// WP Menu add (traditional way)
			// ... this 'doubles' up on perms + ordering
			// https://developer.wordpress.org/reference/functions/add_menu_page/
			$adminPage = add_menu_page(
				$menuItem['title'], // 'Jetpack CRM ' . __( 'Plugin', 'zero-bs-crm' ),
				$menuItem['title'], // $adminMenuTitle,
				$menuItem['perms'], // 'admin_zerobs_manage_options',
				$menuItem['url'], // $zbs->slugs['home'],
				$menuItem['callback'], // 'zeroBSCRM_pages_home'
				( isset( $menuItem['ico'] ) ? $menuItem['ico'] : '' ),
				( isset( $menuItem['wpposition'] ) ? $menuItem['wpposition'] : null )
			);

			// any style callbacks to enqueue?
			if ( isset( $menuItem['stylefuncs'] ) && is_array( $menuItem['stylefuncs'] ) ) {
				foreach ( $menuItem['stylefuncs'] as $styleFunc ) {
					add_action( "admin_print_styles-{$adminPage}", $styleFunc );
				}
			}

			// Any subpages to add?
			if ( isset( $menuItem['subitems'] ) && is_array( $menuItem['subitems'] ) ) {
				foreach ( $menuItem['subitems'] as $subMenuKey => $subMenuItem ) {

					// Add the item
					// this is split into subfunc as we also use it for null menus :)
					zeroBSCRM_menu_add_sublevel( $menuItem, $subMenuKey, $subMenuItem );

				} // / foreach subitem

			} // / if subitems

		} // / NORMAL MENU

	} // if menuitem is array
}

// adds a sublevel menu item:
// to add a "HIDDEN" secret menu, pass $menuItem = false, and rest correct
function zeroBSCRM_menu_add_sublevel( $menuItem = -1, $subMenuKey = -1, $subMenuItem = -1 ) {
	if ( is_array( $subMenuItem ) ) {

		// https://developer.wordpress.org/reference/functions/add_submenu_page/
		$adminSubPage = add_submenu_page(
			( is_array( $menuItem ) && isset( $menuItem['url'] ) ) ? $menuItem['url'] : null, // parent slug
			$subMenuItem['title'], // __( 'Tags', 'zero-bs-crm' ),
			$subMenuItem['title'], // __( 'Tags', 'zero-bs-crm' ),
			$subMenuItem['perms'], // 'admin_zerobs_customers',
			$subMenuItem['url'], // $zbs->slugs['tagmanager'],
			$subMenuItem['callback'] // 'zeroBSCRM_pages_admin_tags'
		);

		// any style callbacks to enqueue?
		if ( isset( $subMenuItem['stylefuncs'] ) && is_array( $subMenuItem['stylefuncs'] ) ) {
			foreach ( $subMenuItem['stylefuncs'] as $subStyleFunc ) {
				add_action( "admin_print_styles-{$adminSubPage}", $subStyleFunc );
			}
		}
	}
}

// rather than using remove_Submenu_page
// https://codex.wordpress.org/Function_Reference/remove_submenu_page
// this just kills it out of the $submenu global (so page will still load if accessed directly)
// zeroBSCRM_menus_removeWPSubMenu($zbs->slugs['datatools'],'zerobscrm-csvimporterlite-app');
function zeroBSCRM_menus_removeWPSubMenu( $slug = '', $subpage = '' ) {

	// Global
	global $submenu;

	// Use this to debug:   print_r($submenu); exit();
	if ( isset( $submenu[ $slug ] ) && is_array( $submenu[ $slug ] ) ) {

		$newArr = array();
		foreach ( $submenu[ $slug ] as $ind => $page ) {
			if ( $page[2] != $subpage ) {
				$newArr[] = $page;
			}
		}
		$submenu[ $slug ] = $newArr;

	}
}
