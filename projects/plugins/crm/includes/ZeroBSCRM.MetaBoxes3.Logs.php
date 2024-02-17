<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 20/02/2019
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

   function zeroBSCRM_LogsMetaboxSetup(){

        // req. for custom log types
        zeroBSCRM_setupLogTypes();

   }

   add_action( 'after_zerobscrm_settings_init','zeroBSCRM_LogsMetaboxSetup');

/* ======================================================
   / Init Func
   ====================================================== */


/* ======================================================
  Declare Globals
   ====================================================== */

global $zeroBSCRM_logTypes; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
$zeroBSCRM_logTypes = array( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	// // phpcs:disable WordPress.Arrays.ArrayDeclarationSpacing.AssociativeArrayFound
	'zerobs_customer' => array(

		'note'                                  => array( 'label' => __( 'Note', 'zero-bs-crm' ), 'ico' => 'fa-sticky-note-o' ),
		'call'                                  => array( 'label' => __( 'Call', 'zero-bs-crm' ), 'ico' => 'fa-phone-square' ),
		'email'                                 => array( 'label' => __( 'Email', 'zero-bs-crm' ), 'ico' => 'fa-envelope-o' ),
		'mail'                                  => array( 'label' => __( 'Mail', 'zero-bs-crm' ), 'ico' => 'fa-envelope-o' ),
		'meeting'                               => array( 'label' => __( 'Meeting', 'zero-bs-crm' ), 'ico' => 'fa-users' ),
		'quote__sent'                           => array( 'label' => __( 'Quote: Sent', 'zero-bs-crm' ), 'ico' => 'fa-share-square-o' ),
		'quote__accepted'                       => array( 'label' => __( 'Quote: Accepted', 'zero-bs-crm' ), 'ico' => 'fa-thumbs-o-up' ),
		'quote__refused'                        => array( 'label' => __( 'Quote: Refused', 'zero-bs-crm' ), 'ico' => 'fa-ban' ),
		'invoice__sent'                         => array( 'label' => __( 'Invoice: Sent', 'zero-bs-crm' ), 'ico' => 'fa-share-square-o' ),
		'invoice__part_paid'                    => array( 'label' => __( 'Invoice: Part Paid', 'zero-bs-crm' ), 'ico' => 'fa-money' ),
		'invoice__paid'                         => array( 'label' => __( 'Invoice: Paid', 'zero-bs-crm' ), 'ico' => 'fa-money' ),
		'invoice__refunded'                     => array( 'label' => __( 'Invoice: Refunded', 'zero-bs-crm' ), 'ico' => 'fa-money' ),
		'transaction'                           => array( 'label' => __( 'Transaction', 'zero-bs-crm' ), 'ico' => 'fa-credit-card' ),
		'feedback'                              => array( 'label' => __( 'Feedback', 'zero-bs-crm' ), 'ico' => 'fa-commenting' ),
		'tweet'                                 => array( 'label' => __( 'Tweet', 'zero-bs-crm' ), 'ico' => 'fa-twitter' ),
		'facebook_post'                         => array( 'label' => __( 'Facebook Post', 'zero-bs-crm' ), 'ico' => 'fa-facebook-official' ),
		'other_contact'                         => array( 'label' => __( 'Other contact', 'zero-bs-crm' ), 'ico' => 'fa-users' ),
		'created'                               => array( 'locked' => true, 'label' => __( 'Created', 'zero-bs-crm' ), 'ico' => 'fa-plus-circle' ),
		'updated'                               => array( 'locked' => true, 'label' => __( 'Updated', 'zero-bs-crm' ), 'ico' => 'fa-pencil-square-o' ),
		'quote_created'                         => array( 'locked' => true, 'label' => __( 'Quote Created', 'zero-bs-crm' ), 'ico' => 'fa-plus-circle' ),
		'invoice_created'                       => array( 'locked' => true, 'label' => __( 'Invoice Created', 'zero-bs-crm' ), 'ico' => 'fa-plus-circle' ),
		'event_created'                         => array( 'locked' => true, 'label' => __( 'Task Created', 'zero-bs-crm' ), 'ico' => 'fa-calendar' ),
		'task_created'                          => array( 'locked' => true, 'label' => __( 'Task Created', 'zero-bs-crm' ), 'ico' => 'fa-calendar' ),
		'transaction_created'                   => array( 'locked' => true, 'label' => __( 'Transaction Created', 'zero-bs-crm' ), 'ico' => 'fa-credit-card' ),
		'transaction_updated'                   => array( 'locked' => true, 'label' => __( 'Transaction Updated', 'zero-bs-crm' ), 'ico' => 'fa-credit-card' ),
		'transaction_deleted'                   => array( 'locked' => true, 'label' => __( 'Transaction Deleted', 'zero-bs-crm' ), 'ico' => 'fa-credit-card' ),
		'form_filled'                           => array( 'locked' => true, 'label' => __( 'Form Filled', 'zero-bs-crm' ), 'ico' => 'fa-wpforms' ),
		'api_action'                            => array( 'locked' => true, 'label' => __( 'API Action', 'zero-bs-crm' ), 'ico' => 'fa-random' ),
		'bulk_action__merge'                    => array( 'locked' => true, 'label' => __( 'Bulk Action: Merge', 'zero-bs-crm' ), 'ico' => 'fa-compress' ),
		'client_portal_user_created'            => array( 'locked' => true, 'label' => __( 'Client Portal User Created', 'zero-bs-crm' ), 'ico' => 'fa-id-card' ),
		'client_portal_access_changed'          => array( 'locked' => true, 'label' => __( 'Client Portal Access Changed', 'zero-bs-crm' ), 'ico' => 'fa-id-card' ),
		'status_change'                         => array( 'locked' => true, 'label' => __( 'Status Change', 'zero-bs-crm' ), 'ico' => 'fa-random' ),
		'contact_changed_details_via_portal'    => array( 'locked' => true, 'label' => __( 'Contact Changed via Portal', 'zero-bs-crm' ), 'ico' => 'fa-id-card' ),
		'contact_changed_details_via_wpprofile' => array( 'locked' => true, 'label' => __( 'Contact Changed via WordPress Profile', 'zero-bs-crm' ), 'ico' => 'fa-id-card' ),
		'contact_changed_details_via_woomyacc'  => array( 'locked' => true, 'label' => __( 'Contact Changed via WooCommerce My Account', 'zero-bs-crm' ), 'ico' => 'fa-id-card' ),
		'contact_changed_details_via_mailpoet'  => array( 'locked' => true, 'label' => __( 'Contact Changed via MailPoet', 'zero-bs-crm' ), 'ico' => 'fa-id-card' ),
		'subscriber_deleted_in_mailpoet'        => array( 'locked' => true, 'label' => __( 'Subscriber deleted in MailPoet', 'zero-bs-crm' ), 'ico' => 'fa-times' ),
		'contact_change_details_attempt'        => array( 'locked' => true, 'label' => __( 'Attempted Contact detail change', 'zero-bs-crm' ), 'ico' => 'fa-id-card' ),

	),

	'zerobs_company'  => array(

		'note'    => array( 'label' => __( 'Note', 'zero-bs-crm' ), 'ico' => 'fa-sticky-note-o' ),
		'call'    => array( 'label' => __( 'Call', 'zero-bs-crm' ), 'ico' => 'fa-phone-square' ),
		'email'   => array( 'label' => __( 'Email', 'zero-bs-crm' ), 'ico' => 'fa-envelope-o' ),
		'created' => array( 'locked' => true, 'label' => __( 'Created', 'zero-bs-crm' ), 'ico' => 'fa-plus-circle' ),
		'updated' => array( 'locked' => true, 'label' => __( 'Updated', 'zero-bs-crm' ), 'ico' => 'fa-pencil-square-o' ),

	),

	// // phpcs:enable WordPress.Arrays.ArrayDeclarationSpacing.AssociativeArrayFound
);

    function zeroBSCRM_permifyLogType($logTypeStr=''){

      return strtolower(str_replace(' ','_',str_replace(':','_',$logTypeStr)));
      
    }

    function zeroBSCRM_setupLogTypes(){

        global $zeroBSCRM_logTypes;

        // hide log types for objects that are disabled
        $hide_quotes = zeroBSCRM_getSetting('feat_quotes') == -1;
        $hide_invoices = zeroBSCRM_getSetting('feat_invs') == -1;
        $hide_transactions = zeroBSCRM_getSetting('feat_transactions') == -1;

        foreach ( $zeroBSCRM_logTypes['zerobs_customer'] as $log_type => $log_type_value) {
		if (
			$hide_quotes && str_starts_with( $log_type, 'quote' )
			|| $hide_invoices && str_starts_with( $log_type, 'invoice' )
			|| $hide_transactions && str_starts_with( $log_type, 'transaction' )
		) {
            $zeroBSCRM_logTypes['zerobs_customer'][$log_type]['locked'] = true;
          }
        }

        // apply filters
        $zeroBSCRM_logTypes = apply_filters('zbs_logtype_array', $zeroBSCRM_logTypes);

    }

