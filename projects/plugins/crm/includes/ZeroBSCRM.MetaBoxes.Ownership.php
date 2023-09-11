<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.2
 *
 * Copyright 2020 Automattic
 *
 * Date: 29/06/2017
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */




/* ======================================================
   Init Func
   ====================================================== */

   function zeroBSCRM_OwnershipMetaboxSetup(){

        $zeroBS__OwnershipMetabox = new zeroBS__OwnershipMetabox( __FILE__ );

   }

   // Note: DB2, init individually on each page :)
   add_action( 'after_zerobscrm_settings_init','zeroBSCRM_OwnershipMetaboxSetup'); 

/* ======================================================
   / Init Func
   ====================================================== */



/* ======================================================
  Ownership Metabox (Pre db2)
   ====================================================== */

    class zeroBS__OwnershipMetabox {

        static $instance;
        #private $packPerm;
        #private $pack;
        private $postTypes;

        public function __construct( $plugin_file ) {
           # if ( $this->instance instanceof wProject_Metabox ) {
            #    wp_die( sprintf( __( 'Cannot instantiate singleton class: %1$s. Use %1$s::$instance instead.', 'zero-bs-crm' ), __CLASS__ ) );
            #} else {
                self::$instance = $this;
            #}


            #$this->postType = 'zerobs_customer';
            #add_action( 'add_meta_boxes', array( $this, 'create_meta_box' ) );
            #} Moved to multiples 1.1.19 WH
            $this->postTypes = array('zerobs_customer','zerobs_company');        
            add_action( 'add_meta_boxes', array( $this, 'initMetaBox' ) );
            add_filter( 'save_post', array( $this, 'save_meta_box' ), 10, 2 );
        }

        public function initMetaBox(){

            if (count($this->postTypes) > 0) foreach ($this->postTypes as $pt){

                #} pass an arr
                $callBackArr = array($this,$pt);

                add_meta_box(
                    'wpzbscownership_itemdetails_'.$pt,
                    __('Assigned To',"zero-bs-crm"),
                    array( $this, 'print_meta_box' ),
                    $pt,
                    'side',
                    'low',
                    $callBackArr
                );

            }

        }
        /*
        public function create_meta_box() {


            #} Don't share for new customers :)
            #if (isset($this->ID)){

                    add_meta_box(
                        'wpzbscext_itemdetails',
                        'External Source(s)',
                        array( $this, 'print_meta_box' ),
                        $this->postType,
                        'side',
                        'low'
                    );            

            #}
        }
        */
        public function print_meta_box( $post, $metabox ) {


                global $zbs;
                $canGiveOwnership = $zbs->settings->get('usercangiveownership');
                $zbsPossibleOwners = array();
                $canChangeOwner = ($canGiveOwnership == "1" || current_user_can('administrator'));

                #} Post type
                $postType = ''; if (isset($metabox['args']) && isset($metabox['args'][1]) && !empty($metabox['args'][1])) $postType = $metabox['args'][1];

                #} Only load if is legit.
                if (in_array($postType,array('zerobs_customer','zerobs_company'))){

                    #} retrieve 
                    switch ($postType){

                        case "zerobs_customer":

                            $zbsThisOwner = zeroBS_getCustomerOwner($post->ID);

                            #} If allowed to change assignment, load other possible users
                            if ($canChangeOwner) $zbsPossibleOwners = zeroBS_getPossibleCustomerOwners();

                            break;
                        case "zerobs_company":

                            $zbsThisOwner = zeroBS_getCompanyOwner($post->ID);

                            #} If allowed to change assignment, load other possible users
                            if ($canChangeOwner) $zbsPossibleOwners = zeroBS_getPossibleCompanyOwners();

                            break;

                        default:
                            $zbsThisOwner = array();
                            break;

                    }

                    #} Can change owner, or has owner details, then show... (this whole box will be hidden if setting says no ownerships)
                    if ($canChangeOwner || isset($zbsThisOwner['ID'])){


                        #} Either: "assigned to DAVE" or "assigned to DAVE (in drop down list)"
                

                    // for checks
                    if (is_array($zbsThisOwner) && isset($zbsThisOwner['ID'])) $zbsThisOwner['ID'] = (int)$zbsThisOwner['ID'];
                ?>
                    <input type="hidden" name="meta_box_ids[]" value="<?php echo esc_attr($metabox['id']); ?>" />
                    <?php wp_nonce_field( 'save_' . $metabox['id'], $metabox['id'] . '_nonce' ); ?>
                    
                    <table class="form-table wh-metatab wptbp" id="wptbpMetaBoxOwnership">

                        <?php if (!$canChangeOwner) {


                            # simple unchangable

                            ?><tr><td>
                                <?php if ($zbsThisOwner['ID'] !== -1) 
                                            echo esc_html( $zbsThisOwner['OBJ']->display_name );
                                        else
                                            echo esc_html__('None',"zero-bs-crm"); ?>
                            </td></tr><?php # .' ('.esc_html( $zbsThisOwner['OBJ']->user_login ).')'

                        } else {

                            #} DDL 

                            ?><tr><td>
                                <select class="" id="zerobscrm-owner" name="zerobscrm-owner">
                                    <option value="-1"><?php esc_html_e('None',"zero-bs-crm");?></option>
                                    <?php if (count($zbsPossibleOwners) > 0) foreach ($zbsPossibleOwners as $possOwner){

                                        ?><option value="<?php echo esc_attr($possOwner->ID); ?>"<?php 
                                        if ($possOwner->ID == $zbsThisOwner['ID']) echo ' selected="selected"';
                                        ?>><?php echo esc_html( $possOwner->display_name ); ?></option><?php # .' ('.esc_html( $possOwner->user_login ).')';

                                    } ?>
                                </select>
                            </td></tr><?php

                        } ?>


                    </table>


                <style type="text/css">
                </style>
                <script type="text/javascript">

                    jQuery(function(){

                    });


                </script>
                
                <?php


                } else {

                    #} Gross hide :/

                    ?><style type="text/css">#wpzbscownership_itemdetails_<?php echo esc_html($postType); ?> {display:none;}</style><?php

                    #} But include this for save... quick fix 2.2
                    ?>
                    <input type="hidden" name="meta_box_ids[]" value="<?php echo esc_attr($metabox['id']); ?>" />
                    <?php wp_nonce_field( 'save_' . $metabox['id'], $metabox['id'] . '_nonce' ); ?>
                    <?php

                }

            } // / only load if post type

        }

       public function save_meta_box( $post_id, $post ) {
            if( empty( $_POST['meta_box_ids'] ) ){ return; }
            foreach( $_POST['meta_box_ids'] as $metabox_id ){
                if( !isset($_POST[ $metabox_id . '_nonce' ]) || ! wp_verify_nonce( $_POST[ $metabox_id . '_nonce' ], 'save_' . $metabox_id ) ){ continue; }
                #if( count( $_POST[ $metabox_id . '_fields' ] ) == 0 ){ continue; }
                if( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ){ continue; }

                foreach ($this->postTypes as $postType){

                    if( $metabox_id == 'wpzbscownership_itemdetails_'.$postType  && $post->post_type  == $postType){


                        global $zbs;
                        $canGiveOwnership = $zbs->settings->get('usercangiveownership');
                        $canChangeOwner = ($canGiveOwnership == "1" || current_user_can('administrator'));


                        $newOwner = -1; if (isset($_POST['zerobscrm-owner']) && !empty($_POST['zerobscrm-owner'])) $newOwner = (int)sanitize_text_field($_POST['zerobscrm-owner']);

                        #} If newly created and no new owner specified, use self:
                        if (isset($_POST['zbscrm_newcustomer']) && $newOwner === -1){

                                $newOwner = get_current_user_id();

                        } 

                        #} Save - only if they can change owner
                        if ($canChangeOwner) {
                            zeroBS_setOwner($post_id,$newOwner);
                        }

                        //echo 'SAVING '.$newOwner.'!'; exit();

                    }

                }
            }

            return $post;
        } 
    }


