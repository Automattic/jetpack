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
        $add_new = '',
        $filter_str = '',
        $show_learn = true,
        $learn_title = '',
        $learn_content = '',
        $learn_more_url = '',
        $learn_image_url = '',
        $learn_video_url = '',
        $extra_js = '',
        $popup_extra_css = '',
        $learn_video_title = ''

    ){

    global $zbs;

    // render generic learn menu with content
    $zbs->learn_menu->render_generic_learn_menu(

        $page_title,
        $add_new,
        $filter_str,
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


function jpcrm_contactlist_learn_menu(){

	global $zbs;

    // title
    $title = __( 'Contacts','zero-bs-crm' );

    // Add new
    $addNew = ''; if ( zeroBSCRM_permsCustomers() ) {
        $addNew = ' <a href="' . jpcrm_esc_link('create',-1,'zerobs_customer',false ) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add new Contact',"zero-bs-crm") . '</a>';
    }

    $content      = $zbs->learn_menu->get_content_body( 'managecontacts' );
    $links        = $zbs->learn_menu->get_content_urls( 'managecontacts' );	


    // filter strings
    $filterStr = '<a href="' . jpcrm_esc_link( $zbs->slugs['managecontacts'] ) . '" id="zbs-listview-clearfilters" class="ui button red tiny hidden zbs-hide"><i class="undo icon"></i>'.__(" Clear Filters","zero-bs-crm").'</a><div id="zbs-listview-biline" class="hidden"></div>';

    #} And allow peeps also to toggl side bar:
    $filterStr .= '<button class="ui icon button basic right floated" type="button" id="zbs-toggle-sidebar"><i class="toggle off icon"></i></button>';

    #} Admins can change columns! (globally - should each person have own views?
    // Now everyone can see this menu (2.95.3+) - but can only edit count per page
    //if (zeroBSCRM_isZBSAdminOrAdmin()){ 
        $filterStr .= '<button class="ui icon button blue right floated" type="button" id="zbs-open-column-manager"><i class="options icon"></i></button>';
    //} 

	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );
}


function jpcrm_viewcontact_learn_menu($name=''){

	global $zbs;

    $title        = __( 'Viewing Contact','zero-bs-crm' );
    $addNew = ''; if ( zeroBSCRM_permsCustomers() ) {
        $addNew = ' <a href="' . jpcrm_esc_link( 'create' ,-1, 'zerobs_customer', false ) . '" id="zbs-contact-add-new" class="button ui blue tiny zbs-add-new">' . __( 'Add new Contact',"zero-bs-crm") . '</a>';
    }
    $content      = $zbs->learn_menu->get_content_body( 'viewcontact' );
    $links        = $zbs->learn_menu->get_content_urls( 'viewcontact' );	

	#} Navigation
	$zbsid = -1;
    if (isset($_GET['zbsid']) && !empty($_GET['zbsid'])) $zbsid = (int)sanitize_text_field($_GET['zbsid']);
	$filterStr = '<div class="ui items right floated" style="margin:0">'.zeroBSCRM_getObjNav($zbsid,'view',ZBS_TYPE_CONTACT).'</div>';
	
	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );

}


function jpcrm_viewcompany_learn_menu($name=''){

	global $zbs;

	$learnContent = '<p>'.__(jpcrm_label_company()." information page. See key information about the ".jpcrm_label_company()."'s status and when they were added.","zero-bs-crm").'</p>
					<p><strong>'.__("At a glance","zero-bs-crm").'</strong> '.__("you can see everything about the ".jpcrm_label_company()." and perform quick actions.","zero-bs-crm").'</p>';
					//<p>'.__("You can add tasks, send emails and see your contacts activity here.", "zero-bs-crm").'</p>';
						
    $addNew = ''; 

    // admin can change view setting
    // use screenoptions model instead
    //if ( current_user_can('admin_zerobs_manage_options') ) {
    //	$addNew = '<button class="ui icon right floated button" type="button" id="zbs-current-page-view-settings"><i class="settings icon"></i></button>';
    //}

    $content      = $zbs->learn_menu->get_content_body( 'viewcompany' );
    $links        = $zbs->learn_menu->get_content_urls( 'viewcompany' );
    
	#} Navigation
	$zbsid = -1;
    if (isset($_GET['zbsid']) && !empty($_GET['zbsid'])) $zbsid = (int)$_GET['zbsid'];
	$filterStr = '<div class="ui items right floated" style="margin:0">'.zeroBSCRM_getObjNav($zbsid,'view',ZBS_TYPE_COMPANY).'</div>';
	
	
	// output
	$zbs->learn_menu->render_generic_learn_menu( __( 'Viewing '.jpcrm_label_company(),"zero-bs-crm"),$addNew,$filterStr,true,__(jpcrm_label_company().' View',"zero-bs-crm"),$content,$links['learn'],$links['img'],$links['vid'],' //none','z-index: 9999999;' );

}


