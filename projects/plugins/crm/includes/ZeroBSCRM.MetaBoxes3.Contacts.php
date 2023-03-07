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

   function zeroBSCRM_CustomersMetaboxSetup(){

    if (zeroBSCRM_is_customer_edit_page()){

        // Customer Fields
        $zeroBS__Metabox_Contact = new zeroBS__Metabox_Contact( __FILE__ );

        // Actions
        $zeroBS__Metabox_ContactActions = new zeroBS__Metabox_ContactActions( __FILE__ );

        // Logs

            // req. for custom log types
            zeroBSCRM_setupLogTypes();
            
            // metabox
            $zeroBS__Metabox_ContactLogs = new zeroBS__Metabox_ContactLogs( __FILE__ );

        // Tags
        $zeroBS__Metabox_ContactTags = new zeroBS__Metabox_ContactTags( __FILE__ );

        // External sources
        //$zeroBS__Metabox_ContactExternalSources = new zeroBS__Metabox_ContactExternalSources( __FILE__ );
        $zeroBS__Metabox_ExtSource = new zeroBS__Metabox_ExtSource( __FILE__, 'contact','zbs-add-edit-contact-edit');


        // Quotes, Invs, Trans
        // Don't need now we have singular :)
        //$zeroBS__MetaboxAssociated = new zeroBS__MetaboxAssociated( __FILE__ );
        
        // Client Portal access
        if (zeroBSCRM_isExtensionInstalled('portal')) $zeroBS__Metabox_ContactPortal = new zeroBS__Metabox_ContactPortal( __FILE__ );

        // Customer File Attachments

            // Custom file attachment boxes
            if (zeroBSCRM_is_customer_edit_page()){

                /* old way 
                $settings = zeroBSCRM_getSetting('customfields'); $cfbInd = 1;

                if (isset($settings['customersfiles']) && is_array($settings['customersfiles']) && count($settings['customersfiles']) > 0) foreach ($settings['customersfiles'] as $cfb){

                    $cfbName = ''; if (isset($cfb[0])) $cfbName = $cfb[0];

                    //add_meta_box('zerobs-customer-files-'.$cfbInd, $cfbName, 'zeroBS__MetaboxFilesCustom', 'zerobs_customer', 'normal', 'low',$cfbName);  
                    $zeroBS__Metabox_ContactCustomFiles = new zeroBS__Metabox_ContactCustomFiles( __FILE__, 'zerobs-customer-files-'.$cfbInd , $cfbName);
                    
                    $cfbInd++;
                } */

                $fileSlots = zeroBSCRM_fileSlots_getFileSlots();
                if (count($fileSlots) > 0) foreach ($fileSlots as $fs){

                    $zeroBS__Metabox_ContactCustomFiles = new zeroBS__Metabox_ContactCustomFiles( __FILE__, 'zerobs-customer-files-'.$fs['key'] , $fs['name']);
                    
                }

            }

        #} Social
        if (zeroBSCRM_getSetting('usesocial') == "1") $zeroBS__Metabox_ContactSocial = new zeroBS__Metabox_ContactSocial( __FILE__ );

        #} AKA
        if (zeroBSCRM_getSetting('useaka') == "1") $zeroBS__Metabox_ContactAKA = new zeroBS__Metabox_ContactAKA( __FILE__ );

        #} Ownership
        if (zeroBSCRM_getSetting('perusercustomers') == "1") $zeroBS__Metabox_Ownership = new zeroBS__Metabox_Ownership( __FILE__, ZBS_TYPE_CONTACT);

        #} B2B mode (assign to co)
        if (zeroBSCRM_getSetting('companylevelcustomers') == "1") $zeroBS__Metabox_ContactCompany = new zeroBS__Metabox_ContactCompany( __FILE__ );
        
        }


		// Activity box on view page
		if ( zeroBSCRM_is_customer_view_page() ) {
			$zeroBS__Metabox_Contact_Activity = new zeroBS__Metabox_Contact_Activity( __FILE__ );
			if ( zeroBSCRM_isExtensionInstalled( 'portal' ) ) {
				$zeroBS__Metabox_ContactPortal = new zeroBS__Metabox_ContactPortal( __FILE__, 'zbs-view-contact' );
			}
		}
	}

   add_action( 'admin_init', 'zeroBSCRM_CustomersMetaboxSetup' );


/* ======================================================
   / Init Func
   ====================================================== */



/* ======================================================
  Declare Globals
   ====================================================== */

    #} Used throughout
    // Don't know who added this, but GLOBALS are out of scope here
    //global $zbsCustomerFields,$zbsCustomerQuoteFields,$zbsCustomerInvoiceFields;

/* ======================================================
  / Declare Globals
   ====================================================== */


   // PerfTest: zeroBSCRM_performanceTest_startTimer('custmetabox');