/* ======================================================
  / Ownership Metabox
   ====================================================== */
/* ======================================================
  Ownership Metabox DB2
   ====================================================== */

    class zeroBS__Metabox_Ownership extends zeroBS__Metabox{


        public function __construct( $plugin_file ) {

            // set these
            $this->postType = 'zerobs_customer';
            $this->metaboxID = 'zerobs-customer-owner';
            $this->metaboxTitle = __('Assigned To',"zero-bs-crm");
            $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
            $this->metaboxArea = 'side';
            $this->metaboxLocation = 'low';

            // call this 
            $this->initMetabox();


        }

        public function html( $contact, $metabox ) {


                global $zbs;
                $canGiveOwnership = $zbs->settings->get('usercangiveownership');
                $zbsPossibleOwners = array();
                $canChangeOwner = ($canGiveOwnership == "1" || current_user_can('administrator'));

                #} Only load if is legit.
                if (in_array($this->postType,array('zerobs_customer','zerobs_company'))){

                    #} retrieve 
                    switch ($this->postType){

                        case "zerobs_customer":

                            // actually just allow to re-get here, as seems to beat some caching issue
                            //if (!is_array($contact) || !isset($contact['owner']) || $contact['owner'] <=0){

                                // DB1...
                                $zbsThisOwner = zeroBS_getCustomerOwner($contact['id']);

                            //} else {

                                // DAL2 we have owner already in contact[owner]
                            //    $zbsThisOwner = zeroBS_getOwnerObj($contact['owner']);

                            //}


                            #} If allowed to change assignment, load other possible users
                            if ($canChangeOwner) $zbsPossibleOwners = zeroBS_getPossibleCustomerOwners();

                            break;
                        case "zerobs_company":

                            // DB1...
                            $zbsThisOwner = zeroBS_getCompanyOwner($contact['id']);

                            #} If allowed to change assignment, load other possible users
                            if ($canChangeOwner) $zbsPossibleOwners = zeroBS_getPossibleCompanyOwners();

                            break;

                        default:
                            $zbsThisOwner = array();
                            break;

                    }

                    #} Can change owner, or has owner details, then show... (this whole box will be hidden if setting says no ownerships)
                    if ($canChangeOwner || isset($zbsThisOwner['ID'])){


                        #} Either: "assigned to DAVE" or "assigned to DAVE (in drop down list)"
                
                        if (!$canChangeOwner) {


                            # simple unchangable

                            ?><div style="text-align:center">
                                <?php echo esc_html( $zbsThisOwner['OBJ']->display_name ); ?>
                            </div><?php # .' ('.esc_html( $zbsThisOwner['OBJ']->user_login ).')'

                        } else {

                            #} DDL 

                            ?><div style="text-align:center">
                                <select class="" id="zerobscrm-owner" name="zerobscrm-owner">
                                    <option value="-1"><?php esc_html_e('None',"zero-bs-crm");?></option>
                                    <?php if (count($zbsPossibleOwners) > 0) foreach ($zbsPossibleOwners as $possOwner){

                                        ?><option value="<?php echo esc_attr($possOwner->ID); ?>"<?php 
                                        if (isset($zbsThisOwner['ID']) && $possOwner->ID == $zbsThisOwner['ID']) echo ' selected="selected"';
                                        ?>><?php echo esc_html( $possOwner->display_name ); ?></option><?php # .' ('.esc_html( $possOwner->user_login ).')';
                                    
                                    } ?>
                                </select>
                            </div><?php

                        }


                } /*else {

                    #} Gross hide :/

                    ?><style type="text/css">#wpzbscownership_itemdetails_<?php echo $this->postType; ?> {display:none;}</style><?php


                }*/

            } // / only load if post type

        }

       public function save_data( $post_id, $post ) {


            $newOwner = -1; if (isset($_POST['zerobscrm-owner']) && !empty($_POST['zerobscrm-owner'])) $newOwner = (int)sanitize_text_field($_POST['zerobscrm-owner']);

            #} If newly created and no new owner specified, use self:
            if (isset($_POST['zbscrm_newcustomer']) && $newOwner === -1){

                $newOwner = get_current_user_id();

            } 

            //echo 'saving '.$post_id.'!'.$newOwner;
            //print_r($post); exit();

            #} Save
            zeroBS_setOwner($post_id,$newOwner,$this->postType);


            return $post;
        } 
    }


/* ======================================================
  / Ownership Metabox DB2
   ====================================================== */