// for new + edit menu :)
function jpcrm_contactedit_learn_menu2(){

    global $zbs;

    $title = __("New Contact","zero-bs-crm");

    $title        = __( 'New Contact','zero-bs-crm' );
    $addNew = '';
    $content      = $zbs->learn_menu->get_content_body( 'newedit' );
    $links        = $zbs->learn_menu->get_content_urls( 'newedit' );

	$zbsid = -1;

    if (isset($_GET['zbsid']) && !empty($_GET['zbsid'])) {
    	/* $id = (int)sanitize_text_field($_GET['zbsid']);
    		$filterStr .= '<a class="ui icon button basic blue right floated" href="'.jpcrm_esc_link('view',$id,'zerobs_customer').'"><i class="angle left icon"></i> '.__( 'Back',"zero-bs-crm").'</a>';   	*/
    	$title = __("Edit Contact","zero-bs-crm");   
        $zbsid = (int)sanitize_text_field($_GET['zbsid']);
        $content      = $zbs->learn_menu->get_content_body( 'contactedit' );
        $links        = $zbs->learn_menu->get_content_urls( 'contactedit' );	
    }

    $metaboxMgrStr = '';
  
	
	$filterStr = '<div class="ui items right floated" style="margin:0">'.zeroBSCRM_getObjNav($zbsid,'edit',ZBS_TYPE_CONTACT).$metaboxMgrStr.'</div>';

	// output
	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );


}




// for new + edit menu :)
function jpcrm_companyedit_learn_menu2(){

	global $zbs;

	$title = __("New ".jpcrm_label_company(),"zero-bs-crm");
    $content      = $zbs->learn_menu->get_content_body( 'newcompany' );
    $links        = $zbs->learn_menu->get_content_urls( 'newcompany' );	

    $filterStr = '';	

    // pre v3
    if (isset($_GET['post']) && !empty($_GET['post'])) {
    	$title = __("Edit ".jpcrm_label_company(),"zero-bs-crm");
    	$id = (int)sanitize_text_field($_GET['post']);
    	$filterStr .= '<a class="ui icon button basic blue right floated" href="'.jpcrm_esc_link('view',$id,'zerobs_company').'"><i class="angle left icon"></i> '.__( 'Back',"zero-bs-crm").'</a>';
    }	

    // v3.0+
    if (isset($_GET['zbsid']) && !empty($_GET['zbsid'])) {
    	$title = __("Edit ".jpcrm_label_company(),"zero-bs-crm");
    	$id = (int)sanitize_text_field($_GET['zbsid']);
    	//$filterStr .= '<a class="ui icon button basic blue right floated" href="'.jpcrm_esc_link('view',$id,'zerobs_company').'"><i class="angle left icon"></i> '.__( 'Back',"zero-bs-crm").'</a>';
		$filterStr = '<div class="ui items right floated" style="margin:0">'.zeroBSCRM_getObjNav($id,'edit',ZBS_TYPE_COMPANY).'</div>';

    }

	// output
	$zbs->learn_menu->render_generic_learn_menu( $title,'',$filterStr,true,$title,$content, $links['learn'], $links['img'], $links['vid'],'' );


}

