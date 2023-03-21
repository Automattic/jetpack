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

class zeroBSCRM_Delete{

    private $objID = false;
    private $objTypeID = false; // ZBS_TYPE_CONTACT - v3.0+

    // following now FILLED OUT by objTypeID above, v3.0+
    private $objType = false; // 'contact'
    private $singular = false; 
    private $plural = false;
    private $listViewSlug = false;
    private $langLabels = false;

    private $stage = 1; // 1 = 'are you sure', 2 = 'deleted'
    private $canDelete = 1; // if no perms -1

    // this only applies to contacts (v3.0)
    private $killChildren = false;

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
                    
            )

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

        }

        // if objid - load $post
        $this->loadObject();

        // check perms
        if (!zeroBSCRM_permsObjType($this->objTypeID)) $this->canDelete = false;

        // check if it actually exists
        if (!is_array($this->obj) || !isset($this->obj['id'])) $this->canDelete = false;

        // anything to save?
        if ($this->canDelete) $this->catchPost();

    }

    // automatically, generically, loads the single obj
    public function loadObject(){

        // if objid - load $post
        if (isset($this->objID) && !empty($this->objID) && $this->objID > 0) {

            global $zbs;

            // DAL3 we can use generic getSingle
            if ($zbs->isDAL3() && $this->objTypeID > 0){

                // this gets $zbs->DAL->contacts->getSingle()
                $this->obj = $zbs->DAL->getObjectLayerByType($this->objTypeID)->getSingle($this->objID);

            } else {

                // DAL2
                // customer currently only
                $this->obj = zeroBS_getCustomer($this->objID);
            }

        }
    }

    public function catchPost(){

        // If post, fire do_action
            // DAL3 this gets postType switched to objType
        if (isset($_POST['zbs-delete-form-master']) && $_POST['zbs-delete-form-master'] == $this->objTypeID){

            // CHECK NONCE
            if ( wp_verify_nonce( $_POST['zbs-delete-nonce'], 'delete-nonce' ) ) {

                // got any extras? e.g. kill children?
                if (isset($_POST['zbs-delete-kill-children'])){
                    if ($_POST['zbs-delete-kill-children'] == 'no') $this->killChildren = false;
                    if ($_POST['zbs-delete-kill-children'] == 'yes') $this->killChildren = true;
                }

                // verify + delete
                if (isset($_POST['zbs-delete-id']) && $_POST['zbs-delete-id'] == $this->objID){


                        global $zbs;

                        // got orphans?
                        $saveOrphans = true; if ($this->killChildren) $saveOrphans = false;

                        // legit, delete
                        switch ($this->objTypeID){

                            case ZBS_TYPE_CONTACT:

                                // delete
                                $deleted = $zbs->DAL->contacts->deleteContact(array(
                                            'id'            => $this->objID,
                                            'saveOrphans'   => $saveOrphans
                                            ));

                                break;

                            case ZBS_TYPE_COMPANY:

                                // delete
                                $deleted = $zbs->DAL->companies->deleteCompany(array(
                                            'id'            => $this->objID,
                                            'saveOrphans'   => $saveOrphans
                                            ));


                                break;

                            case ZBS_TYPE_QUOTE:

                                // delete
                                $deleted = $zbs->DAL->quotes->deleteQuote(array(
                                            'id'            => $this->objID,
                                            'saveOrphans'   => $saveOrphans
                                            ));

                                break;

                            case ZBS_TYPE_INVOICE:

                                // delete
                                $deleted = $zbs->DAL->invoices->deleteInvoice(array(
                                            'id'            => $this->objID,
                                            'saveOrphans'   => $saveOrphans
                                            ));

                                break;

                            case ZBS_TYPE_TRANSACTION:

                                // delete
                                $deleted = $zbs->DAL->transactions->deleteTransaction(array(
                                            'id'            => $this->objID,
                                            'saveOrphans'   => $saveOrphans
                                            ));

                                break;

                            case ZBS_TYPE_FORM:

                                // delete
                                $deleted = $zbs->DAL->forms->deleteForm(array(
                                            'id'            => $this->objID,
                                            'saveOrphans'   => $saveOrphans
                                            ));

                                break;

                            case ZBS_TYPE_EVENT:

                                // for now always kill links
                                $saveOrphans = false;

                                // delete
                                $deleted = $zbs->DAL->events->deleteEvent(array(
                                            'id'            => $this->objID,
                                            'saveOrphans'   => $saveOrphans
                                            ));

                                break;

                            case ZBS_TYPE_QUOTETEMPLATE:

                                // delete
                                $deleted = $zbs->DAL->quotetemplates->deleteQuotetemplate(array(
                                            'id'            => $this->objID,
                                            'saveOrphans'   => $saveOrphans
                                            ));

                                break;

                        }

                        // fire it
                        do_action('zerobs_delete_'.$this->objType, $this->objID, $this->obj);

                        // set $stage +1 (as only get here if posted ^)
                        $this->stage = 2;

                }

            }

        }
    }

    public function drawView(){

        // check
        if (empty($this->objType) || empty($this->listViewSlug) || empty($this->singular) || empty($this->plural)){

            return 'Error.';
        }

        global $zbs;


        ?><div id="zbs-delete-master-wrap">
                <form method="post" id="zbs-delete-form">

            <div id="zbs-edit-warnings-wrap">
                <?php #} Pre-loaded msgs, because I wrote the helpers in php first... should move helpers to js and fly these 

                echo zeroBSCRM_UI2_messageHTML('warning hidden','Error Retrieving '.$this->plural,'There has been a problem retrieving your '.$this->singular.', if this issue persists, please ask your administrator to reach out to Jetpack CRM.','disabled warning sign','zbsCantLoadData');
                echo zeroBSCRM_UI2_messageHTML('warning hidden','Error Retrieving '.$this->singular,'There has been a problem retrieving your '.$this->singular.', if this issue persists, please ask your administrator to reach out to Jetpack CRM.','disabled warning sign','zbsCantLoadDataSingle');
              
                ?>
            </div>
            <!-- main view: list + sidebar -->
            <div id="zbs-edit-wrap" class="ui grid" style="padding-top:5em">

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

                    <?php 

                        if (!$this->canDelete){

                            // no perms msg

                            ?>
                                    <div class="two wide column"></div>
                                    <div class="twelve wide column">
                                        <?php echo zeroBSCRM_UI2_messageHTML('warning','Restricted','You cannot delete this '.$this->singular.'.','disabled warning sign','zbsCantDelete'); ?>
                                    </div>
                                    <div class="two wide column"></div>
                            <?php

                        } else {
                        
                            // switch based on stage
                            switch ($this->stage){

                                case 2: 

                                    // deleted ?>

                                    <div class="two wide column"></div>

                                    <div class="twelve wide column">

                                        <div class="ui icon big message">
                                          <i class="trash icon"></i>
                                          <div class="content">
                                            <div class="header">
                                              <?php esc_html_e('Deleted',"zero-bs-crm"); ?>
                                            </div>
                                            <p><?php echo esc_html( $this->singular ).' '. esc_html__('was successfully deleted.',"zero-bs-crm"); ?></p>
                                            <p><?php

                                                // delete / back buttons
                                                $backUrl = jpcrm_esc_link('list',-1,$this->objTypeID);

                                                    // output
                                                    echo '<a href="'.esc_url( $backUrl ).'" class="ui green button right floated">'. esc_html__('Back to','zero-bs-crm').' '. esc_html( $this->plural ).'</a>';
                                                    
                                            ?></p>
                                          </div>
                                        </div>
                                    </div>

                                    <div class="two wide column"></div>

                                    <?php
                                    

                                    break;

                                case 1:

                                    // are you sure? ?>

                                    <div class="two wide column"></div>

                                    <div class="twelve wide column">

                                        <input type="hidden" name="zbs-delete-id" value="<?php echo esc_attr( $this->objID ); ?>" />
                                        <input type="hidden" name="zbs-delete-form-master" value="<?php echo esc_attr( $this->objTypeID ); ?>" />

                                        <div class="ui icon big warning message">
                                          <i class="trash icon"></i>
                                          <div class="content">
                                            <div class="header">
                                              <?php esc_html_e('Are you sure?',"zero-bs-crm"); ?>
                                            </div>
                                            <p><?php echo esc_html__('Are you sure you want to delete this',"zero-bs-crm").' '. esc_html( $this->singular ).'?'; ?></p>
                                            <?php

                                                $objectTypesWithChildren = array(
                                                        ZBS_TYPE_CONTACT,
                                                        ZBS_TYPE_COMPANY
                                                );

                                                // contact needs extra check:
                                                if (in_array($this->objTypeID,$objectTypesWithChildren)){

                                                    // ouput explanation (what children will go)
                                                    switch ($this->objTypeID){

                                                        case ZBS_TYPE_CONTACT:
                                                        case ZBS_TYPE_COMPANY:
														?>
														<?php
															echo '<p>';
															esc_html_e( 'Shall I also delete the associated Contacts, Invoices, Quotes, Transactions, and Tasks?', 'zero-bs-crm' );
															echo '<br>';
															esc_html_e( '(This cannot be undone!)', 'zero-bs-crm' );
															echo '</p>';
															break;
												}
												?>
                                                    <p>
                                                        <select name="zbs-delete-kill-children">
                                                            <option value="no"><?php esc_html_e('No, leave them',"zero-bs-crm"); ?></option>
                                                            <option value="yes"><?php esc_html_e('Yes, remove everything',"zero-bs-crm"); ?></option>
                                                        </select>
                                                    </p><?php
                                                }

                                            ?>
                                            <p><?php

                                                // delete / back buttons
                                                $backUrl = jpcrm_esc_link('edit',$this->objID,$this->objTypeID);

                                                    // output
                                                    echo '<button type="submit" class="ui orange button right floated"><i class="trash alternate icon"></i> '. esc_html__('Delete','zero-bs-crm').' '. esc_html( $this->singular ) .'</button>';
                                                    echo '<a href="'. esc_url( $backUrl ) .'" class="ui green button right floated"><i class="angle double left icon"></i> '. esc_html__('Back to','zero-bs-crm').' '. esc_html( $this->singular ).' ('. esc_html__('Cancel','zero-bs-crm').')</a>';
                                                    
                                            ?></p>
                                          </div>
                                        </div>
                                    </div>

                                    <div class="two wide column"></div>

                                    <?php

                                    break;

                                default:

                                    // smt broken!
                                    echo 'Error!';

                                    break;


                            }

                        } // / can delete


                    ?>

                </div>

                <!-- could use this for mobile variant?) 
                <div class="two column mobile only row" style="display:none"></div>
                -->
            </div> <!-- / mainlistview wrap -->

            <input type="hidden" name="zbs-delete-nonce" value="<?php echo esc_attr( wp_create_nonce( "delete-nonce" ) ); ?>" />
        </form></div>

        <script type="text/javascript">

            jQuery(function($){
                console.log("======= DELETE VIEW UI =========");
            });

            // General options for edit page
            var zbsDeleteSettings = {

                objid: <?php echo esc_html( $this->objID ); ?>,
                objdbname: '<?php echo esc_html( $this->objType ); ?>'

            };
            var zbsObjectViewLinkPrefixCustomer = '<?php echo jpcrm_esc_link( 'view', -1, 'zerobs_customer', true ); ?>';
            var zbsObjectEditLinkPrefixCustomer = '<?php echo jpcrm_esc_link( 'edit', -1, 'zerobs_customer', true ); ?>';
            var zbsObjectViewLinkPrefixCompany = '<?php echo jpcrm_esc_link( 'view', -1, 'zerobs_company', true ); ?>';
            var zbsListViewLink = '<?php echo jpcrm_esc_link($this->listViewSlug ); ?>';
            var zbsClick2CallType = parseInt('<?php echo esc_html( zeroBSCRM_getSetting('clicktocalltype') ); ?>');
            var zbsEditViewLangLabels = {

                    'today': '<?php echo esc_html( zeroBSCRM_slashOut(__('Today',"zero-bs-crm")) ); ?>',

                    <?php $labelCount = 0; 
                    if (count($this->langLabels) > 0) foreach ($this->langLabels as $labelK => $labelV){

                        if ($labelCount > 0) echo ',';

                        echo esc_html( $labelK ).":'". esc_html( zeroBSCRM_slashOut($labelV) )."'";

                        $labelCount++;

                    } ?>

            };
            <?php   #} Nonce for AJAX
                    echo "var zbscrmjs_secToken = '" . esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ) . "';"; ?></script><?php

    } // /draw func

} // class
