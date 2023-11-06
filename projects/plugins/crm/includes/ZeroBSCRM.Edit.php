<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.52+
 *
 * Copyright 2020 Automattic
 *
 * Date: 26/02/18
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

class zeroBSCRM_Edit{

    private $objID = false;
    private $obj = false; 
    private $objTypeID = false; // ZBS_TYPE_CONTACT - v3.0+

    // following now FILLED OUT by objTypeID above, v3.0+
    private $objType = false; // 'contact'
    private $singular = false; 
    private $plural = false;
    // renamed listViewSlug v3.0+ private $postPage = false;
    private $listViewSlug = false;

    private $langLabels = false;
    private $bulkActions = false;
    private $sortables = false;
    private $unsortables = false;
    private $extraBoxes = '';
    private $isGhostRecord = false;
    private $isNewRecord = false;

    // permissions
    private $has_permissions_to_edit = false;

    function __construct($args=array()) {


        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            'objID' => false,
            'objTypeID'   => false,   //5

             // these are now retrieved from DAL centralised vars by objTypeID above, v3.0+
             // ... unless hard typed here.
            'objType'   => false,   //transaction
            'singular'   => false,  //Transaction
            'plural' => false,      //Transactions
            'listViewSlug' => false,    //manage-transactions

            'langLabels' => array(
                    
            ),
            'extraBoxes' => '' // html for extra boxes e.g. upsells :)

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        // NOTE: here these vars are passed like:
        // $this->objID
        // .. NOT
        // $objID


        global $zbs;

        // we load from DAL defaults, if objTypeID passed (overriding anything passed, if empty/false)
        if (isset($this->objTypeID)){ //$zbs->isDAL3() && 

            $objTypeID = (int)$this->objTypeID;
            if ($objTypeID > 0){

                // obj type (contact)
                $objTypeStr = $zbs->DAL->objTypeKey($objTypeID);
                if ((!isset($this->objType) || $this->objType == false) && !empty($objTypeStr)) $this->objType = $objTypeStr;

                // singular
                $objSingular = $zbs->DAL->typeStr($objTypeID);
                if ((!isset($this->singular) || $this->singular == false) && !empty($objSingular)) $this->singular = $objSingular;

                // plural
                $objPlural = $zbs->DAL->typeStr($objTypeID,true);
                if ((!isset($this->plural) || $this->plural == false) && !empty($objPlural)) $this->plural = $objPlural;

                // listViewSlug
                $objSlug = $zbs->DAL->listViewSlugFromObjID($objTypeID);
                if ((!isset($this->listViewSlug) || $this->listViewSlug == false) && !empty($objSlug)) $this->listViewSlug = $objSlug;

            }

            //echo 'loading from '.$this->objTypeID.':<pre>'.print_r(array($objTypeStr,$objSingular,$objPlural,$objSlug),1).'</pre>'; exit();

        } else $this->isNewRecord = true;

        // if objid - load $post
        $this->loadObject();

        // Ghost?
        if ($this->objID !== -1 && !$this->isNewRecord && isset($this->objTypeID) && !is_array($this->obj)) $this->isGhostRecord = true;

        // anything to save?
        $this->catchPost(); 

        // include any 'post learn menu' code
        add_action( 'zerobscrm-subtop-menu', array( $this, 'post_learn_menu_output' ) );

    }

    // automatically, generically, loads the single obj
    public function loadObject(){

        // if objid - load $post
        if ( isset( $this->objID ) && !empty( $this->objID ) && $this->objID > 0 ) {

            global $zbs;

            if ( $this->objTypeID > 0 ){

                // got permissions?
                if ( zeroBSCRM_permsObjType( $this->objTypeID ) ){

                    // this gets $zbs->DAL->contacts->getSingle()
                    $this->obj = $zbs->DAL->getObjectLayerByType($this->objTypeID)->getSingle($this->objID);

                    // has permissions
                    $this->has_permissions_to_edit = true;

                }

            }

        }

    }

    public function catchPost(){

        // If post, fire do_action
        if (isset($_POST['zbs-edit-form-master']) && $_POST['zbs-edit-form-master'] == $this->objType){

            // make sure we have perms to save
            if ($this->preChecks()) {
              // fire it
              do_action('zerobs_save_'.$this->objType, $this->objID, $this->obj);
              // after catching post, we need to reload data :) (as may be changed)
              $this->loadObject();
            }


        }
    }

