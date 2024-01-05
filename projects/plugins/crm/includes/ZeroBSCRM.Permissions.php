<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
 */

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

/**
 * Remove user roles
 */
function zeroBSCRM_clearUserRoles() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
	remove_role( 'zerobs_admin' );
	remove_role( 'zerobs_customermgr' );
	remove_role( 'zerobs_quotemgr' );
	remove_role( 'zerobs_invoicemgr' );
	remove_role( 'zerobs_transactionmgr' );
	remove_role( 'zerobs_customer' );
	remove_role( 'zerobs_mailmgr' );
}

/**
 * Build User Roles
 */
function zeroBSCRM_addUserRoles() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	// Jetpack CRM Admin
	add_role(
		'zerobs_admin',
		__( 'Jetpack CRM Admin (Full CRM Permissions)', 'zero-bs-crm' ),
		array(
			'read'              => true,  // true allows this capability
			'edit_posts'        => false, // Allows user to edit their own posts
			'edit_pages'        => false, // Allows user to edit pages
			'edit_others_posts' => false, // Allows user to edit others posts not just their own
			'create_posts'      => false, // Allows user to create new posts
			'manage_categories' => false, // Allows user to manage post categories
			'publish_posts'     => false, // Allows the user to publish, otherwise posts stays in draft mode
		)
	);

	// gets the role from WP
	$role = get_role( 'zerobs_admin' );

	$role->add_cap( 'read' );
	$role->remove_cap( 'edit_posts' );
	$role->add_cap( 'upload_files' ); // added 21/5/18 to ensure can upload media
	$role->add_cap( 'admin_zerobs_usr' ); #} For all zerobs users :)
	// NOTE. Adding this adds a random "Post categories / not posts" to menu
	// will have to remove programattically :(
	$role->add_cap( 'manage_categories' );
	$role->add_cap( 'manage_sales_dash' ); #mike added
	$role->add_cap( 'admin_zerobs_mailcampaigns' );
	$role->add_cap( 'zbs_dash' ); # WH added 1.2 - has rights to view ZBS Dash

	// give permission to edit settings
	$role->add_cap( 'admin_zerobs_manage_options' );

	// CRM object view capabilities
	$role->add_cap( 'admin_zerobs_view_customers' );
	$role->add_cap( 'admin_zerobs_view_quotes' );
	$role->add_cap( 'admin_zerobs_view_invoices' );
	$role->add_cap( 'admin_zerobs_view_events' );
	$role->add_cap( 'admin_zerobs_view_transactions' );

	// CRM object edit capabilities
	$role->add_cap( 'admin_zerobs_customers' );
	$role->add_cap( 'admin_zerobs_customers_tags' );
	$role->add_cap( 'admin_zerobs_quotes' );
	$role->add_cap( 'admin_zerobs_events' );
	$role->add_cap( 'admin_zerobs_invoices' );
	$role->add_cap( 'admin_zerobs_transactions' );
	$role->add_cap( 'admin_zerobs_forms' );

	// logs
	$role->add_cap( 'admin_zerobs_logs_addedit' );
	$role->add_cap( 'admin_zerobs_logs_delete' );

	// emails
	$role->add_cap( 'admin_zerobs_sendemails_contacts' );

	// paranoia
	unset( $role );

	// give WP admins extra capabilities
	$role = get_role( 'administrator' );

	// this is for users who've removed 'administrator' role type
	// WH temp catch anyhow, for Nimitz.
	if ( $role !== null ) {

		// Caps
		$role->add_cap( 'manage_sales_dash' );
		$role->add_cap( 'admin_zerobs_mailcampaigns' );
		$role->add_cap( 'admin_zerobs_forms' );
		$role->add_cap( 'zbs_dash' ); # WH added 1.2 - has rights to view ZBS Dash

		// give permission to edit settings
		$role->add_cap( 'admin_zerobs_manage_options' );

		// CRM object view capabilities
		$role->add_cap( 'admin_zerobs_view_customers' );
		$role->add_cap( 'admin_zerobs_view_quotes' );
		$role->add_cap( 'admin_zerobs_view_invoices' );
		$role->add_cap( 'admin_zerobs_view_events' );
		$role->add_cap( 'admin_zerobs_view_transactions' );

		// CRM object edit capabilities
		$role->add_cap( 'admin_zerobs_customers' );
		$role->add_cap( 'admin_zerobs_customers_tags' );
		$role->add_cap( 'admin_zerobs_quotes' );
		$role->add_cap( 'admin_zerobs_invoices' );
		$role->add_cap( 'admin_zerobs_events' );
		$role->add_cap( 'admin_zerobs_transactions' );

		// needed for notifications
		$role->add_cap( 'admin_zerobs_notifications' );

		// logs
		$role->add_cap( 'admin_zerobs_logs_addedit' );
		$role->add_cap( 'admin_zerobs_logs_delete' );

		// all users
		$role->add_cap( 'admin_zerobs_usr' );

		// emails
		$role->add_cap( 'admin_zerobs_sendemails_contacts' );

		// paranoia
		unset( $role );

	}

	// CRM Contact Manager
	add_role(
		'zerobs_customermgr',
		__( 'Jetpack CRM Contact Manager', 'zero-bs-crm' ),
		array(
			'read'              => true,  // true allows this capability
			'edit_posts'        => false, // Allows user to edit their own posts
			'edit_pages'        => false, // Allows user to edit pages
			'edit_others_posts' => false, // Allows user to edit others posts not just their own
			'create_posts'      => false, // Allows user to create new posts
			'manage_categories' => false, // Allows user to manage post categories
			'publish_posts'     => false, // Allows the user to publish, otherwise posts stays in draft mode
		)
	);

	// gets the role from WP
	$role = get_role( 'zerobs_customermgr' );

	// caps
	$role->add_cap( 'read' );
	$role->remove_cap( 'edit_posts' );
	$role->add_cap( 'upload_files' ); // added 21/5/18 to ensure can upload media
	$role->add_cap( 'admin_zerobs_usr' ); #} For all zerobs users :)
	$role->add_cap( 'manage_categories' );
	$role->add_cap( 'zbs_dash' ); # WH added 1.2 - has rights to view ZBS Dash

	// CRM object view capabilities
	$role->add_cap( 'admin_zerobs_view_customers' );
	$role->add_cap( 'admin_zerobs_view_quotes' );
	$role->add_cap( 'admin_zerobs_view_invoices' );
	$role->add_cap( 'admin_zerobs_view_events' );
	$role->add_cap( 'admin_zerobs_view_transactions' );

	// CRM object edit capabilities
	$role->add_cap( 'admin_zerobs_customers' );
	$role->add_cap( 'admin_zerobs_customers_tags' );
	$role->add_cap( 'admin_zerobs_quotes' );
	$role->add_cap( 'admin_zerobs_events' );
	$role->add_cap( 'admin_zerobs_invoices' );
	$role->add_cap( 'admin_zerobs_transactions' );

	// needed for notifications
	$role->add_cap( 'admin_zerobs_notifications' );

	// logs
	$role->add_cap( 'admin_zerobs_logs_addedit' );

	// emails
	$role->add_cap( 'admin_zerobs_sendemails_contacts' );

	unset( $role );

	// CRM Quote Manager
	add_role(
		'zerobs_quotemgr',
		__( 'Jetpack CRM Quote Manager', 'zero-bs-crm' ),
		array(
			'read'              => true,  // true allows this capability
			'edit_posts'        => false, // Allows user to edit their own posts
			'edit_pages'        => false, // Allows user to edit pages
			'edit_others_posts' => false, // Allows user to edit others posts not just their own
			'create_posts'      => false, // Allows user to create new posts
			'manage_categories' => false, // Allows user to manage post categories
			'publish_posts'     => false, // Allows the user to publish, otherwise posts stays in draft mode
		)
	);

	// gets the role from WP
	$role = get_role( 'zerobs_quotemgr' );

	// caps
	$role->add_cap( 'read' );
	$role->remove_cap( 'edit_posts' );
	$role->add_cap( 'upload_files' ); // added 21/5/18 to ensure can upload media
	$role->add_cap( 'admin_zerobs_usr' ); #} For all zerobs users :)
	$role->add_cap( 'manage_categories' );
	$role->add_cap( 'zbs_dash' ); # WH added 1.2 - has rights to view ZBS Dash

	// CRM object view capabilities
	$role->add_cap( 'admin_zerobs_view_customers' );
	$role->add_cap( 'admin_zerobs_view_quotes' );

	// CRM object edit capabilities
	$role->add_cap( 'admin_zerobs_customers' );
	$role->add_cap( 'admin_zerobs_quotes' );

	// needed for notifications
	$role->add_cap( 'admin_zerobs_notifications' );

	// logs
	$role->add_cap( 'admin_zerobs_logs_addedit' );

	// paranoia
	unset( $role );

	// CRM Invoice Manager
	add_role(
		'zerobs_invoicemgr',
		__( 'Jetpack CRM Invoice Manager', 'zero-bs-crm' ),
		array(
			'read'              => true,  // true allows this capability
			'edit_posts'        => false, // Allows user to edit their own posts
			'edit_pages'        => false, // Allows user to edit pages
			'edit_others_posts' => false, // Allows user to edit others posts not just their own
			'create_posts'      => false, // Allows user to create new posts
			'manage_categories' => false, // Allows user to manage post categories
			'publish_posts'     => false, // Allows the user to publish, otherwise posts stays in draft mode
		)
	);

	// gets the role from WP
	$role = get_role( 'zerobs_invoicemgr' );

	// caps
	$role->add_cap( 'read' );
	$role->remove_cap( 'edit_posts' );
	$role->add_cap( 'upload_files' ); // added 21/5/18 to ensure can upload media
	$role->add_cap( 'admin_zerobs_usr' ); #} For all zerobs users :)
	$role->add_cap( 'manage_categories' );
	$role->add_cap( 'zbs_dash' ); # WH added 1.2 - has rights to view ZBS Dash

	// CRM object view capabilities
	$role->add_cap( 'admin_zerobs_view_customers' );
	$role->add_cap( 'admin_zerobs_view_invoices' );
	$role->add_cap( 'admin_zerobs_view_transactions' );

	// CRM object edit capabilities
	$role->add_cap( 'admin_zerobs_customers' );
	$role->add_cap( 'admin_zerobs_invoices' );
	$role->add_cap( 'admin_zerobs_transactions' );

	// needed for notifications
	$role->add_cap( 'admin_zerobs_notifications' );

	// logs
	$role->add_cap( 'admin_zerobs_logs_addedit' );

	// paranoia
	unset( $role );

	// CRM Transaction Manager
	add_role(
		'zerobs_transactionmgr',
		__( 'Jetpack CRM Transaction Manager', 'zero-bs-crm' ),
		array(
			'read'              => false, // true allows this capability
			'edit_posts'        => false, // Allows user to edit their own posts
			'edit_pages'        => false, // Allows user to edit pages
			'edit_others_posts' => false, // Allows user to edit others posts not just their own
			'create_posts'      => false, // Allows user to create new posts
			'manage_categories' => false, // Allows user to manage post categories
			'publish_posts'     => false, // Allows the user to publish, otherwise posts stays in draft mode
		)
	);

	// gets the role from WP
	$role = get_role( 'zerobs_transactionmgr' );

	// caps
	$role->add_cap( 'read' );
	$role->remove_cap( 'edit_posts' );
	$role->add_cap( 'upload_files' ); // added 21/5/18 to ensure can upload media
	$role->add_cap( 'admin_zerobs_usr' ); #} For all zerobs users :)
	$role->add_cap( 'manage_categories' );
	$role->add_cap( 'zbs_dash' ); # WH added 1.2 - has rights to view ZBS Dash

	// CRM object view capabilities
	$role->add_cap( 'admin_zerobs_view_customers' );
	$role->add_cap( 'admin_zerobs_view_transactions' );

	// CRM object edit capabilities
	$role->add_cap( 'admin_zerobs_customers' );
	$role->add_cap( 'admin_zerobs_transactions' );

	// needed for notifications
	$role->add_cap( 'admin_zerobs_notifications' );

	// logs
	$role->add_cap( 'admin_zerobs_logs_addedit' );

	// paranoia
	unset( $role );

	// CRM Customer
	add_role(
		'zerobs_customer',
		__( 'Jetpack CRM Contact', 'zero-bs-crm' ),
		array(
			'read'              => true,  // true allows this capability
			'edit_posts'        => false, // Allows user to edit their own posts
			'edit_pages'        => false, // Allows user to edit pages
			'edit_others_posts' => false, // Allows user to edit others posts not just their own
			'create_posts'      => false, // Allows user to create new posts
			'manage_categories' => false, // Allows user to manage post categories
			'publish_posts'     => false, // Allows the user to publish, otherwise posts stays in draft mode
		)
	);

	// paranoia
	unset( $role );

	// CRM Mail Manager - Manages campaigns, customers / companies
	add_role(
		'zerobs_mailmgr',
		__( 'Jetpack CRM Mail Manager', 'zero-bs-crm' ),
		array(
			'read'              => false, // true allows this capability
			'edit_posts'        => false, // Allows user to edit their own posts
			'edit_pages'        => false, // Allows user to edit pages
			'edit_others_posts' => false, // Allows user to edit others posts not just their own
			'create_posts'      => false, // Allows user to create new posts
			'manage_categories' => false, // Allows user to manage post categories
			'publish_posts'     => false, // Allows the user to publish, otherwise posts stays in draft mode
		)
	);

	// gets the role from WP
	$role = get_role( 'zerobs_mailmgr' );

	// caps
	$role->add_cap( 'read' );
	$role->remove_cap( 'edit_posts' );
	$role->add_cap( 'upload_files' ); // added 21/5/18 to ensure can upload media
	$role->add_cap( 'admin_zerobs_usr' ); #} For all zerobs users :)
	$role->add_cap( 'admin_zerobs_mailcampaigns' );
	$role->add_cap( 'manage_categories' );
	$role->add_cap( 'zbs_dash' ); # WH added 1.2 - has rights to view ZBS Dash

	// CRM object view capabilities
	$role->add_cap( 'admin_zerobs_view_customers' );
	$role->add_cap( 'admin_zerobs_view_quotes' );
	$role->add_cap( 'admin_zerobs_view_invoices' );
	$role->add_cap( 'admin_zerobs_view_events' );
	$role->add_cap( 'admin_zerobs_view_transactions' );

	// CRM object edit capabilities
	$role->add_cap( 'admin_zerobs_customers' );
	$role->add_cap( 'admin_zerobs_customers_tags' );
	$role->add_cap( 'admin_zerobs_events' );

	// needed for notifications
	$role->add_cap( 'admin_zerobs_notifications' );

	// emails
	$role->add_cap( 'admin_zerobs_sendemails_contacts' );

	unset( $role );
}