#} Forms - LIST, EDIT and NEW
function jpcrm_formlist_learn_menu(){

    global $zbs;

    $title      = __("Forms","zero-bs-crm");
	$addNew = '';
	if ( zeroBSCRM_permsQuotes() ) {
            $addNew = ' <a href="' . jpcrm_esc_link('create',-1,'zerobs_form',false) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>';
	} 
    $content    = $zbs->learn_menu->get_content_body( 'manageformscrm' );
    $links      = $zbs->learn_menu->get_content_urls( 'manageformscrm' );

	#} MSTODO - Learn hidden 
	$hideLearn = true;
	$alsoCo = '';
	
	#} ? Yup ?
    $hopscotchCustomJS = 'if (typeof hopscotch != "undefined" && (hopscotch.getState() === "zbs-welcome-tour:9" || hopscotch.getState() === "zbs-welcome-tour:10" || hopscotch.getState() === "zbs-welcome-tour:11")) {hopscotch.startTour(window.zbsTour);}';

    #} Filters
	$filterStr = '<a href="' .admin_url('admin.php?page='.$zbs->slugs['manageformscrm'] ) . '" id="zbs-listview-clearfilters" class="ui button red tiny hidden zbs-hide"><i class="undo icon"></i>'.__(" Clear Filters","zero-bs-crm").'</a><div id="zbs-listview-biline" class="hidden"></div>';
        
    #} And allow peeps also to toggl side bar:
    $filterStr .= '<button class="ui icon button basic right floated" type="button" id="zbs-toggle-sidebar"><i class="toggle off icon"></i></button>';


    if ( zeroBSCRM_isZBSAdminOrAdmin() ) {

    	// Column manager
        $filterStr .= '<button class="ui icon button blue right floated" type="button" id="zbs-open-column-manager"><i class="options icon"></i></button>';

        // Settings link
        $settingLink = zeroBSCRM_getAdminURL($zbs->slugs['settings']) . '&tab=forms';
        $filterStr .= '<a href="' . $settingLink . '" class="ui icon button right floated" title="'.__( 'Forms settings','zero-bs-crm').'"><i class="cogs icon"></i></a>';
    }

	// output
	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,$hideLearn,$title,$content,$links['learn'],$links['img'],$links['vid'],$hopscotchCustomJS);

}


function jpcrm_taskedit_learn_menu(){

	global $zbs;

    $title      = __( 'Edit Task','zero-bs-crm' );
    $addNew 	= '<div id="zbs-event-learn-nav"></div>';
    $addNew     .= ' <a href="' . jpcrm_esc_link('create',-1,'zerobs_event',false) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>';
	$addNew 	.= ' <a href="' . jpcrm_esc_link($zbs->slugs['manage-events']) . '" class="button ui orange tiny zbs-add-new zbs-add-new-task"><i class="calendar alternate outline icon"></i> ' . __( 'View Calendar',"zero-bs-crm") . '</a>';
    $addNew 	.= ' <a href="' . jpcrm_esc_link($zbs->slugs['manage-events-list']) . '" class="button ui orange tiny zbs-add-new zbs-add-new-task"><i class="list alternate outline icon"></i> ' . __( 'View List',"zero-bs-crm") . '</a>';
	$content    = $zbs->learn_menu->get_content_body( 'taskedit' );
    $links      = $zbs->learn_menu->get_content_urls( 'taskedit' );	
	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,'',true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );
}




function jpcrm_tasklistview_learn_menu(){

	global $zbs;

    $title      = __( 'Task List','zero-bs-crm' );
    $addNew 	= '<div id="zbs-event-learn-nav"></div>';
    $addNew     .= ' <a href="' . jpcrm_esc_link('create',-1,'zerobs_event',false) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>';
	$addNew 	.= ' <a href="' . jpcrm_esc_link($zbs->slugs['manage-events']) . '" class="button ui orange tiny zbs-add-new zbs-add-new-task"><i class="calendar alternate outline icon"></i> ' . __( 'View Calendar',"zero-bs-crm") . '</a>';
	$content    = $zbs->learn_menu->get_content_body( 'manage-events-list' );
    $links      = $zbs->learn_menu->get_content_urls( 'manage-events-list' );


    // And allow peeps also to toggl side bar:
    $filterStr = '<button class="ui icon button basic right floated" type="button" id="zbs-toggle-sidebar"><i class="toggle off icon"></i></button>';

    // Admins can change columns
    $filterStr .= '<button class="ui icon button blue right floated" type="button" id="zbs-open-column-manager"><i class="options icon"></i></button>';
    
	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );

}



function jpcrm_tasknew_learn_menu(){

	global $zbs;

    $title      = __( 'New Task','zero-bs-crm' );
	$addNew 	= ' <a href="' . jpcrm_esc_link($zbs->slugs['manage-events']) . '" class="button ui orange tiny zbs-add-new zbs-add-new-task"><i class="calendar alternate outline icon"></i> ' . __( 'View Calendar',"zero-bs-crm") . '</a>';
    $addNew 	.= ' <a href="' . jpcrm_esc_link($zbs->slugs['manage-events-list']) . '" class="button ui orange tiny zbs-add-new zbs-add-new-task"><i class="list alternate outline icon"></i> ' . __( 'View List',"zero-bs-crm") . '</a>';
    $content    = $zbs->learn_menu->get_content_body( 'tasknew' );
    $links      = $zbs->learn_menu->get_content_urls( 'tasknew' );	
	$zbs->learn_menu->render_generic_learn_menu( $title, $addNew,'',true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );

}