/* ======================================================
  Customer Metabox
   ====================================================== */

    class zeroBS__Metabox_Contact extends zeroBS__Metabox{ 
        
        // this is for catching 'new' contacts
        private $newRecordNeedsRedir = false;

        public function __construct( $plugin_file ) {

            // set these
            // DAL3 switched for objType $this->postType = 'zerobs_customer';
            $this->objType = 'contact';
            $this->metaboxID = 'zerobs-customer-edit';
            $this->metaboxTitle = __('Contact Details',"zero-bs-crm");
            $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
            $this->metaboxArea = 'normal';
            $this->metaboxLocation = 'high';
            $this->saveOrder = 1;
            $this->capabilities = array(

                'can_hide'          => false, // can be hidden
                'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => false, // can be added as tab
                'can_minimise'      => true, // can be minimised
                'can_move'          => true // can be moved

            );

            // call this 
            $this->initMetabox();

        }

        public function html( $contact, $metabox ) {

                //echo '<pre>'; print_r(array($contact,$metabox)); echo '</pre>';

               // PerfTest: zeroBSCRM_performanceTest_startTimer('custmetabox-dataget');

                global $zbs;

                #} Rather than reload all the time :)
                global $zbsContactEditing; 

                #} retrieve
                //$zbsCustomer = get_post_meta($contact['id'], 'zbs_customer_meta', true);
                if (!isset($zbsContactEditing) && isset($contact['id'])){
                    $zbsCustomer = zeroBS_getCustomer($contact['id'],false,false,false);
                    $zbsContactEditing = $zbsCustomer;
                } else {
                    $zbsCustomer = $zbsContactEditing;
                }

                // Get field Hides...
                $fieldHideOverrides = $zbs->settings->get('fieldhides');
                $zbsShowID = $zbs->settings->get('showid');

                // Click 2 call?
                $click2call = $zbs->settings->get('clicktocall');

       
                global $zbsCustomerFields;
                $fields = $zbsCustomerFields;

                /* debug 
                echo 'zbsCustomer<pre>'.print_r($zbsCustomer,1).'</pre>'; 
                echo 'zbsCustomerFields<pre>'.print_r($zbsCustomerFields,1).'</pre>'; exit();
                */


                #} Address settings
                $showAddresses = zeroBSCRM_getSetting('showaddress');
                $showSecondAddress = zeroBSCRM_getSetting('secondaddress');
                $showCountryFields = zeroBSCRM_getSetting('countries');
                $second_address_label = zeroBSCRM_getSetting( 'secondaddresslabel' );
                if ( empty( $second_address_label ) ) {
                  $second_address_label = __( 'Second Address', 'zero-bs-crm' );
                }


               // PerfTest: zeroBSCRM_performanceTest_finishTimer('custmetabox-dataget');
               // PerfTest: zeroBSCRM_performanceTest_startTimer('custmetabox-draw');
            
                //sticky tape some CSS until new UI!!
            ?>
                <style>
                    #post-body-content{
                        display:none;
                    }
                        @media all and (max-width:699px){
                        table.wh-metatab{
                            min-width:100% !important;
                        }
                    }  
                </style>
                <script type="text/javascript">var zbscrmjs_secToken = '<?php echo esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ); ?>';</script>

                <?php #} Pass this if it's a new customer (for internal automator) - note added this above with DEFINE for simpler.

                    if (gettype($zbsCustomer) != "array") echo '<input type="hidden" name="zbscrm_newcustomer" value="1" />';

                ?>



                <table class="form-table wh-metatab wptbp" id="wptbpMetaBoxMainItem">
                    <?php
                       $avatar_mode = zeroBSCRM_getSetting( 'avatarmode' );
							  // The only mode allowed to change images is Custom Images
                       // (avatar_mode == "2") => Custom Images mode
                       if ( $avatar_mode == "2" ) :
                    ?>
                    <tr class="wh-large"><th style="vertical-align: middle;"><label><?php esc_html_e('Profile Picture',"zero-bs-crm");?>:</label></th>
                    <td class="zbs-field-id">
                    <?php
                        $avatar_url       = isset( $contact['id'] ) ? $zbs->DAL->contacts->getContactAvatar( $contact['id'] ) : zeroBSCRM_getDefaultContactAvatar();
                        $empty_avatar_url = zeroBSCRM_getDefaultContactAvatar();
                    ?>
                    <div class="jpcrm-customer-profile-picture-container" style="margin-right:10px;">
                        <img src="<?php echo esc_attr( $avatar_url ); ?>" id="profile-picture-img" class="jpcrm-customer-profile-picture" />
                        <img src="<?php echo esc_attr( $empty_avatar_url ); ?>" id="empty-profile-picture" class="jpcrm-customer-profile-picture" style="display:none;" />
                    <br />
                    <label for="zbsc_profile-picture-file" class="jpcrm-customer-file-upload">
                        <?php esc_html_e( 'Change Picture', 'zero-bs-crm' ); ?>
                        <input id="zbsc_profile-picture-file" type="file" name="zbsc_profile-picture-file" class="jpcrm-customer-input-file"/>
                    </label>
                    <label id="zbsc_remove-profile-picture-button" class="jpcrm-customer-file-upload-remove">
                        <?php esc_html_e( 'Remove', 'zero-bs-crm' ); ?>
                        <input type="hidden" id="zbsc_remove-profile-picture" name="zbsc_remove-profile-picture" value="0" />
                    </label>
                    <?php 
                        endif; 
                    ?>

                    <?php #} WH Hacky quick addition for MVP 
                    # ... further hacked

                    if ($zbsShowID == "1" && isset($contact['id']) && !empty($contact['id'])) { ?>
							<tr class="wh-large"><th><label><?php esc_html_e( 'Contact ID', 'zero-bs-crm' ); ?>:</label></th>
                    <td class="zbs-field-id">
                        #<?php if (isset($contact['id'])) echo esc_html( $contact['id'] ); ?>
                    </td></tr>
                    <?php }

            
                    #} This global holds "enabled/disabled" for specific fields... ignore unless you're WH or ask
                    global $zbsFieldsEnabled; if ($showSecondAddress == "1") $zbsFieldsEnabled['secondaddress'] = true;                    

                    // WH: some people reporting second address still showing so applied a SECONDARY fix as couldn't replicate
                    // see #2NDADDR below 
                    
                    #} This is the grouping :)
                    $zbsFieldGroup = ''; $zbsOpenGroup = false;

                    foreach ($fields as $fieldK => $fieldV){
                        
                        $showField = true;

                        #} Check if not hard-hidden by opt override (on off for second address, mostly)
                        if (isset($fieldV['opt']) && (!isset($zbsFieldsEnabled[$fieldV['opt']]) || !$zbsFieldsEnabled[$fieldV['opt']])) $showField = false;


                        // or is hidden by checkbox? 
                        if (isset($fieldHideOverrides['customer']) && is_array($fieldHideOverrides['customer'])){
                            if (in_array($fieldK, $fieldHideOverrides['customer'])){
                              $showField = false;
                            }
                        }

                        // 'show/hide Countries' setting:
                        if (isset($fieldV[0]) && $fieldV[0] == 'selectcountry' && $showCountryFields == 0 ) $showField = false;


                        // ==================================================================================
                        // Following grouping code needed moving out of ifShown loop:

                            #} Whatever prev field group was, if this is diff, close (post group)
                            if (
                                $zbsOpenGroup &&
                                    #} diff group
                                    ( 
                                        (isset($fieldV['area']) && $fieldV['area'] != $zbsFieldGroup) ||
                                        #} No group
                                         !isset($fieldV['area']) && $zbsFieldGroup != ''
                                    )
                                ){

                                    #} Special cases... gross
                                    $zbsCloseTable = true; if ($zbsFieldGroup == 'Main Address') $zbsCloseTable = false;

                                    #} Close it
                                    echo '</table></div>';
                                    if ($zbsCloseTable) echo '</td></tr>';

                            }

                            #} Any groupings?
                            if (isset($fieldV['area'])){

                                #} First in a grouping? (assumes in sequential grouped order)
                                if ($zbsFieldGroup != $fieldV['area']){

                                    #} set it
                                    $zbsFieldGroup = $fieldV['area'];
                                    $fieldGroupLabel = str_replace(' ','_',$zbsFieldGroup); $fieldGroupLabel = strtolower($fieldGroupLabel);

                                    #} Special cases... gross
                                    $zbsOpenTable = true; if ($zbsFieldGroup == 'Second Address') $zbsOpenTable = false;

                                    #} Make class for hiding address (this form output is weird) <-- classic mike saying my code is weird when it works fully. Ask if you don't know!
                                    $zbsLineClass = ''; $zbsGroupClass = '';

                                    // if addresses turned off, hide the lot
                                    if ($showAddresses != "1") {

                                        // addresses turned off
                                        $zbsLineClass = 'zbs-hide';
                                        $zbsGroupClass = 'zbs-hide';

                                    } else { 

                                        // addresses turned on
                                        if ($zbsFieldGroup == 'Second Address'){

                                            // if we're in second address grouping:

                                                // if second address turned off
                                                if ($showSecondAddress != "1"){

                                                    $zbsLineClass = 'zbs-hide';
                                                    $zbsGroupClass = 'zbs-hide';

                                                }

                                        }

                                    }

                                    // / address  modifiers

                                    #} add group div + label
                                    if ($zbsOpenTable) echo '<tr class="wh-large zbs-field-group-tr ' . esc_attr( $zbsLineClass ) . '"><td colspan="2">';

                                    if( $fieldV['area'] == 'Second Address' ) {
                                        echo '<div class="zbs-field-group zbs-fieldgroup-'. esc_attr( $fieldGroupLabel ) .' '. esc_attr( $zbsGroupClass ) .'"><label class="zbs-field-group-label">'. esc_html( $second_address_label ) .'</label>';
                                    } else {
                                        echo '<div class="zbs-field-group zbs-fieldgroup-'.esc_attr($fieldGroupLabel).' '. esc_attr($zbsGroupClass) .'"><label class="zbs-field-group-label">'. esc_html__( $fieldV['area'], 'zero-bs-crm' ).'</label>';
                                    }

                                    echo '<table class="form-table wh-metatab wptbp" id="wptbpMetaBoxGroup-'.esc_attr($fieldGroupLabel).'">';
                                    
                                    #} Set this (need to close)
                                    $zbsOpenGroup = true;

                                }


                            } else {

                                #} No groupings!
                                $zbsFieldGroup = '';
                                $zbsOpenGroup = false;

                            }

                        // / grouping
                        // ==================================================================================
                        


                        #} If show...
                        if ($showField) {

                            if (isset($fieldV[0])){
                                if ($zbsFieldGroup == 'Second Address') {
                                    $fieldV[1] = str_replace( ' (' . $second_address_label . ')', '', $fieldV[1] );
                                }
                                // we now put these out via the centralised func (2.95.3+)
                                //... rather than distinct switch below 
                                zeroBSCRM_html_editField($zbsCustomer, $fieldK, $fieldV, $postPrefix = 'zbsc_');

                            }

                        } #} / if show

                        // ==================================================================================
                        // Following grouping code needed moving out of ifShown loop:


                        // / grouping
                        // ==================================================================================
                        


                        // new home for Company Add




                    }


                    #} Close group if still open after loop
                    if ( $zbsOpenGroup ){

                            #} Special cases... gross
                            $zbsCloseTable = true; if ($zbsFieldGroup == 'Main Address') $zbsCloseTable = false;

                            #} Close it
                            echo '</table></div>';
                            if ($zbsCloseTable) echo '</td></tr>';

                    }

                    /* Debug <tr><td colspan="2"><pre><?php print_r($zbsCustomer) ?></pre></td></tr> */

                    ?>

                    
            </table>


            <style type="text/css">
            <?php   #2NDADDR - hard override of this if setting says off, hide it, whatever!
                    if ($showSecondAddress != "1"){

                        ?>.zbs-fieldgroup-second_address {display:none;}<?php 
                    }
            ?>
                #submitdiv {
                    display:none;
                }
            </style>
            <script type="text/javascript">

                jQuery(function(){

                    // bastard override of wp terminology:
                    jQuery('#submitdiv h2 span').html('<?php esc_html_e('Save',"zero-bs-crm");?>');
                    if (jQuery('#submitdiv #publish').val() == 'Publish')
                        jQuery('#submitdiv #publish').val('<?php esc_html_e('Save',"zero-bs-crm");?>');
                    jQuery('#submitdiv').show();

                    // turn off auto-complete on customer records via form attr... should be global for all ZBS record pages
                    jQuery('#post').attr('autocomplete','off');

                });


            </script>
               
            <?php
            // PerfTest: zeroBSCRM_performanceTest_finishTimer('custmetabox-draw');
        }

        public function save_data( $contact_id, $contact ) {

            if (!defined('ZBS_C_SAVED')){

                // debug if (get_current_user_id() == 12) echo 'FIRING<br>';

                define('ZBS_C_SAVED',1);

                global $zbs;

                // check this
                if (empty($contact_id) || $contact_id < 1)  $contact_id = -1;
                
                $dataArr = zeroBS_buildContactMeta($_POST);

                // Use the tag-class function to retrieve any tags so we can add inline.
                // Save tags against objid
                $dataArr['tags'] = zeroBSCRM_tags_retrieveFromPostBag(true,ZBS_TYPE_CONTACT);  

                // owner - saved here now, rather than ownership box, to allow for pre-hook update. (as tags)
                $owner = -1;
                if ( isset( $_POST['zerobscrm-owner'] ) ){
                    // should this have perms check to see if user can actually assign to? or should that be DAL?
                    $potential_owner = (int)sanitize_text_field( $_POST['zerobscrm-owner'] );
                    if ($potential_owner > 0) $owner = $potential_owner;
                }

                // now we check whether a user with this email already exists (separate to this contact id), so we can warn them
                // ... that it wont have changed the email
                if ( !empty( $dataArr['email'] ) ) {
                    
                    if ( !zeroBSCRM_validateEmail( $dataArr['email'] ) ) {

                        $this->update_invalid_email( $dataArr['email'] );
                        $dataArr['email'] = '';

                    } else {

                        $potentialID = zeroBS_getCustomerIDWithEmail( $dataArr['email'] );

                        if ( !empty( $potentialID ) && $potentialID != $contact_id ) {

                            // no go.
                            $this->updateEmailDupeMessage( $potentialID );

                            // unset email change (leave as was)
                            $dataArr['email'] = zeroBS_customerEmail( $contact_id );

                        }
                    }

                }
				// phpcs:disable WordPress.NamingConventions.ValidVariableName -- to be refactored.
				// We have to explicitly retrieve the avatar from the DB.
				$dataArr['avatar'] = ( $contact_id !== -1 ) ? $zbs->DAL->contacts->getContactAvatar( $contact_id ) : '';
				//phpcs:enable WordPress.NamingConventions.ValidVariableName

                // make a copy for IA below (just fields)
                $contactData = $dataArr;
                
                // Company assignment?
                if (isset($_POST['zbs_company'])) $dataArr['companies'] = array((int)sanitize_text_field($_POST['zbs_company']));

                // Stripslashes
                // This avoids us adding `O\'toole ltd' into the db. see #1107
                // ...this is more sensitive than using zeroBSCRM_stripSlashesFromArr
                // in the long term it may make more sense to stripslashes pre insert/update in the DAL  
                // in the case of contacts, there are no core fields which will be broken by stripslashes at this time (4.0.11)
                $data_array = $dataArr;
                foreach ($dataArr as $key => $val){

                    // op strings
                    $value = $val;
                    if ( is_string( $value ) ) $value = stripslashes( $value );
                    
                    // pass into final array
                    $data_array[$key] = $value;

                }

                // add update directly
                $addUpdateReturn = $zbs->DAL->contacts->addUpdateContact(array(

                        'id'    => $contact_id,
                        'owner' => $owner,
                        'data'  => $data_array,
                        'limitedFields' => -1,
                        /* array(

                                'email' => $userDeets['email'], // Unique Field ! 

                                'status' => $userDeets['status'],
                                'prefix' => $userDeets['prefix'],
                                'fname' => $userDeets['fname'],
                                'lname' => $userDeets['lname'],
                                'addr1' => $userDeets['addr1'],
                                'addr2' => $userDeets['addr2'],
                                'city' => $userDeets['city'],
                                'county' => $userDeets['county'],
                                'country' => $userDeets['country'],
                                'postcode' => $userDeets['postcode'],
                                'secaddr1' => $userDeets['secaddr_addr1'],
                                'secaddr2' => $userDeets['secaddr_addr2'],
                                'seccity' => $userDeets['secaddr_city'],
                                'seccounty' => $userDeets['secaddr_county'],
                                'seccountry' => $userDeets['secaddr_country'],
                                'secpostcode' => $userDeets['secaddr_postcode'],
                                'hometel' => $userDeets['hometel'],
                                'worktel' => $userDeets['worktel'],
                                'mobtel' => $userDeets['mobtel'],
                                'wpid'  => -1,
                                'avatar' => $avatarURL,

                                // Note Custom fields may be passed here, but will not have defaults so check isset()

                                'tags' => $tags, 

                                // wh added for later use.
                                'lastcontacted' => $lastcontacted,

                                'companies' => $companies // array of co id's :)
                        ) */

                ));

                // Note: For NEW contacts, we make sure a global is set here, that other update funcs can catch 
                // ... so it's essential this one runs first!
                // this is managed in the metabox Class :)
                if ($contact_id == -1 && !empty($addUpdateReturn) && $addUpdateReturn != -1) {
                    
                    $contact_id = $addUpdateReturn;
                    global $zbsJustInsertedMetaboxID; $zbsJustInsertedMetaboxID = $contact_id;

                    // set this so it redirs
                    $this->newRecordNeedsRedir = true;
                }

                // success?
                if ($addUpdateReturn != -1 && $addUpdateReturn > 0){
                    $this->save_profile_picture( $contact_id, $contact );
                    // Update Msg
                    // this adds an update message which'll go out ahead of any content
                    // This adds to metabox: $this->updateMessages['update'] = zeroBSCRM_UI2_messageHTML('info olive mini zbs-not-urgent',__('Contact Updated',"zero-bs-crm"),'','address book outline','contactUpdated');
                    // This adds to edit page
                    $this->updateMessage( $this->newRecordNeedsRedir );

                    // catch any non-critical messages
                    $nonCriticalMessages = $zbs->DAL->getErrors(ZBS_TYPE_CONTACT);
                    if (is_array($nonCriticalMessages) && count($nonCriticalMessages) > 0) $this->dalNoticeMessage($nonCriticalMessages);

                } else {

                    // fail somehow
                    $failMessages = $zbs->DAL->getErrors(ZBS_TYPE_CONTACT);

                    // show msg (retrieved from DAL err stack)
                    if (is_array($failMessages) && count($failMessages) > 0)
                        $this->dalErrorMessage($failMessages);
                    else
                        $this->dalErrorMessage(array(__('Insert/Update Failed with general error','zero-bs-crm')));

                    // pass the pre-fill:
                    global $zbsObjDataPrefill; $zbsObjDataPrefill = $dataArr;

        
                }

            }

            return $contact;
        }

        /*
        * Saves the profile picture 
        */
        public function save_profile_picture( $contact_id, $crm_contact ) {
            global $zbs;

            $contact_dir_info    = jpcrm_storage_dir_info_for_contact( $contact_id );
            $field_key           = 'jpcrm-profile-picture';
            $is_remove_flag_set  = isset( $_POST['zbsc_remove-profile-picture'] ) && $_POST['zbsc_remove-profile-picture'] == '1';
            $remove_old_avatar   = false;
            $has_new_avatar_file = 
                isset( $_FILES['zbsc_profile-picture-file'] ) 
                && empty( $_FILES['zbsc_profile-picture-file']['error'] ) 
                && is_uploaded_file( $_FILES['zbsc_profile-picture-file']['tmp_name'] );

            if ( $is_remove_flag_set ) {
                $zbs->DAL->contacts->addUpdateContact( array(
                    'id'             => $contact_id,
                    'limitedFields'  => array(
                        array( 
                            'key'  => 'zbsc_avatar',
                            'val'  => '',
                            'type' => '%s'
                        )
                    )
                ));
                $remove_old_avatar = true;
            } else if ( $has_new_avatar_file ) {

                // verify image file type
                $allowed_image_types = array('image/jpeg' => 'jpg', 'image/jpg' => 'jpg', 'image/gif' => 'gif', 'image/png' => 'png');
                $allowed_file_extensions = array( '.jpg', '.jpeg', '.gif', '.png' );
                $allowed_mime_types = array( 'image/jpeg','image/jpg', 'image/gif', 'image/png' );
                if ( !jpcrm_file_check_mime_extension( $_FILES['zbsc_profile-picture-file'], $allowed_file_extensions, $allowed_mime_types ) ){

                    $this->dalErrorMessage ( array( __( 'Error: Profile Picture only accepts jpg, png, and gif images!', 'zero-bs-crm' ) ) );
                    return;

                }

                if ( $contact_dir_info === false ) {
                    $this->dalErrorMessage ( array( __( 'Error while retrieving the contact\'s folder.', 'zero-bs-crm' ) ) );
                    return;
                }

                $avatar_path = $contact_dir_info['avatar']['path'];
                $contact_folder_exists = jpcrm_create_and_secure_dir_from_external_access( $avatar_path, false );

                if ( ! $contact_folder_exists ) {
                    $this->dalErrorMessage ( array( __( 'There was an error creating the profile picture directory.', 'zero-bs-crm' ) ) );
                    return;
                }

                $zbs->load_encryption();
                $avatar_filename = sprintf( 
                    'avatar_%s.%s',
                    $zbs->encryption->get_rand_hex( 10 ),
                    $allowed_image_types[ $_FILES['zbsc_profile-picture-file']['type'] ] // extension for this filetype
                );

                if ( 
                    ! file_exists( $avatar_path . '/' . $avatar_filename ) 
                    && move_uploaded_file( $_FILES['zbsc_profile-picture-file']['tmp_name'], $avatar_path . '/' . $avatar_filename) 
                ) {
                    $zbs->DAL->contacts->addUpdateContact( array(
                            'id'             => $contact_id,
                            'limitedFields'  => array(
                                array( 
                                    'key'  => 'zbsc_avatar',
                                    'val'  => $contact_dir_info['avatar']['url'] . '/' . $avatar_filename,
                                    'type' => '%s'
                                )
                            )
                    ));
                    
                    $remove_old_avatar = true;
                } else {
                    $this->dalErrorMessage ( array( __( 'There was an error updating the profile picture.', 'zero-bs-crm' ) ) );
                }
            }

            if ( $remove_old_avatar && ! empty( $crm_contact['avatar'] ) ) {
                $previous_avatar_full_path = $contact_dir_info['avatar']['path'] . '/' . basename( $crm_contact['avatar'] );
                if ( file_exists( $previous_avatar_full_path ) ) {
                    unlink( $previous_avatar_full_path );
                }
            }
        }

        // This catches 'new' contacts + redirs to right url
        public function post_save_data($objID,$obj){

            if ($this->newRecordNeedsRedir){

                global $zbs, $zbsJustInsertedMetaboxID;
                if (!empty($zbsJustInsertedMetaboxID) && $zbsJustInsertedMetaboxID > 0){

                    // redir
					$zbs->new_record_edit_redirect( 'zerobs_customer', $zbsJustInsertedMetaboxID );
                }

            }

        }

        public function updateMessage( $created = false ){
			$text = $created ? __('Contact Created',"zero-bs-crm") : __('Contact Updated',"zero-bs-crm");
            // zbs-not-urgent means it'll auto hide after 1.5s
            $msg = zeroBSCRM_UI2_messageHTML('info olive mini zbs-not-urgent',$text,'','address book outline','contactUpdated');

            // quick + dirty
            global $zbs;

            $zbs->pageMessages[] = $msg;

        }

        public function update_invalid_email( $invalid_email ) {
            global $zbs;
            $msg = zeroBSCRM_UI2_messageHTML(
                'info orange mini',
                sprintf( __( 'The contact email specified (%s) is not valid.', 'zero-bs-crm' ), $invalid_email ),
                '',
                'address book outline',
                'contactUpdated'
            );
            $zbs->pageMessages[] = $msg;
        }

        public function updateEmailDupeMessage($otherContactID=-1){

            $viewHTML = ' <a href="'.jpcrm_esc_link('view',$otherContactID,'zerobs_customer').'" target="_blank">'.__('View Contact','zero-bs-crm').'</a>';

            $msg = zeroBSCRM_UI2_messageHTML('info orange mini',__('Contact email could not be updated because a contact already exists with this email address.',"zero-bs-crm").$viewHTML,'','address book outline','contactUpdated');

            // quick + dirty
            global $zbs;

            $zbs->pageMessages[] = $msg;

        }
    }