/* ======================================================
  / Add + Remove Roles
   ====================================================== */





/* ======================================================
  Role Helpers
   ====================================================== */

   // note this returns true if is any ZBS role, INCLUDING zbs customer 
   // if need just 'backend' user, use zeroBSCRM_permsIsZBSBackendUser
	function zeroBSCRM_permsIsZBSUser(){

		#} Set a global var for this load, (sometimes multi-called)
		global $zeroBSCRM_isZBSUser;

		if (isset($zeroBSCRM_isZBSUser)) return $zeroBSCRM_isZBSUser;

		#} ... else
		$zeroBSCRM_isZBSUser = false;
	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_usr')) $zeroBSCRM_isZBSUser = true;
	    if ($cu->has_cap('zerobs_customer')) $zeroBSCRM_isZBSUser = true;
	    
	    return $zeroBSCRM_isZBSUser;
	}
   	// note this returns true if is any wp-admin based zbs user
   	// if want zbs customer roles too, use zeroBSCRM_permsIsZBSUser
	function zeroBSCRM_permsIsZBSBackendUser(){

		#} Set a global var for this load, (sometimes multi-called)
		global $zeroBSCRM_isZBSBackendUser;

		if (isset($zeroBSCRM_isZBSBackendUser)) return $zeroBSCRM_isZBSBackendUser;

		#} ... else
		$zeroBSCRM_isZBSBackendUser = false;
	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_usr')) $zeroBSCRM_isZBSBackendUser = true;
	    
	    return $zeroBSCRM_isZBSBackendUser;
	}
	
	/*
	* Checks whether current user (or specified WP ID) is backend user, or wp admin
	* 
	* @param $wordpress_users_id - bool|int; if passed, will check this WordPress user ID rather than current user
	*/
	function zeroBSCRM_permsIsZBSUserOrAdmin( $wordpress_user_id = false ) {

		// param passed?
		if ( $wordpress_user_id == false ) {

			// if using current wordpress user:

			// Maintain a global var for this load, (sometimes called multiple times)
			// (Only for current user checks)
			global $zeroBSCRM_isZBSBackendUser;

			// check if already checked
			if ( isset( $zeroBSCRM_isZBSBackendUser ) ){
				return $zeroBSCRM_isZBSBackendUser;
			}

			// else check:
			$zeroBSCRM_isZBSBackendUser = false;
			$user = wp_get_current_user();


		} else {

			// using passed user id

			$user = get_userdata( $wordpress_user_id );

		}

		// user isn't logged in, or the passed user ID no longer exists or is an invalid value
		if ( !$user ) {
			return false;
		}

		// crm user check
		if ( $user->has_cap( 'admin_zerobs_usr' ) ){
			$zeroBSCRM_isZBSBackendUser = true;
			return true;
		}
		
		// admin check
		if ( $user->has_cap( 'manage_options' ) ){
			return true;
		}
		
		return false;

	}

	function zeroBSCRM_isZBSAdmin(){

	    $cu = wp_get_current_user();
	    //https://wordpress.stackexchange.com/questions/5047/how-to-check-if-a-user-is-in-a-specific-role
	    if (in_array( 'zerobs_admin', (array) $cu->roles )) return true;

	    return false;
	}

	function zeroBSCRM_isWPAdmin(){

	    $cu = wp_get_current_user();
	    
	    #} adm
	    if ($cu->has_cap('manage_options')) return true;

	    return false;
	}

	function zeroBSCRM_isZBSAdminOrAdmin(){

	    $cu = wp_get_current_user();
	    //https://wordpress.stackexchange.com/questions/5047/how-to-check-if-a-user-is-in-a-specific-role
	    if (in_array( 'zerobs_admin', (array) $cu->roles )) return true;

	    #} or adm
	    if ($cu->has_cap('manage_options')) return true;

	    return false;
	}

	function zeroBSCRM_wooCommerceRemoveBlock(){
	    #} Add Filter for WooCommerce
	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_usr')){
	    	add_filter( 'woocommerce_prevent_admin_access', '__return_false' );
		}
	}

	function zeroBSCRM_getWordPressRoles(){

	    global $wp_roles;

	    $all_roles = $wp_roles->roles;

	    return $all_roles;
	    
	}

	// return current user capabilities
	function zeroBSCRM_getCurrentUserCaps(){

		$data = get_userdata( get_current_user_id() );

		if ( is_object( $data) ) {
			return array_keys($data->allcaps);
		}

		return array();
	}

