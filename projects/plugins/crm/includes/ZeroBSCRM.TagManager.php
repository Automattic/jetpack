<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.52+
 *
 * Copyright 2020 Automattic
 *
 * Date: 19/03/18
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

class zeroBSCRM_TagManager{

    private $objTypeID = false;

    // following all set by objTypeID pass, v3.0+
    private $objType = false;
    private $singular = false;
    private $plural = false;
    // v3.0 this was removed private $postType = false; // set in child class 'zerobs_customer' // ONLY USED IN save funcs etc. maybe, potentially just legacy now.
    // renamed 'listViewSlug' v3.0+ private $postPage = false;
    private $listViewSlug = false;

    // except these:
    private $langLabels = false;
    private $extraBoxes = '';

    function __construct($args=array()) {


        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            'objTypeID'   => false,   //5 (v3.0+)

            'objType'   => false,   //transaction
            'singular'   => false,  //Transaction
            'plural' => false,      //Transactions
            //'postType' => false,    //zerobs_transaction - removed v3.0 + 
            // renamed 'listViewSlug' v3.0+ 'postPage' => false,    //manage-transactions-tags
            'listViewSlug' => false,
            'langLabels' => array(
                    
            ),
            'extraBoxes' => '' // html for extra boxes e.g. upsells :)

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============
        global $zbs;

        // we load from DAL defaults, if objType passed (overriding anything passed, if empty/false)
        if ($zbs->isDAL3() && isset($objTypeID)){

            $objTypeID = (int)$objTypeID;
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


        }

        // anything to save?
        $this->catchPost();

    }

    public function catchPost(){

        // If post, fire do_action
        if (isset($_POST['zbs-tag-form-master']) && $_POST['zbs-tag-form-master'] == $this->objType){

            // fire it
            do_action('zerobs_save_'.$this->objType.'_tags', $this->objID, $this->obj);

        }
        
    }

