<?php
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync: Contact Tabs
 * Adds extra tab(s) to contact single view: vitals tab set
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * MailPoet Contact Tabs class
 */
class MailPoet_Contact_Tabs {

    /**
     * The single instance of the class.
     */
    protected static $_instance = null;

    /**
     * Setup MailPoet Contact Tabs
     */
    public function __construct( ) {

        global $zbs;

        if ( $zbs->mailpoet_is_active() ){

            // Initialise Hooks
            $this->init_hooks();

        }

    }
        

    /**
     * Main Class Instance.
     *
     * Ensures only one instance of MailPoet_Contact_Tabs is loaded or can be loaded.
     *
     * @since 2.0
     * @static
     * @see 
     * @return MailPoet_Contact_Tabs main instance
     */
    public static function instance(){
        if ( is_null( self::$_instance ) ) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }



    /**
     * Initialise Hooks
     */
    private function init_hooks( ){

        // add in tabs
        add_filter( 'jetpack-crm-contact-vital-tabs', array( $this, 'append_info_tabs' ) , 10, 3 );


    }



    /**
     * Wire in ant applicable tabs
     */
    public function append_info_tabs( $array, $id, $contact ) {

        global $zbs;

        if ( !is_array($array) ){
            $array = array();
        }

        // MailPoet Info
        if ( $zbs->mailpoet_is_active() ){
            $array[] = array(
                'id' => 'mailpoet-tab',
                'name'    => __( 'MailPoet', 'zero-bs-crm' ),
                'content' => $this->generate_mailpoet_tab_html( $id, $contact ),
                );
        }


        return $array;

    }


    /**
     * Draw the Contacts MailPoet Vitals tab
     */
    private function generate_mailpoet_tab_html( $object_id = -1, $contact = array() ){

        global $zbs;

        // return html
        $html = '';

        // retrieve lists - we can do this either by checking the current email against mailpoet (as below)
        // ... or we could use $contact['external_sources']['mailpoet'][0]['uid'] to call the sub by id
        // ... here I've opted for current email, but if we need to we can switch to ^^
        
        // Get just the lists:
        // $subscriber_lists = $zbs->modules->mailpoet->get_mailpoet_lists_for_contact_from_email( $contact['email'] );
        
        // Get all MailPoet subscriber info:
        $subscriber = $zbs->modules->mailpoet->get_mailpoet_subscriber_by_email( $contact['email'] );
        
        if ( is_array( $subscriber ) ){

            $html = '<table class="ui fixed single line celled table zbs-view-vital-mailpoet"><tbody>';

                // ID
                /*
                $html .= '<tr id="zbs-view-vital-mailpoet-id" class="wraplines">';
                    $html .= '<td class="zbs-view-vital-mailpoet-label">ID</td>';
                    $html .= '<td class="zbs-view-vital-mailpoet-value">' . $subscriber['id'] . '</td>';
                $html .= '</tr>';
                */

                // Status
                $html .= '<tr id="zbs-view-vital-mailpoet-status" class="wraplines">';
                    $html .= '<td class="zbs-view-vital-mailpoet-label">' . __( 'Status', 'zero-bs-crm' ) . '</td>';
                    $html .= '<td class="zbs-view-vital-mailpoet-value">' . ucwords( $subscriber['status'] ) . '</td>';
                $html .= '</tr>';

                // Email Count
                $html .= '<tr id="zbs-view-vital-mailpoet-email-count" class="wraplines">';
                    $html .= '<td class="zbs-view-vital-mailpoet-label">' . __( 'Email Count', 'zero-bs-crm' ) . '</td>';
                    $html .= '<td class="zbs-view-vital-mailpoet-value">' . zeroBSCRM_prettifyLongInts( ( isset( $subscriber['email_count'] ) ? $subscriber['email_count'] : 0 ) ) . '</td>';
                $html .= '</tr>';

                // Lists
                $html .= '<tr id="zbs-view-vital-mailpoet-lists" class="wraplines">';
                    $html .= '<td class="zbs-view-vital-mailpoet-label">' . __( 'Lists', 'zero-bs-crm' ) . '</td>';
                    $html .= '<td class="zbs-view-vital-mailpoet-value">';

                        if ( !is_array( $subscriber['subscriptions'] ) || count( $subscriber['subscriptions'] ) <= 0 ){

                            $html .= '<div class="ui message info blue"><i class="ui icon info circle"></i>' . __( "This contact is not a MailPoet subscriber.", 'zero-bs-crm' ) . '</div>';
                        
                        } else {

                            $html .= '<div class="ui segment">';
                            $sub_count = 0;

                            foreach ( $subscriber['subscriptions'] as $subscription ){

                                if ( $sub_count > 0 ){

                                    $html .= '<div class="ui divider"></div>';

                                }

                                $html .= '<a href="' . $zbs->modules->mailpoet->get_mailpoet_list_subs_link( $subscription['segment_id'] ) . '" target="_blank">' . ( isset( $subscription['segment_name'] ) ? $subscription['segment_name'] : __( 'MailPoet Segment', 'zero-bs-crm' ) ) . '</a>';

                                $sub_count++;
                            }

                            $html .= '</div>';

                        }

                    $html .= '</td>';
                $html .= '</tr>';

                // Tags
                $html .= '<tr id="zbs-view-vital-mailpoet-lists" class="wraplines">';
                    $html .= '<td class="zbs-view-vital-mailpoet-label">' . __( 'Tags', 'zero-bs-crm' ) . '</td>';
                    $html .= '<td class="zbs-view-vital-mailpoet-value">';

                        if ( !is_array( $subscriber['tags'] ) || count( $subscriber['tags'] ) <= 0 ){

                            $html .= '<div class="ui message info blue"><i class="ui icon info circle"></i>' . __( "This MailPoet Subscriber does not have any tags.", 'zero-bs-crm' ) . '</div>';
                        
                        } else {

                            foreach ( $subscriber['tags'] as $tag ){

                                $html .= '<a class="ui tag label" href="' . $zbs->modules->mailpoet->get_mailpoet_list_tagged_link( $tag['tag_id'] ) . '" target="_blank">' . ( isset( $tag['name'] ) ? $tag['name'] : __( 'Unknown', 'zero-bs-crm' ) ) . '</a>&nbsp;';

                            }

                        }

                    $html .= '</td>';
                $html .= '</tr>';
            
            $html .= '</tbody></table>';

            // link
            $html .= '<div style="padding:2em;text-align:center"><a href="' . $zbs->modules->mailpoet->get_mailpoet_sub_stats_link( $subscriber['id'] ) . '" target="_blank" class="ui button blue">' . __( 'View in MailPoet', 'zero-bs-crm' ) . '</a></div>';


        } else {

			$html .= '<div class="ui message"><i class="ui icon info circle"></i>' . __( 'This contact does not have a MailPoet subscriber.', 'zero-bs-crm' ) . '</div>';
        
        }

        return $html;
    }
}