/* ======================================================
  / Declare Globals
   ====================================================== */




/* ======================================================
  Logs (v3 DB3) Metabox
   ====================================================== */

class zeroBS__Metabox_LogsV2 extends zeroBS__Metabox {

    public $objtypeid = false; // child fills out e.g. ZBS_TYPE_CONTACT
    public $metaboxLocation = 'normal';

	/**
	 * The legacy object name (e.g. 'zerobs_customer')
	 *
	 * @var string
	 */
	private $postType; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase

    public function __construct( $plugin_file ) {

        // call this 
        $this->initMetabox();

    }

    public function html( $obj, $metabox ) {

        global $zbs;

            // needs conversion to set this v3+
            // // obj type (1 => zerobs_customer)
            // we load from DAL defaults, if objTypeID passed (overriding anything passed, if empty/false)
            if (isset($this->objtypeid)){ //$zbs->isDAL3() && 

                $objTypeID = (int)$this->objtypeid;
                if ($objTypeID > 0){

                    // obj type (1 => zerobs_customer)
                    $objTypeStr = $zbs->DAL->typeCPT($objTypeID);
                    if ((!isset($this->postType) || $this->postType == false) && !empty($objTypeStr)) $this->postType = $objTypeStr;

                }

                //echo 'loading from '.$this->objTypeID.':<pre>'.print_r(array($objTypeStr,$objSingular,$objPlural,$objSlug),1).'</pre>'; exit();

            }


            $objid = -1; if (is_array($obj) && isset($obj['id'])) $objid = $obj['id'];

            #} Only load if is legit.
            //if (in_array($this->postType,array('zerobs_customer'))){
            if (in_array($this->objtypeid,array(ZBS_TYPE_CONTACT,ZBS_TYPE_COMPANY))){

                    #} Proceed

                    #} Retrieve
                    $zbsLogs = $zbs->DAL->logs->getLogsForObj(array(

                            'objtype' => $this->objtypeid,
                            'objid' => $objid,

                            'searchPhrase'  => '',

                            'incMeta'   => false,

                            'sortByField'   => 'zbsl_created',
                            'sortOrder'     => 'DESC',
                            'page'          => 0,
                            'perPage'       => 100,

                            'ignoreowner' => true

                        ));

                    if (!is_array($zbsLogs)) $zbsLogs = array();

            
            ?>
            <script type="text/javascript">var zbscrmjs_logsSecToken = '<?php echo esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce-logs' ) ); ?>';</script>

                <table class="form-table wh-metatab wptbp" id="wptbpMetaBoxLogs">
                    
                    <tr>
								<td><h4><span id="zbsActiveLogCount"><?php echo esc_html( zeroBSCRM_prettifyLongInts( count( $zbsLogs ) ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase ?></span> <?php esc_html_e( 'Logs', 'zero-bs-crm' ); ?></h4></td>
								<td><button type="button" class="ui button black jpcrm-button" id="zbscrmAddLog"><?php esc_html_e( 'Add Log', 'zero-bs-crm' ); ?></button></td>
                    </tr>

                    <!-- this line will pop/close with "add log" button -->
                    <tr id="zbsAddLogFormTR" style="display:none"><td colspan="2">


                        <div id="zbsAddLogForm">

                            <div id="zbsAddLogIco">
                                <!-- this will change with select changing... -->
                                <i class="fa fa-sticky-note-o" aria-hidden="true"></i>
                            </div>

                            <label for="zbsAddLogType"><?php esc_html_e("Activity Type","zero-bs-crm");?>:</label>
                            <select id="zbsAddLogType" class="form-control zbsUpdateTypeAdd">
                                <?php global $zeroBSCRM_logTypes; 
                                if (isset($zeroBSCRM_logTypes[$this->postType]) && count($zeroBSCRM_logTypes[$this->postType]) > 0) foreach ($zeroBSCRM_logTypes[$this->postType] as $logKey => $logType){

                                    // not for locked logs
                                    if (isset($logType['locked']) && $logType['locked']){
                                        // nope
                                    } else {
                                        ?><option value="<?php echo esc_attr( $logKey ); ?>"><?php esc_html_e($logType['label'],"zero-bs-crm"); ?></option><?php 
                                    }
                                } 

                                ?>
                            </select>

                            <br />

                            <label for="zbsAddLogMainDesc"><?php esc_html_e("Activity Description","zero-bs-crm")?>:</label>
														<input type="text" class="form-control" id="zbsAddLogMainDesc" placeholder="e.g. <?php esc_attr_e( 'Called and talked to Todd about service x, seemed keen', 'zero-bs-crm' ); ?>" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); ?>" />

                            <label for="zbsAddLogDetailedDesc"><?php esc_html_e("Activity Detailed Notes","zero-bs-crm");?>:</label>
														<textarea class="form-control" id="zbsAddLogDetailedDesc" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); ?>"></textarea>

