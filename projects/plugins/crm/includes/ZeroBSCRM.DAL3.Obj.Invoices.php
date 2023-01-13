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
* ZBS DAL >> Invoices
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_invoices extends zbsDAL_ObjectLayer {



    protected $objectType = ZBS_TYPE_INVOICE;
    protected $objectDBPrefix = 'zbsi_';
    protected $include_in_templating = true;
    protected $objectModel = array(


        /*

            NOTE: 

                $zbsCustomerInvoiceFields Removed as of v3.0, invoice builder is very custom, UI wise, 
                .. and as the model can deal with saving + custom fields WITHOUT the global, there's no need
                (whereas other objects input views are directed by these globals, Invs is separate, way MS made it)

            OLD hard-typed:
            
                $zbsCustomerInvoiceFields = array(

                    'status' => array(
                        'select', 'Status','',array(
                            'Draft', 'Unpaid', 'Paid', 'Overdue', 'Deleted'
                        ), 'essential' => true
                    ),

                    # NOTE! 'no' should now be ignored, (deprecated), moved to seperate meta 'zbsid'

                    // NOTE WH: when I hit this with column manager, loads didn't need to be shown
                    // so plz leave ,'nocolumn'=>true in tact :)

                    //'name' => array('text','Quote title','e.g. Chimney Rebuild'),
                    'no' => array('text',__('Invoice number',"zero-bs-crm"),'e.g. 123456', 'essential' => true), #} No is ignored by edit routines :)
                    'val'=> array('hidden',__('Invoice value',"zero-bs-crm"),'e.g. 500.00', 'essential' => true),
                    'date' => array('date',__('Invoice date',"zero-bs-crm"),'', 'essential' => true),
                    'notes' => array('textarea',__('Notes',"zero-bs-crm"),'','nocolumn'=>true),
                    'ref' => array('text', __('Reference number',"zero-bs-crm"), 'e.g. Ref-123'),
                    'due' => array('text', __('Invoice due',"zero-bs-crm"), ''),
                    'logo' => array('text', __('logo url',"zero-bs-crm"), 'e.g. URL','nocolumn'=>true),

                    'bill' => array('text',__('invoice to',"zero-bs-crm"), 'e.g. mike@epicplugins.com','nocolumn'=>true),
                    'ccbill' => array('text',__('copy invoice to',"zero-bs-crm"), 'e.g. you@you.com','nocolumn'=>true),

                );

        */

        // ID
        'ID' => array('fieldname' => 'ID', 'format' => 'int'),

        // site + team generics
        'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
        'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
        'zbs_owner' => array('fieldname' => 'zbs_owner', 'format' => 'int'),

        // other fields
        'id_override' => array(
                'fieldname' => 'zbsi_id_override',
                'format' => 'str',
                'force_unique' => true, // must be unique. This is required and breaking if true
                'can_be_blank' => true, // can be blank (if not unique)
                'max_len' => 128
        ),
        'parent' => array('fieldname' => 'zbsi_parent', 'format' => 'int'),
        'status' => array(
            'fieldname' => 'zbsi_status',
            'format' => 'str',
            'max_len' => 50
        ),
        'hash' => array('fieldname' => 'zbsi_hash', 'format' => 'str'),
        'pdf_template' => array('fieldname' => 'zbsi_pdf_template', 'format' => 'str'),
        'portal_template' => array('fieldname' => 'zbsi_portal_template', 'format' => 'str'),
        'email_template' => array('fieldname' => 'zbsi_email_template', 'format' => 'str'),
        'invoice_frequency' => array('fieldname' => 'zbsi_invoice_frequency', 'format' => 'int'),
        'currency' => array('fieldname' => 'zbsi_currency', 'format' => 'curr'),
        'pay_via' => array('fieldname' => 'zbsi_pay_via', 'format' => 'int'),
            /* -1 = bacs/can'tpay online
                0 = default/no setting
                1 = paypal
                2 = stripe
                3 = worldpay
            */
        'logo_url' => array(
            'fieldname' => 'zbsi_logo_url',
            'format' => 'str',
            'max_len' => 300
        ),
        'address_to_objtype' => array('fieldname' => 'zbsi_address_to_objtype', 'format' => 'int'),
        'addressed_from' => array(
            'fieldname' => 'zbsi_addressed_from',
            'format' => 'str',
            'max_len' => 600
        ),
        'addressed_to' => array(
            'fieldname' => 'zbsi_addressed_to',
            'format' => 'str',
            'max_len' => 600
        ),
        'allow_partial' => array('fieldname' => 'zbsi_allow_partial', 'format' => 'bool'),
        'allow_tip' => array('fieldname' => 'zbsi_allow_tip', 'format' => 'bool'),
        'send_attachments' => array('fieldname' => 'zbsi_send_attachments', 'format' => 'bool'), // note, from 4.0.9 we removed this from the front-end ui as we now show a modal option pre-send allowing user to chose which pdf's to attach
        'hours_or_quantity' => array('fieldname' => 'zbsi_hours_or_quantity', 'format' => 'bool'),
        'date' => array('fieldname' => 'zbsi_date', 'format' => 'uts'),
        'due_date' => array('fieldname' => 'zbsi_due_date', 'format' => 'uts'),
        'paid_date' => array('fieldname' => 'zbsi_paid_date', 'format' => 'uts'),
        'hash_viewed' => array('fieldname' => 'zbsi_hash_viewed', 'format' => 'uts'),
        'hash_viewed_count' => array('fieldname' => 'zbsi_hash_viewed_count', 'format' => 'int'),
        'portal_viewed' => array('fieldname' => 'zbsi_portal_viewed', 'format' => 'uts'),
        'portal_viewed_count' => array('fieldname' => 'zbsi_portal_viewed_count', 'format' => 'int'),
        'net' => array('fieldname' => 'zbsi_net', 'format' => 'decimal'),
        'discount' => array('fieldname' => 'zbsi_discount', 'format' => 'decimal'),
        'discount_type' => array('fieldname' => 'zbsi_discount_type', 'format' => 'str'),
        'shipping' => array('fieldname' => 'zbsi_shipping', 'format' => 'decimal'),
        'shipping_taxes' => array('fieldname' => 'zbsi_shipping_taxes', 'format' => 'str'),
        'shipping_tax' => array('fieldname' => 'zbsi_shipping_tax', 'format' => 'decimal'),
        'taxes' => array('fieldname' => 'zbsi_taxes', 'format' => 'str'),
        'tax' => array('fieldname' => 'zbsi_tax', 'format' => 'decimal'),
        'total' => array('fieldname' => 'zbsi_total', 'format' => 'decimal'),
        'created' => array('fieldname' => 'zbsi_created', 'format' => 'uts'),
        'lastupdated' => array('fieldname' => 'zbsi_lastupdated', 'format' => 'uts'),

        );


        // hardtyped list of types this object type is commonly linked to
        protected $linkedToObjectTypes = array(

            ZBS_TYPE_CONTACT,
            ZBS_TYPE_COMPANY

        );


    function __construct($args=array()) {


        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            //'tag' => false,

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============


    }


    // ===============================================================================
    // ===========   INVOICE  =======================================================

    // generic get Company (by ID)
    // Super simplistic wrapper used by edit page etc. (generically called via dal->contacts->getSingle etc.)
    public function getSingle($ID=-1){

        return $this->getInvoice($ID);

    }

    // generic get (by ID list)
    // Super simplistic wrapper used by MVP Export v3.0
    public function getIDList($IDs=false){

        return $this->getInvoices(array(
            'inArr'             => $IDs,
            'withOwner'      => true,
            'withAssigned'      => true,
            'page'          => -1,
            'perPage'       => -1
        ));

    }
    
    // generic get (EVERYTHING)
    // expect heavy load!
    public function getAll($IDs=false){

        return $this->getInvoices(array(
            'withOwner'     => true,
            'withAssigned'  => true,
            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    // generic get count of (EVERYTHING)
    public function getFullCount(){

        return $this->getInvoices(array(
            'count'  => true,
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    /**
     * returns full invoice line +- details
     *
     * @param int id        invoice id
     * @param array $args   Associative array of arguments
     *
     * @return array invoice object
     */
    public function getInvoice($id=-1,$args=array()){

        global $zbs;

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            // if theset wo passed, will search based on these 
            'idOverride'        => false, // directly checks 1:1 match id_override
            'externalSource'    => false,
            'externalSourceUID' => false,
            'hash'              => false,

            // with what?
            'withLineItems'     => true,
            'withCustomFields'  => true,
            'withTransactions'  => false, // gets trans associated with inv as well
            'withAssigned'      => false, // return ['contact'] & ['company'] objs if has link
            'withTags'          => false,
            'withOwner'         => false,
            'withFiles'         => false,
            'withTotals'        => false, // uses $this->generateTotalsTable to also calc discount + taxes on fly

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE), // this'll let you not-check the owner of obj

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
            (!empty($hash))
            ||
            (!empty($externalSource) && !empty($externalSourceUID))
            ){

            global $ZBSCRM_t,$wpdb; 
            $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array(); $extraSelect = '';


            #} ============= PRE-QUERY ============

                #} Custom Fields
                if ($withCustomFields && !$onlyID){
                    
                    #} Retrieve any cf
                    $custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_INVOICE));

                    #} Cycle through + build into query
                    if (is_array($custFields)) foreach ($custFields as $cK => $cF){

                        // add as subquery
                        $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = invoice.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) '".$cK."'";
                        
                        // add params
                        $params[] = $cK; $params[] = ZBS_TYPE_INVOICE;

                    }

                }

                $selector = 'invoice.*';
                if (isset($fields) && is_array($fields)) {
                    $selector = '';

                    // always needs id, so add if not present
                    if (!in_array('ID',$fields)) $selector = 'invoice.ID';

                    foreach ($fields as $f) {
                        if (!empty($selector)) $selector .= ',';
                        $selector .= 'invoice.'.$f;
                    }
                } else if ($onlyID){
                    $selector = 'invoice.ID';
                }

            #} ============ / PRE-QUERY ===========


            #} Build query
            $query = "SELECT ".$selector.$extraSelect." FROM ".$ZBSCRM_t['invoices'].' as invoice';
            #} ============= WHERE ================

                if (!empty($id) && $id > 0){

                    #} Add ID
                    $wheres['ID'] = array('ID','=','%d',$id);

                }
                
                if (!empty($idOverride) && $idOverride > 0){

                    #} Add idOverride
                    $wheres['idOverride'] = array('zbsi_id_override','=','%d',$idOverride);

                }

                /* 3.0.13 WH removed - individual getInvoice should not have searchPhrase. 
                #} Add Search phrase
                if (!empty($searchPhrase)){

                    // search? - ALL THESE COLS should probs have index of FULLTEXT in db?
                    $searchWheres = array();
                    $searchWheres['search_ref'] = array('zbsi_id_override','LIKE','%s','%'.$searchPhrase.'%');
                    $searchWheres['search_total'] = array('zbsi_total','LIKE','%s',$searchPhrase.'%');

                    // 3.0.13 - Added ability to search custom fields (optionally)
                    $customFieldSearch = zeroBSCRM_getSetting('customfieldsearch');
                    if ($customFieldSearch == 1){
                    
                        // simplistic add
                        // NOTE: This IGNORES ownership of custom field lines.
                        $searchWheres['search_customfields'] = array('ID','IN',"(SELECT zbscf_objid FROM ".$ZBSCRM_t['customfields']." WHERE zbscf_objval LIKE %s AND zbscf_objtype = ".ZBS_TYPE_INVOICE.")",'%'.$searchPhrase.'%');

                    }

                    // This generates a query like 'zbsf_fname LIKE %s OR zbsf_lname LIKE %s', 
                    // which we then need to include as direct subquery (below) in main query :)
                    $searchQueryArr = $this->buildWheres($searchWheres,'',array(),'OR',false);
                    
                    if (is_array($searchQueryArr) && isset($searchQueryArr['where']) && !empty($searchQueryArr['where'])){

                        // add it
                        $wheres['direct'][] = array('('.$searchQueryArr['where'].')',$searchQueryArr['params']);

                    }

                } */
                
                if (!empty($hash)){

                    #} Add hash
                    $wheres['hash'] = array('zbsi_hash','=','%s',$hash);

                }
                
                if (!empty($externalSource) && !empty($externalSourceUID)){

                    $wheres['extsourcecheck'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_INVOICE." AND zbss_source = %s AND zbss_uid = %s)",array($externalSource,$externalSourceUID));

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
                        $res = $this->tidy_invoice($potentialRes,$withCustomFields);
                    }

                    if ($withLineItems){

                        // add all line item lines
                        $res['lineitems'] = $this->DAL()->lineitems->getLineitems(array('associatedObjType'=>ZBS_TYPE_INVOICE,'associatedObjID'=>$potentialRes->ID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_LINEITEM)));
                    
                    }

                    if ($withTransactions){

                        // add all transaction item lines
                        $res['transactions'] = $this->DAL()->transactions->getTransactions(array('assignedInvoice'=>$potentialRes->ID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION)));
                    
                    }

                    if ($withAssigned){

                        /* This is for MULTIPLE (e.g. multi contact/companies assigned to an inv)

                            // add all assigned contacts/companies
                            $res['contacts'] = $this->DAL()->contacts->getContacts(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_INVOICE,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $res['companies'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_INVOICE,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                        .. but we use 1:1, at least now: */

                            // add all assigned contacts/companies
                            $res['contact'] = $this->DAL()->contacts->getContacts(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_INVOICE,
                                'hasObjIDLinkedTo'=>$potentialRes->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $res['company'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_INVOICE,
                                'hasObjIDLinkedTo'=>$potentialRes->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                    
                    }

                    if ($withTags){

                        // add all tags lines
                        $res['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_INVOICE,'objid'=>$potentialRes->ID));
                    
                    }

                    if ($withFiles){

                        $res['files'] = zeroBSCRM_files_getFiles('invoice',$potentialRes->ID);
                        
                    }

                    if ($withTotals){

                        // add all tags lines
                        $res['totals'] = $this->generateTotalsTable($res);

                    }

                    return $res;

            }

        } // / if ID

        return false;

    }

    /**
     * returns invoice detail lines
     *
     * @param array $args Associative array of arguments
     *
     * @return array of invoice lines
     */
    public function getInvoices($args=array()){

        global $zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'searchPhrase'  => '', // searches id_override (ref) (not lineitems yet)
            'inArr'             => false,
            'isTagged'          => false, // 1x INT OR array(1,2,3)
            'isNotTagged'       => false, // 1x INT OR array(1,2,3)
            'ownedBy'           => false,
            'externalSource'    => false, // e.g. paypal
            'olderThan'         => false, // uts
            'newerThan'         => false, // uts
            'hasStatus'         => false, // Lead (this takes over from the quick filter post 19/6/18)
            'otherStatus'       => false, // status other than 'Lead'
            'assignedContact'   => false, // assigned to contact id (int)
            'assignedCompany'   => false, // assigned to company id (int)
            'quickFilters'      => false, // booo

            // returns
            'count'             => false,
            'withLineItems'     => true,
            'withCustomFields'  => true,
            'withTransactions'  => false, // gets trans associated with inv as well
            'withTags'          => false,
            'withOwner'         => false,
            'withAssigned'      => false, // return ['contact'] & ['company'] objs if has link
            'withFiles'         => false,
            'onlyColumns'       => false, // if passed (array('fname','lname')) will return only those columns (overwrites some other 'return' options). NOTE: only works for base fields (not custom fields)
            'withTotals'        => false, // uses $this->generateTotalsTable to also calc discount + taxes on fly

            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0, // this is what page it is (gets * by for limit)
            'perPage'       => 100,
            'whereCase'          => 'AND', // DEFAULT = AND

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE), // this'll let you not-check the owner of obj


        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        global $ZBSCRM_t,$wpdb,$zbs;  
        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array(); $joinQ = ''; $extraSelect = '';

        #} ============= PRE-QUERY ============

            #} Capitalise this
            $sortOrder = strtoupper($sortOrder);

            #} If just count, turn off any extra gumpf
            if ($count) {
                $withCustomFields = false;
                $withTags = false;
                $withTransactions = false;
                $withOwner = false;
                $withAssigned = false;
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
                    $withTransactions = false;
                    $withOwner = false;
                    $withAssigned = false;
                    $withTotals = false;

                } else {

                    // deny
                    $onlyColumns = false;

                }


            }

            #} Custom Fields
            if ($withCustomFields){
                
                #} Retrieve any cf
                $custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_INVOICE));

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
                    $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = invoice.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) ".$cKey;
                    
                    // add params
                    $params[] = $cK; $params[] = ZBS_TYPE_INVOICE;

                }

            }

        #} ============ / PRE-QUERY ===========

        #} Build query
        $query = "SELECT invoice.*".$extraSelect." FROM ".$ZBSCRM_t['invoices'].' as invoice'.$joinQ;

        #} Count override
        if ($count) $query = "SELECT COUNT(invoice.ID) FROM ".$ZBSCRM_t['invoices'].' as invoice'.$joinQ;

        #} onlyColumns override
        if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

            $columnStr = '';
            foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                if (!empty($columnStr)) $columnStr .= ',';
                // this presumes str is db-safe? could do with sanitation?
                $columnStr .= $colDBKey;

            }

            $query = "SELECT ".$columnStr." FROM ".$ZBSCRM_t['invoices'].' as invoice'.$joinQ;

        }

        #} ============= WHERE ================

            #} Add Search phrase
            if (!empty($searchPhrase)){

                // search? - ALL THESE COLS should probs have index of FULLTEXT in db?
                $searchWheres = array();
                $searchWheres['search_ID'] = array('ID','=','%d',$searchPhrase);
                $searchWheres['search_ref'] = array('zbsi_id_override','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_total'] = array('zbsi_total','LIKE','%s',$searchPhrase.'%');

                // 3.0.13 - Added ability to search custom fields (optionally)
                $customFieldSearch = zeroBSCRM_getSetting('customfieldsearch');
                if ($customFieldSearch == 1){
                
                    // simplistic add
                    // NOTE: This IGNORES ownership of custom field lines.
                    $searchWheres['search_customfields'] = array('ID','IN',"(SELECT zbscf_objid FROM ".$ZBSCRM_t['customfields']." WHERE zbscf_objval LIKE %s AND zbscf_objtype = ".ZBS_TYPE_INVOICE.")",'%'.$searchPhrase.'%');

                }

                // This generates a query like 'zbsi_fname LIKE %s OR zbsi_lname LIKE %s', 
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
                $wheres['externalsource'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_INVOICE." AND zbss_source = %s)",$externalSource);

            }

            // quick addition for mike
            #} olderThan
            if (!empty($olderThan) && $olderThan > 0 && $olderThan !== false) $wheres['olderThan'] = array('zbsi_created','<=','%d',$olderThan);
            #} newerThan
            if (!empty($newerThan) && $newerThan > 0 && $newerThan !== false) $wheres['newerThan'] = array('zbsi_created','>=','%d',$newerThan);

            // status
            if (!empty($hasStatus) && $hasStatus !== false) $wheres['hasStatus'] = array('zbsi_status','=','%s',$hasStatus);
            if (!empty($otherStatus) && $otherStatus !== false) $wheres['otherStatus'] = array('zbsi_status','<>','%s',$otherStatus);

            // assignedContact + assignedCompany
            if (!empty($assignedContact) && $assignedContact !== false && $assignedContact > 0) $wheres['assignedContact'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_INVOICE." AND zbsol_objtype_to = ".ZBS_TYPE_CONTACT." AND zbsol_objid_to = %d)",$assignedContact);
            if (!empty($assignedCompany) && $assignedCompany !== false && $assignedCompany > 0) $wheres['assignedCompany'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_INVOICE." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = %d)",$assignedCompany);


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
                        $wheres['quickfilterstatus'] = array('zbsi_status','LIKE','%s',ucwords($qFilterStatus));

                    } else {

                        // if we've hit no filter query, let external logic hook in to provide alternatives
                        // First used in WooSync module
                        $wheres = apply_filters( 'jpcrm_invoice_query_quickfilter', $wheres, $qFilter );

                    }

                }
            } // / quickfilters

            #} Any additionalWhereArr?
            if (isset($additionalWhereArr) && is_array($additionalWhereArr) && count($additionalWhereArr) > 0){

                // add em onto wheres (note these will OVERRIDE if using a key used above)
                // Needs to be multi-dimensional $wheres = array_merge($wheres,$additionalWhereArr);
                $wheres = array_merge_recursive($wheres,$additionalWhereArr);

            }

            #} Is Tagged (expects 1 tag ID OR array)

                // catch 1 item arr
                if (is_array($isTagged) && count($isTagged) == 1) $isTagged = $isTagged[0];

            if (!is_array($isTagged) && !empty($isTagged) && $isTagged > 0){

                // add where tagged                 
                // 1 int: 
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = invoice.ID AND zbstl_tagid = %d) > 0)',array(ZBS_TYPE_INVOICE,$isTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = invoice.ID AND zbstl_tagid IN (%s)) > 0)',array(ZBS_TYPE_INVOICE,$tagStr));

                }

            }
            #} Is NOT Tagged (expects 1 tag ID OR array)

                // catch 1 item arr
                if (is_array($isNotTagged) && count($isNotTagged) == 1) $isNotTagged = $isNotTagged[0];
                
            if (!is_array($isNotTagged) && !empty($isNotTagged) && $isNotTagged > 0){

                // add where tagged                 
                // 1 int: 
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = invoice.ID AND zbstl_tagid = %d) = 0)',array(ZBS_TYPE_INVOICE,$isNotTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = invoice.ID AND zbstl_tagid IN (%s)) = 0)',array(ZBS_TYPE_INVOICE,$tagStr));

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

                // field aliases
                'ref'               => 'zbsi_id_override',
                'value'             => 'zbsi_total',

                // Note: "customer" here could be company or contact, so it's not a true sort (as no great way of doing this beyond some sort of prefix comparing)               
                'customer'          => '(SELECT ID FROM '.$ZBSCRM_t['contacts'].' WHERE ID IN (SELECT zbsol_objid_to FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_INVOICE.' AND zbsol_objtype_to = '.ZBS_TYPE_CONTACT.' AND zbsol_objid_from = invoice.ID))',

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
                         
                    // using onlyColumns filter?
                    if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

                        // only coumns return.
                        $resArr = array();
                        foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                            if (isset($resDataLine->$colDBKey)) $resArr[$colStr] = $resDataLine->$colDBKey;

                        }


                    } else {                            
                        
                        // tidy
                        $resArr = $this->tidy_invoice($resDataLine,$withCustomFields);

                    }


                    if ($withLineItems){

                        // add all line item lines
                        $resArr['lineitems'] = $this->DAL()->lineitems->getLineitems(array('associatedObjType'=>ZBS_TYPE_INVOICE,'associatedObjID'=>$resDataLine->ID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_LINEITEM)));
                    
                    }

                    if ($withTransactions){

                        // add all line item lines
                        $resArr['transactions'] = $this->DAL()->transactions->getTransactions(array('assignedInvoice'=>$resDataLine->ID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION)));
                    
                    }

                    if ($withTags){

                        // add all tags lines
                        $resArr['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_INVOICE,'objid'=>$resDataLine->ID));

                    }

                    if ($withOwner){

                        $resArr['owner'] = zeroBS_getOwner($resDataLine->ID,true,ZBS_TYPE_INVOICE,$resDataLine->zbs_owner);

                    }

                    if ($withAssigned){

                        /* This is for MULTIPLE (e.g. multi contact/companies assigned to an inv)

                            // add all assigned contacts/companies
                            $res['contacts'] = $this->DAL()->contacts->getContacts(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_INVOICE,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $res['companies'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_INVOICE,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                        .. but we use 1:1, at least now: */

                            // add all assigned contacts/companies
                            $resArr['contact'] = $this->DAL()->contacts->getContacts(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_INVOICE,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $resArr['company'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_INVOICE,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                    
                    }

                    if ($withFiles){

                        $resArr['files'] = zeroBSCRM_files_getFiles('invoice',$resDataLine->ID);
                        
                    }

                    if ($withTotals){

                        // add all tags lines
                        $resArr['totals'] = $this->generateTotalsTable($resArr);

                    }

                    $res[] = $resArr;

            }
        }

        return $res;
    } 



    /**
     * Returns a count of invoices (owned)
     * .. inc by status
     *
     * @return int count
     */
    public function getInvoiceCount($args=array()){

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'withStatus'    => false, // will be str if used

            // permissions
            'ignoreowner'   => true, // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $whereArr = array();

        if ($withStatus !== false && !empty($withStatus)) $whereArr['status'] = array('zbsi_status','=','%s',$withStatus);

        return $this->DAL()->getFieldByWHERE(array(
            'objtype' => ZBS_TYPE_INVOICE,
            'colname' => 'COUNT(ID)',
            'where' => $whereArr,
            'ignoreowner' => $ignoreowner));
        
    }


     /**
     * adds or updates a invoice object
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateInvoice($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;
            
        #} Retrieve any cf
        $customFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_INVOICE));
        // not req. here$addrCustomFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_ADDRESS));

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'owner'         => -1,

            // fields (directly)
            'data'          => array(

                
                'id_override' => '',
                'parent' => '',
                'status' => '',
                'hash' => '',
                'pdf_template' => '',
                'portal_template' => '',
                'email_template' => '',
                'invoice_frequency' => '',
                'currency' => '',
                'pay_via' => '',
                'logo_url' => '',
                'address_to_objtype' => '',
                'addressed_from' => '',
                'addressed_to' => '',
                'allow_partial' => -1,
                'allow_tip' => -1,
                'send_attachments' => -1,
                'hours_or_quantity' => '',
                'date' => '',
                'due_date' => '',
                'paid_date' => '',
                'hash_viewed' => '',
                'hash_viewed_count' => '',
                'portal_viewed' => '',
                'portal_viewed_count' => '',
                'net' => '',
                'discount' => '',
                'discount_type' => '',
                'shipping' => '',
                'shipping_taxes' => '',
                'shipping_tax' => '',
                'taxes' => '',
                'tax' => '',
                'total' => '',

                // lineitems:
                'lineitems'     => false, 
                // will be an array of lineitem lines (as per matching lineitem database model)
                // note:    if no change desired, pass "false"
                //          if removal of all/change, pass empty array

                // obj links:
                'contacts' => false, // array of id's
                'companies' => false, // array of id's

                // Note Custom fields may be passed here, but will not have defaults so check isset()

                // tags
                'tags' => -1, // pass an array of tag ids or tag strings
                'tag_mode' => 'replace', // replace|append|remove

                'externalSources' => -1, // if this is an array(array('source'=>src,'uid'=>uid),multiple()) it'll add :)
                
                'created' => -1,
                'lastupdated' => '',

            ),

            'limitedFields' => -1, // if this is set it OVERRIDES data (allowing you to set specific fields + leave rest in tact)
            // ^^ will look like: array(array('key'=>x,'val'=>y,'type'=>'%s')). the key needs to match the DB table, i.e. zbsi_status and not
            // just status. For full key references see developer docs (link to follow).

            // this function as DAL1 func did. 
            'extraMeta'     => -1,
            'automatorPassthrough' => -1,

            'silentInsert' => false, // this was for init Migration - it KILLS all IA for newInvoice (because is migrating, not creating new :) this was -1 before

            'do_not_update_blanks' => false, // this allows you to not update fields if blank (same as fieldoverride for extsource -> in)

            'calculate_totals' => false // This allows us to recalculate tax, subtotal, total via php (e.g. if added via api). Only works if not using limitedFields

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }

            // Needs this to grab custom fields (if passed) too :)
            if ( is_array( $customFields ) ) {
                foreach ( $customFields as $cK => $cF ) {
                    // only for data, limited fields below
                    if ( is_array( $data ) ) {
                        if ( isset( $args['data'][$cK] ) ) {
                            $data[$cK] = $args['data'][$cK];
                        }
                    }
                }

            }

            // this takes limited fields + checks through for custom fields present
            // (either as key zbsi_source or source, for example)
            // then switches them into the $data array, for separate update
            // where this'll fall over is if NO normal contact data is sent to update, just custom fields
            if (is_array($limitedFields) && is_array($customFields)){

                    //$customFieldKeys = array_keys($customFields);
                    $newLimitedFields = array();

                    // cycle through
                    foreach ($limitedFields as $field){

                        // some weird case where getting empties, so added check
                        if (isset($field['key']) && !empty($field['key'])){ 

                            $dePrefixed = ''; if (substr($field['key'],0,strlen('zbsi_')) === 'zbsi_') $dePrefixed = substr($field['key'], strlen('zbsi_'));

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

            }


            #} If no status, and default is specified in settings, add that in :)
            if (is_null($data['status']) || !isset($data['status']) || empty($data['status'])){

                // Default status for obj? -> this one gets for contacts -> $zbsCustomerMeta['status'] = zeroBSCRM_getSetting('defaultstatus');
                // For now we force 'Draft'
                 $data['status'] = __('Draft','zero-bs-crm');
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
                        $dbData = $this->db_ready_invoice($data); 
                        //unset($dbData['id']); // this is unset because we use $id, and is update, so not req. legacy issue
                        //unset($dbData['created']); // this is unset because this uses an obj which has been 'updated' against original details, where created is output in the WRONG format :)

                        $origData = $data; //$data = array();               
                        $limitedData = array(); // array(array('key'=>'zbsi_x','val'=>y,'type'=>'%s'))

                        // cycle through + translate into limitedFields (removing any blanks, or arrays (e.g. externalSources))
                        // we also have to remake a 'faux' data (removing blanks for tags etc.) for the post-update updates
                        foreach ($dbData as $k => $v){

                            $intV = (int)$v;

                            // only add if valuenot empty
                            if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){

                                // add to update arr
                                $limitedData[] = array(
                                    'key' => 'zbsi_'.$k, // we have to add zbsi_ here because translating from data -> limited fields
                                    'val' => $v,
                                    'type' => $this->getTypeStr('zbsi_'.$k)
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
                if (!isset($dataArr['zbsi_lastupdated'])){ $dataArr['zbsi_lastupdated'] = time(); $typeArr[] = '%d'; }

            } else {

                // FULL UPDATE/INSERT

                    // (re)calculate the totals etc?
                    if (isset($calculate_totals) && $calculate_totals){

                        $data = $this->recalculate($data);

                    }

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

                    // companies - avoid dupes
                    if (isset($data['companies']) && is_array($data['companies'])){

                        $coArr = array();
                        foreach ($data['companies'] as $c){
                            $cI = (int)$c;
                            if ($cI > 0 && !in_array($cI, $coArr)) $coArr[] = $cI;
                        }

                        // reset the main
                        if (count($coArr) > 0) 
                            $data['companies'] = $coArr; 
                        else
                            $data['companies'] = 'unset';
                        unset($coArr);

                    }

                    // UPDATE
                    $dataArr = array( 

                                // ownership
                                // no need to update these (as of yet) - can't move teams etc.
                                //'zbs_site' => zeroBSCRM_installSite(),
                                //'zbs_team' => zeroBSCRM_installTeam(),
                                //'zbs_owner' => $owner,

                                    
                                'zbsi_id_override' => $data['id_override'],
                                'zbsi_parent' => $data['parent'],
                                'zbsi_status' => $data['status'],
                                'zbsi_hash' => $data['hash'],
                                'zbsi_pdf_template' => $data['pdf_template'],
                                'zbsi_portal_template' => $data['portal_template'],
                                'zbsi_email_template' => $data['email_template'],
                                'zbsi_invoice_frequency' => $data['invoice_frequency'],
                                'zbsi_currency' => $data['currency'],
                                'zbsi_pay_via' => $data['pay_via'],
                                'zbsi_logo_url' => $data['logo_url'],
                                'zbsi_address_to_objtype' => $data['address_to_objtype'],
                                'zbsi_addressed_from' => $data['addressed_from'],
                                'zbsi_addressed_to' => $data['addressed_to'],
                                'zbsi_allow_partial' => $data['allow_partial'],
                                'zbsi_allow_tip' => $data['allow_tip'],
                                'zbsi_send_attachments' => $data['send_attachments'],                                
                                'zbsi_hours_or_quantity' => $data['hours_or_quantity'],
                                'zbsi_date' => $data['date'],
                                'zbsi_due_date' => $data['due_date'],
                                'zbsi_paid_date' => $data['paid_date'],
                                'zbsi_hash_viewed' => $data['hash_viewed'],
                                'zbsi_hash_viewed_count' => $data['hash_viewed_count'],
                                'zbsi_portal_viewed' => $data['portal_viewed'],
                                'zbsi_portal_viewed_count' => $data['portal_viewed_count'],
                                'zbsi_net' => $data['net'],
                                'zbsi_discount' => $data['discount'],
                                'zbsi_discount_type' => $data['discount_type'],
                                'zbsi_shipping' => $data['shipping'],
                                'zbsi_shipping_taxes' => $data['shipping_taxes'],
                                'zbsi_shipping_tax' => $data['shipping_tax'],
                                'zbsi_taxes' => $data['taxes'],
                                'zbsi_tax' => $data['tax'],
                                'zbsi_total' => $data['total'],
                                'zbsi_lastupdated' => time(),

                            );

                    $typeArr = array( // field data types
                                //'%d',  // site
                                //'%d',  // team
                                //'%d',  // owner

                        
                                '%s', // id_override
                                '%d', // parent
                                '%s', // status
                                '%s', // hash
                                '%s', // pdf template
                                '%s', // portal template
                                '%s', // email template
                                '%d', // zbsi_invoice_frequency
                                '%s', // curr
                                '%d', // pay via
                                '%s', // logo url
                                '%d', // addr to obj type
                                '%s', // addr from
                                '%s', // addr to
                                '%d', // zbsi_allow_partial
                                '%d', // allow_tip
                                '%d', // hours or quantity  
                                '%d', // zbsi_send_attachments                                
                                '%d', // date
                                '%d', // due date
                                '%d', // paid date
                                '%d', // hash viewed
                                '%d', // hash viewed count
                                '%d', // portal viewed
                                '%d', // portal viewed count
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

                            );

                
 

                if (!empty($id) && $id > 0){

                    // is update
                    $update = true;

                } else {

                    // INSERT (get's few extra :D)
                    $update = false;
                    $dataArr['zbs_site'] = zeroBSCRM_site();    $typeArr[] = '%d';
                    $dataArr['zbs_team'] = zeroBSCRM_team();    $typeArr[] = '%d';
                    $dataArr['zbs_owner'] = $owner;             $typeArr[] = '%d';
                    if (isset($data['created']) && !empty($data['created']) && $data['created'] !== -1){
                        $dataArr['zbsi_created'] = $data['created'];$typeArr[] = '%d';
                    } else {
                        $dataArr['zbsi_created'] = time();          $typeArr[] = '%d';
                    }

                }

                // if a blank hash is passed, generate a new one
                if (isset($dataArr['zbsi_hash']) && $dataArr['zbsi_hash'] == '') $dataArr['zbsi_hash'] = zeroBSCRM_generateHash(20);

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
                $originalStatus = $this->getInvoiceStatus($id);

                // log any change of status
                if (isset($dataArr['zbsi_status']) && !empty($dataArr['zbsi_status']) && !empty($originalStatus) && $dataArr['zbsi_status'] != $originalStatus){

                    // status change
                    $statusChange = array(
                        'from' => $originalStatus,
                        'to' => $dataArr['zbsi_status']
                        );
                }

                #} Attempt update
                if ($wpdb->update( 
                        $ZBSCRM_t['invoices'], 
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

                                // Line Items ====

                                // line item work
                                if (isset($data['lineitems']) && is_array($data['lineitems'])){

                                    // if array passed, update, even if removing 
                                    if (count($data['lineitems']) > 0){

                                        // passed, for now this is BRUTAL and just clears old ones + readds
                                        // once live, discuss how to refactor to be less brutal.

                                            // delete all lineitems
                                            $this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$id,'objType'=>ZBS_TYPE_INVOICE));

                                            // addupdate each
                                            foreach ($data['lineitems'] as $lineitem) {

                                                // slight rejig of passed so works cleanly with data array style
                                                $lineItemID = false; if (isset($lineitem['ID'])) $lineItemID = $lineitem['ID'];
                                                $this->DAL()->lineitems->addUpdateLineitem(array(
                                                    'id'=>$lineItemID,
                                                    'linkedObjType' => ZBS_TYPE_INVOICE,
                                                    'linkedObjID' => $id,
                                                    'data'=>$lineitem,
                                                    'calculate_totals' => true
                                                    ));

                                            }

                                    } else {

                                        // delete all lineitems
                                        $this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$id,'objType'=>ZBS_TYPE_INVOICE));

                                    }


                                }

                                // / Line Items ==== 

                                // OBJ LINKS - to contacts/companies
                                if (!is_array($data['contacts']))
                                    $this->addUpdateObjectLinks($id,'unset',ZBS_TYPE_CONTACT);
                                else
                                    $this->addUpdateObjectLinks($id,$data['contacts'],ZBS_TYPE_CONTACT);
                                if (!is_array($data['companies']))
                                    $this->addUpdateObjectLinks($id,'unset',ZBS_TYPE_COMPANY);
                                else
                                    $this->addUpdateObjectLinks($id,$data['companies'],ZBS_TYPE_COMPANY);

                                // IA also gets 'againstid' historically, but we'll pass as 'against id's'
                                $againstIDs = array('contacts'=>$data['contacts'],'companies'=>$data['companies']);

                                // tags
                                if (isset($data['tags']) && is_array($data['tags'])) {

                                    $this->addUpdateInvoiceTags(
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
                                        'obj_type_id'      => ZBS_TYPE_INVOICE,
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
                                                    'objtype'   => ZBS_TYPE_INVOICE,
                                                    'objid'     => $id,
                                                    'objkey'    => $cK,
                                                    'objval'    => $data[$cK]
                                            )));

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
                                    $this->DAL()->updateMeta(ZBS_TYPE_INVOICE,$id,'extra_'.$cleanKey,$v);

                                    #} Add it to this, which passes to IA
                                    $confirmedExtraMeta[$cleanKey] = $v;

                                }

                            }


                            #} INTERNAL AUTOMATOR 
                            #} & 
                            #} FALLBACKS
                            // UPDATING CONTACT
                            if (!$silentInsert){

                                // catch dirty flag (update of status) (note, after update_post_meta - as separate)
                                //if (isset($_POST['zbsi_status_dirtyflag']) && $_POST['zbsi_status_dirtyflag'] == "1"){
                                // actually here, it's set above
                                if (isset($statusChange) && is_array($statusChange)){

                                    // status has changed

                                    // IA
                                    zeroBSCRM_FireInternalAutomator('invoice.status.update',array(
                                        'id'=>$id,
                                        'againstids'=>array(), //$againstIDs,
                                        'data'=> $data,
                                        'from' => $statusChange['from'],
                                        'to' => $statusChange['to']
                                    ));

                                } 


                                // IA General invoice update (2.87+)
                                zeroBSCRM_FireInternalAutomator('invoice.update',array(
                                        'id'=>$id,
                                        'data'=>$data,
                                        'againstids'=>array(), //$againstIDs,
                                        'extsource'=>false, //$approvedExternalSource
                                        'automatorpassthrough'=>$automatorPassthrough, #} This passes through any custom log titles or whatever into the Internal automator recipe.
                                        'extraMeta'=>$confirmedExtraMeta #} This is the "extraMeta" passed (as saved)
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
                        $ZBSCRM_t['invoices'], 
                        $dataArr, 
                        $typeArr ) > 0){

                    #} Successfully inserted, lets return new ID
                    $newID = $wpdb->insert_id;

                    // Line Items ====

                    // line item work
                    if (isset($data['lineitems']) && is_array($data['lineitems'])){

                        // if array passed, update, even if removing 
                        if (count($data['lineitems']) > 0){

                            // passed, for now this is BRUTAL and just clears old ones + readds
                            // once live, discuss how to refactor to be less brutal.

                                // delete all lineitems
                                $this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$newID,'objType'=>ZBS_TYPE_INVOICE));

                                // addupdate each
                                foreach ($data['lineitems'] as $lineitem) {

                                    // slight rejig of passed so works cleanly with data array style
                                    $lineItemID = false; if (isset($lineitem['ID'])) $lineItemID = $lineitem['ID'];
                                    $this->DAL()->lineitems->addUpdateLineitem(array(
                                        'id'=>$lineItemID,
                                        'linkedObjType' => ZBS_TYPE_INVOICE,
                                        'linkedObjID' => $newID,
                                        'data'=>$lineitem,
                                        'calculate_totals' => true
                                        ));

                                }

                        } else {

                            // delete all lineitems
                            $this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$newID,'objType'=>ZBS_TYPE_INVOICE));

                        }


                    }

                    // / Line Items ==== 

                    // OBJ LINKS - to contacts/companies
                    $this->addUpdateObjectLinks($newID,$data['contacts'],ZBS_TYPE_CONTACT);
                    $this->addUpdateObjectLinks($newID,$data['companies'],ZBS_TYPE_COMPANY);
                    // IA also gets 'againstid' historically, but we'll pass as 'against id's'
                    $againstIDs = array('contacts'=>$data['contacts'],'companies'=>$data['companies']);

                    // tags
                    if (isset($data['tags']) && is_array($data['tags'])) {

                        $this->addUpdateInvoiceTags(
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
                            'obj_type_id'      => ZBS_TYPE_INVOICE,
                            'external_sources' => isset($data['externalSources']) ? $data['externalSources'] : array(),
                        )
                    ); // for IA below

                    // Custom fields?

                        #} Cycle through + add/update if set
                        if ( is_array( $customFields ) ) {
                            foreach ( $customFields as $cK => $cF ) {

                                // any?
                                if ( isset( $data[$cK] ) ) {
                                    // add update
                                    $cfID = $this->DAL()->addUpdateCustomField(array(
                                        'data'  => array(
                                            'objtype'   => ZBS_TYPE_INVOICE,
                                            'objid'     => $newID,
                                            'objkey'    => $cK,
                                            'objval'    => $data[$cK]
                                        )));
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
                            $this->DAL()->updateMeta(ZBS_TYPE_INVOICE,$newID,'extra_'.$cleanKey,$v);

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
                        zeroBSCRM_FireInternalAutomator('invoice.new',array(
                            'id'=>$newID,
                            'data'=>$data,
                            'againstids'=>$againstIDs,
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
     * adds or updates a invoice's tags
     * ... this is really just a wrapper for addUpdateObjectTags
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateInvoiceTags($args=array()){

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
                'objtype'   => ZBS_TYPE_INVOICE,
                'objid'     => $id,
                'tag_input' => $tag_input,
                'tags'      => $tags,
                'tagIDs'    => $tagIDs,
                'mode'      => $mode
            )
        );

    }


    /**
     * updates status for an invoice (no blanks allowed)
     *
     * @param int id Invoice ID
     * @param string Invoice Status
     *
     * @return bool
     */
    public function setInvoiceStatus($id=-1,$status=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0 && !empty($status) && $status !== -1){

            return $this->addUpdateInvoice(array(
                'id'=>$id,
                'limitedFields'=>array(
                    array('key'=>'zbsi_status','val' => $status,'type' => '%s')
            )));

        }

        return false;
        
    }


     /**
     * deletes a invoice object
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteInvoice($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'saveOrphans'   => false

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} Check ID & Delete :)
        $id = (int)$id;
        if (!empty($id) && $id > 0) {
            
            // delete orphans?
            if ($saveOrphans === false){

                // delete any tag links
                $this->DAL()->deleteTagObjLinks(array(

                        'objtype'       => ZBS_TYPE_INVOICE,
                        'objid'         => $id
                ));

                // delete any external source information
                $this->DAL()->delete_external_sources( array(

                    'obj_type'       => ZBS_TYPE_INVOICE,
                    'obj_id'         => $id,
                    'obj_source'    => 'all',

                ) );

                // delete any links to contacts
                $this->DAL()->deleteObjLinks( array(

                    'objtypefrom'    => ZBS_TYPE_INVOICE,
                    'objtypeto'      => ZBS_TYPE_CONTACT,
                    'objtofrom'      => $id,

                ) );

                // delete any links to transactions
                $this->DAL()->deleteObjLinks( array(

                    'objtypefrom'    => ZBS_TYPE_TRANSACTION,
                    'objtypeto'      => ZBS_TYPE_INVOICE,
                    'objtoid'        => $id,

                ) );

                // delete all orphaned lineitems
                $this->DAL()->lineitems->deleteLineItemsForObject( array(
                    'objID'          => $id,
                    'objType'        => ZBS_TYPE_INVOICE
                ) );

                // delete all orphaned line items obj links
                $this->DAL()->deleteObjLinks( array(

                    'objtypefrom'    => ZBS_TYPE_LINEITEM,
                    'objtypeto'      => ZBS_TYPE_INVOICE,
                    'objtoid'        => $id,

                ) );

            }

            $del = zeroBSCRM_db2_deleteGeneric($id,'invoices');

            #} Add to automator
            zeroBSCRM_FireInternalAutomator('invoice.delete',array(
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
     * @return array invoice (clean obj)
     */
    private function tidy_invoice($obj=false,$withCustomFields=false){

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

            
            $res['id_override'] = $this->stripSlashes($obj->zbsi_id_override);
            $res['parent'] = (int)$obj->zbsi_parent;
            $res['status'] = $this->stripSlashes($obj->zbsi_status);
            $res['hash'] = $this->stripSlashes($obj->zbsi_hash);
            $res['pdf_template'] = $this->stripSlashes($obj->zbsi_pdf_template);
            $res['portal_template'] = $this->stripSlashes($obj->zbsi_portal_template);
            $res['email_template'] = $this->stripSlashes($obj->zbsi_email_template);
            $res['invoice_frequency'] = (int)$obj->zbsi_invoice_frequency;
            $res['currency'] = $this->stripSlashes($obj->zbsi_currency);
            $res['pay_via'] = (int)$obj->zbsi_pay_via;
            $res['logo_url'] = $this->stripSlashes($obj->zbsi_logo_url);
            $res['address_to_objtype'] = (int)$obj->zbsi_address_to_objtype;
            $res['addressed_from'] = $this->stripSlashes($obj->zbsi_addressed_from);
            $res['addressed_to'] = $this->stripSlashes($obj->zbsi_addressed_to);
            $res['allow_partial'] = (bool)$obj->zbsi_allow_partial;
            $res['allow_tip'] = (bool)$obj->zbsi_allow_tip;
            $res['send_attachments'] = (bool)$obj->zbsi_send_attachments;
            $res['hours_or_quantity'] = $this->stripSlashes($obj->zbsi_hours_or_quantity);
            $res['date'] = (int)$obj->zbsi_date;
            $res['date_date'] = (isset($obj->zbsi_date) && $obj->zbsi_date > 0) ? jpcrm_uts_to_date_str( $obj->zbsi_date ) : false;
            $res['due_date'] = (int)$obj->zbsi_due_date;
            $res['due_date_date'] = (isset($obj->zbsi_due_date) && $obj->zbsi_due_date > 0) ? jpcrm_uts_to_date_str( $obj->zbsi_due_date ) : false;
            $res['paid_date'] = (int)$obj->zbsi_paid_date;
            $res['paid_date_date'] = (isset($obj->zbsi_paid_date) && $obj->zbsi_paid_date > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsi_paid_date,false,true) : false;
            $res['hash_viewed'] = (int)$obj->zbsi_hash_viewed;
            $res['hash_viewed_date'] = (isset($obj->zbsi_hash_viewed) && $obj->zbsi_hash_viewed > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsi_hash_viewed,false,true) : false;
            $res['hash_viewed_count'] = (int)$obj->zbsi_hash_viewed_count;
            $res['portal_viewed'] = (int)$obj->zbsi_portal_viewed;
            $res['portal_viewed_date'] = (isset($obj->zbsi_portal_viewed) && $obj->zbsi_portal_viewed > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsi_portal_viewed,false,true) : false;
            $res['portal_viewed_count'] = (int)$obj->zbsi_portal_viewed_count;
            $res['net'] = $this->stripSlashes($obj->zbsi_net);
            $res['discount'] = $this->stripSlashes($obj->zbsi_discount);
            $res['discount_type'] = $this->stripSlashes($obj->zbsi_discount_type);
            $res['shipping'] = $this->stripSlashes($obj->zbsi_shipping);
            $res['shipping_taxes'] = $this->stripSlashes($obj->zbsi_shipping_taxes);
            $res['shipping_tax'] = $this->stripSlashes($obj->zbsi_shipping_tax);
            $res['taxes'] = $this->stripSlashes($obj->zbsi_taxes);
            $res['tax'] = $this->stripSlashes($obj->zbsi_tax);
            $res['total'] = $this->stripSlashes($obj->zbsi_total);
            $res['created'] = (int)$obj->zbsi_created;
            $res['created_date'] = (isset($obj->zbsi_created) && $obj->zbsi_created > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbsi_created) : false;
            $res['lastupdated'] = (int)$obj->zbsi_lastupdated;
            $res['lastupdated_date'] = (isset($obj->zbsi_lastupdated) && $obj->zbsi_lastupdated > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbsi_lastupdated) : false;

            // custom fields - tidy any that are present:
            if ($withCustomFields) $res = $this->tidyAddCustomFields(ZBS_TYPE_INVOICE,$obj,$res,false);
            
        } 


        return $res;


    }

    /**
     * Takes whatever invoice data available and re-calculates net, total, tax etc. 
     * .. returning same obj with updated vals
     * .. This is a counter to the js func which does this in-UI, so changes need to be replicated in either or
     *
     * @param array $invoiceData
     *
     * @return array $invoiceData
     */
    public function recalculate($invoiceData=false){

        if (is_array($invoiceData)){

            global $zbs;

            // we pass any discount saved against main invoice DOWN to the lineitems, first:
            if (isset($invoiceData['lineitems']) && is_array($invoiceData['lineitems'])){

                // if not discounted, still recalc net
                if (!isset($invoiceData['discount']) && $invoiceData['discount'] <= 0){

                    // recalc line items, but no discount to apply
                    foreach ($invoiceData['lineitems'] as $lineItem) { 

                        $finalLineItems[] = $zbs->DAL->lineitems->recalculate($lineItem);

                    }

                } else {


                    $discountValue = (float)$invoiceData['discount'];
                    $discountType = 'value'; if ($invoiceData['discount_type'] == '%') $discountType = 'percentage';
                    $calcedLineItems = array(); $finalLineItems = array();

                    if ($discountType == 'percentage'){

                        $discountPercentage = ((float)$invoiceData["discount"])/100;

                        // percentage discount
                        foreach ($invoiceData['lineitems'] as $lineItem) { 

                            $n = $zbs->DAL->lineitems->recalculate($lineItem);
                            $n['discount'] = $n['net']*$discountPercentage;
                            $n = $zbs->DAL->lineitems->recalculate($n);
                            $finalLineItems[] = $n;

                        }

                    } else {

                        // first calc + 
                        // accumulate a line-item net, so can pro-rata discounts
                        $lineItemsSumNet = 0; 
                        foreach ($invoiceData['lineitems'] as $lineItem) { 

                            $n = $zbs->DAL->lineitems->recalculate($lineItem);
                            $lineItemsSumNet += $n['net']; 
                            $calcedLineItems[] = $n;

                        }

                        // now actually correct em
                        foreach ($calcedLineItems as $n){

                            $nl = $n;

                            // calc pro-rata discount in absolute 0.00
                            // so this takes the net of all line item values 
                            // and then proportionally discounts a part of it (this line item net)
                            // ... where have net
                            if ($n['net'] > 0 && $lineItemsSumNet > 0){

                                $nl['discount'] = round($discountValue*($n['net']/$lineItemsSumNet),2);

                            }

                            // final recalc to deal with new discount val
                            $nl = $zbs->DAL->lineitems->recalculate($nl);

                            // pass it
                            $finalLineItems[] = $nl;


                        }


                    } // / absolute discount

                } // / if lineitems + discount to apply

                // reset 
                $invoiceData['lineitems'] = $finalLineItems; unset($finalLineItems,$calcedLineItems);

            }

            // subtotal (zbsi_net)
            // == line item Quantity * rate * tax%
            // ... also calc tax as we go for 'total' below
            $subTotal = 0.0; $itemsTax = 0.0; $discount = 0.0;

                // cycle through (any) line items
                if (isset($invoiceData) && is_array($invoiceData['lineitems'])) foreach ($invoiceData['lineitems'] as $lineItem){

                    // use the lineitem recalc to calc :)
                    // no need, this is now done above as part of discount calcs
                    // $recalcedLineItem = $zbs->DAL->lineitems->recalculate($lineItem);

                    // lineitems can store these, but we're not using them in v3.0 mvp (invs have their own global level for these)
                    // currency
                    // discount
                    // shipping

                    // .. can then directly use the recalced numbers :)
                    $subTotal += $lineItem['net'];
                    if (isset($lineItem['discount'])) $discount += (float)$lineItem['discount'];
                    $itemsTax += $lineItem['tax'];

                }

                // set it
                $invoiceData['net'] = $subTotal;

            // total
            // = subtotal - (discount) + (shipping + tax on shipping) + taxes
            // discount is accumulated from line items (applied at top)
            $total = $invoiceData['net']-$discount;

                // shipping (if used)
                $shipping = 0.0; $taxOnShipping = 0.0;

                    // shipping subtotal
                    if (isset($invoiceData["shipping"]) && !empty($invoiceData["shipping"])){ 

                        $shipping = (float)$invoiceData["shipping"];

                    }

                    if ($shipping > 0){

                        // tax on shipping - recalc.
                        if (isset($invoiceData['shipping_taxes'])) $taxOnShipping = zeroBSCRM_taxRates_getTaxValue($shipping,$invoiceData['shipping_taxes']);

                        // set it
                        $invoiceData['shipping_tax'] = $taxOnShipping;

                        // shipping total
                        $shipping += $taxOnShipping;


                    }

                // + shipping
                $total += $shipping;


                // Taxes (if used)

                    // tax - this is (re)calculated by line item recalc above
                    $total += $itemsTax;
                
                    // total tax for invoice = lineitem tax + any tax on shipping
                    $invoiceData['tax'] = $itemsTax+$taxOnShipping;

                // set it
                $invoiceData['total'] = $total;

                // return
                return $invoiceData;


        }

        return false;

    }

    /**
     * Takes whatever invoice data available and generates correct totals table (discount, shipping, tax vals)
     *
     * @param array $invoiceData
     *
     * @return array $invoiceTotals
     */
    public function generateTotalsTable($invoice=false){

        $totals = array(

            // not req. as part of main obj 'net' 
            'discount' => 0.0,
            'taxes' => array(),
            // not req. as part of main obj 'shipping' 
            // not req. as part of main obj 'total' 
        );
        
        // settings
        global $zbs; $invsettings = $zbs->settings->getAll();

        // Discount
        if (isset($invoice["discount"]) && !empty($invoice["discount"])) {

            if ($invsettings['invdis'] == 1){ 

                // v3.0+ we have discount type ('m' or '%')
                $discountType = 'value'; if (isset($invoice["discount_type"]) && !empty($invoice["discount_type"])){ 

                        if ($invoice["discount_type"] == '%') $discountType = 'percentage';

                }

                if ($discountType == 'value'){

                    // value out $£
                    if (isset($invoice["discount"]) && !empty($invoice["discount"])){ 

                        $totals['discount'] = $invoice["discount"]; 

                    }

                } else {

                    // percentage out - calc
                    if (isset($invoice["discount"]) && !empty($invoice["discount"]) && isset($invoice['net'])){ 

                        $discountAmount = 0;
                        $invDiscount = (float)$invoice["discount"];
                        if ($invDiscount > 0) $discountAmount = ($invDiscount/100)*$invoice['net'];

                        $totals['discount'] = $discountAmount; 

                    }

                }

            }
        }

        if ($invsettings['invtax'] == 1){
            
            // this output's tax in 1 number
            //if(isset($invoice["tax"]) && !empty($invoice["tax"])){ $totalsTable .= zeroBSCRM_formatCurrency($invoice["tax"]); }else{ $totalsTable .= zeroBSCRM_formatCurrency(0); }
            // ... but local taxes need splitting, so recalc & display by lineitems.
            $taxLines = false; if (isset($invoice['lineitems']) && is_array($invoice['lineitems']) && count($invoice['lineitems']) > 0){

                // here we use this summarising func to retrieve
                $taxLines = $zbs->DAL->lineitems->getLineitemsTaxSummary(array('lineItems' => $invoice['lineitems']));

            }

            // add any shipping tax :)
            if ($invsettings['invpandp'] == 1){

                // shipping (if used)
                $shippingV = 0.0; $taxOnShipping = 0.0;

                    // shipping subtotal
                    if (isset($invoice["shipping"]) && !empty($invoice["shipping"])){ 

                        $shippingV = (float)$invoice["shipping"];

                    }

                    if ($shippingV > 0){

                        // tax on shipping - recalc.
                        if (isset($invoice['shipping_taxes'])) $taxOnShipping = zeroBSCRM_taxRates_getTaxValue($shippingV,$invoice['shipping_taxes']);

                        // shipping can only have 1 tax at the moment, so find that tax and add to summary:
                        $shippingRate = zeroBSCRM_taxRates_getTaxRate($invoice['shipping_taxes']);

                        if (is_array($shippingRate) && isset($shippingRate['id'])){

                            // add to summary
                            if (!isset($taxLines[$shippingRate['id']])){

                                // new, add
                                $taxLines[$shippingRate['id']] = array(

                                    'name' => $shippingRate['name'],
                                    'rate' => $shippingRate['rate'],
                                    'value' => $taxOnShipping

                                );

                            } else {

                                // += 
                                $taxLines[$shippingRate['id']]['value'] += $taxOnShipping;

                            }                                            

                        }                                    

                    }       

            }

            if (isset($taxLines) && is_array($taxLines) && count($taxLines) > 0) {

                $totals['taxes'] = $taxLines;

            } else {

                // simple fallback
                // ...just use $invoice["tax"]

            }

        }

        return $totals;

    }



    /**
     * Wrapper, use $this->getInvoiceMeta($contactID,$key) for easy retrieval of singular invoice
     * Simplifies $this->getMeta
     *
     * @param int objtype
     * @param int objid
     * @param string key
     *
     * @return array invoice meta result
     */
    public function getInvoiceMeta($id=-1,$key='',$default=false){

        global $zbs;

        if (!empty($key)){

            return $this->DAL()->getMeta(array(

                'objtype' => ZBS_TYPE_INVOICE,
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
     * Returns an ownerid against a invoice
     * Replaces zeroBS_getCustomerOwner
     *
     * @param int id invoice ID
     *
     * @return int invoice owner id
     */
    public function getInvoiceOwner($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_INVOICE,
                'colname' => 'zbs_owner',
                'ignoreowner'=>true));

        }

        return false;
        
    }

    /**
     * Returns the first contact associated with an invoice
     *
     * @param int id quote ID
     *
     * @return int quote invoice id
     */
    public function getInvoiceContactID($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            $contacts = $this->DAL()->getObjsLinkedToObj(array(

                'objtypefrom'       => ZBS_TYPE_INVOICE,
                'objtypeto'         => ZBS_TYPE_CONTACT,
                'objfromid'         => $id,
                'count' => false,

            ));

            if (is_array($contacts)) foreach ($contacts as $c){

                // first
                return $c['id'];

            }

        }

        return false;
        
    }


    
    /**
     * Returns a contact obj assigned to this invoice
     *
     * @param int id invoice ID
     *
     * @return int invoice owner id
     */
    public function getInvoiceContact($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            $contacts = $this->DAL()->contacts->getContacts(array(

                            // link
                            'hasObjTypeLinkedTo'=>ZBS_TYPE_INVOICE,
                            'hasObjIDLinkedTo'=>$resDataLine->ID,

                            // query bits
                            'perPage'=>-1,
                            'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

            if (is_array($contacts) && isset($contacts[0])) return $contacts[0];
            

        }

        return false;
        
    }
    
    /**
     * Returns a company obj assigned to this invoice
     *
     * @param int id invoice ID
     *
     * @return int invoice owner id
     */
    public function getInvoiceCompany($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            $companies = $this->DAL()->companies->getCompanies(array(

                            'hasObjTypeLinkedTo' => ZBS_TYPE_INVOICE,
                            'hasObjIDLinkedTo' => $resDataLine->ID,

                            'perPage'=>-1,
                            'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY))
            );

            if (is_array($companies) && isset($companies[0])) return $companies[0];
            

        }

        return false;
        
    }


    /**
     * Returns an status against a invoice
     *
     * @param int id invoice ID
     *
     * @return str invoice status string
     */
    public function getInvoiceStatus($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_INVOICE,
                'colname' => 'zbsi_status',
                'ignoreowner'=>true));

        }

        return false;
        
    }


    /**
     * Returns an hash against a invoice
     *
     * @param int id invoice ID
     *
     * @return str invoice hash string
     */
    public function getInvoiceHash($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_INVOICE,
                'colname' => 'zbsi_hash',
                'ignoreowner'=>true));

        }

        return false;
        
    }


    /**
     * Retrieves outstanding balanace against an invoice, based on transactions assigned to it.
     *
     * @param int id invoice ID
     *
     * @return float invoice outstanding balance
     */
    public function getOutstandingBalance($invoiceID=-1){

        if ($invoiceID > 0){

            $invoice = $this->getInvoice($invoiceID,array(

                    'withTransactions' => true // so we can see other partials and check if paid.

            ));

            if (is_array($invoice)){

                // get total due
                $invoiceTotalValue = 0.0; if (isset($invoice['total'])) $invoiceTotalValue = (float)$invoice['total'];
                // this one'll be a rolling sum
                $transactionsTotalValue = 0.0;

                // cycle through trans + calc existing balance
                if (isset($invoice['transactions']) && is_array($invoice['transactions'])){

                    // got trans
                    foreach ($invoice['transactions'] as $transaction){

                        // should we also check for status=completed/succeeded? (leaving for now, will let check all):

                        // get amount
                        $transactionAmount = 0.0; if (isset($transaction['total'])) $transactionAmount = (float)$transaction['total'];

                        if ($transactionAmount > 0){

                            switch ($transaction['type']){

                                case __('Sale','zero-bs-crm'):

                                    // these count as debits against invoice.
                                    $transactionsTotalValue -= $transactionAmount;

                                    break;

                                case __('Refund','zero-bs-crm'):
                                case __('Credit Note','zero-bs-crm'):

                                    // these count as credits against invoice.
                                    $transactionsTotalValue += $transactionAmount;

                                    break;



                            } // / switch on type (sale/refund)

                        } // / if trans > 0

                    } // / each trans

                    // should now have $transactionsTotalValue & $invoiceTotalValue
                    // ... so we sum + return.
                    return $invoiceTotalValue + $transactionsTotalValue;

                } // / if has trans

            } // / if retrieved inv

        } // / if invoice_id > 0

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
    private function db_ready_invoice($obj=false){

        // use the generic? (override here if necessary)
        return $this->db_ready_obj($obj);

    }



    /**
     * Takes full object and makes a "list view" boiled down version
     * Used to generate listview objs
     *
     * @param array $obj (clean obj)
     *
     * @return array (listview ready obj)
     */
    public function listViewObj($invoice=false,$columnsRequired=array()){

        if (is_array($invoice) && isset($invoice['id'])){

            $resArr = $invoice;

            // a lot of this is legacy <DAL3 stuff just mapped. def could do with an improvement for efficacy's sake.

            //$resArr['id'] = $invoice['id'];
            //$resArr['zbsid'] = $invoice['zbsid'];
            if (isset($invoice['id_override']) && $invoice['id_override'] !== null) 
                $resArr['zbsid'] = $invoice['id_override'];
            else
                $resArr['zbsid'] = $invoice['id'];

            // title... I suspect you mean ref?
            // WH note: I suspect we mean id_override now.
            $resArr['title'] = ''; //if (isset($invoice['name'])) $resArr['title'] = $invoice['name'];
            if (isset($invoice['id_override']) && empty($resArr['title'])) $resArr['title'] = $invoice['id_override'];

            #} Convert $contact arr into list-view-digestable 'customer'// & unset contact for leaner data transfer
            if ( array_key_exists( 'contact', $invoice ) ) {
                $resArr['customer'] = zeroBSCRM_getSimplyFormattedContact($invoice['contact'], (in_array('assignedobj', $columnsRequired)));
            }

            #} Convert $contact arr into list-view-digestable 'customer'// & unset contact for leaner data transfer
            if ( array_key_exists( 'company', $invoice ) ) {
                $resArr['company'] = zeroBSCRM_getSimplyFormattedCompany($invoice['company'], (in_array('assignedobj', $columnsRequired)));
            }

            //format currency handles if the amount is blank (sends it to 0)
            // WH: YES but it doesn't check if isset / stop php notice $resArr['value'] = zeroBSCRM_formatCurrency($invoice['meta']['val']);
            $resArr['total'] = zeroBSCRM_formatCurrency(0); if (isset($invoice['total'])) $resArr['total'] = zeroBSCRM_formatCurrency($invoice['total']);

            return $resArr;

        }

        return false;

    }

    // ===========  /   INVOICE  =======================================================
    // ===============================================================================
    

} // / class
