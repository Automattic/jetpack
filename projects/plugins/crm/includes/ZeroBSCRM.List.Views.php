<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase

/*
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 26/05/16
 */

// prevent direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

/**
 * Renders the html for the contact list.
 *
 * @return void
 */
function zeroBSCRM_render_customerslist_page() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
	global $zbs;

	// has no sync ext? Sell them
	$upsell_box_html = '';

	// extra_js:
	$status_array = $zbs->settings->get( 'customisedfields' )['customers']['status'];
	$statuses     = is_array( $status_array ) && isset( $status_array[1] ) ? explode( ',', $status_array[1] ) : array();
	$extra_js     = 'var zbsStatusesForBulkActions = ' . wp_json_encode( $statuses ) . ';';

	// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
	// Messages:
	// All messages need params to match this func:
	// ... zeroBSCRM_UI2_messageHTML($msgClass='',$msgHeader='',$msg='',$iconClass='',$id='')
	$messages = array();

	$list = new zeroBSCRM_list(
		array(

			'objType'     => 'customer',
			'singular'    => esc_html__( 'Contact', 'zero-bs-crm' ),
			'plural'      => esc_html__( 'Contacts', 'zero-bs-crm' ),
			'tag'         => 'zerobscrm_customertag',
			'postType'    => 'zerobs_customer',
			'postPage'    => 'manage-customers',
			'langLabels'  => array(

				// bulk action labels
				'deletecontacts'       => esc_html__( 'Delete Contact(s)', 'zero-bs-crm' ),
				'merge'                => esc_html__( 'Merge Contacts', 'zero-bs-crm' ),
				'export'               => esc_html__( 'Export Contact(s)', 'zero-bs-crm' ),
				'changestatus'         => esc_html__( 'Change Status', 'zero-bs-crm' ),

				// bulk actions - change status
				'statusupdated'        => esc_html__( 'Statuses Updated', 'zero-bs-crm' ),
				'statusnotupdated'     => esc_html__( 'Could not update statuses!', 'zero-bs-crm' ),

				// bulk actions - contact deleting
				'andthese'             => esc_html__( 'Shall I also delete the associated Invoices, Quotes, Transactions, and Tasks?', 'zero-bs-crm' ),
				'contactsdeleted'      => esc_html__( 'Your contact(s) have been deleted.', 'zero-bs-crm' ),
				'notcontactsdeleted'   => esc_html__( 'Your contact(s) could not be deleted.', 'zero-bs-crm' ),

				// bulk actions - add/remove tags
				/* translators: placeholder is a link to add a new object tag */
				'notags'               => wp_kses( sprintf( __( 'You do not have any contact tags. Do you want to <a target="_blank" href="%s">add a tag</a>?', 'zero-bs-crm' ), jpcrm_esc_link( 'tags', -1, 'zerobs_customer', false, 'contact' ) ), $zbs->acceptable_restricted_html ),

				// bulk actions - merge 2 records
				'areyousurethesemerge' => esc_html__( 'Are you sure you want to merge these two contacts into one record? There is no way to undo this action.', 'zero-bs-crm' ) . '<br />',
				'whichdominant'        => esc_html__( 'Which is the "master" record (main record)?', 'zero-bs-crm' ),

				'contactsmerged'       => esc_html__( 'Contacts Merged', 'zero-bs-crm' ),
				'contactsnotmerged'    => esc_html__( 'Contacts could not be successfully merged', 'zero-bs-crm' ),

				// tel
				'telhome'              => esc_html__( 'Home', 'zero-bs-crm' ),
				'telwork'              => esc_html__( 'Work', 'zero-bs-crm' ),
				'telmob'               => esc_html__( 'Mobile', 'zero-bs-crm' ),

			),
			'bulkActions' => array( 'changestatus', 'delete', 'addtag', 'removetag', 'merge', 'export' ),
			'unsortables' => array( 'tagged', 'editlink', 'phonelink' ),
			'extraBoxes'  => $upsell_box_html,
			'extraJS'     => $extra_js,
			'messages'    => $messages,
		)
	);

	$list->drawListView();
}