function jpcrm_quotelist_learn_menu(){

    global $zbs;

    $title      = __( 'Manage Quotes','zero-bs-crm' );
    $addNew     = '';
    $content    = $zbs->learn_menu->get_content_body( 'managequotes' );
    $links      = $zbs->learn_menu->get_content_urls( 'managequotes' );	

	$addNew = '';
    #} Add new?
    if ( zeroBSCRM_permsCustomers() ) {
        $addNew = ' <a href="' . jpcrm_esc_link('create',-1,'zerobs_quote',false) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>';
    }  

	$hideLearn = true;
	$alsoCo = '';
	
	#} ? Yup ?
    $hopscotchCustomJS = 'if (typeof hopscotch != "undefined" && (hopscotch.getState() === "zbs-welcome-tour:9" || hopscotch.getState() === "zbs-welcome-tour:10" || hopscotch.getState() === "zbs-welcome-tour:11")) {hopscotch.startTour(window.zbsTour);}';

    #} Filters
	$filterStr = '<a href="' .admin_url('admin.php?page='.$zbs->slugs['managequotes'] ) . '" id="zbs-listview-clearfilters" class="ui button red tiny hidden"><i class="undo icon"></i>'.__(" Clear Filters","zero-bs-crm").'</a><div id="zbs-listview-biline" class="hidden"></div>';

    #} And allow peeps also to toggl side bar:
    $filterStr .= '<button class="ui icon button basic right floated" type="button" id="zbs-toggle-sidebar"><i class="toggle off icon"></i></button>';

    #} Admins can change columns! (globally - should each person have own views?
    if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
        $filterStr .= '<button class="ui icon button blue right floated" type="button" id="zbs-open-column-manager"><i class="options icon"></i></button>';

        // Settings link
        $settingLink = zeroBSCRM_getAdminURL($zbs->slugs['settings']) . '&tab=quotebuilder';
        $filterStr .= '<a href="' . $settingLink . '" class="ui icon button right floated" title="'.__( 'Quotes settings','zero-bs-crm').'"><i class="cogs icon"></i></a>';
    }
    
	// output
	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,$hideLearn,$title,$content,$links['learn'],$links['img'],$links['vid'],$hopscotchCustomJS);

}


function jpcrm_translist_learn_menu(){

	global $zbs;

    $title      = __( 'Transaction List','zero-bs-crm' );
    #} Add new?
    $addNew = ''; if ( zeroBSCRM_permsCustomers() ) {
        $addNew = ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_transaction', false ) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>';
    }
    $content    = $zbs->learn_menu->get_content_body( 'managetransactions' );
    $links      = $zbs->learn_menu->get_content_urls( 'managetransactions' );

    $filterStr = '<a href="' . jpcrm_esc_link( $zbs->slugs['managetransactions'] ) . '" id="zbs-listview-clearfilters" class="ui button red tiny hidden"><i class="undo icon"></i>'.__(" Clear Filters","zero-bs-crm").'</a><div id="zbs-listview-biline" class="hidden"></div>';
    $filterStr .= '<button class="ui icon button basic right floated" type="button" id="zbs-toggle-sidebar"><i class="toggle off icon"></i></button>';

    if ( zeroBSCRM_isZBSAdminOrAdmin() ) {

    	// Column manager
        $filterStr .= '<button class="ui icon button blue right floated" type="button" id="zbs-open-column-manager"><i class="options icon"></i></button>';

        // Settings link
        $settingLink = zeroBSCRM_getAdminURL($zbs->slugs['settings']) . '&tab=transactions';
        $filterStr .= '<a href="' . $settingLink . '" class="ui icon button right floated" title="'.__( 'Transaction settings','zero-bs-crm').'"><i class="cogs icon"></i></a>';
    }
	
    $zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );
}



function jpcrm_transedit_learn_menu(){

	global $zbs;

    $title      = __( 'Edit Transaction','zero-bs-crm' );
    #} Add new
    $addNew = '<div id="zbs-transaction-learn-nav"></div>'; if ( zeroBSCRM_permsTransactions() ) {
        $addNew = ' <a href="' . jpcrm_esc_link( 'create', -1, ZBS_TYPE_TRANSACTION, false ) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>';
    }
    $content    = $zbs->learn_menu->get_content_body( 'transedit' );
    $links      = $zbs->learn_menu->get_content_urls( 'transedit' );	
	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,'',true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );

}