/**
 * Determine if the current user is allowed to manage contacts.
 *
 * @param int $obj_type_id Object type ID.
 *
 * @return bool
 */
function zeroBSCRM_permsObjType( $obj_type_id = -1 ) { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	switch ( $obj_type_id ) {
		case ZBS_TYPE_CONTACT:
		case ZBS_TYPE_COMPANY:
		case ZBS_TYPE_SEGMENT:
			return zeroBSCRM_permsCustomers();

		case ZBS_TYPE_QUOTE:
		case ZBS_TYPE_QUOTETEMPLATE:
			return zeroBSCRM_permsQuotes();

		case ZBS_TYPE_INVOICE:
			return zeroBSCRM_permsInvoices();

		case ZBS_TYPE_TRANSACTION:
			return zeroBSCRM_permsTransactions();

		case ZBS_TYPE_FORM:
			return zeroBSCRM_permsForms();

		case ZBS_TYPE_TASK:
			return zeroBSCRM_perms_tasks();

	}

	return false;
}

/**
 * Determine if a user is allowed to manage contacts.
 *
 * @since 6.1.0
 *
 * @param WP_User $user The WP User to check permission access for.
 * @param int     $contact_id (Optional) The ID of the CRM contact.
 * @return bool Returns a bool representing a user permission state.
 */