/* ======================================================
  / Customer Metabox
   ====================================================== */


/* ======================================================
  Create Actions Box
   ====================================================== */

class zeroBS__Metabox_ContactActions extends zeroBS__Metabox{

    private $actions = array();

    public function __construct( $plugin_file ) {
    
        // DAL3 switched for objType $this->postType = 'zerobs_customer';
        $this->objType = 'contact';
        $this->metaboxID = 'zerobs-customer-actions';
        $this->metaboxTitle = __('Contact Actions',"zero-bs-crm");
        $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
        $this->metaboxArea = 'side';
        $this->metaboxLocation = 'high';
        $this->headless = true;
        $this->metaboxClasses = 'basic';
        $this->capabilities = array(

            'can_hide'          => false, // can be hidden
            'areas'             => array('side'), // areas can be dragged to - normal side = only areas currently
            'can_accept_tabs'   => false,  // can/can't accept tabs onto it
            'can_become_tab'    => false, // can be added as tab
            'can_minimise'      => false, // can be minimised
            'can_move'          => false // can be moved

        );

        // hacky id check for now:
        if (isset($_GET['zbsid']) && !empty($_GET['zbsid'])) {
            $id = (int)sanitize_text_field($_GET['zbsid']);
            // call this, if actions
            $this->actions = zeroBS_contact_actions($id);
            if (count($this->actions) > 0) $this->initMetabox();
        }

    }

    public function html( $contact, $metabox ) {

        global $zbs;
        
        $avatarMode = zeroBSCRM_getSetting( 'avatarmode' );
        $avatarStr = '';
        if ( $avatarMode !== 3 ) {

            $cID = -1; if (is_array($contact) && isset($contact['id'])) $cID = (int)$contact['id'];
            $avatarStr = zeroBS_customerAvatarHTML($cID);
            $avatarURL = zeroBS_customerAvatar($cID); // url

        }

        # https://codepen.io/kyleshockey/pen/bdeLrE 
        if (count($this->actions) > 0) { ?>

        <?php #} Show avatar if avail
        if (!empty($avatarStr)){

            // if gravatar mode, don't circle
            $segmentClass = 'ui circular segment';
            $avatarMode = zeroBSCRM_getSetting('avatarmode');
            if ( $avatarMode == 1 ) {
                $segmentClass = 'ui segment';
            }

            echo '<div id="zbs-contact-edit-avatar"><div class="'. esc_attr( $segmentClass ) .'"><h2 class="ui header">'. $avatarStr .'</h2>';            
            echo '</div></div>'; 
        } ?>
        <script type="text/javascript">
            var zbsContactAvatarLang = {
                'upload': '<?php esc_html_e("Upload Image","zero-bs-crm");?>',
            };
        </script>
        <div class="action-wrap">
          <div class="ui green basic dropdown action-button"><?php esc_html_e('Contact Actions',"zero-bs-crm"); ?><i class="dropdown icon"></i>
             <div class="menu">
              <?php foreach ($this->actions as $actKey => $action){ 

                // filter out 'edit' as on that page :)
                if ($actKey != 'edit'){
                ?>
                 <div class="item zbs-contact-action" id="zbs-contact-action-<?php echo esc_attr( $actKey ); ?>"<?php
                    // if url isset, pass that data-action, otherwise leave for js to attach to
                    if (isset($action['url']) && !empty($action['url'])){ 
                      ?> data-action="<?php if (isset($action['url'])) echo 'url'; ?>" data-url="<?php if (isset($action['url'])) echo esc_attr( $action['url'] ); ?>"<?php
                    }

                    // got extra attributes?
                    if (isset($action['extraattr']) && is_array($action['extraattr'])){

                          // dump extra attr into item
                          foreach ($action['extraattr'] as $k => $v){
                              echo ' data-'. esc_attr( $k ) .'="'. esc_attr( $v ) .'"';
                          }

                    } ?>>
                   <?php 

                      // got ico?
                      if (isset($action['ico'])) echo '<i class="'. esc_attr( $action['ico'] ) .'"></i>';

                      // got text?
                      if (isset($action['label'])) echo esc_html( $action['label'] );

                  ?>
                 </div>
              <?php } 
            }?>
              </div>
         </div>
       </div>
        <script type="text/javascript">
        jQuery(function(){

            // actions drop down
            jQuery('.ui.dropdown').dropdown();

            // action items
            jQuery('.zbs-contact-action').off('click').on( 'click', function(){

                // get action type (at launch, only url)
                var actionType = jQuery(this).attr('data-action');

                if (typeof actionType != "undefined") switch (actionType){

                    case 'url':

                        var u = jQuery(this).attr('data-url');
                        if (typeof u != "undefined" && u != '') window.location = u;

                        break;


                }

            });

        });
        </script>
       <?php }

    }

    public function save_data( $contact_id, $contact ) {    

        // avatar changes saved by main contact save func (field editor), allowing for all-in-one creation/updates, see #AVATARSAVE

        return $contact;
    }
}



/* ======================================================
  / Create Actions Box
   ====================================================== */


