<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Automation: List view
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Page: Automation List view
 */
function jpcrm_automations_render_listview_page() {

    global $zbs;

    $upsell_box_html = '';
    $extra_js = '';
    
    // upsell
    ##WLREMOVE
    if ( !zeroBSCRM_isExtensionInstalled( 'advautomations' ) ){ 


        // first build upsell box html
        $upsell_box_html = '<div class="">';
        $upsell_box_html .= '<h4>'.__('Advanced Automations:','zero-bs-crm').'</h4>';

        	#TBC
            $upsell_title = __( "Get Advanced Automation!", "zero-bs-crm" );
            $upsell_description = __( "(╯°□°)╯︵ ┻━┻", "zero-bs-crm" );
            $upsell_button = __( "Read about Advanced Automations", "zero-bs-crm" );
            $upsell_target = $zbs->urls['automations'];

            $upsell_box_html .= zeroBSCRM_UI2_squareFeedbackUpsell( $upsell_title, $upsell_description, $upsell_button, $upsell_target ); 

        $upsell_box_html .= '</div>';

    } else { 

     	// public service announcement #TBC
        $upsell_box_html = '<div class="">';
        $upsell_box_html .= '<h4>'.__('Got Feedback?','zero-bs-crm').':</h4>';

            $upsell_title = __('Enjoying Automations?',"zero-bs-crm");
            $upsell_description = __('As we grow Jetpack CRM, we\'re looking for feedback!',"zero-bs-crm");
            $upsell_button = __('Send Feedback',"zero-bs-crm");
            $upsell_target = "mailto:hello@jetpackcrm.com?subject='Automations%20Feedback'";

            $upsell_box_html .= zeroBSCRM_UI2_squareFeedbackUpsell( $upsell_title, $upsell_description, $upsell_button, $upsell_target ); 
        
        $upsell_box_html .= '</div>';

    }
    ##/WLREMOVE

    $list = new zeroBSCRM_list(array(

            'objType'       => 'automations',
            'singular'      => __( "Automation", "zero-bs-crm" ),
            'plural'        => __( "Automations", "zero-bs-crm" ),
            'tag'           => '',
            'postType'      => 'automations',
            'postPage'      => $zbs->slugs['automations-listview'],
            'langLabels'    => array(

            	#TBC
                //'lastCompiled' => __('Last Compiled',"zero-bs-crm"),

            ),
            'bulkActions'   => array( 'delete' ),
            //'sortables'     => array('id'),
            'unsortables'   => array( 'action', 'added' ),
            'extraBoxes' => $upsell_box_html,
            'extraJS' => $extra_js

    ));

    $list->drawListView();

}




/* ======================================================================================================
  ======================== / list view columns
  ===================================================================================================== */


/**
 * Styles and scripts for listview page
 */
function jpcrm_automation_listview_styles_scripts(){

	global $zbs;
	wp_enqueue_script( 'jpcrm-automations-listview', plugins_url( '/js/jpcrm-automations-listview'.wp_scripts_get_suffix().'.js', JPCRM_AUTOMATION_ROOT_FILE ), array( 'jquery' ), $zbs->version );
	wp_enqueue_style( 'jpcrm-automations-listview', plugins_url( '/css/jpcrm-automations-listview'.wp_scripts_get_suffix().'.css', JPCRM_AUTOMATION_ROOT_FILE ) );
	zeroBSCRM_global_admin_styles();

	// listview styles/scripts
	zeroBSCRM_admin_styles_ui2_listview();

}