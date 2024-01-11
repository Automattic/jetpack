<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 14/06/2019
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */


/* ======================================================
  DB MIGRATION Helper - Lock Metaboxes 
  Locks metaboxes so no edits can be enacted while migration in process
  (DAL2, not yet v3.0)
   ====================================================== */




/* ======================================================
   Init Func
   ====================================================== */

   function zeroBSCRM_LockMetaboxSetup(){

      // Lock all CPT Metabox edit pages:
      $zeroBS__Metabox_Lock = new zeroBS__Metabox_Lock( __FILE__, array('zerobs_customer','zerobs_company','zerobs_invoice','zerobs_quote','zerobs_transaction','zerobs_form','zerobs_mailcampaign','zerobs_quotetemplate','zerobs_event') );

      // Lock DAL2 Contacts edit page:
      $zeroBS__Metabox_ContactLock = new zeroBS__Metabox_ContactLock(__FILE__);

      // lock the DAL2 Contact view page:
      $zeroBS__Metabox_ContactViewLock = new zeroBS__Metabox_ContactViewLock(__FILE__);

      // add global to learn menu:
      add_action( 'zerobscrm-subtop-menu', 'zeroBSCRM_lockToLearnMenu' );

   }

   add_action( 'admin_init','zeroBSCRM_LockMetaboxSetup');

/* ======================================================
   / Init Func
   ====================================================== */

   function zeroBSCRM_lockToLearnMenu(){

      global $zbs;

      // if not the migration page
      if (zeroBSCRM_isAdminPage() && !zeroBS_isPage(array('admin.php'),false,array($zbs->slugs['migratedal3']))){

          // Migration / IMPERITIVE notifications
            ?><div id="zbs-lockout-top-menu-notification" style="margin: 1em;margin-right:2em;margin-top: 3em;"><?php

                    echo zeroBSCRM_UI2_messageHTML('small warning',__('CRM Database Update Needed',"zero-bs-crm"),__('Your CRM data needs to be migrated, you will not be able to edit CRM information until your database has been migrated.',"zero-bs-crm"),'disabled warning sign','zbsNope'); 
                    
                    if (current_user_can( 'manage_options' )){
                            
                        ?><a href="<?php echo esc_url( admin_url('admin.php?page='.$zbs->slugs['migratedal3']) ); ?>" class="ui button small blue"><?php esc_html_e('Go to Migration',"zero-bs-crm"); ?></a><?php

                    } 

            ?><hr />
            </div><?php

      }
      
   }

/* ======================================================
  LOCKED (v2) Metabox
   ====================================================== */

    class zeroBS__Metabox_Lock {

        static $instance;
        private $postTypes;

        public function __construct( $plugin_file, $typesToLock=array('zerobs_customer') ) {
            self::$instance = $this;
            $this->postTypes = $typesToLock;
            add_action( 'add_meta_boxes', array( $this, 'initMetaBox' ) );
        }

        public function initMetaBox(){

            if (count($this->postTypes) > 0) foreach ($this->postTypes as $pt){

                #} pass an arr
                $callBackArr = array($this,$pt);

                add_meta_box(
                    'wpzbsc_lockdetails_'.$pt,
                    __('Locked',"zero-bs-crm"),
                    array( $this, 'print_meta_box' ),
                    $pt,
                    'normal',
                    'high',
                    $callBackArr
                );

            }

        }

        public function print_meta_box( $post, $metabox ) {

            #} Display locked msg + hide EVERYTHING else :)

            global $zbs;

            ?><div id="zbs-lockout" class="ui modal">
                <div class="content">
                <?php 
                    echo zeroBSCRM_UI2_messageHTML('large info',__('CRM Database Update Needed',"zero-bs-crm"),__('Your CRM data needs to be migrated, you will not be able to edit CRM information until your database has been migrated.',"zero-bs-crm"),'disabled warning sign','zbsNope'); 
                ?></div><div class="actions"><?php if (current_user_can( 'manage_options' )){

                        
                    ?><a href="<?php echo esc_url( admin_url('admin.php?page='.$zbs->slugs['migratedal3']) ); ?>" class="ui button large blue"><?php esc_html_e('Go to Migration',"zero-bs-crm"); ?></a><?php

                } ?></div>
            </div>
            <style>
                #postbox-container-1, #postbox-container-2, #titlewrap { display:none !important;}
            </style>
            <script type="text/javascript">
            jQuery(function(){
                jQuery('#zbs-lockout').modal({closable:false}).modal('show').modal('refresh');

            });
            </script><?php


        }
    }

