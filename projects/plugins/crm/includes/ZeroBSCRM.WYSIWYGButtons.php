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

/* ======================================================
	Breaking Checks ( stops direct access )
	======================================================= */
	if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */


/* ======================================================
	ZBS WYSIWYG Editor Buttons
	======================================================= */

// ======= FORMS

// WYSIWYG Button
function zeroBSCRM__WYSIWYG_register_button( $buttons ) {
		array_push( $buttons, 'zbsCRMForms' );
		return $buttons;
}
function zeroBSCRM__WYSIWYG_add_plugin( $plugin_array ) {
	$plugin_array['zbsCRMForms'] = ZEROBSCRM_URL . 'js/ZeroBSCRM.admin.wysiwygbar' . wp_scripts_get_suffix() . '.js'; 
	return $plugin_array;
}


// this one is for forms, I suspect.
add_action( 'admin_head', 'zeroBSCRM__WYSIWYG_tc4_button' );
function zeroBSCRM__WYSIWYG_tc4_button() {
	global $typenow;
	// check user permissions
	if ( !current_user_can( 'edit_posts' ) && !current_user_can( 'edit_pages' ) ) {
		return;
	}
	// verify the post type
	if( ! in_array( $typenow, array( 'post', 'page' ) ) ) {
		return;
	}
	// check if WYSIWYG is enabled
	if ( get_user_option('rich_editing') == 'true' && zeroBSCRM_isExtensionInstalled( 'forms' ) ) {
		add_filter( 'mce_external_plugins', 'zeroBSCRM__WYSIWYG_add_plugin' );
		add_filter( 'mce_buttons', 'zeroBSCRM__WYSIWYG_register_button' );
		zeroBSCRM_exposeFormListJS();
	}
}

function zeroBSCRM_exposeFormListJS(){

	$forms = zeroBS_getForms();

	$ret = array();
	if ( is_array( $forms ) ) {
		foreach ( $forms as $form ) {
			$ret[] = array( 'id' => $form['id'], 'title' => $form['title'] );
		}
	}

	?><script type="text/javascript">var zbsCRMFormList = <?php echo json_encode( $ret ); ?>;</script><?php

}


// / ======= FORMS



// ======== QUOTE BUILDER TEMPLATE INJECT

// WYSIWYG Button 
function zeroBSCRM__WYSIWYG_quotebuildr_register_button( $buttons ) {
	array_push( $buttons, 'zbsQuoteTemplates' );
	return $buttons;
}
function zeroBSCRM__WYSIWYG_quotebuildr_add_plugin( $plugin_array ) {
	$plugin_array['zbsQuoteTemplates'] = ZEROBSCRM_URL . 'js/ZeroBSCRM.admin.quotebuilder.wysiwygbar' . wp_scripts_get_suffix() . '.js';
	return $plugin_array;
}

add_action( 'admin_head', 'zeroBSCRM__WYSIWYG_quotebuildr_tc4_button' );
function zeroBSCRM__WYSIWYG_quotebuildr_tc4_button() {
	// check user permissions
	if ( !current_user_can( 'edit_posts' ) && !current_user_can( 'edit_pages' ) ) {
	return;
	}

	// check if WYSIWYG is enabled and in this part check whether we are on the quote edit page
	if ( get_user_option( 'rich_editing' ) == 'true' && zeroBSCRM_is_quotetemplate_edit_page() ) {
		add_filter( 'mce_external_plugins', 'zeroBSCRM__WYSIWYG_quotebuildr_add_plugin' );
		add_filter( 'mce_buttons', 'zeroBSCRM__WYSIWYG_quotebuildr_register_button' );
	} else {
		return;
	}

}

// / ======== QUOTE BUILDER TEMPLATE INJECT


// NOTE THE LINK TO zeroBSCRM__adminHeaderExpose in core :)

/* ======================================================
/ ZBS WYSIWYG Editor Buttons
	====================================================== */