/**
 * Renders the html for the companies list.
 *
 * @return void
 */
function zeroBSCRM_render_companyslist_page() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	global $zbs;

	$list = new zeroBSCRM_list(
		array(

			'objType'     => 'company',
			'singular'    => esc_html( jpcrm_label_company() ),
			'plural'      => esc_html( jpcrm_label_company( true ) ),
			'tag'         => 'zerobscrm_companytag',
			'postType'    => 'zerobs_company',
			'postPage'    => 'manage-companies',
			'langLabels'  => array(

				// bulk action labels
				/* translators: placeholder is the company label */
				'deletecompanys'     => esc_html( sprintf( __( 'Delete %s(s)', 'zero-bs-crm' ), jpcrm_label_company() ) ),
				'addtags'            => esc_html__( 'Add tag(s)', 'zero-bs-crm' ),
				'removetags'         => esc_html__( 'Remove tag(s)', 'zero-bs-crm' ),
				'export'             => esc_html__( 'Export', 'zero-bs-crm' ),

				// bulk actions - company deleting
				'andthese'           => esc_html__( 'Shall I also delete the associated Contacts, Invoices, Quotes, Transactions, and Tasks? (This cannot be undone!)', 'zero-bs-crm' ),
				'companysdeleted'    => esc_html__( 'Your company(s) have been deleted.', 'zero-bs-crm' ),
				'notcompanysdeleted' => esc_html__( 'Your company(s) could not be deleted.', 'zero-bs-crm' ),

				// bulk actions - add/remove tags
				/* translators: placeholder is a link to add a new object tag */
				'notags'             => wp_kses( sprintf( __( 'You do not have any company tags. Do you want to <a target="_blank" href="%s">add a tag</a>?', 'zero-bs-crm' ), jpcrm_esc_link( 'tags', -1, 'zerobs_company', false, 'company' ) ), $zbs->acceptable_restricted_html ),

			),
			'bulkActions' => array( 'delete', 'addtag', 'removetag', 'export' ),
			// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			// default 'sortables'     => array('id'),
			// default 'unsortables'   => array('tagged','latestlog','editlink','phonelink')
		)
	);

	$list->drawListView();
}

/**
 * Renders the html for the quotes list.
 *
 * @return void
 */