/* ======================================================
  Attach (custom) fileboxes to customer metabox
   ====================================================== */

    class zeroBS__Metabox_ContactCustomFiles extends zeroBS__Metabox{

        public function __construct( $plugin_file, $idOverride='',$titleOverride='' ) {

            // DAL3 switched for objType $this->postType = 'zerobs_customer';
            $this->objType = 'contact';
            $this->metaboxID = 'zerobs-customer-custom-files';
            $this->metaboxTitle = __('Other Files',"zero-bs-crm");
            $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
            $this->metaboxArea = 'normal';
            $this->metaboxLocation = 'low';
            $this->capabilities = array(

                'can_hide'          => true, // can be hidden
                'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => false,  // can/can't accept tabs onto it
                'can_become_tab'    => true, // can be added as tab
                'can_minimise'      => true // can be minimised

            );

            if (!empty($idOverride)) $this->metaboxID = $idOverride;
            if (!empty($titleOverride)) $this->metaboxTitle = __($titleOverride,"zero-bs-crm");

            // call this 
            $this->initMetabox();

        }

        public function html( $contact, $args ) {

            global $zbs;

                    $html = '';

                    $thisFileSlotName = ''; if (isset($args['title'])) $thisFileSlotName = $args['title'];
                    $filePerma = ''; if (isset($thisFileSlotName) && !empty($thisFileSlotName)) {
                        //$filePerma = strtolower(str_replace(' ','_',str_replace('.','_',substr($thisFileSlotName,0,20))));
                        $filePerma = $zbs->DAL->makeSlug($thisFileSlotName);
                    }


                    #} retrieve - shouldn't these vars be "other files"... confusing
                    $zbsFiles = zeroBSCRM_getCustomerFiles($contact['id']);

                    // This specifically looks for $args['title'] file :)
                    //$fileSlotSrc = get_post_meta($contact['id'],'cfile_'.$filePerma,true);
                    $fileSlotSrc = zeroBSCRM_fileslots_fileInSlot($filePerma,$contact['id'],ZBS_TYPE_CONTACT);


                    // check for file + only show that
                    $zbsFilesArr = array(); 
                    if ($fileSlotSrc !== '' && is_array($zbsFiles) && count($zbsFiles) > 0) foreach ($zbsFiles as $f) if ($f['file'] == $fileSlotSrc) $zbsFilesArr[] = $f;
                    $zbsFiles = $zbsFilesArr;

                    // while we only have 1 file per slot, we can do this:
                    // *js uses this to empty if deleted elsewhere (other metabox)
                    $fileSlotURL = ''; if (is_array($zbsFiles) && count($zbsFiles) == 1) $fileSlotURL = $zbsFiles[0]['url'];

                    ?>
                            <table class="form-table wh-metatab wptbp zbsFileSlotTable" data-sloturl="<?php echo esc_attr( $fileSlotURL ); ?>" id="<?php echo esc_attr( $this->metaboxID ); ?>-tab">

                                <?php

                                #} Any slot filled?
                                if (is_array($zbsFiles) && count($zbsFiles) > 0){ 
                                  ?><tr class="wh-large zbsFileSlotWrap"><th class="zbsFileSlotTitle"><label><?php echo '<span>' . esc_html( count( $zbsFiles ) ) . '</span> '.esc_html__('File(s)','zero-bs-crm').':'; ?></label></th>
                                            <td class="">
                                                <?php $fileLineIndx = 1; foreach($zbsFiles as $zbsFile){

                                                    /* $file = basename($zbsFile['file']);

                                                    // if in privatised system, ignore first hash in name
                                                    if (isset($zbsFile['priv'])){

                                                        $file = substr($file,strpos($file, '-')+1);
                                                    } */
                                                    $file = zeroBSCRM_files_baseName($zbsFile['file'],isset($zbsFile['priv']));
                                                    echo '<div class="zbsFileLine" id="zbsFileLineCustomer'. esc_attr( $fileLineIndx ) .'"><a href="'. esc_url( $zbsFile['url'] ) .'" target="_blank">'. esc_html( $file ) .'</a> </div>';
                                                    
                                                    // if using portal.. state shown/hidden
                                                    // this is also shown in each file slot :) if you change any of it change that too
                                                    if(defined('ZBS_CLIENTPRO_TEMPLATES')){
                                                        if(isset($zbsFile['portal']) && $zbsFile['portal']){
                                                          echo "<p><i class='icon check circle green inverted'></i> ".esc_html__('Shown on Portal','zero-bs-crm').'</p>';
                                                        }else{
                                                          echo "<p><i class='icon ban inverted red'></i> ".esc_html__('Not shown on Portal','zero-bs-crm').'</p>';
                                                        }
                                                    }
                                                    
                                                    $fileLineIndx++;

                                                } ?>
                                            </td></tr><?php

                                } ?>

                                <?php #adapted from http://code.tutsplus.com/articles/attaching-files-to-your-posts-using-wordpress-custom-meta-boxes-part-1--wp-22291


                                        // will be done by mainfunc wp_nonce_field(plugin_basename(__FILE__), 'zbsc_file_attachment_nonce');
                                         
                                        $html .= '<input type="file" id="zbsc_file_'.$filePerma.'" name="zbsc_file_'.$filePerma.'" size="25" class="zbs-dc">';
                                        
                                        ?><tr class="wh-large"><th><label><?php esc_html_e('Add File',"zero-bs-crm");?>:</label><br />(<?php esc_html_e('Optional',"zero-bs-crm");?>)<br /><?php esc_html_e('Accepted File Types',"zero-bs-crm");?>:<br /><?php echo esc_html( zeroBS_acceptableFileTypeListStr() ); ?></th>
                                            <td><?php
                                        echo $html;
                                ?></td></tr>

                            
                            </table>
                            <?php

                               // PerfTest: zeroBSCRM_performanceTest_finishTimer('custmetabox');
                               // PerfTest: zeroBSCRM_performanceTest_debugOut();

                               ?>
                            <script type="text/javascript">

                                jQuery(function(){

                                });


                            </script>

                            <?php

                   // PerfTest: zeroBSCRM_performanceTest_finishTimer('other');

        }

        public function save_data( $contact_id, $contact ) {


                        // when multiple custom file boxes, this only needs to fire once :)
                    if (zeroBSCRM_is_customer_edit_page() && !defined('ZBS_CUSTOMFILES_SAVED')){

                        define('ZBS_CUSTOMFILES_SAVED',1);

                        global $zbsc_justUploadedCustomer,$zbs;

                        $settings = $zbs->settings->get('customfields'); $cfbInd = 1;

                        $cfbsubs = array();

                        if (isset($settings['customersfiles']) && is_array($settings['customersfiles']) && count($settings['customersfiles']) > 0) foreach ($settings['customersfiles'] as $cfb){

                            $thisFileSlotName = ''; if (isset($cfb[0])) $thisFileSlotName = $cfb[0];
                            $filePerma = ''; if (isset($thisFileSlotName) && !empty($thisFileSlotName)) {

                                //$filePerma = strtolower(str_replace(' ','_',str_replace('.','_',substr($thisFileSlotName,0,20))));
                                $filePerma = $zbs->DAL->makeSlug($thisFileSlotName);

                            }

                            if (!empty($thisFileSlotName) && !empty($filePerma)) $cfbsubs[$filePerma] = $thisFileSlotName;
                        
                        }

                        if (count($cfbsubs) > 0) foreach ($cfbsubs as $cfSubKey => $cfSubName){


                            /* --- security verification --- */
                            if (isset($_POST['zbsc_file_attachment_nonce'])) if(!wp_verify_nonce($_POST['zbsc_file_attachment_nonce'], plugin_basename(__FILE__))) {
                              return $contact_id;
                            } // end if
                               
                            if(defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
                              return $contact_id;
                            } // end if

                            /* Switched out for WH Perms model 19/02/16 
                            if('page' == $_POST['post_type']) { 
                              if(!current_user_can('edit_page', $contact_id)) {
                                return $contact_id;
                              } // end if
                            } else { 
                                if(!current_user_can('edit_page', $contact_id)) { 
                                    return $contact_id;
                                } // end if
                            } // end if */
                            if (!zeroBSCRM_permsCustomers()){
                                return $contact_id;
                            }
                            /* - end security verification - */


                            if(!empty($_FILES['zbsc_file_'.$cfSubKey]['name']) && 
                                (!isset($zbsc_justUploadedCustomer) ||
                                    (isset($zbsc_justUploadedCustomer) && $zbsc_justUploadedCustomer != $_FILES['zbsc_file_'.$cfSubKey]['name'])
                                )
                                ) {

                                // Blocking repeat-upload bug
                                $zbsc_justUploadedCustomer = $_FILES['zbsc_file_'.$cfSubKey]['name'];
                            
                                // verify file extension and mime type
                                if ( jpcrm_file_check_mime_extension( $_FILES['zbsc_file_'.$cfSubKey] ) ){
                            
                                    $upload = wp_upload_bits($_FILES['zbsc_file_'.$cfSubKey]['name'], null, file_get_contents($_FILES['zbsc_file_'.$cfSubKey]['tmp_name']));

                                    if ( isset( $upload['error'] ) && $upload['error'] != 0 ) {
                                        wp_die('There was an error uploading your file. The error is: ' . esc_html( $upload['error'] ) );
                                    } else {
                                        //update_post_meta($contact_id, 'zbsc_file_'.$cfSubKey, $upload);

                                            // v2.13 - also privatise the file (move to our asset store)
                                            // $upload will have 'file' and 'url'
                                            $fileName = basename($upload['file']);
                                            $fileDir = dirname($upload['file']);
                                            $privateThatFile = zeroBSCRM_privatiseUploadedFile($fileDir,$fileName);
                                            if (is_array($privateThatFile) && isset($privateThatFile['file'])){ 

                                                // successfully moved to our store

                                                    // modify URL + file attributes
                                                    $upload['file'] = $privateThatFile['file'];
                                                    $upload['url'] = $privateThatFile['url'];

                                                    // add this extra identifier if in privatised sys
                                                    $upload['priv'] = true;

                                            } else {

                                                // couldn't move to store, leave in uploaded for now :)

                                            }


                                            // w mod - adds to array :)
                                            $zbsCustomerFiles = zeroBSCRM_getCustomerFiles($contact_id);

                                            if (is_array($zbsCustomerFiles)){

                                                //add it
                                                $zbsCustomerFiles[] = $upload;

                                            } else {

                                                // first
                                                $zbsCustomerFiles = array($upload);

                                            }

                                            ///update_post_meta($contact_id, 'zbs_customer_files', $zbsCustomerFiles);  
                                            zeroBSCRM_updateCustomerFiles($contact_id,$zbsCustomerFiles);                                            

                                            // AND associate with this 'slot'
                                            if ($zbs->isDAL2()){
                                                
                                                // DAL2
                                                // actually got wrappers now :) $zbs->updateMeta(ZBS_TYPE_CONTACT,$contact_id,'cfile_'.$cfSubKey,$upload['file']);
                                                // this'll override any prev in that slot, too
                                                zeroBSCRM_fileslots_addToSlot($cfSubKey,$upload['file'],$contact_id,ZBS_TYPE_CONTACT,true);        

                                            } else {

                                                // DAL1
                                                update_post_meta($contact_id,'cfile_'.$cfSubKey,$upload['file']);

                                            }

                                            // Fire any 'post-upload-processing' (e.g. CPP makes thumbnails of pdf, jpg, etc.)
                                            do_action('zbs_post_upload_contact',$upload);
                                    }
                                } else {
                                    wp_die("The file type that you've uploaded is not an accepted file format.");
                                }

                            } // if file

                        } /// / foreach


                    }

            return $contact;
        }
    }


/* ======================================================
  / Attach (custom) fileboxes to customer metabox
   ====================================================== */

/* ======================================================
  Attach files to customer metabox
   ====================================================== */


/* ======================================================
  Contact Files Metabox
   ====================================================== */