function jpcrm_can_user_manage_contacts( WP_User $user, $contact_id = null ) {
	/**
	 * Allow third party plugins to modify the permission conditions for contacts.
	 *
	 * @since 6.1.0
	 *
	 * @param boolean  $allowed A boolean that represents the permission state.
	 * @param WP_User  $user The WP User to check permission access for.
	 * @param int|null $contact_id (Optional) The ID of the CRM contact.
	 */
	return (bool) apply_filters(
		'jpcrm_can_user_manage_contacts',
		$user->has_cap( 'admin_zerobs_customers' ),
		$user,
		$contact_id
	);
}

/**
 * Determine if the current user is allowed to manage contacts.
 *
 * @deprecated 6.1.0 Use jpcrm_can_user_manage_contacts()
 *
 * @return bool
 *
 * @phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
 */
function zeroBSCRM_permsCustomers() {
	$current_user = wp_get_current_user();

	if ( ! $current_user instanceof WP_User ) {
		return false;
	}

	return jpcrm_can_user_manage_contacts( $current_user ) === true;
}

	function zeroBSCRM_permsSendEmailContacts(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_sendemails_contacts')) return true;
	    return false;
	}
            
	function zeroBSCRM_permsViewCustomers(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_view_customers')) return true;
	    return false;
	}
	function zeroBSCRM_permsCustomersTags(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_customers_tags')) return true;
	    return false;
	}
	function zeroBSCRM_permsQuotes(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_quotes')) return true;
	    return false;
	}
	function zeroBSCRM_permsViewQuotes(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_view_quotes')) return true;
	    return false;
	}
	function zeroBSCRM_permsInvoices(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_invoices')) return true;
	    return false;
	}
	function zeroBSCRM_permsViewInvoices(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_view_invoices')) return true;
	    return false;
	}
	function zeroBSCRM_permsTransactions(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_transactions')) return true;
	    return false;
	}
	function zeroBSCRM_permsViewTransactions(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_view_transactions')) return true;
	    return false;
	}
	function zeroBSCRM_permsMailCampaigns(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_mailcampaigns')) return true;
	    return false;
	}
	function zeroBSCRM_permsForms(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_forms')) return true;
	    return false;
	}

	function zeroBSCRM_perms_tasks(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_events')) return true;
	    return false;
	}
	function zeroBSCRM_permsNotify(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_notifications')) return true;
	    return false;
	}
	// NEEDS it's own cap when we get granular.
	function zeroBSCRM_permsExport(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('admin_zerobs_customers')) return true;
	    return false;
	}

	// LOGS


		// can add/edit logs
		function zeroBSCRM_permsLogsAddEdit(){

		    $cu = wp_get_current_user();
		    if ($cu->has_cap('admin_zerobs_logs_addedit')) return true;
		    return false;
		}

		// can delete logs
		function zeroBSCRM_permsLogsDelete(){

		    $cu = wp_get_current_user();
		    if ($cu->has_cap('admin_zerobs_logs_delete')) return true;
		    return false;
		}



	function zeroBSCRM_permsClient(){   //using Client to not confuse with Customer and Customer Manager

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('zerobs_customer')) return true;
	    return false;
	}
	function zeroBSCRM_permsWPEditPosts(){

	    $cu = wp_get_current_user();
	    if ($cu->has_cap('edit_posts')) return true;
	    return false;
	}

	function zeroBS_getPossibleCustomerOwners(){ return zeroBS_getPossibleOwners(array('zerobs_admin','zerobs_customermgr')); }
	function zeroBS_getPossibleCompanyOwners(){ return zeroBS_getPossibleOwners(array('zerobs_admin','zerobs_customermgr')); }
	function zeroBS_getPossibleQuoteOwners(){ return zeroBS_getPossibleOwners(array('zerobs_admin','zerobs_customermgr')); }
	function zeroBS_getPossibleInvoiceOwners(){ return zeroBS_getPossibleOwners(array('zerobs_admin','zerobs_customermgr')); }
	function zeroBS_getPossibleTransactionOwners(){ return zeroBS_getPossibleOwners(array('zerobs_admin','zerobs_customermgr')); }
	function zeroBS_getPossibleTaskOwners(){ return zeroBS_getPossibleOwners(array('zerobs_admin','admin_zerobs_events')); }


	// added this because Multi-site doesn't reliably 
	// return on current_user_can('zerobs_customer')
	// https://wordpress.stackexchange.com/questions/5047/how-to-check-if-a-user-is-in-a-specific-role
	function zeroBSCRM_isRole($role=''){

		$user = wp_get_current_user();
		if ( in_array( $role, (array) $user->roles ) ) {
		    return true;
		}

		return false;

	}

	/**
	 * Checks a user object (or current user if false passed)
	 * has roles in first array, and none of the roles in second array
	 **/
	function jpcrm_role_check( $user_object = false, $has_roles = array(), $hasnt_roles = array(), $only_these_roles = array() ){

		// load current user if not passed
		if ( !$user_object ){

			$user_object = wp_get_current_user();
		
		}

		// got object?
		if ( !$user_object ){

				return false;

		}

		// verify has_roles
		if ( count( $has_roles ) > 0 ){

				foreach ( $has_roles as $role ){

						if ( !in_array( $role, $user_object->roles ) ) {

							return false;

						}

				}

		}

		// verify hasnt_roles
		if ( count( $hasnt_roles ) > 0 ){

				foreach ( $hasnt_roles as $role ){

						if ( in_array( $role, $user_object->roles ) ) {

							return false;

						}

				}

		}

		// verify only_roles
		if ( count( $only_these_roles ) > 0 ){

				$role_match_count = 0;

				foreach ( $user_object->roles as $role ){

						if ( !in_array( $role, $only_these_roles ) ) {

							return false;

						} else {

								$role_match_count++;

						}

				}

				if ( $role_match_count != count( $only_these_roles ) ){

						return false;

				}

		}


		return true;

	}


	function zeroBS_getPossibleOwners($permsReq='',$simplify=false){

		// https://codex.wordpress.org/Function_Reference/get_users 
		/* possible args..
		 $args = array(
			'blog_id'      => $GLOBALS['blog_id'],
			'role'         => '',
			'role__in'     => array('administrator','zerobs_admin','zerobs_customermgr','zerobs_quotemgr','zerobs_invoicemgr','zerobs_transactionmgr',''),
			'role__not_in' => array(),
			'meta_key'     => '',
			'meta_value'   => '',
			'meta_compare' => '',
			'meta_query'   => array(),
			'date_query'   => array(),        
			'include'      => array(),
			'exclude'      => array(),
			'orderby'      => 'login',
			'order'        => 'ASC',
			'offset'       => '',
			'search'       => '',
			'number'       => '',
			'count_total'  => false,
			'fields'       => 'all',
			'who'          => '',
		 ); 

		 */


		if (empty($permsReq) || !in_array($permsReq, array('zerobs_admin','zerobs_customermgr','zerobs_quotemgr','zerobs_invoicemgr','zerobs_transactionmgr'))){

			// all zbs users + admin
			$args = array('role__in'     => array('administrator','zerobs_admin','zerobs_customermgr','zerobs_quotemgr','zerobs_invoicemgr','zerobs_transactionmgr'));

		} else {

			// specific roles :) (+- admin?)
			$args = array('role__in'     => array('administrator',$permsReq));


		}

		$users = get_users( $args );


		// this is used by inline editing on list view, be careful if editing
		if ($simplify){

			if (is_array($users)){

				$ret = array();

				foreach ($users as $u){

					$ret[] = array(

						'id' => $u->ID,
						'name' => $u->data->display_name,
						'email' => $u->data->user_email

					);
				}

				$users = $ret;
			}

		}

		return $users;

	}