function jpcrm_invoicelist_learn_menu(){

	global $zbs; 
	
    $title      = __( 'Manage Invoices','zero-bs-crm' );
    $addNew = '';
    if ( zeroBSCRM_permsInvoices() ) {
        $addNew =  '<a href="' . jpcrm_esc_link('create',-1,'zerobs_invoice',false) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>';
    }
    $content    = $zbs->learn_menu->get_content_body( 'manageinvoices' );
    $links      = $zbs->learn_menu->get_content_urls( 'manageinvoices' );

    #} Filters
	$filterStr = '<a href="' .admin_url('admin.php?page='.$zbs->slugs['manageinvoices'] ) . '" id="zbs-listview-clearfilters" class="ui button red tiny hidden"><i class="undo icon"></i>'.__(" Clear Filters","zero-bs-crm").'</a><div id="zbs-listview-biline" class="hidden"></div>';

    
    #} And allow peeps also to toggl side bar:
    $filterStr .= '<button class="ui icon button basic right floated" type="button" id="zbs-toggle-sidebar"><i class="toggle off icon"></i></button>';

    #} Admins can change columns! (globally - should each person have own views?
    if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
        $filterStr .= '<button class="ui icon button blue right floated" type="button" id="zbs-open-column-manager"><i class="options icon"></i></button>';

        // Settings link
        $settingLink = zeroBSCRM_getAdminURL( $zbs->slugs['settings'] ) . '&tab=invbuilder';
        $filterStr .= '<a href="' . $settingLink . '" class="ui icon button right floated" title="'.__( 'Invoice settings','zero-bs-crm').'"><i class="cogs icon"></i></a>';
    } 

	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );

}



function jpcrm_invoiceedit_learn_menu(){

	global $zbs;
	
	$filterStr = '';
    $title      = __( 'Edit Invoice','zero-bs-crm' );
    
    $alsoInAddNew = '';
	// if admin, show settings links too
	// (these get appended to the zbs-invoice-learn-nav) so that they can be shared with the js-added nav
    if (zeroBSCRM_isZBSAdminOrAdmin()){ 

    	global $zbs;
        $alsoInAddNew .= '<a class="ui icon mini button" target="_blank" href="'.admin_url("admin.php?page=" . $zbs->slugs['settings']) . "&tab=invbuilder".'" title="'.__( 'Invoice Settings','zero-bs-crm').'"><i class="options icon"></i></a>';
        $alsoInAddNew .= '<a class="ui icon mini button" target="_blank" href="'.admin_url("admin.php?page=" . $zbs->slugs['settings']) . "&tab=bizinfo".'" title="'.__( 'Business Settings','zero-bs-crm').'"><i class="building icon"></i></a>';		        
    }

    $addNew     = '<div id="zbs-invoice-learn-nav">'.$alsoInAddNew.'</div>'; // js adds/edits
    if ( zeroBSCRM_permsInvoices() ) {
        $addNew .=  '<a href="' . jpcrm_esc_link('create',-1,'zerobs_invoice',false) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>';
    }
    $content    = $zbs->learn_menu->get_content_body( 'invoiceedit' );
    $links      = $zbs->learn_menu->get_content_urls( 'invoiceedit' );	

	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );

}


function jpcrm_companylist_learn_menu(){

	global $zbs;
	
    $title      = __( 'Manage '.jpcrm_label_company(true),'zero-bs-crm' );
    $addNew = '';
    if ( zeroBSCRM_permsInvoices() ) {
        $addNew =  '<a href="' .jpcrm_esc_link('create',-1,'zerobs_company',false) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>';
    }
    $filterStr = '';
    $content    = $zbs->learn_menu->get_content_body( 'managecompanies' );
    $links      = $zbs->learn_menu->get_content_urls( 'managecompanies' );	

    // filter strings
    $filterStr = '<a href="' . jpcrm_esc_link( $zbs->slugs['managecompanies'] ) . '" id="zbs-listview-clearfilters" class="ui button red tiny hidden zbs-hide"><i class="undo icon"></i>'.__(" Clear Filters","zero-bs-crm").'</a><div id="zbs-listview-biline" class="hidden"></div>';

    #} And allow peeps also to toggl side bar:
    $filterStr .= '<button class="ui icon button basic right floated" type="button" id="zbs-toggle-sidebar"><i class="toggle off icon"></i></button>';

    #} Admins can change columns! (globally - should each person have own views?
    if (zeroBSCRM_isZBSAdminOrAdmin()){ 
        $filterStr .= '<button class="ui icon button blue right floated" type="button" id="zbs-open-column-manager"><i class="options icon"></i></button>';

        // Settings link
        $settingLink = zeroBSCRM_getAdminURL( $zbs->slugs['settings'] ) . '&tab=companies';
        $filterStr .= '<a href="' . $settingLink . '" class="ui icon button right floated" title="'.__( 'Settings','zero-bs-crm').'"><i class="cogs icon"></i></a>';
    } 

    $zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );
    
}



