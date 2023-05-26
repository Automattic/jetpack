<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Legacy Learn menu functions
 * 	This file contains function-based learn menu rendering, where generically rendered learn menus
 *	were moved into the new class (`Learn_Menu`), these will need modernising individually
 */


/*
* Wrapper for newly formed Learn_Menu evolution
* This provides backward compatibility for extensions using this function.
* ... but is really deprecated
*/
function zeroBS_genericLearnMenu(
	$page_title = '',
	$left_buttons = '',
	$right_buttons = '',
	$show_learn = true,
	$learn_title = '',
	$learn_content = '',
	$learn_more_url = '',
	$learn_image_url = '',
	$learn_video_url = '',
	$extra_js = '',
	$popup_extra_css = '',
	$learn_video_title = ''
) {

	global $zbs;

	// render generic learn menu with content
	$zbs->learn_menu->render_generic_learn_menu(
		$page_title,
		$left_buttons,
		$right_buttons,
		$show_learn,
		$learn_title,
		$learn_content,
		$learn_more_url,
		$zbs->learn_menu->get_image_url( $learn_image_url ),
		$learn_video_url,
		$extra_js,
		$popup_extra_css,
		$learn_video_title
	);
}

/**
 * Extend contact listview learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_contactlist_learn_menu( $learn_menu ) {

	if ( zeroBSCRM_permsCustomers() ) {
		$learn_menu['right_buttons'] = '<a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_customer', false ) . '" class="jpcrm-button font-14px">' . __( 'Add new contact', 'zero-bs-crm' ) . '</a>';
	}
	return $learn_menu;
}

/**
 * Extend contact view learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_viewcontact_learn_menu( $learn_menu ) {

	if ( zeroBSCRM_permsCustomers() ) {
		$learn_menu['left_buttons'] = '<a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_customer', false ) . '" class="jpcrm-button font-14px">' . __( 'Add new contact', 'zero-bs-crm' ) . '</a>';
	}

	$contact_id                  = ( empty( $_GET['zbsid'] ) ? -1 : (int) $_GET['zbsid'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$learn_menu['right_buttons'] = zeroBSCRM_getObjNav( $contact_id, 'view', ZBS_TYPE_CONTACT );

	return $learn_menu;
}

/**
 * Extend company view learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_viewcompany_learn_menu( $learn_menu ) {

	$company_id                  = ( empty( $_GET['zbsid'] ) ? -1 : (int) $_GET['zbsid'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$learn_menu['right_buttons'] = zeroBSCRM_getObjNav( $company_id, 'view', ZBS_TYPE_COMPANY );

	return $learn_menu;
}

/**
 * Extend contact edit learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_contactedit_learn_menu( $learn_menu ) {
	$contact_id = ( empty( $_GET['zbsid'] ) ? -1 : (int) $_GET['zbsid'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	$learn_menu['right_buttons'] = zeroBSCRM_getObjNav( $contact_id, 'edit', ZBS_TYPE_CONTACT );

	return $learn_menu;
}

/**
 * Extend form listview learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_formlist_learn_menu( $learn_menu ) {

	global $zbs;

	$learn_menu['right_buttons'] = '';
	if ( zeroBSCRM_permsQuotes() ) {
		$learn_menu['right_buttons'] .= ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_form', false ) . '" class="jpcrm-button font-14px">' . __( 'Add new form', 'zero-bs-crm' ) . '</a>';
	}

	// ? Yup ?
	$learn_menu['extra_js'] = 'if (typeof hopscotch != "undefined" && (hopscotch.getState() === "zbs-welcome-tour:9" || hopscotch.getState() === "zbs-welcome-tour:10" || hopscotch.getState() === "zbs-welcome-tour:11")) {hopscotch.startTour(window.zbsTour);}';

	if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
		// Settings link
		$setting_link                 = zeroBSCRM_getAdminURL( $zbs->slugs['settings'] ) . '&tab=forms';
		$learn_menu['right_buttons'] .= '<a href="' . esc_url( $setting_link ) . '" class="jpcrm-button transparent-bg font-14px" title="' . esc_attr__( 'Forms settings', 'zero-bs-crm' ) . '"><i class="cogs icon"></i></a>';
	}

	return $learn_menu;
}

/**
 * Extend task edit learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_taskedit_learn_menu( $learn_menu ) {

	global $zbs;

	$learn_menu['left_buttons']  = '<div id="zbs-event-learn-nav"></div>';
	$learn_menu['left_buttons'] .= ' <a href="' . jpcrm_esc_link( $zbs->slugs['manage-events'] ) . '" class="jpcrm-button white-bg font-14px">' . __( 'View calendar', 'zero-bs-crm' ) . '</a>';
	$learn_menu['left_buttons'] .= ' <a href="' . jpcrm_esc_link( $zbs->slugs['manage-events-list'] ) . '" class="jpcrm-button white-bg font-14px">' . __( 'View list', 'zero-bs-crm' ) . '</a>';
	$learn_menu['left_buttons'] .= ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_event', false ) . '" class="jpcrm-button font-14px">' . __( 'Add new task', 'zero-bs-crm' ) . '</a>';

	return $learn_menu;
}

/**
 * Extend task listview learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_tasklistview_learn_menu( $learn_menu ) {
	global $zbs;

	$learn_menu['right_buttons']  = ' <a href="' . jpcrm_esc_link( $zbs->slugs['manage-events'] ) . '" class="jpcrm-button white-bg font-14px">' . __( 'View Calendar', 'zero-bs-crm' ) . '</a>';
	$learn_menu['right_buttons'] .= ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_event', false ) . '" class="jpcrm-button font-14px">' . __( 'Add new task', 'zero-bs-crm' ) . '</a>';

	return $learn_menu;
}

/**
 * Extend new task learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_tasknew_learn_menu( $learn_menu ) {

	global $zbs;

	$learn_menu['left_buttons']  = '<div id="zbs-event-learn-nav"></div>';
	$learn_menu['left_buttons'] .= ' <a href="' . jpcrm_esc_link( $zbs->slugs['manage-events'] ) . '" class="jpcrm-button white-bg font-14px">' . __( 'View calendar', 'zero-bs-crm' ) . '</a>';
	$learn_menu['left_buttons'] .= ' <a href="' . jpcrm_esc_link( $zbs->slugs['manage-events-list'] ) . '" class="jpcrm-button white-bg font-14px">' . __( 'View list', 'zero-bs-crm' ) . '</a>';

	return $learn_menu;
}

/**
 * Extend quote listview learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_quotelist_learn_menu( $learn_menu ) {

	$learn_menu['right_buttons'] = '';

	if ( zeroBSCRM_permsCustomers() ) {
		$learn_menu['right_buttons'] .= ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_quote', false ) . '" class="jpcrm-button font-14px">' . __( 'Add new quote', 'zero-bs-crm' ) . '</a>';
	}

	// ? Yup ?
	$learn_menu['extra_js'] = 'if (typeof hopscotch != "undefined" && (hopscotch.getState() === "zbs-welcome-tour:9" || hopscotch.getState() === "zbs-welcome-tour:10" || hopscotch.getState() === "zbs-welcome-tour:11")) {hopscotch.startTour(window.zbsTour);}';

	if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
		// Settings link
		global $zbs;
		$setting_link                 = zeroBSCRM_getAdminURL( $zbs->slugs['settings'] ) . '&tab=quotebuilder';
		$learn_menu['right_buttons'] .= '<a href="' . esc_url( $setting_link ) . '" class="jpcrm-button transparent-bg font-14px" title="' . esc_attr__( 'Quotes settings', 'zero-bs-crm' ) . '"><i class="cogs icon"></i></a>';
	}

	return $learn_menu;
}

/**
 * Extend new quote learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_quotenew_learn_menu( $learn_menu ) {
	$learn_menu['left_buttons'] = '<div id="zbs-quote-learn-nav"></div>';
	return $learn_menu;
}

/**
 * Extend quote edit learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_quoteedit_learn_menu( $learn_menu ) {

	$learn_menu['left_buttons']  = '<div id="zbs-quote-learn-nav"></div>';
	$learn_menu['left_buttons'] .= '<a href="' . jpcrm_esc_link( 'create', -1, ZBS_TYPE_QUOTE, false ) . '" class="jpcrm-button font-14px">' . __( 'Add New', 'zero-bs-crm' ) . '</a>';

	return $learn_menu;
}

/**
 * Extend transaction listview learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_transactionlist_learn_menu( $learn_menu ) {

	global $zbs;
	$learn_menu['right_buttons'] = '';

	if ( zeroBSCRM_permsTransactions() ) {
		$learn_menu['right_buttons'] .= ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_transaction', false ) . '" class="jpcrm-button font-14px">' . __( 'Add new transaction', 'zero-bs-crm' ) . '</a>';
	}

	if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
		// Settings link
		$setting_link                 = zeroBSCRM_getAdminURL( $zbs->slugs['settings'] ) . '&tab=transactions';
		$learn_menu['right_buttons'] .= '<a href="' . esc_url( $setting_link ) . '" class="jpcrm-button transparent-bg font-14px" title="' . esc_attr__( 'Transaction settings', 'zero-bs-crm' ) . '"><i class="cogs icon"></i></a>';
	}

	return $learn_menu;
}

/**
 * Extend new transaction learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_transactionnew_learn_menu( $learn_menu ) {
	$learn_menu['left_buttons'] = '<div id="zbs-transaction-learn-nav"></div>';
	return $learn_menu;
}

/**
 * Extend transaction edit learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_transactionedit_learn_menu( $learn_menu ) {
	$learn_menu['left_buttons'] = '<div id="zbs-transaction-learn-nav"></div>';

	if ( zeroBSCRM_permsTransactions() ) {
		$learn_menu['left_buttons'] .= ' <a href="' . jpcrm_esc_link( 'create', -1, ZBS_TYPE_TRANSACTION, false ) . '" class="jpcrm-button font-14px">' . __( 'Add new transaction', 'zero-bs-crm' ) . '</a>';
	}

	return $learn_menu;
}
/**
 * Extend invoice listview learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_invoicelist_learn_menu( $learn_menu ) {

	global $zbs;

	$learn_menu['right_buttons'] = '';
	if ( zeroBSCRM_permsInvoices() ) {
		$learn_menu['right_buttons'] .= '<a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_invoice', false ) . '" class="jpcrm-button font-14px">' . __( 'Add new invoice', 'zero-bs-crm' ) . '</a>';
	}

	if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
		// Settings link
		$setting_link                 = zeroBSCRM_getAdminURL( $zbs->slugs['settings'] ) . '&tab=invbuilder';
		$learn_menu['right_buttons'] .= '<a href="' . esc_url( $setting_link ) . '" class="jpcrm-button transparent-bg font-14px" title="' . esc_attr__( 'Invoice settings', 'zero-bs-crm' ) . '"><i class="cogs icon"></i></a>';
	}

	return $learn_menu;
}

/**
 * Extend new invoice learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_invoicenew_learn_menu( $learn_menu ) {
	global $zbs;

	$learn_menu['left_buttons'] = '<div id="zbs-invoice-learn-nav"></div>';

	if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
		$learn_menu['right_buttons'] = '<a class="jpcrm-button transparent-bg font-14px" target="_blank" href="' . admin_url( 'admin.php?page=' . $zbs->slugs['settings'] ) . '&tab=invbuilder" title="' . __( 'Invoice Settings', 'zero-bs-crm' ) . '"><i class="options icon"></i></a> <a class="jpcrm-button transparent-bg font-14px" target="_blank" href="' . admin_url( 'admin.php?page=' . $zbs->slugs['settings'] ) . '&tab=bizinfo" title="' . __( 'Business Settings', 'zero-bs-crm' ) . '"><i class="building icon"></i></a>';
	}

	return $learn_menu;
}
/**
 * Extend invoice edit learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_invoiceedit_learn_menu( $learn_menu ) {

	global $zbs;

	$learn_menu['left_buttons'] = '<div id="zbs-invoice-learn-nav"></div>';

	if ( zeroBSCRM_permsInvoices() ) {
		$learn_menu['left_buttons'] .= '<a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_invoice', false ) . '" class="jpcrm-button font-14px">' . __( 'Add New', 'zero-bs-crm' ) . '</a>';
	}

	if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
		$learn_menu['right_buttons'] = '<a class="jpcrm-button transparent-bg font-14px" target="_blank" href="' . admin_url( 'admin.php?page=' . $zbs->slugs['settings'] ) . '&tab=invbuilder" title="' . __( 'Invoice Settings', 'zero-bs-crm' ) . '"><i class="options icon"></i></a> <a class="jpcrm-button transparent-bg font-14px" target="_blank" href="' . admin_url( 'admin.php?page=' . $zbs->slugs['settings'] ) . '&tab=bizinfo" title="' . __( 'Business Settings', 'zero-bs-crm' ) . '"><i class="building icon"></i></a>';
	}

	return $learn_menu;
}

/**
 * Extend company listview learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_companylist_learn_menu( $learn_menu ) {

	global $zbs;

	$learn_menu['right_buttons'] = '';
	if ( zeroBSCRM_permsCustomers() ) {
		$learn_menu['right_buttons'] .= '<a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_company', false ) . '" class="jpcrm-button font-14px">' . __( 'Add New', 'zero-bs-crm' ) . '</a>';
	}
	if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
		// Settings link
		$setting_link                 = zeroBSCRM_getAdminURL( $zbs->slugs['settings'] ) . '&tab=companies';
		$learn_menu['right_buttons'] .= '<a href="' . esc_url( $setting_link ) . '" class="jpcrm-button transparent-bg font-14px" title="' . esc_attr__( 'Settings', 'zero-bs-crm' ) . '"><i class="cogs icon"></i></a>';
	}

	return $learn_menu;
}

/**
 * Extend company edit learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_companyedit_learn_menu( $learn_menu ) {
	$company_id = ( empty( $_GET['zbsid'] ) ? -1 : (int) $_GET['zbsid'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	$learn_menu['right_buttons'] = zeroBSCRM_getObjNav( $company_id, 'edit', ZBS_TYPE_COMPANY );

	return $learn_menu;
}

/**
 * Extend task calendar learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_taskcalendar_learn_menu( $learn_menu ) {

	global $zbs;

	// show "who's calendar" top right
	$selected_user_id = ( empty( $_GET['zbsowner'] ) ? -1 : (int) $_GET['zbsowner'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$task_users       = zeroBS_getPossibleCustomerOwners();
	$task_users_html  = '';
	if ( count( $task_users ) > 0 && zeroBSCRM_isZBSAdminOrAdmin() ) {
		$task_users_html .= '<select id="zerobscrm-owner">';
		$task_users_html .= '<option value="-1">' . __( 'All Users', 'zero-bs-crm' ) . '</option>';
		foreach ( $task_users as $user ) {
			$task_users_html .= '<option value="' . esc_attr( $user->ID ) . '"' . ( $user->ID === $selected_user_id ? ' selected' : '' ) . '>' . esc_html( $user->display_name ) . '</option>';
		}
		$task_users_html .= '</select>';

		$url_base = jpcrm_esc_link( $zbs->slugs['manage-events'] );

		$task_users_html .= <<<EOF
		<script type="text/javascript">
		var zbsExistingEventsUserID = $selected_user_id;
		jQuery('#zerobscrm-owner').on('change',function(){
			var v = jQuery(this).val();
			if (v != '' && v != window.zbsExistingEventsUserID){
				var newURL = '$url_base';
				if (v != -1) newURL += '&zbsowner=' + jQuery(this).val();
				window.location = newURL;
			}
		});
		</script>
EOF;

	}

	$learn_menu['right_buttons']  = $task_users_html;
	$learn_menu['right_buttons'] .= ' <a href="' . jpcrm_esc_link( $zbs->slugs['manage-events-list'] ) . '" class="jpcrm-button white-bg font-14px">' . __( 'List view', 'zero-bs-crm' ) . '</a>';
	$learn_menu['right_buttons'] .= ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_event', false ) . '" class="jpcrm-button font-14px">' . __( 'Add new event', 'zero-bs-crm' ) . '</a>';

	return $learn_menu;
}

/**
 * Extend segment listview learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_segmentlist_learn_menu( $learn_menu ) {

	if ( zeroBSCRM_permsCustomers() ) {
		$learn_menu['right_buttons'] = ' <a href="' . jpcrm_esc_link( 'create', -1, 'segment', false ) . '" class="jpcrm-button font-14px">' . esc_html__( 'Add new segment', 'zero-bs-crm' ) . '</a>';
	}

	return $learn_menu;
}

/**
 * Extend segment new and edit learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_segmentedit_learn_menu( $learn_menu ) {
	$is_new_segment = ( empty( $_GET['zbsid'] ) || (int) $_GET['zbsid'] <= 0 ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	if ( $is_new_segment ) {
		$learn_menu['title'] = __( 'New Segment', 'zero-bs-crm' );
	} else {
		$learn_menu['right_buttons'] = '<button class="jpcrm-button font-14px" type="button" id="zbs-segment-edit-act-save">' . __( 'Save Segment', 'zero-bs-crm' ) . '</button>';
	}
	return $learn_menu;
}

/**
 * Extend settings learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_settings_learn_menu( $learn_menu ) {
	global $zbs;

	if ( current_user_can( 'admin_zerobs_manage_options' ) ) { // phpcs:ignore WordPress.WP.Capabilities.Unknown
		$learn_menu['right_buttons'] = ' <a href="' . zeroBSCRM_getAdminURL( $zbs->slugs['modules'] ) . '" class="jpcrm-button white-bg font-14px" id="manage-features">' . __( 'Manage modules', 'zero-bs-crm' ) . '</a>';
	}

	$learn_menu['extra_js'] = 'if (typeof hopscotch != "undefined" && (hopscotch.getState() === "zbs-welcome-tour:10:5")) { hopscotch.startTour(window.zbsTour);}';
	return $learn_menu;
}

/**
 * Extend emails learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_emails_learn_menu( $learn_menu ) {
	$learn_menu['right_buttons'] = '<a href="' . admin_url( 'admin.php?page=zerobscrm-send-email' ) . '" class="jpcrm-button font-14px zbs-inbox-compose-email">' . __( 'Compose Mail', 'zero-bs-crm' ) . '</a>';
	return $learn_menu;
}

/**
 * Render object delete menu
 *
 * Likely not used anywhere.
 */
