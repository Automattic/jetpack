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

   function zeroBSCRM_CompaniesMetaboxSetup(){

        // main deets
        $zeroBS__Metabox_Company = new zeroBS__Metabox_Company( __FILE__ );

        // Actions (Save + status)
        $zeroBS__Metabox_CompanyActions = new zeroBS__Metabox_CompanyActions( __FILE__ );

        // contacts
        $zeroBS__Metabox_CompanyContacts = new zeroBS__Metabox_CompanyContacts( __FILE__ );

        // Tags
        $zeroBS__Metabox_CompanyTags = new zeroBS__Metabox_CompanyTags( __FILE__ );

        // files
        $zeroBS__Metabox_CompanyFiles = new zeroBS__Metabox_CompanyFiles( __FILE__ );

        // external sources
        $zeroBS__Metabox_ExtSource = new zeroBS__Metabox_ExtSource( __FILE__, 'company','zbs-add-edit-company-edit');

        #} Activity box on view page
        if(zeroBSCRM_is_company_view_page()){
            $zeroBS__Metabox_Company_Activity = new zeroBS__Metabox_Company_Activity( __FILE__ );
        }

        #} Ownership
        if (zeroBSCRM_getSetting('perusercustomers') == "1") $zeroBS__CoMetabox_Ownership = new zeroBS__Metabox_Ownership( __FILE__, ZBS_TYPE_COMPANY);

        
   }

   add_action( 'admin_init','zeroBSCRM_CompaniesMetaboxSetup');


/* ======================================================
   / Init Func
   ====================================================== */

