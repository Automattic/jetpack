<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 26/05/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

/* ================================================================================
=============================== CONTACTS ======================================= */

function zeroBSCRM_render_customerslist_page(){

    global $zbs;

    #} has no sync ext? Sell them
    $upsellBoxHTML = '';
    
    #} Extrajs:
    $status_array = $zbs->settings->get('customisedfields')['customers']['status'];
    $statuses = is_array($status_array) && isset($status_array[1]) ? explode(',',$status_array[1]) : array();
    $extraJS = 'var zbsStatusesForBulkActions = ' . json_encode($statuses) . ';'; 
        
    #} Messages:
    #} All messages need params to match this func: 
    #} ... zeroBSCRM_UI2_messageHTML($msgClass='',$msgHeader='',$msg='',$iconClass='',$id='')
    $messages = array(); 

    $list = new zeroBSCRM_list(array(

            'objType'       => 'customer',
            'singular'      => __('Contact',"zero-bs-crm"),
            'plural'        => __('Contacts',"zero-bs-crm"),
            'tag'           => 'zerobscrm_customertag',
            'postType'      => 'zerobs_customer',
            'postPage'      => 'manage-customers',
            'langLabels'    => array(

                
                // bulk action labels
                'deletecontacts' => __('Delete Contact(s)',"zero-bs-crm"),
                'merge' => __('Merge Contacts',"zero-bs-crm"),
                'export' => __('Export Contact(s)',"zero-bs-crm"),
                'changestatus' => __('Change Status',"zero-bs-crm"),


                //bulk actions - change status
                'statusupdated' => __('Statuses Updated',"zero-bs-crm"),
                'statusnotupdated' => __('Could not update statuses!',"zero-bs-crm"),
 
                // bulk actions - contact deleting
				'andthese'             => __( 'Shall I also delete the associated Invoices, Quotes, Transactions, and Tasks?', 'zero-bs-crm' ),
                'contactsdeleted' => __('Your contact(s) have been deleted.',"zero-bs-crm"),
                'notcontactsdeleted' => __('Your contact(s) could not be deleted.',"zero-bs-crm"),

                // bulk actions - add/remove tags
                'notags' => __('You do not have any tags, do you want to',"zero-bs-crm").' <a target="_blank" href="'.jpcrm_esc_link('tags',-1,'zerobs_customer',false,'contact').'">'.__('Add a tag',"zero-bs-crm").'</a>',                
                
                // bulk actions - merge 2 records
                'areyousurethesemerge' => __('Are you sure you want to merge these two contacts into one record? There is no way to undo this action.',"zero-bs-crm").'<br />',
                'whichdominant' => __('Which is the "master" record (main record)?',"zero-bs-crm"),

                'contactsmerged' => __('Contacts Merged',"zero-bs-crm"),
                'contactsnotmerged' => __('Contacts could not be successfully merged',"zero-bs-crm"),

                // tel
                'telhome' => __('Home',"zero-bs-crm"),
                'telwork' => __('Work',"zero-bs-crm"),
                'telmob' => __('Mobile',"zero-bs-crm")

            ),
            'bulkActions'   => array('changestatus','delete','addtag','removetag','merge','export'),
            'unsortables'   => array('tagged','editlink','phonelink'),
            'extraBoxes' => $upsellBoxHTML,
            'extraJS'   => $extraJS,
            'messages'  => $messages
    ));

    $list->drawListView();

}

/* ============================== / CONTACTS ====================================== 
================================================================================ */




/* ================================================================================
=============================== COMPANIES ====================================== */