function zeroBSCRM_render_quoteslist_page() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	global $zbs;
	$list = new zeroBSCRM_list(
		array(

			'objType'     => 'quote',
			'singular'    => esc_html__( 'Quote', 'zero-bs-crm' ),
			'plural'      => esc_html__( 'Quotes', 'zero-bs-crm' ),
			'tag'         => '',
			'postType'    => 'zerobs_quote',
			'postPage'    => 'manage-quotes',
			'langLabels'  => array(

				'markaccepted'             => esc_html__( 'Mark Accepted', 'zero-bs-crm' ),
				'markunaccepted'           => esc_html__( 'Unmark Accepted', 'zero-bs-crm' ),
				'delete'                   => esc_html__( 'Delete Quote(s)', 'zero-bs-crm' ),
				'export'                   => esc_html__( 'Export Quote(s)', 'zero-bs-crm' ),
				'andthese'                 => esc_html__( 'Shall I also delete the associated Invoices, Quotes, Transactions, and Tasks?', 'zero-bs-crm' ),
				'quotesdeleted'            => esc_html__( 'Your quote(s) have been deleted.', 'zero-bs-crm' ),
				'notquotesdeleted'         => esc_html__( 'Your quote(s) could not be deleted.', 'zero-bs-crm' ),
				'acceptareyousurequotes'   => esc_html__( 'Are you sure you want to mark these quotes as accepted?', 'zero-bs-crm' ),
				'acceptdeleted'            => esc_html__( 'Quote(s) Accepted', 'zero-bs-crm' ),
				'acceptquotesdeleted'      => esc_html__( 'Your quote(s) have been marked accepted.', 'zero-bs-crm' ),
				'acceptnotdeleted'         => esc_html__( 'Could not mark accepted!', 'zero-bs-crm' ),
				'acceptnotquotesdeleted'   => esc_html__( 'Your quote(s) could not be marked accepted.', 'zero-bs-crm' ),
				'unacceptareyousurethese'  => esc_html__( 'Are you sure you want to mark these quotes as unaccepted?', 'zero-bs-crm' ),
				'unacceptdeleted'          => esc_html__( 'Quote(s) Unaccepted', 'zero-bs-crm' ),
				'unacceptquotesdeleted'    => esc_html__( 'Your quote(s) have been marked unaccepted.', 'zero-bs-crm' ),
				'unacceptnotdeleted'       => esc_html__( 'Could not mark unaccepted!', 'zero-bs-crm' ),
				'unacceptnotquotesdeleted' => esc_html__( 'Your quote(s) could not be marked unaccepted.', 'zero-bs-crm' ),
				/* translators: placeholder is a link to add a new object tag */
				'notags'                   => wp_kses( sprintf( __( 'You do not have any quote tags. Do you want to <a target="_blank" href="%s">add a tag</a>?', 'zero-bs-crm' ), jpcrm_esc_link( 'tags', -1, 'zerobs_quote', false, 'quote' ) ), $zbs->acceptable_restricted_html ),

			),
			'bulkActions' => array( 'markaccepted', 'markunaccepted', 'addtag', 'removetag', 'delete', 'export' ),

			// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			// default 'sortables'     => array('id'),
			// default 'unsortables'   => array('tagged','latestlog','editlink','phonelink')
		)
	);

	$list->drawListView();
}

/**
 * Renders the html for the invoices list.
 *
 * @return void
 */