    // check ownership, access etc. 
    public function preChecks(){

        global $zbs;

        // only do this stuff v3.0+
        if ($zbs->isDAL3()){

          $is_malformed_obj = false;

          if (is_array($this->obj) && isset($this->obj['owner'])){
            $objOwner = (int)$this->obj['owner'];
          } else {
            // if $this->obj is not an array, somehow it's not been loaded properly (probably perms)
            // get owner info anyway
            $is_malformed_obj = true;
            $objOwner = $zbs->DAL->getObjectOwner(array(
              'objID'           => $this->objID,
              'objTypeID'       => $this->objTypeID
            ));
          }
          // get current user
          $currentUserID = get_current_user_id();

          if ($objOwner > 0 && $objOwner != $currentUserID){
            // not current user
            // does user have perms to edit?
            $canEditAllContacts = current_user_can('admin_zerobs_customers') && $zbs->settings->get('perusercustomers') == 0;
            $canGiveOwnership = $zbs->settings->get('usercangiveownership') == 1;
            $canChangeOwner = ($canGiveOwnership || current_user_can('administrator') || $canEditAllContacts);

            if (!$canChangeOwner){

              // owners can't be changed with user's perms, so denied msg
              $this->preCheckFail( sprintf( __( 'You do not have permission to edit this %s.', 'zero-bs-crm' ), $zbs->DAL->typeStr( $this->objTypeID ) ) );
              return false;

            }
            if ( !$this->has_permissions_to_edit ){

              // user does not have a role which can edit this object type
              $this->preCheckFail( sprintf( __( 'You do not have permission to edit this %s.', 'zero-bs-crm' ), $zbs->DAL->typeStr( $this->objTypeID ) ) );
              return false;

            }
            if ( $is_malformed_obj ) {
              // not a perms issue, so show general error
              $this->preCheckFail( sprintf( __( 'There was an error loading this %s.', 'zero-bs-crm' ), $zbs->DAL->typeStr( $this->objTypeID ) ) );
              return false;
            }

          }

        }
        
        //load if is legit
        return true;
    }

    public function preCheckFail($msg=''){

            echo '<div id="zbs-obj-edit-precheck-fail" class="ui grid"><div class="row"><div class="two wide column"></div><div class="twelve wide column">';
            echo zeroBSCRM_UI2_messageHTML('warning',$msg,'','disabled warning sign','failRetrieving');
            echo '</div></div>';

            // grim quick hack to hide save button
            echo '<style>#zbs-edit-save{display:none}</style>';
    }

    /*
    *  Code added to this function will be called just after the learn menu is output
    *  (where we're on an edit page)
    */
    public function post_learn_menu_output(){

        // put screen options out
        zeroBSCRM_screenOptionsPanel();

    }

    public function drawEditView(){

        // run pre-checks which verify ownership etc.
        $okayToDraw = $this->preChecks();

        // draw if okay :)
        if ($okayToDraw) $this->drawEditViewHTML();

    }