    public function drawTagView(){

        if (empty($this->objType) || empty($this->listViewSlug) || empty($this->singular) || empty($this->plural)){

            return 'Error.';
        }

        global $zbs;


        ?><div id="zbs-edit-master-wrap"><form method="post" id="zbs-edit-form" enctype="multipart/form-data"><input type="hidden" name="zbs-edit-form-master" value="<?php echo esc_attr( $this->objType ); ?>" />
        <style>

        </style>
        <?php   // left in for later :) 
                $currentFields = array(); $allFields = array(); ?>
            <!-- field editor -->
            <div id="zbs-edit-field-editor" class="ui segment secondary hidden">
            <?php if (current_user_can('administrator')){ ?>

                <h4 class="ui horizontal divider header">
                  <i class="list layout icon"></i>
                  <?php echo esc_html( $this->singular ) .' '. esc_html__('Field Manager',"zero-bs-crm"); ?>
                </h4>

                <div id="zbs-edit-field-wrap" class="ui divided grid">

                  <div class="ui active inverted dimmer hidden" id="zbs-field-manager-loading" style="display:none">
                    <div class="ui text loader"><?php esc_html_e('Loading',"zero-bs-crm");?></div>
                  </div>

                    <div class="row">
                        <div class="twelve wide column">

                            <h4><?php esc_html_e('Current Fields',"zero-bs-crm"); ?></h4>


                            <div id="zbs-column-manager-current-fields" class="ui segment zbs-column-manager-connected"> 
                                <?php if (is_array($currentFields)) foreach ($currentFields as $colKey => $col){

                                    ?><div id="zbs-column-manager-field-<?php echo esc_attr( $colKey ); ?>" class="ui basic button zbs-column-manager-field" data-key="<?php echo esc_attr( $colKey ); ?>"><?php esc_html_e($col[0],"zero-bs-crm"); ?></div><?php

                                } ?>
                            </div>

                        </div>
                        <div class="four wide column">

                            <h4><?php esc_html_e('Available Fields',"zero-bs-crm"); ?></h4>

                            <div id="zbs-column-manager-available-fields" class="ui segment zbs-column-manager-connected"> 
                                <?php if (is_array($allFields)) foreach ($allFields as $colKey => $col){

                                    if (!array_key_exists($colKey, $currentColumns)){
                                        
                                        ?><div id="zbs-column-manager-field-<?php echo esc_attr( $colKey ); ?>" class="ui basic button zbs-column-manager-field" data-key="<?php echo esc_attr( $colKey ); ?>"><?php esc_html_e($col[0],"zero-bs-crm"); ?></div><?php

                                    }

                                } ?>
                            </div>

                        </div>
                    </div>
                </div>



            <?php } // / can admin ?>

            </div>
            <!-- field manager -->

            <div id="zbs-edit-warnings-wrap">
                <?php #} Pre-loaded msgs, because I wrote the helpers in php first... should move helpers to js and fly these 

                echo zeroBSCRM_UI2_messageHTML('warning hidden','Error Retrieving '.$this->plural,'There has been a problem retrieving your '.$this->singular.', if this issue persists, please contact support.','disabled warning sign','zbsCantLoadData');
              
                ?>
            </div>
            <!-- main view: list + sidebar -->
            <div id="zbs-edit-wrap" class="ui divided grid">

                <?php

                    if (count($zbs->pageMessages) > 0){
                
                        #} Updated Msgs
                        // was doing like this, but need control over styling
                        // do_action( 'zerobs_updatemsg_contact');
                        // so for now just using global :)
                        echo '<div class="row" style="padding-bottom: 0 !important;"><div class="sixteen wide column" id="zbs-edit-notification-wrap">';

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
                            zeroBSCRM_do_meta_boxes( 'zerobs_edit_tags', 'normal', $this->objType );
                        ?>

                    </div>
                    <!-- side bar -->
                    <div class="four wide column" id="zbs-edit-sidebar-wrap">
                        <?php 

                            #} Sidebar metaboxes
                            zeroBSCRM_do_meta_boxes( 'zerobs_edit_tags', 'side', $this->objType );

                        ?>

                        <div class="ui divider"></div>
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
        <?php



            // make simpler
            $tags = $zbs->DAL->getTagsForObjType(array(

                'objtypeid'=>$zbs->DAL->objTypeID($this->objType),//ZBS_TYPE_CONTACT in place of 'contact'=>1, 'transaction'=> etc.
                'excludeEmpty'=>false,
                'withCount'=>false,
                'ignoreowner' => true

                ));
            $tagsArr = array(); if (is_array($tags) && count($tags) > 0) foreach ($tags as $t){
                $tagsArr[] = $t['name'];
            }
            $tags = $tagsArr;

        ?>

            // this forces firing of our custom init in admin.tags.metabox.js
            var zbsCustomTagInitFunc = 'zbsJS_bindTagManagerInit';
            var zbsDontDrawTags = true; // don't draw em in edit box
            // and this OVERRIDES the tag metabox list:
            var zbsCRMJS_currentTags = <?php echo json_encode($tags); ?>;

            jQuery(function($){
                console.log("======= TAG MANAGER VIEW UI =========");


            });

            // General options for listview
            var zbsEditSettings = {

                <?php /*objid: <?php echo $this->objID; ?>,*/ ?>
                objdbname: '<?php echo esc_html( $this->objType ); ?>'

            };
            var zbsDrawEditViewBlocker = false;
            var zbsDrawEditAJAXBlocker = false;
            var zbsDrawEditLoadingBoxHTML = '<?php echo esc_html( zeroBSCRM_UI2_loadingSegmentIncTextHTML() ); ?>';
            var zbsObjectViewLinkPrefixCustomer = '<?php echo jpcrm_esc_link( 'view', -1, 'zerobs_customer', true ); ?>';
            var zbsObjectEditLinkPrefixCustomer = '<?php echo jpcrm_esc_link( 'edit', -1, 'zerobs_customer', true ); ?>';
            var zbsObjectViewLinkPrefixCompany = '<?php echo jpcrm_esc_link( 'view', -1, 'zerobs_company', true ); ?>';
            var zbsListViewLink = '<?php echo jpcrm_esc_link( $this->listViewSlug ); ?>';
            var zbsClick2CallType = parseInt('<?php echo esc_html( zeroBSCRM_getSetting('clicktocalltype') ); ?>');
            var zbsEditViewLangLabels = {

                    'today': '<?php echo esc_html( zeroBSCRM_slashOut(__('Today',"zero-bs-crm")) ); ?>',

                    <?php $labelCount = 0; 
                    if (is_array($this->langLabels) && count($this->langLabels) > 0) foreach ($this->langLabels as $labelK => $labelV){

                        if ($labelCount > 0) echo ',';

                        echo esc_html( $labelK ).":'".esc_html( zeroBSCRM_slashOut($labelV) )."'";

                        $labelCount++;

                    } ?>

            };
            <?php   #} Nonce for AJAX
                    echo "var zbscrmjs_secToken = '" . esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ) . "';"; ?></script><?php

    } // /draw func

} // class