function zeroBSCRM_render_invoiceslist_page() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
	global $zbs;

	$upsell_box_html = '';
	$bundle          = false;
	if ( $zbs->hasEntrepreneurBundleMin() ) {
		$bundle = true;
	}

	if ( ! zeroBSCRM_isExtensionInstalled( 'invpro' ) ) {
		if ( ! $bundle ) {
			$upsell_box_html = '<!-- Inv PRO box --><div class="">';

			$up_title  = esc_html__( 'Supercharged Invoicing', 'zero-bs-crm' );
			$up_desc   = esc_html__( 'Get more out of invoicing, like accepting online payments!', 'zero-bs-crm' );
			$up_button = esc_html__( 'Get Invoicing Pro', 'zero-bs-crm' );
			$up_target = $zbs->urls['invpro'];

			$upsell_box_html .= zeroBSCRM_UI2_squareFeedbackUpsell( $up_title, $up_desc, $up_button, $up_target );
			$upsell_box_html .= '</div><!-- / Inv PRO box -->';
		} else {
			$upsell_box_html = '<!-- Inv PRO box --><div class="">';

			$up_title  = esc_html__( 'Supercharged Invoicing', 'zero-bs-crm' );
			$up_desc   = esc_html__( 'You have Invoicing Pro available because you are using a bundle. Please download and install from your account:', 'zero-bs-crm' );
			$up_button = esc_html__( 'Your Account', 'zero-bs-crm' );
			$up_target = $zbs->urls['account'];

			$upsell_box_html .= zeroBSCRM_UI2_squareFeedbackUpsell( $up_title, $up_desc, $up_button, $up_target );
			$upsell_box_html .= '</div><!-- / Inv PRO box -->';
		}
	}

	$list = new zeroBSCRM_list(
		array(
			'objType'     => 'invoice',
			'singular'    => esc_html__( 'Invoice', 'zero-bs-crm' ),
			'plural'      => esc_html__( 'Invoices', 'zero-bs-crm' ),
			'tag'         => '',
			'postType'    => 'zerobs_invoice',
			'postPage'    => 'manage-invoices',
			'langLabels'  =>
				array(
					// bulk action labels
					'delete'                   => esc_html__( 'Delete Invoice(s)', 'zero-bs-crm' ),
					'export'                   => esc_html__( 'Export Invoice(s)', 'zero-bs-crm' ),

					// bulk actions - invoice deleting
					'invoicesdeleted'          => esc_html__( 'Your invoice(s) have been deleted.', 'zero-bs-crm' ),
					'notinvoicesdeleted'       => esc_html__( 'Your invoice(s) could not be deleted.', 'zero-bs-crm' ),

					// bulk actions - invoice status update
					'statusareyousurethese'    => esc_html__( 'Are you sure you want to change the status on marked invoice(s)?', 'zero-bs-crm' ),
					'statusupdated'            => esc_html__( 'Invoice(s) Updated', 'zero-bs-crm' ),
					'statusinvoicesupdated'    => esc_html__( 'Your invoice(s) have been updated.', 'zero-bs-crm' ),
					'statusnotupdated'         => esc_html__( 'Could not update invoice!', 'zero-bs-crm' ),
					'statusnotinvoicesupdated' => esc_html__( 'Your invoice(s) could not be updated', 'zero-bs-crm' ),
					'statusdraft'              => esc_html__( 'Draft', 'zero-bs-crm' ),
					'statusunpaid'             => esc_html__( 'Unpaid', 'zero-bs-crm' ),
					'statuspaid'               => esc_html__( 'Paid', 'zero-bs-crm' ),
					'statusoverdue'            => esc_html__( 'Overdue', 'zero-bs-crm' ),
					'statusdeleted'            => esc_html__( 'Deleted', 'zero-bs-crm' ),

					// bulk actions - add/remove tags
					/* translators: placeholder is a link to add a new object tag */
					'notags'                   => wp_kses( sprintf( __( 'You do not have any invoice tags. Do you want to <a target="_blank" href="%s">add a tag</a>?', 'zero-bs-crm' ), jpcrm_esc_link( 'tags', -1, 'zerobs_invoice', false, 'invoice' ) ), $zbs->acceptable_restricted_html ),
				),
			'bulkActions' => array( 'changestatus', 'addtag', 'removetag', 'delete', 'export' ),
			'extraBoxes'  => $upsell_box_html,
		)
	);

	$list->drawListView();
}

/**
 * Renders the html for the transactions list.
 *
 * @return void
 */
function zeroBSCRM_render_transactionslist_page() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	global $zbs;
	$list = new zeroBSCRM_list(
		array(

			'objType'     => 'transaction',
			'singular'    => esc_html__( 'Transaction', 'zero-bs-crm' ),
			'plural'      => esc_html__( 'Transactions', 'zero-bs-crm' ),
			'tag'         => 'zerobscrm_transactiontag',
			'postType'    => 'zerobs_transaction',
			'postPage'    => 'manage-transactions',
			'langLabels'  => array(

				// bulk action labels
				'delete'                  => esc_html__( 'Delete Transaction(s)', 'zero-bs-crm' ),
				'export'                  => esc_html__( 'Export Transaction(s)', 'zero-bs-crm' ),

				// bulk actions - add/remove tags
				/* translators: placeholder is a link to add a new object tag */
				'notags'                  => wp_kses( sprintf( __( 'You do not have any transaction tags. Do you want to <a target="_blank" href="%s">add a tag</a>?', 'zero-bs-crm' ), jpcrm_esc_link( 'tags', -1, 'zerobs_transaction', false, 'transaction' ) ), $zbs->acceptable_restricted_html ),

				// statuses
				'trans_status_cancelled'  => esc_html__( 'Cancelled', 'zero-bs-crm' ),
				'trans_status_hold'       => esc_html__( 'Hold', 'zero-bs-crm' ),
				'trans_status_pending'    => esc_html__( 'Pending', 'zero-bs-crm' ),
				'trans_status_processing' => esc_html__( 'Processing', 'zero-bs-crm' ),
				'trans_status_refunded'   => esc_html__( 'Refunded', 'zero-bs-crm' ),
				'trans_status_failed'     => esc_html__( 'Failed', 'zero-bs-crm' ),
				'trans_status_completed'  => esc_html__( 'Completed', 'zero-bs-crm' ),
				'trans_status_succeeded'  => esc_html__( 'Succeeded', 'zero-bs-crm' ),

			),
			'bulkActions' => array( 'addtag', 'removetag', 'delete', 'export' ),
			'sortables'   => array( 'id' ),
			'unsortables' => array( 'tagged', 'latestlog', 'editlink', 'phonelink' ),
		)
	);

	$list->drawListView();
}