function jpcrm_tasklist_learn_menu(){

	global $zbs;

    $title      = __( 'Task Calendar','zero-bs-crm' );
    $addNew 	= ' <a href="' . jpcrm_esc_link('create',-1,'zerobs_event',false) . '" class="button ui blue tiny zbs-add-new zbs-add-new-task">' . __( 'Add New',"zero-bs-crm") . '</a>';
    $addNew 	.= ' <a href="' . jpcrm_esc_link($zbs->slugs['manage-events-list']) . '" class="button ui orange tiny zbs-add-new zbs-add-new-task"><i class="list alternate outline icon"></i> ' . __( 'List View',"zero-bs-crm") . '</a>'; 
	$content    = $zbs->learn_menu->get_content_body( 'manage-events' );
    $links      = $zbs->learn_menu->get_content_urls( 'manage-events' );	

    // show "who's calendar" top right?
    // adapted from what was inline output in List.Events.php
    global $zbs;
    $showEventsUsers = false;
    $currentEventUserID = false; if (isset($_GET['zbsowner']) && !empty($_GET['zbsowner'])) $currentEventUserID = (int)sanitize_text_field($_GET['zbsowner']);
    $zbsEventsUsers = zeroBS_getPossibleCustomerOwners();
    if (count($zbsEventsUsers) > 0 && zeroBSCRM_isZBSAdminOrAdmin()) {
        $showEventsUsers = true;
    } else {
        $taskOwnershipOn = zeroBSCRM_getSetting('taskownership' );
        if ($taskOwnershipOn == "1") {
            $currentEventUserID = get_current_user_id();
        }
    }
    $eventUsersHTML = '';
    if ($showEventsUsers){ 
    	$eventUsersHTML = '<div style="float:right;margin-right: 1em;">'; // "width: 200px;
            $eventUsersHTML .= '<select class="form-control" id="zerobscrm-owner" name="zerobscrm-owner">';
        	    $eventUsersHTML .= '<option value="-1">'.__( 'All Users',"zero-bs-crm").'</option>';
                    if (count($zbsEventsUsers) > 0) 
                    	foreach ($zbsEventsUsers as $eventsUser){

                                $eventUsersHTML .= '<option value="'.$eventsUser->ID.'"';
                                if ($eventsUser->ID == $currentEventUserID) $eventUsersHTML .= ' selected="selected"';
                                $eventUsersHTML .= '>'.esc_html( $eventsUser->display_name ).'</option>';

                   		}
            $eventUsersHTML .= '</select>';
        $eventUsersHTML .= '</div> ';

        $eventUsersHTML .= '<script type="text/javascript">';
            $eventUsersHTML .= 'var zbsExistingEventsUserID = '.((!empty($currentEventUserID)) ? $currentEventUserID : '-1').';';
            $eventUsersHTML .= "jQuery('#zerobscrm-owner').on('change',function(){";
                $eventUsersHTML .= 'var v = jQuery(this).val();';
                $eventUsersHTML .= "if (v != '' && v != window.zbsExistingEventsUserID){";
					$eventUsersHTML .= "var newURL = '".jpcrm_esc_link($zbs->slugs['manage-events'])."';";
                    $eventUsersHTML .= "if (v != -1) newURL += '&zbsowner=' + jQuery(this).val();";
					// $eventUsersHTML .= "// reload with get var";
						$eventUsersHTML .= "window.location = newURL;";
                    $eventUsersHTML .= "}";
                $eventUsersHTML .= "});";
		$eventUsersHTML .= "</script>";

    } 


	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$eventUsersHTML,true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );

}


					
function jpcrm_segmentlist_learn_menu(){    

    global $zbs;
    
    $title      = __( 'Segment List','zero-bs-crm' );
    $content    = $zbs->learn_menu->get_content_body( 'segments' );
    $links      = $zbs->learn_menu->get_content_urls( 'segments' );	
   
    $addNew = ''; if ( zeroBSCRM_permsCustomers() ) {
        $addNew = ' <a href="' . jpcrm_esc_link( 'create', -1, 'segment', false ) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>';
    }

    // filter strings
    $filterStr = '<a href="' .zeroBSCRM_getAdminURL($zbs->slugs['managecontacts'] ) . '" id="zbs-listview-clearfilters" class="ui button red tiny hidden"><i class="undo icon"></i>'.__(" Clear Filters","zero-bs-crm").'</a><div id="zbs-listview-biline" class="hidden"></div>';

    // And allow peeps also to toggl side bar:
    $filterStr .= '<button class="ui icon button basic right floated" type="button" id="zbs-toggle-sidebar"><i class="toggle off icon"></i></button>';

    // Admins can change columns! (globally - should each person have own views?
    if (current_user_can('administrator')){ 
        $filterStr .= '<button class="ui icon button blue right floated" type="button" id="zbs-open-column-manager"><i class="options icon"></i></button>';
    }   

	// output
	$zbs->learn_menu->render_generic_learn_menu( 
        $title,
        $addNew,
        $filterStr,
        true,
        $title,
        $content,
        $links['learn'],
        $links['img'],
        $links['vid'],
        '',
        'z-index: 9999999;',
        __( "Introduction to Tags and Segments", 'zero-bs-crm' ),
        'pie chart' 
    );

}


	
// for new + edit menu :)
function jpcrm_segmentedit_learn_menu(){

	global $zbs;

	$title = __("Segments","zero-bs-crm");
    $newSegment = true;
    $content    = $zbs->learn_menu->get_content_body( 'segmentedit' );
    $links      = $zbs->learn_menu->get_content_urls( 'segmentedit' );	


    $zbsid = $zbs->zbsvar('zbsid' );
    if (isset($zbsid) && !empty($zbsid) && $zbsid !== -1) {
    	$title = __("Edit Segment","zero-bs-crm");  
    	$newSegment = false; 
    }

    $filterStr = '<button class="ui icon small button positive right floated';
    	if ($newSegment) $filterStr .= ' hidden';
    $filterStr .= '" type="button" id="zbs-segment-edit-act-save">'.__( 'Save Segment',"zero-bs-crm").'  <i class="save icon"></i></button>';
    $filterStr .= '<button class="ui button small right floated was-inverted basic" type="button" id="zbs-segment-edit-act-back">'.__( 'Back to List',"zero-bs-crm").'</button>';

	// output
	$zbs->learn_menu->render_generic_learn_menu( 
        $title,
        '',
        $filterStr,
        true,
        $title,
        $content,
        $links['learn'],
        $links['img'],
        $links['vid'],
        '',
        '',
        '',
        'pie chart' 
    );


}


