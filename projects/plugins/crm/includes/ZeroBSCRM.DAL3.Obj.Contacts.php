<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0+
 *
 * Copyright 2020 Automattic
 *
 * Date: 14/01/19
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

use Automattic\Jetpack\CRM\Event_Manager\Events_Manager;

/**
* ZBS DAL >> Contacts
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_contacts extends zbsDAL_ObjectLayer {

    protected $objectType = ZBS_TYPE_CONTACT;
    protected $objectDBPrefix = 'zbsc_';
    protected $objectIncludesAddresses = true;
    protected $include_in_templating = true;
	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase, Squiz.Commenting.VariableComment.Missing -- to be refactored.
	protected $objectModel = array();

	/** @var Events_Manager To manage the CRM events */
	private $events_manager;

        // hardtyped list of types this object type is commonly linked to
        protected $linkedToObjectTypes = array(

            ZBS_TYPE_COMPANY

        );

		// phpcs:ignore Squiz.Commenting.FunctionComment.Missing, Squiz.Scope.MethodScope.Missing -- to be refactored.
		function __construct( $args = array() ) {
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- to be refactored.
			$this->objectModel = array(
				// ID
				'ID'            => array(
					'fieldname' => 'ID',
					'format'    => 'int',
				),
				// site + team generics
				'zbs_site'      => array(
					'fieldname' => 'zbs_site',
					'format'    => 'int',
				),
				'zbs_team'      => array(
					'fieldname' => 'zbs_team',
					'format'    => 'int',
				),
				'zbs_owner'     => array(
					'fieldname' => 'zbs_owner',
					'format'    => 'int',
				),
				// other fields
				'status'        => array(
					// db model:
					'fieldname'             => 'zbsc_status',
					'format'                => 'str',
					// output model
					'input_type'            => 'select',
					'label'                 => __( 'Status', 'zero-bs-crm' ),
					'placeholder'           => '',
					'options'               => array( 'Lead', 'Customer', 'Refused', 'Blacklisted' ),
					'essential'             => true,
					'max_len'               => 100,
					'do_not_show_on_portal' => true,
				),
				'email'         => array(
					// db model:
					'fieldname'             => 'zbsc_email',
					'format'                => 'str',
					// output model
					'input_type'            => 'email',
					'label'                 => __( 'Email', 'zero-bs-crm' ),
					'placeholder'           => 'e.g. john@gmail.com',
					'essential'             => true,
					'force_unique'          => true, // must be unique. This is required and breaking if true
					'can_be_blank'          => true,
					'max_len'               => 200,
					// removed due to some users using mobile/other as unique field? see #gh-153
					// 'not_empty' => true,
					'do_not_show_on_portal' => true,
				),
				'prefix'        => array(
					// db model:
					'fieldname'   => 'zbsc_prefix',
					'format'      => 'str',
					// output model
					'input_type'  => 'select',
					'label'       => __( 'Prefix', 'zero-bs-crm' ),
					'placeholder' => '',
					'options'     => array( 'Mr', 'Mrs', 'Ms', 'Miss', 'Mx', 'Dr', 'Prof', 'Mr & Mrs' ),
					'essential'   => true,
					'max_len'     => 30,
				),
				'fname'         => array(
					// db model:
					'fieldname'   => 'zbsc_fname',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'First Name', 'zero-bs-crm' ),
					'placeholder' => 'e.g. John',
					'essential'   => true,
					'max_len'     => 100,
				),
				'lname'         => array(
					// db model:
					'fieldname'   => 'zbsc_lname',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'Last Name', 'zero-bs-crm' ),
					'placeholder' => 'e.g. Doe',
					'essential'   => true,
					'max_len'     => 100,
				),

				'addr1'         => array(
					// db model:
					'fieldname'   => 'zbsc_addr1',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'Address Line 1', 'zero-bs-crm' ),
					'placeholder' => '',
					'area'        => 'Main Address',
					'migrate'     => 'addresses',
					'max_len'     => 200,
				),
				'addr2'         => array(
					// db model:
					'fieldname'   => 'zbsc_addr2',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'Address Line 2', 'zero-bs-crm' ),
					'placeholder' => '',
					'area'        => 'Main Address',
					'migrate'     => 'addresses',
					'max_len'     => 200,
				),
				'city'          => array(
					// db model:
					'fieldname'   => 'zbsc_city',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'City', 'zero-bs-crm' ),
					'placeholder' => 'e.g. New York',
					'area'        => 'Main Address',
					'migrate'     => 'addresses',
					'max_len'     => 100,
				),
				'county'        => array(
					// db model:
					'fieldname'   => 'zbsc_county',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'County', 'zero-bs-crm' ),
					'placeholder' => 'e.g. Kings County',
					'area'        => 'Main Address',
					'migrate'     => 'addresses',
					'max_len'     => 200,
				),
				'postcode'      => array(
					// db model:
					'fieldname'   => 'zbsc_postcode',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'Post Code', 'zero-bs-crm' ),
					'placeholder' => 'e.g. 10019',
					'area'        => 'Main Address',
					'migrate'     => 'addresses',
					'max_len'     => 50,
				),
				'country'       => array(
					// db model:
					'fieldname'   => 'zbsc_country',
					'format'      => 'str',
					// output model
					'input_type'  => 'selectcountry',
					'label'       => __( 'Country', 'zero-bs-crm' ),
					'placeholder' => '',
					'area'        => 'Main Address',
					'migrate'     => 'addresses',
					'max_len'     => 200,
				),
				'secaddr1'      => array(
					// db model:
					'fieldname'   => 'zbsc_addr1',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'Address Line 1', 'zero-bs-crm' ),
					'placeholder' => '',
					'area'        => 'Second Address',
					'migrate'     => 'addresses',
					'opt'         => 'secondaddress',
					'max_len'     => 200,
					'dal1key'     => 'secaddr_addr1', // previous field name
				),
				'secaddr2'      => array(
					// db model:
					'fieldname'   => 'zbsc_addr2',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'Address Line 2', 'zero-bs-crm' ),
					'placeholder' => '',
					'area'        => 'Second Address',
					'migrate'     => 'addresses',
					'opt'         => 'secondaddress',
					'max_len'     => 200,
					'dal1key'     => 'secaddr_addr2', // previous field name
				),
				'seccity'       => array(
					// db model:
					'fieldname'   => 'zbsc_city',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'City', 'zero-bs-crm' ),
					'placeholder' => 'e.g. Los Angeles',
					'area'        => 'Second Address',
					'migrate'     => 'addresses',
					'opt'         => 'secondaddress',
					'max_len'     => 100,
					'dal1key'     => 'secaddr_city', // previous field name
				),
				'seccounty'     => array(
					// db model:
					'fieldname'   => 'zbsc_county',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'County', 'zero-bs-crm' ),
					'placeholder' => 'e.g. Los Angeles',
					'area'        => 'Second Address',
					'migrate'     => 'addresses',
					'opt'         => 'secondaddress',
					'max_len'     => 200,
					'dal1key'     => 'secaddr_county', // previous field name
				),
				'secpostcode'   => array(
					// db model:
					'fieldname'   => 'zbsc_postcode',
					'format'      => 'str',
					// output model
					'input_type'  => 'text',
					'label'       => __( 'Post Code', 'zero-bs-crm' ),
					'placeholder' => 'e.g. 90001',
					'area'        => 'Second Address',
					'migrate'     => 'addresses',
					'opt'         => 'secondaddress',
					'max_len'     => 50,
					'dal1key'     => 'secaddr_postcode', // previous field name
				),
				'seccountry'    => array(
					// db model:
					'fieldname'   => 'zbsc_country',
					'format'      => 'str',
					// output model
					'input_type'  => 'selectcountry',
					'label'       => __( 'Country', 'zero-bs-crm' ),
					'placeholder' => '',
					'area'        => 'Second Address',
					'migrate'     => 'addresses',
					'opt'         => 'secondaddress',
					'max_len'     => 200,
					'dal1key'     => 'secaddr_country', // previous field name
				),
				'hometel'       => array(
					// db model:
					'fieldname'   => 'zbsc_hometel',
					'format'      => 'str',
					// output model
					'input_type'  => 'tel',
					'label'       => __( 'Home Telephone', 'zero-bs-crm' ),
					'placeholder' => 'e.g. 877 2733049',
					'max_len'     => 40,
				),
				'worktel'       => array(
					// db model:
					'fieldname'   => 'zbsc_worktel',
					'format'      => 'str',
					// output model
					'input_type'  => 'tel',
					'label'       => __( 'Work Telephone', 'zero-bs-crm' ),
					'placeholder' => 'e.g. 877 2733049',
					'max_len'     => 40,
				),
				'mobtel'        => array(
					// db model:
					'fieldname'   => 'zbsc_mobtel',
					'format'      => 'str',
					// output model
					'input_type'  => 'tel',
					'label'       => __( 'Mobile Telephone', 'zero-bs-crm' ),
					'placeholder' => 'e.g. 877 2733050',
					'max_len'     => 40,
				),

				// ... just removed for DAL3 :) should be custom field anyway by this point

				'wpid'          => array(
					// db model:
					'fieldname' => 'zbsc_wpid',
					'format'    => 'int',
					// output model
					// NONE, not exposed via standard input
				),
				'avatar'        => array(
					// db model:
					'fieldname' => 'zbsc_avatar',
					'format'    => 'str',
					// output model
					// NONE, not exposed via standard input
				),
				'tw'            => array(
					// db model:
					'fieldname' => 'zbsc_tw',
					'format'    => 'str',
					'max_len'   => 100,
					// output model
					// NONE, not exposed via standard input
				),
				'li'            => array(
					// db model:
					'fieldname' => 'zbsc_li',
					'format'    => 'str',
					'max_len'   => 300,
					// output model
					// NONE, not exposed via standard input
				),
				'fb'            => array(
					// db model:
					'fieldname' => 'zbsc_fb',
					'format'    => 'str',
					'max_len'   => 200,
					// output model
					// NONE, not exposed via standard input
				),
				'created'       => array(
					// db model:
					'fieldname' => 'zbsc_created',
					'format'    => 'uts',
					// output model
					// NONE, not exposed via db
				),
				'lastupdated'   => array(
					// db model:
					'fieldname' => 'zbsc_lastupdated',
					'format'    => 'uts',
					// output model
					// NONE, not exposed via db
				),
				'lastcontacted' => array(
					// db model:
					'fieldname' => 'zbsc_lastcontacted',
					'format'    => 'uts',
					// output model
					// NONE, not exposed via db
				),
			);

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            //'tag' => false,

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

			$this->events_manager = new Events_Manager();

    }

    // generic get Company (by ID)
    // Super simplistic wrapper used by edit page etc. (generically called via dal->contacts->getSingle etc.)
    public function getSingle($ID=-1){

        return $this->getContact($ID);

    }

    // generic get contact (by ID list)
    // Super simplistic wrapper used by MVP Export v3.0
    public function getIDList($IDs=false){

        return $this->getContacts(array(
            'inArr'             => $IDs,
            'withCustomFields'  => true,
            'withValues'        => true,
            'withAssigned'      => true,
            'page'          => -1,
            'perPage'       => -1
        ));

    }
    
    // generic get (EVERYTHING)
    // expect heavy load!
    public function getAll($IDs=false){

        return $this->getContacts(array(
            'withCustomFields'  => true,
            'withValues'        => true,
            'withAssigned'      => true,
            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    // generic get count of (EVERYTHING)
    public function getFullCount(){

        return $this->getContacts(array(
            'count'  => true,
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    /* 
    * Returns an (int) count of all contacts with an external source
    */
    public function getTotalExtSourceCount(){

        global $ZBSCRM_t,$wpdb; 

        $query = "SELECT COUNT(contacts.id) FROM " . $ZBSCRM_t['contacts'] . " contacts"
            . " INNER JOIN " . $ZBSCRM_t['externalsources'] . " ext_sources"
            . " ON contacts.id = ext_sources.zbss_objid"
            . " WHERE ext_sources.zbss_objtype = " . ZBS_TYPE_CONTACT;

        /*
        SELECT COUNT(contacts.id) FROM 
        wp_zbs_contacts contacts
        INNER JOIN wp_zbs_externalsources ext_sources
        ON contacts.id = ext_sources.zbss_objid
        WHERE ext_sources.zbss_objtype = 1
        */

        return $wpdb->get_var( $query );

    }

    /**
     * returns full contact line +- details
     * Replaces many funcs, inc zeroBS_getCustomerIDFromWPID, zeroBS_getCustomerIDWithEmail etc.
     *
     * @param int id        contact id
     * @param array $args   Associative array of arguments
     *                      withQuotes, withInvoices, withTransactions, withLogs
     *
     * @return array result
     */
    public function getContact($id=-1,$args=array()){

        global $zbs;

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            'email'             => false, // if id -1 and email given, will return based on email search
            'WPID'              => false, // if id -1 and wpid given, will return based on wpid search

            // if theset wo passed, will search based on these 
            'externalSource'    => false,
            'externalSourceUID' => false,

            // with what?
            'withCustomFields'  => true,
            'withQuotes'        => false,
            'withInvoices'      => false,
            'withTransactions'  => false,
            'withTasks'         => false,
            'withLogs'          => false,
            'withLastLog'       => false,
            'withTags'          => false,
            'withCompanies'     => false,
            'withOwner'         => false,
            'withValues'        => false, // if passed, returns with 'total' 'invoices_total' 'transactions_total' etc. (requires getting all obj, use sparingly)
            'withAliases'       => false,
            'withExternalSources' => false,
            'withExternalSourcesGrouped' => false,

            'with_obj_limit'      => false, // if (int) specified, this will limit the count of quotes, invoices, transactions, and tasks returned

            // permissions
            'ignoreowner'   =>  zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT), // this'll let you not-check the owner of obj

            // returns scalar ID of line
            'onlyID'        => false,

            'fields'        => false // false = *, array = fieldnames

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        #} Check ID
        $id = (int)$id;
        if (
            (!empty($id) && $id > 0)
            ||
            (!empty($WPID) && $WPID > 0)
            ||
            (!empty($email))
            ||
            (!empty($externalSource) && !empty($externalSourceUID))
            ){

            global $ZBSCRM_t,$wpdb; 
            $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array(); $extraSelect = '';


            #} ============= PRE-QUERY ============

                #} Custom Fields
                if ($withCustomFields && !$onlyID){
                    
                    #} Retrieve any cf
                    $custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_CONTACT));

                    #} Cycle through + build into query
                    if (is_array($custFields)) foreach ($custFields as $cK => $cF){

                        // add as subquery
                        $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = contact.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) '".$cK."'";
                        
                        // add params
                        $params[] = $cK; $params[] = ZBS_TYPE_CONTACT;

                    }

                }

                #} Aliases
                if ($withAliases){

                    #} Retrieve these as a CSV :)
                    $extraSelect .= ",(SELECT GROUP_CONCAT(aka_alias SEPARATOR ',') FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_CONTACT." AND aka_id = contact.ID) aliases";

                }

                // Add any addr custom fields for addr1+addr2
                $addrCustomFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_ADDRESS));
                if ($withCustomFields && !$onlyID && is_array($addrCustomFields) && count($addrCustomFields) > 0){

                    foreach ($addrCustomFields as $cK => $cF){

                        // custom field key
                        $cfKey = 'addr_'.$cK;
                        $cfKey2 = 'secaddr_'.$cK;

                        // address custom field (e.g. 'house name') it'll be passed here as 'house-name'
                        // ... problem is mysql does not like that :) so we have to chage here:
                        // in this case we prepend address cf's with addr_ and we switch - for _
                        $cKey = 'addrcf_'.str_replace('-','_',$cK);
                        $cKey2 = 'secaddrcf_'.str_replace('-','_',$cK);

                        // addr 1
                            // add as subquery
                            $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = contact.ID AND zbscf_objkey = %s AND zbscf_objtype = %d) ".$cKey;                        
                            // add params
                            $params[] = $cfKey; $params[] = ZBS_TYPE_CONTACT;
                        // addr 2
                            // add as subquery
                            $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = contact.ID AND zbscf_objkey = %s AND zbscf_objtype = %d) ".$cKey2;                        
                            // add params
                            $params[] = $cfKey2; $params[] = ZBS_TYPE_CONTACT;

                    }


                }

                // ==== TOTAL VALUES

                // Calculate total vals etc. with SQL 
                if ($withValues && !$onlyID){

                    // arguably, if getting $withInvoices etc. may be more performant to calc this in php in AFTER loop, 
                    // ... for now as a fair guess, this'll be most performant:
                    // ... we calc total by adding invs + trans below :)

                    // only include transactions with statuses which should be included in total value:
					$transStatusQueryAdd = $this->DAL()->transactions->getTransactionStatusesToIncludeQuery(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					// include invoices without deleted status in the total value for invoices_total_inc_deleted:
					$inv_status_query_add = $this->DAL()->invoices->get_invoice_status_except_deleted_for_query();

                    // quotes:
                    $extraSelect .= ',(SELECT SUM(quotestotal.zbsq_value) FROM '.$ZBSCRM_t['quotes'].' as quotestotal WHERE quotestotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_QUOTE." AND zbsol_objtype_to = ".ZBS_TYPE_CONTACT." AND zbsol_objid_to = contact.ID)) as quotes_total";
					// invs not including deleted:
					$extraSelect .= ',(SELECT IFNULL(SUM(invstotal.zbsi_total),0) FROM ' . $ZBSCRM_t['invoices'] . ' as invstotal WHERE invstotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID)' . $inv_status_query_add . ') as invoices_total'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					// invs including deleted:
					$extraSelect .= ',(SELECT SUM(invstotalincdeleted.zbsi_total) FROM ' . $ZBSCRM_t['invoices'] . ' as invstotalincdeleted WHERE invstotalincdeleted.ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID)) as invoices_total_inc_deleted'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					// invs count:
					$extraSelect .= ',(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['invoices'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID)' . $inv_status_query_add . ') as invoices_count'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					// invs count including deleted:
					$extraSelect .= ',(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['invoices'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID)) as invoices_count_inc_deleted'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					// trans (with status):
                    $extraSelect .= ',(SELECT SUM(transtotal.zbst_total) FROM '.$ZBSCRM_t['transactions'].' as transtotal WHERE transtotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_TRANSACTION." AND zbsol_objtype_to = ".ZBS_TYPE_CONTACT." AND zbsol_objid_to = contact.ID)".$transStatusQueryAdd.") as transactions_total";
                    // paid balance against invs  (also in getContacts)
                    // (this allows us to subtract from totals to get a true figure where transactions are part/whole payments for invs)
                    /*

                        This selects transactions
                            where there is a link to an invoice
                                where that invoice has a link to this contact:

                        ==========

                        SELECT * FROM wp_zbs_transactions trans
                        WHERE trans.ID IN 
                            
                            (
                                SELECT DISTINCT zbsol_objid_from FROM `wp_zbs_object_links` 
                                WHERE zbsol_objtype_from = 5 
                                AND zbsol_objtype_to = 4
                                AND zbsol_objid_to IN 

                                    (

                                        SELECT DISTINCT zbsol_objid_from FROM `wp_zbs_object_links`
                                        WHERE zbsol_objtype_from = 4 AND zbsol_objtype_to = 1 AND zbsol_objid_to = 1

                                    )

                            )


                    */
                    $extraSelect .= ',(SELECT SUM(assignedtranstotal.zbst_total) FROM '.$ZBSCRM_t['transactions'].' assignedtranstotal WHERE assignedtranstotal.ID IN ';
                    $extraSelect .= '(SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_TRANSACTION.' AND zbsol_objtype_to = '.ZBS_TYPE_INVOICE.' AND zbsol_objid_to IN ';
                    $extraSelect .= '(SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_INVOICE.' AND zbsol_objtype_to = '.ZBS_TYPE_CONTACT.' AND zbsol_objid_to = contact.ID)';
                    $extraSelect .= ')'.$transStatusQueryAdd.') as transactions_paid_total';
                }

                // ==== / TOTAL VALUES

                $selector = 'contact.*';
                if (isset($fields) && is_array($fields)) {
                    $selector = '';

                    // always needs id, so add if not present
                    if (!in_array('ID',$fields)) $selector = 'contact.ID';

                    foreach ($fields as $f) {
                        if (!empty($selector)) $selector .= ',';
                        $selector .= 'contact.'.$f;
                    }
                } else if ($onlyID){
                    $selector = 'contact.ID';
                }

            #} ============ / PRE-QUERY ===========


            #} Build query
            $query = "SELECT ".$selector.$extraSelect." FROM ".$ZBSCRM_t['contacts'].' as contact';
            #} ============= WHERE ================

                if (!empty($id) && $id > 0){

                    #} Add ID
                    $wheres['ID'] = array('ID','=','%d',$id);

                } 

                if (!empty($email)){


                    // where we're seeking the ID from an email we can override the query for performance benefits (#gh-2450):
                    if ( $onlyID ){

                        $query = 'SELECT contact.ID FROM ( SELECT contact.ID FROM ' . $ZBSCRM_t['contacts'] . ' as contact WHERE zbsc_email = %s UNION ALL SELECT aka_id AS ID FROM ' . $ZBSCRM_t['aka'] . ' WHERE aka_type = 1 AND aka_alias = %s) contact';
                        $wheres = array( 'direct' => array() );
                        $params = array( $email, $email );

                    } else {

                        $emailWheres = array();

                        #} Add ID
                        $emailWheres['emailcheck'] = array('zbsc_email','=','%s',$email);

                        #} Check AKA
                        $emailWheres['email_alias'] = array('ID','IN',"(SELECT aka_id FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_CONTACT." AND aka_alias = %s)",$email);
                        
                        // This generates a query like 'zbsc_email = %s OR zbsc_email2 = %s', 
                        // which we then need to include as direct subquery (below) in main query :)
                        $emailSearchQueryArr = $this->buildWheres($emailWheres,'',array(),'OR',false);
                        
                        if (is_array($emailSearchQueryArr) && isset($emailSearchQueryArr['where']) && !empty($emailSearchQueryArr['where'])){

                            // add it
                            $wheres['direct'][] = array('('.$emailSearchQueryArr['where'].')',$emailSearchQueryArr['params']);

                        }

                    }

                } 

                if (!empty($WPID) && $WPID > 0){

                    #} Add ID
                    $wheres['WPID'] = array('zbsc_wpid','=','%d',$WPID);

                } 
                
                if (!empty($externalSource) && !empty($externalSourceUID)){

                    $wheres['extsourcecheck'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_CONTACT." AND zbss_source = %s AND zbss_uid = %s)",array($externalSource,$externalSourceUID));

                }

            #} ============ / WHERE ==============

            #} Build out any WHERE clauses
            $wheresArr = $this->buildWheres($wheres,$whereStr,$params);
            $whereStr = $wheresArr['where']; $params = $params + $wheresArr['params'];
            #} / Build WHERE

            #} Ownership v1.0 - the following adds SITE + TEAM checks, and (optionally), owner          
            $params = array_merge($params,$this->ownershipQueryVars($ignoreowner)); // merges in any req.
            $ownQ = $this->ownershipSQL($ignoreowner); if (!empty($ownQ)) $additionalWhere = $this->spaceAnd($additionalWhere).$ownQ; // adds str to query
            #} / Ownership

            #} Append to sql (this also automatically deals with sortby and paging)
            $query .= $this->buildWhereStr($whereStr,$additionalWhere) . $this->buildSort('ID','DESC') . $this->buildPaging(0,1);

            try {

                #} Prep & run query
                $queryObj = $this->prepare($query,$params);
                $potentialRes = $wpdb->get_row($queryObj, OBJECT);


            } catch (Exception $e){

                #} General SQL Err
                $this->catchSQLError($e);

            }

            #} Interpret Results (ROW)
            if (isset($potentialRes) && isset($potentialRes->ID)) {

                #} Has results, tidy + return 
                
                    #} Only ID? return it directly
                    if ($onlyID) return $potentialRes->ID;
                
                    // tidy
                    if (is_array($fields)){
                        // guesses fields based on table col names
                        $res = $this->lazyTidyGeneric($potentialRes);
                    } else {
                        // proper tidy
                        $res = $this->tidy_contact($potentialRes,$withCustomFields);
                    }

                    if ($withTags){

                        // add all tags lines
                        $res['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_CONTACT,'objid'=>$potentialRes->ID));
                    
                    }

                    // ===================================================
                    // ========== #} #DB1LEGACY (TOMOVE)
                    // == Following is all using OLD DB stuff, here until we migrate inv etc.
                    // ===================================================

                    #} With most recent log? #DB1LEGACY (TOMOVE)
                    if ($withLastLog){

                        $res['lastlog'] = $this->DAL()->logs->getLogsForObj(array(

                                                'objtype' => ZBS_TYPE_CONTACT,
                                                'objid' => $potentialRes->ID,

                                                'incMeta'   => true,

                                                'sortByField'   => 'zbsl_created',
                                                'sortOrder'     => 'DESC',
                                                'page'          => 0,
                                                'perPage'       => 1

                                            ));

                    }

                    #} With Assigned?
                    if ($withOwner){

                        $res['owner'] = zeroBS_getOwner($potentialRes->ID,true,'zerobs_customer',$potentialRes->zbs_owner);

                    }

                        // Objects: return all, unless $with_obj_limit
                        $objs_page = -1;
                        $objs_per_page = -1;
                        $with_obj_limit = (int)$with_obj_limit;
                        if ( $with_obj_limit > 0 ){

                            $objs_page = 0;
                            $objs_per_page = $with_obj_limit;

                        }


                        if ($withInvoices){
                        
                            #} only gets first 100?
                            //DAL3 ver, more perf, gets all
                            $res['invoices'] = $zbs->DAL->invoices->getInvoices(array(

                                    'assignedContact'   => $potentialRes->ID, // assigned to company id (int)
                                    'page'              => $objs_page,
                                    'perPage'           => $objs_per_page,
                                    'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE),                                    
                                    'sortByField'       => 'ID',
                                    'sortOrder'         => 'DESC',
                                    'withAssigned'      => false // no need, it's assigned to this obj already

                                ));

                        }

                        if ($withQuotes){
                            
                            //DAL3 ver, more perf, gets all
                            $res['quotes'] = $zbs->DAL->quotes->getQuotes(array(

                                    'assignedContact'   => $potentialRes->ID, // assigned to company id (int)
                                    'page'              => $objs_page,
                                    'perPage'           => $objs_per_page,
                                    'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE),                                    
                                    'sortByField'       => 'ID',
                                    'sortOrder'         => 'DESC',
                                    'withAssigned'      => false // no need, it's assigned to this obj already

                                ));

                        }

                        #} ... brutal for mvp #DB1LEGACY (TOMOVE)
                        if ($withTransactions){
                            
                            //DAL3 ver, more perf, gets all
                            $res['transactions'] = $zbs->DAL->transactions->getTransactions(array(

                                    'assignedContact'   => $potentialRes->ID, // assigned to company id (int)
                                    'page'              => $objs_page,
                                    'perPage'           => $objs_per_page,
                                    'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION),                                    
                                    'sortByField'       => 'ID',
                                    'sortOrder'         => 'DESC',
                                    'withAssigned'      => false // no need, it's assigned to this obj already

                                ));

                        }

                    //}

                    #} With co's?
                    if ($withCompanies){

                        // add all company lines
                        $res['companies'] = $this->DAL()->getObjsLinkedToObj(array(
                                'objtypefrom'   =>  ZBS_TYPE_CONTACT, // contact
                                'objtypeto'     =>  ZBS_TYPE_COMPANY, // company
                                'objfromid'     =>  $potentialRes->ID));
                    
                    }

                    #} ... brutal for mvp #DB1LEGACY (TOMOVE)
                    if ($withTasks){
                        
                        //DAL3 ver, more perf, gets all
                        $res['tasks'] = $zbs->DAL->events->getEvents(array(

                                'assignedContact'   => $potentialRes->ID, // assigned to company id (int)
                                'page'              => $objs_page,
                                'perPage'           => $objs_per_page,
                                'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TASK),                                    
                                'sortByField'       => 'zbse_start',
                                'sortOrder'         => 'DESC',
                                'withAssigned'      => false // no need, it's assigned to this obj already

                            ));

                    }

                    // simplistic, could be optimised (though low use means later.)
                    if ( $withExternalSources ){
                        
                        $res['external_sources'] = $zbs->DAL->contacts->getExternalSourcesForContact(array(

                            'contactID'=> $potentialRes->ID,

                            'sortByField'   => 'ID',
                            'sortOrder'     => 'ASC',
                            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT )

                        ));

                    }
                    if ( $withExternalSourcesGrouped ){
                        
                        $res['external_sources'] = $zbs->DAL->getExternalSources( -1, array(
                        
                            'objectID'          => $potentialRes->ID, 
                            'objectType'        => ZBS_TYPE_CONTACT,
                            'grouped_by_source' => true,
                            'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT )

                        ));

                    }

                    // ===================================================
                    // ========== / #DB1LEGACY (TOMOVE)
                    // ===================================================


                    return $res;

            }

        } // / if ID

        return false;

    }

    // TODO $argsOverride=false
    /**
     * returns contact detail lines
     *
     * @param array $args Associative array of arguments
     *              withQuotes, withInvoices, withTransactions, withLogs, searchPhrase, sortByField, sortOrder, page, perPage
     *
     * @return array of contact lines
     */
    public function getContacts($args=array()){

        global $zbs;


        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'searchPhrase'  => '', // searches which fields?
            'inCompany'         => false, // will be an ID if used
            'inArr'             => false,
            'quickFilters'      => false,
            'isTagged'          => false, // 1x INT OR array(1,2,3)
            'isNotTagged'       => false, // 1x INT OR array(1,2,3)
            'ownedBy'           => false,
            'externalSource'    => false, // e.g. paypal
            'olderThan'         => false, // uts
            'newerThan'         => false, // uts
            'hasStatus'         => false, // Lead (this takes over from the quick filter post 19/6/18)
            'otherStatus'       => false, // status other than 'Lead'

            // last contacted
            'contactedBefore'   => false, // uts
            'contactedAfter'    => false, // uts

            // email
            'hasEmail'          => false, // 'x@y.com' either in main field or as AKA

            // addr
            'inCounty'          => false, // Hertfordshire
            'inPostCode'        => false, // AL1 1AA
            'inCountry'         => false, // United Kingdom
            'notInCounty'       => false, // Hertfordshire
            'notInPostCode'     => false, // AL1 1AA
            'notInCountry'      => false, // United Kingdom

            // generic assignments - requires both
            // Where the link relationship is OBJECT -> CONTACT
            'hasObjIDLinkedTo'    => false, // e.g. quoteid 123
            'hasObjTypeLinkedTo'   => false, // e.g. ZBS_TYPE_QUOTE

            // generic assignments - requires both
            // Where the link relationship is CONTACT -> OBJECT
            'isLinkedToObjID'    => false, // e.g. quoteid 123
            'isLinkedToObjType'   => false, // e.g. ZBS_TYPE_QUOTE

            // returns
            'count'             => false,
            'onlyObjTotals'            => false, // if passed, returns for group: 'total' 'invoices_total' 'transactions_total' etc. (requires getting a lot of objs, use sparingly)
            'withCustomFields'  => true,
            'withQuotes'        => false,
            'withInvoices'      => false,
            'withTransactions'  => false,
            'withTasks'         => false,
            'withLogs'          => false,
            'withLastLog'       => false,
            'withTags'          => false,
            'withOwner'         => false,
            'withAssigned'      => false, // return ['company'] objs if has link
            'withDND'           => false, // if true, returns getContactDoNotMail as well :)
            'simplified'        => false, // returns just id,name,created,email (for typeaheads)
            'withValues'        => false, // if passed, returns with 'total' 'invoices_total' 'transactions_total' etc. (requires getting all obj, use sparingly)
            'onlyColumns'       => false, // if passed (array('fname','lname')) will return only those columns (overwrites some other 'return' options). NOTE: only works for base fields (not custom fields)
            'withAliases'       => false,
            'withExternalSources' => false,
            'withExternalSourcesGrouped' => false,


            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0, // this is what page it is (gets * by for limit)
            'perPage'       => 100,

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT), // this'll let you not-check the owner of obj

            // 'argsOverride' => ?? Still req?

            // specifics
            // NOTE: this is ONLY for use where a sql query is 1 time use, otherwise add as argument
            // ... for later use, (above)
            // PLEASE do not use the or switch without discussing case with WH
            'additionalWhereArr' => false, 
            'whereCase'          => 'AND' // DEFAULT = AND



        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        global $ZBSCRM_t,$wpdb,$zbs;  
        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array(); $joinQ = ''; $extraSelect = '';

        #} ============= PRE-QUERY ============

            #} Capitalise this
            $sortOrder = strtoupper($sortOrder);
            if ( ! in_array( $sortOrder, array( 'ASC', 'DESC' ) ) ) {
                    $sortOrder = 'ASC';
            }

            // If just count or simplified, turn off any extras
            if ( $count || $simplified || $onlyObjTotals ) {
                $withCustomFields = false;
                $withQuotes = false;
                $withInvoices = false;
                $withTransactions = false;
                $withTasks = false;
                $withLogs = false;
                $withLastLog = false;
                $withTags = false;
                $withOwner = false;
                $withAssigned = false;
                $withDND = false;
                $withAliases = false;
                $withExternalSources = false;
                $withExternalSourcesGrouped = false;
            }

            #} If onlyColumns, validate
            if ($onlyColumns){

                #} onlyColumns build out a field arr
                if (is_array($onlyColumns) && count($onlyColumns) > 0){

                    $onlyColumnsFieldArr = array();
                    foreach ($onlyColumns as $col){

                        // find db col key from field key (e.g. fname => zbsc_fname)
                        $dbCol = ''; if (isset($this->objectModel[$col]) && isset($this->objectModel[$col]['fieldname'])) $dbCol = $this->objectModel[$col]['fieldname'];

                        if (!empty($dbCol)){

                            $onlyColumnsFieldArr[$dbCol] = $col;

                        }

                    }

                }

                // if legit cols:
                if (isset($onlyColumnsFieldArr) && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

                    $onlyColumns = true;
                    
                    // If onlyColumns, turn off extras
                    $withCustomFields = false;
                    $withQuotes = false;
                    $withInvoices = false;
                    $withTransactions = false;
                    $withTasks = false;
                    $withLogs = false;
                    $withLastLog = false;
                    $withTags = false;
                    $withOwner = false;
                    $withAssigned = false;
                    $withDND = false;
                    $withAliases = false;
                    $withExternalSources = false;
                    $withExternalSourcesGrouped = false;

                } else {

                    // deny
                    $onlyColumns = false;

                }


            }

            #} Custom Fields
            if ($withCustomFields){
                
                #} Retrieve any cf
                $custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_CONTACT));

                #} Cycle through + build into query
                if (is_array($custFields)) foreach ($custFields as $cK => $cF){

                    // custom field (e.g. 'third name') it'll be passed here as 'third-name'
                    // ... problem is mysql does not like that :) so we have to chage here:
                    // in this case we prepend cf's with cf_ and we switch - for _
                    $cKey = 'cf_'.str_replace('-','_',$cK);

                    // we also check the $sortByField in case that's the same cf
                    if ($cK == $sortByField){

                        // sort by
                        $sortByField = $cKey;

                        // check if sort needs any CAST (e.g. numeric):
                        $sortByField = $this->DAL()->build_custom_field_order_by_str( $sortByField, $cF );                        

                    }

                    // add as subquery
                    $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = contact.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) ".$cKey;
                    
                    // add params
                    $params[] = $cK; $params[] = ZBS_TYPE_CONTACT;

                }

            }

            #} Aliases
            if ($withAliases){

                #} Retrieve these as a CSV :)
                $extraSelect .= ",(SELECT GROUP_CONCAT(aka_alias SEPARATOR ',') FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_CONTACT." AND aka_id = contact.ID) aliases";

            }

            // Add any addr custom fields for addr1+addr2
            // no need if simpliefied or count parameters passed
            if ( !$simplified && !$count && !$onlyColumns && !$onlyObjTotals ){
                $addrCustomFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_ADDRESS));
                if (is_array($addrCustomFields) && count($addrCustomFields) > 0){

                    foreach ($addrCustomFields as $cK => $cF){

                        // custom field key
                        $cfKey = 'addr_'.$cK;
                        $cfKey2 = 'secaddr_'.$cK;

                        // address custom field (e.g. 'house name') it'll be passed here as 'house-name'
                        // ... problem is mysql does not like that :) so we have to chage here:
                        // in this case we prepend address cf's with addr_ and we switch - for _
                        $cKey = 'addrcf_'.str_replace('-','_',$cK);
                        $cKey2 = 'secaddrcf_'.str_replace('-','_',$cK);

                        // we also check the $sortByField in case that's the same cf (contacts need the prefix 'zbsc_' :rolls-eyes:)
                        if ('zbsc_'.$cfKey == $sortByField) $sortByField = $cKey;
                        if ('zbsc_'.$cfKey2 == $sortByField) $sortByField = $cKey2;

                        // addr 1
                            // add as subquery
                            $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = contact.ID AND zbscf_objkey = %s AND zbscf_objtype = %d) ".$cKey;                        
                            // add params
                            $params[] = $cfKey; $params[] = ZBS_TYPE_CONTACT;
                        // addr 2
                            // add as subquery
                            $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = contact.ID AND zbscf_objkey = %s AND zbscf_objtype = %d) ".$cKey2;                        
                            // add params
                            $params[] = $cfKey2; $params[] = ZBS_TYPE_CONTACT;

                    }


                }

            }


            // ==== TOTAL VALUES

            // If we're sorting by total value, we need the values
            if ( $sortByField === 'totalvalue' ) {
                $withValues = true;
            }

            // Calculate total vals etc. with SQL 
            if ( !$simplified && !$count && $withValues && !$onlyColumns ){

                // arguably, if getting $withInvoices etc. may be more performant to calc this in php in AFTER loop, 
                // ... for now as a fair guess, this'll be most performant:
                // ... we calc total by adding invs + trans below :)

                // only include transactions with statuses which should be included in total value:
                $transStatusQueryAdd = $this->DAL()->transactions->getTransactionStatusesToIncludeQuery();  
				// include invoices without deleted status in the total value for invoices_total_inc_deleted:
				$inv_status_query_add = $this->DAL()->invoices->get_invoice_status_except_deleted_for_query();

                // quotes:
                $extraSelect .= ',(SELECT SUM(quotestotal.zbsq_value) FROM '.$ZBSCRM_t['quotes'].' as quotestotal WHERE quotestotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_QUOTE." AND zbsol_objtype_to = ".ZBS_TYPE_CONTACT." AND zbsol_objid_to = contact.ID)) as quotes_total";
                // invs:
				$extraSelect .= ',(SELECT IFNULL(SUM(invstotal.zbsi_total),0) FROM ' . $ZBSCRM_t['invoices'] . ' as invstotal WHERE invstotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID)' . $inv_status_query_add . ') as invoices_total'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				// invs including deleted:
				$extraSelect .= ',(SELECT SUM(invstotalincdeleted.zbsi_total) FROM ' . $ZBSCRM_t['invoices'] . ' as invstotalincdeleted WHERE invstotalincdeleted.ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID)) as invoices_total_inc_deleted'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				// invs count:
				$extraSelect .= ',(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['invoices'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID)' . $inv_status_query_add . ') as invoices_count'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				// invs count including deleted:
				$extraSelect .= ',(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['invoices'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID)) as invoices_count_inc_deleted'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

				// trans (with status):
                $extraSelect .= ',(SELECT SUM(transtotal.zbst_total) FROM '.$ZBSCRM_t['transactions'].' as transtotal WHERE transtotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_TRANSACTION." AND zbsol_objtype_to = ".ZBS_TYPE_CONTACT." AND zbsol_objid_to = contact.ID)".$transStatusQueryAdd.") as transactions_total";
                // paid balance against invs  (also in getContact)
                // (this allows us to subtract from totals to get a true figure where transactions are part/whole payments for invs)
                /*

                    This selects transactions
                        where there is a link to an invoice
                            where that invoice has a link to this contact:

                    ==========

                    SELECT * FROM wp_zbs_transactions trans
                    WHERE trans.ID IN 
                        
                        (
                            SELECT DISTINCT zbsol_objid_from FROM `wp_zbs_object_links` 
                            WHERE zbsol_objtype_from = 5 
                            AND zbsol_objtype_to = 4
                            AND zbsol_objid_to IN 

                                (

                                    SELECT DISTINCT zbsol_objid_from FROM `wp_zbs_object_links`
                                    WHERE zbsol_objtype_from = 4 AND zbsol_objtype_to = 1 AND zbsol_objid_to = 1

                                )

                        )


                */
                $extraSelect .= ',(SELECT SUM(assignedtranstotal.zbst_total) FROM '.$ZBSCRM_t['transactions'].' assignedtranstotal WHERE assignedtranstotal.ID IN ';
                $extraSelect .= '(SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_TRANSACTION.' AND zbsol_objtype_to = '.ZBS_TYPE_INVOICE.' AND zbsol_objid_to IN ';
                $extraSelect .= '(SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_INVOICE.' AND zbsol_objtype_to = '.ZBS_TYPE_CONTACT.' AND zbsol_objid_to = contact.ID)';
                $extraSelect .= ')'.$transStatusQueryAdd.') as transactions_paid_total';

            }

            // ==== / TOTAL VALUES


            if ($withDND){

                // add as subquery
                $extraSelect .= ',(SELECT zbsm_val FROM '.$ZBSCRM_t['meta']." WHERE zbsm_objid = contact.ID AND zbsm_key = %s AND zbsm_objtype = ".ZBS_TYPE_CONTACT." LIMIT 1) dnd";
                
                // add params
                $params[] = 'do-not-email';

            }

        #} ============ / PRE-QUERY ===========

        #} Build query
        $query = "SELECT contact.*".$extraSelect." FROM ".$ZBSCRM_t['contacts'].' as contact'.$joinQ;

        #} Count override
        if ($count) $query = "SELECT COUNT(contact.ID) FROM ".$ZBSCRM_t['contacts'].' as contact'.$joinQ;

        #} simplified override
        if ($simplified) $query = "SELECT contact.ID as id,CONCAT(contact.zbsc_fname,\" \",contact.zbsc_lname) as name,contact.zbsc_created as created, contact.zbsc_email as email FROM ".$ZBSCRM_t['contacts'].' as contact'.$joinQ;

        #} onlyColumns override
        if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

            $columnStr = '';
            foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                if (!empty($columnStr)) $columnStr .= ',';
                // this presumes str is db-safe? could do with sanitation?
                $columnStr .= $colDBKey;

            }

            $query = "SELECT ".$columnStr." FROM ".$ZBSCRM_t['contacts'].' as contact'.$joinQ;

        }


        #} ============= WHERE ================

            #} Add Search phrase
            if (!empty($searchPhrase)){

                // inefficient searching all fields. Maybe get settings from user "which fields to search"
                // ... and auto compile for each contact ahead of time
                $searchWheres = array();
                $searchWheres['search_fullname'] = array('CONCAT(zbsc_prefix, " ", zbsc_fname, " ", zbsc_lname)','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_fname'] = array('zbsc_fname','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_lname'] = array('zbsc_lname','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_email'] = array('zbsc_email','LIKE','%s','%'.$searchPhrase.'%');

                // address elements
                $searchWheres['search_addr1'] = array('zbsc_addr1','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_addr2'] = array('zbsc_addr2','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_city'] = array('zbsc_city','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_county'] = array('zbsc_county','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_country'] = array('zbsc_country','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_postcode'] = array('zbsc_postcode','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_secaddr1'] = array('zbsc_secaddr1','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_secaddr2'] = array('zbsc_secaddr2','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_seccity'] = array('zbsc_seccity','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_seccounty'] = array('zbsc_seccounty','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_seccountry'] = array('zbsc_seccountry','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_secpostcode'] = array('zbsc_secpostcode','LIKE','%s','%'.$searchPhrase.'%');

                // social
                $searchWheres['search_tw'] = array('zbsc_tw','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_li'] = array('zbsc_li','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_fb'] = array('zbsc_fb','LIKE','%s','%'.$searchPhrase.'%');

                // phones
                // ultimately when search is refactored, we should probably store the "clean" version of the phone numbers in the database
                $searchWheres['search_hometel'] = array('REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(zbsc_hometel," ",""),".",""),"-",""),"(",""),")","")','LIKE','%s','%'.(str_replace(array(' ','.','-','(',')'),'',$searchPhrase)).'%');
                $searchWheres['search_worktel'] = array('REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(zbsc_worktel," ",""),".",""),"-",""),"(",""),")","")','LIKE','%s','%'.(str_replace(array(' ','.','-','(',')'),'',$searchPhrase)).'%');
                $searchWheres['search_mobtel'] = array('REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(zbsc_mobtel," ",""),".",""),"-",""),"(",""),")","")','LIKE','%s','%'.(str_replace(array(' ','.','-','(',')'),'',$searchPhrase)).'%');

                // We also add this, which finds AKA emails if using email
                $searchWheres['search_alias'] = array('ID','IN',"(SELECT aka_id FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_CONTACT." AND aka_alias = %s)",$searchPhrase);

                // 2.99.9.11 - Added ability to search custom fields (optionally)
                $customFieldSearch = zeroBSCRM_getSetting('customfieldsearch');
                if ($customFieldSearch == 1){

                    // simplistic add
                    // NOTE: This IGNORES ownership of custom field lines.
                    // use FULLTEXT index if available (MySQL 5.6+), otherwise use fallback
                    if ( jpcrm_migration_table_has_index( $ZBSCRM_t['customfields'], 'search' ) ) {
                        $searchWheres['search_customfields'] = array('ID','IN',"(SELECT zbscf_objid FROM ".$ZBSCRM_t['customfields']." WHERE MATCH(zbscf_objval) AGAINST(%s) AND zbscf_objtype = ".ZBS_TYPE_CONTACT.")",$searchPhrase);
                    } else {
                        $searchWheres['search_customfields'] = array('ID','IN',"(SELECT zbscf_objid FROM ".$ZBSCRM_t['customfields']." WHERE zbscf_objval LIKE %s AND zbscf_objtype = ".ZBS_TYPE_CONTACT.")",'%'.$searchPhrase.'%');
                    }

                }
                
                // also search "company name" where assigned
                $b2bMode = zeroBSCRM_getSetting('companylevelcustomers');
                // OWNERSHIP TODO - next query doesn't USE OWNERSHIP!!!!:
                if ($b2bMode == 1) $searchWheres['incompanywithname'] = array('ID','IN','(SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_CONTACT." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to IN (SELECT ID FROM ".$ZBSCRM_t['companies']." WHERE zbsco_name LIKE %s))",'%'.$searchPhrase.'%');

                // This generates a query like 'zbsc_fname LIKE %s OR zbsc_lname LIKE %s', 
                // which we then need to include as direct subquery (below) in main query :)
                $searchQueryArr = $this->buildWheres($searchWheres,'',array(),'OR',false);
                
                if (is_array($searchQueryArr) && isset($searchQueryArr['where']) && !empty($searchQueryArr['where'])){

                    // add it
                    $wheres['direct'][] = array('('.$searchQueryArr['where'].')',$searchQueryArr['params']);

                }

            }

            #} In company? #DB1LEGACY (TOMOVE -> where)
            if (!empty($inCompany) && $inCompany > 0){
                
                // would never hard-type this in (would make generic as in buildWPMetaQueryWhere)
                // but this is only here until MIGRATED to db2 globally
                //$wheres['incompany'] = array('ID','IN','(SELECT DISTINCT post_id FROM '.$wpdb->prefix."postmeta WHERE meta_key = 'zbs_company' AND meta_value = %d)",$inCompany);
                // Use obj links now 
                $wheres['incompany'] = array('ID','IN','(SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_CONTACT." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = %d)",$inCompany);

            }

            #} In array (if inCompany passed, this'll currently overwrite that?! (todo2.5))
            if (is_array($inArr) && count($inArr) > 0){

                // clean for ints
                $inArrChecked = array(); foreach ($inArr as $x){ $inArrChecked[] = (int)$x; }

                // add where
                $wheres['inarray'] = array('ID','IN','('.implode(',',$inArrChecked).')');

            }

            #} Owned by
            if (!empty($ownedBy) && $ownedBy > 0){
                
                // would never hard-type this in (would make generic as in buildWPMetaQueryWhere)
                // but this is only here until MIGRATED to db2 globally
                //$wheres['incompany'] = array('ID','IN','(SELECT DISTINCT post_id FROM '.$wpdb->prefix."postmeta WHERE meta_key = 'zbs_company' AND meta_value = %d)",$inCompany);
                // Use obj links now 
                $wheres['ownedBy'] = array('zbs_owner','=','%s',$ownedBy);

            }

            // External sources
            if ( !empty( $externalSource ) ){

                // NO owernship built into this, check when roll out multi-layered ownsership
                $wheres['externalsource'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_CONTACT." AND zbss_source = %s)",$externalSource);

            }

            // quick addition for mike
            #} olderThan
            if (!empty($olderThan) && $olderThan > 0 && $olderThan !== false) $wheres['olderThan'] = array('zbsc_created','<=','%d',$olderThan);
            #} newerThan
            if (!empty($newerThan) && $newerThan > 0 && $newerThan !== false) $wheres['newerThan'] = array('zbsc_created','>=','%d',$newerThan);

            // status
            if (!empty($hasStatus) && $hasStatus !== false) $wheres['hasStatus'] = array('zbsc_status','=','%s',$hasStatus);
            if (!empty($otherStatus) && $otherStatus !== false) $wheres['otherStatus'] = array('zbsc_status','<>','%s',$otherStatus);

            #} contactedBefore
            if (!empty($contactedBefore) && $contactedBefore > 0 && $contactedBefore !== false) $wheres['contactedBefore'] = array('zbsc_lastcontacted','<=','%d',$contactedBefore);
            #} contactedAfter
            if (!empty($contactedAfter) && $contactedAfter > 0 && $contactedAfter !== false) $wheres['contactedAfter'] = array('zbsc_lastcontacted','>=','%d',$contactedAfter);

            #} hasEmail
            if (!empty($hasEmail) && !empty($hasEmail) && $hasEmail !== false) {
                $wheres['hasEmail'] = array('zbsc_email','=','%s',$hasEmail);
                $wheres['hasEmailAlias'] = array('ID','IN',"(SELECT aka_id FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_CONTACT." AND aka_alias = %s)",$hasEmail);
            }

            #} inCounty
            if (!empty($inCounty) && !empty($inCounty) && $inCounty !== false) {
                $wheres['inCounty'] = array('zbsc_county','=','%s',$inCounty);
                $wheres['inCountyAddr2'] = array('zbsc_secaddrcounty','=','%s',$inCounty);
            }
            #} inPostCode
            if (!empty($inPostCode) && !empty($inPostCode) && $inPostCode !== false) {
                $wheres['inPostCode'] = array('zbsc_postcode','=','%s',$inPostCode);
                $wheres['inPostCodeAddr2'] = array('zbsc_secaddrpostcode','=','%s',$inPostCode);
            }
            #} inCountry
            if (!empty($inCountry) && !empty($inCountry) && $inCountry !== false) {
                $wheres['inCountry'] = array('zbsc_country','=','%s',$inCountry);
                $wheres['inCountryAddr2'] = array('zbsc_secaddrcountry','=','%s',$inCountry);
            }
            #} notInCounty
            if (!empty($notInCounty) && !empty($notInCounty) && $notInCounty !== false) {
                $wheres['notInCounty'] = array('zbsc_county','<>','%s',$notInCounty);
                $wheres['notInCountyAddr2'] = array('zbsc_secaddrcounty','<>','%s',$notInCounty);
            }
            #} notInPostCode
            if (!empty($notInPostCode) && !empty($notInPostCode) && $notInPostCode !== false) {
                $wheres['notInPostCode'] = array('zbsc_postcode','<>','%s',$notInPostCode);
                $wheres['notInPostCodeAddr2'] = array('zbsc_secaddrpostcode','<>','%s',$notInPostCode);
            }
            #} notInCountry
            if (!empty($notInCountry) && !empty($notInCountry) && $notInCountry !== false) {
                $wheres['notInCountry'] = array('zbsc_country','<>','%s',$notInCountry);
                $wheres['notInCountryAddr2'] = array('zbsc_secaddrcountry','<>','%s',$notInCountry);
            }

            // generic obj links, e.g. quotes, invs, trans 
            // e.g. contact(s) assigned to inv 123
            // Where the link relationship is OBJECT -> CONTACT
            if (!empty($hasObjIDLinkedTo) && $hasObjIDLinkedTo !== false && $hasObjIDLinkedTo > 0 && 
                !empty($hasObjTypeLinkedTo) && $hasObjTypeLinkedTo !== false && $hasObjTypeLinkedTo > 0) {
                $wheres['hasObjIDLinkedTo'] = array('ID','IN','(SELECT zbsol_objid_to FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = %d AND zbsol_objtype_to = ".ZBS_TYPE_CONTACT." AND zbsol_objid_from = %d AND zbsol_objid_to = contact.ID)",array($hasObjTypeLinkedTo,$hasObjIDLinkedTo));

            }

            // generic obj links, e.g. companies
            // Where the link relationship is CONTACT -> OBJECT
            if (!empty($isLinkedToObjID) && $isLinkedToObjID !== false && $isLinkedToObjID > 0 && 
                !empty($isLinkedToObjType) && $isLinkedToObjType !== false && $isLinkedToObjType > 0) {
                $wheres['isLinkedToObjID'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_CONTACT." AND zbsol_objtype_to = %d AND zbsol_objid_from = contact.ID AND zbsol_objid_to = %d)",array($isLinkedToObjType,$isLinkedToObjID));                
            }

            #} Any additionalWhereArr?
            if (isset($additionalWhereArr) && is_array($additionalWhereArr) && count($additionalWhereArr) > 0){

                // add em onto wheres (note these will OVERRIDE if using a key used above)
                // Needs to be multi-dimensional $wheres = array_merge($wheres,$additionalWhereArr);
                $wheres = array_merge_recursive($wheres,$additionalWhereArr);

            }


            #} Quick filters - adapted from DAL1 (probs can be slicker)
            if (is_array($quickFilters) && count($quickFilters) > 0){

                // cycle through
                foreach ($quickFilters as $qFilter){

                        // where status = x
                        // USE hasStatus above now...
					if ( str_starts_with( $qFilter, 'status_' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

                            $qFilterStatus = substr($qFilter,7);
                            $qFilterStatus = str_replace('_',' ',$qFilterStatus);

                            // check status
                            $wheres['quickfilterstatus'] = array('zbsc_status','LIKE','%s',ucwords($qFilterStatus));

					} elseif ( $qFilter === 'assigned_to_me' ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
                            $wheres['assigned_to_me'] = array( 'zbs_owner', '=', zeroBSCRM_user() );

					} elseif ( $qFilter === 'not_assigned' ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
                            $wheres['not_assigned'] = array( 'zbs_owner', '<=', '0' );

					} elseif ( str_starts_with( $qFilter, 'notcontactedin' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

                                // check
                                $notcontactedinDays = (int)substr($qFilter,14);
                                $notcontactedinDaysSeconds = $notcontactedinDays*86400;
                                $wheres['notcontactedinx'] = array('zbsc_lastcontacted','<','%d',time()-$notcontactedinDaysSeconds);

					} elseif ( str_starts_with( $qFilter, 'olderthan' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

                                // check
                                $olderThanDays = (int)substr($qFilter,9);
                                $olderThanDaysSeconds = $olderThanDays*86400;
                                $wheres['olderthanx'] = array('zbsc_created','<','%d',time()-$olderThanDaysSeconds);

					} elseif ( str_starts_with( $qFilter, 'segment_' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

                            // a SEGMENT
                            $qFilterSegmentSlug = substr($qFilter,8);

                                #} Retrieve segment + conditions
                                $segment = $this->DAL()->segments->getSegmentBySlug($qFilterSegmentSlug,true,false);
                                $conditions = array(); if (isset($segment['conditions'])) $conditions = $segment['conditions'];
                                $matchType = 'all'; if (isset($segment['matchtype'])) $matchType = $segment['matchtype'];

                                // retrieve getContacts arguments from a list of segment conditions
                                // as at launch of segments (26/6/18) - these are all $additionalWhere args
                                // ... if it stays that way, this is nice and simple, so going to proceed with that.
                                // be aware if $this->segmentConditionArgs() changes, will affect this.
                                $contactGetArgs = $this->DAL()->segments->segmentConditionsToArgs($conditions,$matchType);

                                    // as at above, contactGetArgs should have this:
                                    if (isset($contactGetArgs['additionalWhereArr']) && is_array($contactGetArgs['additionalWhereArr'])){

                                        // This was required to work with OR and AND situs, along with the usual getContacts vars as well
                                        // -----------------------
                                        // match type ALL is default, this switches to ANY
                                        $segmentOperator = 'AND'; if ($matchType == 'one') $segmentOperator = 'OR';

                                        // This generates a query like 'zbsc_fname LIKE %s OR/AND zbsc_lname LIKE %s', 
                                        // which we then need to include as direct subquery (below) in main query :)
                                        $segmentQueryArr = $this->buildWheres($contactGetArgs['additionalWhereArr'],'',array(),$segmentOperator,false);
                                        
                                        if (is_array($segmentQueryArr) && isset($segmentQueryArr['where']) && !empty($segmentQueryArr['where'])){

                                            // add it
                                            $wheres['direct'][] = array('('.$segmentQueryArr['where'].')',$segmentQueryArr['params']);

                                        }
                                        // -----------------------


                                        //  following didn't work for OR situations: (worked for most situations though, is a shame)
                                        // -----------------------
                                        // so we MERGE that into our wheres... :o
                                        // this'll override any settings above. 
                                        // Needs to be multi-dimensional 
                                        //$wheres = array_merge_recursive($wheres,$contactGetArgs['additionalWhereArr']);
                                        // -----------------------

                                    }


					} else {

                                // normal/hardtyped

                                switch ($qFilter){


                                    case 'lead':

                                        // hack "leads only" - adapted from DAL1 (probs can be slicker)
                                        $wheres['quickfilterlead'] = array('zbsc_status','LIKE','%s','Lead');

                                        break;


                                    case 'customer':

                                        // hack - adapted from DAL1 (probs can be slicker)
										$wheres['quickfiltercustomer'] = array( 'zbsc_status', 'LIKE', '%s', 'Customer' );

                                        break;

                                    default:

                                        // if we've hit no filter query, let external logic hook in to provide alternatives
                                        // First used in WooSync module
                                        $wheres = apply_filters( 'jpcrm_contact_query_quickfilter', $wheres, $qFilter );

                                        break;

                                }  // / switch



					} // / hardtyped

                        }

                } // / quickfilters

            #} Is Tagged (expects 1 tag ID OR array)

                // catch 1 item arr
                if (is_array($isTagged) && count($isTagged) == 1) $isTagged = $isTagged[0];

            if (!is_array($isTagged) && !empty($isTagged) && $isTagged > 0){

                // add where tagged                 
                // 1 int: 
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = contact.ID AND zbstl_tagid = %d) > 0)',array(ZBS_TYPE_CONTACT,$isTagged));

            } else if (is_array($isTagged) && count($isTagged) > 0){

                // foreach in array :) 
                $tagStr = '';
                foreach ($isTagged as $iTag){
                    $i = (int)$iTag;
                    if ($i > 0){

                        if ($tagStr !== '') $tagStr .',';
                        $tagStr .= $i;
                    }
                }
                if (!empty($tagStr)){
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = contact.ID AND zbstl_tagid IN (%s)) > 0)',array(ZBS_TYPE_CONTACT,$tagStr));

                }

            }
            #} Is NOT Tagged (expects 1 tag ID OR array)

                // catch 1 item arr
                if (is_array($isNotTagged) && count($isNotTagged) == 1) $isNotTagged = $isNotTagged[0];
                
            if (!is_array($isNotTagged) && !empty($isNotTagged) && $isNotTagged > 0){

                // add where tagged                 
                // 1 int: 
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = contact.ID AND zbstl_tagid = %d) = 0)',array(ZBS_TYPE_CONTACT,$isNotTagged));

            } else if (is_array($isNotTagged) && count($isNotTagged) > 0){

                // foreach in array :) 
                $tagStr = '';
                foreach ($isNotTagged as $iTag){
                    $i = (int)$iTag;
                    if ($i > 0){

                        if ($tagStr !== '') $tagStr .',';
                        $tagStr .= $i;
                    }
                }
                if (!empty($tagStr)){
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = contact.ID AND zbstl_tagid IN (%s)) = 0)',array(ZBS_TYPE_CONTACT,$tagStr));

                }

            }

        

        #} ============ / WHERE ===============

        #} ============   SORT   ==============

				// latest log
				// Latest Contact Log (as sort) needs an additional SQL where str:
				$contact_log_types_str = '';
				$sort_function         = 'MAX';
				if ( $sortOrder !== 'DESC' ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					$sort_function = 'MIN';
				}
				if ( $withLastLog ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

					// retrieve log types to include
					$contact_log_types = $zbs->DAL->logs->contact_log_types; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

					// build sql
					if ( is_array( $contact_log_types ) ) {
						// create escaped csv
						$contact_log_types_str = $this->build_csv( $contact_log_types );
					}
				}

				// include invoices without deleted status in the total value for invoices_total_inc_deleted:
				$inv_status_query_add = $this->DAL()->invoices->get_invoice_status_except_deleted_for_query();

				// Mapped sorts
				// This catches listview and other specific sort cases
				// Note: Prefix here is a legacy leftover from the fact the AJAX List view retrieve goes through zeroBS_getCustomers() which prefixes zbsc_
				$sort_map = array(
					'zbsc_id'                   => 'ID',
					'zbsc_owner'                => 'zbs_owner',
					'zbsc_zbs_owner'            => 'zbs_owner',

					// company (name)
					'zbsc_company'              => '(SELECT zbsco_name FROM ' . $ZBSCRM_t['companies'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_to FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objtype_to = ' . ZBS_TYPE_COMPANY . ' AND zbsol_objid_from = contact.ID) ORDER BY zbsco_name ' . $sortOrder . ' LIMIT 0,1)', // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

					// sort by subquery: Logs
					// sort by latest log is effectively 'sort by last log added'
					'zbsc_latestlog'            => '(SELECT ' . $sort_function . '(zbsl_created) FROM ' . $ZBSCRM_t['logs'] . ' WHERE zbsl_objid = contact.ID AND zbsl_objtype = ' . ZBS_TYPE_CONTACT . ')', // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					// sort by latest contact log is effectively 'sort by last contact log added' (requires $withLastLog = true)
					'zbsc_lastcontacted'        => '(SELECT ' . $sort_function . '(zbsl_created) FROM ' . $ZBSCRM_t['logs'] . ' WHERE zbsl_objid = contact.ID AND zbsl_objtype = ' . ZBS_TYPE_CONTACT . ' AND zbsl_type IN (' . $contact_log_types_str . '))', // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

				// has & counts (same queries)
				// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				'zbsc_hasquote'                 => '(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['quotes'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_QUOTE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID))',
				'zbsc_hasinvoice'               => '(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['invoices'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID))',
				'zbsc_hastransaction'           => '(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['transactions'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_TRANSACTION . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID))',
				'zbsc_quotecount'               => '(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['quotes'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_QUOTE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID))',
				'zbsc_invoicecount_inc_deleted' => '(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['invoices'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID))',
				'zbsc_invoicecount'             => '(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['invoices'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID)' . $inv_status_query_add . ')',
				'zbsc_transactioncount'         => '(SELECT COUNT(ID) FROM ' . $ZBSCRM_t['transactions'] . ' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks'] . ' WHERE zbsol_objtype_from = ' . ZBS_TYPE_TRANSACTION . ' AND zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . ' AND zbsol_objid_to = contact.ID))',
				// phpcs:enable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				// following will only work if obj total value subqueries triggered above ^
				'zbsc_totalvalue'               => '((IFNULL(invoices_total,0) + IFNULL(transactions_total,0)) - IFNULL(transactions_paid_total,0))', // custom sort by total invoice value + transaction value - paid transactions (as mimicking tidy_contact php logic into SQL)
				'zbsc_transactiontotal'         => 'transactions_total',
				'zbsc_quotetotal'               => 'quotes_total',
				'zbsc_invoicetotal'             => 'invoices_total',
				);
            
            // either from $sort_map, or multi-dimensional name search
            if ( array_key_exists( $sortByField, $sort_map ) ) {

                $sortByField = $sort_map[ $sortByField ];

            } 
            elseif ( $sortByField === 'zbsc_fullname' || $sortByField === 'fullname' ) {
                               
                $sortByField = array( 'zbsc_lname' => $sortOrder, 'zbsc_fname' => $sortOrder );

            }


        #} ============ / SORT   ==============

        #} CHECK this + reset to default if faulty
        if (!in_array($whereCase,array('AND','OR'))) $whereCase = 'AND';

        #} Build out any WHERE clauses
        $wheresArr = $this->buildWheres($wheres,$whereStr,$params,$whereCase);
        $whereStr = $wheresArr['where']; $params = $params + $wheresArr['params'];
        #} / Build WHERE

        #} Ownership v1.0 - the following adds SITE + TEAM checks, and (optionally), owner
        $params = array_merge($params,$this->ownershipQueryVars($ignoreowner)); // merges in any req.
        $ownQ = $this->ownershipSQL($ignoreowner,'contact'); if (!empty($ownQ)) $additionalWhere = $this->spaceAnd($additionalWhere).$ownQ; // adds str to query
        #} / Ownership

        #} Append to sql (this also automatically deals with sortby and paging)
        $query .= $this->buildWhereStr($whereStr,$additionalWhere) . $this->buildSort($sortByField,$sortOrder) . $this->buildPaging($page,$perPage);    

        try {

            // Prep & run query
            $queryObj = $this->prepare($query,$params);


            // Catch count + return if requested
            if ( $count ) return $wpdb->get_var( $queryObj );

            // Totals override
            if ( $onlyObjTotals ){

                $contact_query = "SELECT contact.ID FROM " . $ZBSCRM_t['contacts'] . " AS contact" . $this->buildWhereStr( $whereStr, $additionalWhere );
                $contact_query = $this->prepare($contact_query,$params);

                $query = "SELECT ";

                if ( zeroBSCRM_getSetting( 'feat_quotes' ) == 1 ){

                    $query .= "(SELECT SUM(q.zbsq_value) 
                    FROM " . $ZBSCRM_t['quotes'] . " AS q 
                    INNER JOIN " . $ZBSCRM_t['objlinks'] . " AS ol
                    ON q.ID = ol.zbsol_objid_from
                    WHERE 
                    ol.zbsol_objtype_from = " . ZBS_TYPE_QUOTE . "
                    AND ol.zbsol_objtype_to = " . ZBS_TYPE_CONTACT . "
                    AND ol.zbsol_objid_to IN ( " . $contact_query . " )) AS quotes_total";

                }

                if ( zeroBSCRM_getSetting( 'feat_invs' ) == 1 ){

                    // if previous query, add comma
                    if ( $query !== "SELECT " ){
                        $query .= ", ";
                    }

							// include invoices without deleted status in the total value for invoices_total_inc_deleted:
							$inv_status_query_add = $this->DAL()->invoices->get_invoice_status_except_deleted_for_query();

							// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							$query .= '(SELECT SUM(i.zbsi_total) 
							FROM ' . $ZBSCRM_t['invoices'] . ' AS i 
							INNER JOIN ' . $ZBSCRM_t['objlinks'] . ' AS ol
							ON i.ID = ol.zbsol_objid_from
							WHERE 
							ol.zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . '
							AND ol.zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . '
							AND ol.zbsol_objid_to IN ( ' . $contact_query . ' ) ' . $inv_status_query_add . ') AS invoices_total,';

							$query .= '(SELECT SUM(inc_deleted_invoices.zbsi_total) 
							FROM ' . $ZBSCRM_t['invoices'] . ' AS inc_deleted_invoices 
							INNER JOIN ' . $ZBSCRM_t['objlinks'] . ' AS ol
							ON inc_deleted_invoices.ID = ol.zbsol_objid_from
							WHERE 
							ol.zbsol_objtype_from = ' . ZBS_TYPE_INVOICE . '
							AND ol.zbsol_objtype_to = ' . ZBS_TYPE_CONTACT . '
							AND ol.zbsol_objid_to IN ( ' . $contact_query . ' )) AS invoices_total_inc_deleted';
							// phpcs:enable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
                }

                if ( zeroBSCRM_getSetting( 'feat_transactions' ) == 1 ){

                    // if previous query, add comma
                    if ( $query !== "SELECT " ){
                        $query .= ", ";
                    }

                    // only include transactions with statuses which should be included in total value:
                    $transaction_status_query_addition = $this->DAL()->transactions->getTransactionStatusesToIncludeQuery();  

                    $query .= "(SELECT SUM(t.zbst_total) 
                    FROM " . $ZBSCRM_t['transactions'] . " AS t 
                    INNER JOIN " . $ZBSCRM_t['objlinks'] . " AS ol
                    ON t.ID = ol.zbsol_objid_from
                    WHERE 
                    ol.zbsol_objtype_from = " . ZBS_TYPE_TRANSACTION . "
                    AND ol.zbsol_objtype_to = " . ZBS_TYPE_CONTACT . "
                    AND ol.zbsol_objid_to IN ( " . $contact_query . " ) " . $transaction_status_query_addition . ") AS transactions_total, ";

                    $query .= "(SELECT SUM(assigned_transactions.zbst_total) 
                    FROM " . $ZBSCRM_t['transactions'] . " AS assigned_transactions 
                    WHERE assigned_transactions.ID IN 
                    (
                        SELECT DISTINCT zbsol_objid_from 
                        FROM " . $ZBSCRM_t['objlinks'] . " 
                        WHERE 
                        zbsol_objtype_from = " . ZBS_TYPE_TRANSACTION . " 
                        AND zbsol_objtype_to = " . ZBS_TYPE_INVOICE . " 
                        AND zbsol_objid_to IN 
                        (
                            SELECT DISTINCT zbsol_objid_from 
                            FROM " . $ZBSCRM_t['objlinks'] . " 
                            WHERE zbsol_objtype_from = " . ZBS_TYPE_INVOICE . " AND 
                            zbsol_objtype_to = " . ZBS_TYPE_CONTACT . " AND 
                            zbsol_objid_to IN ( " . $contact_query . " )
                        )
                    )) AS assigned_transactions_total";

                }

                if ( $query !== "SELECT " ){

                    $totals_data = $wpdb->get_row( $query );


                    if ( zeroBSCRM_getSetting( 'feat_invs' ) == 1 && zeroBSCRM_getSetting( 'feat_transactions' ) == 1 ){

                        // calculate a total sum (invoices + unassigned transactions)
                        $totals_data->total_sum = (float)$totals_data->invoices_total + (float)$totals_data->transactions_total - (float)$totals_data->assigned_transactions_total;
								//total_sum_inc_deleted currently factors in deleted invoices
								$totals_data->total_sum_inc_deleted = (float) $totals_data->invoices_total_inc_deleted + (float) $totals_data->transactions_total - (float) $totals_data->assigned_transactions_total;

                    } elseif ( zeroBSCRM_getSetting( 'feat_invs' ) == 1 ){

								// just include invoices in total
								$totals_data->total_sum             = (float) $totals_data->invoices_total;
								$totals_data->total_sum_inc_deleted = (float) $totals_data->invoices_total_inc_deleted;

                    } elseif ( zeroBSCRM_getSetting( 'feat_quotes' ) == 1 ){

                        // just include quotes in total
                        $totals_data->total_sum = (float)$totals_data->quotes_total;

                    }

                    // provide formatted equivilents
                    if ( zeroBSCRM_getSetting( 'feat_quotes' ) == 1 ){
                        
                        $totals_data->quotes_total_formatted = zeroBSCRM_formatCurrency( $totals_data->quotes_total );

                    }
                    if ( zeroBSCRM_getSetting( 'feat_invs' ) == 1 ){

                        $totals_data->invoices_total_formatted = zeroBSCRM_formatCurrency( $totals_data->invoices_total );

                    }
                    if ( zeroBSCRM_getSetting( 'feat_transactions' ) == 1 ){

                        $totals_data->transactions_total_formatted = zeroBSCRM_formatCurrency( $totals_data->transactions_total );
                        $totals_data->assigned_transactions_total_formatted = zeroBSCRM_formatCurrency( $totals_data->assigned_transactions_total );

                    }

                    if ( isset( $totals_data->total_sum ) ){
                        
                        $totals_data->total_sum_formatted = zeroBSCRM_formatCurrency( $totals_data->total_sum );

                    }

                } else {

                    $totals_data = null;

                }
                return $totals_data;

            }

            #} else continue..
            $potentialRes = $wpdb->get_results($queryObj, OBJECT);

        } catch (Exception $e){

            #} General SQL Err
            $this->catchSQLError($e);

        }

        #} Interpret results (Result Set - multi-row)
        if (isset($potentialRes) && is_array($potentialRes) && count($potentialRes) > 0) {

            #} Has results, tidy + return 
            foreach ($potentialRes as $resDataLine) {
                    
                    #} simplified override
                    if ($simplified){

                        $resArr = array(
                                        'id' => $resDataLine->id,
                                        'name' => $resDataLine->name,
                                        'created' => $resDataLine->created,
                                        'email' => $resDataLine->email
                                    );

                    } else if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

                        // only coumns return.
                        $resArr = array();
                        foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                            if (isset($resDataLine->$colDBKey)) $resArr[$colStr] = $resDataLine->$colDBKey;

                        }


                    } else {
                            
                        // tidy (normal)
                        $resArr = $this->tidy_contact($resDataLine,$withCustomFields);

                    }

                    if ($withTags){

                        // add all tags lines
                        $resArr['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_CONTACT,'objid'=>$resDataLine->ID));

                    }

                    if ($withDND){

                        // retrieve :) (paranoia mode)
                        $dnd = -1; $potentialDND = $this->stripSlashes($this->decodeIfJSON($resDataLine->dnd));
                        if ($potentialDND == "1") $dnd = 1;

                        $resArr['dnd'] = $dnd;
                    }


                    // ===================================================
                    // ========== #} #DB1LEGACY (TOMOVE)
                    // == Following is all using OLD DB stuff, here until we migrate inv etc.
                    // ===================================================

                    #} With most recent log? #DB1LEGACY (TOMOVE)
                    if ($withLastLog){

                        // doesn't return singular, for now using arr
                        $potentialLogs = $this->DAL()->logs->getLogsForObj(array(

                                                'objtype' => ZBS_TYPE_CONTACT,
                                                'objid' => $resDataLine->ID,
                                                
                                                'incMeta'   => true,

                                                'sortByField'   => 'zbsl_created',
                                                'sortOrder'     => 'DESC',
                                                'page'          => 0,
                                                'perPage'       => 1

                                            ));

                        if (is_array($potentialLogs) && count($potentialLogs) > 0) $resArr['lastlog'] = $potentialLogs[0];

								// CONTACT logs specifically
								// doesn't return singular, for now using arr
								$potentialLogs = $this->DAL()->logs->getLogsForObj( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
									array(

										'objtype'     => ZBS_TYPE_CONTACT,
										'objid'       => $resDataLine->ID, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

										'notetypes'   => $zbs->DAL->logs->contact_log_types, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

										'incMeta'     => true,

										'sortByField' => 'zbsl_created',
										'sortOrder'   => 'DESC',
										'page'        => 0,
										'perPage'     => 1,

									)
								);

                        if (is_array($potentialLogs) && count($potentialLogs) > 0) $resArr['lastcontactlog'] = $potentialLogs[0];

                    } 

                    #} With Assigned?
                    if ($withOwner){

                        $resArr['owner'] = zeroBS_getOwner($resDataLine->ID,true,'zerobs_customer',$resDataLine->zbs_owner);

                    }

                    if ($withAssigned){

                        /* This is for MULTIPLE (e.g. multi companies assigned to a contact)

                            // add all assigned companies
                            $res['companies'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_INVOICE,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                        .. but we use 1:1, at least now: */

                            // add all assigned companies
                            $resArr['company'] = $zbs->DAL->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_CONTACT,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                    
                    }

                            if ($withInvoices){
                            
                                #} only gets first 100?
                                //DAL3 ver, more perf, gets all
                                $resArr['invoices'] = $zbs->DAL->invoices->getInvoices(array(

                                        'assignedContact'   => $resDataLine->ID, // assigned to company id (int)
                                        'page'       => -1,
                                        'perPage'       => -1,
                                        'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE),                                    
                                        'sortByField'   => 'ID',
                                        'sortOrder'     => 'DESC'

                                    ));

                            }

                            if ($withQuotes){
                                
                                //DAL3 ver, more perf, gets all
                                $resArr['quotes'] = $zbs->DAL->quotes->getQuotes(array(

                                        'assignedContact'   => $resDataLine->ID, // assigned to company id (int)
                                        'page'       => -1,
                                        'perPage'       => -1,
                                        'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE),                                    
                                        'sortByField'   => 'ID',
                                        'sortOrder'     => 'DESC'

                                    ));

                            }

                            #} ... brutal for mvp #DB1LEGACY (TOMOVE)
                            if ($withTransactions){
                                
                                //DAL3 ver, more perf, gets all
                                $resArr['transactions'] = $zbs->DAL->transactions->getTransactions(array(

                                        'assignedContact'   => $resDataLine->ID, // assigned to company id (int)
                                        'page'       => -1,
                                        'perPage'       => -1,
                                        'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION),                                    
                                        'sortByField'   => 'ID',
                                        'sortOrder'     => 'DESC'

                                    ));

                            }

                            #} ... brutal for mvp #DB1LEGACY (TOMOVE)
                            if ($withTasks){
                                
                                //DAL3 ver, more perf, gets all
                                $res['tasks'] = $zbs->DAL->events->getEvents(array(

                                        'assignedContact'   => $resDataLine->ID, // assigned to company id (int)
                                        'page'       => -1,
                                        'perPage'       => -1,
                                        'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TASK),                                    
                                        'sortByField'   => 'zbse_start',
                                        'sortOrder'     => 'DESC',
                                        'withAssigned'  => false // no need, it's assigned to this obj already

                                    ));

                            }

                            // simplistic, could be optimised (though low use means later.)
                            if ( $withExternalSources ){
                                
                                $res['external_sources'] = $zbs->DAL->contacts->getExternalSourcesForContact(array(
    
                                    'contactID'=> $resDataLine->ID,

                                    'sortByField'   => 'ID',
                                    'sortOrder'     => 'ASC',
                                    'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT )

                                ));

                            }
                            if ( $withExternalSourcesGrouped ){
                                
                                $res['external_sources'] = $zbs->DAL->getExternalSources( -1, array(
                                
                                    'objectID'          => $resDataLine->ID, 
                                    'objectType'        => ZBS_TYPE_CONTACT,
                                    'grouped_by_source' => true,
                                    'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT )

                                ));

                            }

                    //}

                    // ===================================================
                    // ========== / #DB1LEGACY (TOMOVE)
                    // ===================================================


                    $res[] = $resArr;

            }
        }

        return $res;
    } 



     /**
     * adds or updates a contact object
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
     // Previously DAL->addUpdateContact
    public function addUpdateContact($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;
            
        #} Retrieve any cf
        $customFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_CONTACT));
        $addrCustomFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_ADDRESS));

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'owner'         => -1,

            // fields (directly)
            'data'          => array(

                'email' => '', // Unique Field ! 

                'status' => '',
                'prefix' => '',
                'fname' => '',
                'lname' => '',
                'addr1' => '',
                'addr2' => '',
                'city' => '',
                'county' => '',
                'country' => '',
                'postcode' => '',
                'secaddr1' => '',
                'secaddr2' => '',
                'seccity' => '',
                'seccounty' => '',
                'seccountry' => '',
                'secpostcode' => '',
                'hometel' => '',
                'worktel' => '',
                'mobtel' => '',
                'wpid'  => -1,
                'avatar' => '',

                // social basics :)
                'tw' => '',
                'fb' => '',
                'li' => '',

                // Note Custom fields may be passed here, but will not have defaults so check isset()

                // tags
                'tags' => -1, // pass an array of tag ids or tag strings
                'tag_mode' => 'replace', // replace|append|remove

                'externalSources' => -1, // if this is an array(array('source'=>src,'uid'=>uid),multiple()) it'll add :)

                'companies' => -1, // array of co id's :)


                // wh added for later use.
                'lastcontacted' => -1,
                // allow this to be set for MS sync etc.
                'created' => -1,

                // add/update aliases
                'aliases' => -1, // array of email strings (will be verified)

            ),

            'limitedFields' => -1, // if this is set it OVERRIDES data (allowing you to set specific fields + leave rest in tact)
            // ^^ will look like: array(array('key'=>x,'val'=>y,'type'=>'%s'))

            // this function as DAL1 func did. 
            'extraMeta'     => -1,
            'automatorPassthrough' => -1,
            'fallBackLog' => -1,

            'silentInsert' => false, // this was for init Migration - it KILLS all IA for newContact (because is migrating, not creating new :) this was -1 before


            'do_not_update_blanks' => false // this allows you to not update fields if blank (same as fieldoverride for extsource -> in)

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        
            // Needs this to grab custom fields (if passed) too :)
            if (is_array($customFields)) foreach ($customFields as $cK => $cF){

                // only for data, limited fields below
                if (is_array($data)) {

                    if (isset($args['data'][$cK])) $data[$cK] = $args['data'][$cK];

                }

            }

            /* NOT REQ: // Needs this to grab custom addr fields (if passed) too :)
            if (is_array($addrCustomFields)) foreach ($addrCustomFields as $cK => $cF){

                // only for data, limited fields below
                if (is_array($data)) {

                    //if (isset($args['data'][$cK])) $data[$cK] = $args['data'][$cK];

                }

            } */

            // this takes limited fields + checks through for custom fields present
            // (either as key zbsc_source or source, for example)
            // then switches them into the $data array, for separate update
            // where this'll fall over is if NO normal contact data is sent to update, just custom fields
            if (is_array($limitedFields) && is_array($customFields)){

                    //$customFieldKeys = array_keys($customFields);
                    $newLimitedFields = array();

                    // cycle through
                    foreach ($limitedFields as $field){

                        // some weird case where getting empties, so added check
                        if (isset($field['key']) && !empty($field['key'])){ 

						$dePrefixed = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						if ( str_starts_with( $field['key'], 'zbsc_' ) ) {
							$dePrefixed = substr( $field['key'], strlen( 'zbsc_' ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						}

                            if (isset($customFields[$field['key']])){

                                // is custom, move to data
                                $data[$field['key']] = $field['val'];

                            } else if (!empty($dePrefixed) && isset($customFields[$dePrefixed])){

                                // is custom, move to data
                                $data[$dePrefixed] = $field['val'];

                            } else {

                                // add it to limitedFields (it's not dealt with post-update)
                                $newLimitedFields[] = $field;
                            }

                        }

                    }

                    // move this back in
                    $limitedFields = $newLimitedFields;
                    unset($newLimitedFields);

                }

        #} =========== / LOAD ARGS ============

        #} ========== CHECK FIELDS ============
            
            $id = (int)$id;
            
            // here we check that the potential owner CAN even own
            if (
                // no owner specified
                !isset($owner) ||
                // specified owner is not an admin
                !user_can($owner,'admin_zerobs_usr')
            ) {
                $owner = -1;
            }


            if (is_array($limitedFields)){ 

                // LIMITED UPDATE (only a few fields.)
				// phpcs:ignore
				if ( count( $limitedFields ) === 0 ) {
					return false;
				}
                // REQ. ID too (can only update)
                if (empty($id) || $id <= 0) return false;

            } else {

                // NORMAL, FULL UPDATE

                // check email + load that user if present
                if (!isset($data['email']) || empty($data['email'])){

                    // no email
                    // Allow users without emails? WH removed this for db1->2 migration
                    // leaving this in breaks MIGRATIONS from DAL 1
                    // in that those contacts without emails will not be copied in
                    // return false;

                } else {

                    // email present, check if it matches ID? 
                    if (!empty($id) && $id > 0){

                        // if ID + email, check if existing contact with email, (e.g. in use)
                        // ... allow it if the ID of that email contact matches the ID given here
                        // (else e.g. add email x to ID y without checking)
                        $potentialUSERID = (int)$this->getContact(-1,array('email'=>$data['email'],'ignoreOwner'=>1,'onlyID'=>1));
                        if (!empty($potentialUSERID) && $potentialUSERID > 0 && $id > 0 && $potentialUSERID != $id){

                            // email doesn't match ID 
                            return false;
                        }

                        // also check if has rights?!? Could be just email passed here + therefor got around owner check? hmm.

                    } else {

                        // no ID, check if email present, and then update that user if so
                        $potentialUSERID = (int)$this->getContact(-1,array('email'=>$data['email'],'ignoreOwner'=>1,'onlyID'=>1));
                        if (isset($potentialUSERID) && !empty($potentialUSERID) && $potentialUSERID > 0) { $id = $potentialUSERID; }

                    }


                }


                // companies
                if (isset($data['companies']) && is_array($data['companies'])){


                    $coArr = array();
                    /* 
                    there was a bug happening here where same company could get dude at a few times... 
                    so for now only use the first company */
                    /*
                    foreach ($data['companies'] as $c){
                        $cI = (int)$c;
                        if ($cI > 0 && !in_array($cI, $coArr)) $coArr[] = $cI;
                    }*/

                    $cI = (int)$data['companies'][0];
                    if ($cI > 0 && !in_array($cI, $coArr)) $coArr[] = $cI;

                    // reset the main
                    if (count($coArr) > 0) 
                        $data['companies'] = $coArr; 
                    else
                        $data['companies'] = 'unset';
                    unset($coArr);

                }


            }

            // If no status passed or previously set, use the default status
            if ( empty($data['status'] ) ) {

                // copy any previously set
                $data['status'] = $this->getContactStatus($id);
                    
                // if not previously set, use default
                if (empty($data['status'])) $data['status'] = zeroBSCRM_getSetting('defaultstatus');

            }

        #} ========= / CHECK FIELDS ===========


        #} ========= OVERRIDE SETTING (Deny blank overrides) ===========

            // this only functions if externalsource is set (e.g. api/form, etc.)
            if (isset($data['externalSources']) && is_array($data['externalSources']) && count($data['externalSources']) > 0) {
                if (zeroBSCRM_getSetting('fieldoverride') == "1"){

                    $do_not_update_blanks = true;

                }

            }

				// either ext source + setting, or set by the func call
				if ( $do_not_update_blanks ) {

                    // this setting says 'don't override filled-out data with blanks'
                    // so here we check through any passed blanks + convert to limitedFields
                    // only matters if $id is set (there is somt to update not add
                    if (isset($id) && !empty($id) && $id > 0){

                        // get data to copy over (for now, this is required to remove 'fullname' etc.)
                        $dbData = $this->db_ready_contact($data); 
                        //unset($dbData['id']); // this is unset because we use $id, and is update, so not req. legacy issue
                        //unset($dbData['created']); // this is unset because this uses an obj which has been 'updated' against original details, where created is output in the WRONG format :)

                        $origData = $data; //$data = array();               
                        $limitedData = array(); // array(array('key'=>'zbsc_x','val'=>y,'type'=>'%s'))

                        // cycle through + translate into limitedFields (removing any blanks, or arrays (e.g. externalSources))
                        // we also have to remake a 'faux' data (removing blanks for tags etc.) for the post-update updates
                        foreach ($dbData as $k => $v){

                            $intV = (int)$v;

                            // only add if valuenot empty
                            if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){

                                // add to update arr
                                $limitedData[] = array(
                                    'key' => 'zbsc_'.$k, // we have to add zbsc_ here because translating from data -> limited fields
                                    'val' => $v,
                                    'type' => $this->getTypeStr('zbsc_'.$k)
                                );                              

                                // add to remade $data for post-update updates
                                $data[$k] = $v;

                            }

                        }

                        // copy over
                        $limitedFields = $limitedData;

                    } // / if ID

				} // / if do_not_update_blanks

				// ========= / OVERRIDE SETTING (Deny blank overrides) ===========

				// ========= BUILD DATA ===========

				// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase -- to be refactoerd later.
				$update                    = false;
				$dataArr                   = array();
				$typeArr                   = array();
				$contactsPreUpdateSegments = array();

				if ( is_array( $limitedFields ) ) {

					// LIMITED FIELDS
					$update = true;

					// cycle through
					foreach ( $limitedFields as $field ) {

						// some weird case where getting empties, so added check
						if ( empty( $field['key'] ) ) {
							continue;
						}
						// Created date field is immutable. Skip.
						if ( $field['key'] === 'zbsc_created' ) {
							continue;
						}

						$dataArr[ $field['key'] ] = $field['val'];
						$typeArr[]                = $field['type'];
					}

					// add update time
					if ( ! isset( $dataArr['zbsc_lastupdated'] ) ) {
						$dataArr['zbsc_lastupdated'] = time();
						$typeArr[]                   = '%d';
					}
				} else {

					// FULL UPDATE/INSERT

					// UPDATE
					$dataArr = array(

						'zbs_owner'        => $owner,

						// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- to be refactored.
						// fields
						'zbsc_status'      => $data['status'],
						'zbsc_email'       => $data['email'],
						'zbsc_prefix'      => $data['prefix'],
						'zbsc_fname'       => $data['fname'],
						'zbsc_lname'       => $data['lname'],
						'zbsc_addr1'       => $data['addr1'],
						'zbsc_addr2'       => $data['addr2'],
						'zbsc_city'        => $data['city'],
						'zbsc_county'      => $data['county'],
						'zbsc_country'     => $data['country'],
						'zbsc_postcode'    => $data['postcode'],
						'zbsc_secaddr1'    => $data['secaddr1'],
						'zbsc_secaddr2'    => $data['secaddr2'],
						'zbsc_seccity'     => $data['seccity'],
						'zbsc_seccounty'   => $data['seccounty'],
						'zbsc_seccountry'  => $data['seccountry'],
						'zbsc_secpostcode' => $data['secpostcode'],
						'zbsc_hometel'     => $data['hometel'],
						'zbsc_worktel'     => $data['worktel'],
						'zbsc_mobtel'      => $data['mobtel'],
						'zbsc_wpid'        => $data['wpid'],
						'zbsc_avatar'      => $data['avatar'],

						'zbsc_tw'          => $data['tw'],
						'zbsc_fb'          => $data['fb'],
						'zbsc_li'          => $data['li'],

						'zbsc_lastupdated' => time(),
					);

						// if set.
					if ( $data['lastcontacted'] !== -1 ) {
						$dataArr['zbsc_lastcontacted'] = $data['lastcontacted'];
					}

					$typeArr = array( // field data types
						// '%d',  // site
						// '%d',  // team
						'%d',    // owner
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%s',
						'%d',
						'%s',
						'%s',
						'%s',
						'%s',
						'%d',   // last updated
					);
					// if set
					if ( $data['lastcontacted'] !== -1 ) {
						$typeArr[] = '%d';
					}

					if ( ! empty( $id ) && $id > 0 ) {

						// is update
						$update = true;

					} else {

						// INSERT (get's few extra :D)
						$update              = false;
						$dataArr['zbs_site'] = zeroBSCRM_site();
						$typeArr[]           = '%d';
						$dataArr['zbs_team'] = zeroBSCRM_team();
						$typeArr[]           = '%d';

						if ( isset( $data['created'] ) && ! empty( $data['created'] ) && $data['created'] !== -1 ) {
							$dataArr['zbsc_created'] = $data['created'];
							$typeArr[]               = '%d';
						} else {
							$dataArr['zbsc_created'] = time();
							$typeArr[]               = '%d';
							}

							$dataArr['zbsc_lastcontacted'] = -1;
							$typeArr[]                     = '%d';
						}
					}
        #} ========= / BUILD DATA ===========

        #} ============================================================
        #} ========= CHECK force_uniques & not_empty & max_len ========

            // if we're passing limitedFields we skip these, for now 
            // #v3.1 - would make sense to unique/nonempty check just the limited fields. #gh-145
            if (!is_array($limitedFields)){

                // verify uniques
                if (!$this->verifyUniqueValues($data,$id)) return false; // / fails unique field verify

                // verify not_empty
                if (!$this->verifyNonEmptyValues($data)) return false; // / fails empty field verify

            }

					// whatever we do we check for max_len breaches and abbreviate to avoid wpdb rejections
					$dataArr = $this->wpdbChecks( $dataArr );
            
					// CHECK force_uniques & not_empty

					// Check if ID present
					if ( $update ) {

						// Check if obj exists (here) - for now just brutal update (will error when doesn't exist)
						$originalStatus = $this->getContactStatus( $id );

						$previous_contact_obj = $this->getContact( $id );

						// get any segments (whom counts may be affected by changes)
						// $contactsPreUpdateSegments = $this->DAL()->segments->getSegmentsContainingContact($id,true);

						// log any change of status
						if ( isset( $dataArr['zbsc_status'] ) && ! empty( $dataArr['zbsc_status'] ) && ! empty( $originalStatus ) && $dataArr['zbsc_status'] !== $originalStatus ) {

							// status change
							$statusChange = array(
								'from' => $originalStatus,
								'to'   => $dataArr['zbsc_status'],
							);
						}

						// Attempt update
                if ($wpdb->update( 
                        $ZBSCRM_t['contacts'], 
                        $dataArr, 
                        array( // where
                            'ID' => $id
                            ),
                        $typeArr,
                        array( // where data types
                            '%d'
                            )) !== false){

                            // if passing limitedFields instead of data, we ignore the following
                                // this doesn't work, because data is in args default as arr
                                //if (isset($data) && is_array($data)){
                                // so...
                            if (!isset($limitedFields) || !is_array($limitedFields) || $limitedFields == -1){

                                // tags
                                if (isset($data['tags']) && is_array($data['tags'])) {

                                    $this->addUpdateContactTags(
                                        array(
                                            'id' => $id,
                                            'tag_input' => $data['tags'],
                                            'mode' => $data['tag_mode']
                                        )
                                    );

                                }

                                // externalSources
                                $approvedExternalSource = $this->DAL()->addUpdateExternalSources(
                                    array(
                                        'obj_id'           => $id,
                                        'obj_type_id'      => ZBS_TYPE_CONTACT,
                                        'external_sources' => isset($data['externalSources']) ? $data['externalSources'] : array(),
                                    )
                                ); // for IA below

                                // co's work?
                                // OBJ LINKS - to companies (1liner now as genericified)
                                $this->addUpdateObjectLinks($id,$data['companies'],ZBS_TYPE_COMPANY);


                                // Aliases
                                // Maintain an array of AKA emails
                                if (isset($data['aliases']) && is_array($data['aliases'])){
                                    
                                    $existingAliasesSimple = array();
                                    $existingAliases = zeroBS_getObjAliases(ZBS_TYPE_CONTACT,$id);
                                    if (!is_array($existingAliases)) $existingAliases = array();

                                    // compare
                                    if (is_array($existingAliases)) foreach ($existingAliases as $alias){

                                            // is this alias in the new list?
                                            if (in_array($alias['aka_alias'], $data['aliases'])) {
                                                $existingAliasesSimple[] = $alias['aka_alias'];
                                                continue;
                                            }

                                            // it's not in the new list, thus, remove it:
                                            // this could be a smidgen more performant if it just deleted the line
                                            zeroBS_removeObjAlias(ZBS_TYPE_CONTACT,$id,$alias['aka_alias']);

                                    }
                                    foreach ($data['aliases'] as $alias){

                                        // valid?
                                        if (zeroBS_canUseCustomerAlias($alias)){

                                            // is this alias in the existing list? (nothing to do)
                                            if (in_array($alias, $existingAliasesSimple)) continue;

                                            // it's not in the existing list, thus, add it:
                                            zeroBS_addObjAlias(ZBS_TYPE_CONTACT,$id,$alias);

                                        } else {

                                            // err - tried to use an invalid alias                            
                                            $msg = __('Could not add alias (unavailable or invalid):','zero-bs-crm').' '.$alias;
                                            $zbs->DAL->addError(307,$this->objectType,$msg,$alias);

                                        }

                                    }

                                }


                            } // / if $data/limitedData


                            // 2.98.1+ ... custom fields should update if present, regardless of limitedData rule
                            // ... UNLESS BLANK!
                            // Custom fields?

                            #} Cycle through + add/update if set
                            if (is_array($customFields)) foreach ($customFields as $cK => $cF){

                                // any?
                                if (isset($data[$cK])){

                                    // updating blanks?
                                    if ($do_not_update_blanks && empty($data[$cK])){

                                        // skip it

                                    } else {

                                        // it's either not in do_not_update_blank mode, or it has a val

                                        // add update
                                        $cfID = $this->addUpdateCustomField(array(
                                            'data'  => array(
                                                    'objtype'   => ZBS_TYPE_CONTACT,
                                                    'objid'     => $id,
                                                    'objkey'    => $cK,
                                                    'objval'    => $data[$cK]
                                            )));

                                    }

                                }

                            }  

                            // Also got to catch any 'addr' custom fields :) 
                            if (is_array($addrCustomFields) && count($addrCustomFields) > 0){

                                // cycle through addr custom fields + save
                                // see #ZBS-518, not easy until addr's get DAL2
                                // WH deferring here
                                // WH later added via the addUpdateContactField method - should work fine if we catch properly in get
                                foreach ($addrCustomFields as $cK => $cF){

                                    // v2:
                                    //$cKN = (int)$cK+1;
                                    //$cKey = 'addr_cf'.$cKN;
                                    //$cKey2 = 'secaddr_cf'.$cKN;
                                    // v3:                    
                                    $cKey = 'addr_'.$cK;
                                    $cKey2 = 'secaddr_'.$cK;

                                    if (isset($data[$cKey])){

                                        // updating blanks?
                                        if ($do_not_update_blanks && empty($data[$cKey])){

                                            // skip it

                                        } else {

                                            // it's either not in do_not_update_blank mode, or it has a val

                                            // add update
                                            $cfID = $this->addUpdateCustomField(array(
                                                'data'  => array(
                                                        'objtype'   => ZBS_TYPE_CONTACT,
                                                        'objid'     => $id,
                                                        'objkey'    => $cKey,
                                                        'objval'    => $data[$cKey]
                                                )));

                                        }

                                    }

                                    // any?
                                    if (isset($data[$cKey2])){

                                        // updating blanks?
                                        if ($do_not_update_blanks && empty($data[$cKey2])){

                                            // skip it

                                        } else {

                                            // it's either not in do_not_update_blank mode, or it has a val

                                            // add update
                                            $cfID = $this->addUpdateCustomField(array(
                                                'data'  => array(
                                                        'objtype'   => ZBS_TYPE_CONTACT,
                                                        'objid'     => $id,
                                                        'objkey'    => $cKey2,
                                                        'objval'    => $data[$cKey2]
                                                )));

                                        }

                                    }

                                }


                            }

                            // / Custom Fields

                            #} Any extra meta keyval pairs?
                            // BRUTALLY updates (no checking)
                            $confirmedExtraMeta = false;
                            if (isset($extraMeta) && is_array($extraMeta)) {

                                $confirmedExtraMeta = array();

                                    foreach ($extraMeta as $k => $v){

                                    #} This won't fix stupid keys, just catch basic fails... 
                                    $cleanKey = strtolower(str_replace(' ','_',$k));

                                    #} Brutal update
                                    //update_post_meta($postID, 'zbs_customer_extra_'.$cleanKey, $v);
                                    $this->DAL()->updateMeta(ZBS_TYPE_CONTACT,$id,'extra_'.$cleanKey,$v);

                                    #} Add it to this, which passes to IA
                                    $confirmedExtraMeta[$cleanKey] = $v;

                                }

                            }


                            #} INTERNAL AUTOMATOR 
                            #} & 
                            #} FALLBACKS
                            // UPDATING CONTACT
                            if (!$silentInsert){

                                #} FALLBACK 
                                #} (This fires for customers that weren't added because they already exist.)
                                #} e.g. x@g.com exists, so add log "x@g.com filled out form"
                                #} Requires a type and a shortdesc
                                if (
                                    isset($fallBackLog) && is_array($fallBackLog) 
                                    && isset($fallBackLog['type']) && !empty($fallBackLog['type'])
                                    && isset($fallBackLog['shortdesc']) && !empty($fallBackLog['shortdesc'])
                                ){

                                    #} Brutal add, maybe validate more?!

                                    #} Long desc if present:
                                    $zbsNoteLongDesc = ''; if (isset($fallBackLog['longdesc']) && !empty($fallBackLog['longdesc'])) $zbsNoteLongDesc = $fallBackLog['longdesc'];

                                        #} Only raw checked... but proceed.
                                        $newOrUpdatedLogID = zeroBS_addUpdateContactLog($id,-1,-1,array(
                                            #} Anything here will get wrapped into an array and added as the meta vals
                                            'type' => $fallBackLog['type'],
                                            'shortdesc' => $fallBackLog['shortdesc'],
                                            'longdesc' => $zbsNoteLongDesc
                                        ));


                                }

                                // catch dirty flag (update of status) (note, after update_post_meta - as separate)
                                //if (isset($_POST['zbsc_status_dirtyflag']) && $_POST['zbsc_status_dirtyflag'] == "1"){
                                // actually here, it's set above
                                if (isset($statusChange) && is_array($statusChange)){

                                    // status has changed

                                    // IA
                                    zeroBSCRM_FireInternalAutomator('contact.status.update',array(
                                        'id'=>$id,
                                        'againstid' => $id,
                                        'userMeta'=> $dataArr,
                                        'from' => $statusChange['from'],
                                        'to' => $statusChange['to']
                                        ));

                                }


                                // IA General contact update (2.87+)
                                zeroBSCRM_FireInternalAutomator('contact.update',array(
                                    'id'=>$id,
                                    'againstid' => $id,
                                    'userMeta'=> $dataArr,
									'prevSegments' => $contactsPreUpdateSegments,
									'prev_contact' => $previous_contact_obj,
                                    ));

								$dataArr['id'] = $id;
								$this->events_manager->contact()->updated( $dataArr, $previous_contact_obj );

                            }

                                
                            // Successfully updated - Return id
                            return $id;

                        } else {
                            
                            $msg = __('DB Update Failed','zero-bs-crm');                    
                            $zbs->DAL->addError(302,$this->objectType,$msg,$dataArr);

                            // FAILED update
                            return false;

                        }

        } else {
            
            #} No ID - must be an INSERT
            if ($wpdb->insert( 
                        $ZBSCRM_t['contacts'], 
                        $dataArr, 
                        $typeArr ) > 0){

                    #} Successfully inserted, lets return new ID
                    $newID = $wpdb->insert_id;

                    // tags
                    if (isset($data['tags']) && is_array($data['tags'])) {

                        $this->addUpdateContactTags(
                            array(
                                'id' => $newID,
                                'tag_input' => $data['tags'],
                                'mode' => $data['tag_mode']
                            )
                        );

                    }

                    // externalSources
                    $approvedExternalSource = $this->DAL()->addUpdateExternalSources(
                        array(
                            'obj_id'           => $newID,
                            'obj_type_id'      => ZBS_TYPE_CONTACT,
                            'external_sources' => isset($data['externalSources']) ? $data['externalSources'] : array(),
                        )
                    ); // for IA below

                    // co's work?
                    // OBJ LINKS - to companies (1liner now as genericified)
                    $this->addUpdateObjectLinks($newID,$data['companies'],ZBS_TYPE_COMPANY);
                    /*
                    if (isset($data['companies']) && is_array($data['companies']) && count($data['companies']) > 0) 
                        $this->DAL()->addUpdateObjLinks(array(
                                                        'objtypefrom'       => ZBS_TYPE_CONTACT,
                                                        'objtypeto'         => ZBS_TYPE_COMPANY,
                                                        'objfromid'         => $newID,
                                                        'objtoids'          => $data['companies']));
                    */


                    // Aliases
                    // Maintain an array of AKA emails
                    if (isset($data['aliases']) && is_array($data['aliases'])){
                        
                        $existingAliasesSimple = array();
                        $existingAliases = zeroBS_getObjAliases(ZBS_TYPE_CONTACT,$newID);
                        if (!is_array($existingAliases)) $existingAliases = array();

                        // compare
                        if (is_array($existingAliases)) foreach ($existingAliases as $alias){                            

                            // is this alias in the new list?
                            if (in_array($alias['aka_alias'], $data['aliases'])) {
                                $existingAliasesSimple[] = $alias['aka_alias'];
                                continue;
                            }

                            // it's not in the new list, thus, remove it:
                            // this could be a smidgen more performant if it just deleted the line
                            zeroBS_removeObjAlias(ZBS_TYPE_CONTACT,$newID,$alias['aka_alias']);

                        }
                        foreach ($data['aliases'] as $alias){

                            // valid?
                            if (zeroBS_canUseCustomerAlias($alias)){

                                // is this alias in the existing list? (nothing to do)
                                if (in_array($alias, $existingAliasesSimple)) continue;

                                // it's not in the existing list, thus, add it:
                                zeroBS_addObjAlias(ZBS_TYPE_CONTACT,$newID,$alias);

                            } else {

                                // err - tried to use an invalid alias                            
                                $msg = __('Could not add alias (unavailable or invalid):','zero-bs-crm').' '.$alias;
                                $zbs->DAL->addError(307,$this->objectType,$msg,$alias);

                            }

                        }

                    }

                    // Custom fields?

                        #} Cycle through + add/update if set
                        if (is_array($customFields)) foreach ($customFields as $cK => $cF){

                            // any?
                            if (isset($data[$cK])){

                                // add update
                                $cfID = $this->DAL()->addUpdateCustomField(array(
                                    'data'  => array(
                                            'objtype'   => ZBS_TYPE_CONTACT,
                                            'objid'     => $newID,
                                            'objkey'    => $cK,
                                            'objval'    => $data[$cK]
                                    )));

                            }

                        }
                        

                        // Also got to catch any 'addr' custom fields :) 
                        if (is_array($addrCustomFields) && count($addrCustomFields) > 0){

                            // cycle through addr custom fields + save
                            // see #ZBS-518, not easy until addr's get DAL2
                            // WH deferring here
                            // WH later added via the addUpdateContactField method - should work fine if we catch properly in get
                            foreach ($addrCustomFields as $cK => $cF){

                                // v2:
                                //$cKN = (int)$cK+1;
                                //$cKey = 'addr_cf'.$cKN;
                                //$cKey2 = 'secaddr_cf'.$cKN;
                                // v3:                    
                                $cKey = 'addr_'.$cK;
                                $cKey2 = 'secaddr_'.$cK;

                                if (isset($data[$cKey])){

                                    // add update
                                    $cfID = $this->DAL()->addUpdateCustomField(array(
                                        'data'  => array(
                                                'objtype'   => ZBS_TYPE_CONTACT,
                                                'objid'     => $newID,
                                                'objkey'    => $cKey,
                                                'objval'    => $data[$cKey]
                                        )));

                                }

                                // any?
                                if (isset($data[$cKey2])){

                                    // add update
                                    $cfID = $this->DAL()->addUpdateCustomField(array(
                                        'data'  => array(
                                                'objtype'   => ZBS_TYPE_CONTACT,
                                                'objid'     => $newID,
                                                'objkey'    => $cKey2,
                                                'objval'    => $data[$cKey2]
                                        )));

                                }
								// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable


                            }


                        }

                    // / Custom Fields

                    #} Any extra meta keyval pairs?
                    // BRUTALLY updates (no checking)
                    $confirmedExtraMeta = false;
                    if (isset($extraMeta) && is_array($extraMeta)) {

                        $confirmedExtraMeta = array();

                            foreach ($extraMeta as $k => $v){

                            #} This won't fix stupid keys, just catch basic fails... 
                            $cleanKey = strtolower(str_replace(' ','_',$k));

                            #} Brutal update
                            //update_post_meta($postID, 'zbs_customer_extra_'.$cleanKey, $v);
                            $this->DAL()->updateMeta(ZBS_TYPE_CONTACT,$newID,'extra_'.$cleanKey,$v);

                            #} Add it to this, which passes to IA
                            $confirmedExtraMeta[$cleanKey] = $v;

                        }

                    }



                    #} INTERNAL AUTOMATOR 
                    #} & 
                    #} FALLBACKS
                    // NEW CONTACT

                   // zbs_write_log("ABOUT TO HIT THE AUTOMATOR... " . $silentInsert);

                    if (!$silentInsert){

                        //zbs_write_log("HITTING IT NOW...");

                        #} Add to automator
                        zeroBSCRM_FireInternalAutomator('contact.new',array(
                            'id'=>$newID,
                            'customerMeta'=>$dataArr,
                            'extsource'=>$approvedExternalSource,
                            'automatorpassthrough'=>$automatorPassthrough, #} This passes through any custom log titles or whatever into the Internal automator recipe.
                            'customerExtraMeta'=>$confirmedExtraMeta #} This is the "extraMeta" passed (as saved)
                        ));

						$dataArr['ID'] = $newID; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect
						$this->events_manager->contact()->created( $dataArr ); // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect

                    }
                    
                    return $newID;

                } else {
                            
                    $msg = __('DB Insert Failed','zero-bs-crm');                    
                    $zbs->DAL->addError(303,$this->objectType,$msg,$dataArr);
					// phpcs:enable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

                    #} Failed to Insert
                    return false;

                }

        }

        return false;

    }

     /**
     * adds or updates a contact's tags
     * ... this is really just a wrapper for addUpdateObjectTags
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateContactTags($args=array()){

        global $ZBSCRM_t,$wpdb;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            
            // generic pass-through (array of tag strings or tag IDs):
            'tag_input'     => -1,

            // or either specific:
            'tagIDs'        => -1,
            'tags'          => -1,

            'mode'          => 'append'

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} ========== CHECK FIELDS ============

            // check id
            $id = (int)$id; if (empty($id) || $id <= 0) return false;

        #} ========= / CHECK FIELDS ===========     

        return $this->DAL()->addUpdateObjectTags(
            array(
                'objtype'   => ZBS_TYPE_CONTACT,
                'objid'     => $id,
                'tag_input' => $tag_input,
                'tags'      => $tags,
                'tagIDs'    => $tagIDs,
                'mode'      => $mode
            )
        );

    }

     /**
     * adds or updates a contact's company links
     * ... this is really just a wrapper for addUpdateObjLinks
     * fill in for zbsCRM_addUpdateCustomerCompany + zeroBS_setCustomerCompanyID
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateContactCompanies($args=array()){

        global $ZBSCRM_t,$wpdb;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'                => -1,
            'companyIDs'        => -1

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} ========== CHECK FIELDS ============

            // check id
            $id = (int)$id; if (empty($id) || $id <= 0) return false;

            // if owner = -1, add current
            if (!isset($owner) || $owner === -1) $owner = zeroBSCRM_user();

            // check co id's
            if (!is_array($companyIDs)) $companyIDs = array();

        #} ========= / CHECK FIELDS ===========
                            
        return $this->DAL()->addUpdateObjLinks(array(
                'objtypefrom'       => ZBS_TYPE_CONTACT,
                'objtypeto'         => ZBS_TYPE_COMPANY,
                'objfromid'         => $id,
                'objtoids'          => $companyIDs));

    }

     /**
     * adds or updates a contact's WPID
     * ... this is really just a wrapper for addUpdateContact
     * ... and replaces zeroBS_setCustomerWPID
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateContactWPID($args=array()){

        global $ZBSCRM_t,$wpdb;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'WPID'          => -1

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} ========== CHECK FIELDS ============

            // if owner = -1, add current
            if (!isset($owner) || $owner === -1) $owner = zeroBSCRM_user();

            // check id
            $id = (int)$id; if (empty($id) || $id <= 0) return false;

            // WPID may be -1 (NULL)
            // -1 does okay here if ($WPID == -1) $WPID = '';

        #} ========= / CHECK FIELDS ===========


        #} Enact
        return $this->addUpdateContact(array(
            'id'            =>  $id,
            'limitedFields' =>array(
                array('key'=>'zbsc_wpid','val'=>$WPID,'type'=>'%d')
                )));

    

    }

     /**
     * deletes a contact object
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteContact($args=array()){

			global $zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'saveOrphans'   => true

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} Before we actually delete - allow a hook and pass the args (which is just the id and whether saveOrphans or not)
        zeroBSCRM_FireInternalAutomator('contact.before.delete',array(
            'id'=>$id,
            'saveOrphans'=>$saveOrphans
        ));
			// phpcs:ignore
			$this->events_manager->contact()->before_delete( $id );

        #} Check ID & Delete :)
        $id = (int)$id;
        if (!empty($id) && $id > 0) {
            
            // delete orphans?
            if ($saveOrphans === false){

                #DB1LEGACY (TOMOVE -> where)
                // delete quotes
                $qs = zeroBS_getQuotesForCustomer($id,false,1000000,0,false,false);
                foreach ($qs as $q){

                    // delete post
                    if ($zbs->isDAL3()){
                        $res = $zbs->DAL->quotes->deleteQuote(array('id'=>$q['id'],'saveOrphans'=>false));
                    } else 
                        // DAL2 < - not forced?
                        $res = wp_delete_post($q['id'],false);

                } unset($qs);

                #DB1LEGACY (TOMOVE -> where)
                // delete invoices
                $is = zeroBS_getInvoicesForCustomer($id,false,1000000,0,false);
                foreach ($is as $i){

                    // delete post
                    if ($zbs->isDAL3()){
                        $res = $zbs->DAL->invoices->deleteInvoice(array('id'=>$i['id'],'saveOrphans'=>false));
                    } else 
                        // DAL2 <  not forced?
                        $res = wp_delete_post($i['id'],false);

                } unset($qs);

                #DB1LEGACY (TOMOVE -> where)
                // delete transactions
                $trans = zeroBS_getTransactionsForCustomer($id,false,1000000,0,false);
                foreach ($trans as $tran){

                    // delete post
                    if ($zbs->isDAL3()){
                        $res = $zbs->DAL->transactions->deleteTransaction(array('id'=>$tran['id'],'saveOrphans'=>false));
                    } else 
                        // DAL2 <  - not forced?
                        $res = wp_delete_post($tran['id'],false);

                } unset($trans);

                // delete events
                $events = zeroBS_getEventsByCustomerID($id,false,1000000,0,false);
                foreach ($events as $event){

                    // delete post
                    if ($zbs->isDAL3()){
                        $res = $zbs->DAL->events->deleteEvent(array('id'=>$event['id'],'saveOrphans'=>false));
                    } else {
                        // DAL2 <  - not forced?
                        // this wasn't ever written.
                    }

                } unset($events);


                // delete any tag links
                $this->DAL()->deleteTagObjLinks(array(

                        'objtype'       => ZBS_TYPE_CONTACT,
                        'objid'         => $id
                ));


                // delete any external source information
                $this->DAL()->delete_external_sources( array(

                    'obj_type'       => ZBS_TYPE_CONTACT,
                    'obj_id'         => $id,
                    'obj_source'    => 'all',

                ));


            }

            // delete any alias information (must delete regardless of 
				// $saveOrphans because there isn't a place where aliases are
				// listed, so they would block forever usage of aliased emails)
            $existing_aliases = zeroBS_getObjAliases( ZBS_TYPE_CONTACT, $id );
            if ( is_array( $existing_aliases ) ) {
                foreach ( $existing_aliases as $alias ) {
                    zeroBS_removeObjAlias( ZBS_TYPE_CONTACT, $id, $alias['aka_alias'] );
                }
            }

            $del = zeroBSCRM_db2_deleteGeneric($id,'contacts');

            #} Add to automator
            zeroBSCRM_FireInternalAutomator('contact.delete',array(
                'id'=>$id,
                'saveOrphans'=>$saveOrphans
            ));

					$this->events_manager->contact()->deleted( $id );

            return $del;

        }

        return false;

    }

    /**
     * tidy's the object from wp db into clean array
     *
     * @param array $obj (DB obj)
     *
     * @return array (clean obj)
     */
    public function tidy_contact( $obj = false, $withCustomFields = false ) { // phpcs:ignore

        global $zbs;

            $res = false;

            if (isset($obj->ID)){
            $res = array();
            $res['id'] = $obj->ID;
            /* 
              `zbs_site` INT NULL DEFAULT NULL,
              `zbs_team` INT NULL DEFAULT NULL,
              `zbs_owner` INT NOT NULL,
            */
            $res['owner'] = $obj->zbs_owner;

            $res['status'] = $this->stripSlashes($obj->zbsc_status);
            $res['email'] = $obj->zbsc_email;
            $res['prefix'] = $this->stripSlashes($obj->zbsc_prefix);
            $res['fname'] = $this->stripSlashes($obj->zbsc_fname);
            $res['lname'] = $this->stripSlashes($obj->zbsc_lname);
            $res['addr1'] = $this->stripSlashes($obj->zbsc_addr1);
            $res['addr2'] = $this->stripSlashes($obj->zbsc_addr2);
            $res['city'] = $this->stripSlashes($obj->zbsc_city);
            $res['county'] = $this->stripSlashes($obj->zbsc_county);
            $res['country'] = $this->stripSlashes($obj->zbsc_country);
            $res['postcode'] = $this->stripSlashes($obj->zbsc_postcode);

            // until we add multi-addr support, these get translated into old field names (secaddr_)
            $res['secaddr_addr1'] = $this->stripSlashes($obj->zbsc_secaddr1);
            $res['secaddr_addr2'] = $this->stripSlashes($obj->zbsc_secaddr2);
            $res['secaddr_city'] = $this->stripSlashes($obj->zbsc_seccity);
            $res['secaddr_county'] = $this->stripSlashes($obj->zbsc_seccounty);
            $res['secaddr_country'] = $this->stripSlashes($obj->zbsc_seccountry);
            $res['secaddr_postcode'] = $this->stripSlashes($obj->zbsc_secpostcode);
            $res['hometel'] = $obj->zbsc_hometel;
            $res['worktel'] = $obj->zbsc_worktel;
            $res['mobtel'] = $obj->zbsc_mobtel;
            //$res['notes'] = $obj->zbsc_notes;
            $res['worktel'] = $obj->zbsc_worktel;
            $res['wpid'] = $obj->zbsc_wpid;
            $res['avatar'] = $obj->zbsc_avatar;
            $res['tw'] = $obj->zbsc_tw;
            $res['li'] = $obj->zbsc_li;
            $res['fb'] = $obj->zbsc_fb;


            // gross backward compat
            if ($zbs->db1CompatabilitySupport) $res['meta'] = $res;

            // to maintain old obj more easily, here we refine created into datestamp
            $res['created'] = zeroBSCRM_locale_utsToDatetime($obj->zbsc_created);
            if ($obj->zbsc_lastcontacted != -1 && !empty($obj->zbsc_lastcontacted) && $obj->zbsc_lastcontacted > 0)
                $res['lastcontacted'] = zeroBSCRM_locale_utsToDatetime($obj->zbsc_lastcontacted);
            else
                $res['lastcontacted'] = -1;
            $res['createduts'] = $obj->zbsc_created; // this is the UTS (int14)

            // this is in v3.0+ format.
            $res['created_date'] = ( isset( $obj->zbsc_created ) && $obj->zbsc_created > 0 ) ? zeroBSCRM_date_i18n( -1, $obj->zbsc_created ) : false;
            $res['lastupdated'] = $obj->zbsc_lastupdated;
            $res['lastupdated_date'] = ( isset( $obj->zbsc_lastupdated ) && $obj->zbsc_lastupdated > 0 ) ? zeroBSCRM_date_i18n( -1, $obj->zbsc_lastupdated ) : false;
            $res['lastcontacteduts'] = $obj->zbsc_lastcontacted; // this is the UTS (int14)
            $res['lastcontacted_date'] = ( isset( $obj->zbsc_lastcontacted ) && $obj->zbsc_lastcontacted > 0 ) ? zeroBSCRM_date_i18n( -1, $obj->zbsc_lastcontacted ) : false;

            // latest logs
            if (isset($obj->lastlog)) $res['lastlog'] = $obj->lastlog;
            if (isset($obj->lastcontactlog)) $res['lastcontactlog'] = $obj->lastcontactlog;

            // Build any extra formats (using fields)
            $res['fullname'] = $this->format_fullname($res);
            $res['name'] = $res['fullname']; // this one is for backward compat (pre db2)

            // if have totals, pass them :)
            if (isset($obj->quotes_total)) $res['quotes_total'] = $obj->quotes_total;
				if ( isset( $obj->invoices_total ) ) {
					$res['invoices_total']             = $obj->invoices_total;
					$res['invoices_total_inc_deleted'] = $obj->invoices_total_inc_deleted;
					$res['invoices_count']             = $obj->invoices_count;
					$res['invoices_count_inc_deleted'] = $obj->invoices_count_inc_deleted;
				}
				if ( isset( $obj->transactions_total ) ) {
					$res['transactions_total'] = $obj->transactions_total;
				}
            if (isset($obj->transactions_paid_total)) $res['transactions_paid_total'] = $obj->transactions_paid_total;

                // and if have invs + trans totals, add to make total val
                // This now accounts for "part payments" where trans are part/whole payments against invs
                if (isset($res['invoices_total']) || isset($res['transactions_total'])){
                    
                    $invTotal = 0.0; if (isset($res['invoices_total'])) $invTotal = $res['invoices_total'];
                    $transTotal = 0.0; if (isset($res['transactions_total'])) $transTotal = $res['transactions_total'];

                    $res['total_value'] = $invTotal + $transTotal;
                    if (isset($res['transactions_paid_total']) && $res['transactions_paid_total'] > 0) $res['total_value'] -= $res['transactions_paid_total'];
                }
                
            // custom fields - tidy any that are present:
            if ($withCustomFields) $res = $this->tidyAddCustomFields(ZBS_TYPE_CONTACT,$obj,$res,true);

            // Aliases
            if (isset($obj->aliases) && is_string($obj->aliases) && !empty($obj->aliases)){

                // csv => array
                $res['aliases'] = explode(',',$obj->aliases);

            }

        } 

        return $res;


    }


    /**
     * remove any non-db fields from the object
     * basically takes array like array('owner'=>1,'fname'=>'x','fullname'=>'x')
     * and returns array like array('owner'=>1,'fname'=>'x')
     *
     * @param array $obj (clean obj)
     *
     * @return array (db ready arr)
     */
    private function db_ready_contact($obj=false){

            global $zbs;

            /*
            if (is_array($obj)){

                $removeNonDBFields = array('meta','fullname','name');

                foreach ($removeNonDBFields as $fKey){

                    if (isset($obj[$fKey])) unset($obj[$fKey]);

                }

            }
            */

            $legitFields = array(
                'owner','status','email','prefix','fname','lname',
                'addr1','addr2','city','county','country','postcode',
                // WH corrected 13/06/18 2.84 'secaddr_addr1','secaddr_addr2','secaddr_city','secaddr_county','secaddr_country','secaddr_postcode',
                'secaddr1','secaddr2','seccity','seccounty','seccountry','secpostcode',
                'hometel','worktel','mobtel',
                'wpid','avatar',
                'tw','fb','li',
                'created','lastupdated','lastcontacted');


            $ret = array();
            if (is_array($obj)){

                foreach ($legitFields as $fKey){

                    if (isset($obj[$fKey])) $ret[$fKey] = $obj[$fKey];

                }

            }

            return $ret;


    }

    /**
     * Wrapper, use $this->getContactMeta($contactID,$key) for easy retrieval of singular
     * Simplifies $this->getMeta
     *
     * @param int objtype
     * @param int objid
     * @param string key
     *
     * @return bool result
     */
    public function getContactMeta($id=-1,$key='',$default=false){

        global $zbs;

        if (!empty($key)){

            return $this->DAL()->getMeta(array(

                'objtype' => ZBS_TYPE_CONTACT,
                'objid' => $id,
                'key' => $key,
                'fullDetails' => false,
                'default' => $default,
                'ignoreowner' => true // for now !!

            ));

        }

        return $default;
    }

    /**
     * returns external source detail lines for a contact
     *
     * @param array $args Associative array of arguments
     *              withStats, searchPhrase, sortByField, sortOrder, page, perPage
     *
     * @return array of tag lines
     */
    public function getExternalSourcesForContact($args=array()){

        global $zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'contactID' => -1,

            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0,
            'perPage'       => 100,

            // permissions
            'ignoreowner'   => false // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        #} ========== CHECK FIELDS ============

            $contactID = (int)$contactID;
        
        #} ========= / CHECK FIELDS ===========

        global $ZBSCRM_t,$wpdb; 
        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array();

        #} Build query
        $query = "SELECT * FROM ".$ZBSCRM_t['externalsources'];

        #} ============= WHERE ================

            #} contactID
            if (!empty($contactID) && $contactID > 0) $wheres['zbss_objid'] = array('zbss_objid','=','%d',$contactID);
            
            // type
            $wheres['zbss_objtype'] = array('zbss_objtype','=','%d',1);


        #} ============ / WHERE ===============

        #} Build out any WHERE clauses
        $wheresArr= $this->buildWheres($wheres,$whereStr,$params);
        $whereStr = $wheresArr['where']; $params = $params + $wheresArr['params'];
        #} / Build WHERE

        #} Ownership v1.0 - the following adds SITE + TEAM checks, and (optionally), owner
        $params = array_merge($params,$this->ownershipQueryVars($ignoreowner)); // merges in any req.
        $ownQ = $this->ownershipSQL($ignoreowner); if (!empty($ownQ)) $additionalWhere = $this->spaceAnd($additionalWhere).$ownQ; // adds str to query
        #} / Ownership

        #} Append to sql (this also automatically deals with sortby and paging)
        $query .= $this->buildWhereStr($whereStr,$additionalWhere) . $this->buildSort($sortByField,$sortOrder) . $this->buildPaging($page,$perPage);

        try {

            #} Prep & run query
            $queryObj = $this->prepare($query,$params);
            $potentialRes = $wpdb->get_results($queryObj, OBJECT);

        } catch (Exception $e){

            #} General SQL Err
            $this->catchSQLError($e);

        }

        #} Interpret results (Result Set - multi-row)
        if (isset($potentialRes) && is_array($potentialRes) && count($potentialRes) > 0) {

            #} Has results, tidy + return 
            foreach ($potentialRes as $resDataLine) {
                        
                    // tidy
                    $resArr = $this->DAL()->tidy_externalsource($resDataLine);

                    $res[] = $resArr;

            }
        }

        return $res;
    }

    
    /**
     * returns tracking detail lines for a contact
     *
     * @param array $args Associative array of arguments
     *              withStats, searchPhrase, sortByField, sortOrder, page, perPage
     *
     * @return array of tag lines
     */
    public function getTrackingForContact($args=array()){

        global $zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'contactID' => -1,

            // optional
            'action' => '',

            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0,
            'perPage'       => 100,

            // permissions
            'ignoreowner'   => false // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        #} ========== CHECK FIELDS ============

            $contactID = (int)$contactID;
        
        #} ========= / CHECK FIELDS ===========

        global $ZBSCRM_t,$wpdb; 
        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array();

        #} Build query
        $query = "SELECT * FROM ".$ZBSCRM_t['tracking'];

        #} ============= WHERE ================

            #} contactID
            if (!empty($contactID) && $contactID > 0) $wheres['zbst_contactid'] = array('zbst_contactid','=','%d',$contactID);

            #} action
            if (!empty($action)) $wheres['zbst_action'] = array('zbst_action','=','%s',$action);

        #} ============ / WHERE ===============

        #} Build out any WHERE clauses
        $wheresArr= $this->buildWheres($wheres,$whereStr,$params);
        $whereStr = $wheresArr['where']; $params = $params + $wheresArr['params'];
        #} / Build WHERE

        #} Ownership v1.0 - the following adds SITE + TEAM checks, and (optionally), owner
        $params = array_merge($params,$this->ownershipQueryVars($ignoreowner)); // merges in any req.
        $ownQ = $this->ownershipSQL($ignoreowner); if (!empty($ownQ)) $additionalWhere = $this->spaceAnd($additionalWhere).$ownQ; // adds str to query
        #} / Ownership

        #} Append to sql (this also automatically deals with sortby and paging)
        $query .= $this->buildWhereStr($whereStr,$additionalWhere) . $this->buildSort($sortByField,$sortOrder) . $this->buildPaging($page,$perPage);

        try {

            #} Prep & run query
            $queryObj = $this->prepare($query,$params);
            $potentialRes = $wpdb->get_results($queryObj, OBJECT);

        } catch (Exception $e){

            #} General SQL Err
            $this->catchSQLError($e);

        }

        #} Interpret results (Result Set - multi-row)
        if (isset($potentialRes) && is_array($potentialRes) && count($potentialRes) > 0) {

            #} Has results, tidy + return 
            foreach ($potentialRes as $resDataLine) {
                        
                    // tidy
                    $resArr = $this->DAL()->tidy_tracking($resDataLine);

                    $res[] = $resArr;

            }
        }

        return $res;
    } 

    /**
     * Returns an ownerid against a contact
     *
     * @param int id Contact ID
     *
     * @return int contact owner id
     */
    public function getContactOwner($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbs_owner',
                'ignoreowner'=>true));

        }

        return false;
        
    }

    /**
     * Returns an status against a contact
     *
     * @param int id Contact ID
     *
     * @return str contact status string
     */
    public function getContactStatus($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbsc_status',
                'ignoreowner'=>true));

        }

        return false;
        
    }

    /**
     * Sets the status of a contact
     *
     * @param int id Contact ID
     * @param str status Contact status
     *
     * @return int changed
     */
    public function setContactStatus( $id=-1, $status=-1 ){

        global $zbs;

        $id = (int)$id;

        if ($id > 0 && !empty($status) && $status !== -1){

            return $this->addUpdateContact(array(
                'id'=>$id,
                'limitedFields'=>array(
                    array('key'=>'zbsc_status','val' => $status,'type' => '%s')
            )));

        }

        return false;
        
    }

    /**
     * Sets the owner of a contact
     *
     * @param int id Contact ID
     * @param int owner Contact owner
     *
     * @return int changed
     */
    public function setContactOwner( $id=-1, $owner=-1 ){

        global $zbs;

        $id = (int)$id;
        $owner = (int)$owner;

        if ( $id > 0 && $owner > 0 ){

            return $this->addUpdateContact(array(
                'id'=>$id,
                'limitedFields'=>array(
                    array('key'=>'zbs_owner','val' => $owner,'type' => '%d')
            )));

        }

        return false;
        
    }

    /**
     * Returns an email addr against a contact
     * Replaces getContactEmail
     *
     * @param int id Contact ID
     *
     * @return string Contact email
     */
    public function getContactEmail($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbsc_email',
                'ignoreowner' => true));

        }

        return false;
        
    }

    /**
     * Updates an email address against a contact
     *
     * @param int id Contact ID
     * @param string $email_address
     *
     * @return bool success
     */
    public function update_contact_email( $id, $email_address ){

        global $zbs;

        $id = (int)$id;

        if ( $id > 0 && zeroBSCRM_validateEmail( $email_address ) ){

            $this->DAL()->addUpdateContact( array(
                'id'             => $id,
                'limitedFields'  => array(
                    array( 
                        'key'  => 'zbsc_email',
                        'val'  => $email_address,
                        'type' => '%s'
                    )
                )
             ));

            return true;

        }

        return false;
        
    }




    /**
     * Returns all email addrs against a contact
     * ... including aliases
     *
     * @param int id Contact ID
     *
     * @return array of strings (Contact emails)
     */
    public function getContactEmails($id=-1){

        global $zbs;

        $id = (int)$id;
        $emails = array();

        if ($id > 0){            

            // main record
            $mainEmail = $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbsc_email',
                'ignoreowner' => true));

            if (zeroBSCRM_validateEmail($mainEmail)) $emails[] = $mainEmail;

            // aliases
            $aliases = zeroBS_getObjAliases(ZBS_TYPE_CONTACT,$id);
            if (is_array($aliases)) foreach ($aliases as $alias) if (!in_array($alias['aka_alias'],$emails)) $emails[] = $alias['aka_alias'];


        }

        return $emails;
        
    }

    /**
     * Returns an email addr against a contact
     * Replaces zeroBS_customerMobile
     *
     * @param int id Contact ID
     *
     * @return string Contact email
     */
    public function getContactMobile($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbsc_mobtel',
                'ignoreowner' => true));

        }

        return false;
        
    }

    /**
     * Returns a formatted fullname of a 
     * Replaces zeroBS_customerName
     *
     * @param int id Contact ID
     * @param array Contact array (if already loaded can pass)
     * @param array args (see format_fullname func)
     *
     * @return string Contact full name
     */
    public function getContactFullName($id=-1,$contactArr=false){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            // get a limited-fields contact obj
            $contact = $this->getContact($id,array('withCustomFields' => false,'fields'=>array('zbsc_prefix','zbsc_fname','zbsc_lname'),'ignoreowner' => true));
            if (isset($contact) && is_array($contact) && isset($contact['prefix']))
                return $this->format_fullname($contact);

        } elseif (is_array($contactArr)){

            // pass through
            return $this->format_fullname($contactArr);

        }

        return false;
        
    }

    /**
     * Returns a formatted fullname (optionally including ID + first line of addr)
     * Replaces zeroBS_customerName more fully than getContactFullName
     * Also replaces zeroBS_getCustomerName
     *
     * @param int id Contact ID
     * @param array Contact array (if already loaded can pass)
     * @param array args (see format_fullname func)
     *
     * @return string Contact full name
     */
    public function getContactFullNameEtc($id=-1,$contactArr=false,$args=array()){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            // get a limited-fields contact obj
            $contact = $this->getContact($id,array('withCustomFields' => false,'fields'=>array('zbsc_addr1','zbsc_prefix','zbsc_fname','zbsc_lname'),'ignoreowner' => true));
            if (isset($contact) && is_array($contact) && isset($contact['prefix']))
                return $this->format_name_etc($contact,$args);

        } elseif (is_array($contactArr)){

            // pass through
            return $this->format_name_etc($contactArr,$args);

        }

        return false;
        
    }

    /**
     * Returns a formatted name (e.g. Dave Davids) or fallback
     * If there is no name, return "Contact #" or a provided hard-coded fallback. Optionally return an email if it exists.
     *
     * @param int $id Contact ID
     * @param array $contactArr (if already loaded can pass)
     * @param boolean $do_email_fallback
     * @param string $hardcoded_fallback
     *
     * @return string name or fallback
     */
    public function getContactNameWithFallback( $id=-1, $contactArr=false, $do_email_fallback=true, $hardcoded_fallback=''){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

          // get a limited-fields contact obj
          $contact = $this->getContact(
            $id,
            array(
              'withCustomFields' => false,
              'fields'=>array(
                'zbsc_fname',
                'zbsc_lname',
                'zbsc_email',
              ),
              'ignoreowner' => true
            )
          );
          if ( isset( $contact ) && is_array( $contact ) ) {
            return $this->format_name_with_fallback( $contact, $do_email_fallback, $hardcoded_fallback );
          }

        } elseif ( is_array( $contactArr ) ) {

          // pass through
          return $this->format_name_with_fallback( $contactArr, $do_email_fallback, $hardcoded_fallback );

        }

        return false;

    }

    /**
     * Returns a formatted address of a contact
     * Replaces zeroBS_customerAddr
     *
     * @param int id Contact ID
     * @param array Contact array (if already loaded can pass)
     * @param array args (see format_address func)
     *
     * @return string Contact addr html
     */
    public function getContactAddress($id=-1,$contactArr=false,$args=array()){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            // get a limited-fields contact obj
            // this is hacky, but basically get whole basic contact record for this for now, because 
            // this doesn't properly get addr custom fields:
            // $contact = $this->getContact($id,array('withCustomFields' => false,'fields'=>$this->field_list_address,'ignoreowner'=>true));
            $contact = $this->getContact($id,array('withCustomFields' => true,'ignoreowner'=>true));
            if (isset($contact) && is_array($contact) && isset($contact['addr1']))
                return $this->format_address($contact,$args);

        } elseif (is_array($contactArr)){

            // pass through
            return $this->format_address($contactArr,$args);

        }

        return false;
        
    }

    /**
     * Returns a formatted address of a contact (2nd addr)
     * Replaces zeroBS_customerAddr
     *
     * @param int id Contact ID
     * @param array Contact array (if already loaded can pass)
     * @param array args (see format_address func)
     *
     * @return string Contact addr html
     */
    public function getContact2ndAddress($id=-1,$contactArr=false,$args=array()){

        global $zbs;

        $id = (int)$id;

        $args['secondaddr'] = true;

        if ($id > 0){

            // get a limited-fields contact obj
            // this is hacky, but basically get whole basic contact record for this for now, because 
            // this doesn't properly get addr custom fields:
            // $contact = $this->getContact($id,array('withCustomFields' => false,'fields'=>$this->field_list_address2,'ignoreowner'=>true));
            $contact = $this->getContact($id,array('withCustomFields' => true,'ignoreowner'=>true));            
            if (isset($contact) && is_array($contact) && isset($contact['addr1']))
                return $this->format_address($contact,$args);

        } elseif (is_array($contactArr)){

            // pass through
            return $this->format_address($contactArr,$args);

        }

        return false;
        
    }
    
    /**
     * Returns a contacts tag array
     * Replaces zeroBSCRM_getCustomerTags AND  zeroBSCRM_getContactTagsArr
     *
     * @param int id Contact ID
     *
     * @return mixed
     */
    public function getContactTags($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_CONTACT,'objid'=>$id));

        }

        return false;
        
    }


    /**
     * Returns last contacted uts against a contact
     *
     * @param int id Contact ID
     *
     * @return int Contact last contacted date as uts (or -1)
     */
    public function getContactLastContactUTS($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbsc_lastcontacted',
                'ignoreowner' => true));

        }

        return false;
        
    }

    /**
     * updates lastcontacted date for a contact
     *
     * @param int id Contact ID
     * @param int uts last contacted
     *
     * @return bool
     */
    public function setContactLastContactUTS($id=-1,$lastContactedUTS=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->addUpdateContact(array(
                'id'=>$id,
                'limitedFields'=>array(
                    array('key'=>'zbsc_lastcontacted','val' => $lastContactedUTS,'type' => '%d')
            )));

        }

        return false;
        
    }

    /**
     * Returns a set of social accounts for a contact (tw,li,fb)
     *
     * @param int id Contact ID
     *
     * @return array social acc's
     */
    public function getContactSocials($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            // lazy 3 queries, optimise later

            $tw = $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbsc_tw',
                'ignoreowner' => true));

            $li = $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbsc_li',
                'ignoreowner' => true));

            $fb = $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbsc_fb',
                'ignoreowner' => true));

            return array('tw'=>$tw,'li' => $li, 'fb' => $fb);

        }

        return false;
        
    }
    
    /**
     * Returns a linked WP ID against a contact
     * Replaces zeroBS_getCustomerWPID
     *
     * @param int id Contact ID
     *
     * @return int Contact wp id
     */
    public function getContactWPID( $id=-1 ){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbsc_wpid',
                'ignoreowner' => true));

        }

        return false;
        
    }
    
    /**
     * Returns true/false whether or not user has 'do-not-email' flag (from unsub email link click)
     *
     * @param int id Contact ID
     *
     * @return bool
     */
    public function getContactDoNotMail($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->meta(ZBS_TYPE_CONTACT,$id,'do-not-email',false);

        }

        return false;
        
    }
    
    /**
     * updates true/false whether or not user has 'do-not-email' flag (from unsub email link click)
     *
     * @param int id Contact ID
     * @param bool whether or not to set donotmail
     *
     * @return bool
     */
    public function setContactDoNotMail($id=-1,$doNotMail=true){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            if ($doNotMail)
                return $this->DAL()->updateMeta(ZBS_TYPE_CONTACT,$id,'do-not-email',true);
            else
                // remove
                return $this->DAL()->deleteMeta(array(
                    'objtype' => ZBS_TYPE_CONTACT,
                    'objid' => $id,
                    'key' => 'do-not-email'));

        }

        return false;
        
    }
    
    /**
     * Returns an url to contact avatar (Gravatar if not set?)
     * For now just returns the field
     * Replaces zeroBS_getCustomerIcoHTML?
     *
     * @param int id Contact ID
     *
     * @return int Contact wp id
     */
    public function getContactAvatarURL($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_CONTACT,
                'colname' => 'zbsc_avatar',
                'ignoreowner' => true));

        }

        return false;
        
    }
    
    /**
     * Returns an url to contact avatar (Gravatar if not set?)
     * Or empty if 'show default empty' = false
     *
     * @param int id Contact ID
     * @param bool showPlaceholder does what it says on tin
     *
     * @return string URL for img
     */
    public function getContactAvatar($id=-1,$showPlaceholder=true){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            $avatarMode = zeroBSCRM_getSetting('avatarmode');
            switch ($avatarMode){


                case 1: // gravitar
                
                    $potentialEmail = $this->getContactEmail($id);
                    if (!empty($potentialEmail)) return zeroBSCRM_getGravatarURLfromEmail($potentialEmail);
                    
                    // default
                    return zeroBSCRM_getDefaultContactAvatar();

                    break;

                case 2: // custom img
                        
                    $dbURL = $this->getContactAvatarURL($id);
                    if (!empty($dbURL)) return $dbURL;

                    // default
                    return zeroBSCRM_getDefaultContactAvatar();

                    break;

                case 3: // none
                    return '';
                    break;
                

            }


        }

        // fallback
        if ($showPlaceholder) return zeroBSCRM_getDefaultContactAvatar();

        return false;
        
    }

    
    /**
     * Returns html of contact avatar (Gravatar if not set?)
     * Or empty if 'show default empty' = false
     *
     * @param int id Contact ID
     *
     * @return string HTML
     */
    public function getContactAvatarHTML($id=-1,$size=100,$extraClasses=''){

        $id = (int)$id;

        if ($id > 0){

            $avatarMode = zeroBSCRM_getSetting('avatarmode');
            switch ($avatarMode){


                case 1: // gravitar
                
                    $potentialEmail = $this->getContactEmail($id);
                     if (!empty($potentialEmail)) return '<img src="'.zeroBSCRM_getGravatarURLfromEmail($potentialEmail,$size).'" class="'.$extraClasses.' zbs-gravatar" alt="" />';
                    
                    // default
                    return zeroBSCRM_getDefaultContactAvatarHTML();

                    break;

                case 2: // custom img
                        
                    $dbURL = $this->getContactAvatarURL($id);
                    if (!empty($dbURL)) return '<img src="'.$dbURL.'" class="'.$extraClasses.' zbs-custom-avatar" alt="" />';

                    // default
                    return zeroBSCRM_getDefaultContactAvatarHTML();

                    break;

                case 3: // none
                    return '';
                    break;
                

            }


        }

        return '';
        
    }




    /**
     * Returns a count of contacts (owned)
     * Replaces zeroBS_customerCount AND zeroBS_getCustomerCount AND zeroBS_customerCountByStatus
     *
     *
     * @return int count
     */
    public function getContactCount($args=array()){

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'inCompany'     => false, // will be an ID if used
            'withStatus'    => false, // will be str if used

            // permissions
            'ignoreowner'   => true, // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $whereArr = array();

        if ($inCompany) $whereArr['incompany'] = array('ID','IN','(SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_CONTACT." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = %d)",$inCompany);

        if ($withStatus !== false && !empty($withStatus)) $whereArr['status'] = array('zbsc_status','=','%s',$withStatus);

        return $this->DAL()->getFieldByWHERE(array(
            'objtype' => ZBS_TYPE_CONTACT,
            'colname' => 'COUNT(ID)',
            'where' => $whereArr,
            'ignoreowner' => $ignoreowner));

    

        return 0;
        
    }

    /**
     * Returns a customer's associated company ID's
     * Replaces zeroBS_getCustomerCompanyID (via LEGACY func)
     *
     * @param int id
     *
     * @return array int id
     */
    public function getContactCompanies($id=-1){

        if (!empty($id)){

            /*
            $contact = $this->getContact($id,array(
                'withCompanies' => true,
                'fields' => array('ID')));

            if (is_array($contact) && isset($contact['companies'])) return $contact['companies'];
            */

            // cleaner:
            return $this->DAL()->getObjsLinkedToObj(array(
                                'objtypefrom'   =>  ZBS_TYPE_CONTACT, // contact
                                'objtypeto'     =>  ZBS_TYPE_COMPANY, // company
                                'objfromid'     =>  $id,
                                'ignoreowner' => true));

        }

        return array();
        
    }

    /**
     * Returns a bool whether contact has a quote linked to them
     * NOTE: this only counts objlinks, so if the obj is deleted and they're not tidied, this'll give false positive
     * (Shorthand for contactHasObjLink)
     *
     * @param int contactID
     * @param int obj type id
     *
     * @return bool
     */
    public function contactHasQuote($contactID=-1){

        if ($contactID > 0){

            // cleaner:
            $c = $this->contactHasObjLink($contactID,ZBS_TYPE_QUOTE);

            if ($c > 0) return true;

        }

        return false;
        
    }

    /**
     * Returns a bool whether contact has a Invoice linked to them
     * NOTE: this only counts objlinks, so if the obj is deleted and they're not tidied, this'll give false positive
     * (Shorthand for contactHasObjLink)
     *
     * @param int contactID
     * @param int obj type id
     *
     * @return bool
     */
    public function contactHasInvoice($contactID=-1){

        if ($contactID > 0){

            // cleaner:
            $c = $this->contactHasObjLink($contactID,ZBS_TYPE_INVOICE);

            if ($c > 0) return true;

        }

        return false;
        
    }

    /**
     * Returns a bool whether contact has a transaction linked to them
     * NOTE: this only counts objlinks, so if the obj is deleted and they're not tidied, this'll give false positive
     * (Shorthand for contactHasObjLink)
     *
     * @param int contactID
     * @param int obj type id
     *
     * @return bool
     */
    public function contactHasTransaction($contactID=-1){

        if ($contactID > 0){

            // cleaner:
            $c = $this->contactHasObjLink($contactID,ZBS_TYPE_TRANSACTION);

            if ($c > 0) return true;

        }

        return false;
        
    }

    /**
     * Returns a bool whether contact has objtype linked to them
     * specifically *obj -> THIS (contact)
     * NOTE: this only counts objlinks, so if the obj is deleted and they're not tidied, this'll give false positive
     *
     * @param int id
     * @param int obj type id
     *
     * @return bool
     */
    private function contactHasObjLink($id=-1,$objTypeID=-1){

        if ($id > 0 && $objTypeID > 0){

            // cleaner:
            $c = $this->DAL()->getObjsLinksLinkedToObj(array(
                                'objtypefrom'   =>  $objTypeID, // obj type
                                'objtypeto'     =>  ZBS_TYPE_CONTACT, // contact
                                'objtoid'       =>  $id,
                                'count'         => true,
                                'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

            if ($c > 0) return true;


        }

        return false;
        
    }

    /**
     * Returns the next customer ID and the previous customer ID
     * Used for the navigation between contacts. 
     *
     * @param int id
     *
     * @return array int id
     */
    public function getContactPrevNext($id=-1){

        global $ZBSCRM_t, $wpdb;

        if($id > 0){
            //then run the queries.. 
            $nextSQL = $this->prepare("SELECT MIN(ID) FROM ".$ZBSCRM_t['contacts']." WHERE ID > %d", $id);

            $res['next'] = $wpdb->get_var($nextSQL);

            $prevSQL = $this->prepare("SELECT MAX(ID) FROM ".$ZBSCRM_t['contacts']." WHERE ID < %d", $id);

            $res['prev'] = $wpdb->get_var($prevSQL);

            return $res;

        }

        return false;

    }   



    /**
     * Takes full object and makes a "list view" boiled down version
     * Used to generate listview objs
     *
     * @param array $obj (clean obj)
     *
     * @return array (listview ready obj)
     */
    public function listViewObj($contact=false,$columnsRequired=array()){

        if (is_array($contact) && isset($contact['id'])){

            global $zbs;

            $resArr = $contact;

            $resArr['avatar'] = zeroBS_customerAvatar($resArr['id']);
            
            // use created original $resArr['created'] = zeroBSCRM_date_i18n(-1, $resArr['createduts']);

            #} Custom columns
                
            #} Total value
            if (in_array('totalvalue', $columnsRequired)){

                #} Calc total value + add to return array
                $resArr['totalvalue'] = zeroBSCRM_formatCurrency(0); if (isset($contact['total_value'])) $resArr['totalvalue'] = zeroBSCRM_formatCurrency($contact['total_value']);

            }


            #} Quotes
            if ( in_array( 'quotetotal', $columnsRequired ) ) {
                if ( isset( $contact['quotes_total'] ) ) {
                    $resArr['quotestotal'] = zeroBSCRM_formatCurrency( $contact['quotes_total'] );
                }
                else {
                    $resArr['quotestotal'] = zeroBSCRM_formatCurrency( 0 );
                }
            }

            #} Invoices
            if ( in_array('invoicetotal', $columnsRequired ) ) {
                if ( isset( $contact['invoices_total'] ) ) {
                    $resArr['invoicestotal'] = zeroBSCRM_formatCurrency( $contact['invoices_total'] );
                }
                else {
                    $resArr['invoicestotal'] = zeroBSCRM_formatCurrency( 0 );
                }
            }

            #} Transactions
            if (in_array('transactiontotal', $columnsRequired)){

                $resArr['transactionstotal'] = zeroBSCRM_formatCurrency(0); if (isset($contact['transactions_value'])) $resArr['transactionstotal'] = zeroBSCRM_formatCurrency($contact['transactions_value']);

            }
            // v3.0
            if (isset($contact['transactions_total'])){

                // DAL2 way, brutal effort.
                $resArr['transactions_total'] = zeroBSCRM_formatCurrency($contact['transactions_total']);

                // also pass total without formatting (used for hastransactions check)
                $resArr['transactions_total_value'] = $contact['transactions_total'];

            }

            #} Company
            if (in_array('company',$columnsRequired)){

                $resArr['company'] = false;

                #} Co Name Default
                $coName = '';

                // glob as used above 1 step in ajax. not pretty
                global $companyNameCache;

                // get
                $coID = zeroBS_getCustomerCompanyID($resArr['id']);//get_post_meta($post->ID,'zbs_company',true);
                if (!empty($coID)){

                    // cache as we go
                    if (!isset($companyNameCache[$coID])){

                        // get
                        $co = zeroBS_getCompany($coID);
                        if (isset($co) && isset($co['name'])) $coName = $co['name'];
                        if (empty($coName)) $coName = jpcrm_label_company().' #'.$co['id'];

                        // cache
                        $companyNameCache[$coID] = $coName;

                    } else {
                        $coName = $companyNameCache[$coID];
                    }
                }

                if ($coID > 0){
                    $resArr['company'] = array('id'=>$coID,'name'=>$coName);
                }
            }

			// Object view. Escaping JS for Phone link attr to avoid XSS
			// phpcs:disable
			$resArr['hometel'] = isset( $resArr['hometel'] ) ? esc_js( $resArr['hometel'] ) : '';
			$resArr['worktel'] = isset( $resArr['worktel'] ) ? esc_js( $resArr['worktel'] ) : '';
			$resArr['mobtel']  = isset( $resArr['mobtel'] ) ? esc_js( $resArr['mobtel'] ) : '';
			// phpcs:enable

            return $resArr;
        }

        return false;

    }


    // ===============================================================================
    // ============  Formatting    ===================================================


    /**
     * Returns a formatted full name (e.g. Mr. Dave Davids)
     *
     * @param array $obj (tidied db obj)
     *
     * @return string fullname
     */
   public function format_fullname($contactArr=array()){

        $usePrefix = zeroBSCRM_getSetting('showprefix');

        $str = '';
        if($usePrefix){
            if (isset($contactArr['prefix'])) $str .= $contactArr['prefix'];
        }

        if (isset($contactArr['fname'])) {
            if (!empty($str)) $str .= ' ';
            $str .= $contactArr['fname'];
        }
        if (isset($contactArr['lname'])) {
            if (!empty($str)) $str .= ' ';
            $str .= $contactArr['lname'];
        }

        return $str;
   }

    /**
     * Returns a formatted full name +- id, address (e.g. Mr. Dave Davids 12 London Street #23)
     * Replaces zeroBS_customerName from DAL1 more realistically than format_fullname
     *
     * @param array $obj (tidied db obj)
     *
     * @return string fullname
     */
   public function format_name_etc($contactArr=array(),$args=array()){

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            'incFirstLineAddr'  => false,
            'incID'             => false

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        // full name first
        $str = $this->format_fullname($contactArr);

        // First line of addr?
        if ($incFirstLineAddr) if (isset($contactArr['addr1']) && !empty($contactArr['addr1'])) $str .= ' ('.$contactArr['addr1'].')';

        // ID?
        if ($incID) $str .= ' #'.$contactArr['id'];

        return $str;
   }
   
    /**
     * Returns a formatted name (e.g. Dave Davids) or fallback
     * If there is no name, return "Contact #" or a provided hard-coded fallback. Optionally return an email if it exists.
     *
     * @param array $contactArr (tidied db obj)
     * @param boolean $do_email_fallback
     * @param string $hardcoded_fallback
     *
     * @return string name or fallback
     *
     */
    public function format_name_with_fallback( $contactArr=array(), $do_email_fallback=true, $hardcoded_fallback='') {

      $str = $this->format_fullname( $contactArr );

      if ($do_email_fallback && empty( $str ) && !empty( $contactArr['email']) ) {
        $str = $contactArr['email'];
      }

      if ( empty($str) ) {
        if ( !empty( $hardcoded_fallback ) ) {
          return $hardcoded_fallback;
        } else {
          return __('Contact','zero-bs-crm') . ' #' . $contactArr['id'];
        }
      }

      return $str;

    }

    // =========== / Formatting    ===================================================
    // ===============================================================================
} // / class