/**
 * Renders the html for the forms list.
 *
 * @return void
 */
function zeroBSCRM_render_formslist_page() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	// has no sync ext? Sell them
	$upsell_box_html = '';

	// has sync ext? Give feedback
	if ( ! zeroBSCRM_hasPaidExtensionActivated() ) {

		##WLREMOVE
		// first build upsell box html
		$upsell_box_html  = '<!-- Forms PRO box --><div class="">';
		$upsell_box_html .= '<h4>' . esc_html__( 'Need More Complex Forms?', 'zero-bs-crm' ) . '</h4>';

		$up_title  = esc_html__( 'Fully Flexible Forms', 'zero-bs-crm' );
		$up_desc   = esc_html__( 'Jetpack CRM forms cover simple use contact and subscription forms, but if you need more we suggest using a form plugin like Contact Form 7 or Gravity Forms:', 'zero-bs-crm' );
		$up_button = esc_html__( 'See Full Form Options', 'zero-bs-crm' );
		$up_target = 'https://jetpackcrm.com/feature/forms/#benefit';

		$upsell_box_html .= zeroBSCRM_UI2_squareFeedbackUpsell( $up_title, $up_desc, $up_button, $up_target );

		$upsell_box_html .= '</div><!-- / Inv Forms box -->';
		##/WLREMOVE
	}

	$list = new zeroBSCRM_list(
		array(

			'objType'     => 'form',
			'singular'    => esc_html__( 'Form', 'zero-bs-crm' ),
			'plural'      => esc_html__( 'Forms', 'zero-bs-crm' ),
			'tag'         => '',
			'postType'    => 'zerobs_form',
			'postPage'    => 'manage-forms',
			'langLabels'  => array(

				'naked'           => esc_html__( 'Naked', 'zero-bs-crm' ),
				'cgrab'           => esc_html__( 'Content Grab', 'zero-bs-crm' ),
				'simple'          => esc_html__( 'Simple', 'zero-bs-crm' ),

				// bulk action labels
				'delete'          => esc_html__( 'Delete Form(s)', 'zero-bs-crm' ),
				'export'          => esc_html__( 'Export Form(s)', 'zero-bs-crm' ),

				// bulk actions - deleting
				'formsdeleted'    => esc_html__( 'Your form(s) have been deleted.', 'zero-bs-crm' ),
				'notformsdeleted' => esc_html__( 'Your form(s) could not be deleted.', 'zero-bs-crm' ),

			),
			'bulkActions' => array( 'delete' ),
			// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			// default 'sortables'     => array('id'),
			// default 'unsortables'   => array('tagged','latestlog','editlink','phonelink')
			'extraBoxes'  => $upsell_box_html,
		)
	);

	$list->drawListView();
}

/**
 * Renders the html for the segments list.
 *
 * @return void
 */