/* ======================================================
  / Role Helpers
   ====================================================== */

/**
 * Checks whether a WP user has permissions to view an object
 * 
 * @param   obj $wp_user        WP user object
 * @param   int $obj_id
 * @param   int $obj_type_id
 * 
 * @return	bool indicating whether the WP user can view the current object
 */
function jpcrm_can_wp_user_view_object( $wp_user, $obj_id, $obj_type_id ) {

  // unsupported object type
  if ( !in_array( $obj_type_id, array( ZBS_TYPE_QUOTE, ZBS_TYPE_INVOICE ) ) ) {
    return false;
  }

  // retrieve object
  switch ($obj_type_id) {
    case ZBS_TYPE_QUOTE:
      $is_quote_admin = $wp_user->has_cap( 'admin_zerobs_quotes' );
      $obj_data = zeroBS_getQuote( $obj_id );
      // draft quote
      if ( is_array($obj_data) && $obj_data['template'] == -1 && !$is_quote_admin ) {
        return false;
      }
      $assigned_contact_id = zeroBSCRM_quote_getContactAssigned( $obj_id );
      break;
    case ZBS_TYPE_INVOICE:
      $is_invoice_admin = $wp_user->has_cap( 'admin_zerobs_invoices' );
      $obj_data = zeroBS_getInvoice( $obj_id );
      // draft invoice
			if ( is_array( $obj_data ) && $obj_data['status'] === 'Draft' && ! $is_invoice_admin ) {
				return false;
			}
      $assigned_contact_id = zeroBSCRM_invoice_getContactAssigned( $obj_id );
      break;
  }

  // no such object!
  if ( !$obj_data ) {
    return false;
  }

  // not logged in
  if ( !$wp_user ) {
    return false;
  }

  // grant access if user has full permissions to view object type
  if (
    $obj_type_id == ZBS_TYPE_QUOTE && $is_quote_admin
    || $obj_type_id == ZBS_TYPE_INVOICE && $is_invoice_admin
  ) {
    return true;
  }

  // object is not assigned
  if ( !$assigned_contact_id ) {
    return false;
  }

  // verify current user is assigned user
  $contact_id = zeroBS_getCustomerIDWithEmail( $wp_user->user_email );
  if ( $assigned_contact_id != $contact_id ) {
    return false;
  }

  // passed all checks, so go for liftoff
  return true;
}