function jpcrm_settings_learn_menu(){
    
    global $zbs;

	// wh temp hack for mail delivery learn
    $title = __("Settings","zero-bs-crm");
    
    if ( current_user_can('admin_zerobs_manage_options') ) {
        $addNew =  ' <a href="' . zeroBSCRM_getAdminURL($zbs->slugs['extensions'])  . '#free-extensions-tour" class="button ui orange tiny zbs-add-new" id="manage-features">' . __( 'Manage Features',"zero-bs-crm") . '</a>';
    }

	$tab = '';
	if (isset($_GET['tab']) && $_GET['tab'] == 'maildelivery'){
		$title .= ': '.__("Mail Delivery","zero-bs-crm");
		$tab = 'maildelivery';
	}
	if (isset($_GET['tab']) && $_GET['tab'] == 'mail'){
		$title .= ': '.__("Mail","zero-bs-crm");
		$tab = 'mail';
	}

    #} If filtering this, be careful as it changes based on the tab use $_GET['tab'] in filter 
    switch ($tab){
        case 'mail':
            $content    = $zbs->learn_menu->get_content_body( 'mail' );
            $links      = $zbs->learn_menu->get_content_urls( 'mail' );	
        break;
        case 'maildelivery':
            $content    = $zbs->learn_menu->get_content_body( 'maildelivery' );
            $links      = $zbs->learn_menu->get_content_urls( 'maildelivery' );	
        break;
        default: 
            $content    = $zbs->learn_menu->get_content_body( 'settings' );
            $links      = $zbs->learn_menu->get_content_urls( 'settings' );	
        break;
    }

    $hopscotchJS = 'if (typeof hopscotch != "undefined" && (hopscotch.getState() === "zbs-welcome-tour:10:5")) { hopscotch.startTour(window.zbsTour);}';

	
	// output
	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,'',true,$title,$content,$links['learn'],$links['img'],$links['vid'],$hopscotchJS);

}