function zeroBSCRM_render_companyslist_page(){

    global $zbs;

    $list = new zeroBSCRM_list(array(

            'objType'       => 'company',
            'singular'      => jpcrm_label_company(),
            'plural'        => jpcrm_label_company(true),
            'tag'           => 'zerobscrm_companytag',
            'postType'      => 'zerobs_company',
            'postPage'      => 'manage-companies',
            'langLabels'    => array(

                // bulk action labels
                'deletecompanys' => __('Delete '.jpcrm_label_company().'(s)',"zero-bs-crm"),
                'addtags' => __('Add tag(s)',"zero-bs-crm"),
                'removetags' => __('Remove tag(s)',"zero-bs-crm"),
                'export' => __('Export',"zero-bs-crm"),

                // bulk actions - company deleting
				'andthese'           => __( 'Shall I also delete the associated Contacts, Invoices, Quotes, Transactions, and Tasks? (This cannot be undone!)', 'zero-bs-crm' ),
                'companysdeleted' => __('Your company(s) have been deleted.',"zero-bs-crm"),
                'notcompanysdeleted' => __('Your company(s) could not be deleted.',"zero-bs-crm"),

                // bulk actions - add/remove tags
                'notags' => __('You do not have any tags, do you want to',"zero-bs-crm").' <a target="_blank" href="'.jpcrm_esc_link('tags',-1,'zerobs_company',false,'company').'">'.__('Add a tag',"zero-bs-crm").'</a>',

            ),
            'bulkActions'   => array('delete','addtag','removetag','export'),
            //default 'sortables'     => array('id'),
            //default 'unsortables'   => array('tagged','latestlog','editlink','phonelink')
    ));

    $list->drawListView();

}

/* ============================== / COMPANIES ===================================== 
================================================================================ */




/* ================================================================================
=============================== QUOTES ========================================= */

function zeroBSCRM_render_quoteslist_page(){

    $list = new zeroBSCRM_list(array(

            'objType'       => 'quote',
            'singular'      => __('Quote',"zero-bs-crm"),
            'plural'        => __('Quotes',"zero-bs-crm"),
            'tag'           => '',
            'postType'      => 'zerobs_quote',
            'postPage'      => 'manage-quotes',
            'langLabels'    => array(

                // bulk action labels
                'markaccepted' => __('Mark Accepted',"zero-bs-crm"),
                'markunaccepted' => __('Unmark Accepted',"zero-bs-crm"),
                'delete' => __('Delete Quote(s)',"zero-bs-crm"),
                'export' => __('Export Quote(s)',"zero-bs-crm"),


                // bulk actions - quote deleting
				'andthese'                 => __( 'Shall I also delete the associated Invoices, Quotes, Transactions, and Tasks?', 'zero-bs-crm' ),
                'quotesdeleted' => __('Your quote(s) have been deleted.',"zero-bs-crm"),
                'notquotesdeleted' => __('Your quote(s) could not be deleted.',"zero-bs-crm"),

                // bulk actions - quote accepting
                'acceptareyousurequotes' => __('Are you sure you want to mark these quotes as accepted?',"zero-bs-crm"),
                'acceptdeleted' => __('Quote(s) Accepted',"zero-bs-crm"),
                'acceptquotesdeleted' => __('Your quote(s) have been marked accepted.',"zero-bs-crm"),
                'acceptnotdeleted' => __('Could not mark accepted!',"zero-bs-crm"),
                'acceptnotquotesdeleted' => __('Your quote(s) could not be marked accepted.',"zero-bs-crm"),

                // bulk actions - quote un accepting
                'unacceptareyousurethese' => __('Are you sure you want to mark these quotes as unaccepted?',"zero-bs-crm"),
                'unacceptdeleted' => __('Quote(s) Unaccepted',"zero-bs-crm"),
                'unacceptquotesdeleted' => __('Your quote(s) have been marked unaccepted.',"zero-bs-crm"),
                'unacceptnotdeleted' => __('Could not mark unaccepted!',"zero-bs-crm"),
                'unacceptnotquotesdeleted' => __('Your quote(s) could not be marked unaccepted.',"zero-bs-crm"),

                // bulk actions - add/remove tags
                'notags' => __('You do not have any tags, do you want to',"zero-bs-crm").' <a target="_blank" href="'.jpcrm_esc_link('tags',-1,'zerobs_quote',false,'quote').'">'.__('Add a tag',"zero-bs-crm").'</a>',

            ),
            'bulkActions'   => array('markaccepted','markunaccepted','addtag','removetag','delete','export'),
            //default 'sortables'     => array('id'),
            //default 'unsortables'   => array('tagged','latestlog','editlink','phonelink')
    ));

    $list->drawListView();

}

