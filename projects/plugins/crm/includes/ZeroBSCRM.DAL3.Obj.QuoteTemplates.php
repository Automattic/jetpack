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
* ZBS DAL >> Quote Templates
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_quotetemplates extends zbsDAL_ObjectLayer {

	protected $objectType = ZBS_TYPE_QUOTETEMPLATE;
    protected $objectDBPrefix = 'zbsqt_';
	protected $objectModel = array(

		// ID
		'ID' => array('fieldname' => 'ID', 'format' => 'int'),

		// site + team generics
		'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
		'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
		'zbs_owner' => array('fieldname' => 'zbs_owner', 'format' => 'int'),

		// other fields
	    'title' => array(
            'fieldname' => 'zbsqt_title',
            'format' => 'str',
            'max_len' => 255
        ),
	    'value' => array('fieldname' => 'zbsqt_value', 'format' => 'decimal'),
	    'date_str' => array('fieldname' => 'zbsqt_date_str', 'format' => 'str'),
	    'date' => array('fieldname' => 'zbsqt_date', 'format' => 'uts'),
	    'content' => array('fieldname' => 'zbsqt_content', 'format' => 'str'),
	    'notes' => array('fieldname' => 'zbsqt_notes', 'format' => 'str'),
	    'currency' => array(
            'fieldname' => 'zbsqt_currency',
            'format' => 'curr',
            'max_len' => 4
        ),
	    'created' => array('fieldname' => 'zbsqt_created', 'format' => 'uts'),
	    'lastupdated' => array('fieldname' => 'zbsqt_lastupdated', 'format' => 'uts'),
		
		);


	function __construct($args=array()) {


		#} =========== LOAD ARGS ==============
		$defaultArgs = array(

			//'tag' => false,

		); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
		#} =========== / LOAD ARGS =============


	}
  // ===============================================================================
    // ===========   QUOTETEMPLATE  =======================================================

    // generic get Company (by ID)
    // Super simplistic wrapper used by edit page etc. (generically called via dal->contacts->getSingle etc.)
    public function getSingle($ID=-1){

        return $this->getQuotetemplate($ID);

    }
    
    /**
     * returns full quotetemplate line +- details
     *
     * @param int id        quotetemplate id
     * @param array $args   Associative array of arguments
     *
     * @return array quotetemplate object
     */
    public function getQuotetemplate($id=-1,$args=array()){

        global $zbs;

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            // with what?
            'withOwner'         => false,

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTETEMPLATE), // this'll let you not-check the owner of obj

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

                $selector = 'quotetemplate.*';
                if (isset($fields) && is_array($fields)) {
                    $selector = '';

                    // always needs id, so add if not present
                    if (!in_array('ID',$fields)) $selector = 'quotetemplate.ID';

                    foreach ($fields as $f) {
                        if (!empty($selector)) $selector .= ',';
                        $selector .= 'quotetemplate.'.$f;
                    }
                } else if ($onlyID){
                    $selector = 'quotetemplate.ID';
                }

            #} ============ / PRE-QUERY ===========


            #} Build query
            $query = "SELECT ".$selector.$extraSelect." FROM ".$ZBSCRM_t['quotetemplates'].' as quotetemplate';
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
            $ownQ = $this->ownershipSQL($ignoreowner,'quotetemplate'); if (!empty($ownQ)) $additionalWhere = $this->spaceAnd($additionalWhere).$ownQ; // adds str to query
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
                        $res = $this->tidy_quotetemplate($potentialRes,false);
                    }

                    /*if ($withTags){

                        // add all tags lines
                        $res['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_QUOTETEMPLATE,'objid'=>$potentialRes->ID));
                    
                    }*/

                    return $res;

            }

        } // / if ID

        return false;

    }

    /**
     * returns quotetemplate detail lines
     *
     * @param array $args Associative array of arguments
     *
     * @return array of quotetemplate lines
     */
    public function getQuotetemplates($args=array()){

        global $zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'searchPhrase'  => '', // searches which fields?
            'inArr'             => false,
            //'isTagged'          => false, // 1x INT OR array(1,2,3)
            //'isNotTagged'       => false, // 1x INT OR array(1,2,3)
            'ownedBy'           => false,
            'olderThan'         => false, // uts
            'newerThan'         => false, // uts
            //'hasStatus'         => false, // Lead (this takes over from the quick filter post 19/6/18)
            //'otherStatus'       => false, // status other than 'Lead'

            // returns
            'count'             => false,
            'withOwner'         => false,
            'checkDefaults'     => false, // if true returns 'default' value too (is one of our defaults)

            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0, // this is what page it is (gets * by for limit)
            'perPage'       => 100,
            'whereCase'          => 'AND', // DEFAULT = AND

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTETEMPLATE), // this'll let you not-check the owner of obj - GLOBAL FOR NOW


        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        global $ZBSCRM_t,$wpdb,$zbs;  
        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array(); $joinQ = ''; $extraSelect = '';

        #} ============= PRE-QUERY ============

            #} Capitalise this
            $sortOrder = strtoupper($sortOrder);

            #} If just count, turn off any extra gumpf
            if ($count) {
                $withOwner = false;
            }

        #} ============ / PRE-QUERY ===========

        #} Build query
        $query = "SELECT quotetemplate.*".$extraSelect." FROM ".$ZBSCRM_t['quotetemplates'].' as quotetemplate'.$joinQ;

        #} Count override
        if ($count) $query = "SELECT COUNT(quotetemplate.ID) FROM ".$ZBSCRM_t['quotetemplates'].' as quotetemplate'.$joinQ;

        #} ============= WHERE ================

            #} Add Search phrase
            if (!empty($searchPhrase)){

                // search? - ALL THESE COLS should probs have index of FULLTEXT in db?
                $searchWheres = array();
                $searchWheres['search_title'] = array('zbsqt_title','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_content'] = array('zbsqt_content','LIKE','%s','%'.$searchPhrase.'%');

                // This generates a query like 'zbsqt_fname LIKE %s OR zbsqt_lname LIKE %s', 
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

            // quick addition for mike
            #} olderThan
            if (!empty($olderThan) && $olderThan > 0 && $olderThan !== false) $wheres['olderThan'] = array('zbsqt_created','<=','%d',$olderThan);
            #} newerThan
            if (!empty($newerThan) && $newerThan > 0 && $newerThan !== false) $wheres['newerThan'] = array('zbsqt_created','>=','%d',$newerThan);

            // status
            //if (!empty($hasStatus) && $hasStatus !== false) $wheres['hasStatus'] = array('XXXX_status','=','%s',$hasStatus);
            //if (!empty($otherStatus) && $otherStatus !== false) $wheres['otherStatus'] = array('XXXX_status','<>','%s',$otherStatus);

            #} Any additionalWhereArr?
            if (isset($additionalWhereArr) && is_array($additionalWhereArr) && count($additionalWhereArr) > 0){

                // add em onto wheres (note these will OVERRIDE if using a key used above)
                // Needs to be multi-dimensional $wheres = array_merge($wheres,$additionalWhereArr);
                $wheres = array_merge_recursive($wheres,$additionalWhereArr);

            }

            #} Is Tagged (expects 1 tag ID OR array)
            /*
                // catch 1 item arr
                if (is_array($isTagged) && count($isTagged) == 1) $isTagged = $isTagged[0];

            if (!is_array($isTagged) && !empty($isTagged) && $isTagged > 0){

                // add where tagged                 
                // 1 int: 
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = quotetemplate.ID AND zbstl_tagid = %d) > 0)',array(ZBS_TYPE_QUOTETEMPLATE,$isTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = quotetemplate.ID AND zbstl_tagid IN (%s)) > 0)',array(ZBS_TYPE_QUOTETEMPLATE,$tagStr));

                }

            }
            #} Is NOT Tagged (expects 1 tag ID OR array)

                // catch 1 item arr
                if (is_array($isNotTagged) && count($isNotTagged) == 1) $isNotTagged = $isNotTagged[0];
                
            if (!is_array($isNotTagged) && !empty($isNotTagged) && $isNotTagged > 0){

                // add where tagged                 
                // 1 int: 
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = quotetemplate.ID AND zbstl_tagid = %d) = 0)',array(ZBS_TYPE_QUOTETEMPLATE,$isNotTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = quotetemplate.ID AND zbstl_tagid IN (%s)) = 0)',array(ZBS_TYPE_QUOTETEMPLATE,$tagStr));

                }

            } */

        

        #} ============ / WHERE ===============

        #} CHECK this + reset to default if faulty
        if (!in_array($whereCase,array('AND','OR'))) $whereCase = 'AND';

        #} Build out any WHERE clauses
        $wheresArr = $this->buildWheres($wheres,$whereStr,$params,$whereCase);
        $whereStr = $wheresArr['where']; $params = $params + $wheresArr['params'];
        #} / Build WHERE

        #} Ownership v1.0 - the following adds SITE + TEAM checks, and (optionally), owner
        $params = array_merge($params,$this->ownershipQueryVars($ignoreowner)); // merges in any req.
        $ownQ = $this->ownershipSQL($ignoreowner,'quotetemplate'); if (!empty($ownQ)) $additionalWhere = $this->spaceAnd($additionalWhere).$ownQ; // adds str to query
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
                    $resArr = $this->tidy_quotetemplate($resDataLine); //withCustomFields

                    // here we also grab this meta to see if is default
                    if ($checkDefaults) $resArr['default'] = $this->DAL()->meta(ZBS_TYPE_QUOTETEMPLATE,$resDataLine->ID,'zbsdefault',false);

                    /*if ($withTags){

                        // add all tags lines
                        $resArr['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_QUOTETEMPLATE,'objid'=>$resDataLine->ID));

                    }*/

                    $res[] = $resArr;

            }
        }

        return $res;
    } 



    /**
     * Returns a count of contacts (owned)
     * Replaces zeroBS_customerCount AND zeroBS_getCustomerCount AND zeroBS_customerCountByStatus
     *
     *
     * @return int count
     */
    public function getQuotetemplateCount($args=array()){

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTETEMPLATE), // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $whereArr = array();

        //if ($withStatus !== false && !empty($withStatus)) $whereArr['status'] = array('zbsqt_status','=','%s',$withStatus);

        return $this->DAL()->getFieldByWHERE(array(
            'objtype' => ZBS_TYPE_QUOTETEMPLATE,
            'colname' => 'COUNT(ID)',
            'where' => $whereArr,
            'ignoreowner' => $ignoreowner));

    

        return 0;
        
    }
    
     /**
     * adds or updates a quotetemplate object
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateQuotetemplate($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;
            
        #} Retrieve any cf
        //$customFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_QUOTETEMPLATE));

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'owner'         => -1,

            // fields (directly)
            'data'          => array(

                'title' => '',
                'value' => '',
                'date_str' => '',
                'date' => '',
                'content' => '',
                'notes' => '',
                'currency' => '',

                // Note Custom fields may be passed here, but will not have defaults so check isset()

                // allow this to be set for MS sync etc.
                'created' => -1,
                'lastupdated' => '',

            ),

            'limitedFields' => -1, // if this is set it OVERRIDES data (allowing you to set specific fields + leave rest in tact)
            // ^^ will look like: array(array('key'=>x,'val'=>y,'type'=>'%s'))

            // this function as DAL1 func did. 
            'extraMeta'     => -1,
            'automatorPassthrough' => -1,
            'fallBackLog' => -1,

            'silentInsert' => false, // this was for init Migration - it KILLS all IA for newQuotetemplate (because is migrating, not creating new :) this was -1 before

            'do_not_update_blanks' => false // this allows you to not update fields if blank (same as fieldoverride for extsource -> in)

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
                        $dbData = $this->db_ready_quotetemplate($data); 
                        //unset($dbData['id']); // this is unset because we use $id, and is update, so not req. legacy issue
                        //unset($dbData['created']); // this is unset because this uses an obj which has been 'updated' against original details, where created is output in the WRONG format :)

                        $origData = $data; //$data = array();               
                        $limitedData = array(); // array(array('key'=>'zbsqt_x','val'=>y,'type'=>'%s'))

                        // cycle through + translate into limitedFields (removing any blanks, or arrays (e.g. externalSources))
                        // we also have to remake a 'faux' data (removing blanks for tags etc.) for the post-update updates
                        foreach ($dbData as $k => $v){

                            $intV = (int)$v;

                            // only add if valuenot empty
                            if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){

                                // add to update arr
                                $limitedData[] = array(
                                    'key' => 'zbsqt_'.$k, // we have to add zbsqt_ here because translating from data -> limited fields
                                    'val' => $v,
                                    'type' => $this->getTypeStr('zbsqt_'.$k)
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
                if (!isset($dataArr['zbsqt_lastupdated'])){ $dataArr['zbsqt_lastupdated'] = time(); $typeArr[] = '%d'; }

            } else {

                // FULL UPDATE/INSERT

                    // UPDATE
                    $dataArr = array( 

                                // ownership
                                // no need to update these (as of yet) - can't move teams etc.
                                //'zbs_site' => zeroBSCRM_installSite(),
                                //'zbs_team' => zeroBSCRM_installTeam(),
                                //'zbs_owner' => $owner,

                        
                                'zbsqt_title' => $data['title'],
                                'zbsqt_value' => $data['value'],
                                'zbsqt_date_str' => $data['date_str'],
                                'zbsqt_date' => $data['date'],
                                'zbsqt_content' => $data['content'],
                                'zbsqt_notes' => $data['notes'],
                                'zbsqt_currency' => $data['currency'],
                                'zbsqt_lastupdated' => time(),

                            );

                    $typeArr = array( // field data types
                                //'%d',  // site
                                //'%d',  // team
                                //'%d',  // owner

                        
                                '%s',
                                '%s',
                                '%s',
                                '%d',
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
                        $dataArr['zbsqt_created'] = $data['created'];$typeArr[] = '%d';
                    } else {
                        $dataArr['zbsqt_created'] = time();          $typeArr[] = '%d';
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
                        $ZBSCRM_t['quotetemplates'], 
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
                            	/*
                                // tag work?
                                if (isset($data['tags']) && is_array($data['tags'])) $this->addUpdateQuotetemplateTags(array('id'=>$id,'tagIDs'=>$data['tags']));

                                // Custom fields?

                                    #} Cycle through + add/update if set
                                    if (is_array($customFields)) foreach ($customFields as $cK => $cF){

                                        // any?
                                        if (isset($data[$cK])){

                                            // add update
                                            $cfID = $this->DAL()->addUpdateCustomField(array(
                                                'data'  => array(
                                                        'objtype'   => ZBS_TYPE_QUOTETEMPLATE,
                                                        'objid'     => $id,
                                                        'objkey'    => $cK,
                                                        'objval'    => $data[$cK]
                                                )));

                                        }

                                    }

                                // / Custom Fields

                                */

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
                                    $this->DAL()->updateMeta(ZBS_TYPE_QUOTETEMPLATE,$id,'extra_'.$cleanKey,$v);

                                    #} Add it to this, which passes to IA
                                    $confirmedExtraMeta[$cleanKey] = $v;

                                }

                            }


                            #} INTERNAL AUTOMATOR 
                            #} & 
                            #} FALLBACKS
                            // UPDATING CONTACT
                            if (!$silentInsert){

                                // IA General quotetemplate update (2.87+)
                                zeroBSCRM_FireInternalAutomator('quotetemplate.update',array(
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
                        $ZBSCRM_t['quotetemplates'], 
                        $dataArr, 
                        $typeArr ) > 0){

                    #} Successfully inserted, lets return new ID
                    $newID = $wpdb->insert_id;

                /*
                    // tag work?
                    if (isset($data['tags']) && is_array($data['tags'])) $this->addUpdateQuotetemplateTags(array('id'=>$newID,'tagIDs'=>$data['tags']));

                    // Custom fields?

                        #} Cycle through + add/update if set
                        if (is_array($customFields)) foreach ($customFields as $cK => $cF){

                            // any?
                            if (isset($data[$cK])){

                                // add update
                                $cfID = $this->DAL()->addUpdateCustomField(array(
                                    'data'  => array(
                                            'objtype'   => ZBS_TYPE_QUOTETEMPLATE,
                                            'objid'     => $newID,
                                            'objkey'    => $cK,
                                            'objval'    => $data[$cK]
                                    )));

                            }

                        }

                    // / Custom Fields

                    */

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
                            $this->DAL()->updateMeta(ZBS_TYPE_QUOTETEMPLATE,$id,'extra_'.$cleanKey,$v);

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
                        zeroBSCRM_FireInternalAutomator('quotetemplate.new',array(
                            'id'=>$newID,
                            'data'=>$dataArr,
                            //'extsource'=>array(),
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
     * adds or updates a quotetemplate's tags
     * ... this is really just a wrapper for addUpdateObjectTags
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    /*
    public function addUpdateQuotetemplateTags($args=array()){

        global $ZBSCRM_t,$wpdb;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,

            // EITHER of the following:
            'tagIDs'        => -1,
            'tags'          => -1,

            'mode'          => 'append'

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} ========== CHECK FIELDS ============

            // check id
            $id = (int)$id; if (empty($id) || $id <= 0) return false;

        #} ========= / CHECK FIELDS ===========     

        return $this->DAL()->addUpdateObjectTags(array(
                'objtype'   =>ZBS_TYPE_QUOTETEMPLATE,
                'objid'     =>$id,
                'tags'      =>$tags,
                'tagIDs'    =>$tagIDs,
                'mode'      =>$mode));

    } */



     /**
     * deletes a quotetemplate object
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteQuotetemplate($args=array()){

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


            }

            return zeroBSCRM_db2_deleteGeneric($id,'quotetemplates');

        }

        return false;

    }

    /**
     * tidy's the object from wp db into clean array
     *
     * @param array $obj (DB obj)
     *
     * @return array quotetemplate (clean obj)
     */
    private function tidy_quotetemplate($obj=false,$withCustomFields=false){

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


            $res['title'] = $this->stripSlashes($obj->zbsqt_title);
            $res['value'] = $this->stripSlashes($obj->zbsqt_value);
            $res['date_str'] = $this->stripSlashes($obj->zbsqt_date_str);
            $res['date'] = (int)$obj->zbsqt_date;
            $res['date_date'] = (isset($obj->zbsqt_date) && $obj->zbsqt_date > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbsqt_date) : false;
            $res['content'] = $this->stripSlashes($obj->zbsqt_content);
            $res['notes'] = $this->stripSlashes($obj->zbsqt_notes);
            $res['currency'] = $this->stripSlashes($obj->zbsqt_currency);
            $res['created'] = (int)$obj->zbsqt_created;
            $res['created_date'] = (isset($obj->zbsqt_created) && $obj->zbsqt_created > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbsqt_created) : false;
            $res['lastupdated'] = (int)$obj->zbsqt_lastupdated;
            $res['lastupdated_date'] = (isset($obj->zbsqt_lastupdated) && $obj->zbsqt_lastupdated > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbsqt_lastupdated) : false;

            // custom fields - tidy any that are present:
            if ($withCustomFields) $res = $this->tidyAddCustomFields(ZBS_TYPE_QUOTETEMPLATE,$obj,$res,false);

        } 


        return $res;


    }


    /**
     * Wrapper, use $this->getQuotetemplateMeta($contactID,$key) for easy retrieval of singular quotetemplate
     * Simplifies $this->getMeta
     *
     * @param int objtype
     * @param int objid
     * @param string key
     *
     * @return array quotetemplate meta result
     */
    public function getQuotetemplateMeta($id=-1,$key='',$default=false){

        global $zbs;

        if (!empty($key)){

            return $this->DAL()->getMeta(array(

                'objtype' => ZBS_TYPE_QUOTETEMPLATE,
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
     * Returns an ownerid against a quotetemplate
     * Replaces zeroBS_getCustomerOwner
     *
     * @param int id quotetemplate ID
     *
     * @return int quotetemplate owner id
     */
    public function getQuotetemplateOwner($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_QUOTETEMPLATE,
                'colname' => 'zbs_owner',
                'ignoreowner'=>true));

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
    private function db_ready_quotetemplate($obj=false){

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
    public function listViewObj($quotetemplate=false,$columnsRequired=array()){

        if (is_array($quotetemplate) && isset($quotetemplate['id'])){

            $resArr = $quotetemplate;
            
            return $resArr;

        }

        return false;

    }

    // ===========  /   QUOTETEMPLATE  =======================================================
    // ===============================================================================
    
}