function zeroBSCRM_render_segmentslist_page() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	global $zbs;

	// Check that our segment conditions are all still available
	// (checking here allows us to expose errors on the list view if there are any)
	jpcrm_segments_compare_available_conditions_to_prev();

	// has no sync ext? Sell them
	$upsell_box_html = '';

	if ( ! zeroBSCRM_isExtensionInstalled( 'advancedsegments' ) ) {

		// first build upsell box html
		$upsell_box_html  = '<div class="">';
		$upsell_box_html .= '<h4>' . esc_html__( 'Using Segments?', 'zero-bs-crm' ) . '</h4>';

		$up_title  = esc_html__( 'Segment like a PRO', 'zero-bs-crm' );
		$up_desc   = esc_html__( 'Did you know that we\'ve made segments more advanced?', 'zero-bs-crm' );
		$up_button = esc_html__( 'See Advanced Segments', 'zero-bs-crm' );
		$up_target = $zbs->urls['advancedsegments'];

		$upsell_box_html .= zeroBSCRM_UI2_squareFeedbackUpsell( $up_title, $up_desc, $up_button, $up_target );

		$upsell_box_html .= '</div>';

	} else {

		// later this can point to https://kb.jetpackcrm.com/knowledge-base/how-to-get-customers-into-zero-bs-crm/

		$upsell_box_html  = '<div class="">';
		$upsell_box_html .= '<h4>' . esc_html__( 'Got Feedback?', 'zero-bs-crm' ) . ':</h4>';

		$up_title  = esc_html__( 'Enjoying segments?', 'zero-bs-crm' );
		$up_desc   = esc_html__( 'As we grow Jetpack CRM, we\'re looking for feedback!', 'zero-bs-crm' );
		$up_button = esc_html__( 'Send Feedback', 'zero-bs-crm' );
		$up_target = "mailto:hello@jetpackcrm.com?subject='Segments%20Feedback'";

		$upsell_box_html .= zeroBSCRM_UI2_squareFeedbackUpsell( $up_title, $up_desc, $up_button, $up_target );

		$upsell_box_html .= '</div>';

	}

	// pass this for filter links
	$extra_js = '';
	if ( zeroBSCRM_getSetting( 'filtersfromsegments' ) == '1' ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
		$extra_js = " var zbsSegmentViewStemURL = '" . jpcrm_esc_link( $zbs->slugs['managecontacts'] ) . '&quickfilters=segment_' . "';";
	}

	$list = new zeroBSCRM_list(
		array(

			'objType'     => 'segment',
			'singular'    => esc_html__( 'Segment', 'zero-bs-crm' ),
			'plural'      => esc_html__( 'Segments', 'zero-bs-crm' ),
			'tag'         => '',
			'postType'    => 'segment',
			'postPage'    => $zbs->slugs['segments'],
			'langLabels'  => array(

				// compiled language
				'lastCompiled'       => esc_html__( 'Last Compiled', 'zero-bs-crm' ),
				'notCompiled'        => esc_html__( 'Not Compiled', 'zero-bs-crm' ),

				// bulk action labels
				'deletesegments'     => esc_html__( 'Delete Segment(s)', 'zero-bs-crm' ),
				'export'             => esc_html__( 'Export Segment(s)', 'zero-bs-crm' ),

				// bulk actions - segment deleting
				'segmentsdeleted'    => esc_html__( 'Your segment(s) have been deleted.', 'zero-bs-crm' ),
				'notsegmentsdeleted' => esc_html__( 'Your segment(s) could not be deleted.', 'zero-bs-crm' ),

				// export segment
				'exportcsv'          => esc_html__( 'Export .CSV', 'zero-bs-crm' ),

			),
			'bulkActions' => array( 'delete' ),
			// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			// 'sortables'   => array('id'),
			'unsortables' => array( 'audiencecount', 'action', 'added' ),
			'extraBoxes'  => $upsell_box_html,
			'extraJS'     => $extra_js,
		)
	);

	$list->drawListView();
}