                            <label for="zbsAddLogPinNote"><?php esc_html_e( 'Pin note', 'zero-bs-crm' ); ?>:</label>
                            <input type="checkbox" id="zbsAddLogPinNote" />

                            <div id="zbsAddLogActions">
                                <div id="zbsAddLogUpdateMsg"></div>
											<button type="button" class="jpcrm-button white-bg" id="zbscrmAddLogCancel"><?php esc_html_e( 'Cancel', 'zero-bs-crm' ); ?></button>
											<button type="button" class="jpcrm-button" id="zbscrmAddLogSave"><?php esc_html_e( 'Save Log', 'zero-bs-crm' ); ?></button>
                            </div>

                        </div>



                        <!-- edit log form is to be moved about by edit routines :) -->
                        <div id="zbsEditLogForm">

                            <div id="zbsEditLogIco">
                                <!-- this will change with select changing... -->
                                <i class="fa fa-sticky-note-o" aria-hidden="true"></i>
                            </div>

                            <label for="zbsEditLogType"><?php esc_html_e("Activity Type","zero-bs-crm");?>:</label>
														<select id="zbsEditLogType" class="form-control zbsUpdateTypeEdit" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); ?>">
                                <?php global $zeroBSCRM_logTypes; 
                                if (isset($zeroBSCRM_logTypes[$this->postType]) && count($zeroBSCRM_logTypes[$this->postType]) > 0) foreach ($zeroBSCRM_logTypes[$this->postType] as $logKey => $logType){

                                    // not for locked logs
                                    if (isset($logType['locked']) && $logType['locked']){
                                        // nope
                                    } else {
                                        ?><option value="<?php echo esc_attr( $logKey ); ?>"><?php echo esc_html( $logType['label'] ); ?></option><?php 
                                    }
                                } 

                                ?>
                            </select>

                            <br />

                            <label for="zbsEditLogMainDesc"><?php esc_html_e("Activity Description","zero-bs-crm");?>:</label>
														<input type="text" class="form-control" id="zbsEditLogMainDesc" placeholder="e.g. 'Called and talked to Todd about service x, seemed keen'" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); ?>" />

                            <label for="zbsEditLogDetailedDesc"><?php esc_html_e("Activity Detailed Notes","zero-bs-crm");?>:</label>
														<textarea class="form-control" id="zbsEditLogDetailedDesc" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); ?>"></textarea>

                            <label for="zbsEditLogPinNote"><?php esc_html_e( 'Pin note', 'zero-bs-crm' ); ?>:</label>
                            <input type="checkbox" id="zbsEditLogPinNote" />

                            <div id="zbsEditLogActions">
                                <div id="zbsEditLogUpdateMsg"></div>
                                <button type="button" class="button button-info button-large" id="zbscrmEditLogCancel"><?php esc_html_e("Cancel","zero-bs-crm");?></button>
                                <button type="button" class="button button-primary button-large" id="zbscrmEditLogSave"><?php esc_html_e("Save Log","zero-bs-crm");?></button>
                            </div>

                        </div>




                    </td></tr>

                    <?php if (isset($wDebug)) { ?><tr><td colspan="2"><pre><?php print_r($zbsLogs) ?></pre></td></tr><?php } ?>

                    <tr><td colspan="2">

                        <?php # Output logs (let JS do this!)

                            #if (count($zbsLogs) > 0){ }

                        ?>
                        <div id="zbsAddLogOutputWrap"></div>


                    </td></tr>

                </table>


            <style type="text/css">
                #submitdiv {
                    display:none;
                }
            </style>
            <script type="text/javascript">

                var zbsLogPerms = <?php echo json_encode(array('addedit'=>zeroBSCRM_permsLogsAddEdit(),'delete'=>zeroBSCRM_permsLogsDelete())); ?>;

                var zbsLogAgainstID = <?php echo esc_html( $objid ); ?>; var zbsLogProcessingBlocker = false;

                <?php if (isset($_GET['addlog']) && $_GET['addlog'] == "1"){

                    // this just opens new log for those who've clicked through from another page
                    echo 'var initialiseAddLog = true;';

                }

                
                #} Centralised log types :)
                global $zeroBSCRM_logTypes; 

                #} Build array of locked logs
                $lockedLogs = array();
                if (isset($zeroBSCRM_logTypes[$this->postType]) && count($zeroBSCRM_logTypes[$this->postType]) > 0) foreach ($zeroBSCRM_logTypes[$this->postType] as $logTypeKey => $logTypeDeet){
                    if (isset($logTypeDeet['locked']) && $logTypeDeet['locked']) $lockedLogs[$logTypeKey] = true;
                }
                echo 'var zbsLogsLocked = '.json_encode($lockedLogs).';';

                /*
                var zbsLogsLocked = {
                    'created': true,
                    'updated': true,
                    'quote_created': true,
                    'invoice_created': true,
                    'form_filled': true

                }; */ 

                if (isset($zeroBSCRM_logTypes[$this->postType]) && count($zeroBSCRM_logTypes[$this->postType]) > 0) {

                    echo 'var zbsLogTypes = '.json_encode($zeroBSCRM_logTypes[$this->postType]).';';

                } 
				?>

                var zbsLogIndex = <?php

                    #} Array or empty
                    if (count($zbsLogs) > 0 && is_array($zbsLogs)) {
                      
                        $zbsLogsExpose = array();
                        foreach ($zbsLogs as $zbsLog){

                            $retLine = $zbsLog;
                            if (isset($retLine) && isset($retLine['longdesc'])) $retLine['longdesc'] = wp_kses( html_entity_decode( $retLine['longdesc'], ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 ), $zbs->acceptable_restricted_html );

                            $zbsLogsExpose[] = $retLine;

                        }

                        echo json_encode($zbsLogsExpose);
                    } else
                        echo json_encode(array());
                // phpcs:disable Generic.WhiteSpace.DisallowSpaceIndent.SpacesUsed
                ?>;

                var zbsLogEditing = -1;

                // def ico
                var zbsLogDefIco = 'fa-sticky-note-o'; 

                jQuery(function(){

                    // build log ui
                    zbscrmjs_buildLogs();

                    // if url has addlogs=1, init open addlogs :)
                    // passed down from php via var higher up in this file
                    setTimeout(function(){
                        if (typeof window.initialiseAddLog != "undefined"){
                            jQuery('#zbscrmAddLog').trigger( 'click' );
                        }
                    },500);

                    // add log button
                    jQuery('#zbscrmAddLog').on( 'click', function(){


                        if (jQuery(this).css('display') == 'block'){

                            jQuery('#zbsAddLogFormTR').slideDown('400', function() {
                                
                            });

                            jQuery(this).hide();

                        } else {

                            jQuery('#zbsAddLogFormTR').hide();

                            jQuery(this).show();

                        }


                    });

                    // cancel
                    jQuery('#zbscrmAddLogCancel').on( 'click', function(){

                            jQuery('#zbsAddLogFormTR').hide();

                            jQuery('#zbscrmAddLog').show();

                    });

                    // save
                    jQuery('#zbscrmAddLogSave').on( 'click', function(){

                            //jQuery('#zbsAddLogFormTR').hide();

                            //jQuery('#zbscrmAddLog').show();

                            /* 
                            zbsnagainstid
                            zbsntype
                            zbsnshortdesc
                            zbsnlongdesc
                            zbsnoverwriteid
                            pinned
                            */

                            // get / check data
                            var data = {sec:window.zbscrmjs_logsSecToken,zbsnobjtype:'<?php echo esc_html( $this->postType ); ?>'}; var errs = 0;
                            if ((jQuery('#zbsAddLogType').val()).length > 0) data.zbsntype = jQuery('#zbsAddLogType').val();
                            if ((jQuery('#zbsAddLogMainDesc').val()).length > 0) data.zbsnshortdesc = jQuery('#zbsAddLogMainDesc').val();
                            if ((jQuery('#zbsAddLogDetailedDesc').val()).length > 0) 
                                data.zbsnlongdesc = jQuery('#zbsAddLogDetailedDesc').val();
                            else
                                data.zbsnlongdesc = '';

                            if (jQuery('#zbsAddLogPinNote').is(':checked')) {
                                data.pinned = true;
                            }

                            // post id & no need for overwrite id as is new
                            data.zbsnagainstid = parseInt(window.zbsLogAgainstID);

                            // debug console.log('posting new note: ',data);

                            // validate
                            var msgOut = '';
                            if (typeof data.zbsntype == "undefined" || data.zbsntype == '') {
                                errs++;
                                msgOut = 'Note Type is required!'; 
                                jQuery('#zbsAddLogType').css('border','2px solid orange');
                                setTimeout(function(){

                                    jQuery('#zbsAddLogUpdateMsg').html('');
                                    jQuery('#zbsAddLogType').css('border','1px solid #ddd');

                                },1500);
                            }
                            if (typeof data.zbsnshortdesc == "undefined" || data.zbsnshortdesc == '') {
                                errs++;
                                if (msgOut == 'Note Type is required!') 
                                    msgOut = 'Note Type and Description are required!'; 
                                else
                                    msgOut += 'Note Description is required!'; 
                                jQuery('#zbsAddLogMainDesc').css('border','2px solid orange');
                                setTimeout(function(){

                                    jQuery('#zbsAddLogUpdateMsg').html('');
                                    jQuery('#zbsAddLogMainDesc').css('border','1px solid #ddd');

                                },1500);
                            }

                            if (errs === 0){

                                // add action
                                data.action = 'zbsaddlog';

                                zbscrmjs_addNewNote(data,function(newLog){

                                    // success

                                        // msg
                                        jQuery('#zbsAddLogUpdateMsg').html('Saved!');

                                        // then hide form, build new log gui, clear form

                                            // hide + clear form
                                            jQuery('#zbsAddLogFormTR').hide();
                                            jQuery('#zbscrmAddLog').show();
                                            jQuery('#zbsAddLogType').val('note');
                                            jQuery('#zbsAddLogMainDesc').val('');
                                            jQuery('#zbsAddLogDetailedDesc').val('');
                                            jQuery('#zbsAddLogPinNote').prop('checked', false);
                                            jQuery('#zbsAddLogUpdateMsg').html('');

                                        // add it (build example obj)
                                        var newLogObj = {
                                            id: newLog.logID,
                                            created: '', //moment(),
                                            type: newLog.zbsntype,
                                            shortdesc: newLog.zbsnshortdesc,
                                            longdesc: zbscrmjs_nl2br(newLog.zbsnlongdesc)
                                        }
                                        if (newLog.pinned) {
                                            newLogObj.pinned = true;
                                        }
                                        zbscrmjs_addNewNoteLine(newLogObj,true);

                                        // also add to window obj
                                        window.zbsLogIndex.push(newLogObj);


                                        // bind ui
                                        setTimeout(function(){
                                            zbscrmjs_bindNoteUIJS();
                                            zbscrmjs_updateLogCount();
                                        },0);


                                },function(){

                                    // failure

                                        // msg + do nothing
                                        jQuery('#zbsAddLogUpdateMsg').html('There was an error when saving this note!');

                                });

                            } else {
                                if (typeof msgOut !== "undefined" && msgOut != '') jQuery('#zbsAddLogUpdateMsg').html(msgOut); 
                            }

                    });


                    // note ico - works for both edit + add
                    jQuery('#zbsAddLogType, #zbsEditLogType').on( 'change', function(){

                        // get perm
                        var logPerm = zbscrmjs_permify(jQuery(this).val()); // jQuery('#zbsAddLogType').val()

                        var thisIco = window.zbsLogDefIco;
                        // find ico
                        if (typeof window.zbsLogTypes[logPerm] != "undefined") thisIco = window.zbsLogTypes[logPerm].ico;

                        // override all existing classes with ones we want:
                        if (jQuery(this).hasClass('zbsUpdateTypeAdd')) jQuery('#zbsAddLogIco i').attr('class','fa ' + thisIco);
                        if (jQuery(this).hasClass('zbsUpdateTypeEdit')) jQuery('#zbsEditLogIco i').attr('class','fa ' + thisIco);

                    });


                });

                function zbscrmjs_updateLogCount(){

                    var count = 0; 
                    if (window.zbsLogIndex.length > 0) count = parseInt(window.zbsLogIndex.length);
                    jQuery('#zbsActiveLogCount').html(zbscrmjs_prettifyLongInts(count));

                }

                // build log ui
                function zbscrmjs_buildLogs(){

                    // get from obj
                    var theseLogs = window.zbsLogIndex;


                    jQuery.each(theseLogs,function(ind,ele){

                        zbscrmjs_addNewNoteLine(ele);

                    });

                    // bind ui
                    setTimeout(function(){
                        zbscrmjs_bindNoteUIJS();
                        zbscrmjs_updateLogCount();
                    },0);

                }

                function zbscrmjs_addNewNoteLine(ele,prepflag,replaceExisting){

                        // localise
                        var logMeta = ele; if (typeof ele.meta != "undefined") logMeta = ele.meta;

                        // get perm
                        var logPerm = zbscrmjs_permify(logMeta.type);

                        // classes (pinned)
                        var classes = '';
                        if ( typeof ele.pinned !== "undefined" && ele.pinned ){
                            classes = ' jpcrm-pinned';
                        }

                        // build it
                        var thisLogHTML = '<div class="zbsLogOut' + classes + '" data-logid="' + ele.id + '" id="zbsLogOutLine' + ele.id + '" data-logtype="' + logPerm + '">';


                            // type ico
                                
                                var thisIco = window.zbsLogDefIco;
                                // find ico
                                if (typeof window.zbsLogTypes[logPerm] != "undefined") thisIco = window.zbsLogTypes[logPerm].ico;

                                // output
                                thisLogHTML += '<div class="zbsLogOutIco"><i class="fa ' + thisIco + '" aria-hidden="true"></i></div>';


                            // created date
                            if (typeof ele.created !== "undefined" && ele.created !== '') {
                                
                                // not req: var offsetStr = zbscrmjs_getTimeZoneOffset();
                                // date, inc any timezone offset as set in wp: window.zbs_root.timezone_offset
                                //console.log("Creating moment bare",[moment(ele.created + ' ' + offsetStr, 'YYYY-MM-DD HH:mm:ss Z'), moment(ele.created + ' ' + offsetStr, 'YYYY-MM-DD HH:mm:ss Z','en'), offsetStr, moment(ele.created, 'YYYY-MM-DD HH:mm:ss').utcOffset(offsetStr)]);
                                //var createdMoment = moment(ele.created + ' ' + offsetStr, 'YYYY-MM-DD HH:mm:ss Z', 'en');
                                //var createdMoment = moment(ele.created, 'YYYY-MM-DD HH:mm:ss').utcOffset(offsetStr);
                                //var nowAdjusted = moment(); //.utcOffset(offsetStr);
                                //console.log("compare",[createdMoment.format(),nowAdjusted.format(),createdMoment.from(nowAdjusted),createdMoment.fromNow()]);

                                // this works best in the end, just add / - any offset
                                var createdMoment = moment.unix(ele.createduts);
                                thisLogHTML += '<div class="zbsLogOutCreated" data-zbscreated="' + ele.created + '" title="' + createdMoment.format('lll') + '">' + createdMoment.fromNow() + '</div>';

                            } else {

                                // empty created means just created obj
                                var createdMoment = moment();
                                thisLogHTML += '<div class="zbsLogOutCreated" data-zbscreated="' + createdMoment + '" title="' + createdMoment.format('lll') + '">' + createdMoment.fromNow() + '</div>';

                            }

                            // title

                                var thisTitle = '';

                                // find type
                                var thisType = ucwords(logMeta.type);
                                if (typeof window.zbsLogTypes[logPerm] != "undefined") thisType = window.zbsLogTypes[logPerm].label;

                                // type
                                if (typeof thisType !== "undefined") thisTitle += '<span>' + thisType + '</span>';

                                // desc
                                if (typeof logMeta.shortdesc !== "undefined") {

                                    if (thisTitle != '') thisTitle += ': ';
                                    thisTitle += jpcrm_strip_scripts(logMeta.shortdesc);

                                }

                                var logEditElements = '<div class="zbsLogOutEdits"><i class="fa fa-pencil-square-o zbsLogActionEdit" title="<?php esc_attr_e('Edit Log',"zero-bs-crm");?>"></i><i class="fa fa-thumb-tack jpcrm_log_pin" title="<?php esc_attr_e('Pin log to contact', 'zero-bs-crm' ); ?>"></i><i class="fa fa-thumb-tack jpcrm_log_unpin" title="<?php esc_attr_e('Unpin log from contact', 'zero-bs-crm' ); ?>"></i><i class="fa fa-trash-o zbsLogActionRemove last" title="<?php esc_attr_e('Delete Log',"zero-bs-crm");?>"></i><span></span></div>';
                                thisLogHTML += '<div class="zbsLogOutTitle">' + thisTitle + logEditElements + '</div>';

                            // desc
                           if (typeof logMeta.longdesc !== "undefined" && logMeta.longdesc !== '' && logMeta.longdesc !== null) thisLogHTML += '<div class="zbsLogOutDesc">' + jpcrm_strip_scripts(logMeta.longdesc) + '</div>';

                            thisLogHTML += '</div>';                            


                        if (typeof replaceExisting == "undefined"){

                            // normal

                            // add it
                            if (typeof prepflag !== "undefined")
                                jQuery('#zbsAddLogOutputWrap').prepend(thisLogHTML);
                            else
                                jQuery('#zbsAddLogOutputWrap').append(thisLogHTML);


                        } else {

                            // replace existing
                            jQuery('#zbsLogOutLine' + ele.id).replaceWith(thisLogHTML);

                        }

                }

                function zbscrmjs_bindNoteUIJS(){

                    // show hide edit controls
                    jQuery('.zbsLogOut').on( 'mouseenter', function(){

                        var logType = jQuery(this).attr('data-logtype');

                        // only if not editing another :) + Log Type is not one we don't have in our set
                        if (window.zbsLogEditing == -1 && typeof window.zbsLogTypes[logType] != "undefined"){

                            // check if locked log or not! 
                            if (typeof logType == "undefined") logType = '';

                            // if log type empty, or has a key in window.zbsLogsLocked, don't allow edits
                            // ... and finally check perms too 
                            if (
                                logType != '' && !window.zbsLogsLocked.hasOwnProperty(logType) && 
                                window.zbsLogPerms.addedit // can add edit
                                ){

                                    // check if can delete
                                    if (window.zbsLogPerms.delete){
                                        // can
                                        jQuery('.zbsLogActionRemove',jQuery(this)).css('display','inline-block');

                                    } else {
                                        // can't
                                        jQuery('.zbsLogActionRemove',jQuery(this)).css('display','none');
                                    }
                                    
                                // yep (overall)
                                jQuery('.zbsLogOutEdits',jQuery(this)).css('display','inline-block');

                            }

                        }

                    }).on( 'mouseleave', function(){

                        jQuery('.zbsLogOutEdits',jQuery(this)).not('.stayhovered').css('display','none');

                    });

                    // bind del
                    jQuery('.zbsLogOutEdits .zbsLogActionRemove').off('click').on( 'click', function(){

                        if (window.zbsLogPerms.delete){

                            // append "deleting"
                            jQuery(this).closest('.zbsLogOutEdits').addClass('stayhovered');
                            jQuery('span',jQuery(this).closest('.zbsLogOutEdits')).html('<?php esc_html_e( 'Deleting', 'zero-bs-crm' ); ?>...');

                            var noteID = parseInt(jQuery(this).closest('.zbsLogOut').attr('data-logid'));

                            if (noteID > 0){

                                var thisEle = this;

                                zbscrmjs_deleteNote(noteID,function(){

                                    // success

                                        // localise
                                        var nID = noteID;

                                        // append "deleted" and then vanish
                                        jQuery('span',jQuery(thisEle).closest('.zbsLogOutEdits')).html('Deleted!...');

                                        var that = thisEle;
                                        setTimeout(function(){

                                            // localise
                                            var thisNoteID = nID;

                                            // also del from window obj
                                            zbscrmjs_removeItemFromLogIndx(thisNoteID);

                                            // update count span
                                            zbscrmjs_updateLogCount();

                                            // slide up
                                            jQuery(that).closest('.zbsLogOut').slideUp(400,function(){

                                                // and remove itself?

                                            });
                                        },500);

                                },function(){

                                    //TODO: proper error msg
                                    console.error('There was an issue retrieving this note for editing/deleting'); 

                                });

                            } else console.error('There was an issue retrieving this note for editing/deleting'); //TODO: proper error msg

                        } // if perms

                    });

                    // bind pin
                    jQuery('.zbsLogOutEdits .jpcrm_log_pin').off('click').on( 'click', function(){

                        // append "pinning"
                        jQuery(this).closest('.zbsLogOutEdits').addClass('stayhovered');
                        jQuery('span',jQuery(this).closest('.zbsLogOutEdits')).html('<?php esc_html_e( 'Pinning', 'zero-bs-crm' ); ?>...');

                        var noteID = parseInt(jQuery(this).closest('.zbsLogOut').attr('data-logid'));

                        if (noteID > 0){

                            var thisEle = this;

                            jpcrm_js_pin_note( noteID, function(){

                                // success

                                    // localise
                                    var nID = noteID;

                                    // append "pinned"
                                    jQuery('span',jQuery(thisEle).closest('.zbsLogOutEdits')).html('<?php esc_html_e( 'Pinned', 'zero-bs-crm' ); ?>');

                                    var that = thisEle;
                                    setTimeout(function(){

                                        // add pinned
                                        jQuery(that).closest('.zbsLogOut').addClass( 'jpcrm-pinned' );
                                        jQuery('span',jQuery(that).closest('.zbsLogOutEdits')).html('');
                                        jQuery(that).closest('.zbsLogOutEdits').removeClass( 'stayhovered' );
                                        jQuery(that).closest('.zbsLogOutEdits').css('display','none');


                                    },500);

                            },function(){

                                //TODO: proper error msg
                                console.error('There was an issue pinning this log'); 

                            });

                        } else console.error('There was an issue pinning this log'); //TODO: proper error msg

                    });


                    // bind unpin
                    jQuery('.zbsLogOutEdits .jpcrm_log_unpin').off('click').on( 'click', function(){

                        // append "pinning"
                        jQuery(this).closest('.zbsLogOutEdits').addClass('stayhovered');
                        jQuery('span',jQuery(this).closest('.zbsLogOutEdits')).html('<?php esc_html_e( 'Removing Pin', 'zero-bs-crm' ); ?>...');

                        var noteID = parseInt(jQuery(this).closest('.zbsLogOut').attr('data-logid'));

                        if (noteID > 0){

                            var thisEle = this;

                            jpcrm_js_unpin_note( noteID, function(){

                                // success

                                    // localise
                                    var nID = noteID;

                                    // append "pinned"
                                    jQuery('span',jQuery(thisEle).closest('.zbsLogOutEdits')).html('<?php esc_html_e( 'Unpinned', 'zero-bs-crm' ); ?>');

                                    var that = thisEle;
                                    setTimeout(function(){

                                        // remove pinned
                                        jQuery(that).closest('.zbsLogOut').removeClass( 'jpcrm-pinned' );
                                        jQuery('span',jQuery(that).closest('.zbsLogOutEdits')).html('');
                                        jQuery(that).closest('.zbsLogOutEdits').removeClass( 'stayhovered' );
                                        jQuery(that).closest('.zbsLogOutEdits').css('display','none');


                                    },500);

                            },function(){

                                //TODO: proper error msg
                                console.error('There was an issue pinning this log'); 

                            });

                        } else console.error('There was an issue pinning this log'); //TODO: proper error msg

                    });

                    // bind edit
                    jQuery('.zbsLogOutEdits .zbsLogActionEdit').off('click').on( 'click', function(){

                        if (window.zbsLogPerms.addedit){

                            // one at a time please sir...
                            if (window.zbsLogEditing == -1){

                                // get edit id
                                var noteID = parseInt(jQuery(this).closest('.zbsLogOut').attr('data-logid'));

                                // get edit obj
                                var editObj = zbscrmjs_retrieveItemFromIndex(noteID);

                                // move edit box to before here
                                jQuery('#zbsEditLogForm').insertBefore('#zbsLogOutLine' + noteID);

                                setTimeout(function(){

                                    var lObj = editObj;
                                    if (typeof lObj.meta != "undefined") lObj = lObj.meta; // pre dal2

                                    // update edit box texts etc.
                                    jQuery('#zbsEditLogMainDesc').val(lObj.shortdesc);
                                    jQuery('#zbsEditLogDetailedDesc').val(zbscrmjs_reversenl2br(lObj.longdesc));
                                    jQuery('#zbsEditLogPinNote').prop('checked', lObj.pinned);
                                    jQuery('#zbsEditLogType option').each(function(){
                                        if (zbscrmjs_permify(jQuery(this).text()) == lObj.type) {
                                            jQuery(this).attr('selected', 'selected');
                                            return false;
                                        }
                                        return true;
                                    });
                                
                                    // type ico

                                        // get perm
                                        var logPerm = zbscrmjs_permify(lObj.type);
                                    
                                        var thisIco = window.zbsLogDefIco;
                                        // find ico
                                        if (typeof window.zbsLogTypes[logPerm] != "undefined") thisIco = window.zbsLogTypes[logPerm].ico;

                                        // update
                                        jQuery('#zbsEditLogIco i').attr('class','fa ' + thisIco);


                                },10);

                                // set edit vars
                                window.zbsLogEditing = noteID;

                                // hide line / show edit
                                jQuery('#zbsLogOutLine' + noteID).slideUp();
                                jQuery('#zbsEditLogForm').slideDown();

                                // bind
                                zbscrmjs_bindEditNote();

                            }
                       
                       } // if perms

                    });

                }

                function zbscrmjs_bindEditNote(){


                        // cancel
                        jQuery('#zbscrmEditLogCancel').on( 'click', function(){

                                // get note id
                                var noteID = window.zbsLogEditing;

                                // hide edit from
                                jQuery('#zbsEditLogForm').hide();

                                // show back log
                                jQuery('#zbsLogOutLine' + noteID).show();

                                // unset noteID
                                window.zbsLogEditing = -1;

                        });

                        // save
                        jQuery('#zbscrmEditLogSave').on( 'click', function(){

                                if (window.zbsLogEditing > -1){

                                        // get note id
                                        var noteID = window.zbsLogEditing;

                                        //jQuery('#zbsEditLogFormTR').hide();

                                        //jQuery('#zbscrmEditLog').show();

                                        /* 
                                        zbsnagainstid
                                        zbsntype
                                        zbsnshortdesc            
                                        zbsnlongdesc
                                        zbsnoverwriteid
                                        */

                                        // get / check data
                                        var data = {sec:window.zbscrmjs_logsSecToken,zbsnobjtype:'<?php echo $this->postType; ?>'}; var errs = 0;

                                        // same as add code, but with note id:
                                        data.zbsnprevid = noteID;

                                        if ((jQuery('#zbsEditLogType').val()).length > 0) data.zbsntype = jQuery('#zbsEditLogType').val();
                                        if ((jQuery('#zbsEditLogMainDesc').val()).length > 0) data.zbsnshortdesc = jQuery('#zbsEditLogMainDesc').val();
                                        if ((jQuery('#zbsEditLogDetailedDesc').val()).length > 0) 
                                            data.zbsnlongdesc = jQuery('#zbsEditLogDetailedDesc').val();
                                        else
                                            data.zbsnlongdesc = '';

                                        if (jQuery('#zbsEditLogPinNote').is(':checked')) {
                                            data.pinned = true;
                                        }

                                        // post id & no need for overwrite id as is new
                                        data.zbsnagainstid = parseInt(window.zbsLogAgainstID);

                                        // validate
                                        var msgOut = '';
                                        if (typeof data.zbsntype == "undefined" || data.zbsntype == '') {
                                            errs++;
                                            msgOut = 'Note Type is required!'; 
                                            jQuery('#zbsEditLogType').css('border','2px solid orange');
                                            setTimeout(function(){

                                                jQuery('#zbsEditLogUpdateMsg').html('');
                                                jQuery('#zbsEditLogType').css('border','1px solid #ddd');

                                            },1500);
                                        }
                                        if (typeof data.zbsnshortdesc == "undefined" || data.zbsnshortdesc == '') {
                                            errs++;
                                            if (msgOut == 'Note Type is required!') 
                                                msgOut = 'Note Type and Description are required!'; 
                                            else
                                                msgOut += 'Note Description is required!'; 
                                            jQuery('#zbsEditLogMainDesc').css('border','2px solid orange');
                                            setTimeout(function(){

                                                jQuery('#zbsEditLogUpdateMsg').html('');
                                                jQuery('#zbsEditLogMainDesc').css('border','1px solid #ddd');

                                            },1500);
                                        }


                                        if (errs === 0){

                                            // add action
                                            data.action = 'zbsupdatelog';
                                            zbscrmjs_updateNote(data,function(newLog){

                                                // success

                                                    // msg
                                                    jQuery('#zbsEditLogUpdateMsg').html('Changes Saved!');

                                                    // then hide form, build new log gui, clear form

                                                        // hide + clear form
                                                        jQuery('#zbsEditLogForm').hide();
                                                        jQuery('#zbsEditLogType').val('Note');
                                                        jQuery('#zbsEditLogMainDesc').val('');
                                                        jQuery('#zbsEditLogDetailedDesc').val('');
                                                        jQuery('#zbsEditLogPinNote').prop('checked', false);
                                                        jQuery('#zbsEditLogUpdateMsg').html('');

                                                    // update it (build example obj)
                                                    var newLogObj = {
                                                        id: newLog.logID,
                                                        created: '',
                                                        meta: {

                                                            type: newLog.zbsntype,
                                                            shortdesc: newLog.zbsnshortdesc,
                                                            // have to replace the nl2br for long desc:
                                                            longdesc: zbscrmjs_nl2br(newLog.zbsnlongdesc)

                                                        }
                                                    }
                                                    if (newLog.pinned) {
                                                        newLogObj.pinned = true;
                                                    }
                                                    zbscrmjs_addNewNoteLine(newLogObj,true,true); // third param here is "replace existing"

                                                    // also add to window obj in prev place
                                                    //window.zbsLogIndex.push(newLogObj);
                                                    zbscrmjs_replaceItemInLogIndx(newLog.logID,newLogObj);

                                                    // unset noteID
                                                    window.zbsLogEditing = -1;

                                                    // bind ui
                                                    setTimeout(function(){
                                                        zbscrmjs_bindNoteUIJS();
                                                        zbscrmjs_updateLogCount();
                                                    },0);


                                            },function(){

                                                // failure

                                                    // msg + do nothing
                                                    jQuery('#zbsEditLogUpdateMsg').html('There was an error when saving this note!');

                                            });

                                        } else {
                                            if (typeof msgOut !== "undefined" && msgOut != '') jQuery('#zbsEditLogUpdateMsg').html(msgOut); 
                                        }


                                } // if note id

                        });


                }

                function zbscrmjs_removeItemFromLogIndx(noteID){

                    var logIndex = window.zbsLogIndex;
                    var newLogIndex = [];

                    jQuery.each(logIndex,function(ind,ele){

                        if (typeof ele.id != "undefined" && ele.id != noteID) newLogIndex.push(ele);

                    });

                    window.zbsLogIndex = newLogIndex;

                    // fini
                    return window.zbsLogIndex;

                }

                function zbscrmjs_replaceItemInLogIndx(noteIDToReplace,newObj){

                    var logIndex = window.zbsLogIndex;
                    var newLogIndex = [];

                    jQuery.each(logIndex,function(ind,ele){

                        if (typeof ele.id != "undefined")
                            if (ele.id != noteIDToReplace) 
                                newLogIndex.push(ele);
                            else
                                // is to replace
                                newLogIndex.push(newObj);

                    });

                    window.zbsLogIndex = newLogIndex;

                    // fini
                    return window.zbsLogIndex;

                }

                function zbscrmjs_retrieveItemFromIndex(noteID){

                    var logIndex = window.zbsLogIndex;
                    var logObj = -1;

                    jQuery.each(logIndex,function(ind,ele){

                        if (typeof ele.id != "undefined" && ele.id == noteID) logObj = ele;

                    });

                    return logObj;
                }

                

                // function assumes a legit dataArr :) (validate above)
                function zbscrmjs_addNewNote(dataArr,cb,errcb){
                    
                    // needs nonce. <!--#NONCENEEDED -->

                    if (!window.zbsLogProcessingBlocker){
                        
                        // blocker
                        window.zbsLogProcessingBlocker = true;

                        // msg
                        jQuery('#zbsAddLogUpdateMsg').html('<?php esc_html_e('Saving...',"zero-bs-crm");?>');

                         // Send 
                            jQuery.ajax({
                                  type: "POST",
                                  url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
                                  "data": dataArr,
                                  dataType: 'json',
                                  timeout: 20000,
                                  success: function(response) {

                                    // Debug  console.log("RESPONSE",response);

                                    // blocker
                                    window.zbsLogProcessingBlocker = false;

                                    // this also has true/false on update... 
                                    if (typeof response.processed != "undefined" && response.processed){

                                        // callback
                                        // make a merged item... 
                                        var retArr = dataArr; dataArr.logID = response.processed;
                                        if (typeof cb == "function") cb(retArr);

                                    } else {

                                        // .. was an error :)

                                        // callback
                                        if (typeof errcb == "function") errcb(response);

                                    }


                                  },
                                  error: function(response){ 

                                    // Debug  console.error("RESPONSE",response);

                                    // blocker
                                    window.zbsLogProcessingBlocker = false;

                                    // callback
                                    if (typeof errcb == "function") errcb(response);



                                  }

                            });


                    } else {
                        
                        // end of blocker
                        jQuery('#zbsAddLogUpdateMsg').html('... already processing!');
                        setTimeout(function(){

                            jQuery('#zbsAddLogUpdateMsg').html('');

                        },2000);

                    }

                }

                // function assumes a legit dataArr :) (validate above)
                // is almost a clone of _addNote (homogenise later)
                function zbscrmjs_updateNote(dataArr,cb,errcb){
                    
                    // needs nonce. <!--#NONCENEEDED -->

                    if (!window.zbsLogProcessingBlocker){
                        
                        // blocker
                        window.zbsLogProcessingBlocker = true;

                        // msg
                        jQuery('#zbsEditLogUpdateMsg').html('<?php esc_html_e('Saving...',"zero-bs-crm");?>');

                         // Send 
                            jQuery.ajax({
                                  type: "POST",
                                  url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
                                  "data": dataArr,
                                  dataType: 'json',
                                  timeout: 20000,
                                  success: function(response) {

                                    // Debug  console.log("RESPONSE",response);

                                    // blocker
                                    window.zbsLogProcessingBlocker = false;

                                    // this also has true/false on update... 
                                    if (typeof response.processed != "undefined" && response.processed){

                                        // callback
                                        // make a merged item... 
                                        var retArr = dataArr; dataArr.logID = response.processed;
                                        if (typeof cb == "function") cb(retArr);

                                    } else {

                                        // .. was an error :)

                                        // callback
                                        if (typeof errcb == "function") errcb(response);

                                    }


                                  },
                                  error: function(response){ 

                                    // Debug  console.error("RESPONSE",response);

                                    // blocker
                                    window.zbsLogProcessingBlocker = false;

                                    // callback
                                    if (typeof errcb == "function") errcb(response);



                                  }

                            });


                    } else {
                        
                        // end of blocker
                        jQuery('#zbsEditLogUpdateMsg').html('... already processing!');
                        setTimeout(function(){

                            jQuery('#zbsEditLogUpdateMsg').html('');

                        },2000);

                    }

                }


                // function assumes a legit noteID + perms :) (validate above)
                function zbscrmjs_deleteNote(noteID,cb,errcb){
                    
                    // needs nonce. <!--#NONCENEEDED -->

                    if (!window.zbsLogProcessingBlocker){
                        
                        // blocker
                        window.zbsLogProcessingBlocker = true;

                        // -package
                        var dataArr = {
                            action : 'zbsdellog',
                            zbsnid : noteID,
                            sec:window.zbscrmjs_logsSecToken
                        };

                         // Send 
                            jQuery.ajax({
                                  type: "POST",
                                  url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
                                  "data": dataArr,
                                  dataType: 'json',
                                  timeout: 20000,
                                  success: function(response) {

                                    // Debug  console.log("RESPONSE",response);

                                    // blocker
                                    window.zbsLogProcessingBlocker = false;

                                    // this also has true/false on update... 
                                    if (typeof response.processed != "undefined" && response.processed){

                                        // Debug console.log("SUCCESS");

                                        // callback
                                        if (typeof cb == "function") cb(response);

                                    } else {

                                        // .. was an error :)
                                        // Debug console.log("ERRZ");                                    

                                        // callback
                                        if (typeof errcb == "function") errcb(response);

                                    }


                                  },
                                  error: function(response){ 

                                    // Debug  console.error("RESPONSE",response);

                                    // blocker
                                    window.zbsLogProcessingBlocker = false;

                                    // callback
                                    if (typeof errcb == "function") errcb(response);



                                  }

                            });


                    } else {
                        
                        // end of blocker

                    }

                }




                // function assumes a legit noteID + perms :) (validate above)
                function jpcrm_js_pin_note(noteID,cb,errcb){
                    
                    // needs nonce. <!--#NONCENEEDED -->

                    if (!window.zbsLogProcessingBlocker){
                        
                        // blocker
                        window.zbsLogProcessingBlocker = true;

                        // -package
                        var dataArr = {
                            action : 'jpcrmpinlog',
                            zbsnid : noteID,
                            sec:window.zbscrmjs_logsSecToken
                        };

                         // Send 
                            jQuery.ajax({
                                  type: "POST",
                                  url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
                                  "data": dataArr,
                                  dataType: 'json',
                                  timeout: 20000,
                                  success: function(response) {

                                    // Debug  console.log("RESPONSE",response);

                                    // blocker
                                    window.zbsLogProcessingBlocker = false;

                                    // this also has true/false on update... 
                                    if (typeof response.processed != "undefined" && response.processed){

                                        // Debug console.log("SUCCESS");

                                        // callback
                                        if (typeof cb == "function") cb(response);

                                    } else {

                                        // .. was an error :)
                                        // Debug console.log("ERRZ");                                    

                                        // callback
                                        if (typeof errcb == "function") errcb(response);

                                    }


                                  },
                                  error: function(response){ 

                                    // Debug  console.error("RESPONSE",response);

                                    // blocker
                                    window.zbsLogProcessingBlocker = false;

                                    // callback
                                    if (typeof errcb == "function") errcb(response);



                                  }

                            });


                    } else {
                        
                        // end of blocker

                    }

                }


                // function assumes a legit noteID + perms :) (validate above)
                function jpcrm_js_unpin_note(noteID,cb,errcb){
                    
                    // needs nonce. <!--#NONCENEEDED -->

                    if (!window.zbsLogProcessingBlocker){
                        
                        // blocker
                        window.zbsLogProcessingBlocker = true;

                        // -package
                        var dataArr = {
                            action : 'jpcrmunpinlog',
                            zbsnid : noteID,
                            sec:window.zbscrmjs_logsSecToken
                        };

                         // Send 
                            jQuery.ajax({
                                  type: "POST",
                                  url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
                                  "data": dataArr,
                                  dataType: 'json',
                                  timeout: 20000,
                                  success: function(response) {

                                    // Debug  console.log("RESPONSE",response);

                                    // blocker
                                    window.zbsLogProcessingBlocker = false;

                                    // this also has true/false on update... 
                                    if (typeof response.processed != "undefined" && response.processed){

                                        // Debug console.log("SUCCESS");

                                        // callback
                                        if (typeof cb == "function") cb(response);

                                    } else {

                                        // .. was an error :)
                                        // Debug console.log("ERRZ");                                    

                                        // callback
                                        if (typeof errcb == "function") errcb(response);

                                    }


                                  },
                                  error: function(response){ 

                                    // Debug  console.error("RESPONSE",response);

                                    // blocker
                                    window.zbsLogProcessingBlocker = false;

                                    // callback
                                    if (typeof errcb == "function") errcb(response);



                                  }

                            });


                    } else {
                        
                        // end of blocker

                    }

                }
                
                </script><?php
                // phpcs:enable Generic.WhiteSpace.DisallowSpaceIndent.SpacesUsed

        } // / if post type


    }

    public function save_data( $objID, $obj ) {

        // not req. ajax

        return $obj;
    }
}


/* ======================================================
  / Logs V2 - DB2 Metabox
   ====================================================== */


    #} Mark as included :)
    define('ZBSCRM_INC_LOGSMB',true);
