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

/**
* ZBS DAL >> Companies
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_companies extends zbsDAL_ObjectLayer {

    protected $objectType = ZBS_TYPE_COMPANY;
    protected $objectDBPrefix = 'zbsco_';
    protected $objectIncludesAddresses = true;
    protected $include_in_templating = true;
    protected $objectModel = array(

        // ID
        'ID' => array('fieldname' => 'ID', 'format' => 'int'),

        // site + team generics
        'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
        'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
        'zbs_owner' => array('fieldname' => 'zbs_owner', 'format' => 'int'),

        // other fields
        'status'            => array(
            // db model:
			'fieldname'             => 'zbsco_status',
			'format'                => 'str',
            // output model
            'input_type' => 'select',
            'label' => 'Status',
            'placeholder'=>'',
			'options'               => array( 'Lead', 'Customer', 'Refused', 'Blacklisted' ),
            'essential' => true,
            'max_len' => 50,
            'do_not_show_on_portal' => true
        ),
        'name'            => array(
            // db model:
            'fieldname' => 'zbsco_name', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'Name',
            'placeholder'=> 'e.g. NewCo',
            'dal1key' => 'coname',
            'essential' => true,
            'force_unique' => true, // must be unique. This is required and breaking if true,
            'not_empty' => true,
            'max_len' => 100
        ),


        'addr1'             => array(
            // db model:
            'fieldname' => 'zbsco_addr1', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'Address Line 1',
            'placeholder'=>'',
            'area'=> 'Main Address',
            'migrate'=>'addresses',
            'max_len' => 200
        ),
        'addr2'             => array(
            // db model:
            'fieldname' => 'zbsco_addr2', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'Address Line 2',
            'placeholder'=>'',
            'area'=> 'Main Address',
            'migrate'=>'addresses',
            'max_len' => 200
        ),
        'city'              => array(
            // db model:
            'fieldname' => 'zbsc_city', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'City',
            'placeholder'=> 'e.g. New York',
            'area'=> 'Main Address',
            'migrate'=>'addresses',
            'max_len' => 100
        ),
        'county'            => array(
            // db model:
            'fieldname' => 'zbsco_county', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'County',
            'placeholder'=> 'e.g. Kings County',
            'area'=> 'Main Address',
            'migrate'=>'addresses',
            'max_len' => 200
        ),
        'postcode'          => array(
            // db model:
            'fieldname' => 'zbsco_postcode', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'Post Code',
            'placeholder'=> 'e.g. 10019',
            'area'=> 'Main Address',
            'migrate'=>'addresses',
            'max_len' => 50
        ),
        'country'           => array(
            // db model:
            'fieldname' => 'zbsco_country', 'format' => 'str',
            // output model
            'input_type' => 'selectcountry',
            'label' => 'Country',
            'placeholder'=>'',
            'area'=> 'Main Address',
            'migrate'=>'addresses',
            'max_len' => 200
        ),


        'secaddr1'             => array(
            // db model:
            'fieldname' => 'zbsco_secaddr1', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'Address Line 1',
            'placeholder'=>'',
            'area'=> 'Second Address',
            'migrate'=>'addresses',
            'opt'=>'secondaddress',
            'max_len' => 200,
            'dal1key' => 'secaddr_addr1' // previous field name
        ),
        'secaddr2'             => array(
            // db model:
            'fieldname' => 'zbsco_secaddr2', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'Address Line 2',
            'placeholder'=>'',
            'area'=> 'Second Address',
            'migrate'=>'addresses',
            'opt'=>'secondaddress',
            'max_len' => 200,
            'dal1key' => 'secaddr_addr2' // previous field name
        ),
        'seccity'              => array(
            // db model:
            'fieldname' => 'zbsco_seccity', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'City',
            'placeholder'=> 'e.g. Los Angeles',
            'area'=> 'Second Address',
            'migrate'=>'addresses',
            'opt'=>'secondaddress',
            'max_len' => 100,
            'dal1key' => 'secaddr_city' // previous field name
        ),
        'seccounty'            => array(
            // db model:
            'fieldname' => 'zbsco_seccounty', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'County',
            'placeholder'=> 'e.g. Los Angeles',
            'area'=> 'Second Address',
            'migrate'=>'addresses',
            'opt'=>'secondaddress',
            'max_len' => 200,
            'dal1key' => 'secaddr_county' // previous field name
        ),
        'secpostcode'          => array(
            // db model:
            'fieldname' => 'zbsco_secpostcode', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'Post Code',
            'placeholder'=> 'e.g. 90001',
            'area'=> 'Second Address',
            'migrate'=>'addresses',
            'opt'=>'secondaddress',
            'max_len' => 50,
            'dal1key' => 'secaddr_postcode' // previous field name
        ),
        'seccountry'           => array(
            // db model:
            'fieldname' => 'zbsco_seccountry', 'format' => 'str',
            // output model
            'input_type' => 'selectcountry',
            'label' => 'Country',
            'placeholder'=>'',
            'area'=> 'Second Address',
            'migrate'=>'addresses',
            'opt'=>'secondaddress',
            'max_len' => 200,
            'dal1key' => 'secaddr_country' // previous field name
        ),

        'maintel'            => array(
            // db model:
            'fieldname' => 'zbsco_maintel', 'format' => 'str',
            // output model
            'input_type' => 'tel',
            'label' => 'Main Telephone',
            'placeholder'=> 'e.g. 877 2733049',
            'max_len' => 40
        ),
        'sectel'            => array(
            // db model:
            'fieldname' => 'zbsco_sectel', 'format' => 'str',
            // output model
            'input_type' => 'tel',
            'label' => 'Secondary Telephone',
            'placeholder'=> 'e.g. 877 2733049',
            'max_len' => 40
        ),
        'email'            => array(
            // db model:
            'fieldname' => 'zbsco_email', 'format' => 'str',
            // output model
            'input_type' => 'email',
            'label' => 'Main Email Address',
            'placeholder'=> 'e.g. hello@company.com',
            'max_len' => 200,
            'force_unique' => true, // must be unique. This is required and breaking if true
            'can_be_blank' => true,
            'do_not_show_on_portal' => true
        ),

        // ... just removed for DAL3 :) should be custom field anyway by this point 

        'wpid' => array('fieldname' => 'zbsco_wpid', 'format' => 'int'),
        'avatar' => array('fieldname' => 'zbsco_avatar', 'format' => 'str'),
        'tw' => array(
            'fieldname' => 'zbsco_tw', 
            'format' => 'str',
            'max_len' => 100
        ),
        'li' => array(
            'fieldname' => 'zbsco_li',
            'format' => 'str',
            'max_len' => 300
        ),
        'fb' => array(
            'fieldname' => 'zbsco_fb',
            'format' => 'str',
            'max_len' => 200
        ),
        'created' => array('fieldname' => 'zbsco_created', 'format' => 'uts'),
        'lastupdated' => array('fieldname' => 'zbsco_lastupdated', 'format' => 'uts'),
        'lastcontacted' => array('fieldname' => 'zbsco_lastcontacted', 'format' => 'uts'),

        );


    function __construct($args=array()) {


        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            //'tag' => false,

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============


    }

    // generic get Company (by ID)
    // Super simplistic wrapper used by edit page etc. (generically called via dal->contacts->getSingle etc.)
    public function getSingle($ID=-1){

        return $this->getCompany($ID);

    }

    // generic get contact (by ID list)
    // Super simplistic wrapper used by MVP Export v3.0
    public function getIDList($IDs=false){

        return $this->getCompanies(array(
            'inArr'             => $IDs,
            'withCustomFields'  => true,
            'page'          => -1,
            'perPage'       => -1
        ));

    }
    
    // generic get (EVERYTHING)
    // expect heavy load!
    public function getAll($IDs=false){

        return $this->getCompanies(array(
            'withCustomFields'  => true,
            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    // generic get count of (EVERYTHING)
    public function getFullCount(){

        return $this->getCompanies(array(
            'count'  => true,
            'page'          => -1,
            'perPage'       => -1,
        ));

    }

    /**
     * returns full company line +- details
     *
     * @param int id        company id
     * @param array $args   Associative array of arguments
     *
     * @return array company object
     */
    public function getCompany($id=-1,$args=array()){

        global $zbs;

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            'email'             => false, // if id -1 and email given, will return based on email
            'name'             => false, // if id -1 and name given, will return based on name

            // if theset wo passed, will search based on these 
            'externalSource'    => false,
            'externalSourceUID' => false,

            // with what?
            'withCustomFields'  => true,
            'withQuotes'        => false,
            'withInvoices'      => false,
            'withTransactions'  => false,
            'withTasks'         => false,
            //'withLogs'          => false,
            'withLastLog'       => false,
            'withTags'          => false,
            'withOwner'         => false,
            'withValues'        => false, // if passed, returns with 'total' 'invoices_total' 'transactions_total' etc. (requires getting all obj, use sparingly)
            'withContacts'      => true, // return ['contact'] objs
            'withExternalSources' => false,
            'withExternalSourcesGrouped' => false,

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY), // this'll let you not-check the owner of obj

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
                    $custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_COMPANY));

                    #} Cycle through + build into query
                    if (is_array($custFields)) foreach ($custFields as $cK => $cF){

                        // add as subquery
                        $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = company.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) '".$cK."'";
                        
                        // add params
                        $params[] = $cK; $params[] = ZBS_TYPE_COMPANY;

                    }

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

                        // addr1
                            // add as subquery
                            $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = company.ID AND zbscf_objkey = %s AND zbscf_objtype = %d) ".$cKey;                        
                            // add params
                            $params[] = $cfKey; $params[] = ZBS_TYPE_COMPANY;
                        // addr2
                            // add as subquery
                            $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = company.ID AND zbscf_objkey = %s AND zbscf_objtype = %d) ".$cKey2;                        
                            // add params
                            $params[] = $cfKey2; $params[] = ZBS_TYPE_COMPANY;

                    }


                }


                        




                // ==== TOTAL VALUES

                // Calculate total vals etc. with SQL 
                if (!$onlyID && $withValues){

                    // arguably, if getting $withInvoices etc. may be more performant to calc this in php in AFTER loop, 
                    // ... for now as a fair guess, this'll be most performant:
                    // ... we calc total by adding invs + trans below :)

                    // only include transactions with statuses which should be included in total value:
                    $transStatusQueryAdd = $this->DAL()->transactions->getTransactionStatusesToIncludeQuery();  

                    // quotes:
                    $extraSelect .= ',(SELECT SUM(quotestotal.zbsq_value) FROM '.$ZBSCRM_t['quotes'].' as quotestotal WHERE quotestotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_QUOTE." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = company.ID)) as quotes_total";
                    // invs:
                    $extraSelect .= ',(SELECT SUM(invstotal.zbsi_total) FROM '.$ZBSCRM_t['invoices'].' as invstotal WHERE invstotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_INVOICE." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = company.ID)) as invoices_total";
                    // trans (with status):
                    $extraSelect .= ',(SELECT SUM(transtotal.zbst_total) FROM '.$ZBSCRM_t['transactions'].' as transtotal WHERE transtotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_TRANSACTION." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = company.ID)".$transStatusQueryAdd.") as transactions_total";
                    // paid balance against invs  (also in getCompany)
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
                    $extraSelect .= '(SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_INVOICE.' AND zbsol_objtype_to = '.ZBS_TYPE_COMPANY.' AND zbsol_objid_to = company.ID)';
                    $extraSelect .= ')'.$transStatusQueryAdd.') as transactions_paid_total';
                }

                // ==== / TOTAL VALUES

                $selector = 'company.*';
                if (isset($fields) && is_array($fields)) {
                    $selector = '';

                    // always needs id, so add if not present
                    if (!in_array('ID',$fields)) $selector = 'company.ID';

                    foreach ($fields as $f) {
                        if (!empty($selector)) $selector .= ',';
                        $selector .= 'company.'.$f;
                    }
                } else if ($onlyID){
                    $selector = 'company.ID';
                }

            #} ============ / PRE-QUERY ===========


            #} Build query
            $query = "SELECT ".$selector.$extraSelect." FROM ".$ZBSCRM_t['companies'].' as company';
            #} ============= WHERE ================

                if (!empty($id) && $id > 0){

                    #} Add ID
                    $wheres['ID'] = array('ID','=','%d',$id);

                }

                if (!empty($email)){

                    $emailWheres = array();

                    // simple, inc AKA (even tho not in UI yet :))
                    //nope$wheres['emailcheck'] = array('zbsco_email','=','%s',$email);

                    #} Add ID
                    $emailWheres['emailcheck'] = array('zbsco_email','=','%s',$email);

                    #} Check AKA
                    $emailWheres['email_alias'] = array('ID','IN',"(SELECT aka_id FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_COMPANY." AND aka_alias = %s)",$email);
                    
                    // This generates a query like 'zbsc_email = %s OR zbsc_email2 = %s', 
                    // which we then need to include as direct subquery (below) in main query :)
                    $emailSearchQueryArr = $this->buildWheres($emailWheres,'',array(),'OR',false);
                    
                    if (is_array($emailSearchQueryArr) && isset($emailSearchQueryArr['where']) && !empty($emailSearchQueryArr['where'])){

                        // add it
                        $wheres['direct'][] = array('('.$emailSearchQueryArr['where'].')',$emailSearchQueryArr['params']);

                    }
                    

                } 

                if (!empty($name)){

                    // simple
                    $wheres['name'] = array('zbsco_name','=','%s',$name);

                } 
                
                if (!empty($externalSource) && !empty($externalSourceUID)){

                    $wheres['extsourcecheck'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_COMPANY." AND zbss_source = %s AND zbss_uid = %s)",array($externalSource,$externalSourceUID));

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
                        $res = $this->tidy_company($potentialRes,$withCustomFields);
                    }

                    // TWO methods here, this feels more "common sense" (other commented out below.)  
                    if ($withInvoices){
                        
                        #} only gets first 100?
                        //DAL3 ver, more perf, gets all
                        $res['invoices'] = $zbs->DAL->invoices->getInvoices(array(

                                'assignedCompany'   => $potentialRes->ID, // assigned to company id (int)
                                'page'       => -1,
                                'perPage'       => -1,
                                'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE)

                            ));

                    }

                    if ($withQuotes){
                        
                        //DAL3 ver, more perf, gets all
                        $res['quotes'] = $zbs->DAL->quotes->getQuotes(array(

                                'assignedCompany'   => $potentialRes->ID, // assigned to company id (int)
                                'page'       => -1,
                                'perPage'       => -1,
                                'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE)

                            ));

                    }

                    #} ... brutal for mvp #DB1LEGACY (TOMOVE)
                    if ($withTransactions){
                        
                        //DAL3 ver, more perf, gets all
                        $res['transactions'] = $zbs->DAL->transactions->getTransactions(array(

                                'assignedCompany'   => $potentialRes->ID, // assigned to company id (int)
                                'page'       => -1,
                                'perPage'       => -1,
                                'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION)

                            ));

                    }
                    /*

                    #} With quotes?
                    if ($withQuotes){

                        // add all quotes lines
                        $res['quotes'] = $this->DAL()->getObjsLinkedToObj(array(
                                'objtypefrom'   =>  ZBS_TYPE_QUOTE, // quote
                                'objtypeto'     =>  ZBS_TYPE_COMPANY, // company
                                'objfromid'     =>  $potentialRes->ID));
                    
                    }

                    #} With invoices?
                    if ($withQuotes){

                        // add all invoices lines
                        $res['invoices'] = $this->DAL()->getObjsLinkedToObj(array(
                                'objtypefrom'   =>  ZBS_TYPE_INVOICE, // invoice
                                'objtypeto'     =>  ZBS_TYPE_COMPANY, // company
                                'objfromid'     =>  $potentialRes->ID));
                    
                    }

                    #} With transactions?
                    if ($withTransactions){

                        // add all transactions lines
                        $res['transactions'] = $this->DAL()->getObjsLinkedToObj(array(
                                'objtypefrom'   =>  ZBS_TYPE_TRANSACTION, // transaction
                                'objtypeto'     =>  ZBS_TYPE_COMPANY, // company
                                'objfromid'     =>  $potentialRes->ID));
                    
                    } */

                    #} With most recent log? #DB1LEGACY (TOMOVE)
                    if ($withLastLog){

                        $res['lastlog'] = $this->DAL()->logs->getLogsForObj(array(

                                                'objtype' => ZBS_TYPE_COMPANY,
                                                'objid' => $potentialRes->ID,

                                                'incMeta'   => true,

                                                'sortByField'   => 'zbsl_created',
                                                'sortOrder'     => 'DESC',
                                                'page'          => 0,
                                                'perPage'       => 1

                                            ));

                    }

                    if ($withContacts){

                            // add all assigned contacts/companies
                            $res['contacts'] = $this->DAL()->contacts->getContacts(array(
                                'isLinkedToObjType'=>ZBS_TYPE_COMPANY,
                                'isLinkedToObjID'=>$potentialRes->ID,
                                'page'=>-1,
                                'perPage'=>100, // commonsense cap
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                    }

                    if ($withTags){

                        // add all tags lines
                        $res['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_COMPANY,'objid'=>$potentialRes->ID));
                    
                    }
                    
                    #} With Assigned?
                    if ($withOwner){

                        $res['owner'] = zeroBS_getOwner($potentialRes->ID,true,'zerobs_company',$potentialRes->zbs_owner);

                    }

                    #} With Tasks?
                    if ($withTasks){
                        
                        //DAL3 ver, more perf, gets all
                        $res['tasks'] = $zbs->DAL->events->getEvents(array(

                                'assignedCompany'   => $potentialRes->ID, // assigned to company id (int)
                                'page'       => -1,
                                'perPage'       => -1,
                                'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_EVENT),                                    
                                'sortByField'   => 'zbse_start',
                                'sortOrder'     => 'DESC',
                                'withAssigned'  => false // no need, it's assigned to this obj already

                            ));

                    }

                    // simplistic, could be optimised (though low use means later.)
                    if ( $withExternalSources ){
                        
                        $res['external_sources'] = $zbs->DAL->getExternalSources( array(
            
                            'objectID'      => $potentialRes->ID,
                            'objectType'    => ZBS_TYPE_COMPANY,
                            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_COMPANY )

                        ));

                    }
                    if ( $withExternalSourcesGrouped ){
                        
                        $res['external_sources'] = $zbs->DAL->getExternalSources( -1, array(
                        
                            'objectID'          => $potentialRes->ID, 
                            'objectType'        => ZBS_TYPE_COMPANY,
                            'grouped_by_source' => true,
                            'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_COMPANY )

                        ));

                    }


                    return $res;

            }

        } // / if ID

        return false;

    }

    /**
     * returns company detail lines
     *
     * @param array $args Associative array of arguments
     *
     * @return array of company lines
     */
    public function getCompanies($args=array()){

        global $zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'searchPhrase'  => '', // searches which fields?
            'inArr'             => false,
            'isTagged'          => false, // 1x INT OR array(1,2,3)
            'isNotTagged'       => false, // 1x INT OR array(1,2,3)
            'ownedBy'           => false,
            'externalSource'    => false, // e.g. paypal
            'olderThan'         => false, // uts
            'newerThan'         => false, // uts
            'hasStatus'         => false, // Lead (this takes over from the quick filter post 19/6/18)
            'otherStatus'       => false, // status other than 'Lead'
            'hasContact'        => false, // has a contact of this ID associated with it
            'quickFilters'      => false, // booo

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
            'withCustomFields'  => true,            
            'withQuotes'        => false, // Will only be operable when Company<->Quotes established
            'withInvoices'      => false,
            'withTransactions'  => false,
            'withTasks'         => false,
            'withTags'          => false,
            'withOwner'         => false,
            'withLogs'          => false,
            'withLastLog'       => false,
            'withValues'        => false, // if passed, returns with 'total' 'invoices_total' 'transactions_total' etc. (requires getting all obj, use sparingly)
            'withContacts'      => true, // return ['contact'] objs
            'withExternalSources' => false,
            'withExternalSourcesGrouped' => false,
            'simplified'        => false, // returns just id,name,created (for typeaheads)
            'onlyColumns'       => false, // if passed (array('fname','lname')) will return only those columns (overwrites some other 'return' options). NOTE: only works for base fields (not custom fields)

            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0, // this is what page it is (gets * by for limit)
            'perPage'       => 100,

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY), // this'll let you not-check the owner of obj


        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        global $ZBSCRM_t,$wpdb,$zbs;  
        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array(); $joinQ = ''; $extraSelect = ''; $whereCase = 'AND';

        #} ============= PRE-QUERY ============

            #} Capitalise this
            $sortOrder = strtoupper($sortOrder);

            #} If just count, or simplified, turn off any extra gumpf
            if ( $count || $simplified ) {
                $withCustomFields = false;
                $withTags = false;
                $withOwner = false;
                $withLogs = false;
                $withLastLog = false;
                $withContacts = false;
                $withTasks = false;
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
                    $withTags = false;
                    $withOwner = false;
                    $withLogs = false;
                    $withLastLog = false;
                    $withContacts = false;
                    $withTasks = false;
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
                $custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_COMPANY));

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
                    $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = company.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) ".$cKey;
                    
                    // add params
                    $params[] = $cK; $params[] = ZBS_TYPE_COMPANY;

                }

            }

            // Add any addr custom fields for addr1+addr2
            // no need if simpliefied or count parameters passed
            if (!$simplified && !$count && !$onlyColumns){
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

                        // we also check the $sortByField in case that's the same cf
                        if ($cfKey == $sortByField) $sortByField = $cKey;
                        if ($cfKey2 == $sortByField) $sortByField = $cKey2;

                        // addr 1
                            // add as subquery
                            $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = company.ID AND zbscf_objkey = %s AND zbscf_objtype = %d) ".$cKey;                        
                            // add params
                            $params[] = $cfKey; $params[] = ZBS_TYPE_COMPANY;
                        // addr 2
                            // add as subquery
                            $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = company.ID AND zbscf_objkey = %s AND zbscf_objtype = %d) ".$cKey2;                        
                            // add params
                            $params[] = $cfKey2; $params[] = ZBS_TYPE_COMPANY;

                    }


                }

            }

            // ==== TOTAL VALUES

            // Calculate total vals etc. with SQL 
            if (!$simplified && !$count && $withValues && !$onlyColumns){

                // arguably, if getting $withInvoices etc. may be more performant to calc this in php in AFTER loop, 
                // ... for now as a fair guess, this'll be most performant:
                // ... we calc total by adding invs + trans below :)

                // only include transactions with statuses which should be included in total value:
                $transStatusQueryAdd = $this->DAL()->transactions->getTransactionStatusesToIncludeQuery();  

                // When Company<->Quotes: 
                // $extraSelect .= ',(SELECT SUM(quotestotal.zbsq_value) FROM '.$ZBSCRM_t['quotes'].' as quotestotal WHERE quotestotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_QUOTE." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = company.ID)) as quotes_total";
                // invs:
                $extraSelect .= ',(SELECT SUM(invstotal.zbsi_total) FROM '.$ZBSCRM_t['invoices'].' as invstotal WHERE invstotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_INVOICE." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = company.ID)) as invoices_total";
                // trans (with status):
                $extraSelect .= ',(SELECT SUM(transtotal.zbst_total) FROM '.$ZBSCRM_t['transactions'].' as transtotal WHERE transtotal.ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_TRANSACTION." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = company.ID)".$transStatusQueryAdd.") as transactions_total";
                // paid balance against invs  (also in getCompany)
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
                $extraSelect .= '(SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_INVOICE.' AND zbsol_objtype_to = '.ZBS_TYPE_COMPANY.' AND zbsol_objid_to = company.ID)';
                $extraSelect .= ')'.$transStatusQueryAdd.') as transactions_paid_total';
            }

            // ==== / TOTAL VALUES

        #} ============ / PRE-QUERY ===========

        #} Build query
        $query = "SELECT company.*".$extraSelect." FROM ".$ZBSCRM_t['companies'].' as company'.$joinQ;

        #} Count override
        if ($count) $query = "SELECT COUNT(company.ID) FROM ".$ZBSCRM_t['companies'].' as company'.$joinQ;

        #} simplified override
        if ($simplified) $query = "SELECT company.ID as id,company.zbsco_name as name,company.zbsco_created as created,company.zbsco_email as email FROM ".$ZBSCRM_t['companies'].' as company'.$joinQ;

        #} onlyColumns override
        if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

            $columnStr = '';
            foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                if (!empty($columnStr)) $columnStr .= ',';
                // this presumes str is db-safe? could do with sanitation?
                $columnStr .= $colDBKey;

            }

            $query = "SELECT ".$columnStr." FROM ".$ZBSCRM_t['companies'].' as company'.$joinQ;

        }

        #} ============= WHERE ================

            #} Add Search phrase
            if (!empty($searchPhrase)){

                // search? - ALL THESE COLS should probs have index of FULLTEXT in db?
                $searchWheres = array();
                $searchWheres['search_ID'] = array('ID','=','%d',$searchPhrase);
                $searchWheres['search_name'] = array('zbsco_name','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_email'] = array('zbsco_email','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_maintel'] = array('zbsco_maintel','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_sectel'] = array('zbsco_sectel','LIKE','%s','%'.$searchPhrase.'%');

                // address elements
                $searchWheres['search_addr1'] = array('zbsco_addr1','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_addr2'] = array('zbsco_addr2','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_city'] = array('zbsco_city','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_county'] = array('zbsco_county','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_country'] = array('zbsco_country','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_postcode'] = array('zbsco_postcode','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_secaddr1'] = array('zbsco_secaddr1','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_secaddr2'] = array('zbsco_secaddr2','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_seccity'] = array('zbsco_seccity','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_seccounty'] = array('zbsco_seccounty','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_seccountry'] = array('zbsco_seccountry','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_secpostcode'] = array('zbsco_secpostcode','LIKE','%s','%'.$searchPhrase.'%');

                // social
                $searchWheres['search_tw'] = array('zbsco_tw','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_li'] = array('zbsco_li','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_fb'] = array('zbsco_fb','LIKE','%s','%'.$searchPhrase.'%');

                // 3.0.13 - Added ability to search custom fields (optionally)
                $customFieldSearch = zeroBSCRM_getSetting('customfieldsearch');
                if ($customFieldSearch == 1){
                
                    // simplistic add
                    // NOTE: This IGNORES ownership of custom field lines.
                    $searchWheres['search_customfields'] = array('ID','IN',"(SELECT zbscf_objid FROM ".$ZBSCRM_t['customfields']." WHERE zbscf_objval LIKE %s AND zbscf_objtype = ".ZBS_TYPE_COMPANY.")",'%'.$searchPhrase.'%');

                }

                // This generates a query like 'zbsco_fname LIKE %s OR zbsco_lname LIKE %s', 
                // which we then need to include as direct subquery (below) in main query :)
                $searchQueryArr = $this->buildWheres($searchWheres,'',array(),'OR',false);
                
                if (is_array($searchQueryArr) && isset($searchQueryArr['where']) && !empty($searchQueryArr['where'])){

                    // add it
                    $wheres['direct'][] = array('('.$searchQueryArr['where'].')',$searchQueryArr['params']);

                }

            }
            
            #} In array (if inCompany passed, this'll currently overwrite that?! (todo2.5))
            if (is_array($inArr) && count($inArr) > 0){

                // clean for ints
                $inArrChecked = array(); foreach ($inArr as $x){ $inArrChecked[] = (int)$x; }

                // add where
                $wheres['inarray'] = array('ID','IN','('.implode(',',$inArrChecked).')');

            }

            #} Owned by
            if (is_int($ownedBy) && !empty($ownedBy) && $ownedBy > 0){
                
                // would never hard-type this in (would make generic as in buildWPMetaQueryWhere)
                // but this is only here until MIGRATED to db2 globally
                //$wheres['incompany'] = array('ID','IN','(SELECT DISTINCT post_id FROM '.$wpdb->prefix."postmeta WHERE meta_key = 'zbs_company' AND meta_value = %d)",$inCompany);
                // Use obj links now 
                $wheres['ownedBy'] = array('zbs_owner','=','%s',$ownedBy);

            }

            // External sources
            if ( !empty( $externalSource ) ){

                // NO owernship built into this, check when roll out multi-layered ownsership
                $wheres['externalsource'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_COMPANY." AND zbss_source = %s)",$externalSource);

            }

            // quick addition for mike
            #} olderThan
            if (!empty($olderThan) && $olderThan > 0 && $olderThan !== false) $wheres['olderThan'] = array('zbsco_created','<=','%d',$olderThan);
            #} newerThan
            if (!empty($newerThan) && $newerThan > 0 && $newerThan !== false) $wheres['newerThan'] = array('zbsco_created','>=','%d',$newerThan);

            // status
            if (!empty($hasStatus) && $hasStatus !== false) $wheres['hasStatus'] = array('zbsco_status','=','%s',$hasStatus);
            if (!empty($otherStatus) && $otherStatus !== false) $wheres['otherStatus'] = array('zbsco_status','<>','%s',$otherStatus);

            #} inCounty
            if (!empty($inCounty) && !empty($inCounty) && $inCounty !== false) {
                $wheres['inCounty'] = array('zbsco_county','=','%s',$inCounty);
                $wheres['inCountyAddr2'] = array('zbsco_secaddrcounty','=','%s',$inCounty);
            }
            #} inPostCode
            if (!empty($inPostCode) && !empty($inPostCode) && $inPostCode !== false) {
                $wheres['inPostCode'] = array('zbsco_postcode','=','%s',$inPostCode);
                $wheres['inPostCodeAddr2'] = array('zbsco_secaddrpostcode','=','%s',$inPostCode);
            }
            #} inCountry
            if (!empty($inCountry) && !empty($inCountry) && $inCountry !== false) {
                $wheres['inCountry'] = array('zbsco_country','=','%s',$inCountry);
                $wheres['inCountryAddr2'] = array('zbsco_secaddrcountry','=','%s',$inCountry);
            }
            #} notInCounty
            if (!empty($notInCounty) && !empty($notInCounty) && $notInCounty !== false) {
                $wheres['notInCounty'] = array('zbsco_county','<>','%s',$notInCounty);
                $wheres['notInCountyAddr2'] = array('zbsco_secaddrcounty','<>','%s',$notInCounty);
            }
            #} notInPostCode
            if (!empty($notInPostCode) && !empty($notInPostCode) && $notInPostCode !== false) {
                $wheres['notInPostCode'] = array('zbsco_postcode','<>','%s',$notInPostCode);
                $wheres['notInPostCodeAddr2'] = array('zbsco_secaddrpostcode','<>','%s',$notInPostCode);
            }
            #} notInCountry
            if (!empty($notInCountry) && !empty($notInCountry) && $notInCountry !== false) {
                $wheres['notInCountry'] = array('zbsco_country','<>','%s',$notInCountry);
                $wheres['notInCountryAddr2'] = array('zbsco_secaddrcountry','<>','%s',$notInCountry);
            }

            // has contact associated with it
            if (!empty($hasContact) && $hasContact !== false && $hasContact > 0) $wheres['hasContact'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_CONTACT." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = company.ID)");


            // generic obj links, e.g. quotes, invs, trans 
            // e.g. contact(s) assigned to inv 123
            // Where the link relationship is OBJECT -> CONTACT
            if (!empty($hasObjIDLinkedTo) && $hasObjIDLinkedTo !== false && $hasObjIDLinkedTo > 0 && 
                !empty($hasObjTypeLinkedTo) && $hasObjTypeLinkedTo !== false && $hasObjTypeLinkedTo > 0) {
                $wheres['hasObjIDLinkedTo'] = array('ID','IN','(SELECT zbsol_objid_to FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = %d AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_from = %d AND zbsol_objid_to = company.ID)",array($hasObjTypeLinkedTo,$hasObjIDLinkedTo));

            }

            // generic obj links, e.g. companies
            // Where the link relationship is CONTACT -> OBJECT
            if (!empty($isLinkedToObjID) && $isLinkedToObjID !== false && $isLinkedToObjID > 0 && 
                !empty($isLinkedToObjType) && $isLinkedToObjType !== false && $isLinkedToObjType > 0) {
                $wheres['isLinkedToObjID'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_COMPANY." AND zbsol_objtype_to = %d AND zbsol_objid_from = company.ID AND zbsol_objid_to = %d)",array($isLinkedToObjType,$isLinkedToObjID));

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
                        if (substr($qFilter,0,7) == 'status_'){

                            $qFilterStatus = substr($qFilter,7);
                            $qFilterStatus = str_replace('_',' ',$qFilterStatus);

                            // check status
                            $wheres['quickfilterstatus'] = array('zbsco_status','LIKE','%s',ucwords($qFilterStatus));

                        } elseif (substr($qFilter,0,14) == 'notcontactedin'){

                                // check
                                $notcontactedinDays = (int)substr($qFilter,14);
                                $notcontactedinDaysSeconds = $notcontactedinDays*86400;
                                $wheres['notcontactedinx'] = array('zbsco_lastcontacted','<','%d',time()-$notcontactedinDaysSeconds);

                        } elseif (substr($qFilter,0,9) == 'olderthan'){

                                // check
                                $olderThanDays = (int)substr($qFilter,9);
                                $olderThanDaysSeconds = $olderThanDays*86400;
                                $wheres['olderthanx'] = array('zbsco_created','<','%d',time()-$olderThanDaysSeconds);

                        } else {

                                // normal/hardtyped

                                switch ($qFilter){


                                    case 'lead':

                                        // hack "leads only" - adapted from DAL1 (probs can be slicker)
                                        $wheres['quickfilterlead'] = array('zbsco_status','LIKE','%s','Lead');

                                        break;


                                    case 'customer':

                                        // hack - adapted from DAL1 (probs can be slicker)
										$wheres['quickfiltercustomer'] = array( 'zbsco_status', 'LIKE', '%s', 'Customer' );

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
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = company.ID AND zbstl_tagid = %d) > 0)',array(ZBS_TYPE_COMPANY,$isTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = company.ID AND zbstl_tagid IN (%s)) > 0)',array(ZBS_TYPE_COMPANY,$tagStr));

                }

            }
            #} Is NOT Tagged (expects 1 tag ID OR array)

                // catch 1 item arr
                if (is_array($isNotTagged) && count($isNotTagged) == 1) $isNotTagged = $isNotTagged[0];
                
            if (!is_array($isNotTagged) && !empty($isNotTagged) && $isNotTagged > 0){

                // add where tagged                 
                // 1 int: 
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = company.ID AND zbstl_tagid = %d) = 0)',array(ZBS_TYPE_COMPANY,$isNotTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = company.ID AND zbstl_tagid IN (%s)) = 0)',array(ZBS_TYPE_COMPANY,$tagStr));

                }

            }

        

        #} ============ / WHERE ===============

        #} ============   SORT   ==============

            // Obj Model based sort conversion
            // converts 'addr1' => 'zbsco_addr1' generically
            if (isset($this->objectModel[$sortByField]) && isset($this->objectModel[$sortByField]['fieldname'])) $sortByField = $this->objectModel[$sortByField]['fieldname'];

            // Mapped sorts
            // This catches listview and other exception sort cases
            $sort_map = array(
                'id'                    => 'ID',
                'assigned'              => 'zbsco_owner',
                'fullname'              => 'zbsco_name',
                'status'                => 'zbsco_status',
                'email'                 => 'zbsco_email',
                
                // contacts (count)
                'contacts'              => '(SELECT COUNT(ID) FROM '.$ZBSCRM_t['contacts'].' WHERE ID IN (SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_CONTACT.' AND zbsol_objtype_to = '.ZBS_TYPE_COMPANY.' AND zbsol_objid_to = company.ID))',
            
                // has & counts (same queries)
                'hasinvoice'       => '(SELECT COUNT(ID) FROM '.$ZBSCRM_t['invoices'].' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_INVOICE.' AND zbsol_objtype_to = '.ZBS_TYPE_COMPANY.' AND zbsol_objid_to = company.ID))',
                'hastransaction'   => '(SELECT COUNT(ID) FROM '.$ZBSCRM_t['transactions'].' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_TRANSACTION.' AND zbsol_objtype_to = '.ZBS_TYPE_COMPANY.' AND zbsol_objid_to = company.ID))',                        
                'invoicecount'     => '(SELECT COUNT(ID) FROM '.$ZBSCRM_t['invoices'].' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_INVOICE.' AND zbsol_objtype_to = '.ZBS_TYPE_COMPANY.' AND zbsol_objid_to = company.ID))',
                'transactioncount' => '(SELECT COUNT(ID) FROM '.$ZBSCRM_t['transactions'].' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_TRANSACTION.' AND zbsol_objtype_to = '.ZBS_TYPE_COMPANY.' AND zbsol_objid_to = company.ID))',

                // following will only work if obj total value subqueries triggered above ^
                'totalvalue'       => '((IFNULL(invoices_total,0) + IFNULL(transactions_total,0)) - IFNULL(transactions_paid_total,0))', // custom sort by total invoice value + transaction value - paid transactions (as mimicking tidy_contact php logic into SQL)
                'transactiontotal' => 'transactions_total',
                'invoicetotal'     => 'invoices_total',

                // When Company<->Quotes: 
                /*
                'hasquote'         => '(SELECT COUNT(ID) FROM '.$ZBSCRM_t['quotes'].' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_QUOTE.' AND zbsol_objtype_to = '.ZBS_TYPE_COMPANY.' AND zbsol_objid_to = company.ID))',
                'quotetotal'       => 'quotes_total',
                'quotecount'       => '(SELECT COUNT(ID) FROM '.$ZBSCRM_t['quotes'].' WHERE ID IN (SELECT DISTINCT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_QUOTE.' AND zbsol_objtype_to = '.ZBS_TYPE_COMPANY.' AND zbsol_objid_to = company.ID))',
                */

            );
            
            if ( array_key_exists( $sortByField, $sort_map ) ) {

                $sortByField = $sort_map[ $sortByField ];

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

            #} Prep & run query
            $queryObj = $this->prepare($query,$params);

            #} Catch count + return if requested
            if ($count) return $wpdb->get_var($queryObj);

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
                            
                        // tidy
                        $resArr = $this->tidy_company($resDataLine,$withCustomFields);

                    }

                    if ($withTags){

                        // add all tags lines
                        $resArr['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_COMPANY,'objid'=>$resDataLine->ID));

                    }

                    #} With most recent log? #DB1LEGACY (TOMOVE)
                    if ($withLastLog){

                        // doesn't return singular, for now using arr
                        $potentialLogs = $this->DAL()->logs->getLogsForObj(array(

                                                'objtype' => ZBS_TYPE_COMPANY,
                                                'objid' => $resDataLine->ID,
                                                
                                                'incMeta'   => true,

                                                'sortByField'   => 'zbsl_created',
                                                'sortOrder'     => 'DESC',
                                                'page'          => 0,
                                                'perPage'       => 1

                                            ));

                        if (is_array($potentialLogs) && count($potentialLogs) > 0) $resArr['lastlog'] = $potentialLogs[0];

                        // CONTACT logs specificaly
                        // doesn't return singular, for now using arr
                        $potentialLogs = $this->DAL()->logs>getLogsForObj(array(

                                                'objtype' => ZBS_TYPE_COMPANY,
                                                'objid' => $resDataLine->ID,

                                                'notetypes' => $zbs->DAL->logs->contactLogTypes,
                                                
                                                'incMeta'   => true,

                                                'sortByField'   => 'zbsl_created',
                                                'sortOrder'     => 'DESC',
                                                'page'          => 0,
                                                'perPage'       => 1

                                            ));

                        if (is_array($potentialLogs) && count($potentialLogs) > 0) $resArr['lastcontactlog'] = $potentialLogs[0];

                    }

                    #} With Assigned?
                    if ($withOwner){

                        $resArr['owner'] = zeroBS_getOwner($resDataLine->ID,true,'zerobs_company',$resDataLine->zbs_owner);

                    }

                    #} use sql instead #DB1LEGACY (TOMOVE)
                    /* Needs writing for DAL3 
    
                        - note. I've left this here (4/2/19) because I believe the following/DAL3 generally might be
                        ... such a performance hike that this is irrelevant.
                        ... can later homogenise the following/these *WITHX* stuffs into 1 query, though not sure it'll produce 
                        ... much perf gains.

                    if ($withInvoices && $withQuotes && $withTransactions){

                        $custDeets = zeroBS_getCustomerExtrasViaSQL($resDataLine->ID);
                        $resArr['quotes'] = $custDeets['quotes'];
                        $resArr['invoices'] = $custDeets['invoices'];
                        $resArr['transactions'] = $custDeets['transactions'];


                    } else { */
                        


                        if ($withContacts){

                            // add all assigned contacts/companies
                            $resArr['contacts'] = $this->DAL()->contacts->getContacts(array(
                                'isLinkedToObjType'=>ZBS_TYPE_COMPANY,
                                'isLinkedToObjID'=>$resDataLine->ID,
                                'page'=>-1,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                        }

                        if ($withInvoices){
                            
                            #} only gets first 100?
                            #} CURRENTLY inc meta..? (isn't huge... but isn't efficient)
                            //$resArr['invoices']         = zeroBS_getInvoicesForCompany($resDataLine->ID,true,100);
                            //DAL3 ver, more perf, gets all
                            $resArr['invoices'] = $zbs->DAL->invoices->getInvoices(array(

                                    'assignedCompany'   => $resDataLine->ID, // assigned to company id (int)
                                    'page'       => -1,
                                    'perPage'       => -1,
                                    'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE)

                                ));

                        }

                        if ( $withQuotes ) {
                            
                            //DAL3 ver, more perf, gets all
                            $resArr['quotes'] = $zbs->DAL->quotes->getQuotes(array(

                                    'assignedCompany'   => $resDataLine->ID, // assigned to company id (int)
                                    'page'       => -1,
                                    'perPage'       => -1,
                                    'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE)

                                ));

                        }

                        #} ... brutal for mvp #DB1LEGACY (TOMOVE)
                        if ($withTransactions){
                            
                            //DAL3 ver, more perf, gets all
                            $resArr['transactions'] = $zbs->DAL->transactions->getTransactions(array(

                                    'assignedCompany'   => $resDataLine->ID, // assigned to company id (int)
                                    'page'       => -1,
                                    'perPage'       => -1,
                                    'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION)

                                ));

                        }

                        #} ... brutal for mvp #DB1LEGACY (TOMOVE)
                        if ($withTasks){
                            
                            $res['tasks'] = $zbs->DAL->events->getEvents(array(

                                    'assignedCompany'   => $resDataLine->ID, // assigned to company id (int)
                                    'page'       => -1,
                                    'perPage'       => -1,
                                    'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_EVENT),                                    
                                    'sortByField'   => 'zbse_start',
                                    'sortOrder'     => 'DESC',
                                    'withAssigned'  => false // no need, it's assigned to this obj already

                                ));

                        }

                        // simplistic, could be optimised (though low use means later.)
                        if ( $withExternalSources ){
                            
                            $res['external_sources'] = $zbs->DAL->getExternalSources( array(
                
                                'objectID'      => $resDataLine->ID,
                                'objectType'    => ZBS_TYPE_COMPANY,
                                'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)

                            ));

                        }
                        if ( $withExternalSourcesGrouped ){
                            
                            $res['external_sources'] = $zbs->DAL->getExternalSources( -1, array(
                            
                                'objectID'          => $resDataLine->ID, 
                                'objectType'        => ZBS_TYPE_COMPANY,
                                'grouped_by_source' => true,
                                'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_COMPANY )

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
     * Returns a count of companies (owned)
     * .. inc by status
     *
     * @return int count
     */
    public function getCompanyCount($args=array()){

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'withStatus'    => false, // will be str if used

            // permissions
            'ignoreowner'   => true, // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $whereArr = array();

        if ($withStatus !== false && !empty($withStatus)) $whereArr['status'] = array('zbsco_status','=','%s',$withStatus);

        return $this->DAL()->getFieldByWHERE(array(
            'objtype' => ZBS_TYPE_COMPANY,
            'colname' => 'COUNT(ID)',
            'where' => $whereArr,
            'ignoreowner' => $ignoreowner));
        
    }



     /**
     * adds or updates a company object
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateCompany($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;
            
        #} Retrieve any cf
        $customFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_COMPANY));
        $addrCustomFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_ADDRESS));

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'owner'         => -1,

            // fields (directly)
            'data'          => array(

                
                'status' => '',
                'name' => '',
                'email' => '',
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
                'maintel' => '',
                'sectel' => '',
                'wpid' => '',
                'avatar' => '',
                'tw' => '',
                'li' => '',
                'fb' => '',
                'lastcontacted' => '',

                // Note Custom fields may be passed here, but will not have defaults so check isset()

                // tags
                'tags' => -1, // pass an array of tag ids or tag strings
                'tag_mode' => 'replace', // replace|append|remove

                'externalSources' => -1, // if this is an array(array('source'=>src,'uid'=>uid),multiple()) it'll add :)

                // allow this to be set for MS sync etc.
                'created' => -1,
                'lastupdated' => '',

                // obj links:
                'contacts' => false, // array of id's

            ),

            'limitedFields' => -1, // if this is set it OVERRIDES data (allowing you to set specific fields + leave rest in tact)
            // ^^ will look like: array(array('key'=>x,'val'=>y,'type'=>'%s'))

            // this function as DAL1 func did. 
            'extraMeta'     => -1,
            'automatorPassthrough' => -1,
            'fallBackLog' => -1,

            'silentInsert' => false, // this was for init Migration - it KILLS all IA for newCompany (because is migrating, not creating new :) this was -1 before

            'do_not_update_blanks' => false // this allows you to not update fields if blank (same as fieldoverride for extsource -> in)

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        
            // Needs this to grab custom fields (if passed) too :)
            if (is_array($customFields)) foreach ($customFields as $cK => $cF){

                // only for data, limited fields below
                if (is_array($data)) {

                    if (isset($args['data'][$cK])) $data[$cK] = $args['data'][$cK];

                }

            }

            // this takes limited fields + checks through for custom fields present
            // (either as key zbsco_source or source, for example)
            // then switches them into the $data array, for separate update
            // where this'll fall over is if NO normal contact data is sent to update, just custom fields
            if (is_array($limitedFields) && is_array($customFields)){

                    //$customFieldKeys = array_keys($customFields);
                    $newLimitedFields = array();

                    // cycle through
                    foreach ($limitedFields as $field){

                        // some weird case where getting empties, so added check
                        if (isset($field['key']) && !empty($field['key'])){ 

                            $dePrefixed = ''; if (substr($field['key'],0,strlen('zbsco_')) === 'zbsco_') $dePrefixed = substr($field['key'], strlen('zbsco_'));

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
            if ($owner > 0 && !user_can($owner,'admin_zerobs_usr')) $owner = -1;

            // if owner = -1, add current
            if (!isset($owner) || $owner === -1) { $owner = zeroBSCRM_user(); }


            if (is_array($limitedFields)){ 

                // LIMITED UPDATE (only a few fields.)
                if (!is_array($limitedFields) || count ($limitedFields) <= 0) return false;
                // REQ. ID too (can only update)
                if (empty($id) || $id <= 0) return false;

            } else {

                // NORMAL, FULL UPDATE

                // check email + load that user if present
                if (!isset($data['email']) || empty($data['email'])){

                    // no email
                    // Allow users without emails? WH removed this for db1->2 migration
                    // leaving this in breaks MIGRATIONS from DAL 1
                    // in that those companies without emails will not be copied in
                    // return false;

                } else {

                    // email present, check if it matches ID? 
                    if (!empty($id) && $id > 0){

                        // if ID + email, check if existing contact with email, (e.g. in use)
                        // ... allow it if the ID of that email contact matches the ID given here
                        // (else e.g. add email x to ID y without checking)
                        $potentialUSERID = (int)$this->getCompany(-1,array('email'=>$data['email'],'ignoreOwner'=>1,'onlyID'=>1));
                        if (!empty($potentialUSERID) && $potentialUSERID > 0 && $id > 0 && $potentialUSERID != $id){

                            // email doesn't match ID 
                            return false;
                        }

                        // also check if has rights?!? Could be just email passed here + therefor got around owner check? hmm.

                    } else {

                        // no ID, check if email present, and then update that co if so
                        $potentialUSERID = (int)$this->getCompany(-1,array('email'=>$data['email'],'ignoreOwner'=>1,'onlyID'=>1));
                        if (isset($potentialUSERID) && !empty($potentialUSERID) && $potentialUSERID > 0) { $id = $potentialUSERID; }

                    }


                }

            }


            #} If no status, and default is specified in settings, add that in :)
            if (is_null($data['status']) || !isset($data['status']) || empty($data['status'])){

                // Default status for obj? -> this one gets for contacts -> $zbsCustomerMeta['status'] = zeroBSCRM_getSetting('defaultstatus');

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
            if ($do_not_update_blanks){

                    // this setting says 'don't override filled-out data with blanks'
                    // so here we check through any passed blanks + convert to limitedFields
                    // only matters if $id is set (there is somt to update not add
                    if (isset($id) && !empty($id) && $id > 0){

                        // get data to copy over (for now, this is required to remove 'fullname' etc.)
                        $dbData = $this->db_ready_company($data); 
                        //unset($dbData['id']); // this is unset because we use $id, and is update, so not req. legacy issue
                        //unset($dbData['created']); // this is unset because this uses an obj which has been 'updated' against original details, where created is output in the WRONG format :)

                        $origData = $data; //$data = array();               
                        $limitedData = array(); // array(array('key'=>'zbsco_x','val'=>y,'type'=>'%s'))

                        // cycle through + translate into limitedFields (removing any blanks, or arrays (e.g. externalSources))
                        // we also have to remake a 'faux' data (removing blanks for tags etc.) for the post-update updates
                        foreach ($dbData as $k => $v){

                            $intV = (int)$v;

                            // only add if valuenot empty
                            if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){

                                // add to update arr
                                $limitedData[] = array(
                                    'key' => 'zbsco_'.$k, // we have to add zbsco_ here because translating from data -> limited fields
                                    'val' => $v,
                                    'type' => $this->getTypeStr('zbsco_'.$k)
                                );                              

                                // add to remade $data for post-update updates
                                $data[$k] = $v;

                            }

                        }

                        // copy over
                        $limitedFields = $limitedData;

                    } // / if ID

            } // / if do_not_update_blanks

        #} ========= / OVERRIDE SETTING (Deny blank overrides) ===========


        #} ========= BUILD DATA ===========

            $update = false; $dataArr = array(); $typeArr = array();

            if (is_array($limitedFields)){

                // LIMITED FIELDS
                $update = true;

                // cycle through
                foreach ($limitedFields as $field){

                    // some weird case where getting empties, so added check
                    if (!empty($field['key'])){ 
                        $dataArr[$field['key']] = $field['val']; 
                        $typeArr[] = $field['type'];
                    }

                }

                // add update time
                if (!isset($dataArr['zbsco_lastupdated'])){ $dataArr['zbsco_lastupdated'] = time(); $typeArr[] = '%d'; }

            } else {

                // FULL UPDATE/INSERT

                    // contacts - avoid dupes
                    if (isset($data['contacts']) && is_array($data['contacts'])){

                        $coArr = array();
                        foreach ($data['contacts'] as $c){
                            $cI = (int)$c;
                            if ($cI > 0 && !in_array($cI, $coArr)) $coArr[] = $cI;
                        }

                        // reset the main
                        if (count($coArr) > 0) 
                            $data['contacts'] = $coArr; 
                        else
                            $data['contacts'] = 'unset';
                        unset($coArr);

                    }

                    // UPDATE
                    $dataArr = array( 

                                // ownership
                                // no need to update these (as of yet) - can't move teams etc.
                                //'zbs_site' => zeroBSCRM_installSite(),
                                //'zbs_team' => zeroBSCRM_installTeam(),
                                //'zbs_owner' => $owner,

                                'zbsco_status' =>       $data['status'],
                                'zbsco_name' =>         $data['name'],
                                'zbsco_email' =>        $data['email'],
                                'zbsco_addr1' =>        $data['addr1'],
                                'zbsco_addr2' =>        $data['addr2'],
                                'zbsco_city' =>         $data['city'],
                                'zbsco_county' =>       $data['county'],
                                'zbsco_country' =>      $data['country'],
                                'zbsco_postcode' =>     $data['postcode'],
                                'zbsco_secaddr1' =>     $data['secaddr1'],
                                'zbsco_secaddr2' =>     $data['secaddr2'],
                                'zbsco_seccity' =>      $data['seccity'],
                                'zbsco_seccounty' =>    $data['seccounty'],
                                'zbsco_seccountry' =>   $data['seccountry'],
                                'zbsco_secpostcode' =>  $data['secpostcode'],
                                'zbsco_maintel' =>      $data['maintel'],
                                'zbsco_sectel' =>       $data['sectel'],
                                'zbsco_wpid' =>         $data['wpid'],
                                'zbsco_avatar' =>       $data['avatar'],
                                'zbsco_tw' =>           $data['tw'],
                                'zbsco_li' =>           $data['li'],
                                'zbsco_fb' =>           $data['fb'],
                                'zbsco_lastupdated' =>  time(),
                                'zbsco_lastcontacted' =>$data['lastcontacted'],

                            );

                    $typeArr = array( // field data types
                                //'%d',  // site
                                //'%d',  // team
                                //'%d',  // owner

                        
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
                                '%d',
                                '%d',

                            );

                if (!empty($id) && $id > 0){

                    // is update
                    $update = true;

                    // got owner change? - allow all basically?
                    if (isset($owner) && $owner > 0){

                        $dataArr['zbs_owner'] = $owner; $typeArr[] = '%d';

                    }

                } else {

                    // INSERT (get's few extra :D)
                    $update = false;
                    $dataArr['zbs_site'] = zeroBSCRM_site();    $typeArr[] = '%d';
                    $dataArr['zbs_team'] = zeroBSCRM_team();    $typeArr[] = '%d';
                    $dataArr['zbs_owner'] = $owner;             $typeArr[] = '%d';
                    if (isset($data['created']) && !empty($data['created']) && $data['created'] !== -1){
                        $dataArr['zbsco_created'] = $data['created'];$typeArr[] = '%d';
                    } else {
                        $dataArr['zbsco_created'] = time();          $typeArr[] = '%d';
                    }

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
            $dataArr = $this->wpdbChecks($dataArr);
            
        #} ========= / CHECK force_uniques & not_empty ================
        #} ============================================================ 
            
        #} Check if ID present
        if ($update){

                #} Check if obj exists (here) - for now just brutal update (will error when doesn't exist)
                $originalStatus = $this->getCompanyStatus($id);

                // log any change of status
                if (isset($dataArr['zbsco_status']) && !empty($dataArr['zbsco_status']) && !empty($originalStatus) && $dataArr['zbsco_status'] != $originalStatus){

                    // status change
                    $statusChange = array(
                        'from' => $originalStatus,
                        'to' => $dataArr['zbsco_status']
                        );
                }
            

                #} Attempt update
                if ($wpdb->update( 
                        $ZBSCRM_t['companies'], 
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
                                
                                // OBJ LINKS - contacts -> companies
                                // This would link Company -> Contacts, $this->addUpdateObjectLinks($id,$data['contacts'],ZBS_TYPE_CONTACT);
                                // ... but we need it Contacts -> Company, so use a direct call in this case:
                                if (is_array($data['contacts'])) foreach ($data['contacts'] as $contactID){
                                    
                                    // if is ID
                                    if ($contactID > 0){
                                            
                                            // append to it's links (in case it has other companies too)
                                            $this->DAL()->addUpdateObjLinks(array(
                                                                'objtypefrom'       => ZBS_TYPE_CONTACT,
                                                                'objtypeto'         => ZBS_TYPE_COMPANY,
                                                                'objfromid'         => $contactID,
                                                                'objtoids'          => array($id),
                                                                'mode'              => 'append'));

                                    }

                                }

                                // tags
                                if (isset($data['tags']) && is_array($data['tags'])) {

                                    $this->addUpdateCompanyTags(
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
                                        'obj_type_id'      => ZBS_TYPE_COMPANY,
                                        'external_sources' => isset($data['externalSources']) ? $data['externalSources'] : array(),
                                    )
                                ); // for IA below

                                // Custom fields?

                                    #} Cycle through + add/update if set
                                    if (is_array($customFields)) foreach ($customFields as $cK => $cF){

                                        // any?
                                        if (isset($data[$cK])){

                                            // add update
                                            $cfID = $this->DAL()->addUpdateCustomField(array(
                                                'data'  => array(
                                                        'objtype'   => ZBS_TYPE_COMPANY,
                                                        'objid'     => $id,
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

                                            // any?
                                            if (isset($data[$cKey])){

                                                // add update
                                                $cfID = $this->DAL()->addUpdateCustomField(array(
                                                    'data'  => array(
                                                            'objtype'   => ZBS_TYPE_COMPANY,
                                                            'objid'     => $id,
                                                            'objkey'    => $cKey,
                                                            'objval'    => $data[$cKey]
                                                    )));

                                            }

                                            // any?
                                            if (isset($data[$cKey2])){

                                                // add update
                                                $cfID = $this->DAL()->addUpdateCustomField(array(
                                                    'data'  => array(
                                                            'objtype'   => ZBS_TYPE_COMPANY,
                                                            'objid'     => $id,
                                                            'objkey'    => $cKey2,
                                                            'objval'    => $data[$cKey2]
                                                    )));

                                            }

                                        }


                                    }

                                // / Custom Fields

                            } // / if $data

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
                                    $this->DAL()->updateMeta(ZBS_TYPE_COMPANY,$id,'extra_'.$cleanKey,$v);

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
                                        $newOrUpdatedLogID = zeroBS_addUpdateCompanyLog($id,-1,-1,array(
                                            #} Anything here will get wrapped into an array and added as the meta vals
                                            'type' => $fallBackLog['type'],
                                            'shortdesc' => $fallBackLog['shortdesc'],
                                            'longdesc' => $zbsNoteLongDesc
                                        ));


                                }

                                // catch dirty flag (update of status) (note, after update_post_meta - as separate)
                                //if (isset($_POST['zbsco_status_dirtyflag']) && $_POST['zbsco_status_dirtyflag'] == "1"){
                                // actually here, it's set above
                                if (isset($statusChange) && is_array($statusChange)){

                                    // status has changed

                                    // IA
                                    zeroBSCRM_FireInternalAutomator('company.status.update',array(
                                        'id'=>$id,
                                        'againstid' => $id,
                                        'data'=> $dataArr,
                                        'from' => $statusChange['from'],
                                        'to' => $statusChange['to']
                                        ));

                                } 


                                // IA General company update (2.87+)
                                zeroBSCRM_FireInternalAutomator('company.update',array(
                                    'id'=>$id,
                                    'againstid' => $id,
                                    'data'=> $dataArr
                                    ));

                                

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
                        $ZBSCRM_t['companies'], 
                        $dataArr, 
                        $typeArr ) > 0){

                    #} Successfully inserted, lets return new ID
                    $newID = $wpdb->insert_id;
                                
                                
                    // OBJ LINKS - contacts -> companies
                    // This would link Company -> Contacts, $this->addUpdateObjectLinks($newID,$data['contacts'],ZBS_TYPE_CONTACT);
                    // ... but we need it Contacts -> Company, so use a direct call in this case:
                    if (is_array($data['contacts'])) foreach ($data['contacts'] as $contactID){

                        // if is ID
                        if ($contactID > 0){
                                
                                // append to it's links (in case it has other companies too)
                                $this->DAL()->addUpdateObjLinks(array(
                                                    'objtypefrom'       => ZBS_TYPE_CONTACT,
                                                    'objtypeto'         => ZBS_TYPE_COMPANY,
                                                    'objfromid'         => $contactID,
                                                    'objtoids'          => array($newID),
                                                    'mode'              => 'append'));

                        }

                    }

                    // tags
                    if (isset($data['tags']) && is_array($data['tags'])) {

                        $this->addUpdateCompanyTags(
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
                            'obj_type_id'      => ZBS_TYPE_COMPANY,
                            'external_sources' => isset($data['externalSources']) ? $data['externalSources'] : array(),
                        )
                    ); // for IA below

                    // Custom fields?

                        #} Cycle through + add/update if set
                        if (is_array($customFields)) foreach ($customFields as $cK => $cF){

                            // any?
                            if (isset($data[$cK])){

                                // add update
                                $cfID = $this->DAL()->addUpdateCustomField(array(
                                    'data'  => array(
                                            'objtype'   => ZBS_TYPE_COMPANY,
                                            'objid'     => $newID,
                                            'objkey'    => $cK,
                                            'objval'    => $data[$cK]
                                    )));

                            }

                        }

                    // / Custom Fields
                        

                    // Also got to catch any 'addr' custom fields :) 
                    if (is_array($addrCustomFields) && count($addrCustomFields) > 0){

                        foreach ($addrCustomFields as $cK => $cF){

                            $cKey = 'addr_'.$cK;
                            $cKey2 = 'secaddr_'.$cK;

                            if (isset($data[$cKey])){

                                // add update
                                $cfID = $this->DAL()->addUpdateCustomField(array(
                                    'data'  => array(
                                            'objtype'   => ZBS_TYPE_COMPANY,
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
                                            'objtype'   => ZBS_TYPE_COMPANY,
                                            'objid'     => $newID,
                                            'objkey'    => $cKey2,
                                            'objval'    => $data[$cKey2]
                                    )));

                            }

                        }


                    }

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
                            $this->DAL()->updateMeta(ZBS_TYPE_COMPANY,$newID,'extra_'.$cleanKey,$v);

                            #} Add it to this, which passes to IA
                            $confirmedExtraMeta[$cleanKey] = $v;

                        }

                    }



                    #} INTERNAL AUTOMATOR 
                    #} & 
                    #} FALLBACKS
                    // NEW CONTACT
                    if (!$silentInsert){

                        #} Add to automator
                        zeroBSCRM_FireInternalAutomator('company.new',array(
                            'id'=>$newID,
                            'data'=>$dataArr,
                            'extsource'=>$approvedExternalSource,
                            'automatorpassthrough'=>$automatorPassthrough, #} This passes through any custom log titles or whatever into the Internal automator recipe.
                            'extraMeta'=>$confirmedExtraMeta #} This is the "extraMeta" passed (as saved)
                        ));

                    }
                    
                    return $newID;

                } else {
                            
                    $msg = __('DB Insert Failed','zero-bs-crm');                    
                    $zbs->DAL->addError(303,$this->objectType,$msg,$dataArr);

                    #} Failed to Insert
                    return false;

                }

        }

        return false;

    }

     /**
     * adds or updates a company's tags
     * ... this is really just a wrapper for addUpdateObjectTags
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateCompanyTags($args=array()){

        global $ZBSCRM_t,$wpdb;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1, // co id
        
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
                'objtype'   => ZBS_TYPE_COMPANY,
                'objid'     => $id,
                'tag_input' => $tag_input,
                'tags'      => $tags,
                'tagIDs'    => $tagIDs,
                'mode'      => $mode
            )
        );

    }



     /**
     * deletes a company object
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteCompany($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'saveOrphans'   => true

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} Check ID & Delete :)
        $id = (int)$id;
        if (!empty($id) && $id > 0) {
            
            // delete orphans?
            if ($saveOrphans === false){

                // delete any tag links
                $this->DAL()->deleteTagObjLinks(array(

                        'objtype'       => ZBS_TYPE_COMPANY,
                        'objid'         => $id
                ));

                // delete any external source information
                $this->DAL()->delete_external_sources( array(

                    'obj_type'       => ZBS_TYPE_COMPANY,
                    'obj_id'         => $id,
                    'obj_source'    => 'all',

                ));
            }
        
            $del = zeroBSCRM_db2_deleteGeneric($id,'companies');

            #} Add to automator
            zeroBSCRM_FireInternalAutomator('company.delete',array(
                'id'=>$id,
                'saveOrphans'=>$saveOrphans
            ));

            return $del;

        }

        return false;

    }

    /**
     * tidy's the object from wp db into clean array
     *
     * @param array $obj (DB obj)
     *
     * @return array company (clean obj)
     */
    private function tidy_company($obj=false,$withCustomFields=false){

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

            $res['status'] = $this->stripSlashes($obj->zbsco_status);
            $res['name'] = $this->stripSlashes($obj->zbsco_name);
            $res['email'] = $this->stripSlashes($obj->zbsco_email);
            $res['addr1'] = $this->stripSlashes($obj->zbsco_addr1);
            $res['addr2'] = $this->stripSlashes($obj->zbsco_addr2);
            $res['city'] = $this->stripSlashes($obj->zbsco_city);
            $res['county'] = $this->stripSlashes($obj->zbsco_county);
            $res['country'] = $this->stripSlashes($obj->zbsco_country);
            $res['postcode'] = $this->stripSlashes($obj->zbsco_postcode);
            $res['secaddr1'] = $this->stripSlashes($obj->zbsco_secaddr1);
            $res['secaddr2'] = $this->stripSlashes($obj->zbsco_secaddr2);
            $res['seccity'] = $this->stripSlashes($obj->zbsco_seccity);
            $res['seccounty'] = $this->stripSlashes($obj->zbsco_seccounty);
            $res['seccountry'] = $this->stripSlashes($obj->zbsco_seccountry);
            $res['secpostcode'] = $this->stripSlashes($obj->zbsco_secpostcode);
            $res['maintel'] = $this->stripSlashes($obj->zbsco_maintel);
            $res['sectel'] = $this->stripSlashes($obj->zbsco_sectel);
            $res['wpid'] = (int)$obj->zbsco_wpid;
            $res['avatar'] = $this->stripSlashes($obj->zbsco_avatar);
            $res['tw'] = $this->stripSlashes($obj->zbsco_tw);
            $res['li'] = $this->stripSlashes($obj->zbsco_li);
            $res['fb'] = $this->stripSlashes($obj->zbsco_fb);
            $res['created'] = (int)$obj->zbsco_created;
            $res['created_date'] = (isset($obj->zbsco_created) && $obj->zbsco_created > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsco_created,false,true) : false;
            $res['lastupdated'] = (int)$obj->zbsco_lastupdated;
            $res['lastupdated_date'] = (isset($obj->zbsco_lastupdated) && $obj->zbsco_lastupdated > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsco_lastupdated,false,true) : false;
            $res['lastcontacted'] = (int)$obj->zbsco_lastcontacted;
            $res['lastcontacted_date'] = (isset($obj->zbsco_lastcontacted) && $obj->zbsco_lastcontacted > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsco_lastcontacted,false,true) : false;
         

            // if have totals, pass them :)
            if (isset($obj->quotes_total)) $res['quotes_total'] = $obj->quotes_total;
            if (isset($obj->invoices_total)) $res['invoices_total'] = $obj->invoices_total;
            if (isset($obj->transactions_total)) $res['transactions_total'] = $obj->transactions_total;
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
            if ($withCustomFields) $res = $this->tidyAddCustomFields(ZBS_TYPE_COMPANY,$obj,$res,true);

        } 


        return $res;


    }


    /**
     * Wrapper, use $this->getCompanyMeta($contactID,$key) for easy retrieval of singular company
     * Simplifies $this->getMeta
     *
     * @param int objtype
     * @param int objid
     * @param string key
     *
     * @return array company meta result
     */
    public function getCompanyMeta($id=-1,$key='',$default=false){

        global $zbs;

        if (!empty($key)){

            return $this->DAL()->getMeta(array(

                'objtype' => ZBS_TYPE_COMPANY,
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
     * Returns an email addr against a Company
     *
     * @param int id Company ID
     *
     * @return string Company email
     */
    public function getCompanyEmail($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_COMPANY,
                'colname' => 'zbsco_email',
                'ignoreowner' => true));

        }

        return false;
        
    }
    
    /**
     * Returns an ownerid against a company
     * Replaces zeroBS_getCustomerOwner
     *
     * @param int id company ID
     *
     * @return int company owner id
     */
    public function getCompanyOwner($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_COMPANY,
                'colname' => 'zbs_owner',
                'ignoreowner'=>true));

        }

        return false;
        
    }

    /**
     * Returns an status against a company
     *
     * @param int id company ID
     *
     * @return str company status string
     */
    public function getCompanyStatus($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_COMPANY,
                'colname' => 'zbsco_status',
                'ignoreowner'=>true));

        }

        return false;
        
    }

    /**
     * Returns a formatted fullname (optionally including ID + first line of addr)
     * Replaces zeroBS_companyName
     *
     * @param int id Company ID
     * @param array Company array (if already loaded can pass)
     * @param array args (see format_fullname func)
     *
     * @return string Company full name
     */
    public function getCompanyNameEtc($id=-1,$companyArr=false,$args=array()){

        global $zbs;

        $id = (int)$id;

        // this makes sure it uses name not 'fname'
        $args['company'] = true;

        if ($id > 0){

                // get a limited-fields contact obj
                $company = $zbs->DAL->companies->getCompany($id,array('withCustomFields' => false,'fields'=>array('zbsco_addr1','zbsco_name'),'ignoreowner' => true));
                if (isset($company) && is_array($company) && isset($company['name']))
                    return $this->format_name_etc($company,$args);

        } elseif (is_array($companyArr)){

            // pass through
            return $this->format_name_etc($companyArr,$args);

        }

        return false;
        
    }

    /**
     * Returns a formatted address of a contact
     * Replaces zeroBS_companyAddr
     *
     * @param int id Company ID
     * @param array Company array (if already loaded can pass)
     * @param array args (see format_address func)
     *
     * @return string Company addr html
     */
    public function getCompanyAddress($id=-1,$companyArr=false,$args=array()){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            // get a limited-fields company obj
            // this is hacky, but basically get whole basic company record for this for now, because 
            // this doesn't properly get addr custom fields:
            // $company = $this->getContact($id,array('withCustomFields' => false,'fields'=>$this->field_list_address2,'ignoreowner'=>true));
            $company = $this->getCompany($id,array('withCustomFields' => true,'ignoreowner'=>true));            
            if (isset($company) && is_array($company) && isset($company['addr1']))
                return $this->format_address($company,$args);

        } elseif (is_array($companyArr)){

            // pass through
            return $this->format_address($companyArr,$args);

        }

        return false;
        
    }
    

    /**
     * Returns a formatted address of a Company (2nd addr)
     * Replaces zeroBS_companySecondAddr
     *
     * @param int id Company ID
     * @param array Company array (if already loaded can pass)
     * @param array args (see format_address func)
     *
     * @return string Company addr html
     */
    public function getCompany2ndAddress($id=-1,$companyArr=false,$args=array()){

        global $zbs;

        $id = (int)$id;

        $args['secondaddr'] = true;

        if ($id > 0){

            // get a limited-fields company obj
            // this is hacky, but basically get whole basic company record for this for now, because 
            // this doesn't properly get addr custom fields:
            // $company = $this->getContact($id,array('withCustomFields' => false,'fields'=>$this->field_list_address2,'ignoreowner'=>true));
            $company = $this->getCompany($id,array('withCustomFields' => true,'ignoreowner'=>true));            
            if (isset($company) && is_array($company) && isset($company['addr1']))
                return $this->format_address($company,$args);

        } elseif (is_array($companyArr)){

            // pass through
            return $this->format_address($companyArr,$args);

        }

        return false;
        
    }
    
    /**
     * Returns a Company's tag array
     *
     * @param int id Company ID
     *
     * @return mixed
     */
    public function getCompanyTags($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_COMPANY,'objid'=>$id));

        }

        return false;
        
    }


    /**
     * Returns last contacted uts against a Company
     *
     * @param int id Company ID
     *
     * @return int Contact last contacted date as uts (or -1)
     */
    public function getCompanyLastContactUTS($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_COMPANY,
                'colname' => 'zbsco_lastcontacted',
                'ignoreowner' => true));

        }

        return false;
        
    }

    /**
     * updates lastcontacted date for a Company
     *
     * @param int id Company ID
     * @param int uts last contacted
     *
     * @return bool
     */
    public function setCompanyLastContactUTS($id=-1,$lastContactedUTS=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->addUpdateCompany(array(
                'id'=>$id,
                'limitedFields'=>array(
                    array('key'=>'zbsco_lastcontacted','val' => $lastContactedUTS,'type' => '%d')
            )));

        }

        return false;
        
    }

    /**
     * Returns a set of social accounts for a Company (tw,li,fb)
     *
     * @param int id Company ID
     *
     * @return array social acc's
     */
    // this is not used yet, ahead of time :) - will work tho ;)
    public function getCompanySocials($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            // lazy 3 queries, optimise later

            $tw = $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_COMPANY,
                'colname' => 'zbsco_tw',
                'ignoreowner' => true));

            $li = $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_COMPANY,
                'colname' => 'zbsco_li',
                'ignoreowner' => true));

            $fb = $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_COMPANY,
                'colname' => 'zbsco_fb',
                'ignoreowner' => true));

            return array('tw'=>$tw,'li' => $li, 'fb' => $fb);

        }

        return false;
        
    }
    
    
    /**
     * Returns the next company ID and the previous company ID
     * Used for the navigation between companies. 
     *
     * @param int id
     *
     * @return array int id
     */
    public function getCompanyPrevNext($id=-1){

        global $ZBSCRM_t, $wpdb;

        if($id > 0){
            //then run the queries.. 
            $nextSQL = $this->prepare("SELECT MIN(ID) FROM ".$ZBSCRM_t['companies']." WHERE ID > %d", $id);

            $res['next'] = $wpdb->get_var($nextSQL);

            $prevSQL = $this->prepare("SELECT MAX(ID) FROM ".$ZBSCRM_t['companies']." WHERE ID < %d", $id);

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
    public function listViewObj($company=false,$columnsRequired=array()){

        if (is_array($company) && isset($company['id'])){

            // copy whole obj
            $resArr = $company;

            // here I've translated from DAL2 version (from AJAX) so commented out is no longer req.
            // ... or they'll naturally be in DAL3 model already

            //$resArr['id'] = $company['id'];
            //$resArr['name'] = $company['coname'];
            $resArr['avatar'] = false; //zeroBS_customerAvatar($resArr['id']);

            #} Format the date in the list view..
            //$formatted_date = zeroBSCRM_date_i18n(-1, strtotime($obj['created']));
            // let it use proper obj.
            //$resArr['added'] = $company['created_date'];

            #} Custom columns

                #} Tags
                if (in_array('tagged', $columnsRequired)){

                    $resArr['tags'] = $company['tags'];

                }
                
                // Total value
                if (in_array('totalvalue', $columnsRequired)){

                    #} Calc total value + add to return array
                    $resArr['totalvalue'] = zeroBSCRM_formatCurrency(0); if (isset($company['total_value'])) $resArr['totalvalue'] = zeroBSCRM_formatCurrency($company['total_value']);

                }


                // When Company<->Quotes: 
                // Quotes
                /*if ( in_array( 'quotetotal', $columnsRequired ) ) {
                    if ( isset( $company['quotes_total'] ) ) {
                        $resArr['quotestotal'] = zeroBSCRM_formatCurrency( $company['quotes_total'] );
                    }
                    else {
                        $resArr['quotestotal'] = zeroBSCRM_formatCurrency( 0 );
                    }
                }*/

                // Invoices
                if ( in_array('invoicetotal', $columnsRequired ) ) {
                    if ( isset( $company['invoices_total'] ) ) {

                        $resArr['invoicestotal'] = zeroBSCRM_formatCurrency( $company['invoices_total'] );  

                        // also pass total without formatting (used for hasinvoices check)
                        $resArr['invoices_total_value'] = $company['invoices_total'];
                    }
                    else {
                        $resArr['invoicestotal'] = zeroBSCRM_formatCurrency( 0 );
                    }
                }

                // Transactions
                if (in_array('transactiontotal', $columnsRequired)){

                    $resArr['transactionstotal'] = zeroBSCRM_formatCurrency(0); if (isset($company['transactions_value'])) $resArr['transactionstotal'] = zeroBSCRM_formatCurrency($company['transactions_value']);                                

                }
                // v3.0
                if (isset($company['transactions_total'])){

                    // DAL2 way, brutal effort.
                    $resArr['transactions_total'] = zeroBSCRM_formatCurrency($company['transactions_total']);

                    // also pass total without formatting (used for hastransactions check)
                    $resArr['transactions_total_value'] = $company['transactions_total'];

                }

                // avatar mode
                $avatarMode = zeroBSCRM_getSetting( 'avatarmode' );

                #} Contacts at company
                $contactsAtCo = zeroBS_getCustomers(true,1000,0,false,false,'',false,false,$company['id']);
                
                // build as str
                $resArr['contacts'] = ''; 

                // when a company had many contacts the UI was breached, here we max out at 4...
                $contactCount = 0;

                foreach ( $contactsAtCo as $contact ){

                    // stop at 4
                    if ($contactCount >= 4){

                        $resArr['contacts'] .= '<a href="' . jpcrm_esc_link( 'view', $company['id'], ZBS_TYPE_COMPANY ) . '" title="'.__('View all contacts at company','zero-bs-crm').'">...</a>';
                        break;
                    }

                    // add avatar/label
                    if ( $avatarMode !== 3 ) {
                        $resArr['contacts'] .= zeroBS_getCustomerIcoLinked($contact['id']); // or zeroBS_getCustomerIcoLinkedLabel?
                    }
                    else {
                        // no avatars, use labels
                        $resArr['contacts'] .= zeroBS_getCustomerLinkedLabel($contact['id']);
                    }

                    $contactCount++;
            
                }

                return $resArr;


        }

        return false;

    }


    /**
     * remove any non-db fields from the object
     * basically takes array like array('owner'=>1,'fname'=>'x','fullname'=>'x')
     * and returns array like array('owner'=>1,'fname'=>'x')
     * This does so based on the objectModel!
     *
     * @param array $obj (clean obj)
     *
     * @return array (db ready arr)
     */
    private function db_ready_company($obj=false){

        // use the generic? (override here if necessary)
        return $this->db_ready_obj($obj);

    }


    // ===============================================================================
    // ============  Formatting    ===================================================

    /**
     * Returns a formatted company name +- id, address (e.g. Automattic Ltd. 12 London Street #23)
     *
     * @param array $obj (tidied db obj)
     *
     * @return string name
     */
   public function format_name_etc( $companyArr=array(), $args=array() ){

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            'incFirstLineAddr'  => false,
            'incID'             => false

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $str = ''; if (isset($companyArr['name'])) $str = $companyArr['name'];
        
        // First line of addr?
        if ($incFirstLineAddr) if (isset($companyArr['addr1']) && !empty($companyArr['addr1'])) $str .= ' ('.$companyArr['addr1'].')';

        // ID?
        if ($incID) $str .= ' #'.$companyArr['id'];

        return $str;
   }    

    // =========== / Formatting    ===================================================
    // ===============================================================================

} // / class