function jpcrm_delete_learn_menu() {
	global $zbs;

	$title   = __( 'Delete', 'zero-bs-crm' );
	$content = $zbs->learn_menu->get_content_body( 'delete' );
	$links   = $zbs->learn_menu->get_content_urls( 'delete' );

	$zbstype = -1;
	if ( ! empty( $_GET['zbstype'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		// type specific :)
		$zbstype = sanitize_text_field( $_GET['zbstype'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash

		// try a conversion
		$obj_type_id = $zbs->DAL->objTypeID( $zbstype ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		if ( $obj_type_id > 0 ) {

			// got a type :D
			$singular = $zbs->DAL->typeStr( $obj_type_id ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$title    = __( 'Delete', 'zero-bs-crm' ) . ' ' . $singular;
			$content  = $zbs->learn_menu->get_content_body( $zbstype . 'delete' );  // e.g. contactdelete
			$links    = $zbs->learn_menu->get_content_urls( $zbstype . 'delete' );

		}
	}

	$show_learn = false;

	// output
	$zbs->learn_menu->render_generic_learn_menu( $title, '', '', $show_learn, $title, $content, $links['learn'], $links['img'], $links['vid'], '' );
}

/**
 * Extend notifications learn menu.
 *
 * @param array $learn_menu Learn menu array.
 *
 * @return array
 */
function jpcrm_notifications_learn_menu( $learn_menu ) {
	$learn_menu['extra_js'] = 'if (typeof hopscotch != "undefined" && hopscotch.getState() === "zbs-welcome-tour:4") { hopscotch.startTour(window.zbsTour);}';
	return $learn_menu;
}