/* =============================== / QUOTES ======================================= 
================================================================================ */




/* ================================================================================
=============================== INVOICES ======================================= */

/**
 * Renders the html for the invoices list.
 *
 * @return void
 */
function zeroBSCRM_render_invoiceslist_page() {
	global $zbs;

	$upsell_box_html = '';
	$bundle          = false;
	if ( $zbs->hasEntrepreneurBundleMin() ) {
		$bundle = true;
	}

	if ( ! zeroBSCRM_isExtensionInstalled( 'invpro' ) ) {
		if ( ! $bundle ) {
			$upsell_box_html  = '<!-- Inv PRO box --><div class="">';
			$upsell_box_html .= '<h4>Invoicing Pro:</h4>';

			$up_title  = __( 'Supercharged Invoicing', 'zero-bs-crm' );
			$up_desc   = __( 'Get more out of invoicing, like accepting online payments!:', 'zero-bs-crm' );
			$up_button = __( 'Get Invoicing Pro', 'zero-bs-crm' );
			$up_target = $zbs->urls['invpro'];

			$upsell_box_html .= zeroBSCRM_UI2_squareFeedbackUpsell( $up_title, $up_desc, $up_button, $up_target );
			$upsell_box_html .= '</div><!-- / Inv PRO box -->';
		} else {
			$upsell_box_html  = '<!-- Inv PRO box --><div class="">';
			$upsell_box_html .= '<h4>Invoicing Pro:</h4>';

			$up_title  = __( 'Supercharged Invoicing', 'zero-bs-crm' );
			$up_desc   = __( 'You have Invoicing Pro available because you are using a bundle. Please download and install from your account:', 'zero-bs-crm' );
			$up_button = __( 'Your Account', 'zero-bs-crm' );
			$up_target = $zbs->urls['account'];

			$upsell_box_html .= zeroBSCRM_UI2_squareFeedbackUpsell( $up_title, $up_desc, $up_button, $up_target );
			$upsell_box_html .= '</div><!-- / Inv PRO box -->';
		}
	}

	$list = new zeroBSCRM_list(
		array(
			'objType'     => 'invoice',
			'singular'    => __( 'Invoice', 'zero-bs-crm' ),
			'plural'      => __( 'Invoices', 'zero-bs-crm' ),
			'tag'         => '',
			'postType'    => 'zerobs_invoice',
			'postPage'    => 'manage-invoices',
			'langLabels'  =>
				array(
					// bulk action labels
					'delete'                   => __( 'Delete Invoice(s)', 'zero-bs-crm' ),
					'export'                   => __( 'Export Invoice(s)', 'zero-bs-crm' ),
					// bulk actions - invoice deleting
					'invoicesdeleted'          => __( 'Your invoice(s) have been deleted.', 'zero-bs-crm' ),
					'notinvoicesdeleted'       => __( 'Your invoice(s) could not be deleted.', 'zero-bs-crm' ),
					// bulk actions - invoice status update
					'statusareyousurethese'    => __( 'Are you sure you want to change the status on marked invoice(s)?', 'zero-bs-crm' ),
					'statusupdated'            => __( 'Invoice(s) Updated', 'zero-bs-crm' ),
					'statusinvoicesupdated'    => __( 'Your invoice(s) have been updated.', 'zero-bs-crm' ),
					'statusnotupdated'         => __( 'Could not update invoice!', 'zero-bs-crm' ),
					'statusnotinvoicesupdated' => __( 'Your invoice(s) could not be updated', 'zero-bs-crm' ),
					'statusdraft'              => __( 'Draft', 'zero-bs-crm' ),
					'statusunpaid'             => __( 'Unpaid', 'zero-bs-crm' ),
					'statuspaid'               => __( 'Paid', 'zero-bs-crm' ),
					'statusoverdue'            => __( 'Overdue', 'zero-bs-crm' ),
					'statusdeleted'            => __( 'Deleted', 'zero-bs-crm' ),
					// bulk actions - add/remove tags
					'notags'                   => __( 'You do not have any tags, do you want to', 'zero-bs-crm' ) . ' <a target="_blank" href="' . jpcrm_esc_link( 'tags', -1, 'zerobs_invoice', false, 'invoice' ) . '">' . __( 'Add a tag', 'zero-bs-crm' ) . '</a>',
				),
			'bulkActions' => array( 'changestatus', 'addtag', 'removetag', 'delete', 'export' ),
			'extraBoxes'  => $upsell_box_html,
		)
	);

	$list->drawListView();
}

