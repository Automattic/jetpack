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
* ZBS DAL >> Events (tasks)
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_events extends zbsDAL_ObjectLayer {

    protected $objectType = ZBS_TYPE_TASK;
    protected $objectDBPrefix = 'zbse_';
    protected $include_in_templating = true;
    protected $objectModel = array(

        // ID
        'ID' => array('fieldname' => 'ID', 'format' => 'int'),

        // site + team generics
        'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
        'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
        'zbs_owner' => array('fieldname' => 'zbs_owner', 'format' => 'int'),

        // other fields
        'title' => array(
                        'fieldname' => 'zbse_title',
                        'format' => 'str',
                        'max_len' => 255
                        ),
        'desc' => array(
                            'fieldname' => 'zbse_desc',
                            'format' => 'str',
                            'dal1key' => 'notes',
                            // max_len = LONGTEXT, unlikely to breach
                        ),
        'start' => array(
                            'fieldname' => 'zbse_start',
                            'format' => 'uts',
                            'dal1key' => 'from'
                        ),
        'end' => array(
                            'fieldname' => 'zbse_end',
                            'format' => 'uts',
                            'dal1key' => 'to'
                        ),
        'complete' => array('fieldname' => 'zbse_complete', 'format' => 'bool'),
        'show_on_portal' => array('fieldname' => 'zbse_show_on_portal', 'format' => 'bool'),
        'show_on_cal' => array('fieldname' => 'zbse_show_on_cal', 'format' => 'bool'),
        'created' => array('fieldname' => 'zbse_created', 'format' => 'uts'),
        'lastupdated' => array('fieldname' => 'zbse_lastupdated', 'format' => 'uts')

    );


    function __construct($args=array()) {


        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            //'tag' => false,

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============


    }


    // ===============================================================================
    // ===========   EVENT  =======================================================

    // generic get Company (by ID)
    // Super simplistic wrapper used by edit page etc. (generically called via dal->contacts->getSingle etc.)
    public function getSingle($ID=-1){

        return $this->getEvent($ID);

    }

    // generic get (by ID list)
    // Super simplistic wrapper used by MVP Export v3.0
    public function getIDList($IDs=false){

        return $this->getEvents(array(
            'inArr'             => $IDs,
            'page'          => -1,
            'perPage'       => -1
        ));

    }
    
    // generic get (EVERYTHING)
    // expect heavy load!
    public function getAll($IDs=false){

        return $this->getEvents(array(
            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    // generic get count of (EVERYTHING)
    public function getFullCount(){

        return $this->getEvents(array(
            'count'  => true,
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    /**
     * returns full event line +- details
     *
     * @param int id        event id
     * @param array $args   Associative array of arguments
     *
     * @return array event object
     */
    public function getEvent($id=-1,$args=array()){

        global $zbs;

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            // if theset wo passed, will search based on these 
            'externalSource'    => false,
            'externalSourceUID' => false,

            // with what?
            'withReminders'     => true,
            'withCustomFields'  => true,
            'withTags'          => true,
            'withAssigned'      => true, // return ['contact'] & ['company'] objs if has link

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TASK), // this'll let you not-check the owner of obj

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
                    $custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_TASK));

                    #} Cycle through + build into query
                    if (is_array($custFields)) foreach ($custFields as $cK => $cF){

                        // add as subquery
                        $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = event.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) '".$cK."'";
                        
                        // add params
                        $params[] = $cK; $params[] = ZBS_TYPE_TASK;

                    }

                }

                $selector = 'event.*';
                if (isset($fields) && is_array($fields)) {
                    $selector = '';

                    // always needs id, so add if not present
                    if (!in_array('ID',$fields)) $selector = 'event.ID';

                    foreach ($fields as $f) {
                        if (!empty($selector)) $selector .= ',';
                        $selector .= 'event.'.$f;
                    }
                } else if ($onlyID){
                    $selector = 'event.ID';
                }

            #} ============ / PRE-QUERY ===========


            #} Build query
            $query = "SELECT ".$selector.$extraSelect." FROM ".$ZBSCRM_t['events'].' as event';
            #} ============= WHERE ================

                if (!empty($id) && $id > 0){

                    #} Add ID
                    $wheres['ID'] = array('ID','=','%d',$id);

                }
                
                if (!empty($externalSource) && !empty($externalSourceUID)){

                    $wheres['extsourcecheck'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_TASK." AND zbss_source = %s AND zbss_uid = %s)",array($externalSource,$externalSourceUID));

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
                        $res = $this->tidy_event($potentialRes,$withCustomFields);
                    }


                    if ($withReminders){

                        // add all event reminder lines
                        $res['reminders'] = $this->DAL()->eventreminders->getEventreminders(array('eventID'=>$potentialRes->ID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TASK)));
                    
                    }

                    if ($withTags){

                        // add all tags lines
                        $res['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_TASK,'objid'=>$potentialRes->ID));
                    
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
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TASK,
                                'hasObjIDLinkedTo'=>$potentialRes->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $res['company'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TASK,
                                'hasObjIDLinkedTo'=>$potentialRes->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                    
                    }

                    return $res;

            }

        } // / if ID

        return false;

    }

    /**
     * returns event detail lines
     *
     * @param array $args Associative array of arguments
     *
     * @return array of event lines
     */
    public function getEvents($args=array()){

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
            'olderThan'         => false, // uts (on CREATED)
            'newerThan'         => false, // uts (on CREATED)
            'assignedContact'   => false, // assigned to contact id (int)
            'assignedCompany'   => false, // assigned to company id (int)
            'isComplete'        => false, // if true, only returns completed
            'isIncomplete'      => false, // if true, only returns tasks which are not completed

            // dated
            'datedBefore'         => false, // uts (on date start)
            'datedAfter'         => false, // uts (on date start)

            // reminder checks (use either, not both)
            'hasReminder'       => 0, // (if set as bool) (has any state of reminder attached)
            'hasUnsentReminder' => 0, // (if set as bool) (has reminder attached which has not been sent)

            // returns
            'count'             => false,
            'withReminders'     => true,
            'withCustomFields'  => true,
            'withTags'          => false,
            'withAssigned'      => false, // return ['contact'] & ['company'] objs if has link
            'withOwner'         => false,
            'onlyColumns'       => false, // if passed (array('fname','lname')) will return only those columns (overwrites some other 'return' options). NOTE: only works for base fields (not custom fields)

            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0, // this is what page it is (gets * by for limit)
            'perPage'       => 100,
            'whereCase'          => 'AND', // DEFAULT = AND

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TASK), // this'll let you not-check the owner of obj


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
                $withAssigned = false;
                $withOwner = false;
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
                    $withAssigned = false;
                    $withOwner = false;

                } else {

                    // deny
                    $onlyColumns = false;

                }


            }

            #} Custom Fields
            if ($withCustomFields){
                
                #} Retrieve any cf
                $custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_TASK));

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
                    $extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = event.ID AND zbscf_objkey = %s AND zbscf_objtype = %d) ".$cKey;
                    
                    // add params
                    $params[] = $cK; $params[] = ZBS_TYPE_TASK;

                }

            }

        #} ============ / PRE-QUERY ===========

        #} Build query
        $query = "SELECT event.*".$extraSelect." FROM ".$ZBSCRM_t['events'].' as event'.$joinQ;

        #} Count override
        if ($count) $query = "SELECT COUNT(event.ID) FROM ".$ZBSCRM_t['events'].' as event'.$joinQ;

        #} onlyColumns override
        if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

            $columnStr = '';
            foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                if (!empty($columnStr)) $columnStr .= ',';
                // this presumes str is db-safe? could do with sanitation?
                $columnStr .= $colDBKey;

            }

            $query = "SELECT ".$columnStr." FROM ".$ZBSCRM_t['events'].' as event'.$joinQ;

        }
        
        #} ============= WHERE ================

            #} Add Search phrase
            if (!empty($searchPhrase)){

                // search? - ALL THESE COLS should probs have index of FULLTEXT in db?
                $searchWheres = array();
                $searchWheres['search_title'] = array('zbse_title','LIKE','%s','%'.$searchPhrase.'%');
                $searchWheres['search_desc'] = array('zbse_desc','LIKE','%s','%'.$searchPhrase.'%');

                // 3.0.13 - Added ability to search custom fields (optionally)
                $customFieldSearch = zeroBSCRM_getSetting('customfieldsearch');
                if ($customFieldSearch == 1){
                
                    // simplistic add
                    // NOTE: This IGNORES ownership of custom field lines.
                    $searchWheres['search_customfields'] = array('ID','IN',"(SELECT zbscf_objid FROM ".$ZBSCRM_t['customfields']." WHERE zbscf_objval LIKE %s AND zbscf_objtype = ".ZBS_TYPE_TASK.")",'%'.$searchPhrase.'%');

                }

                // This generates a query like 'zbse_fname LIKE %s OR zbse_lname LIKE %s', 
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
                $wheres['externalsource'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_TASK." AND zbss_source = %s)",$externalSource);

            }

            // quick addition for mike
            #} olderThan
            if (!empty($olderThan) && $olderThan > 0 && $olderThan !== false) $wheres['olderThan'] = array('zbse_created','<=','%d',$olderThan);
            #} newerThan
            if (!empty($newerThan) && $newerThan > 0 && $newerThan !== false) $wheres['newerThan'] = array('zbse_created','>=','%d',$newerThan);
            #} datedBefore
            if (!empty($datedBefore) && $datedBefore > 0 && $datedBefore !== false) $wheres['datedBefore'] = array('zbse_start','<=','%d',$datedBefore);
            #} datedAfter
            if (!empty($datedAfter) && $datedAfter > 0 && $datedAfter !== false) $wheres['datedAfter'] = array('zbse_start','>=','%d',$datedAfter);
            
            // assignedContact + assignedCompany
            if (!empty($assignedContact) && $assignedContact !== false && $assignedContact > 0) $wheres['assignedContact'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_TASK." AND zbsol_objtype_to = ".ZBS_TYPE_CONTACT." AND zbsol_objid_to = %d)",$assignedContact);
            if (!empty($assignedCompany) && $assignedCompany !== false && $assignedCompany > 0) $wheres['assignedCompany'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_TASK." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = %d)",$assignedCompany);

            // completed status
            if ( $isComplete ) $wheres['status'] = array('zbse_complete','=','1');
            if ( $isIncomplete ) $wheres['status'] = array('zbse_complete','<>','1');

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
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = event.ID AND zbstl_tagid = %d) > 0)',array(ZBS_TYPE_TASK,$isTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = event.ID AND zbstl_tagid IN (%s)) > 0)',array(ZBS_TYPE_TASK,$tagStr));

                }

            }
            #} Is NOT Tagged (expects 1 tag ID OR array)

                // catch 1 item arr
                if (is_array($isNotTagged) && count($isNotTagged) == 1) $isNotTagged = $isNotTagged[0];
                
            if (!is_array($isNotTagged) && !empty($isNotTagged) && $isNotTagged > 0){

                // add where tagged                 
                // 1 int: 
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = event.ID AND zbstl_tagid = %d) = 0)',array(ZBS_TYPE_TASK,$isNotTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = event.ID AND zbstl_tagid IN (%s)) = 0)',array(ZBS_TYPE_TASK,$tagStr));

                }

            }


            // reminders
            if ($hasReminder === true){

                // has a reminder
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['eventreminders'].' WHERE zbser_event = event.ID) > 0)',array());


            } elseif ($hasReminder === false){

                // has no reminder
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['eventreminders'].' WHERE zbser_event = event.ID) = 0)',array());


            } elseif ($hasUnsentReminder === true){

                // has an unsent reminder
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['eventreminders'].' WHERE zbser_event = event.ID AND zbser_sent = -1) > 0)',array());
            
            } elseif ($hasUnsentReminder === false){

                // has no unsent reminder
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['eventreminders'].' WHERE zbser_event = event.ID AND zbser_sent = -1) = 0)',array());
            
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
                         
                    // using onlyColumns filter?
                    if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

                        // only coumns return.
                        $resArr = array();
                        foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                            if (isset($resDataLine->$colDBKey)) $resArr[$colStr] = $resDataLine->$colDBKey;

                        }


                    } else {
                            
                        // tidy
                        $resArr = $this->tidy_event($resDataLine,$withCustomFields);

                    }

                    if ($withReminders){

                        // add all event reminder lines
                        $resArr['reminders'] = $this->DAL()->eventreminders->getEventreminders(array('eventID'=>$resDataLine->ID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TASK)));
                    
                    }

                    if ($withTags){

                        // add all tags lines
                        $resArr['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_TASK,'objid'=>$resDataLine->ID));

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
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TASK,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $resArr['company'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_TASK,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                    
                    }

                    #} With Assigned?
                    if ($withOwner){

                        $resArr['owner'] = zeroBS_getOwner( $resDataLine->ID, true, ZBS_TYPE_TASK, $resDataLine->zbs_owner );

                    }

                    $res[] = $resArr;

            }
        }

        return $res;
    } 



    /**
     * Returns a count of events (owned)
     * .. inc by status
     *
     * @return int count
     */
    public function getEventCount($args=array()){

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)

            // permissions
            'ignoreowner'   => true, // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $whereArr = array();

        return $this->DAL()->getFieldByWHERE(array(
            'objtype' => ZBS_TYPE_TASK,
            'colname' => 'COUNT(ID)',
            'where' => $whereArr,
            'ignoreowner' => $ignoreowner));
        
    }


     /**
     * adds or updates a event object
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateEvent($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;
            
        #} Retrieve any cf
        $customFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_TASK));

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'owner'         => -1,

            // fields (directly)
            'data'          => array(

                
                'title' => '',
                'desc' => '',
                'start' => '',
                'end' => '',
                'complete' => '',
                'show_on_portal' => '',
                'show_on_cal' => true,

                // obj links:
                'contacts' => false, // array of id's
                'companies' => false, // array of id's

                // reminders:
                'reminders'     => false, 
                // will be an array of eventreminder lines (as per matching eventreminder database model)
                // note:    if no change desired, pass "false"
                //          if removal of all/change, pass array

                // Note Custom fields may be passed here, but will not have defaults so check isset()

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

            'silentInsert' => false, // this was for init Migration - it KILLS all IA for newEvent (because is migrating, not creating new :) this was -1 before

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
            // (either as key zbse_source or source, for example)
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
						if ( str_starts_with( $field['key'], 'zbse_' ) ) {
							$dePrefixed = substr( $field['key'], strlen( 'zbse_' ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
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
            /*
            if (is_null($data['status']) || !isset($data['status']) || empty($data['status'])){

                // Default status for obj? -> this one gets for contacts -> $zbsCustomerMeta['status'] = zeroBSCRM_getSetting('defaultstatus');

            }
            */

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
                        $dbData = $this->db_ready_event($data); 

                        $origData = $data; //$data = array();               
                        $limitedData = array(); // array(array('key'=>'zbse_x','val'=>y,'type'=>'%s'))

                        // cycle through + translate into limitedFields (removing any blanks, or arrays (e.g. externalSources))
                        // we also have to remake a 'faux' data (removing blanks for tags etc.) for the post-update updates
                        foreach ($dbData as $k => $v){

                            $intV = (int)$v;

                            // only add if valuenot empty
                            if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){

                                // add to update arr
                                $limitedData[] = array(
                                    'key' => 'zbse_'.$k, // we have to add zbse_ here because translating from data -> limited fields
                                    'val' => $v,
                                    'type' => $this->getTypeStr('zbse_'.$k)
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
                if (!isset($dataArr['zbse_lastupdated'])){ $dataArr['zbse_lastupdated'] = time(); $typeArr[] = '%d'; }

            } else {

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

                // FULL UPDATE/INSERT

                    // UPDATE
                    $dataArr = array( 

                                // ownership
                                // no need to update these (as of yet) - can't move teams etc.
                                //'zbs_site' => zeroBSCRM_installSite(),
                                //'zbs_team' => zeroBSCRM_installTeam(),
                                //'zbs_owner' => $owner,

                        
                                'zbse_title' => $data['title'],
                                'zbse_desc' => $data['desc'],
                                'zbse_start' => $data['start'],
                                'zbse_end' => $data['end'],
                                'zbse_complete' => $data['complete'],
                                'zbse_show_on_portal' => $data['show_on_portal'],
                                'zbse_show_on_cal' => $data['show_on_cal'],
                                'zbse_lastupdated' => time(),

                            );

                    $typeArr = array( // field data types
                                //'%d',  // site
                                //'%d',  // team
                                //'%d',  // owner

                        
                                '%s',
                                '%s',
                                '%d',
                                '%d',
                                '%s',
                                '%d',
                                '%d',
                                '%d',

                            );

                if (!empty($id) && $id > 0){

                    // is update
                    $update = true;
                    
                    // events can be re-assigned
                    if (isset($owner) && !empty($owner) && $owner !== -1){

                        $dataArr['zbs_owner'] = $owner;             $typeArr[] = '%d';

                    }

                } else {

                    // INSERT (get's few extra :D)
                    $update = false;
                    $dataArr['zbs_site'] = zeroBSCRM_site();    $typeArr[] = '%d';
                    $dataArr['zbs_team'] = zeroBSCRM_team();    $typeArr[] = '%d';
                    $dataArr['zbs_owner'] = $owner;             $typeArr[] = '%d';
                    if (isset($data['created']) && !empty($data['created']) && $data['created'] !== -1){
                        $dataArr['zbse_created'] = $data['created'];$typeArr[] = '%d';
                    } else {
                        $dataArr['zbse_created'] = time();          $typeArr[] = '%d';
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
                        $ZBSCRM_t['events'], 
                        $dataArr, 
                        array( // where
                            'ID' => $id
                            ),
                        $typeArr,
                        array( // where data types
                            '%d'
                            )) !== false){

                            // defaults for IA below
                            $approvedExternalSource = ''; 
                            $againstIDs = array('contacts'=>array(),'companies'=>array());

                            // if passing limitedFields instead of data, we ignore the following
                                // this doesn't work, because data is in args default as arr
                                //if (isset($data) && is_array($data)){
                                // so...
                            if (!isset($limitedFields) || !is_array($limitedFields) || $limitedFields == -1){

                                // OBJ LINKS - to contacts/companies
                                $this->addUpdateObjectLinks($id,$data['contacts'],ZBS_TYPE_CONTACT);
                                $this->addUpdateObjectLinks($id,$data['companies'],ZBS_TYPE_COMPANY);
                                // IA also gets 'againstid' historically, but we'll pass as 'against id's'
                                $againstIDs = array('contacts'=>$data['contacts'],'companies'=>$data['companies']);

                                // Event Reminders ==== 

                                // event reminder work?
                                if (isset($data['reminders']) && is_array($data['reminders'])){

                                    // if array passed, update, even if removing 
                                    if (count($data['reminders']) > 0){

                                        // passed, for now this is BRUTAL and just clears old ones + readds
                                        // once live, discuss how to refactor to be less brutal.
                                        // for now will be fine if you LOAD reminders, edit, addUpdate, -> don't recreate them then rejam in expecting it to know how to deal with :)
                                        // (in which case reminders sent already might get resent, but that's if not following this note ^)

                                            // delete all reminders
                                            $this->DAL()->eventreminders->deleteEventRemindersForEvent(array('eventID'=>$id));

                                            // addupdate each
                                            foreach ($data['reminders'] as $reminder) {

                                                // no point in this: 
                                                // slight rejig of passed so works cleanly with data array style                                            
                                                //$reminderID = false; if (isset($reminder['ID'])) $reminderID = $reminder['ID'];
                                                $reminderID = false; 

                                                // if 'event' isn't set, add this event id
                                                // actually hard set. if (!isset($reminder['event'])) 
                                                $reminder['event'] = $id;

                                                $this->DAL()->eventreminders->addUpdateEventreminder(array('id'=>$reminderID,'data'=>$reminder));

                                            }

                                    } else {

                                        // delete all reminders
                                        $this->DAL()->eventreminders->deleteEventRemindersForEvent(array('eventID'=>$id));

                                    }


                                }

                                // / Event Reminders ==== 

                                // tags
                                if (isset($data['tags']) && is_array($data['tags'])) {

                                    $this->addUpdateEventTags(
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
                                        'obj_type_id'      => ZBS_TYPE_TASK,
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
                                                        'objtype'   => ZBS_TYPE_TASK,
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
                                    $this->DAL()->updateMeta(ZBS_TYPE_TASK,$id,'extra_'.$cleanKey,$v);

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
                                //if (isset($_POST['zbse_status_dirtyflag']) && $_POST['zbse_status_dirtyflag'] == "1"){
                                // actually here, it's set above
                                /* WH not sure if used for this obj:
                                if (isset($statusChange) && is_array($statusChange)){

                                    // status has changed

                                    // IA
                                    zeroBSCRM_FireInternalAutomator('event.status.update',array(
                                        'id'=>$id,
                                        'againstid' => $id,
                                        'userMeta'=> $dataArr,
                                        'from' => $statusChange['from'],
                                        'to' => $statusChange['to']
                                        ));

                                } */

                                //
                                $eventCustomerID = -1; if (isset($zbsEventMeta['customer'])) $eventCustomerID = $zbsEventMeta['customer'];

                                // IA General event update (2.87+)
                                zeroBSCRM_FireInternalAutomator('event.update',array(
                                        'id'=>$id,
                                        'data'=>$data,
                                        'extsource'=>$approvedExternalSource,
                                        'againstids'=>$againstIDs,
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
                        $ZBSCRM_t['events'], 
                        $dataArr, 
                        $typeArr ) > 0){

                    #} Successfully inserted, lets return new ID
                    $newID = $wpdb->insert_id;

                    // defaults for IA below
                    $approvedExternalSource = ''; 
                    $againstIDs = array('contacts'=>array(),'companies'=>array());

                    // Event Reminders ==== 

                    // event reminder work?
                    if (isset($data['reminders']) && is_array($data['reminders'])){

                        // if array passed, update, even if removing 
                        if (count($data['reminders']) > 0){

                            // passed, for now this is BRUTAL and just clears old ones + readds
                            // once live, discuss how to refactor to be less brutal.
                            // for now will be fine if you LOAD reminders, edit, addUpdate, -> don't recreate them then rejam in expecting it to know how to deal with :)
                            // (in which case reminders sent already might get resent, but that's if not following this note ^)

                                // delete all reminders
                                $this->DAL()->eventreminders->deleteEventRemindersForEvent(array('eventID'=>$newID));

                                // addupdate each
                                foreach ($data['reminders'] as $reminder) {

                                    // no point in this: 
                                    // slight rejig of passed so works cleanly with data array style                                            
                                    //$reminderID = false; if (isset($reminder['ID'])) $reminderID = $reminder['ID'];
                                    $reminderID = false; 

                                    // if 'event' isn't set, add this event id
                                    // actually hard set.. if (!isset($reminder['event'])) 
                                    $reminder['event'] = $newID;

                                    $this->DAL()->eventreminders->addUpdateEventreminder(array('id'=>$reminderID,'data'=>$reminder));

                                }

                        } else {

                            // delete all reminders
                            $this->DAL()->eventreminders->deleteEventRemindersForEvent(array('eventID'=>$newID));

                        }


                    }

                    // / Event Reminders ====  

                    // OBJ LINKS - to contacts/companies
                    $this->addUpdateObjectLinks($newID,$data['contacts'],ZBS_TYPE_CONTACT);
                    $this->addUpdateObjectLinks($newID,$data['companies'],ZBS_TYPE_COMPANY);
                    // IA also gets 'againstid' historically, but we'll pass as 'against id's'
                    $againstIDs = array('contacts'=>$data['contacts'],'companies'=>$data['companies']);

                    // tags
                    if (isset($data['tags']) && is_array($data['tags'])) {

                        $this->addUpdateEventTags(
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
                            'obj_type_id'      => ZBS_TYPE_TASK,
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
                                            'objtype'   => ZBS_TYPE_TASK,
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
                            $this->DAL()->updateMeta(ZBS_TYPE_TASK,$newID,'extra_'.$cleanKey,$v);

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
                        zeroBSCRM_FireInternalAutomator('event.new',array(
                            'id'=>$newID,
                            'data'=>$data,
                            'extsource'=>$approvedExternalSource,
                            'againstids'=>$againstIDs,
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
     * adds or updates a event's tags
     * ... this is really just a wrapper for addUpdateObjectTags
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateEventTags($args=array()){

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
                'objtype'   => ZBS_TYPE_TASK,
                'objid'     => $id,
                'tag_input' => $tag_input,
                'tags'      => $tags,
                'tagIDs'    => $tagIDs,
                'mode'      => $mode
            )
        );

    }



    /**
     * mark event as comoplete
     *
     * @param int id Event ID
     * @param int (Bool) completion status -1 or 1
     *
     * @return bool
     */
    public function setEventCompleteness($id=-1,$status=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->addUpdateEvent(array(
                'id'=>$id,
                'limitedFields'=>array(
                    array('key'=>'zbse_complete','val' => $status,'type' => '%d')
            )));

        }

        return false;
        
    }


     /**
     * deletes a event object
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteEvent($args=array()){

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

                        'objtype'       => ZBS_TYPE_TASK,
                        'objid'         => $id
                ));

                // delete any objlinks
                $this->addUpdateObjectLinks($id,'unset',ZBS_TYPE_TASK);

                // delete any reminders
                $this->DAL()->eventreminders->deleteEventRemindersForEvent(array('eventID'=>$id));

                // delete any external source information
                $this->DAL()->delete_external_sources( array(

                    'obj_type'       => ZBS_TYPE_TASK,
                    'obj_id'         => $id,
                    'obj_source'    => 'all',

                ));

            }            
        
            $del = zeroBSCRM_db2_deleteGeneric($id,'events');

            #} Add to automator
            zeroBSCRM_FireInternalAutomator('event.delete',array(
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
     * @return array event (clean obj)
     */
    private function tidy_event($obj=false,$withCustomFields=false){

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

            
            $res['title'] = $this->stripSlashes($obj->zbse_title);
            $res['desc'] = $this->stripSlashes($obj->zbse_desc);
            $res['start'] = (int)$obj->zbse_start;
            $res['start_date'] = (isset($obj->zbse_start) && $obj->zbse_start > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbse_start) : false;
            $res['end'] = (int)$obj->zbse_end;
            $res['end_date'] = (isset($obj->zbse_end) && $obj->zbse_end > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbse_end) : false;
            $res['complete'] = (int)$this->stripSlashes($obj->zbse_complete);
            $res['show_on_portal'] = (int)$obj->zbse_show_on_portal;
            $res['show_on_cal'] = (int)$obj->zbse_show_on_cal;
            $res['created'] = (int)$obj->zbse_created;
            $res['created_date'] = (isset($obj->zbse_created) && $obj->zbse_created > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbse_created) : false;
            $res['lastupdated'] = (int)$obj->zbse_lastupdated;
            $res['lastupdated_date'] = (isset($obj->zbse_lastupdated) && $obj->zbse_lastupdated > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbse_lastupdated) : false;

                
            // custom fields - tidy any that are present:
            if ($withCustomFields) $res = $this->tidyAddCustomFields(ZBS_TYPE_TASK,$obj,$res,false);

        } 


        return $res;


    }


    /**
     * Wrapper, use $this->getEventMeta($contactID,$key) for easy retrieval of singular event
     * Simplifies $this->getMeta
     *
     * @param int objtype
     * @param int objid
     * @param string key
     *
     * @return array event meta result
     */
    public function getEventMeta($id=-1,$key='',$default=false){

        global $zbs;

        if (!empty($key)){

            return $this->DAL()->getMeta(array(

                'objtype' => ZBS_TYPE_TASK,
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
     * Returns an ownerid against a event
     *
     * @param int id event ID
     *
     * @return int event owner id
     */
    public function getEventOwner($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_TASK,
                'colname' => 'zbs_owner',
                'ignoreowner'=>true));

        }

        return false;
        
    }

    /**
     * Returns an status against a event
     *
     * @param int id event ID
     *
     * @return str event status string
     */
    /* IS THIS USED?
    public function getEventStatus($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_TASK,
                'colname' => 'zbse_status',
                'ignoreowner'=>true));

        }

        return false;
        
    }*/


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
    private function db_ready_event($obj=false){

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
    public function listViewObj($event=false,$columnsRequired=array()){

        if (is_array($event) && isset($event['id'])){

            $resArr = $event;

            #} Convert contact arr into list-view-digestable 'customer'// & unset contact for leaner data transfer
            if ( array_key_exists( 'contact', $event ) ) {
                $resArr['contact'] = zeroBSCRM_getSimplyFormattedContact($event['contact'], (in_array('assignedobj', $columnsRequired)));
            }

            #} Convert company arr into list-view-digestable 'customer'// & unset contact for leaner data transfer
            if ( array_key_exists( 'company', $event ) ) {
                $resArr['company'] = zeroBSCRM_getSimplyFormattedCompany($event['company'], (in_array('assignedobj', $columnsRequired)));
            }
            
            return $resArr;

        }

        return false;

    }

    // ===========  /   EVENT  =======================================================
    // ===============================================================================
} // / class