/*
function zeroBS__addCustomerMetaBoxes() {   
    add_meta_box('zerobs-customer-files', __('Contact Files',"zero-bs-crm"), 'zeroBS__MetaboxFilesOther', 'zerobs_customer', 'normal', 'low');  
}
add_action('add_meta_boxes', 'zeroBS__addCustomerMetaBoxes');  */

    class zeroBS__Metabox_ContactFiles extends zeroBS__Metabox{

        public function __construct( $plugin_file ) {

            // DAL3 switched for objType $this->postType = 'zerobs_customer';
            $this->objType = 'contact';
            $this->metaboxID = 'zerobs-customer-files';
            $this->metaboxTitle = __('Other Files',"zero-bs-crm");
            $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
            $this->metaboxArea = 'normal';
            $this->metaboxLocation = 'low';
            $this->capabilities = array(

                'can_hide'          => true, // can be hidden
                'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => true, // can be added as tab
                'can_minimise'      => true // can be minimised

            );

            // call this 
            $this->initMetabox();

        }

        public function html( $contact, $metabox ) {

                global $zbs;

                $html = '';

                // wmod

                        #} retrieve - shouldn't these vars be "other files"... confusing
                        $zbsFiles = false;
                        if (isset($contact['id'])) $zbsFiles = zeroBSCRM_getCustomerFiles($contact['id']);

                ?><table class="form-table wh-metatab wptbp" id="wptbpMetaBoxMainItemFiles">

                    <?php

                    #} Whole file delete method could do with rewrite
                    #} Also sort JS into something usable - should be ajax all this

                    #} Any existing
                    if (is_array($zbsFiles) && count($zbsFiles) > 0){ 
                      ?><tr class="wh-large zbsFileDetails"><th class="zbsFilesTitle"><label><?php echo '<span>'.count($zbsFiles).'</span> '.esc_html__('File(s)','zero-bs-crm').':'; ?></label></th>
                                <td id="zbsFileWrapOther">
                                    <table class="ui celled table" id="zbsFilesTable">
                                      <thead>
                                        <tr>
                                            <th><?php esc_html_e("File", 'zero-bs-crm');?></th>
                                            <th class="collapsing center aligned"><?php esc_html_e("Actions", 'zero-bs-crm');?></th>
                                        </tr>
                                    </thead><tbody>
                                                <?php $fileLineIndx = 1; foreach($zbsFiles as $zbsFile){

                                                    /* $file = basename($zbsFile['file']);

                                                    // if in privatised system, ignore first hash in name
                                                    if (isset($zbsFile['priv'])){

                                                        $file = substr($file,strpos($file, '-')+1);
                                                    } */
                                                    $file = zeroBSCRM_files_baseName($zbsFile['file'],isset($zbsFile['priv']));

                                                    $fileEditUrl = admin_url('admin.php?page='.$zbs->slugs['editfile']) . "&customer=".$contact['id']."&fileid=" . ($fileLineIndx-1);

                                                    echo '<tr class="zbsFileLineTR" id="zbsFileLineTRCustomer'. esc_attr( $fileLineIndx ) .'">';
                                                    echo '<td><div class="zbsFileLine" id="zbsFileLineCustomer'. esc_attr( $fileLineIndx ) .'"><a href="' . esc_url( $zbsFile['url'] ) . '" target="_blank">' . esc_html( $file ) . '</a></div>';

                                                    // if using portal.. state shown/hidden
                                                    // this is also shown in each file slot :) if you change any of it change that too
                                                    if(defined('ZBS_CLIENTPRO_TEMPLATES')){
                                                        if(isset($zbsFile['portal']) && $zbsFile['portal']){
                                                          echo "<p><i class='icon check circle green inverted'></i> ".esc_html__('Shown on Portal','zero-bs-crm').'</p>';
                                                        }else{
                                                          echo "<p><i class='icon ban inverted red'></i> ".esc_html__('Not shown on Portal','zero-bs-crm').'</p>';
                                                        }
                                                    }

                                                    echo '</td>';
                                                    echo '<td class="collapsing center aligned"><span class="zbsDelFile ui button basic" data-delurl="' . esc_attr( $zbsFile['url'] ) . '"><i class="trash alternate icon"></i> '.esc_html__('Delete','zero-bs-crm').'</span> <a href="' . esc_url( $fileEditUrl) . '" target="_blank" class="ui button basic"><i class="edit icon"></i> '.esc_html__('Edit','zero-bs-crm').'</a></td></tr>';
                                                    $fileLineIndx++;

                                                } ?>
                                    </tbody></table>
                                </td></tr><?php

                    } ?>

                    <?php #adapted from http://code.tutsplus.com/articles/attaching-files-to-your-posts-using-wordpress-custom-meta-boxes-part-1--wp-22291


                             
                            $html .= '<input type="file" id="zbsc_file_attachment" name="zbsc_file_attachment" size="25" class="zbs-dc">';
                            
                            ?><tr class="wh-large"><th><label><?php esc_html_e('Add File',"zero-bs-crm");?>:</label><br />(<?php esc_html_e('Optional',"zero-bs-crm");?>)<br /><?php esc_html_e('Accepted File Types',"zero-bs-crm");?>:<br /><?php echo esc_html( zeroBS_acceptableFileTypeListStr() ); ?></th>
                                <td><?php
                            wp_nonce_field(plugin_basename(__FILE__), 'zbsc_file_attachment_nonce');
                            echo $html;
                    ?></td></tr>

                
                </table>
                <?php

                   // PerfTest: zeroBSCRM_performanceTest_finishTimer('custmetabox');
                   // PerfTest: zeroBSCRM_performanceTest_debugOut();

                   ?>
                <script type="text/javascript">

                    var zbsCustomerCurrentlyDeleting = false;
                    var zbsMetaboxFilesLang = {

                        'error': '<?php echo esc_html( zeroBSCRM_slashOut(__('Error','zero-bs-crm')) ); ?>',
                        'unabletodelete': '<?php echo esc_html( zeroBSCRM_slashOut(__('Unable to delete this file.','zero-bs-crm')) ); ?>'
                    };

                    jQuery(function(){

                        jQuery('.zbsDelFile').on( 'click', function(){

                            if (!window.zbsCustomerCurrentlyDeleting){

                                // blocking
                                window.zbsCustomerCurrentlyDeleting = true;

                                var delUrl = jQuery(this).attr('data-delurl');
                                //var lineIDtoRemove = jQuery(this).closest('.zbsFileLine').attr('id');
                                var lineToRemove = jQuery(this).closest('tr');

                                if (typeof delUrl != "undefined" && delUrl != ''){



                                      // postbag!
                                      var data = {
                                        'action': 'delFile',
                                        'zbsfType': 'customer',
                                        'zbsDel':  delUrl, // could be csv, never used though
                                        'zbsCID': <?php if (!empty($contact['id']) && $contact['id'] > 0) echo esc_html( $contact['id'] ); else echo -1; ?>,
                                        'sec': window.zbscrmjs_secToken
                                      };

                                      // Send it Pat :D
                                      jQuery.ajax({
                                              type: "POST",
                                              url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
                                              "data": data,
                                              dataType: 'json',
                                              timeout: 20000,
                                              success: function(response) {

                                                var localLineToRemove = lineToRemove, localDelURL = delUrl;

                                                // visually remove
                                                jQuery(localLineToRemove).remove();

                                                // update number
                                                var newNumber = jQuery('#zbsFilesTable tr').length-1;
                                                if (newNumber > 0)
                                                    jQuery('#wptbpMetaBoxMainItemFiles .zbsFilesTitle span').html();
                                                else
                                                    jQuery('#wptbpMetaBoxMainItemFiles .zbsFileDetails').remove();


                                                // remove any filled slots (with this file) 
                                                jQuery('.zbsFileSlotTable').each(function(ind,ele){

                                                    if (jQuery(ele).attr('data-sloturl') == localDelURL){

                                                        jQuery('.zbsFileSlotWrap',jQuery(ele)).remove();
                                                
                                                    }

                                                });

                                                // file deletion errors, show msg:
                                                if (typeof response.errors != "undefined" && response.errors.length > 0){

                                                    jQuery.each(response.errors,function(ind,ele){

                                                        jQuery('#zerobs-customer-files-box').append('<div class="ui warning message" style="margin-top:10px;">' + ele + '</div>');

                                                    });
                                                         

                                                }


                                              },
                                              error: function(response){

                                                jQuery('#zerobs-customer-files-box').append('<div class="ui warning message" style="margin-top:10px;"><strong>' + window.zbsMetaboxFilesLang.error + ':</strong> ' + window.zbsMetaboxFilesLang.unabletodelete + '</div>');

                                              }

                                            });

                                }

                                window.zbsCustomerCurrentlyDeleting = false;

                            } // / blocking

                        });

                    });


                </script><?php

               // PerfTest: zeroBSCRM_performanceTest_finishTimer('other');


        }

        public function save_data( $contact_id, $contact ) {

            global $zbsc_justUploadedCustomer;


            if(!empty($_FILES['zbsc_file_attachment']['name']) && 
                (!isset($zbsc_justUploadedCustomer) ||
                    (isset($zbsc_justUploadedCustomer) && $zbsc_justUploadedCustomer != $_FILES['zbsc_file_attachment']['name'])
                )
                ) {


            /* --- security verification --- */
            if(!wp_verify_nonce($_POST['zbsc_file_attachment_nonce'], plugin_basename(__FILE__))) {
              return $id;
            } // end if


            if(defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
              return $id;
            } // end if
               
            /* Switched out for WH Perms model 19/02/16 
            if('page' == $_POST['post_type']) { 
              if(!current_user_can('edit_page', $id)) {
                return $id;
              } // end if
            } else { 
                if(!current_user_can('edit_page', $id)) { 
                    return $id;
                } // end if
            } // end if */
            if (!zeroBSCRM_permsCustomers()){
                return $contact_id;
            }
            /* - end security verification - */

                // Blocking repeat-upload bug
                $zbsc_justUploadedCustomer = $_FILES['zbsc_file_attachment']['name'];

                // verify file extension and mime type
                if ( jpcrm_file_check_mime_extension( $_FILES['zbsc_file_attachment'] ) ){

                    $upload = wp_upload_bits($_FILES['zbsc_file_attachment']['name'], null, file_get_contents($_FILES['zbsc_file_attachment']['tmp_name']));

                    if ( isset( $upload['error'] ) && $upload['error'] != 0 ) {
                        wp_die('There was an error uploading your file. The error is: ' . esc_html( $upload['error'] ) );
                    } else {
                        //update_post_meta($id, 'zbsc_file_attachment', $upload);

                            // v2.13 - also privatise the file (move to our asset store)
                            // $upload will have 'file' and 'url'
                            $fileName = basename($upload['file']);
                            $fileDir = dirname($upload['file']);
                            $privateThatFile = zeroBSCRM_privatiseUploadedFile($fileDir,$fileName);
                            if (is_array($privateThatFile) && isset($privateThatFile['file'])){ 

                                // successfully moved to our store

                                    // modify URL + file attributes
                                    $upload['file'] = $privateThatFile['file'];
                                    $upload['url'] = $privateThatFile['url'];

                                    // add this extra identifier if in privatised sys
                                    $upload['priv'] = true;

                            } else {

                                // couldn't move to store, leave in uploaded for now :)

                            }

                            // w mod - adds to array :)
                            $zbsCustomerFiles = zeroBSCRM_getCustomerFiles($contact_id);

                            if (is_array($zbsCustomerFiles)){

                                //add it
                                $zbsCustomerFiles[] = $upload;

                            } else {

                                // first
                                $zbsCustomerFiles = array($upload);

                            }

                            ///update_post_meta($id, 'zbs_customer_files', $zbsCustomerFiles);  
                            zeroBSCRM_updateCustomerFiles($contact_id,$zbsCustomerFiles);

                            // Fire any 'post-upload-processing' (e.g. CPP makes thumbnails of pdf, jpg, etc.)
                            do_action('zbs_post_upload_contact',$upload);
                    }
                } else {
                    wp_die("The file type that you've uploaded is not an accepted file format.");
                }
            }

            return $contact;
        }
    }


/* ======================================================
  / Attach files to customer metabox
   ====================================================== */


/* ======================================================
  Create Client Portal
   ====================================================== */

class zeroBS__Metabox_ContactPortal extends zeroBS__Metabox{