/* ======================================================
  Company Metabox
   ====================================================== */

    class zeroBS__Metabox_Company extends zeroBS__Metabox{ 
        
        // this is for catching 'new' companys
        private $newRecordNeedsRedir = false;

        private $coOrgLabel = '';

        public function __construct( $plugin_file ) {

            // oldschool.
            $this->coOrgLabel = jpcrm_label_company();

            // set these
            $this->objType = 'company';
            $this->metaboxID = 'zerobs-company-edit';
            $this->metaboxTitle = $this->coOrgLabel.' '.__('Details','zero-bs-crm');
            $this->metaboxScreen = 'zbs-add-edit-company-edit';
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

        public function html( $company, $metabox ) {

                global $zbs;

                // localise ID
                $companyID = -1; if (is_array($company) && isset($company['id'])) $companyID = (int)$company['id'];

               // PerfTest: zeroBSCRM_performanceTest_startTimer('custmetabox-dataget');

                #} Rather than reload all the time :)
                global $zbsCompanyEditing; 

                if (!isset($zbsCompanyEditing)){
                    $zbsCompany = zeroBS_getCompany($companyID,false);
                    $zbsCompanyEditing = $zbsCompany;
                } else {
                    $zbsCompany = $zbsCompanyEditing;
                }

					global $zbsCompanyFields; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					$fields               = $zbsCompanyFields; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					$show_id              = (int) $zbs->settings->get( 'showid' );
					$fields_to_hide       = $zbs->settings->get( 'fieldhides' );
					$show_addresses       = (int) $zbs->settings->get( 'showaddress' );
					$show_second_address  = (int) $zbs->settings->get( 'secondaddress' );
					$show_country_fields  = $zbs->settings->get( 'countries' );
					$second_address_label = $zbs->settings->get( 'secondaddresslabel' );
                if ( empty( $second_address_label ) ) {
                  $second_address_label = __( 'Second Address', 'zero-bs-crm' );
                }
            ?>
                <script type="text/javascript">var zbscrmjs_secToken = '<?php echo esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ); ?>';</script>

                <?php #} Pass this if it's a new customer (for internal automator) - note added this above with DEFINE for simpler.

                    if (gettype($zbsCompany) != "array") echo '<input type="hidden" name="zbscrm_newcompany" value="1" />';

                ?>
			<div>
				<div class="jpcrm-form-grid" id="wptbpMetaBoxMainItem">

                    <?php #} WH Hacky quick addition for MVP 
                    # ... further hacked

				if ( $show_id === 1 && $companyID > 0 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					?>
							<div class="jpcrm-form-group">
								<label class="jpcrm-form-label"><?php echo esc_html( $this->coOrgLabel ) . ' '; esc_html_e( 'ID', 'zero-bs-crm' ); // phpcs:ignore Generic.Formatting.DisallowMultipleStatements.SameLine, WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase, Squiz.PHP.EmbeddedPhp.MultipleStatements ?>:</label>
								<b>#<?php echo isset( $companyID ) ? esc_html( $companyID ) : ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase ?></b>
							</div>
							<div class="jpcrm-form-group">
							</div>
                    <?php } ?>

					<?php
					global $zbsFieldsEnabled; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					if ( $show_second_address === 1 ) {
						$zbsFieldsEnabled['secondaddress'] = true; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					}
					$field_group = '';

					foreach ( $fields as $field_key => $field_value ) {
						$show_field = ! isset( $field_value['opt'] ) || isset( $zbsFieldsEnabled[ $field_value['opt'] ] ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						$show_field = isset( $fields_to_hide['company'] )
							&& is_array( $fields_to_hide['company'] )
							&& in_array( $field_key, $fields_to_hide['company'] ) // phpcs:ignore WordPress.PHP.StrictInArray.MissingTrueStrict
							? false
							: $show_field;
						$show_field = isset( $field_value[0] )
							&& 'selectcountry' === $field_value[0]
							&& 0 === $show_country_fields
							? false
							: $show_field;

						if ( isset( $field_value['area'] ) && $field_value['area'] !== '' ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							if ( $show_addresses !== 1 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
								continue;
							} elseif ( $field_group === '' ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
								echo '<div class="jpcrm-form-grid" style="padding:0px;grid-template-columns: 1fr;">';
								echo '<div class="jpcrm-form-group"><label>';
								echo esc_html__( $field_value['area'], 'zero-bs-crm' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase, WordPress.WP.I18n.NonSingularStringLiteralText
								echo '</label></div>';
							} elseif ( $field_group !== $field_value['area'] ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
								echo '</div>';
								echo '<div class="jpcrm-form-grid" style="padding:0px;grid-template-columns: 1fr;">';
								echo '<div class="jpcrm-form-group"><label>';
								echo $show_field ? esc_html( $second_address_label ) : '';
								echo '</label></div>';
							}
							$field_group = $field_value['area']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase, WordPress.WP.I18n.NonSingularStringLiteralText
						}

						if ( $field_group !== '' && ( ! isset( $field_value['area'] ) || $field_value['area'] === '' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							$field_group = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							echo '</div>';
							echo '<div class="jpcrm-form-group jpcrm-form-group-span-2">&nbsp;</div>';
						}

						if ( $show_field ) {
							if ( isset( $field_value[0] ) ) {
								if ( $field_group === 'Second Address' ) {
									$field_value[1] = str_replace( ' (' . $second_address_label . ')', '', $field_value[1] );
								}
								zeroBSCRM_html_editField( $zbsCompany, $field_key, $field_value, 'zbsco_' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							}
						}
					}
					?>
				</div>
			</div>


            <script type="text/javascript">

                jQuery(function(){

                    zbscrm_JS_bindFieldValidators();

                });


            </script><?php

            // PerfTest: zeroBSCRM_performanceTest_finishTimer('custmetabox-draw');
        }

        public function save_data( $company_id, $company ) {

            if (!defined('ZBS_CO_SAVED')){

                // debug if (get_current_user_id() == 12) echo 'FIRING<br>';
                define('ZBS_CO_SAVED',1);

                // DAL3.0+
                global $zbs;

                // check this
                if (empty($company_id) || $company_id < 1)  $company_id = -1;

                // retrieve data in format
                //... by using zeroBS_buildCompanyMeta, custom fields are 'dealt with' automatically
                $dataArr = zeroBS_buildCompanyMeta($_POST);

                // Use the tag-class function to retrieve any tags so we can add inline.
                // Save tags against objid
                $dataArr['tags'] = zeroBSCRM_tags_retrieveFromPostBag(true,ZBS_TYPE_COMPANY); 
 
                // owner - saved here now, rather than ownership box, to allow for pre-hook update. (as tags)
                $owner = -1; if (isset($_POST['zerobscrm-owner'])){

                    // should this have perms check to see if user can actually assign to? or should that be DAL?
                    $potentialOwner = (int)sanitize_text_field( $_POST['zerobscrm-owner'] );
                    if ($potentialOwner > 0) $owner = $potentialOwner;

                }

                /* debug 
                echo '_POST:<pre>'.print_r($_POST,1).'</pre>';
                echo 'dataArr:<pre>'.print_r($dataArr,1).'</pre>'; exit();
                */

                // now we check whether a user with this email already exists (separate to this company id), so we can warn them
                // ... that it wont have changed the email
                if (isset($dataArr['email']) && !empty($dataArr['email'])){

                    $potentialID = zeroBS_getCompanyIDWithEmail($dataArr['email']);

                    if (!empty($potentialID) && $potentialID != $company_id){

                        // no go.
                        $this->updateEmailDupeMessage($potentialID);

                        // unset email change (leave as was)
                        $dataArr['email'] = zeroBS_companyEmail($company_id);

                    }

                }

                #AVATARSAVE - save any avatar change if changed :)
                if (isset($_POST['zbs-company-avatar-custom-url']) && !empty($_POST['zbs-company-avatar-custom-url'])) $dataArr['avatar'] = sanitize_text_field( $_POST['zbs-company-avatar-custom-url'] );

                    // Stripslashes
                    // This avoids us adding `O\'toole ltd' into the db. see #1107
                    // ...this is more sensitive than using zeroBSCRM_stripSlashesFromArr
                    // in the long term it may make more sense to stripslashes pre insert/update in the DAL  
                    // in the case of companies, there are no core fields which will be broken by stripslashes at this time (4.0.11)
                    $data_array = $dataArr;
                    foreach ($dataArr as $key => $val){

                        // op strings
                        $value = $val;
                        if ( is_string( $value ) ) $value = stripslashes( $value );
                        
                        // pass into final array
                        $data_array[$key] = $value;

                    }

                    // add update directly
                    $addUpdateReturn = $zbs->DAL->companies->addUpdateCompany(array(

                            'id'    => $company_id,
                            'owner' => $owner,
                            'data'  => $data_array,
                            'limitedFields' => -1,

                    ));

                    // Note: For NEW contacts, we make sure a global is set here, that other update funcs can catch 
                    // ... so it's essential this one runs first!
                    // this is managed in the metabox Class :)
                    if ($company_id == -1 && !empty($addUpdateReturn) && $addUpdateReturn != -1) {
                        
                        $company_id = $addUpdateReturn;
                        global $zbsJustInsertedMetaboxID; $zbsJustInsertedMetaboxID = $company_id;

                        // set this so it redirs
                        $this->newRecordNeedsRedir = true;
                    }

                    // success?
                    if ($addUpdateReturn != -1 && $addUpdateReturn > 0){

                        // Update Msg
                        // this adds an update message which'll go out ahead of any content
                        // This adds to metabox: $this->updateMessages['update'] = zeroBSCRM_UI2_messageHTML('info olive mini zbs-not-urgent',__('Contact Updated',"zero-bs-crm"),'','address book outline','contactUpdated');
                        // This adds to edit page
                        $this->updateMessage( $this->newRecordNeedsRedir );

                        // catch any non-critical messages
                        $nonCriticalMessages = $zbs->DAL->getErrors(ZBS_TYPE_COMPANY);
                        if (is_array($nonCriticalMessages) && count($nonCriticalMessages) > 0) $this->dalNoticeMessage($nonCriticalMessages);

                    } else {

                        // fail somehow
                        $failMessages = $zbs->DAL->getErrors(ZBS_TYPE_COMPANY);

                        // show msg (retrieved from DAL err stack)
                        if (is_array($failMessages) && count($failMessages) > 0)
                            $this->dalErrorMessage($failMessages);
                        else
                            $this->dalErrorMessage(array(__('Insert/Update Failed with general error','zero-bs-crm')));

                        // pass the pre-fill:
                        global $zbsObjDataPrefill; $zbsObjDataPrefill = $dataArr;

            
                    }

            }

            return $company;
        }

        // This catches 'new' contacts + redirs to right url
        public function post_save_data($objID,$obj){

            if ($this->newRecordNeedsRedir){

                global $zbs, $zbsJustInsertedMetaboxID;
                if (!empty($zbsJustInsertedMetaboxID) && $zbsJustInsertedMetaboxID > 0){

                    // redir
                    $zbs->new_record_edit_redirect( $this->objType, $zbsJustInsertedMetaboxID );

                }

            }

        }

        public function updateMessage( $created = false ) {
            $message = $this->coOrgLabel . ' ' . ( $created ? __( 'Created', 'zero-bs-crm' ) : __( 'Updated', 'zero-bs-crm' ) );
            // zbs-not-urgent means it'll auto hide after 1.5s
            $msg = zeroBSCRM_UI2_messageHTML('info olive mini zbs-not-urgent', $message,'','address book outline','companyUpdated');

            // quick + dirty
            global $zbs;

            $zbs->pageMessages[] = $msg;

        }

        public function updateEmailDupeMessage($otherCompanyID=-1){

            global $zbs;

            $viewHTML = ' <a href="'.jpcrm_esc_link('view',$otherCompanyID,$this->objType).'" target="_blank">'.__('View','zero-bs-crm').' '.$this->coOrgLabel.'</a>';

            $msg = zeroBSCRM_UI2_messageHTML('info orange mini',__('Email could not be updated. (A record already exists with this email address).',"zero-bs-crm").$viewHTML,'','address book outline','companyNotUpdated');

            $zbs->pageMessages[] = $msg;

        }
    }


/* ======================================================
  / Company Metabox
   ====================================================== */


/* ======================================================
  "Contacts at Company" Metabox
   ====================================================== */

class zeroBS__Metabox_CompanyContacts extends zeroBS__Metabox{

    private $coOrgLabel = '';

    public function __construct( $plugin_file ) {

        // oldschool.
        $this->coOrgLabel = jpcrm_label_company();
    
        $this->objType = 'company';
        $this->metaboxID = 'zerobs-company-contacts';
        $this->metaboxTitle = __('Associated Contacts',"zero-bs-crm");
        $this->metaboxScreen = 'zbs-add-edit-company-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
        $this->metaboxArea = 'normal';
        $this->metaboxLocation = 'high';
        $this->headless = false;
        //$this->metaboxClasses = '';
        $this->capabilities = array(

            'can_hide'          => false, // can be hidden
            'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
            'can_accept_tabs'   => false,  // can/can't accept tabs onto it
            'can_become_tab'    => false, // can be added as tab
            'can_minimise'      => false, // can be minimised
            'can_move'          => false // can be moved

        );

            
        // hide if "new" (not edit) - as can't yet add this way
        $isEdit = false;
        if (isset($_GET['action']) && $_GET['action'] == 'edit' && isset($_GET['zbsid']) && !empty($_GET['zbsid'])) $isEdit = true;
        
        if ($isEdit){
            // call this 
            $this->initMetabox();
        }

    }

    public function html( $company, $metabox ) {

            global $zbs;

            $coID = -1; if (is_array($company) && isset($company['id'])) $coID = (int)$company['id'];

            //$contacts = zeroBS_getCustomers(true,1000,0,false,false,'',false,false,$coID);        
            $contacts = array();
            if ($coID > 0){
                $contacts = $zbs->DAL->contacts->getContacts(array(

                        'inCompany' => $coID,

                        'sortByField'   => 'ID',
                        'sortOrder'     => 'ASC',
                        'page'          => 0,
                        'perPage'       => 200,
                        'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)

                ));
            }


            #} JUST OUTPUT

            ?><table class="form-table wh-metatab wptbp" id="wptbpMetaBoxMainItemContacts">

                <tr class="wh-large"><th>
                    <?php
                        if (count($contacts) > 0){
                            echo '<div id="zbs-co-contacts" class="ui cards">';

                            foreach ($contacts as $contact){

                                #} new view link
                                $contactUrl = jpcrm_esc_link('view',$contact['id'],'zerobs_customer');

                                #} Name
                                $contactName = zeroBS_customerName($contact['id'],$contact,false,false);
                                $contactFirstName = ''; if (isset($contact['fname'])) $contactFirstName = $contact['fname'];

                                #} Description
                                $contactDesc = '<i class="calendar alternate outline icon"></i>' . __('Contact since',"zero-bs-crm").' '.zeroBSCRM_date_i18n(zeroBSCRM_getDateFormat(), $contact['createduts'], true, false);
                                if (isset($contact['email']) && !empty($contact['email'])) $contactDesc .= '<br /><a href="'.$contactUrl.'" target="_blank">'.$contact['email'].'</a>';

                                ?><div class="card">
                                  <div class="content">
                                    <div class="center aligned header"><?php echo '<a href="'.esc_attr($contactUrl).'">'.esc_html($contactName).'</a>'; ?></div>
                                    <?php if (!empty($contactDesc)){ ?>
                                    <div class="center aligned description">
                                      <p><?php echo $contactDesc; ?></p>
                                    </div>
                                    <?php } ?>
                                  </div>
                                  <div class="extra content">
                                    <div class="center aligned author">
                                      <?php
                                            #} Img or ico 
                                            echo zeroBS_getCustomerIcoHTML($contact['id'],'ui avatar image').' '. esc_html( $contactFirstName );
                                        ?>
                                    </div>
                                  </div>
                                </div><?php
                            }


                            echo '</div>';

                        } else {

                            echo '<div style="margin-left:auto;margin-right:auto;display:inline-block">';
                            esc_html_e('No contacts found at',"zero-bs-crm"); echo ' ' . esc_html( $this->coOrgLabel );
                            echo '</div>';

                        }

                    ?>
                </th></tr>
                
            </table>

            <script type="text/javascript">

                jQuery(function(){

                });

            </script>
             


            <?php

    }

    public function save_data( $companyID, $company ) {    

        // none as of yet

        return $company;
    }
}



/* ======================================================
  / "Contacts at Company" Metabox
   ====================================================== */

/* ======================================================
  Create Tags Box
   ====================================================== */

class zeroBS__Metabox_CompanyTags extends zeroBS__Metabox_Tags{


    public function __construct( $plugin_file ) {
    
        $this->objTypeID = ZBS_TYPE_COMPANY;
        $this->objType = 'company';
        $this->metaboxID = 'zerobs-company-tags';
        $this->metaboxTitle = __(jpcrm_label_company().' Tags',"zero-bs-crm");
        $this->metaboxScreen = 'zbs-add-edit-company-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
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
  Attach files to company metabox
   ====================================================== */

    class zeroBS__Metabox_CompanyFiles extends zeroBS__Metabox{

        public function __construct( $plugin_file ) {

            $this->objType = 'company';
            $this->metaboxID = 'zerobs-company-files';
            $this->metaboxTitle = __('Files',"zero-bs-crm");
            $this->metaboxScreen = 'zbs-add-edit-company-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
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

        public function html( $company, $metabox ) {

                global $zbs;

                $html = '';
                $companyID = -1; if (is_array($company) && isset($company['id'])) $companyID = (int)$company['id'];
                $zbsFiles = zeroBSCRM_files_getFiles('company',$companyID);

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

                                                    $fileEditUrl = admin_url('admin.php?page='.$zbs->slugs['editfile']) . "&company=".$companyID."&fileid=" . ($fileLineIndx-1);

                                                    echo '<tr class="zbsFileLineTR" id="zbsFileLineTRCustomer'.esc_attr($fileLineIndx).'">';
                                                    echo '<td><div class="zbsFileLine" id="zbsFileLineCustomer'.esc_attr($fileLineIndx).'"><a href="' . esc_url( $zbsFile['url'] ) . '" target="_blank">' . esc_html( $file ) . '</a></div>';

                                                    // if using portal.. state shown/hidden
                                                    // this is also shown in each file slot :) if you change any of it change that too
                                                    /*if(defined('ZBS_CLIENTPRO_TEMPLATES')){
                                                        if(isset($zbsFile['portal']) && $zbsFile['portal']){
                                                          echo "<p><i class='icon check circle green inverted'></i> ".__('Shown on Portal','zero-bs-crm').'</p>';
                                                        }else{
                                                          echo "<p><i class='icon ban inverted red'></i> ".__('Not shown on Portal','zero-bs-crm').'</p>';
                                                        }
                                                    }*/

                                                    echo '</td>';
                                                    echo '<td class="collapsing center aligned"><span class="zbsDelFile ui button basic" data-delurl="' . esc_attr( $zbsFile['url'] ) . '"><i class="trash alternate icon"></i> '.esc_html__('Delete','zero-bs-crm').'</span></td></tr>'; // <a href="'.$fileEditUrl.'" target="_blank" class="ui button basic"><i class="edit icon"></i> '.__('Edit','zero-bs-crm').'</a>
                                                    $fileLineIndx++;

                                                } ?>
                                    </tbody></table>
                                </td></tr><?php

                    } ?>

                    <?php #adapted from http://code.tutsplus.com/articles/attaching-files-to-your-posts-using-wordpress-custom-meta-boxes-part-1--wp-22291

                             
                            $html .= '<input type="file" id="zbs_file_attachment" name="zbs_file_attachment" size="25" class="zbs-dc">';
                            
                            ?><tr class="wh-large"><th><label><?php esc_html_e('Add File',"zero-bs-crm");?>:</label><br />(<?php esc_html_e('Optional',"zero-bs-crm");?>)<br /><?php esc_html_e('Accepted File Types',"zero-bs-crm");?>:<br /><?php echo esc_html( zeroBS_acceptableFileTypeListStr() ); ?></th>
                                <td><?php
                            wp_nonce_field(plugin_basename(__FILE__), 'zbs_file_attachment_nonce');
                            echo $html;
                    ?></td></tr>

                
                </table>
                <?php

                   // PerfTest: zeroBSCRM_performanceTest_finishTimer('custmetabox');
                   // PerfTest: zeroBSCRM_performanceTest_debugOut();

                   ?>
                <script type="text/javascript">

                    var zbsCurrentlyDeleting = false;
                    var zbsMetaboxFilesLang = {

                        'error': '<?php echo esc_html( zeroBSCRM_slashOut(__('Error','zero-bs-crm')) ); ?>',
                        'unabletodelete': '<?php echo esc_html( zeroBSCRM_slashOut(__('Unable to delete this file.','zero-bs-crm')) ); ?>'
                    };

                    jQuery(function(){

                        jQuery('.zbsDelFile').on( 'click', function(){

                            if (!window.zbsCurrentlyDeleting){

                                // blocking
                                window.zbsCurrentlyDeleting = true;

                                var delUrl = jQuery(this).attr('data-delurl');
                                //var lineIDtoRemove = jQuery(this).closest('.zbsFileLine').attr('id');
                                var lineToRemove = jQuery(this).closest('tr');

                                if (typeof delUrl != "undefined" && delUrl != ''){



                                      // postbag!
                                      var data = {
                                        'action': 'delFile',
                                        'zbsfType': '<?php echo esc_html( $this->objType ); ?>',
                                        'zbsDel':  delUrl, // could be csv, never used though
                                        'zbsCID': <?php echo esc_html( $companyID ); ?>,
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
                                                //jQuery(this).closest('.zbsFileLine').remove();
                                                //jQuery('#' + lineIDtoRemove).remove();
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

                                                        jQuery('#zerobs-company-files-box').append('<div class="ui warning message" style="margin-top:10px;">' + ele + '</div>');

                                                    });
                                                         

                                                }

                                              },
                                              error: function(response){

                                                jQuery('#zerobs-company-files-box').append('<div class="ui warning message" style="margin-top:10px;"><strong>' + window.zbsMetaboxFilesLang.error + ':</strong> ' + window.zbsMetaboxFilesLang.unabletodelete + '</div>');

                                              }

                                            });

                                }

                                window.zbsCurrentlyDeleting = false;

                            } // / blocking

                        });

                    });


                </script><?php

               // PerfTest: zeroBSCRM_performanceTest_finishTimer('other');


        }

        public function save_data( $companyID, $company ) {

            global $zbs, $zbsc_justUploadedFile;


            if(!empty($_FILES['zbs_file_attachment']['name']) && 
                (!isset($zbsc_justUploadedFile) ||
                    (isset($zbsc_justUploadedFile) && $zbsc_justUploadedFile != $_FILES['zbs_file_attachment']['name'])
                )
                ) {


                /* --- security verification --- */
                if(!wp_verify_nonce($_POST['zbs_file_attachment_nonce'], plugin_basename(__FILE__))) {
                  return $id;
                } // end if


                if(defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
                  return $id;
                } // end if
                   
                if (!zeroBSCRM_permsCustomers()){
                    return $companyID;
                }
                /* - end security verification - */

                #} Blocking repeat-upload bug
                $zbsc_justUploadedFile = $_FILES['zbs_file_attachment']['name'];

                // verify file extension and mime type
                if ( jpcrm_file_check_mime_extension( $_FILES['zbs_file_attachment'] ) ){

                    $company_dir_info = jpcrm_storage_dir_info_for_company( $companyID );
                    $upload           = jpcrm_save_admin_upload_to_folder( 'zbs_file_attachment', $company_dir_info['files'] );

                    if(isset($upload['error']) && $upload['error'] != 0) {
                        wp_die('There was an error uploading your file. The error is: ' . esc_html( $upload['error'] ));
                    } else {
                            // w mod - adds to array :)
                            $zbsCompanyFiles = zeroBSCRM_files_getFiles('company',$companyID);//zeroBSCRM_getCustomerFiles($companyID);

                            if (is_array($zbsCompanyFiles)){

                                //add it
                                $zbsCompanyFiles[] = $upload;

                            } else {

                                // first
                                $zbsCompanyFiles = array($upload);

                            }

                            // update
                            zeroBSCRM_files_updateFiles('company',$companyID,$zbsCompanyFiles);

                            // Fire any 'post-upload-processing' (e.g. CPP makes thumbnails of pdf, jpg, etc.)
                            do_action('zbs_post_upload_company',$upload);
                    }
                } else {
                    wp_die("The file type that you've uploaded is not an accepted file format.");
                }
            }

            return $company;
        }
    }


/* ======================================================
  / Attach files to company metabox
   ====================================================== */


/* ======================================================
    Company Actions Metabox Metabox
   ====================================================== */

    class zeroBS__Metabox_CompanyActions extends zeroBS__Metabox{ 

        private $coOrgLabel = '';

        public function __construct( $plugin_file ) {

            // oldschool.
            $this->coOrgLabel = jpcrm_label_company();

            // set these
            $this->objType = 'company';
            $this->metaboxID = 'zerobs-company-actions';
            $this->metaboxTitle = jpcrm_label_company().' '.__('Actions','zero-bs-crm'); // will be headless anyhow
            $this->headless = true;
            $this->metaboxScreen = 'zbs-add-edit-company-edit';
            $this->metaboxArea = 'side';
            $this->metaboxLocation = 'high';
            $this->saveOrder = 1;
            $this->capabilities = array(

                'can_hide'          => false, // can be hidden
                'areas'             => array('side'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => false, // can be added as tab
                'can_minimise'      => true, // can be minimised
                'can_move'          => true // can be moved

            );

            // call this 
            $this->initMetabox();

        }

        public function html( $company, $metabox ) {

            ?><div class="zbs-generic-save-wrap">

                    <div class="ui medium dividing header"><i class="save icon"></i> <?php echo esc_html( jpcrm_label_company() ); ?> <?php esc_html_e('Actions','zero-bs-crm'); ?></div>

            <?php

            // localise ID & content
            $companyID = -1; if (is_array($company) && isset($company['id'])) $companyID = (int)$company['id'];

                #} if a saved post...
                //if (isset($post->post_status) && $post->post_status != "auto-draft"){
                if ($companyID > 0){ // existing

                    ?>

                    <div class="zbs-company-actions-bottom zbs-objedit-actions-bottom">

								<button  class="ui button black" type="button" id="zbs-edit-save"><?php esc_html_e( 'Update', 'zero-bs-crm' ); ?> <?php echo esc_html( $this->coOrgLabel ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase ?></button>

                        <?php

                            // delete?

                         // for now just check if can modify, later better, granular perms.
                         if ( zeroBSCRM_permsQuotes() ) { 
                        ?><div id="zbs-company-actions-delete" class="zbs-objedit-actions-delete">
                             <a class="submitdelete deletion" href="<?php echo jpcrm_esc_link( 'delete', $companyID, 'company' ); ?>"><?php esc_html_e('Delete Permanently', "zero-bs-crm"); ?></a>
                        </div>
                        <?php } // can delete  ?>
                        
                        <div class='clear'></div>

                    </div>
                <?php


                } else {

                    // NEW quote ?>

                    <div class="zbs-company-actions-bottom zbs-objedit-actions-bottom">
                        
							<button class="ui button black" type="button" id="zbs-edit-save"><?php esc_html_e( 'Save', 'zero-bs-crm' ); ?> <?php echo esc_html( $this->coOrgLabel ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase ?></button>

                    </div>

                 <?php

                }

            ?></div><?php // / .zbs-generic-save-wrap
              
        } // html

        // saved via main metabox
    }


/* ======================================================
  / Company Actions Metabox
   ====================================================== */

/* ======================================================
  Company Activity Metabox
   ====================================================== */
class zeroBS__Metabox_Company_Activity extends zeroBS__Metabox {

    public function __construct( $plugin_file ) {
    
        $this->metaboxID = 'zbs-company-activity-metabox';
        $this->metaboxTitle = __('Activity', 'zero-bs-crm');
        $this->metaboxIcon = 'heartbeat';
        $this->metaboxScreen = 'zerobs_view_company'; // we can use anything here as is now using our func
        $this->metaboxArea = 'side';
        $this->metaboxLocation = 'high';

        // call this 
        $this->initMetabox();

    }

    public function html( $obj, $metabox ) {
            
            global $zbs; 
            
            $objid = -1; if (is_array($obj) && isset($obj['id'])) $objid = $obj['id'];
            
            // no need for this, $obj will already be same $zbsCustomer = zeroBS_getCustomer($objid, true,true,true);
            
            echo '<div class="zbs-activity">';
                echo '<div class="">';
                    $zbsCompanyActivity = zeroBSCRM_getCompanyLogs($objid,true,100,0,'',false);
                    zeroBSCRM_html_companyTimeline($objid,$zbsCompanyActivity,$obj);
                echo '</div>';
             echo '</div>';

    }

    // nothing to save here.
    public function save_data( $objID, $obj ) {
        return $obj;
    }
}


/* ======================================================
  Company Activity Metabox
   ====================================================== */
