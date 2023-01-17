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
* ZBS DAL >> Transactions
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_transactions extends zbsDAL_ObjectLayer {


    protected $objectType = ZBS_TYPE_TRANSACTION;
    protected $objectDBPrefix = 'zbst_';
    protected $include_in_templating = true;
    protected $objectModel = array(

        // ID
        'ID' => array('fieldname' => 'ID', 'format' => 'int'),

        // site + team generics
        'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
        'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
        'zbs_owner'=> array('fieldname' => 'zbs_owner', 'format' => 'int'),

        // other fields
        'status'            => array(
                // db model:
                'fieldname' => 'zbst_status', 'format' => 'str',
	            // output model
	            'input_type' => 'select',
	            'label' => 'Status',
	            'placeholder'=>'',
	            'options'=>array('Succeeded','Completed','Failed','Refunded','Processing','Pending','Hold','Cancelled'),
	            'essential' => true,
                'max_len' => 50
        ),
        'type'            => array(
                // db model:
                'fieldname' => 'zbst_type', 'format' => 'str',
	            // output model
	            'input_type' => 'select',
	            'label' => 'Type',
	            'placeholder'=>'',
	            'options'=>array('Sale','Refund','Credit Note'),
	            'essential' => true,
                'default' => 'Sale',
                'max_len' => 50
        ),
        'ref'            => array(
                // db model:
                'fieldname' => 'zbst_ref', 'format' => 'str',
	            // output model
	            'input_type' => 'text',
	            'label' => 'Transaction ID',
	            'placeholder'=>'',
	            'essential' => true,
                'dal1key' => 'orderid',
                'force_unique' => true, // must be unique. This is required and breaking if true,
                'not_empty' => true,
                'max_len' => 120
        ),
        'origin' => array(
            'fieldname' => 'zbst_origin',
            'format' => 'str',
            'max_len' => 100
        ),
        'parent' => array('fieldname' => 'zbst_parent', 'format' => 'int'),
        'hash' => array('fieldname' => 'zbst_hash', 'format' => 'str'),
        'title'            => array(
                // db model:
                'fieldname' => 'zbst_title', 'format' => 'str',
	            // output model
	            'input_type' => 'text',
	            'label' => 'Transaction Title',
	            'placeholder' => 'e.g. Product ABC',
                'dal1key' => 'item',
                'max_len' => 200
        ),
        'desc'            => array(
                // db model:
                'fieldname' => 'zbst_desc', 'format' => 'str',
	            // output model
	            'input_type' => 'textarea',
	            'label' => 'Description',
	            'placeholder' => '',
                'max_len' => 200
        ),
        'date'            => array(
                // db model:
                'fieldname' => 'zbst_date', 'format' => 'uts',
                'autoconvert'=>'datetime', // NOTE autoconvert makes buildObjArr autoconvert from a 'date' using localisation rules, to a GMT timestamp (UTS)
                // output model
                'input_type' => 'datetime',
                'label' => 'Transaction Date',
                'placeholder'=>''

        ), // <-- this is a bit of a misnomer, it's basically timestamp for created
        'customer_ip' => array(
            'fieldname' => 'zbst_customer_ip',
            'format' => 'str',
            'max_len' => 45
        ),
        'currency' => array(
            'fieldname' => 'zbst_currency',
            'format' => 'curr',
            'max_len' => 4
        ),
        'net'            => array(
                // db model:
                'fieldname' => 'zbst_net', 'format' => 'decimal',
	            // output model
	            'input_type' => 'price',
	            'label' => 'Net',
	            'placeholder'=>'',
                'default' => '0.00'
        ),
        'fee'            => array(
            // db model:
            'fieldname' => 'zbst_fee', 'format' => 'decimal',
            // output model
            'input_type' => 'price',
            'label' => 'Fee',
            'placeholder'=>'',
            'default' => '0.00'
        ),
        'discount'            => array(
                // db model:
                'fieldname' => 'zbst_discount', 'format' => 'decimal',
	            // output model
                'input_type' => 'price',
                'label' => 'Discount',
                'placeholder'=>'',
                'default' => '0.00'
        ),
        'shipping'            => array(
                // db model:
                'fieldname' => 'zbst_shipping', 'format' => 'decimal',
                // output model
                'input_type' => 'price',
                'label' => 'Shipping',
                'placeholder'=>'',
                'default' => '0.00'
        ),
        'shipping_taxes'            => array(
                // db model:
                'fieldname' => 'zbst_shipping_taxes', 'format' => 'str',
                // output model
                'input_type' => 'tax',
                'label' => 'Shipping Taxes',
                'placeholder'=>''
        ),
        'shipping_tax'     => array('fieldname' => 'zbst_shipping_tax', 'format' => 'decimal', 'label' => 'Shipping Tax',),
        'taxes'            => array(
                // db model:
                'fieldname' => 'zbst_taxes',
                'format' => 'str',
                // output model
                'input_type' => 'tax',
                'label' => 'Taxes',
                'placeholder'=>''

                // replaces tax_rate, but tax_rate was a decimal, this is a string of applicable tax codes from tax table.
        ),
        'tax'   => array(
            'fieldname' => 'zbst_tax',
            'format'    => 'decimal',
            'label'     => 'Tax',
            'input_type' => 'price',
            'placeholder'=>'',
        ),
        'total'            => array(
                // db model:
                'fieldname' => 'zbst_total', 'format' => 'decimal',
                // output model
                'input_type' => 'price',
                'label' => 'Total',
                'placeholder'=>'',
                'default' => '0.00',
                'essential' => true
        ),
        'date_paid'            => array(
                // db model:
                'fieldname' => 'zbst_date_paid', 'format' => 'uts',
                'autoconvert'=>'date', // NOTE autoconvert makes buildObjArr autoconvert from a 'date' using localisation rules, to a GMT timestamp (UTS)                
	            // output model
	            'input_type' => 'date',
	            'label' => 'Date Paid',
        ),
        'date_completed'            => array(
                // db model:
                'fieldname' => 'zbst_date_completed', 'format' => 'uts',
                'autoconvert'=>'date', // NOTE autoconvert makes buildObjArr autoconvert from a 'date' using localisation rules, to a GMT timestamp (UTS)                
                // output model
                'input_type' => 'date',
                'label' => 'Date Completed'
        ),
        'created' => array('fieldname' => 'zbst_created', 'format' => 'uts'),
        'lastupdated' => array('fieldname' => 'zbst_lastupdated', 'format' => 'uts'),

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
    // ===========   TRANSACTION  =======================================================

    // generic get Company (by ID)
    // Super simplistic wrapper used by edit page etc. (generically called via dal->contacts->getSingle etc.)
    public function getSingle($ID=-1){

        return $this->getTransaction($ID);

    }

    // generic get (by ID list)
    // Super simplistic wrapper used by MVP Export v3.0
    public function getIDList($IDs=false){

        return $this->getTransactions(array(
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

        return $this->getTransactions(array(
            'withOwner'      => true,
            'withAssigned'      => true,
            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    // generic get count of (EVERYTHING)
    public function getFullCount(){

        return $this->getTransactions(array(
            'count'  => true,
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    /**
     * Verifies there is a transaction with this ID accessible to current logged in user
     *
     * @param int transaction_id
     *
     * @return bool
     */
    public function transaction_exists( $transaction_id ){

        // has to be a legit int
        if ( empty( $transaction_id ) ){
            return false;
        }

        // note this ignores ownership for now
        $potential_transaction = $this->getTransaction( $transaction_id, array( 'onlyID' => true ) );

        if ( $potential_transaction > 0 ){

            return true;

        }

        return false;

    }
    
    /**
     * returns full transaction line +- details
     *
     * @param int id        transaction id
     * @param array $args   Associative array of arguments
     *
     * @return array transaction object
     */
    public function getTransaction($id=-1,$args=array()){

        global $zbs;

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            // if these two passed, will search based on these 
            'externalSource'    => false,
            'externalSourceUID' => false,

            // with what?
            'withLineItems'     => true,
            'withCustomFields'  => true,
            'withAssigned'      => true, // return ['contact'] & ['company'] arrays, & invoice_id field, if has link
            'withTags'          => false,
            'withOwner'         => false,

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION), // this'll let you not-check the owner of obj

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
                    $custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_TRANSACTION));

                    #} Cycle through + build into query
                    if (is_array($custFields)) foreach ($custFields as $cK => $cF){

                        // add as subquery
                        $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = transaction.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) '".$cK."'";
                        
                        // add params
                        $params[] = $cK; $params[] = ZBS_TYPE_TRANSACTION;

                    }

                }

                $selector = 'transaction.*';
                if (isset($fields) && is_array($fields)) {
                    $selector = '';

                    // always needs id, so add if not present
                    if (!in_array('ID',$fields)) $selector = 'transaction.ID';

                    foreach ($fields as $f) {
                        if (!empty($selector)) $selector .= ',';
                        $selector .= 'transaction.'.$f;
                    }
                } else if ($onlyID){
                    $selector = 'transaction.ID';
                }

            #} ============ / PRE-QUERY ===========


            #} Build query
            $query = "SELECT ".$selector.$extraSelect." FROM ".$ZBSCRM_t['transactions'].' as transaction';
            #} ============= WHERE ================

                if (!empty($id) && $id > 0){

                    #} Add ID
                    $wheres['ID'] = array('ID','=','%d',$id);

                }
                
                if (!empty($externalSource) && !empty($externalSourceUID)){

                    $wheres['extsourcecheck'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_TRANSACTION." AND zbss_source = %s AND zbss_uid = %s)",array($externalSource,$externalSourceUID));

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
                        $res = $this->tidy_transaction($potentialRes,$withCustomFields);
                    }

                    if ($withLineItems){

                        // add all line item lines
                        $res['lineitems'] = $this->DAL()->lineitems->getLineitems(array('associatedObjType'=>ZBS_TYPE_TRANSACTION,'associatedObjID'=>$potentialRes->ID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_LINEITEM)));
                    
                    }

                    if ($withAssigned){

                        /* This is for MULTIPLE (e.g. multi contact/companies assigned to an inv)

                            // add all assigned contacts/companies
                            $res['contacts'] = $this->DAL()->contacts->getContacts(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TRANSACTION,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $res['companies'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TRANSACTION,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                        .. but we use 1:1, at least now: */

                            // add all assigned contacts/companies
                            $res['contact'] = $this->DAL()->contacts->getContacts(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TRANSACTION,
                                'hasObjIDLinkedTo'=>$potentialRes->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $res['company'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TRANSACTION,
                                'hasObjIDLinkedTo'=>$potentialRes->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                            // invoice id always singular.
                            $res['invoice_id'] = $this->DAL()->getFirstIDLinkedToObj(array(

                                    'objtypefrom'       => ZBS_TYPE_TRANSACTION,
                                    'objtypeto'         => ZBS_TYPE_INVOICE,
                                    'objfromid'         => $potentialRes->ID,

                            ));

                    
                    }

                    if ($withTags){

                        // add all tags lines
                        $res['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_TRANSACTION,'objid'=>$potentialRes->ID));
                    
                    }

                    return $res;

            }

        } // / if ID

        return false;

    }

	/**
	 *  Returns transaction summed by field between passed timestamps
	 */
	public function getTransactionTotalByMonth( $args=array() ) {

		global $ZBSCRM_t, $wpdb, $zbs;

		// ============ LOAD ARGS =============
		$defaultArgs = array(

			'paidAfter'   => strtotime( '12 month ago' ),
			'paidBefore'  => time(),

		);
		foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
		// =========== / LOAD ARGS =============

		$column_prefix = 'zbst_';

		// only include transactions with statuses which should be included in total value:
		$transStatusQueryAdd = $this->getTransactionStatusesToIncludeQuery();

		$sql = $wpdb->prepare( 'SELECT SUM(' . $column_prefix . 'total) as total, MONTH(FROM_UNIXTIME(' . $column_prefix . 'date)) as month, YEAR(FROM_UNIXTIME(' . $column_prefix . 'date)) as year FROM ' . $ZBSCRM_t['transactions'] . ' WHERE ' . $column_prefix . 'date > %d AND ' . $column_prefix . 'date < %d' . $transStatusQueryAdd . ' GROUP BY month, year ORDER BY year, month', $paidAfter, $paidBefore );
		$res = $wpdb->get_results( $sql, ARRAY_A );

		return $res;

	}

    /**
     * returns transaction detail lines
     *
     * @param array $args Associative array of arguments
     *
     * @return array of transaction lines
     */
    public function getTransactions($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;  

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
			'searchPhrase'        => '', // searches zbst_title and zbst_desc
			'inArr'               => false,
			'isTagged'            => false, // 1x INT OR array(1,2,3)
			'isNotTagged'         => false, // 1x INT OR array(1,2,3)
			'ownedBy'             => false,
			'externalSource'      => false, // e.g. paypal
			'hasStatus'           => false, // Lead (this takes over from the quick filter post 19/6/18)
			'otherStatus'         => false, // status other than 'Lead'
			'assignedContact'     => false, // assigned to contact id (int)
			'assignedCompany'     => false, // assigned to company id (int)
			'assignedInvoice'     => false, // assigned to invoice id (int)
			'quickFilters'        => false,
			'external_source_uid' => false, // e.g. woo-order_10

			// date ranges
			'olderThan'         => false, // uts - checks 'date'
			'newerThan'         => false, // uts - checks 'date'
			'paidBefore'        => false, // uts - checks 'date_paid'
			'paidAfter'         => false, // uts - checks 'date_paid'
			'createdBefore'     => false, // uts - checks 'created'
			'createdAfter'      => false, // uts - checks 'created'

			// returns
			'count'             => false,
			'total'             => false, // returns a summed total value of transactions (scalar)
			'withLineItems'     => true,
			'withCustomFields'  => true,
			'withTags'          => false,
			'withOwner'         => false,
			'withAssigned'      => true, // return ['contact'] & ['company'] objs, & invoice_id field, if has link
			'onlyColumns'       => false, // if passed (array('fname','lname')) will return only those columns (overwrites some other 'return' options). NOTE: only works for base fields (not custom fields)

			// order by
			'sortByField'   => 'ID',
			'sortOrder'     => 'ASC',
			'page'          => 0, // this is what page it is (gets * by for limit)
			'perPage'       => 100,
			'whereCase'     => 'AND', // DEFAULT = AND

			// permissions
			'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION), // this'll let you not-check the owner of obj
        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array(); $joinQ = ''; $extraSelect = '';

        #} ============= PRE-QUERY ============

            // Capitalise this
            $sortOrder = strtoupper($sortOrder);

            // If just count or total, turn off any meta detail
            if ( $count || $total ) {

                $withCustomFields = false;
                $withTags = false;
                $withOwner = false;
                $withAssigned = false;
                $withLineItems = false;

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
                    $withAssigned = false;
                    $withLineItems = false;

                } else {

                    // deny
                    $onlyColumns = false;

                }


            }

            #} Custom Fields
            if ($withCustomFields){
                
                #} Retrieve any cf
                $custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_TRANSACTION));

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
                    $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = transaction.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) ".$cKey;
                    
                    // add params
                    $params[] = $cK; $params[] = ZBS_TYPE_TRANSACTION;

                }

            }

			if ( $external_source_uid ) {
				$extraSelect .= ', external_source.external_source_uids, external_source.external_source_sources';
				$joinQ .= '  LEFT JOIN (
								SELECT 
									extsrcs.zbss_objid external_source_objid,
									GROUP_CONCAT(extsrcs.zbss_uid SEPARATOR "\n") AS external_source_uids,
									GROUP_CONCAT(extsrcs.zbss_source SEPARATOR "\n") AS external_source_sources
								FROM 
									' . $ZBSCRM_t['externalsources'] . ' extsrcs
								WHERE 
								  extsrcs.zbss_objtype = %s
								GROUP BY extsrcs.zbss_objid
							) external_source ON
								transaction.ID = external_source.external_source_objid' ;
				$params[] = ZBS_TYPE_TRANSACTION;
			}

        #} ============ / PRE-QUERY ===========

        #} Build query
        $query = "SELECT transaction.*".$extraSelect." FROM ".$ZBSCRM_t['transactions'].' as transaction'.$joinQ;

        #} Count override
        if ($count) $query = "SELECT COUNT(transaction.ID) FROM ".$ZBSCRM_t['transactions'].' as transaction'.$joinQ;
        
        #} onlyColumns override
        if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

            $columnStr = '';
            foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                if (!empty($columnStr)) $columnStr .= ',';
                // this presumes str is db-safe? could do with sanitation?
                $columnStr .= $colDBKey;

            }

            $query = "SELECT ".$columnStr." FROM ".$ZBSCRM_t['transactions'].' as transaction'.$joinQ;

        }

        // $total only override
        if ( $total ){
        
            $query = "SELECT SUM(transaction.zbst_total) total FROM ".$ZBSCRM_t['transactions'].' as transaction'.$joinQ;

        }

        #} ============= WHERE ================

            #} Add Search phrase
            if (!empty($searchPhrase)){

                // search? - ALL THESE COLS should probs have index of FULLTEXT in db?
                $searchWheres = array();
                $searchWheres['search_ID'] = array('ID','=','%d',$searchPhrase);
                $searchWheres['search_ref'] = array('zbst_ref','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_title'] = array('zbst_title','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_desc'] = array('zbst_desc','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_total'] = array('zbst_total','LIKE','%s', $searchPhrase.'%');

				if ( $external_source_uid ) {
					$searchWheres['search_external_source_uid'] = array( 'external_source.external_source_uids', 'LIKE', '%s', '%' . $searchPhrase . '%' );
				}

                // 3.0.13 - Added ability to search custom fields (optionally)
                $customFieldSearch = zeroBSCRM_getSetting('customfieldsearch');
                if ($customFieldSearch == 1){
                
                    // simplistic add
                    // NOTE: This IGNORES ownership of custom field lines.
                    $searchWheres['search_customfields'] = array('ID','IN',"(SELECT zbscf_objid FROM ".$ZBSCRM_t['customfields']." WHERE zbscf_objval LIKE %s AND zbscf_objtype = ".ZBS_TYPE_TRANSACTION.")",'%'.$searchPhrase.'%');

                }

                // This generates a query like 'zbst_fname LIKE %s OR zbst_lname LIKE %s', 
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
                $wheres['externalsource'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_TRANSACTION." AND zbss_source = %s)",$externalSource);

            }

            // Timestamp checks:

                #} olderThan
                if (!empty($olderThan) && $olderThan > 0 && $olderThan !== false) $wheres['olderThan'] = array('zbst_date','<=','%d',$olderThan);
                #} newerThan
                if (!empty($newerThan) && $newerThan > 0 && $newerThan !== false) $wheres['newerThan'] = array('zbst_date','>=','%d',$newerThan);

                #} createdBefore
                if (!empty($createdBefore) && $createdBefore > 0 && $createdBefore !== false) $wheres['createdBefore'] = array('zbst_created','<=','%d',$createdBefore);
                #} createdAfter
                if (!empty($createdAfter) && $createdAfter > 0 && $createdAfter !== false) $wheres['createdAfter'] = array('zbst_created','>=','%d',$createdAfter);

                #} paidBefore
                if (!empty($paidBefore) && $paidBefore > 0 && $paidBefore !== false) $wheres['paidBefore'] = array('zbst_date_paid','<=','%d',$paidBefore);
                #} paidAfter
                if (!empty($paidAfter) && $paidAfter > 0 && $paidAfter !== false) $wheres['paidAfter'] = array('zbst_date_paid','>=','%d',$paidAfter);

            // status
            if (!empty($hasStatus) && $hasStatus !== false) $wheres['hasStatus'] = array('zbst_status','=','%s',$hasStatus);
            if (!empty($otherStatus) && $otherStatus !== false) $wheres['otherStatus'] = array('zbst_status','<>','%s',$otherStatus);

            // assignedContact + assignedCompany + assignedInvoice
            if (!empty($assignedContact) && $assignedContact !== false && $assignedContact > 0) $wheres['assignedContact'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_TRANSACTION." AND zbsol_objtype_to = ".ZBS_TYPE_CONTACT." AND zbsol_objid_to = %d)",$assignedContact);
            if (!empty($assignedCompany) && $assignedCompany !== false && $assignedCompany > 0) $wheres['assignedCompany'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_TRANSACTION." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = %d)",$assignedCompany);
            if (!empty($assignedInvoice) && $assignedInvoice !== false && $assignedInvoice > 0) $wheres['assignedInvoice'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_TRANSACTION." AND zbsol_objtype_to = ".ZBS_TYPE_INVOICE." AND zbsol_objid_to = %d)",$assignedInvoice);

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
                            $wheres['quickfilterstatus'] = array('zbst_status','LIKE','%s',ucwords($qFilterStatus));

                        } else {

                            // if we've hit no filter query, let external logic hook in to provide alternatives
                            // First used in WooSync module
                            $wheres = apply_filters( 'jpcrm_transaction_query_quickfilter', $wheres, $qFilter );

                        }

                } 

            }// / quickfilters

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
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = transaction.ID AND zbstl_tagid = %d) > 0)',array(ZBS_TYPE_TRANSACTION,$isTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = transaction.ID AND zbstl_tagid IN (%s)) > 0)',array(ZBS_TYPE_TRANSACTION,$tagStr));

                }

            }
            #} Is NOT Tagged (expects 1 tag ID OR array)

                // catch 1 item arr
                if (is_array($isNotTagged) && count($isNotTagged) == 1) $isNotTagged = $isNotTagged[0];
                
            if (!is_array($isNotTagged) && !empty($isNotTagged) && $isNotTagged > 0){

                // add where tagged                 
                // 1 int: 
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = transaction.ID AND zbstl_tagid = %d) = 0)',array(ZBS_TYPE_TRANSACTION,$isNotTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = transaction.ID AND zbstl_tagid IN (%s)) = 0)',array(ZBS_TYPE_TRANSACTION,$tagStr));

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

                // Note: "customer" here could be company or contact, so it's not a true sort (as no great way of doing this beyond some sort of prefix comparing)               
                'customer'          => '(SELECT ID FROM '.$ZBSCRM_t['contacts'].' WHERE ID IN (SELECT zbsol_objid_to FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_TRANSACTION.' AND zbsol_objtype_to = '.ZBS_TYPE_CONTACT.' AND zbsol_objid_from = transaction.ID))',

            );
            
            if ( array_key_exists( $sortByField, $sort_map ) ) {

                $sortByField = $sort_map[ $sortByField ];

            }

			if ( $external_source_uid && $sortByField === "external_source" ){
				$sortByField = ["external_source_uids" => $sortOrder];
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

            // Catch count/total + return if requested
            if ( $count || $total ) return $wpdb->get_var($queryObj);

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
                    
                    // only columns?
                    if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

                        // only coumns return.
                        $resArr = array();
                        foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                            if (isset($resDataLine->$colDBKey)) $resArr[$colStr] = $resDataLine->$colDBKey;

                        }


                    } else {

                        // tidy
                        $resArr = $this->tidy_transaction($resDataLine,$withCustomFields);

                    }

                    if ($withLineItems){

                        // add all line item lines
                        $resArr['lineitems'] = $this->DAL()->lineitems->getLineitems(array('associatedObjType'=>ZBS_TYPE_TRANSACTION,'associatedObjID'=>$resDataLine->ID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_LINEITEM)));
                    
                    }

                    if ($withTags){

                        // add all tags lines
                        $resArr['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_TRANSACTION,'objid'=>$resDataLine->ID));

                    }

                    if ($withAssigned){

                        /* This is for MULTIPLE (e.g. multi contact/companies assigned to an inv)

                            // add all assigned contacts/companies
                            $res['contacts'] = $this->DAL()->contacts->getContacts(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TRANSACTION,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $res['companies'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TRANSACTION,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                        .. but we use 1:1, at least now: */

                            // add all assigned contacts/companies
                            $resArr['contact'] = $this->DAL()->contacts->getContacts(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TRANSACTION,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $resArr['company'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TRANSACTION,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                    
                    }

					if ( $external_source_uid ) {
						$resArr['external_source_uid'] = $this->tidy_external_sources( $resDataLine );
					}

                    $res[] = $resArr;

            }
        }

        return $res;
    } 


    /**
     * Returns a count of transactions (owned)
     * .. inc by status
     *
     * @return int count
     */
    public function getTransactionCount($args=array()){

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'withStatus'    => false, // will be str if used

            // permissions
            'ignoreowner'   => true, // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $whereArr = array();

        if ($withStatus !== false && !empty($withStatus)) $whereArr['status'] = array('zbst_status','=','%s',$withStatus);

        return $this->DAL()->getFieldByWHERE(array(
            'objtype' => ZBS_TYPE_TRANSACTION,
            'colname' => 'COUNT(ID)',
            'where' => $whereArr,
            'ignoreowner' => $ignoreowner));
        
    }


     /**
     * adds or updates a transaction object
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateTransaction($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;
            
        #} Retrieve any cf
        $customFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_TRANSACTION));
        // not req. $addrCustomFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_ADDRESS));

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'owner'         => -1,

            // fields (directly)
            'data'          => array(

                
                'status' => '',
                'type' => '',
                'ref' => '',
                'origin' => '',
                'parent' => '',
                'hash' => '',
                'title' => '',
                'desc' => '',
                'date' => '', 
                'customer_ip' => '',
                'currency' => '',
                'net' => '',
                'fee' => '',
                'discount' => '',
                'shipping' => '',
                'shipping_taxes' => '',
                'shipping_tax' => '',
                'taxes' => '',
                'tax' => '',
                'total' => '',
                'date_paid' => null,
                'date_completed' => null,

                // lineitems:
                'lineitems'     => false, 
                // will be an array of lineitem lines (as per matching lineitem database model)
                // note:    if no change desired, pass "false"
                //          if removal of all/change, pass empty array

                // Note Custom fields may be passed here, but will not have defaults so check isset()

                // obj links:
                'contacts' => false, // array of id's
                'companies' => false, // array of id's
                'invoice_id' => false, // ID if assigned to an invoice

                // tags
                'tags' => -1, // pass an array of tag ids or tag strings
                'tag_mode' => 'replace', // replace|append|remove

                'externalSources' => -1, // if this is an array(array('source'=>src,'uid'=>uid),multiple()) it'll add :)

                // allow this to be set for MS sync etc.
                'created' => -1,
                'lastupdated' => '',

            ),

            'limitedFields' => -1, // if this is set it OVERRIDES data (allowing you to set specific fields + leave rest in tact)
            // ^^ will look like: array(array('key'=>x,'val'=>y,'type'=>'%s'))

            // this function as DAL1 func did. 
            'extraMeta'     => -1,
            'automatorPassthrough' => -1,

            'silentInsert' => false, // this was for init Migration - it KILLS all IA for newTransaction (because is migrating, not creating new :) this was -1 before

            'do_not_update_blanks' => false, // this allows you to not update fields if blank (same as fieldoverride for extsource -> in)
            'do_not_mark_invoices' => false // by default all trans associated with an INV will fire a check "should this inv be marked paid" on add/update of trans. If this is true, check will not run

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        
            // Needs this to grab custom fields (if passed) too :)
            if (is_array($customFields)) foreach ($customFields as $cK => $cF){

                // only for data, limited fields below
                if (is_array($data)) {

                    if (isset($args['data'][$cK])) $data[$cK] = $args['data'][$cK];

                }

            }

            // this takes limited fields + checks through for custom fields present
            // (either as key zbst_source or source, for example)
            // then switches them into the $data array, for separate update
            // where this'll fall over is if NO normal contact data is sent to update, just custom fields
            if (is_array($limitedFields) && is_array($customFields)){

                    //$customFieldKeys = array_keys($customFields);
                    $newLimitedFields = array();

                    // cycle through
                    foreach ($limitedFields as $field){

                        // some weird case where getting empties, so added check
                        if (isset($field['key']) && !empty($field['key'])){ 

                            $dePrefixed = ''; if (substr($field['key'],0,strlen('zbst_')) === 'zbst_') $dePrefixed = substr($field['key'], strlen('zbst_'));

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
            // for now, I copied this from addUpdateTransaction: 'Unknown';
            if (is_null($data['status']) || !isset($data['status']) || empty($data['status'])){

                // Default status for obj? -> this one gets for contacts -> 
                $data['status'] = __('Unknown','zero-bs-crm'); //zeroBSCRM_getSetting('defaultstatus');

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
                        $dbData = $this->db_ready_transaction($data); 
                        //unset($dbData['id']); // this is unset because we use $id, and is update, so not req. legacy issue
                        //unset($dbData['created']); // this is unset because this uses an obj which has been 'updated' against original details, where created is output in the WRONG format :)

                        $origData = $data; //$data = array();               
                        $limitedData = array(); // array(array('key'=>'zbst_x','val'=>y,'type'=>'%s'))

                        // cycle through + translate into limitedFields (removing any blanks, or arrays (e.g. externalSources))
                        // we also have to remake a 'faux' data (removing blanks for tags etc.) for the post-update updates
                        foreach ($dbData as $k => $v){

                            $intV = (int)$v;

                            // only add if valuenot empty
                            if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){

                                // add to update arr
                                $limitedData[] = array(
                                    'key' => 'zbst_'.$k, // we have to add zbst_ here because translating from data -> limited fields
                                    'val' => $v,
                                    'type' => $this->getTypeStr('zbst_'.$k)
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
                if (!isset($dataArr['zbst_lastupdated'])){ $dataArr['zbst_lastupdated'] = time(); $typeArr[] = '%d'; }

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

                        
                                'zbst_status' => $data['status'],
                                'zbst_type' => $data['type'],
                                'zbst_ref' => $data['ref'],
                                'zbst_origin' => $data['origin'],
                                'zbst_parent' => $data['parent'],
                                'zbst_hash' => $data['hash'],
                                'zbst_title' => $data['title'],
                                'zbst_desc' => $data['desc'],
                                'zbst_date' => $data['date'],
                                'zbst_customer_ip' => $data['customer_ip'],
                                'zbst_currency' => $data['currency'],
                                'zbst_net' => $data['net'],
                                'zbst_fee' => $data['fee'],
                                'zbst_discount' => $data['discount'],
                                'zbst_shipping' => $data['shipping'],
                                'zbst_shipping_taxes' => $data['shipping_taxes'],
                                'zbst_shipping_tax' => $data['shipping_tax'],
                                'zbst_taxes' => $data['taxes'],
                                'zbst_tax' => $data['tax'],
                                'zbst_total' => $data['total'],
                                'zbst_date_paid' => $data['date_paid'],
                                'zbst_date_completed' => $data['date_completed'],
                                'zbst_lastupdated' => time(),

                            );

                    $typeArr = array( // field data types
                                //'%d',  // site
                                //'%d',  // team
                                //'%d',  // owner

                                    
                                '%s',
                                '%s',
                                '%s',
                                '%s',
                                '%d',
                                '%s',
                                '%s',
                                '%s',
                                '%d',
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
                                '%d',
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
                        $dataArr['zbst_created'] = $data['created'];$typeArr[] = '%d';
                    } else {
                        $dataArr['zbst_created'] = time();          $typeArr[] = '%d';
                    }
                    // if no transaction date is passed on creation, use time()
                    // allow for 0 value (valid epoch time)
                    if ( empty($dataArr['zbst_date']) && $dataArr['zbst_date'] !== 0 ) {
                        $dataArr['zbst_date'] = time();
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
                $originalStatus = $this->getTransactionStatus($id);

                // log any change of status
                if (isset($dataArr['zbst_status']) && !empty($dataArr['zbst_status']) && !empty($originalStatus) && $dataArr['zbst_status'] != $originalStatus){

                    // status change
                    $statusChange = array(
                        'from' => $originalStatus,
                        'to' => $dataArr['zbst_status']
                        );
                }
            

                #} Attempt update
                if ($wpdb->update( 
                        $ZBSCRM_t['transactions'], 
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
                                            $this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$id,'objType'=>ZBS_TYPE_TRANSACTION));

                                            // addupdate each
                                            foreach ($data['lineitems'] as $lineitem) {

                                                // slight rejig of passed so works cleanly with data array style
                                                $lineItemID = false; if (isset($lineitem['ID'])) $lineItemID = $lineitem['ID'];
                                                $this->DAL()->lineitems->addUpdateLineitem(array(
                                                    'id'=>$lineItemID,
                                                    'linkedObjType' => ZBS_TYPE_TRANSACTION,
                                                    'linkedObjID' => $id,
                                                    'data'=>$lineitem
                                                    ));

                                            }

                                    } else {

                                        // delete all lineitems
                                        $this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$id,'objType'=>ZBS_TYPE_TRANSACTION));

                                    }


                                }

                                // / Line Items ====

                                // OBJ LINKS - to contacts/companies
                                $this->addUpdateObjectLinks($id,$data['contacts'],ZBS_TYPE_CONTACT);
                                $this->addUpdateObjectLinks($id,$data['companies'],ZBS_TYPE_COMPANY); 

                                // IA also gets 'againstid' historically, but we'll pass as 'against id's'
                                $againstIDs = array('contacts'=>$data['contacts'],'companies'=>$data['companies']);

                                // OBJ Links - to invoices
                                $this->addUpdateObjectLinks($id,array($data['invoice_id']),ZBS_TYPE_INVOICE);

                                // if not-empty inv id, check if needs to be mark paid!
                                if (!$do_not_mark_invoices && !empty($data['invoice_id']) && $data['invoice_id'] > 0){

                                        //function to check ammount due and mark invoice as paid if amount due <= 0.
                                        zeroBSCRM_check_amount_due_mark_paid($data['invoice_id']);
                                        
                                }
                                

                                // tags
                                if (isset($data['tags']) && is_array($data['tags'])) {

                                    $this->addUpdateTransactionTags(
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
                                        'obj_type_id'      => ZBS_TYPE_TRANSACTION,
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
                                                        'objtype'   => ZBS_TYPE_TRANSACTION,
                                                        'objid'     => $id,
                                                        'objkey'    => $cK,
                                                        'objval'    => $data[$cK]
                                                )));

                                        }

                                    }

                                // / Custom Fields

                            } else {

                                // limited fields
                                // here we set what will not have been passed as blanks, for the IA to use below.
                                $againstIDs = false;
                                $approvedExternalSource = '';

                            }

                            // Any extra meta keyval pairs
                            // BRUTALLY updates (no checking)
                            $confirmedExtraMeta = false;
                            if (isset($extraMeta) && is_array($extraMeta)) {

                                $confirmedExtraMeta = array();

                                    foreach ($extraMeta as $k => $v){

                                    #} This won't fix stupid keys, just catch basic fails... 
                                    $cleanKey = strtolower(str_replace(' ','_',$k));

                                    #} Brutal update
                                    //update_post_meta($postID, 'zbs_customer_extra_'.$cleanKey, $v);
                                    $this->DAL()->updateMeta(ZBS_TYPE_TRANSACTION,$id,'extra_'.$cleanKey,$v);

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
                                //if (isset($_POST['zbst_status_dirtyflag']) && $_POST['zbst_status_dirtyflag'] == "1"){
                                // actually here, it's set above
                                if (isset($statusChange) && is_array($statusChange)){

                                    // status has changed

                                    // IA
                                    zeroBSCRM_FireInternalAutomator('transaction.status.update',array(
                                        'id'            => $id,
                                        'againstids'    => $againstIDs,
                                        'data'          => $data,
                                        'from'          => $statusChange['from'],
                                        'to'            => $statusChange['to']
                                        ));

                                } 


                                // IA General transaction update (2.87+)
                                zeroBSCRM_FireInternalAutomator('transaction.update',array(
                                        'id'                    => $id,
                                        'data'                  => $data,
                                        'againstids'            => $againstIDs,
                                        'extsource'             => $approvedExternalSource,
                                        'automatorpassthrough'  => $automatorPassthrough, #} This passes through any custom log titles or whatever into the Internal automator recipe.
                                        'extraMeta'             => $confirmedExtraMeta #} This is the "extraMeta" passed (as saved)
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
                        $ZBSCRM_t['transactions'], 
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
                                $this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$newID,'objType'=>ZBS_TYPE_TRANSACTION));

                                // addupdate each
                                foreach ($data['lineitems'] as $lineitem) {

                                    // slight rejig of passed so works cleanly with data array style
                                    $lineItemID = false; if (isset($lineitem['ID'])) $lineItemID = $lineitem['ID'];
                                    $this->DAL()->lineitems->addUpdateLineitem(array(
                                        'id'=>$lineItemID,
                                        'linkedObjType' => ZBS_TYPE_TRANSACTION,
                                        'linkedObjID' => $newID,
                                        'data'=>$lineitem
                                        ));

                                }

                        } else {

                            // delete all lineitems
                            $this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$newID,'objType'=>ZBS_TYPE_TRANSACTION));

                        }


                    }

                    // / Line Items ==== 

                    // OBJ LINKS - to contacts/companies
                    $this->addUpdateObjectLinks($newID,$data['contacts'],ZBS_TYPE_CONTACT);
                    $this->addUpdateObjectLinks($newID,$data['companies'],ZBS_TYPE_COMPANY);
                    // IA also gets 'againstid' historically, but we'll pass as 'against id's'
                    $againstIDs = array('contacts'=>$data['contacts'],'companies'=>$data['companies']);

                    // OBJ Links - to invoices
                    $this->addUpdateObjectLinks($newID,array($data['invoice_id']),ZBS_TYPE_INVOICE);

                    // if not-empty inv id, check if needs to be mark paid!
                    if (!$do_not_mark_invoices && !empty($data['invoice_id']) && $data['invoice_id'] > 0){

                            //function to check ammount due and mark invoice as paid if amount due <= 0.
                            zeroBSCRM_check_amount_due_mark_paid($data['invoice_id']);

                    }

                    // tags
                    if (isset($data['tags']) && is_array($data['tags'])) {

                        $this->addUpdateTransactionTags(
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
                            'obj_type_id'      => ZBS_TYPE_TRANSACTION,
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
                                            'objtype'   => ZBS_TYPE_TRANSACTION,
                                            'objid'     => $newID,
                                            'objkey'    => $cK,
                                            'objval'    => $data[$cK]
                                    )));

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
                            $this->DAL()->updateMeta(ZBS_TYPE_TRANSACTION,$newID,'extra_'.$cleanKey,$v);

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
                        zeroBSCRM_FireInternalAutomator('transaction.new',array(
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
     * adds or updates a transaction's tags
     * ... this is really just a wrapper for addUpdateObjectTags
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateTransactionTags($args=array()){

        global $ZBSCRM_t,$wpdb;

        #} ============ LOAD ARGS =============
        $defaultArgs  = array(

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
                'objtype'   => ZBS_TYPE_TRANSACTION,
                'objid'     => $id,
                'tag_input' => $tag_input,
                'tags'      => $tags,
                'tagIDs'    => $tagIDs,
                'mode'      => $mode
            )
        );

    }

    /**
     * updates status for a transaction (no blanks allowed)
     *
     * @param int id transaction ID
     * @param string transaction Status
     *
     * @return bool
     */
    public function setTransactionStatus($id=-1,$status=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0 && !empty($status) && $status !== -1){

            return $this->addUpdateTransaction(array(
                'id'=>$id,
                'limitedFields'=>array(
                    array('key'=>'zbst_status','val' => $status,'type' => '%s')
            )));

        }

        return false;
        
    }



     /**
     * deletes a transaction object
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteTransaction($args=array()){

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

                    'objtype'       => ZBS_TYPE_TRANSACTION,
                    'objid'         => $id,

                ));

                // delete any external source information
                $this->DAL()->delete_external_sources( array(

                    'obj_type'       => ZBS_TYPE_TRANSACTION,
                    'obj_id'         => $id,
                    'obj_source'    => 'all',

                ));

            }

            $del = zeroBSCRM_db2_deleteGeneric($id,'transactions');

            #} Add to automator
            zeroBSCRM_FireInternalAutomator('transaction.delete',array(
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
     * @return array transaction (clean obj)
     */
    private function tidy_transaction($obj=false,$withCustomFields=false){

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
            
            $res['status'] = $this->stripSlashes($obj->zbst_status);
            $res['type'] = $this->stripSlashes($obj->zbst_type);

            // status categorisation (basically did it succeed?) 
            // this is dictated by Transaction Status settings: /wp-admin/admin.php?page=zerobscrm-plugin-settings&tab=transactions               
            $res['status_bool'] = ( 'all' === $this->getTransactionStatusesToInclude() || in_array( $res['status'], $this->getTransactionStatusesToInclude() ) ? 1 : -1 );

            // type further categorised here, because JS etc. needs it in non-lingual
            $res['type_accounting'] = $this->transactionAccountingType($res['type']);

            $res['ref'] = $this->stripSlashes($obj->zbst_ref);
            $res['origin'] = $this->stripSlashes($obj->zbst_origin);
            $res['parent'] = (int)$obj->zbst_parent;
            $res['hash'] = $this->stripSlashes($obj->zbst_hash);
            $res['title'] = is_null($obj->zbst_title)?'':$this->stripSlashes($obj->zbst_title);
            $res['desc'] = $this->stripSlashes($obj->zbst_desc);
            $res['date'] = (int)$obj->zbst_date;
            // well this naming convention makes this confusing... lol: //
            $res['date_date'] = (isset($obj->zbst_date) && $obj->zbst_date > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbst_date) : false;   
            $res['customer_ip'] = $this->stripSlashes($obj->zbst_customer_ip);
            $res['currency'] = $this->stripSlashes($obj->zbst_currency);
            $res['net'] = $this->stripSlashes($obj->zbst_net);
            $res['fee'] = $this->stripSlashes($obj->zbst_fee);
            $res['discount'] = $this->stripSlashes($obj->zbst_discount);
            $res['shipping'] = $this->stripSlashes($obj->zbst_shipping);
            $res['shipping_taxes'] = $this->stripSlashes($obj->zbst_shipping_taxes);
            $res['shipping_tax'] = $this->stripSlashes($obj->zbst_shipping_tax);
            $res['taxes'] = $this->stripSlashes($obj->zbst_taxes);
            $res['tax'] = $this->stripSlashes($obj->zbst_tax);
            $res['total'] = $this->stripSlashes($obj->zbst_total);
            $res['date_paid'] = is_null( $obj->zbst_date_paid ) ? null : (int)$obj->zbst_date_paid;
            $res['date_paid_date'] = (isset($obj->zbst_date_paid) && $obj->zbst_date_paid > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbst_date_paid) : false;
            $res['date_completed'] = is_null( $obj->zbst_date_completed ) ? null : (int)$obj->zbst_date_completed;
            $res['date_completed_date'] = (isset($obj->zbst_date_completed) && $obj->zbst_date_completed > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbst_date_completed) : false;
            $res['created'] = (int)$obj->zbst_created;
            $res['created_date'] = (isset($obj->zbst_created) && $obj->zbst_created > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbst_created,false,true) : false;
            $res['lastupdated'] = (int)$obj->zbst_lastupdated;
            $res['lastupdated_date'] = (isset($obj->zbst_lastupdated) && $obj->zbst_lastupdated > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbst_lastupdated) : false;

            // custom fields - tidy any that are present:
            if ($withCustomFields) $res = $this->tidyAddCustomFields(ZBS_TYPE_TRANSACTION,$obj,$res,false);

        } 


        return $res;


    }

	/**
	 * Tidies a row from a database result containing the columns external_source_uids and external_source_sources.
	 * The result is a formatted HTML string.
	 *
	 * @param object $row (DB row containing the columns external_source_uids and external_source_sources)
	 *
	 * @return string Formatted HTML string for the external sources.
	 */
	private function tidy_external_sources( $row ) {
		if ($row->external_source_uids == null && $row->external_source_sources == null) {
			return "";
		}
		$external_source_uids = explode("\n", $row->external_source_uids);
		$external_source_sources = explode("\n", $row->external_source_sources);
		$external_source_strings = array_map(
			function($source, $uid) {
				$source_title = zeroBS_getExternalSourceTitle( $source, $uid );
				// Formats the default zeroBS_getExternalSourceTitle string to look better in the table.
				$source_title_explode = explode( "<br />", $source_title, 2 );
				if ( count($source_title_explode) === 2 ) {
					// Removes the trailing ':' from the source. E.g. 'WooCommerce:' becomes 'WooCommerce'.
					$source_title_source = rtrim($source_title_explode[0], ":");
					return "{$source_title_explode[1]} ({$source_title_source})";
				} else {
					return $source_title;
				}
			},
			$external_source_sources,
			$external_source_uids
		);

		return implode( '<br />', $external_source_strings );
	}

    /**
     * Takes a transaction status (e.g. Sale or Credit Note), and returns debit/credit :)
     * wrapper that should be used throughout for inferring accounting direction for a transaction
     *
     * @param int objtype
     * @param int objid
     * @param string key
     *
     * @return array transaction meta result
     */
    public function transactionAccountingType( $transaction_type='Sale' ){

        if ( !empty( $transaction_type ) ){

                if ( in_array( $transaction_type, array( __( 'Refund', 'zero-bs-crm' ), __( 'Credit Note', 'zero-bs-crm' ) ) ) ){
                    return 'credit';
                }

        }

        return 'debit';
    }


    /**
     * Wrapper, use $this->getTransactionMeta($contactID,$key) for easy retrieval of singular transaction
     * Simplifies $this->getMeta
     *
     * @param int objtype
     * @param int objid
     * @param string key
     *
     * @return array transaction meta result
     */
    public function getTransactionMeta($id=-1,$key='',$default=false){

        global $zbs;

        if (!empty($key)){

            return $this->DAL()->getMeta(array(

                'objtype' => ZBS_TYPE_TRANSACTION,
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
     * Returns a Transaction's tag array
     *
     * @param int id Transaction ID
     *
     * @return mixed
     */
    public function getTransactionTags($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_TRANSACTION,'objid'=>$id));

        }

        return false;
        
    }


    
    /**
     * Returns a reference against a transaction
     *
     * @param int id transaction ID
     *
     * @return string transaction ref
     */
    public function get_transaction_ref( $transaction_id = -1 ){

        global $zbs;

        return $this->DAL()->getFieldByID( array(
            'id'           => $transaction_id,
            'objtype'      => ZBS_TYPE_TRANSACTION,
            'colname'      => 'zbst_ref',
            'ignoreowner'  => true
        ));
        
    }


    /**
     * Returns an ownerid against a transaction
     * Replaces zeroBS_getCustomerOwner
     *
     * @param int id transaction ID
     *
     * @return int transaction owner id
     */
    public function getTransactionOwner($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_TRANSACTION,
                'colname' => 'zbs_owner',
                'ignoreowner'=>true));

        }

        return false;
        
    }


    
    /**
     * Returns an array of contacts associtaed with a transaction
     *
     * @param int id transaction ID
     *
     * @return array contacts assocatied with transaction
     */
    public function get_transaction_contacts( $transaction_id ){

        return $this->DAL()->contacts->getContacts(array(
            'hasObjTypeLinkedTo'=>ZBS_TYPE_TRANSACTION,
            'hasObjIDLinkedTo'=>$transaction_id
        ));
        
    }
    
    /**
     * Returns an invoice associtaed with a transaction
     *
     * @param int id transaction ID
     *
     * @return array $invoice
     */
    public function get_transaction_invoice_id( $transaction_id ){

        return $this->DAL()->getFirstIDLinkedToObj(array(

                'objtypefrom'       => ZBS_TYPE_TRANSACTION,
                'objtypeto'         => ZBS_TYPE_INVOICE,
                'objfromid'         => $transaction_id,

        ));
        
    }


    /**
     * Returns an status against a transaction
     *
     * @param int id transaction ID
     *
     * @return str transaction status string
     */
    public function getTransactionStatus($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_TRANSACTION,
                'colname' => 'zbst_status',
                'ignoreowner'=>true));

        }

        return false;
        
    }

    /**
     * returns the transaction statuses to include in "total value" as per the setting on 
     * admin.php?page=zerobscrm-plugin-settings&tab=transactions
     *
     * @return array 
     */
    function getTransactionStatusesToInclude(){

        // load (accept from cache)
        $setting = $this->DAL()->setting( 'transinclude_status', 'all', true );

        if (is_string($setting) && strpos($setting, ',') > 0){

            return explode(',', $setting);
        } elseif (is_array($setting)){

            return $setting;
            
        }

        return 'all';
        
    }

    /**
     * returns an SQL query addition which will allow filtering of transactions
     * that should be included in "total value" fields
     * admin.php?page=zerobscrm-plugin-settings&tab=transactions
     *
     * @param str $table_alias_sql - if using a table alias pass that here, e.g. `transactions.`
     * @return array 
     */
    function getTransactionStatusesToIncludeQuery( $table_alias_sql = '' ){


        // first we get the setting
        $transaction_statuses = $this->getTransactionStatusesToInclude(); 
                 
        // next we build the SQL
        // note that (in a legacy way) getTransactionStatusesToInclude() returns a string 'all'
        // .. if all transactions are selected
        // .. in that case there's no SQL to return as all statuses count.
        $query_addition = ''; 
        if ( is_array( $transaction_statuses ) && count( $transaction_statuses ) > 0 ){

            // create escaped csv
            $transaction_statuses_str = $this->build_csv( $transaction_statuses );

            // build return sql
            $query_addition = ' AND ' . $table_alias_sql . 'zbst_status IN ('.$transaction_statuses_str.')';

        }

        return $query_addition;

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
    private function db_ready_transaction($obj=false){

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
    public function listViewObj($transaction=false,$columnsRequired=array()){

        if (is_array($transaction) && isset($transaction['id'])){

            $resArr = $transaction;

            // a lot of this is legacy <DAL3 stuff just mapped. def could do with an improvement for efficacy's sake.

            $resArr['total'] = zeroBSCRM_formatCurrency($resArr['total']);
            //$resArr['orderid'] = strlen($transaction['orderid']) > 7 ? substr($transaction['orderid'],0,7)."..." : $transaction['orderid'];
            // order id now = ref (use proper field)
            //$resArr['id'] = $transaction['id'];
            $resArr['status'] = ucfirst($transaction['status']); 

            // This wasn't working: $d = new DateTime($transaction['meta']['date']); 
            // ... so I added the correct field (post_date) to getTransactions and piped in here
            //$d = new DateTime($transaction['date']); 
            //$formatted_date = $d->format(zeroBSCRM_getDateFormat());
            // USE proper field $resArr['added'] = $formatted_date;

            #} Convert $contact arr into list-view-digestable 'customer'// & unset contact for leaner data transfer
            $resArr['customer'] = zeroBSCRM_getSimplyFormattedContact($transaction['contact'],(in_array('assignedobj', $columnsRequired))); 

            #} Convert $contact arr into list-view-digestable 'customer'// & unset contact for leaner data transfer
            $resArr['company'] = zeroBSCRM_getSimplyFormattedCompany($transaction['company'],(in_array('assignedobj', $columnsRequired))); 

            #} Tags
            //if (in_array('tagged', $columnsRequired)){

            //    $resArr['tags'] = $transaction['tags'];

            //}

            return $resArr;

        }

        return false;

    }

    // ===========  /   TRANSACTION  =======================================================
    // ===============================================================================
    

} // / class