    public function drawEditViewHTML(){

        if (empty($this->objType) || empty($this->listViewSlug) || empty($this->singular) || empty($this->plural)){


            echo zeroBSCRM_UI2_messageHTML('warning','Error Retrieving '.$this->singular,'There has been a problem retrieving your '.$this->singular.', if this issue persists, please contact support.','disabled warning sign','zbsCantLoadData');  
            return false;

        }

        // catch id's passed where no contact exists for them.
        if ($this->isGhostRecord){

            // brutal hide, then msg #ghostrecord
            ?><style type="text/css">#zbs-edit-save, #zbs-nav-view, #zbs-nav-prev, #zbs-nav-next { display:none; }</style>
            <div id="zbs-edit-warnings-wrap"><?php
            echo zeroBSCRM_UI2_messageHTML('warning','Error Retrieving '.$this->singular,'There does not appear to be a '.$this->singular.' with this ID.','disabled warning sign','zbsCantLoadData');  
            ?></div><?php  
            return false;

        }

        // catch if is new record + hide zbs-nav-view
        if ($this->isNewRecord){

            // just hide button via css. Should just stop this via learn in time
            ?><style type="text/css">#zbs-nav-view { display:none; }</style><?php  

        }

        global $zbs;

        // run pre-checks which verify ownership etc.
        $this->preChecks();


        ?><div id="zbs-edit-master-wrap"><form method="post" id="zbs-edit-form" enctype="multipart/form-data"><input type="hidden" name="zbs-edit-form-master" value="<?php echo esc_attr( $this->objType ); ?>" />

            <div id="zbs-edit-warnings-wrap">
                <?php #} Pre-loaded msgs, because I wrote the helpers in php first... should move helpers to js and fly these 

                echo zeroBSCRM_UI2_messageHTML('warning hidden','Error Retrieving '.$this->plural,'There has been a problem retrieving your '.$this->singular.', if this issue persists, please ask your administrator to reach out to Jetpack CRM.','disabled warning sign','zbsCantLoadData');
                echo zeroBSCRM_UI2_messageHTML('warning hidden','Error Retrieving '.$this->singular,'There has been a problem retrieving your '.$this->singular.', if this issue persists, please ask your administrator to reach out to Jetpack CRM.','disabled warning sign','zbsCantLoadDataSingle');
              
                ?>
            </div>
            <!-- main view: list + sidebar -->
            <div id="zbs-edit-wrap" class="ui divided grid <?php echo 'zbs-edit-wrap-'. esc_attr( $this->objType ); ?>">

                <?php

                    if (count($zbs->pageMessages) > 0){
                
                        #} Updated Msgs
                        // was doing like this, but need control over styling
                        // do_action( 'zerobs_updatemsg_contact');
                        // so for now just using global :)
                        echo '<div class="row" style="padding-bottom: 0 !important;" id="zbs-edit-notification-row"><div class="sixteen wide column" id="zbs-edit-notification-wrap">';

                            foreach ($zbs->pageMessages as $msg){

                                // for now these can be any html :)
                                echo $msg;

                            }

                        echo '</div></div>';

                    }



                ?>

                <div class="row">


                    <!-- record list -->
                    <div class="twelve wide column" id="zbs-edit-table-wrap">

                        <?php 
                            #} Main Metaboxes
                            zeroBSCRM_do_meta_boxes( 'zbs-add-edit-'.$this->objType.'-edit', 'normal', $this->obj );
                        ?>

                    </div>
                    <!-- side bar -->
                    <div class="four wide column" id="zbs-edit-sidebar-wrap">
                        <?php 

                            #} Sidebar metaboxes
                            zeroBSCRM_do_meta_boxes( 'zbs-add-edit-'.$this->objType.'-edit', 'side', $this->obj );

                        ?>

                        <?php ##WLREMOVE ?>
                        <?php echo $this->extraBoxes; ?>
                        <?php ##/WLREMOVE ?>
                    </div>
                </div>

                <!-- could use this for mobile variant?) 
                <div class="two column mobile only row" style="display:none"></div>
                -->
            </div> <!-- / mainlistview wrap -->
        </form></div>

        <script type="text/javascript">

            jQuery(function($){

                console.log("======= EDIT VIEW UI =========");
                
                jQuery('.show-more-tags').on("click",function(e){
                    jQuery('.more-tags').show();
                    jQuery(this).hide();
                });

            });

            // General options for edit page
            var zbsEditSettings = {

                objid: <?php echo esc_js( $this->objID ); ?>,
                objdbname: '<?php echo esc_js( $this->objType ); ?>',
                nonce: '<?php echo esc_js( wp_create_nonce( 'edit-nonce-'. $this->objType ) ); ?>'

            };
            var zbsDrawEditViewBlocker = false;
            var zbsDrawEditAJAXBlocker = false;

            <?php // these are all legacy, move over to zeroBSCRMJS_obj_editLink in global js: ?>
            var zbsObjectViewLinkPrefixCustomer = '<?php echo jpcrm_esc_link( 'view', -1, 'zerobs_customer', true ); ?>';
            var zbsObjectEditLinkPrefixCustomer = '<?php echo jpcrm_esc_link( 'edit', -1, 'zerobs_customer', true ); ?>';
            var zbsObjectViewLinkPrefixCompany = '<?php echo jpcrm_esc_link( 'view', -1, 'zerobs_company', true ); ?>';
            var zbsListViewLink = '<?php echo jpcrm_esc_link( $this->listViewSlug ); ?>';

            
            var zbsClick2CallType = parseInt('<?php echo esc_html( zeroBSCRM_getSetting('clicktocalltype') ); ?>');
            var zbsEditViewLangLabels = {

                    'today': '<?php echo esc_html( zeroBSCRM_slashOut(__('Today',"zero-bs-crm")) ); ?>',
                    'view': '<?php echo esc_html( zeroBSCRM_slashOut(__('View',"zero-bs-crm")) ); ?>',
                    'contact': '<?php echo esc_html( zeroBSCRM_slashOut(__('Contact',"zero-bs-crm")) ); ?>',
                    'company': '<?php echo esc_html( zeroBSCRM_slashOut(jpcrm_label_company()) ); ?>',

                    <?php $labelCount = 0; 
                    if (count($this->langLabels) > 0) foreach ($this->langLabels as $labelK => $labelV){

                        if ($labelCount > 0) echo ',';

                        echo esc_html( $labelK ).":'". esc_html( zeroBSCRM_slashOut($labelV,true) )."'";

                        $labelCount++;

                    } ?>

            };
            <?php   #} Nonce for AJAX
                    echo "var zbscrmjs_secToken = '" . esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ) . "';"; ?></script><?php

    } // /draw func
} // class