    public function __construct( $plugin_file, $metabox_screen = 'zbs-add-edit-contact-edit' ) {

        // DAL3 switched for objType $this->postType = 'zerobs_customer';
        $this->objType = 'contact';
        $this->metaboxID = 'zerobs-customer-portal';
        $this->metaboxTitle = __('Client Portal',"zero-bs-crm");
        $this->metaboxScreen = $metabox_screen; // we can use anything here as is now using our func
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

        // PerfTest: zeroBSCRM_performanceTest_startTimer('portal-draw');

        global $plugin_page, $zbs;
        $screen = get_current_screen();
        
        $wp_user_id = '';
        #} Rather than reload all the time :)
        global $zbsContactEditing; 

        #} retrieve
        //$zbsCustomer = get_post_meta($contact['id'], 'zbs_customer_meta', true);
        if (!isset($zbsContactEditing) && isset($contact['id'])){
            $zbsCustomer = zeroBS_getCustomer($contact['id'],false,false,false);
            $zbsContactEditing = $zbsCustomer;
        } else {
            $zbsCustomer = $zbsContactEditing;
        }


        if ( isset($zbsCustomer) && is_array($zbsCustomer) && isset($zbsCustomer['email']) ){

            //check customer link to see if it exists - wh moved to dal
            $wp_user_id = zeroBSCRM_getClientPortalUserID( $contact['id'] );

            /* nope
            if($wp_user_id == ''){
                $wp_user_id = email_exists( $zbsCustomer['email'] );
            } */
        }

        echo '<div class="waiting-togen">';

        // get user obj
        $user_object = get_userdata( $wp_user_id );

        if ( $user_object ){

            // a user already exists with this email

            echo '<div class="zbs-customerportal-activeuser">';

                esc_html_e('WordPress User Linked',"zero-bs-crm");
                echo ' #<span class="zbs-user-id">'. esc_html( $wp_user_id ) .'</span>:<br />';

                echo '<span class="ui label">'. esc_html( $user_object->user_email ) .'</span>';

                // wp admins get link
                if ( zeroBSCRM_isWPAdmin() ){
                    
                    $url = admin_url('user-edit.php?user_id='.$wp_user_id);
                    echo '<br /><a style="font-size: 12px;" href="'. esc_url( $url ) .'" target="_blank"><i class="wordpress simple icon"></i> '. esc_html__('View WordPress Profile','zero-bs-crm') .'</a>';

                }


            echo '</div>';
            
            // user ID will now have access to this area..
            echo '<hr /><div class="zbs-customerportal-activeuser-actions">';

                echo esc_html( __( 'Client Portal Access:', 'zero-bs-crm' ) );


                $customerPortalActive = true; if (zeroBSCRM_isCustomerPortalDisabled($contact['id'])) $customerPortalActive = false;
            
                if ( $customerPortalActive ) {

                    // revoke/disable access
                    echo ' <span class="ui green empty circular label"></span> <span class="zbs-portal-label">' . esc_html( __( 'Enabled', 'zero-bs-crm' ) ) . '</span>';

                    // wp admins get reset link, unless the crm contact is assigned to any other role than CRM Customer
                    if ( zeroBSCRM_isWPAdmin() && jpcrm_role_check( $user_object, array(), array(), array( 'zerobs_customer' ) ) ) {

                        echo '<div id="zbs-customerportal-access-actions" class="zbs-customerportal-activeuser">';

                        echo '<button type="button" id="zbs-customerportal-resetpw" class="ui mini button orange">' . esc_html( __( 'Reset Password', 'zero-bs-crm' ) ) . '</button>';

                        echo '<button type="button" id="zbs-customerportal-toggle" data-zbsportalaction="disable" class="ui mini button negative">' . esc_html( __( 'Disable Access', 'zero-bs-crm' ) ) . '</button>';

                        echo '</div>';

                    } else {

                        // explainer - rarely shown
						echo '<p style="font-size: 0.9em;margin-top: 0.5em;">' . esc_html__( 'The WordPress user has a role other than CRM Contact. They will need to reset their password via the WP login page.', 'zero-bs-crm' ) . '</p>';

                    }

                    echo '<hr /><div class="zbs-customerportal-activeuser-actions">';
                    echo sprintf( '<a target="_blank" href="%s" class="ui mini button green">%s</a>', esc_url( zeroBS_portal_link() ), esc_html( __( 'Preview Portal', 'zero-bs-crm' ) ) );
                    echo '</div>';
                } else {

                    // enable access
                    echo ' <span class="ui red empty circular label"></span> <span class="zbs-portal-label">' . esc_html( __( 'Disabled', 'zero-bs-crm' ) ) . '</span>';

                    // wp admins get enable link, unless the crm contact is assigned to any other role than CRM Customer
                    if ( zeroBSCRM_isWPAdmin() && jpcrm_role_check( $user_object, array(), array(), array( 'zerobs_customer' ) ) ) {

                        echo '<div id="zbs-customerportal-access-actions">';
                            echo '<button type="button" id="zbs-customerportal-toggle" data-zbsportalaction="enable" class="ui mini button positive">' . esc_html( __( 'Enable Access', 'zero-bs-crm' ) ) . '</button>';
                        echo '</div>';

                    }

                }

                echo '<input type="hidden" id="zbsportalaction-ajax-nonce" value="' . esc_attr( wp_create_nonce( 'zbsportalaction-ajax-nonce' ) ) . '" />';
            

            echo '</div>';

        } else if ( is_array($zbsCustomer) && isset($zbsCustomer['email']) && !empty($zbsCustomer['email'])){
            echo '<div class="no-gen" style="text-align:center">';
            echo esc_html( __( 'No WordPress User exists with this email', 'zero-bs-crm' ) );
            echo '<br/><br/>';
            echo '<div class="ui primary button button-primary wp-user-generate">';
            echo esc_html( __( 'Generate WordPress User', 'zero-bs-crm' ) );
            echo '</div>';
            echo '<input type="hidden" name="newwp-ajax-nonce" id="newwp-ajax-nonce" value="' . esc_attr( wp_create_nonce( 'newwp-ajax-nonce' ) ) . '" />';
            echo '</div>';
        }else{
            echo esc_html( __( 'Save your contact, or add an email to enable Client Portal functionality', 'zero-bs-crm' ) );
        }

	    echo '</div>';

        ?><script type="text/javascript">

            jQuery(function(){

                // bind activate/deactivate
                jQuery('#zbs-customerportal-toggle').off("click").on('click',function(e){

                    // action
                    var action = jQuery(this).attr('data-zbsportalaction');

                    // fire ajax
                    var t = {
                        action: "zbsPortalAction",
                        portalAction: action,
                        cid: <?php if (!empty($contact['id']) && $contact['id'] > 0) echo esc_html( $contact['id'] ); else echo -1; ?>,
                        security: jQuery( '#zbsportalaction-ajax-nonce' ).val()
                    }
                    i = jQuery.ajax({
                        url: ajaxurl,
                        type: "POST",
                        data: t,
                        dataType: "json"
                    });
                    i.done(function(e) {
                        //console.log(e);
                        if(typeof e.success != "undefined"){

                            // localise
                            var cAction = action;

                            if (action == 'enable'){

                                // switch label
                                jQuery('.ui.circular.label',jQuery('.zbs-customerportal-activeuser-actions')).removeClass('red').addClass('green');
                                jQuery('.zbs-portal-label',jQuery('.zbs-customerportal-activeuser-actions')).html('<?php echo esc_html( __( 'Enabled', 'zero-bs-crm' ) ); ?>');
                                jQuery('#zbs-customerportal-toggle').removeClass('positive').addClass('negative').html('<?php echo esc_html( __( 'Disable Access', 'zero-bs-crm' ) ); ?>').attr('data-zbsportalaction','disable');
                                

                            } else if (action == 'disable'){

                                // switch label
                                jQuery('.ui.circular.label',jQuery('.zbs-customerportal-activeuser-actions')).addClass('red').removeClass('green');
                                jQuery('.zbs-portal-label',jQuery('.zbs-customerportal-activeuser-actions')).html('<?php echo esc_html( __( 'Disabled', 'zero-bs-crm' ) ); ?>');
                                jQuery('#zbs-customerportal-toggle').removeClass('negative').addClass('positive').html('<?php echo esc_html( __( 'Enable Access', 'zero-bs-crm' ) ); ?>').attr('data-zbsportalaction','enable');
                                

                            }

                        }
                    }), i.fail(function(e) {
                        //error
                    });

                });

                // bind reset pw
                jQuery('#zbs-customerportal-resetpw').off("click").on('click',function(e){

                    // fire ajax
                    var t = {
                        action: "zbsPortalAction",
                        portalAction: 'resetpw',
                        cid: <?php if (!empty($contact['id']) && $contact['id'] > 0) echo esc_html( $contact['id'] ); else echo -1; ?>,
                        security: jQuery( '#zbsportalaction-ajax-nonce' ).val()
                    }
                    i = jQuery.ajax({
                        url: ajaxurl,
                        type: "POST",
                        data: t,
                        dataType: "json"
                    });
                    i.done(function(e) {
                        //console.log(e);
                        if(typeof e.success != "undefined"){

                            var newPassword =  '<?php zeroBSCRM_slashOut(esc_html__('Unknown',"zero-bs-crm")); ?>';
                            if (typeof e.pw != "undefined") newPassword = e.pw;

                            if ( newPassword !== false ){

                                // swal confirm
                                swal(
                                    '<?php zeroBSCRM_slashOut(esc_html__('Client Portal Password Reset',"zero-bs-crm")); ?>',
                                    '<?php zeroBSCRM_slashOut(esc_html__('Client Portal password has been reset for this contact, and they have been emailed with the new password. The new password is:',"zero-bs-crm")); ?><br /><span class="ui label">' + newPassword + '</span>',
                                    'info'
                                );

                            } else {

                                // swal confirm
                                swal(
                                    '<?php zeroBSCRM_slashOut(esc_html__('Client Portal Password Reset Error',"zero-bs-crm")); ?>',
                                    '<?php zeroBSCRM_slashOut(esc_html__('Error: Client Portal password has not been reset for this contact.',"zero-bs-crm")); ?>',
                                    'info'
                                );

                            }


                        }
                    }), i.fail(function(e) {
                        //error
                    });

                });


                // bind create
                jQuery('.wp-user-generate').off("click").on('click',function(e){
                    email = jQuery('#email').val();
                    customerid = <?php if (!empty($contact['id']) && $contact['id'] > 0) echo esc_html( $contact['id'] ); else echo -1; ?>;
                    if(email == ''){
                        alert("The email field is blank. Please fill in the email and save");
                        return false;
                    }
                    var t = {
                        action: "zbs_new_user",
                        email: email,
                        cid: customerid,
                        security: jQuery( '#newwp-ajax-nonce' ).val(),
                    }                    
                    i = jQuery.ajax({
                        url: ajaxurl,
                        type: "POST",
                        data: t,
                        dataType: "json"
                    });
                    i.done(function(e) {
                        console.log(e);
                        if(e.success){
                            jQuery('.zbs-user-id').html(e.user_id);
                            jQuery('.no-gen').remove();
                            jQuery('.waiting-togen').html('<div class="alert alert-success">Success: ' + e.message + '</div>');
                        } else {
                            jQuery('.no-gen').remove();
                            jQuery('.waiting-togen').html('<div class="alert alert-danger">Error: ' + e.message + '</div>');
                        }
                    }), i.fail(function(e) {
                        //error
                    });
                });

            });


        </script><?php

    // PerfTest: zeroBSCRM_performanceTest_finishTimer('portal-draw');
    // PerfTest: zeroBSCRM_performanceTest_finishTimer('portal');

    }
}



/* ======================================================
  / Create Client Portal
   ====================================================== */


/* ======================================================
  Create Social Box
   ====================================================== */

class zeroBS__Metabox_ContactSocial extends zeroBS__Metabox{