/* ============================== / INVOICES ===================================== 
================================================================================ */




/* ================================================================================
========================= TRANSACTIONS ========================================= */

function zeroBSCRM_render_transactionslist_page(){

    $list = new zeroBSCRM_list(array(

            'objType'       => 'transaction',
            'singular'      => __('Transaction',"zero-bs-crm"),
            'plural'        => __('Transactions',"zero-bs-crm"),
            'tag'           => 'zerobscrm_transactiontag',
            'postType'      => 'zerobs_transaction',
            'postPage'      => 'manage-transactions',
            'langLabels'    => array(

                // bulk action labels
                'delete' => __('Delete Transaction(s)',"zero-bs-crm"),
                'export' => __('Export Transaction(s)',"zero-bs-crm"),

                // bulk actions - add/remove tags
                'notags' => __('You do not have any tags, do you want to',"zero-bs-crm").' <a target="_blank" href="'.jpcrm_esc_link('tags',-1,'zerobs_transaction',false,'transaction').'">'.__('Add a tag',"zero-bs-crm").'</a>',                
               
                // statuses
                'trans_status_cancelled' => __('Cancelled',"zero-bs-crm"),
                'trans_status_hold' => __('Hold',"zero-bs-crm"),
                'trans_status_pending' => __('Pending',"zero-bs-crm"),
                'trans_status_processing' => __('Processing',"zero-bs-crm"),
                'trans_status_refunded' => __('Refunded',"zero-bs-crm"),
                'trans_status_failed' => __('Failed',"zero-bs-crm"),
                'trans_status_completed' => __('Completed',"zero-bs-crm"),
                'trans_status_succeeded' => __('Succeeded',"zero-bs-crm"),

            ),
            'bulkActions'   => array('addtag','removetag','delete','export'),
            'sortables'     => array('id'),
            'unsortables'   => array('tagged','latestlog','editlink','phonelink')
    ));

    $list->drawListView();

}

/* ============================ / TRANSACTIONS ==================================== 
================================================================================ */




/* ================================================================================
================================ FORMS ========================================= */

function zeroBSCRM_render_formslist_page(){


    

    #} has no sync ext? Sell them
    $upsellBoxHTML = ''; 
    
            #} has sync ext? Give feedback
            if (!zeroBSCRM_hasPaidExtensionActivated()){ 

                ##WLREMOVE
                // first build upsell box html
                $upsellBoxHTML = '<!-- Forms PRO box --><div class="">';
                $upsellBoxHTML .= '<h4>Need More Complex Forms?</h4>';

                    $upTitle = __('Fully Flexible Forms',"zero-bs-crm");
                    $upDesc = __('Jetpack CRM forms cover simple use contact and subscription forms, but if you need more we suggest using a form plugin like Contact Form 7 or Gravity Forms:',"zero-bs-crm");
                    $upButton = __('See Full Form Options',"zero-bs-crm");
                    $upTarget = 'https://jetpackcrm.com/feature/forms/#benefit';

                    $upsellBoxHTML .= zeroBSCRM_UI2_squareFeedbackUpsell($upTitle,$upDesc,$upButton,$upTarget); 

                $upsellBoxHTML .= '</div><!-- / Inv Forms box -->';
                ##/WLREMOVE
            }

    $list = new zeroBSCRM_list(array(

            'objType'       => 'form',
            'singular'      => __('Form',"zero-bs-crm"),
            'plural'        => __('Forms',"zero-bs-crm"),
            'tag'           => '',
            'postType'      => 'zerobs_form',
            'postPage'      => 'manage-forms',
            'langLabels'    => array(

                'naked' => __('Naked',"zero-bs-crm"),
                'cgrab' => __('Content Grab',"zero-bs-crm"),
                'simple' => __('Simple',"zero-bs-crm"),

                // bulk action labels
                'delete' => __('Delete Form(s)',"zero-bs-crm"),
                'export' => __('Export Form(s)',"zero-bs-crm"),


                // bulk actions - deleting
                'formsdeleted' => __('Your form(s) have been deleted.',"zero-bs-crm"),
                'notformsdeleted' => __('Your form(s) could not be deleted.',"zero-bs-crm"),

            ),
            'bulkActions'   => array('delete'),
            //default 'sortables'     => array('id'),
            //default 'unsortables'   => array('tagged','latestlog','editlink','phonelink')
            'extraBoxes' => $upsellBoxHTML
    ));

    $list->drawListView();

}