/* ======================================================
  / Lock v2 Metabox
   ====================================================== */


/* ======================================================
   Lock (our non-cpt) Contact edit screen
   ====================================================== */

class zeroBS__Metabox_ContactLock extends zeroBS__Metabox{


    public function __construct( $plugin_file ) {
    
        // DAL3 switched for objType $this->postType = 'zerobs_customer';
        $this->objType = 'contact';
        $this->metaboxID = 'zerobs-lockdown';
        $this->metaboxTitle = 'Locked';
        $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
        $this->metaboxArea = 'normal';
        $this->metaboxLocation = 'high';
        $this->capabilities = array(

            'can_hide'          => true, // can be hidden
            'areas'             => array('side'), // areas can be dragged to - normal side = only areas currently
            'can_accept_tabs'   => false,  // can/can't accept tabs onto it
            'can_become_tab'    => false, // can be added as tab
            'can_minimise'      => true // can be minimised

        );

        // call this 
        $this->initMetabox();

    }

    public function html( $contact, $metabox ) {

            #} Display locked msg + hide EVERYTHING else :)

            global $zbs;

            ?><div id="zbs-lockout" class="ui modal">
                <div class="content">
                <?php 
                    echo zeroBSCRM_UI2_messageHTML('large info',__('CRM Database Update Needed',"zero-bs-crm"),__('Your CRM data needs to be migrated, you will not be able to edit CRM information until your database has been migrated.',"zero-bs-crm"),'disabled warning sign','zbsNope'); 
                ?></div><div class="actions"><?php if (current_user_can( 'manage_options' )){

                        
                    ?><a href="<?php echo esc_url( admin_url('admin.php?page='.$zbs->slugs['migratedal3']) ); ?>" class="ui button large blue"><?php esc_html_e('Go to Migration',"zero-bs-crm"); ?></a><?php

                } ?></div>
            </div>
            <style>
                #zbs-edit-wrap { display:none !important;}
            </style>
            <script type="text/javascript">
            jQuery(function(){
                jQuery('#zbs-lockout').modal({closable:false}).modal('show').modal('refresh');

            });
            </script><?php

    }

    public function save_data( $contact_id, $contact ) {
        return $contact;
    }
}

/* ======================================================
  / Lock (our non-cpt) Contact edit screen
   ====================================================== */


/* ======================================================
   Lock Contact view screen
   ====================================================== */

class zeroBS__Metabox_ContactViewLock extends zeroBS__Metabox{


    public function __construct( $plugin_file ) {
    
        // DAL3 switched for objType $this->postType = 'zerobs_customer';
        $this->objType = 'contact';
        $this->metaboxID = 'zerobs-lockdown';
        $this->metaboxTitle = 'Locked';
        $this->metaboxScreen = 'zbs-view-contact'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
        $this->metaboxArea = 'side';
        $this->metaboxLocation = 'high';
        $this->capabilities = array(

            'can_hide'          => true, // can be hidden
            'areas'             => array('side'), // areas can be dragged to - normal side = only areas currently
            'can_accept_tabs'   => false,  // can/can't accept tabs onto it
            'can_become_tab'    => false, // can be added as tab
            'can_minimise'      => true // can be minimised

        );

        // call this 
        $this->initMetabox();

    }

    public function html( $contact, $metabox ) {

            #} Display locked msg + hide EVERYTHING else :)

            global $zbs;

            ?><div id="zbs-lockout" class="ui modal">
                <div class="content">
                <?php 
                    echo zeroBSCRM_UI2_messageHTML('large info',__('CRM Database Update Needed',"zero-bs-crm"),__('Your CRM data needs to be migrated, you will not be able to edit CRM information until your database has been migrated.',"zero-bs-crm"),'disabled warning sign','zbsNope'); 
                ?></div><div class="actions"><?php if (current_user_can( 'manage_options' )){

                        
                    ?><a href="<?php echo esc_url( admin_url('admin.php?page='.$zbs->slugs['migratedal3']) ); ?>" class="ui button large blue"><?php esc_html_e('Go to Migration',"zero-bs-crm"); ?></a><?php

                } ?></div>
            </div>
            <style>
                .ui.divided.grid { display:none !important;}
            </style>
            <script type="text/javascript">
            jQuery(function(){
                jQuery('#zbs-lockout').modal({closable:false}).modal('show').modal('refresh');

            });
            </script><?php

    }

    public function save_data( $contact_id, $contact ) {
        return $contact;
    }
}

/* ======================================================
  / Lock Contact view screen
   ====================================================== */


    #} Mark as included :)
    define('ZBSCRM_INC_LOCKMB',true);