    public function __construct( $plugin_file ) {
    
        // DAL3 switched for objType $this->postType = 'zerobs_customer';
        $this->objType = 'contact';
        $this->metaboxID = 'zerobs-customer-social';
        $this->metaboxTitle = __('Social Profiles',"zero-bs-crm");
        $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
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

        global $plugin_page, $zbs;

        // declare + load existing
        global $zbsSocialAccountTypes;
        $zbsSocials = false;
        if (isset($contact['id'])) $zbsSocials = zeroBS_getCustomerSocialAccounts($contact['id']);
		
        if (count($zbsSocialAccountTypes) > 0) foreach ($zbsSocialAccountTypes as $socialKey => $socialAccType){

            ?><div class="zbs-social-acc <?php echo esc_attr( $socialAccType['slug'] ); ?>" title="<?php echo esc_attr( $socialAccType['name'] ); ?>">
                <?php if (is_array($zbsSocials) && isset($zbsSocials[$socialKey]) && !empty($zbsSocials[$socialKey])){ 

                    // got acc? link to it
                    $socialLink = zeroBSCRM_getSocialLink( $socialKey, $zbsSocials );

                    ?>
                    <a href="<?php echo esc_url( $socialLink ); ?>" target="_blank" title="<?php echo esc_attr__('View',"zero-bs-crm") . ' ' . esc_attr( $socialAccType['name'] ); ?>"><i class="fa <?php echo esc_attr( $socialAccType['fa'] ); ?>" aria-hidden="true"></i></a>
                <?php } else { ?>
                    <i class="fa <?php echo esc_attr( $socialAccType['fa'] ); ?>" aria-hidden="true"></i>
                <?php } ?>
                <input type="text" class="zbs-social-acc-input zbs-dc" title="<?php echo esc_attr( $socialAccType['name'] ); ?>" name="zbs-social-<?php echo esc_attr( $socialAccType['slug'] ); ?>" id="zbs-social-<?php echo esc_attr( $socialAccType['slug'] ); ?>" value="<?php if (is_array($zbsSocials) && isset($zbsSocials[$socialKey]) && !empty($zbsSocials[$socialKey])) echo esc_attr( $zbsSocials[$socialKey] ); ?>" placeholder="<?php echo esc_attr( $socialAccType['placeholder'] ); ?>" />
            </div><?php

        }

        // ++ get counts etc.

    }

    public function save_data( $contact_id, $contact ) {

            $zbsSocials = array();
        
            global $zbsSocialAccountTypes;
            foreach ($zbsSocialAccountTypes as $socialKey => $socialAccType){

                // set
                $zbsSocials[$socialKey] = false;

                // get from post if present
                if (isset($_POST['zbs-social-'.$socialAccType['slug']]) && !empty($_POST['zbs-social-'.$socialAccType['slug']])) $zbsSocials[$socialKey] = sanitize_text_field($_POST['zbs-social-'.$socialAccType['slug']]);

            }

            zeroBS_updateCustomerSocialAccounts($contact_id,$zbsSocials);
    

        return $contact;
    }
}



/* ======================================================
  / Create Social Box
   ====================================================== */

/* ======================================================
  Create AKA Box
   ====================================================== */

class zeroBS__Metabox_ContactAKA extends zeroBS__Metabox{


    public function __construct( $plugin_file ) {
    
        // DAL3 switched for objType $this->postType = 'zerobs_customer';
        $this->objType = 'contact';
        $this->metaboxID = 'zerobs-customer-aka';
        $this->metaboxTitle = __('Contact Aliases (AKA)',"zero-bs-crm");
        $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
        $this->metaboxArea = 'side';
        $this->metaboxLocation = 'low';
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

        global $plugin_page, $zbs;
        $screen = get_current_screen(); ?>
        <div class="ui active inverted dimmer" style="display:none" id="zbs-aka-alias-loader"></div>
        <?php

        #} Rather than reload all the time :)
        global $zbsContactEditing; 

        #} retrieve
        //$zbsCustomer = get_post_meta($contact['id'], 'zbs_customer_meta', true);
        if (!isset($zbsContactEditing) && isset($contact['id'])){
            $zbsCustomer = zeroBS_getCustomer($contact['id'],false,false,false);
            $zbsContactEditing = $zbsCustomer;
        } else {
            $zbsCustomer = $zbsContactEditing;
        }

        if (gettype($zbsCustomer) != "array"){
        

            // new cust, can't add till saved.
            ?><div class="ui message"><?php esc_html_e('You will not be able to add an alias until you\'ve saved this contact',"zero-bs-crm"); ?></div><?php

        } else {

            // customer saved, so proceed - aka mode

            // declare + load existing
            $customerAliases = zeroBS_getCustomerAliases($contact['id']);
            
            ?><div id="zbs-aka-alias-wrap"><?php

            // each alias: ID,aka_alias,aka_create,aka_lastupdated
            if (is_array($customerAliases) && count($customerAliases) > 0) foreach ($customerAliases as $alias){

                ?><div class="zbs-aka-alias" id="zbs-aka-alias-<?php echo esc_attr( $alias['ID'] ); ?>">
                    <div class="ui label"><?php echo esc_html( $alias['aka_alias'] ); ?> <button type="button" class="ui mini icon button negative zbs-aka-alias-remove" data-akaid="<?php echo esc_attr( $alias['ID'] ); ?>" title="<?php esc_attr_e('Remove Alias',"zero-bs-crm"); ?>"><i class="icon remove"></i></button></div>
                </div><?php            

            }

            ?></div><?php

            ?><div id="zbs-aka-alias-input-wrap">
                <input type="text" class="zbs-aka-alias-input" placeholder="<?php esc_attr_e('Add Alias.. e.g.', 'zero-bs-crm'); ?> mike2@domain.com" />
                <div class="ui pointing label" style="display:none;margin-bottom: 1em;margin-top: 0;" id="zbs-aka-alias-input-msg"><?php esc_html_e('Must be a valid email','zero-bs-crm'); ?></div>
                <button type="button" class="ui small button primary" id="zbs-aka-alias-add"><?php esc_html_e('Add Alias',"zero-bs-crm"); ?></button>
            </div>

            <script type="text/javascript">
            var zbsAliasAKABlocker = false;
            jQuery(function(){

                jQuery('.zbs-aka-alias-input').on( 'keydown', function(){
                            
                    // hide 'must be valid email'
                    jQuery('#zbs-aka-alias-input-msg').hide();

                });

                jQuery('#zbs-aka-alias-add').off('click').on( 'click', function(){

                    var v = jQuery('.zbs-aka-alias-input').val();
                    
                    if ( typeof v === 'string' ) {
                        v = v.trim();
                    }

                    // lazy check for now
                    if (v != "" && zbscrm_JS_validateEmail(v)){

                        // blocker
                        if (!window.zbsAliasAKABlocker){

                            // block
                            window.zbsAliasAKABlocker = true;
                            jQuery('#zbs-aka-alias-loader').show();

                                      // postbag!
                                      var data = {
                                        'action': 'addAlias',
                                        'cid': <?php if (!empty($contact['id']) && $contact['id'] > 0) echo esc_html( $contact['id'] ); else echo -1; ?>,
                                        'aka': v,
                                        'sec': window.zbscrmjs_secToken
                                      };

                                      // Send it Pat :D
                                      jQuery.ajax({
                                              type: "POST",
                                              url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
                                              "data": data,
                                              dataType: 'json',
                                              timeout: 20000,
                                              success: function(response) {

                                                if (typeof response.res != "undefined"){

                                                    //console.log('added:',response);

                                                    var id = response.res;
                                                    var alias = v;

                                                    var lineHTML = '<div class="zbs-aka-alias" id="zbs-aka-alias-' + id + '"><div class="ui label">' + alias + ' <button type="button" class=" ui mini icon button negative zbs-aka-alias-remove" data-akaid="' + id + '""><i class="icon remove"></i></button></div></div>';

                                                    // add to ui
                                                    jQuery('#zbs-aka-alias-wrap').append(lineHTML);

                                                    // empty this
                                                    jQuery('.zbs-aka-alias-input').val('');

                                                    // bind
                                                    setTimeout(function(){

                                                        zeroBSJS_bindAKAMode();

                                                    },0);

                                                    //unblock
                                                    window.zbsAliasAKABlocker = false;
                                                    jQuery('#zbs-aka-alias-loader').hide();

                                                } else {

                                                    if (typeof response.fail != "undefined"){

                                                        if (response.fail == 'existing'){

                                                            // already in use err
                                                            swal(
                                                                '<?php esc_html_e('Error',"zero-bs-crm"); ?>',
                                                                '<?php esc_html_e('This Alias is already in use by another contact.',"zero-bs-crm"); ?>',
                                                                'warning'
                                                            );

                                                        }

                                                    } else {

                                                        // general err
                                                        swal(
                                                            '<?php esc_html_e('Error',"zero-bs-crm"); ?>',
                                                            '<?php esc_html_e('There was an error adding this alias',"zero-bs-crm"); ?>',
                                                            'warning'
                                                        );

                                                    }
                                                    //unblock
                                                    window.zbsAliasAKABlocker = false;
                                                    jQuery('#zbs-aka-alias-loader').hide();
                                                }

                                              },
                                              error: function(response){

                                                    // err
                                                    swal(
                                                        '<?php esc_html_e('Error',"zero-bs-crm"); ?>',
                                                        '<?php esc_html_e('There was an error adding this alias',"zero-bs-crm"); ?>',
                                                        'warning'
                                                    );
                                                    //unblock
                                                    window.zbsAliasAKABlocker = false;
                                                    jQuery('#zbs-aka-alias-loader').hide();

                                              }

                                            });


                        } // / blocker

                    } // / if not empty 
                    else {

                        // not valid email, showxxx
                        jQuery('#zbs-aka-alias-input-msg').show();



                        // hide after 2s
                        setTimeout(function(){
                            jQuery('#zbs-aka-alias-input-msg').hide();
                        },2000);

                    }

                });

                
                // other bind
                zeroBSJS_bindAKAMode();


            });
    
            function zeroBSJS_bindAKAMode(){

                // hover over
                jQuery('.zbs-aka-alias').on( 'mouseenter', function () {
                    jQuery(this).addClass("hovering");
                }).on( 'mouseleave', function () {
                    jQuery(this).removeClass("hovering");
                });

                // remoe aka
                jQuery('.zbs-aka-alias-remove').off('click').on( 'click', function(){

                    // blocker
                    if (!window.zbsAliasAKABlocker){

                        // block
                        window.zbsAliasAKABlocker = true;
                        jQuery('#zbs-aka-alias-loader').show();

                        // get id
                        var akaID = jQuery(this).attr('data-akaid');

                        if (akaID > 0){


                              // postbag!
                              var data = {
                                'action': 'removeAlias',
                                'cid': <?php if (!empty($contact['id']) && $contact['id'] > 0) echo esc_html( $contact['id'] ); else echo -1; ?>,
                                'akaid': akaID,
                                'sec': window.zbscrmjs_secToken
                              };

                              // Send it Pat :D
                              jQuery.ajax({
                                      type: "POST",
                                      url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
                                      "data": data,
                                      dataType: 'json',
                                      timeout: 20000,
                                      success: function(response) {

                                        if (typeof response.res != "undefined"){

                                            console.log('removed:',response);

                                            var lID = akaID;

                                            // remove from ui
                                            jQuery('#zbs-aka-alias-' + lID).remove();

                                            //unblock
                                            window.zbsAliasAKABlocker = false;
                                            jQuery('#zbs-aka-alias-loader').hide();

                                        } else {

                                            // err
                                            swal(
                                                '<?php esc_html_e('Error',"zero-bs-crm"); ?>',
                                                '<?php esc_html_e('There was an error removing this alias',"zero-bs-crm"); ?>',
                                                'warning'
                                            );
                                            //unblock
                                            window.zbsAliasAKABlocker = false;
                                            jQuery('#zbs-aka-alias-loader').hide();
                                        }

                                      },
                                      error: function(response){

                                            // err
                                            swal(
                                                '<?php esc_html_e('Error',"zero-bs-crm"); ?>',
                                                '<?php esc_html_e('There was an error removing this alias',"zero-bs-crm"); ?>',
                                                'warning'
                                            );
                                            //unblock
                                            window.zbsAliasAKABlocker = false;
                                            jQuery('#zbs-aka-alias-loader').hide();

                                      }

                                    });


                        } // / akai id present

                    }

                });
            }

            </script>
            <?php

        } // / if cust defined

    }

}