/* ============================= / FORMS ========================================== 
================================================================================ */



/* ================================================================================
=============================== SEGMENTS ======================================= */

function zeroBSCRM_render_segmentslist_page(){

    global $zbs;

    // Check that our segment conditions are all still available
    // (checking here allows us to expose errors on the list view if there are any)
    jpcrm_segments_compare_available_conditions_to_prev();

    #} has no sync ext? Sell them
    $upsellBoxHTML = '';
    
            #}
            if (!zeroBSCRM_isExtensionInstalled('advancedsegments')){ 


                // first build upsell box html
                $upsellBoxHTML = '<div class="">';
                $upsellBoxHTML .= '<h4>'.__('Using Segments','zero-bs-crm').':</h4>';

                        $upTitle = __('Segment like a PRO',"zero-bs-crm");
                        $upDesc = __('Did you know that we\'ve made segments more advanced?',"zero-bs-crm");
                        $upButton = __('See Advanced Segments',"zero-bs-crm");
                        $upTarget = $zbs->urls['advancedsegments'];

                        $upsellBoxHTML .= zeroBSCRM_UI2_squareFeedbackUpsell($upTitle,$upDesc,$upButton,$upTarget); 

                $upsellBoxHTML .= '</div>';

            } else { 

             // later this can point to https://kb.jetpackcrm.com/knowledge-base/how-to-get-customers-into-zero-bs-crm/ 
 
                $upsellBoxHTML = '<div class="">';
                $upsellBoxHTML .= '<h4>'.__('Got Feedback?','zero-bs-crm').':</h4>';

                        $upTitle = __('Enjoying segments?',"zero-bs-crm");
                        $upDesc = __('As we grow Jetpack CRM, we\'re looking for feedback!',"zero-bs-crm");
                        $upButton = __('Send Feedback',"zero-bs-crm");
                        $upTarget = "mailto:hello@jetpackcrm.com?subject='Segments%20Feedback'";

                        $upsellBoxHTML .= zeroBSCRM_UI2_squareFeedbackUpsell($upTitle,$upDesc,$upButton,$upTarget); 
                
                $upsellBoxHTML .= '</div>';

            }

    // pass this for filter links
    $extraJS = ''; if (zeroBSCRM_getSetting('filtersfromsegments') == "1"){ $extraJS = " var zbsSegmentViewStemURL = '".jpcrm_esc_link($zbs->slugs['managecontacts']).'&quickfilters=segment_'."';"; }        

    $list = new zeroBSCRM_list(array(

            'objType'       => 'segment',
            'singular'      => __('Segment',"zero-bs-crm"),
            'plural'        => __('Segments',"zero-bs-crm"),
            'tag'           => '',
            'postType'      => 'segment',
            'postPage'      => $zbs->slugs['segments'],
            'langLabels'    => array(

                // compiled language
                'lastCompiled' => __('Last Compiled',"zero-bs-crm"),
                'notCompiled' => __('Not Compiled',"zero-bs-crm"),
                
                // bulk action labels
                'deletesegments' => __('Delete Segment(s)',"zero-bs-crm"),
                'export' => __('Export Segment(s)',"zero-bs-crm"),

                // bulk actions - segment deleting
                'segmentsdeleted' => __('Your segment(s) have been deleted.',"zero-bs-crm"),
                'notsegmentsdeleted' => __('Your segment(s) could not be deleted.',"zero-bs-crm"),

                // export segment
                'exportcsv' => __( 'Export .CSV', 'zero-bs-crm' ),

            ),
            'bulkActions'   => array('delete'),
            //'sortables'     => array('id'),
            'unsortables'   => array('audiencecount','action','added'),
            'extraBoxes' => $upsellBoxHTML,
            'extraJS' => $extraJS
    ));

    $list->drawListView();

}