/**
 * Renders the html for the quote templates list.
 *
 * @return void
 */
function zeroBSCRM_render_quotetemplateslist_page() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	// has no sync ext? Sell them
	$upsell_box_html = '';

	$list = new zeroBSCRM_list(
		array(

			'objType'     => 'quotetemplate',
			'singular'    => esc_html__( 'Quote Template', 'zero-bs-crm' ),
			'plural'      => esc_html__( 'Quote Templates', 'zero-bs-crm' ),
			'tag'         => '',
			'postType'    => 'zerobs_quo_template',
			'postPage'    => 'manage-quote-templates',
			'langLabels'  => array(

				// bulk action labels
				'delete'                   => esc_html__( 'Delete Quote Template(s)', 'zero-bs-crm' ),
				'export'                   => esc_html__( 'Export Quote Template(s)', 'zero-bs-crm' ),

				// for listview
				'defaulttemplate'          => esc_html__( 'Default Template', 'zero-bs-crm' ),
				'deletetemplate'           => esc_html__( 'Delete Template', 'zero-bs-crm' ),

				// bulk actions - quote template deleting
				'quotetemplatesdeleted'    => esc_html__( 'Your Quote template(s) have been deleted.', 'zero-bs-crm' ),
				'notquotetemplatesdeleted' => esc_html__( 'Your Quote template(s) could not be deleted.', 'zero-bs-crm' ),

			),
			'bulkActions' => array( 'delete' ),
			'extraBoxes'  => $upsell_box_html,
		)
	);

	$list->drawListView();
}

/**
 * Renders the html for the tasks list.
 *
 * @return void
 */
function zeroBSCRM_render_tasks_list_page() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	// has no sync ext? Sell them
	$upsell_box_html = '';

	$list = new zeroBSCRM_list(
		array(

			'objType'     => 'event',
			'singular'    => esc_html__( 'Task', 'zero-bs-crm' ),
			'plural'      => esc_html__( 'Tasks', 'zero-bs-crm' ),
			'tag'         => '',
			'postType'    => 'zerobs_event',
			'postPage'    => 'manage-tasks-list',
			'langLabels'  => array(

				// Status
				'incomplete'                  => esc_html__( 'Incomplete', 'zero-bs-crm' ),
				'complete'                    => esc_html__( 'Complete', 'zero-bs-crm' ),

				// bulk action labels
				'delete'                      => esc_html__( 'Delete Task(s)', 'zero-bs-crm' ),
				'markcomplete'                => esc_html__( 'Mark Task(s) Completed', 'zero-bs-crm' ),
				'markincomplete'              => esc_html__( 'Mark Task(s) Incomplete', 'zero-bs-crm' ),

				// bulk actions - task actions
				'tasks_deleted'               => esc_html__( 'Your Task(s) have been deleted.', 'zero-bs-crm' ),
				'tasks_not_deleted'           => esc_html__( 'Your Task(s) could not be deleted.', 'zero-bs-crm' ),
				'areyousure_tasks_completed'  => esc_html__( 'Are you sure you want to mark these tasks as completed?', 'zero-bs-crm' ),
				'areyousure_tasks_incomplete' => esc_html__( 'Are you sure you want to mark these tasks as incomplete?', 'zero-bs-crm' ),
				'tasks_marked'                => esc_html__( 'Your Task(s) have been updated.', 'zero-bs-crm' ),
				'tasks_not_marked'            => esc_html__( 'Your Task(s) could not be updated.', 'zero-bs-crm' ),

			),
			'bulkActions' => array( 'addtag', 'removetag', 'delete', 'markcomplete', 'markincomplete' ),
			'unsortables' => array( 'action', 'remind', 'company', 'contact', 'showcal' ),
			'extraBoxes'  => $upsell_box_html,
		)
	);

	$list->drawListView();
}