/**
 * Pass-thru helper function to get current user for use with jpcrm_can_wp_user_view_object()
 * Particularly useful for client portal functions.
 * 
 * @param   int $obj_id
 * @param   int $obj_type_id
 * 
 * @return	bool indicating whether the current user can view the current object
 */
function jpcrm_can_current_wp_user_view_object( $obj_id, $obj_type_id ) {
  $current_wp_user = wp_get_current_user();
  return jpcrm_can_wp_user_view_object( $current_wp_user, $obj_id, $obj_type_id );
}


/**
 * Determines if client portal access is allowed via easy-access hashes.
 * 
 * @param   int $obj_type_id
 * 
 * @return  bool
 */
function jpcrm_can_access_portal_via_hash( $obj_type_id ) {

  // easy access is disabled
  if ( zeroBSCRM_getSetting( 'easyaccesslinks' ) != 1 ) {
    return false;
  }

  $security_request_name = jpcrm_get_easy_access_security_request_name_by_obj_type( $obj_type_id );

  // unsupported object type
  if ( !$security_request_name ) {
    return false;
  }

  // fail if already blocked (this is a nefarious user or bot)
  if ( zeroBSCRM_security_blockRequest( $security_request_name ) ) {
    return false;
  }
  // access via hash is allowed
  return true;

}

/**
 * Returns security request name by object type.
 * 
 * @param   int $obj_type_id
 * 
 * @return  str
 * @return  bool false if no match
 */
function jpcrm_get_easy_access_security_request_name_by_obj_type( $obj_type_id ) {

  switch ( $obj_type_id ) {
    case ZBS_TYPE_INVOICE:
      $security_request_name = 'inveasy';
      break;
    case ZBS_TYPE_QUOTE:
      $security_request_name = 'quoeasy';
      break;
    default:
      $security_request_name = false;
  }

  return $security_request_name;
}

// show an error if bad permissions
function jpcrm_perms_error() {
	echo zeroBSCRM_UI2_messageHTML(
		'warning',
		__( 'Access Denied', 'zero-bs-crm' ),
		__('You do not have permission to access this page.', 'zero-bs-crm' ),
		'disabled warning sign',
		'bad_perms'
	);
	die();
}