/* ============================== / SEGMENTS ====================================== 
================================================================================ */



/* ================================================================================
================================ QUOTETEMPLATES ================================ */

function zeroBSCRM_render_quotetemplateslist_page(){


    #} has no sync ext? Sell them
    $upsellBoxHTML = ''; 

    $list = new zeroBSCRM_list(array(

            'objType'       => 'quotetemplate',
            'singular'      => __('Quote Template',"zero-bs-crm"),
            'plural'        => __('Quote Templates',"zero-bs-crm"),
            'tag'           => '',
            'postType'      => 'zerobs_quo_template',
            'postPage'      => 'manage-quote-templates',
            'langLabels'    => array(

                // bulk action labels
                'delete' => __('Delete Quote Template(s)',"zero-bs-crm"),
                'export' => __('Export Quote Template(s)',"zero-bs-crm"),

                // for listview
                'defaulttemplate' => __('Default Template','zero-bs-crm'),
                'deletetemplate' => __('Delete Template','zero-bs-crm'),

                // bulk actions - quote template deleting
                'quotetemplatesdeleted' => __('Your Quote template(s) have been deleted.',"zero-bs-crm"),
                'notquotetemplatesdeleted' => __('Your Quote template(s) could not be deleted.',"zero-bs-crm"),

            ),
            'bulkActions'   => array('delete'),
            'extraBoxes' => $upsellBoxHTML
    ));

    $list->drawListView();

}

/* ============================= / QUOTETEMPLATES =================================
================================================================================ */




/* ================================================================================
=================================== EVENTS ===================================== */

function zeroBSCRM_render_eventslist_page(){


    #} has no sync ext? Sell them
    $upsellBoxHTML = ''; 

    $list = new zeroBSCRM_list(array(

            'objType'       => 'event',
		'singular'        => __( 'Task', 'zero-bs-crm' ),
		'plural'          => __( 'Tasks', 'zero-bs-crm' ),
            'tag'           => '',
            'postType'      => 'zerobs_event',
            'postPage'      => 'manage-events-list',
            'langLabels'    => array(

                // Status
                'incomplete' => __( 'Incomplete', "zero-bs-crm" ),
                'complete' => __( 'Complete', "zero-bs-crm" ),

                // bulk action labels
                'delete' => __('Delete Task(s)',"zero-bs-crm"),
                'markcomplete' => __('Mark Task(s) Completed',"zero-bs-crm"),
                'markincomplete' => __('Mark Task(s) Incomplete',"zero-bs-crm"),

                // bulk actions - event actions
				'eventsdeleted'              => __( 'Your Task(s) have been deleted.', 'zero-bs-crm' ),
				'noteventsdeleted'           => __( 'Your Task(s) could not be deleted.', 'zero-bs-crm' ),
				'areyousureeventscompleted'  => __( 'Are you sure you want to mark these tasks as completed?', 'zero-bs-crm' ),
				'areyousureeventsincomplete' => __( 'Are you sure you want to mark these tasks as incomplete?', 'zero-bs-crm' ),
				'eventsmarked'               => __( 'Your Task(s) have been updated.', 'zero-bs-crm' ),
				'noteventsmarked'            => __( 'Your Task(s) could not be updated.', 'zero-bs-crm' ),

            ),
            'bulkActions'   => array('addtag','removetag','delete','markcomplete','markincomplete'), // 'export' - possible but needs tidy /wp-admin/admin.php?page=zbs-export-tools&zbstype=event            
            'unsortables'   => array('action','remind','company','contact','showcal'),
            'extraBoxes' => $upsellBoxHTML
    ));

    $list->drawListView();

}

/* ================================== / EVENTS ====================================
================================================================================ */

