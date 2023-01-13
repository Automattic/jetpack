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

/* Note on these getting separate DAL OBJ LAYER (excerpt from WH DAL3.0 notes)
    - There are a few tables which are nested (no separate DAL2.Obj file), for these reasons:
        - Meta, Custom Fields, ObjLinks are used so universally that they have been left in main DAL2.php
        - Event Reminders sit within Events.php obj layer file
        - LineItems get their own file, while they could sit in DAL2, they're new, and using the object layer will speed up the code write (easy get funcs etc. using obj model). Arguably these + meta, custom fields, etc. could sit somewhere else (these are used for Quotes, Invs, Trans)
*/

/**
* ZBS DAL >> LineItems
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_lineitems extends zbsDAL_ObjectLayer {

    protected $objectType = ZBS_TYPE_LINEITEM;
    protected $objectDBPrefix = 'zbsli_';
    protected $objectModel = array(

        // ID
        'ID' => array('fieldname' => 'ID', 'format' => 'int'),

        // site + team generics
        'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
        'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
        'zbs_owner' => array('fieldname' => 'zbs_owner', 'format' => 'int'),

        // other fields
        'order' => array('fieldname' => 'zbsli_order', 'format' => 'int'),
        'title' => array(
            'fieldname' => 'zbsli_title',
            'format' => 'str',
            'max_len' => 300
        ),
        'desc' => array(
            'fieldname' => 'zbsli_desc',
            'format' => 'str',
            'max_len' => 300
        ),
        'quantity' => array('fieldname' => 'zbsli_quantity', 'format' => 'decimal'),
        'price' => array('fieldname' => 'zbsli_price', 'format' => 'decimal'),
        'currency' => array('fieldname' => 'zbsli_currency', 'format' => 'curr'),
        'net' => array('fieldname' => 'zbsli_net', 'format' => 'decimal'),
        'discount' => array('fieldname' => 'zbsli_discount', 'format' => 'decimal'),
        'fee' => array('fieldname' => 'zbsli_fee', 'format' => 'decimal'),
        'shipping' => array('fieldname' => 'zbsli_shipping', 'format' => 'decimal'),
        'shipping_taxes' => array('fieldname' => 'zbsli_shipping_taxes', 'format' => 'str'),
        'shipping_tax' => array('fieldname' => 'zbsli_shipping_tax', 'format' => 'decimal'),
        'taxes' => array('fieldname' => 'zbsli_taxes', 'format' => 'str'),
        'tax' => array('fieldname' => 'zbsli_tax', 'format' => 'decimal'),
        'total' => array('fieldname' => 'zbsli_total', 'format' => 'decimal'),
        'created' => array('fieldname' => 'zbsli_created', 'format' => 'uts'),
        'lastupdated' => array('fieldname' => 'zbsli_lastupdated', 'format' => 'uts'),
        
        );


    function __construct($args=array()) {


        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            //'tag' => false,

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============


    }

    // ===============================================================================
    // ===========   LINEITEM  =======================================================
    
    /**
     * returns full lineitem line +- details
     *
     * @param int id        lineitem id
     * @param array $args   Associative array of arguments
     *
     * @return array lineitem object
     */
    public function getLineitem($id=-1,$args=array()){

        global $zbs;

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            // permissions
            'ignoreowner'   => false, // this'll let you not-check the owner of obj

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


                $selector = 'lineitem.*';
                if (isset($fields) && is_array($fields)) {
                    $selector = '';

                    // always needs id, so add if not present
                    if (!in_array('ID',$fields)) $selector = 'lineitem.ID';

                    foreach ($fields as $f) {
                        if (!empty($selector)) $selector .= ',';
                        $selector .= 'lineitem.'.$f;
                    }
                } else if ($onlyID){
                    $selector = 'lineitem.ID';
                }

            #} ============ / PRE-QUERY ===========


            #} Build query
            $query = "SELECT ".$selector.$extraSelect." FROM ".$ZBSCRM_t['lineitems'].' as lineitem';
            #} ============= WHERE ================

                if (!empty($id) && $id > 0){

                    #} Add ID
                    $wheres['ID'] = array('ID','=','%d',$id);

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
                        $res = $this->tidy_lineitem($potentialRes,$withCustomFields);
                    }

                    return $res;

            }

        } // / if ID

        return false;

    }

    /**
     * returns lineitem detail lines
     *
     * @param array $args Associative array of arguments
     *
     * @return array of lineitem lines
     */
    public function getLineitems($args=array()){

        global $zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'searchPhrase'          => '', // searches zbsli_title, zbsli_desc
            'associatedObjType'     => false, // e.g. ZBS_TYPE_QUOTE
            'associatedObjID'       => false, // e.g. 123
            // Note on associated types: They can be used:
            // associatedObjType
            // associatedObjType + associatedObjID
            // BUT NOT JUST associatedObjID (would bring collisions)

            'withCustomFields' => false, // none yet anyhow

            // returns
            'count'             => false,

            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0, // this is what page it is (gets * by for limit)
            'perPage'       => 100,
            'whereCase'          => 'AND', // DEFAULT = AND

            // permissions
            'ignoreowner'   => false, // this'll let you not-check the owner of obj


        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        global $ZBSCRM_t,$wpdb,$zbs;  
        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array(); $joinQ = ''; $extraSelect = '';

        #} ============= PRE-QUERY ============

            #} Capitalise this
            $sortOrder = strtoupper($sortOrder);

            #} If just count, turn off any extra gumpf
            //if ($count) { }

        #} ============ / PRE-QUERY ===========

        #} Build query
        $query = "SELECT lineitem.*".$extraSelect." FROM ".$ZBSCRM_t['lineitems'].' as lineitem'.$joinQ;

        #} Count override
        if ($count) $query = "SELECT COUNT(lineitem.ID) FROM ".$ZBSCRM_t['lineitems'].' as lineitem'.$joinQ;

        #} ============= WHERE ================

            #} Add Search phrase
            if (!empty($searchPhrase)){

                // search? - ALL THESE COLS should probs have index of FULLTEXT in db?
                $searchWheres = array();
                $searchWheres['search_title'] = array('zbsli_title','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_desc'] = array('zbsli_desc','LIKE','%s','%'.$searchPhrase.'%');

                // This generates a query like 'zbsli_fname LIKE %s OR zbsli_lname LIKE %s', 
                // which we then need to include as direct subquery (below) in main query :)
                $searchQueryArr = $this->buildWheres($searchWheres,'',array(),'OR',false);
                
                if (is_array($searchQueryArr) && isset($searchQueryArr['where']) && !empty($searchQueryArr['where'])){

                    // add it
                    $wheres['direct'][] = array('('.$searchQueryArr['where'].')',$searchQueryArr['params']);

                }

            }

            // associated object search
            // simplifiers
            $hasObjType = false; $hasObjID = false; 
            if (!empty($associatedObjType) && $associatedObjType > 0) $hasObjType = true;
            if (!empty($associatedObjID) && $associatedObjID > 0) $hasObjID = true;

            // switch depending on setup
            if ($hasObjType && $hasObjID){

                // has id + type to match to (e.g. quote 123)
                $wheres['associatedObjType'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_LINEITEM." AND zbsol_objtype_to = %d AND zbsol_objid_to = %d)",array($associatedObjType,$associatedObjID));

            } else if ($hasObjType && !$hasObjID){

                // has type but no id
                // e.g. line items attached to invoices
                $wheres['associatedObjType'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_LINEITEM." AND zbsol_objtype_to = %d)",$associatedObjType);


            } else if ($hasObjID && !$hasObjType){

                // has id but no type
                // DO NOTHING, this is dodgy to ever call :) as collision of objs
            }

            #} Any additionalWhereArr?
            if (isset($additionalWhereArr) && is_array($additionalWhereArr) && count($additionalWhereArr) > 0){

                // add em onto wheres (note these will OVERRIDE if using a key used above)
                // Needs to be multi-dimensional $wheres = array_merge($wheres,$additionalWhereArr);
                $wheres = array_merge_recursive($wheres,$additionalWhereArr);

            }
        

        #} ============ / WHERE ===============

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
                        
                    // tidy
                    $resArr = $this->tidy_lineitem($resDataLine,$withCustomFields);

                    $res[] = $resArr;

            }
        }

        return $res;
    } 


    /**
     * Returns a count of lineitems (owned)
     * .. inc by status
     *
     * @return int count
     */
    public function getLineItemCount($args=array()){

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)

            // permissions
            'ignoreowner'   => true, // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $whereArr = array();

        return $this->DAL()->getFieldByWHERE(array(
            'objtype' => ZBS_TYPE_LINEITEM,
            'colname' => 'COUNT(ID)',
            'where' => $whereArr,
            'ignoreowner' => $ignoreowner));
        
    }


    /**
     * returns tax summary array, of taxes applicable to given lineitems
     *
     * @param array $args Associative array of arguments
     *
     * @return array summary of taxes (e.g. array(array('name' => 'VAT','rate' => 20, 'value' => 123.44)))
     */
    public function getLineitemsTaxSummary($args=array()){

        global $zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // pass lineitems objs in array
            'lineItems'          => array()


        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $summaryData = array();

        // calc
        if (isset($lineItems) && is_array($lineItems) && count($lineItems) > 0){

            $lineItemTaxes = array();
            $taxRateTable = zeroBSCRM_taxRates_getTaxTableArr(true);

            foreach ($lineItems as $lineItem){

                // got any taxes on ?
                if (isset($lineItem['net']) && isset($lineItem['taxes'])){

                    $taxRatesToApply = array();

                    // get any taxes...
                    if (strpos($lineItem['taxes'],',')){

                        $taxRateIDs = explode(',', $lineItem['taxes']);
                        if (is_array($taxRateIDs)) $taxRatesToApply = $taxRateIDs;

                    } else $taxRatesToApply[] = (int)$lineItem['taxes'];

                    // calc these ones + add to summary
                    if (is_array($taxRatesToApply)) foreach ($taxRatesToApply as $taxRateID){

                        $rateID = (int)$taxRateID;
                        if (isset($taxRateTable[$rateID])){

                            // get rate
                            $rate = 0.0; if (isset($taxRateTable[$rateID]['rate'])) $rate = (float)$taxRateTable[$rateID]['rate'];

                            // calc + add
                            $itemNet = $lineItem['net'];
                            if (isset($lineItem['discount'])) $itemNet -= $lineItem['discount'];
                            $taxValue = round($itemNet*($rate/100),2);

                            // add to summary
                            if (!isset($summaryData[$rateID])){

                                // new, add
                                $summaryData[$rateID] = array(

                                    'name' => $taxRateTable[$rateID]['name'],
                                    'rate' => $rate,
                                    'value' => $taxValue

                                );

                            } else {

                                // += 
                                $summaryData[$rateID]['value'] += $taxValue;

                            }

                        } // else not set?

                    } // / foreach tax rate to apply
                
                } // / if has net and taxes

            } // / foreach line item
        
        } // / if has items

        return $summaryData;

    }

     /**
     * adds or updates a lineitem object
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateLineitem($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'owner'         => -1,

            // assign to
            'linkedObjType'       => -1,
            'linkedObjID'         => -1,

            // fields (directly)
            'data'          => array(

                
                'order' => '',
                'title' => '',
                'desc' => '',
                'quantity' => '',
                'price' => '',
                'currency' => '',
                'net' => '',
                'discount' => '',
                'fee' => '',
                'shipping' => '',
                'shipping_taxes' => '',
                'shipping_tax' => '',
                'taxes' => '',
                'tax' => '',
                'total' => '',
                'lastupdated' => '',

                // allow this to be set for sync etc.
                'created' => -1,

            ),

            'limitedFields' => -1, // if this is set it OVERRIDES data (allowing you to set specific fields + leave rest in tact)
            // ^^ will look like: array(array('key'=>x,'val'=>y,'type'=>'%s'))

            'silentInsert' => false, // this was for init Migration - it KILLS all IA for newLineitem (because is migrating, not creating new :) this was -1 before

            'do_not_update_blanks' => false, // this allows you to not update fields if blank (same as fieldoverride for extsource -> in)

            'calculate_totals' => false // This allows us to recalculate tax, subtotal, total via php (e.g. if added via api). Only works if not using limitedFields


        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        
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

                    // (re)calculate the totals etc?
                    if (isset($calculate_totals) && $calculate_totals){

                        $data = $this->recalculate($data);

                    }

            }

        #} ========= / CHECK FIELDS ===========


        #} ========= OVERRIDE SETTING (Deny blank overrides) ===========

            // either ext source + setting, or set by the func call
            if ($do_not_update_blanks){

                    // this setting says 'don't override filled-out data with blanks'
                    // so here we check through any passed blanks + convert to limitedFields
                    // only matters if $id is set (there is somt to update not add
                    if (isset($id) && !empty($id) && $id > 0){

                        // get data to copy over (for now, this is required to remove 'fullname' etc.)
                        $dbData = $this->db_ready_lineitem($data); 
                        //unset($dbData['id']); // this is unset because we use $id, and is update, so not req. legacy issue
                        //unset($dbData['created']); // this is unset because this uses an obj which has been 'updated' against original details, where created is output in the WRONG format :)

                        $origData = $data; //$data = array();               
                        $limitedData = array(); // array(array('key'=>'zbsli_x','val'=>y,'type'=>'%s'))

                        // cycle through + translate into limitedFields (removing any blanks, or arrays (e.g. externalSources))
                        // we also have to remake a 'faux' data (removing blanks for tags etc.) for the post-update updates
                        foreach ($dbData as $k => $v){

                            $intV = (int)$v;

                            // only add if valuenot empty
                            if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){

                                // add to update arr
                                $limitedData[] = array(
                                    'key' => 'zbsli_'.$k, // we have to add zbsli_ here because translating from data -> limited fields
                                    'val' => $v,
                                    'type' => $this->getTypeStr('zbsli_'.$k)
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
                if (!isset($dataArr['zbsli_lastupdated'])){ $dataArr['zbsli_lastupdated'] = time(); $typeArr[] = '%d'; }

            } else {

                // FULL UPDATE/INSERT

                    // UPDATE
                    $dataArr = array( 

                                // ownership
                                // no need to update these (as of yet) - can't move teams etc.
                                //'zbs_site' => zeroBSCRM_installSite(),
                                //'zbs_team' => zeroBSCRM_installTeam(),
                                //'zbs_owner' => $owner,

                                    
                                'zbsli_order' => $data['order'],
                                'zbsli_title' => $data['title'],
                                'zbsli_desc' => $data['desc'],
                                'zbsli_quantity' => $data['quantity'],
                                'zbsli_price' => $data['price'],
                                'zbsli_currency' => $data['currency'],
                                'zbsli_net' => $data['net'],
                                'zbsli_discount' => $data['discount'],
                                'zbsli_fee' => $data['fee'],
                                'zbsli_shipping' => $data['shipping'],
                                'zbsli_shipping_taxes' => $data['shipping_taxes'],
                                'zbsli_shipping_tax' => $data['shipping_tax'],
                                'zbsli_taxes' => $data['taxes'],
                                'zbsli_tax' => $data['tax'],
                                'zbsli_total' => $data['total'],
                                'zbsli_lastupdated' => time(),

                            );

                    $typeArr = array( // field data types
                                //'%d',  // site
                                //'%d',  // team
                                //'%d',  // owner

                                    
                                '%d',
                                '%s',
                                '%s',
                                '%f',
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
                        $dataArr['zbsli_created'] = $data['created'];$typeArr[] = '%d';
                    } else {
                        $dataArr['zbsli_created'] = time();          $typeArr[] = '%d';
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

                #} Attempt update
                if ($wpdb->update( 
                        $ZBSCRM_t['lineitems'], 
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


                            } // / if $data


                            // linked to anything?
                            if ($linkedObjType > 0 && $linkedObjID > 0){

                                // if not already got obj link, add it
                                $c = $this->DAL()->getObjsLinksLinkedToObj(array(
                                                    'objtypefrom'   =>  ZBS_TYPE_LINEITEM, // line item type (10)
                                                    'objtypeto'     =>  $linkedObjType, // obj type (e.g. inv)
                                                    'objfromid'     =>  $id,
                                                    'objtoid'       =>  $linkedObjID,
                                                    'direction'     => 'both',
                                                    'count'         => true,
                                                    'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_LINEITEM)));

                                // add link (via append) if not present
                                if ($c <= 0) $this->DAL()->addUpdateObjLink(array(
                                        'data'=>array(
                                            'objtypefrom' =>  ZBS_TYPE_LINEITEM,
                                            'objtypeto'   =>  $linkedObjType,
                                            'objfromid'   =>  $id,
                                            'objtoid'     =>  $linkedObjID,
                                            // not req. 'owner'         =>  $owner
                                        )
                                ));

                            }


                            /* Not necessary 
                            #} INTERNAL AUTOMATOR 
                            #} & 
                            #} FALLBACKS
                            // UPDATING CONTACT
                            if (!$silentInsert){

                                // IA General lineitem update (2.87+)
                                zeroBSCRM_FireInternalAutomator('lineitem.update',array(
                                    'id'=>$id,
                                    'againstid' => $id,
                                    'data'=> $dataArr
                                    ));

                                

                            } */

                                
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
                        $ZBSCRM_t['lineitems'], 
                        $dataArr, 
                        $typeArr ) > 0){

                    #} Successfully inserted, lets return new ID
                    $newID = $wpdb->insert_id;

                    // linked to anything?
                    if ($linkedObjType > 0 && $linkedObjID > 0){

                        // if not already got obj link, add it
                        $c = $this->DAL()->getObjsLinksLinkedToObj(array(
                                            'objtypefrom'   =>  ZBS_TYPE_LINEITEM, // line item type (10)
                                            'objtypeto'     =>  $linkedObjType, // obj type (e.g. inv)
                                            'objfromid'     =>  $newID,
                                            'objtoid'       =>  $linkedObjID,
                                            'direction'     => 'both',
                                            'count'         => true,
                                            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_LINEITEM)));
                        
                        // add link (via append) if not present
                        if ($c <= 0) $this->DAL()->addUpdateObjLink(array(
                                'data'=>array(
                                    'objtypefrom' =>  ZBS_TYPE_LINEITEM,
                                    'objtypeto'   =>  $linkedObjType,
                                    'objfromid'   =>  $newID,
                                    'objtoid'     =>  $linkedObjID,
                                    // not req. 'owner'         =>  $owner
                                )
                        ));

                    }

                    /* Not necessary 
                    #} INTERNAL AUTOMATOR 
                    #} & 
                    #} FALLBACKS
                    // NEW CONTACT
                    if (!$silentInsert){

                        #} Add to automator
                        zeroBSCRM_FireInternalAutomator('lineitem.new',array(
                            'id'=>$newID,
                            'data'=>$dataArr,
                            'extsource'=>$approvedExternalSource,
                            'automatorpassthrough'=>$automatorPassthrough, #} This passes through any custom log titles or whatever into the Internal automator recipe.
                            'extraMeta'=>$confirmedExtraMeta #} This is the "extraMeta" passed (as saved)
                        ));

                    }
                    */
                    
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
     * deletes a lineitem object
     *
     * NOTE! Not to be used directly, or if so, manually delete the objlinks for this item<->obj (e.g. inv) else garbage kept in objlinks table
     * Use: deleteLineItemsForObject
     * 
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteLineitem($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'saveOrphans'   => true,

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} Check ID & Delete :)
        $id = (int)$id;
        if (!empty($id) && $id > 0) {
            
            // delete orphans?
            if ($saveOrphans === false){


            }

            return zeroBSCRM_db2_deleteGeneric($id,'lineitems');

        }

        return false;

    }


     /**
     * deletes all lineitem objects assigned to another obj (quote,inv,trans)
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteLineItemsForObject($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'objID'            => -1,
            'objType'           => -1

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} Check ID & Delete :)
        $objID = (int)$objID;
        if (!empty($objID) && $objID > 0 && !empty($objType) && $objType > 0) {
            
            $lineItems = $this->getLineitems(array('associatedObjType'=>$objType,'associatedObjID'=>$objID,'perPage'=>1000,'ignoreowner'=>true));

            $delcount = 0;
            if (is_array($lineItems)) foreach ($lineItems as $li){

                $delcount += $this->deleteLineitem(array('id'=>$li['id']));

                // also delete the objlink for this
                $this->DAL()->deleteObjLinks(array(
                        'objtypefrom'       => ZBS_TYPE_LINEITEM,
                        'objtypeto'         => $objType,
                        'objfromid'         => $li['id'],
                        'objtoid'           => $objID
                    ));

            }

            return $delcount;

        }

        return false;

    }


    /**
     * tidy's the object from wp db into clean array
     *
     * @param array $obj (DB obj)
     *
     * @return array lineitem (clean obj)
     */
    private function tidy_lineitem($obj=false,$withCustomFields=false){

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

            
            $res['order'] = (int)$obj->zbsli_order;
            $res['title'] = $this->stripSlashes($obj->zbsli_title);
            $res['desc'] = $this->stripSlashes($obj->zbsli_desc);
            $res['quantity'] = zeroBSCRM_format_quantity( $this->stripSlashes( $obj->zbsli_quantity ) );
            $res['price'] = $this->stripSlashes($obj->zbsli_price);
            $res['currency'] = $this->stripSlashes($obj->zbsli_currency);
            $res['net'] = $this->stripSlashes($obj->zbsli_net);
            $res['discount'] = $this->stripSlashes($obj->zbsli_discount);
            $res['fee'] = $this->stripSlashes($obj->zbsli_fee);
            $res['shipping'] = $this->stripSlashes($obj->zbsli_shipping);
            $res['shipping_taxes'] = $this->stripSlashes($obj->zbsli_shipping_taxes);
            $res['shipping_tax'] = $this->stripSlashes($obj->zbsli_shipping_tax);
            $res['taxes'] = $this->stripSlashes($obj->zbsli_taxes);
            $res['tax'] = $this->stripSlashes($obj->zbsli_tax);
            $res['total'] = $this->stripSlashes($obj->zbsli_total);
            $res['created'] = (int)$obj->zbsli_created;
            $res['created_date'] = (isset($obj->zbsli_created) && $obj->zbsli_created > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbsli_created) : false;
            $res['lastupdated'] = (int)$obj->zbsli_lastupdated;
            $res['lastupdated_date'] = (isset($obj->zbsli_lastupdated) && $obj->zbsli_lastupdated > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbsli_lastupdated) : false;


        } 

        return $res;

    }


    /**
     * Takes whatever lineitem data available and re-calculates net, total, tax etc. 
     * .. returning same obj with updated vals
     *
     * @param array $lineItem
     *
     * @return array $lineItem
     */
    public function recalculate($lineItem=false){

        if (is_array($lineItem)){

            // subtotal (zbsi_net)
            // == line item Quantity * rate * tax%
            $subTotal = 0.0; $tax = 0.0; $total = 0.0;

                // calc?
                if (isset($lineItem) && is_array($lineItem)){
                    
                    // Subtotal
                    if (isset($lineItem['quantity']) && isset($lineItem['price'])){

                        $quantity = (float)$lineItem['quantity'];
                        $price = (float)$lineItem['price'];

                        // Discount? (applied to gross)
                        // ALWAYS gross 0.00 value for lineitems (Where as at invoice level can be %)
                        $discount = 0; if (isset($lineItem['discount'])) $discount = (float)$lineItem['discount'];
                        
                        // gross
                        $subTotalPreDiscount = $quantity*$price;
                        $subTotal = $subTotalPreDiscount-$discount;

                        // lineitems can store these, but we're not using them in v3.0 mvp (invs have their own global level for these)
                        // currency
                        // shipping

                        // tax - this should be logged against line item, but lets recalc
                        if (isset($lineItem['taxes'])) $tax = zeroBSCRM_taxRates_getTaxValue($subTotal,$lineItem['taxes']);

                        // total would have discount, shipping, but as above, not using per line item as at v3.0 mvp
                        $total = $subTotal + $tax;


                    }
            

                }

            // set it
            $lineItem['net'] = $subTotalPreDiscount;
            $lineItem['tax'] = $tax;
            $lineItem['total'] = $total;

            return $lineItem;

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
    private function db_ready_lineitem($obj=false){

        // use the generic? (override here if necessary)
        return $this->db_ready_obj($obj);

    }

    // ===========  /   LINEITEM  =======================================================
    // ===============================================================================
    

} // / class
