<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Automation: editor
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Page: Automation editor
 */
function jpcrm_automations_render_editor_page() {

    // to-do: 
	echo 'THE AUTOMATIONS APP IS HERE!';
    
	jpcrm_automations_output_language_labels();
}

/*
* Output <script> JS to pass language labels to JS
*
* @param $additional_labels - array; any key/value pairs here will be expressed in the JS label var
*/
function jpcrm_automations_output_language_labels( $additional_labels = array() ){

	// specify default (generic) labels
	$language_labels = array_merge( array(

	), $additional_labels );


	?><script>var jpcrm_automations_language_labels = <?php echo json_encode( $language_labels ); ?></script><?php
}


/**
 * Styles and scripts for Editor page
 */
function jpcrm_automations_editor_styles_scripts(){

	global $zbs;
	wp_enqueue_script( 'jpcrm-automations-editor', plugins_url( '/js/jpcrm-automations-editor'.wp_scripts_get_suffix().'.js', JPCRM_AUTOMATION_ROOT_FILE ), array( 'jquery' ), $zbs->version );
	wp_enqueue_style( 'jpcrm-automations-editor', plugins_url( '/css/jpcrm-automations-editor'.wp_scripts_get_suffix().'.css', JPCRM_AUTOMATION_ROOT_FILE ) );
	zeroBSCRM_global_admin_styles();

}