/* ======================================================
  / Create AKA Box
   ====================================================== */


/* ======================================================
  Create Tags Box
   ====================================================== */

class zeroBS__Metabox_ContactTags extends zeroBS__Metabox_Tags{


    public function __construct( $plugin_file ) {
    
        $this->objTypeID = ZBS_TYPE_CONTACT;
        // DAL3 switched for objType $this->postType = 'zerobs_customer';
        $this->objType = 'contact';
        $this->metaboxID = 'zerobs-customer-tags';
        $this->metaboxTitle = __('Contact Tags',"zero-bs-crm");
        $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
        $this->metaboxArea = 'side';
        $this->metaboxLocation = 'high';
        $this->showSuggestions = true;
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

    // html + save dealt with by parent class :) 

}

/* ======================================================
  / Create Tags Box
   ====================================================== */

/* ======================================================
  Create Logs Box
   ====================================================== */

class zeroBS__Metabox_ContactLogs extends zeroBS__Metabox_LogsV2{


    public function __construct( $plugin_file ) {
    
        $this->objtypeid = 1; // until db2 ZBS_TYPE_CONTACT;
        // DAL3 switched for objType $this->postType = 'zerobs_customer';
        $this->objType = 'contact';
        $this->metaboxID = 'zerobs-customer-logs';
        $this->metaboxTitle = __('Activity Log',"zero-bs-crm");
        $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
        $this->metaboxArea = 'normal';
        $this->metaboxLocation = 'high';
        $this->capabilities = array(

            'can_hide'          => true, // can be hidden
            'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
            'can_accept_tabs'   => true,  // can/can't accept tabs onto it
            'can_become_tab'    => true, // can be added as tab
            'can_minimise'      => true, // can be minimised
            'hide_on_new'       => true // no point in adding logs while adding contact, add after creation :)

        );

        // call this 
        $this->initMetabox();

    }

    // html + save dealt with by parent class :) 

}

/* ======================================================
  / Create Logs Box
   ====================================================== */



/* ======================================================
  "Contacts at Company" Metabox
   ====================================================== */

class zeroBS__Metabox_ContactCompany extends zeroBS__Metabox{


    public function __construct( $plugin_file ) {

        # (language switch)
        $companyOrOrg = zeroBSCRM_getSetting('coororg');
        $companyLabel = jpcrm_label_company();
    
        // DAL3 switched for objType $this->postType = 'zerobs_customer';
        $this->objType = 'contact';
        $this->metaboxID = 'zerobs-customer-company';
        $this->metaboxTitle = __($companyLabel, "zero-bs-crm");
        $this->metaboxScreen = 'zbs-add-edit-contact-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
        $this->metaboxArea = 'side';
        $this->metaboxLocation = 'core';
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

        global $plugin_page, $zbs;

        // PerfTest: zeroBSCRM_performanceTest_startTimer('companydropdown');

        # (language switch)
        $companyOrOrg = zeroBSCRM_getSetting('coororg');
        $companyLabel = jpcrm_label_company();

        #} Typeahead instead
        echo "<div id='zbscompnew'>";
        echo "<span>" . esc_html( sprintf( __( 'Type to assign %s', 'zero-bs-crm' ), jpcrm_label_company() ) ) . '</span>';

        #} Co Name Default
        $coName = ''; $coID = '';
        if ( 'contact' == $this->objType ){
            $coID = -1; if (is_array($contact) && isset($contact['id'])) $coID = zeroBS_getCustomerCompanyID($contact['id']);
            if (!empty($coID)){
                $co = zeroBS_getCompany($coID);

                // 3.0
                if (isset($co) && isset($co['name'])) $coName = $co['name'];

                // < 3.0
                if (isset($co) && isset($co['meta']) && isset($co['meta']['coname'])) $coName = $co['meta']['coname'];

                if (empty($coName) && isset($co['coname'])) $coName = $co['coname'];
                
            }
        }
    
        #} Output

        if ( get_option('permalink_structure') == '' ){
            echo "<div class='ui message red'>" . esc_html__('You are using Plain Permalinks. Please set your permalinks to %postname% by visiting ','zero-bs-crm') . "<a href='" . esc_url( admin_url('options-permalink.php') )."'>".esc_html__('here','zero-bs-crm')."</a></div>"; 
        }else{
            echo zeroBSCRM_CompanyTypeList('zbscrmjs_customer_setCompany',$coName,true,'zbscrmjs_customer_changedCompany'); 
        }
        #} Hidden input (real input) & Callback func
        ?><input type="hidden" name="zbs_company" id="zbs_company" value="<?php echo esc_attr( $coID ); ?>" />
        <script type="text/javascript">

        // custom fuction to copy company details from typeahead company deets
        function zbscrmjs_customer_setCompany(obj){

            if (typeof obj.id != "undefined"){

                // set vals
                jQuery("#zbs_company").val(obj.id);

                // set dirty
                zbscrm_JS_addDirty('zbs-company');

            } 

        }

        // custom fuction to copy company details from typeahead company deets
        // this one fires on any change, but here we're just using to catch empties :)
        // in fact, this one now overrides above^ 
        function zbscrmjs_customer_changedCompany(newval){

            if (typeof newval == "undefined" || newval == ''){

                // set vals
                jQuery("#zbs_company").val('');

                // set dirty
                zbscrm_JS_addDirty('zbs-company');

            }

        }

        </script>

    
        </div><?php


        // PerfTest: zeroBSCRM_performanceTest_finishTimer('companydropdown');
    }

    public function save_data( $contact_id, $contact ) {
    

        return $contact;
    }
}

/* DEPRECATED! */
function zbsCustomer_companyDropdown( $default = '', $companies = array() ) {

    echo 'zbsCustomer_companyDropdown is Deprecated!<br />';

  foreach ($companies as $co){
    echo "\n\t" . '<option value="'. esc_attr( $co['id'] ) .'"';
    if ($co['id'] == $default) echo ' selected="selected"';
    //echo '>'.$co['meta']['coname'].'</option>';
    $coName = '';
    if (isset($co) && isset($co['meta']) && isset($co['meta']['coname'])) $coName = $co['meta']['coname'];
    # Shouldn't need this? WH attempted fix for caching, not here tho..
    if (empty($coName) && isset($co['coname'])) $coName = $co['coname'];
    if (empty($coName)) $coName = jpcrm_label_company().' #'.$co['id'];
    echo '>'. esc_html( $coName ) .'</option>';
  }

}

/* ======================================================
  / "Contacts at Company" Metabox Related Funcs
   ====================================================== */

                        
                        
/* ======================================================
  Contact Activity Metabox
   ====================================================== */
class zeroBS__Metabox_Contact_Activity extends zeroBS__Metabox {

    public function __construct( $plugin_file ) {
    
        $this->postType = 'zerobs_customer';
        $this->metaboxID = 'zbs-contact-activity-metabox';
        $this->metaboxTitle = __('Activity', 'zero-bs-crm');
        $this->metaboxIcon = 'heartbeat';
        $this->metaboxScreen = 'zbs-view-contact'; // we can use anything here as is now using our func
        $this->metaboxArea = 'side';
        $this->metaboxLocation = 'high';

        // call this 
        $this->initMetabox();

    }

    public function html( $obj, $metabox ) {
            
            global $zbs, $zeroBSCRM_logTypes; 
            
            $objid = -1; if (is_array($obj) && isset($obj['id'])) $objid = $obj['id'];

            // output any pinned logs
            $pinned_logs = $zbs->DAL->logs->getLogsForObj(array(

                    'objtype' => ZBS_TYPE_CONTACT,
                    'objid' => $objid,
                    'only_pinned'  => true,
                    'incMeta'   => true,
                    'sortByField'   => 'zbsl_created',
                    'sortOrder'     => 'DESC',
                    'page'          => -1,
                    'perPage'       => -1,
                    'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT )

                ));

            if ( is_array( $pinned_logs ) && count( $pinned_logs ) > 0 ){

                $pinned_log_count = 0;

                echo '<h4 style="text-align:right" class="ui top attached header" id="jpcrm-pinned-logs-header">' . esc_attr__( 'Pinned Logs', 'zero-bs-crm' ) . '</h4>';
                echo '<div class="jpcrm-pinned-logs ui green attached segment">';
                foreach ( $pinned_logs as $log ){

                    if (is_array($log) && isset($log['created'])){

                        if ( $pinned_log_count > 0 ){

                            ?><div class="ui divider"></div><?php

                        }
                        
                        echo '<div class="jpcrm-pinned-log">';

                            // ico?
                            $ico = ''; $logKey = strtolower(str_replace(' ','_',str_replace(':','_',$log['type'])));
                            if (isset($zeroBSCRM_logTypes['zerobs_customer'][$logKey])) $ico = $zeroBSCRM_logTypes['zerobs_customer'][$logKey]['ico'];
                            // these are FA ico's at this point

                            // compile this first, so can catch default (empty types)
                            $logTitle = '';
                            if (!empty($ico)) $logTitle .= '<i class="fa '.$ico.'"></i> '; 
                             // DAL 2 saves type as permalinked
                            if (isset($zeroBSCRM_logTypes['zerobs_customer'][$logKey]))  $logTitle .= __($zeroBSCRM_logTypes['zerobs_customer'][$logKey]['label'],"zero-bs-crm");
                            
                            ?>

                            <?php 
                            // short desc
                            if (isset($log['shortdesc']) && !empty($log['shortdesc'])){ ?>
                            <h4 class="jpcrm-pinned-log-shortdesc">
                                <?php echo $logTitle . ' | ' . esc_html( $log['shortdesc'] ); ?>
                            </h4>
                            <?php } ?>

                            <?php
                            // long desc
                            if (isset($log['longdesc']) && !empty($log['longdesc'])){ ?>
                            <div class="jpcrm-pinned-log-longdesc">
                                <?php echo wp_kses( html_entity_decode( $log['longdesc'], ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 ), $zbs->acceptable_restricted_html ); ?>
                            </div>
                            <?php } ?>

                            <div class="jpcrm-pinned-log-author-date-meta">
                            <?php
                                $meta_string = '';
                                if ( !empty( $log['author'] ) ) {
                                    $meta_string = $log['author'];
                                }
                                if ( !empty($log['createduts'] ) && $log['createduts'] > 0 ) {
                                    if ( !empty( $meta_string ) ){
                                        $meta_string .= ' &mdash; ';
                                    }
                                    $meta_string .= jpcrm_uts_to_date_str( $log['createduts'] );
                                }

                                echo esc_html( $meta_string );

                            ?></div>

                        </div><?php

                        $pinned_log_count++;

                    }
                }

                ?></div><?php

            }


            // normal activity output
            echo '<div class="zbs-activity">';
                echo '<div class="">';
                    $zbsCustomerActivity = zeroBSCRM_getContactLogs($objid,true,100,0,'',false);
                    zeroBSCRM_html_contactTimeline($objid,$zbsCustomerActivity,$obj);
                echo '</div>';
             echo '</div>';

    }

    // nothing to save here.
    public function save_data( $objID, $obj ) {
        return $obj;
    }
}


/* ======================================================
  / Contact Activity Metabox
   ====================================================== */