function jpcrm_emails_learn_menu(){

	global $zbs;

    $title      = __( 'Emails','zero-bs-crm' );
	$addNew     = '';
	$filterStr = '<a href="'.admin_url('admin.php?page=zerobscrm-send-email').'" class="ui button blue tiny zbs-inbox-compose-email"><i class="ui icon pencil"></i> ' . __("Compose Mail", "zero-bs-crm") . '</a>';
    $content    = $zbs->learn_menu->get_content_body( 'emails' );
    $links      = $zbs->learn_menu->get_content_urls( 'emails' );	
	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,true,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );
}


// Generic Delete menu
function jpcrm_delete_learn_menu(){

	global $zbs;

    $title        = __( 'Delete','zero-bs-crm' );
    $addNew = '';
    $content      = $zbs->learn_menu->get_content_body( 'delete' );
    $links        = $zbs->learn_menu->get_content_urls( 'delete' );	

	$zbstype = -1;
    if (isset($_GET['zbstype']) && !empty($_GET['zbstype'])) {

    	// type specific :)
    	$zbstype = $_GET['zbstype'];

    		// try a conversion
    		$objTypeID = $zbs->DAL->objTypeID($zbstype);

    		if ($objTypeID > 0){

    			// got a type :D
    			$singular = $zbs->DAL->typeStr($objTypeID);
		    	$title = __("Delete","zero-bs-crm").' '.$singular;
		        $content      = $zbs->learn_menu->get_content_body( $zbstype.'delete' ); // e.g. contactdelete
		        $links        = $zbs->learn_menu->get_content_urls( $zbstype.'delete' );

		    }
    }

    $metaboxMgrStr = '';
 
 	// for now...
 	$showLearn = false; 
	
	$filterStr = '';

	// output
	$zbs->learn_menu->render_generic_learn_menu( $title,$addNew,$filterStr,$showLearn,$title,$content,$links['learn'],$links['img'],$links['vid'],'' );


}


function jpcrm_dashboard_learn_menu(){

	global $zbs;

    $title = __( "Dashboard", 'zero-bs-crm' );
    $content      = $zbs->learn_menu->get_content_body( 'dash' );
    $links        = $zbs->learn_menu->get_content_urls( 'dash' );	

	$zbs->learn_menu->render_generic_learn_menu( $title,'','',true,$title,$content,$links['learn'],$links['img'],$links['vid'],' //none','z-index: 9999999;' );

}


function jpcrm_notifications_learn_menu(){

	global $zbs;

    $title = __( "Notifications", 'zero-bs-crm' );
    $content      = $zbs->learn_menu->get_content_body( 'notifications' );
    $links        = $zbs->learn_menu->get_content_urls( 'notifications' );	

	$zbs->learn_menu->render_generic_learn_menu( $title,'','',true,$title,$content,$links['learn'],$links['img'],$links['vid'],'if (typeof hopscotch != "undefined" && hopscotch.getState() === "zbs-welcome-tour:4") { hopscotch.startTour(window.zbsTour);}' );

}


function jpcrm_emailtemplates_learn_menu(){

	global $zbs;

    // discern subpage
    $page = 'recent-activity'; 
    $title = __('Recent Email Activity','zero-bs-crm');
    $content   = $zbs->learn_menu->get_content_body( 'recent-emails' );
    $links     = $zbs->learn_menu->get_content_urls( 'recent-emails' );

    if (isset($_GET['zbs_template_editor']) && !empty($_GET['zbs_template_editor'])) {
        $page     = 'template-editor';
        $title    = __('Template Settings','zero-bs-crm');
        $content  = $zbs->learn_menu->get_content_body( 'template-settings' );
        $links     = $zbs->learn_menu->get_content_urls( 'template-settings' );
    }
    if (isset($_GET['zbs_template_id']) && !empty($_GET['zbs_template_id'])){
        $page      = 'email-templates';
        $title     = __('System Email Templates','zero-bs-crm');
        $content   = $zbs->learn_menu->get_content_body( 'email-templates' );
        $links     = $zbs->learn_menu->get_content_urls( 'email-templates' );
    } 
	

	$zbs->learn_menu->render_generic_learn_menu( $title, '', '', true, $title, $content, $links['learn'], $links['img'], $links['vid'], '' );

}
