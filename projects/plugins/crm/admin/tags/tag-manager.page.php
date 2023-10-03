<?php

// Tag Manager Page
// Split from ZeroBSCRM.AdminPages.php; at some point this should be merged into ZeroBSCRM.TagManager.php

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

function zeroBSCRM_pages_admin_tags() {
	global $zbs;

	// default to no upsell
	$upsell_html = '';

	if ( ! zeroBSCRM_hasPaidExtensionActivated() ) {
		// Bulk Tagger upsell
		$upsell_html  = '<!-- Bulk Tagger -->';
		$upsell_html .= '<div style="padding-right:1em">';
		$upsell_html .= '<h4>Tagging Tools:</h4>';
		$upsell_html .= zeroBSCRM_UI2_squareFeedbackUpsell(
			__( 'Bulk Tagger PRO', 'zero-bs-crm' ), // title
			__( 'Did you know that we have an extension for bulk tagging contacts based on transactions?', 'zero-bs-crm' ), // description
			__( 'View Bulk Tagger', 'zero-bs-crm' ), // button
			$zbs->urls['bulktagger'] // target
		);
		$upsell_html .= '</div>';
		$upsell_html .= '<!-- / Import Tools box -->';
	}

	$obj_type = ! empty( $_GET['tagtype'] ) ? sanitize_text_field( $_GET['tagtype'] ) : 'contact';

	// verify perms or error and die
	$has_perms_to_edit = zeroBSCRM_permsObjType( $zbs->DAL->objTypeID( $obj_type ) );
	if ( ! $has_perms_to_edit ) {
		jpcrm_perms_error();
	}

	switch ( $obj_type ) {

		case 'contact':
			$tagView = new zeroBSCRM_TagManager(
				array(
					'objTypeID'  => ZBS_TYPE_CONTACT,
					'objType'    => 'contact',
					'singular'   => __( 'Contact', 'zero-bs-crm' ),
					'plural'     => __( 'Contacts', 'zero-bs-crm' ),
					'langLabels' => array(
						// 'what' => __( 'WHAT', 'zero-bs-crm' ),
					),
					'extraBoxes' => $upsell_html,
				)
			);

			$tagView->drawTagView();
			break;

		case 'company':
			$tagView = new zeroBSCRM_TagManager(
				array(
					'objTypeID'  => ZBS_TYPE_COMPANY,
					'objType'    => 'company',
					'singular'   => jpcrm_label_company(),
					'plural'     => jpcrm_label_company( true ),
					'langLabels' => array(),
					'extraBoxes' => $upsell_html,
				)
			);

			$tagView->drawTagView();
			break;

		case 'quote':
			$tagView = new zeroBSCRM_TagManager(
				array(
					'objTypeID'  => ZBS_TYPE_QUOTE,
					'objType'    => 'quote',
					'singular'   => __( 'Quote', 'zero-bs-crm' ),
					'plural'     => __( 'Quotes', 'zero-bs-crm' ),
					'langLabels' => array(),
					'extraBoxes' => '',
				)
			);

			$tagView->drawTagView();
			break;

		case 'invoice':
			$tagView = new zeroBSCRM_TagManager(
				array(
					'objTypeID'  => ZBS_TYPE_INVOICE,
					'objType'    => 'invoice',
					'singular'   => __( 'Invoice', 'zero-bs-crm' ),
					'plural'     => __( 'Invoices', 'zero-bs-crm' ),
					'langLabels' => array(),
					'extraBoxes' => '',
				)
			);

			$tagView->drawTagView();
			break;

		case 'transaction':
			$tagView = new zeroBSCRM_TagManager(
				array(
					'objType'      => 'transaction',
					'objTypeID'    => ZBS_TYPE_TRANSACTION,
					'singular'     => __( 'Transaction', 'zero-bs-crm' ),
					'plural'       => __( 'Transactions', 'zero-bs-crm' ),
					'listViewSlug' => 'manage-transaction-tags',
					'langLabels'   => array(),
					'extraBoxes'   => $upsell_html,
				)
			);

			$tagView->drawTagView();
			break;

		case 'form':
			$tagView = new zeroBSCRM_TagManager(
				array(
					'objTypeID'  => ZBS_TYPE_FORM,
					'objType'    => 'form',
					'singular'   => __( 'Form', 'zero-bs-crm' ),
					'plural'     => __( 'Forms', 'zero-bs-crm' ),
					'langLabels' => array(),
					'extraBoxes' => '',
				)
			);

			$tagView->drawTagView();
			break;

		case 'event':
			$tagView = new zeroBSCRM_TagManager(
				array(
					'objTypeID'  => ZBS_TYPE_TASK,
					'objType'    => 'event',
					'singular'   => __( 'Task', 'zero-bs-crm' ),
					'plural'     => __( 'Tasks', 'zero-bs-crm' ),
					'langLabels' => array(),
					'extraBoxes' => '',
				)
			);

			$tagView->drawTagView();
			break;

		default:
			break;

	}
}
