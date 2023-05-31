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
* ZBS DAL >> Event Reminders (for events/tasks)
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_eventreminders extends zbsDAL_ObjectLayer {

    protected $objectType = ZBS_TYPE_EVENTREMINDER;
    protected $objectDBPrefix = 'zbser_';
    protected $objectModel = array(

        // ID
        'ID' => array('fieldname' => 'ID', 'format' => 'int'),

        // site + team generics
        'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
        'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
        'zbs_owner' => array('fieldname' => 'zbs_owner', 'format' => 'int'),

        // other fields
        'event' => array('fieldname' => 'zbser_event', 'format' => 'int'),
        'remind_at' => array('fieldname' => 'zbser_remind_at', 'format' => 'int'),
        'sent' => array('fieldname' => 'zbser_sent', 'format' => 'int'),
        'created' => array('fieldname' => 'zbser_created', 'format' => 'uts'),
        'lastupdated' => array('fieldname' => 'zbser_lastupdated', 'format' => 'uts')

    );


    function __construct($args=array()) {


        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            //'tag' => false,

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============


    }

    // ====================================================================================
    // ===========   EVENTREMINDER  =======================================================

    // generic get Company (by ID)
    // Super simplistic wrapper used by edit page etc. (generically called via dal->contacts->getSingle etc.)
    public function getSingle($ID=-1){

        return $this->getEventreminder($ID);

    }

    // generic get (by ID list)
    // Super simplistic wrapper used by MVP Export v3.0
    public function getIDList($IDs=false){

        return $this->getEventReminders(array(
            'inArr'             => $IDs,
            'page'          => -1,
            'perPage'       => -1
        ));

    }

    /**
     * returns full eventreminder line +- details
     *
     * @param int id        contact id
     * @param array $args   Associative array of arguments
     *
     * @return array eventreminder object
     */
    public function getEventreminder($id=-1,$args=array()){

        global $zbs;

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_EVENTREMINDER), // this'll let you not-check the owner of obj

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

                $selector = 'eventreminder.*';
                if (isset($fields) && is_array($fields)) {
                    $selector = '';

                    // always needs id, so add if not present
                    if (!in_array('ID',$fields)) $selector = 'eventreminder.ID';

                    foreach ($fields as $f) {
                        if (!empty($selector)) $selector .= ',';
                        $selector .= 'eventreminder.'.$f;
                    }
                } else if ($onlyID){
                    $selector = 'eventreminder.ID';
                }

            #} ============ / PRE-QUERY ===========


            #} Build query
            $query = "SELECT ".$selector.$extraSelect." FROM ".$ZBSCRM_t['eventreminders'].' as eventreminder';
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
                        $res = $this->tidy_eventreminder($potentialRes);
                    }

                    return $res;

            }

        } // / if ID

        return false;

    }

    /**
     * returns eventreminder detail lines
     *
     * @param array $args Associative array of arguments
     *
     * @return array of eventreminder lines
     */
    public function getEventreminders($args=array()){

        global $zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'eventID'          => false,

            // due date
            'dueBefore'       => false, // uts (due before)
            'dueAfter'        => false, // uts (due after)

            // status
            'sent'              => 0, // (if set bool) (false = hasn't been sent, true = has been sent)

            // returns
            'count'             => false,
            'withDueUTS'        => false, // if true returns 'due' field (UTS due)

            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0, // this is what page it is (gets * by for limit)
            'perPage'       => 100,
            'whereCase'          => 'AND', // DEFAULT = AND

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_EVENTREMINDER), // this'll let you not-check the owner of obj


        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        global $ZBSCRM_t,$wpdb,$zbs;  
        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array(); $joinQ = ''; $extraSelect = '';

        #} ============= PRE-QUERY ============

            #} Capitalise this
            $sortOrder = strtoupper($sortOrder);

            // If just count, turn off any extra gumpf
            if ($count) {

                $withDueUTS = false;

            }

            // include 'due' column
            if ($withDueUTS){

                $extraSelect .= ',(eventreminder.zbser_remind_at + (SELECT zbse_start FROM '.$ZBSCRM_t['events'].' WHERE ID = eventreminder.zbser_event)) due';

            }

        #} ============ / PRE-QUERY ===========

        #} Build query
        $query = "SELECT eventreminder.*".$extraSelect." FROM ".$ZBSCRM_t['eventreminders'].' as eventreminder'.$joinQ;

        #} Count override
        if ($count) $query = "SELECT COUNT(eventreminder.ID) FROM ".$ZBSCRM_t['eventreminders'].' as eventreminder'.$joinQ;

        #} ============= WHERE ================


            #} associated event id
            if (!empty($eventID) && $eventID > 0){

                // has id + type to match to (e.g. quote 123)
                // simpler than this, we're not using objid links: $wheres['associatedObjType'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_LINEITEM." AND zbsol_objtype_to = ".ZBS_TYPE_EVENT." AND zbsol_objid_to = %d)",$eventID);
                    $wheres['zbser_event'] = array('zbser_event','=','%d',$eventID);


            }

            #} Any additionalWhereArr?
            if (isset($additionalWhereArr) && is_array($additionalWhereArr) && count($additionalWhereArr) > 0){

                // add em onto wheres (note these will OVERRIDE if using a key used above)
                // Needs to be multi-dimensional $wheres = array_merge($wheres,$additionalWhereArr);
                $wheres = array_merge_recursive($wheres,$additionalWhereArr);

            }


            // dueBefore
            if (!empty($dueBefore) && $dueBefore > 0 && $dueBefore !== false){

                // is (event reminder at (e.g. -86400) + event start time (uts)) before $dueBefore
                $wheres['direct'][] = array('(eventreminder.zbser_remind_at + (SELECT zbse_start FROM '.$ZBSCRM_t['events'].' WHERE ID = eventreminder.zbser_event) < %d)',array($dueBefore));

            }
            // dueAfter
            if (!empty($dueAfter) && $dueAfter > 0 && $dueAfter !== false){

                // is (event reminder at (e.g. -86400) + event start time (uts)) after $dueAfter
                $wheres['direct'][] = array('(eventreminder.zbser_remind_at + (SELECT zbse_start FROM '.$ZBSCRM_t['events'].' WHERE ID = eventreminder.zbser_event) > %d)',array($dueAfter));

            }

            // sent (if set as bool)
            if ($sent === true){

                // has been sent
                $wheres['zbser_sent'] = array('zbser_sent','=','1');

            } elseif ($sent === false){

                // has not been sent
                $wheres['zbser_sent'] = array('zbser_sent','=','-1');

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
                    $resArr = $this->tidy_eventreminder($resDataLine);

                    $res[] = $resArr;

            }
        }

        return $res;
    } 


    /**
     * Returns a count of event reminders (owned)
     * .. inc by status
     *
     * @return int count
     */
    public function getEventReminderCount($args=array()){

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)

            // permissions
            'ignoreowner'   => true, // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $whereArr = array();

        return $this->DAL()->getFieldByWHERE(array(
            'objtype' => ZBS_TYPE_EVENTREMINDER,
            'colname' => 'COUNT(ID)',
            'where' => $whereArr,
            'ignoreowner' => $ignoreowner));
        
    }



     /**
     * adds or updates a eventreminder object
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateEventreminder($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'owner'         => -1,

            // fields (directly)
            'data'          => array(

                
                'event' => -1,
                'remind_at' => '',
                'sent' => '',
                'lastupdated' => '',

                // allow this to be set for MS sync etc.
                'created' => -1,

            ),

            'limitedFields' => -1, // if this is set it OVERRIDES data (allowing you to set specific fields + leave rest in tact)
            // ^^ will look like: array(array('key'=>x,'val'=>y,'type'=>'%s'))

            'silentInsert' => false, // this was for init Migration - it KILLS all IA for newEventreminder (because is migrating, not creating new :) this was -1 before

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

            // if no eventID, return false
            $event = -1; if (isset($data['event'])) $event = (int)$data['event'];
            if ($event <= 0 && !$limitedFields) return false;

            #} If no status, and default is specified in settings, add that in :)
            /*
            if (is_null($data['status']) || !isset($data['status']) || empty($data['status'])){

                // Default status for obj? -> this one gets for contacts -> $zbsCustomerMeta['status'] = zeroBSCRM_getSetting('defaultstatus');

            } */

        #} ========= / CHECK FIELDS ===========


        #} ========= OVERRIDE SETTING (Deny blank overrides) ===========


            // either ext source + setting, or set by the func call
            if ($do_not_update_blanks){

                    // this setting says 'don't override filled-out data with blanks'
                    // so here we check through any passed blanks + convert to limitedFields
                    // only matters if $id is set (there is somt to update not add
                    if (isset($id) && !empty($id) && $id > 0){

                        // get data to copy over (for now, this is required to remove 'fullname' etc.)
                        $dbData = $this->db_ready_eventreminder($data); 
                        //unset($dbData['id']); // this is unset because we use $id, and is update, so not req. legacy issue
                        //unset($dbData['created']); // this is unset because this uses an obj which has been 'updated' against original details, where created is output in the WRONG format :)

                        $origData = $data; //$data = array();               
                        $limitedData = array(); // array(array('key'=>'zbser_x','val'=>y,'type'=>'%s'))

                        // cycle through + translate into limitedFields (removing any blanks, or arrays (e.g. externalSources))
                        // we also have to remake a 'faux' data (removing blanks for tags etc.) for the post-update updates
                        foreach ($dbData as $k => $v){

                            $intV = (int)$v;

                            // only add if valuenot empty
                            if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){

                                // add to update arr
                                $limitedData[] = array(
                                    'key' => 'zbser_'.$k, // we have to add zbser_ here because translating from data -> limited fields
                                    'val' => $v,
                                    'type' => $this->getTypeStr('zbser_'.$k)
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
                if (!isset($dataArr['zbser_lastupdated'])){ $dataArr['zbser_lastupdated'] = time(); $typeArr[] = '%d'; }

            } else {

                // FULL UPDATE/INSERT

                    // UPDATE
                    $dataArr = array( 

                                // ownership
                                // no need to update these (as of yet) - can't move teams etc.
                                //'zbs_site' => zeroBSCRM_installSite(),
                                //'zbs_team' => zeroBSCRM_installTeam(),
                                //'zbs_owner' => $owner,

                                    
                                'zbser_event' => $data['event'],
                                'zbser_remind_at' => $data['remind_at'],
                                'zbser_sent' => $data['sent'],
                                'zbser_lastupdated' => time(),

                            );

                    $typeArr = array( // field data types
                                //'%d',  // site
                                //'%d',  // team
                                //'%d',  // owner

                                    
                                '%d',
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
                        $dataArr['zbser_created'] = $data['created'];$typeArr[] = '%d';
                    } else {
                        $dataArr['zbser_created'] = time();          $typeArr[] = '%d';
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
                        $ZBSCRM_t['eventreminders'], 
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
                                    $this->DAL()->updateMeta(ZBS_TYPE_EVENTREMINDER,$id,'extra_'.$cleanKey,$v);

                                    #} Add it to this, which passes to IA
                                    $confirmedExtraMeta[$cleanKey] = $v;

                                }

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
                        $ZBSCRM_t['eventreminders'], 
                        $dataArr, 
                        $typeArr ) > 0){

                    #} Successfully inserted, lets return new ID
                    $newID = $wpdb->insert_id;
                    
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
     * updates sent status for an event reminder
     *
     * @param int id Event Reminder ID
     * @param int Sent Status (-1 = unsent, 1 = sent)
     *
     * @return bool
     */
    public function setSentStatus($id=-1,$status=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0 && in_array($status, array(-1,1))){

            return $this->addUpdateEventreminder(array(
                'id'=>$id,
                'limitedFields'=>array(
                    array('key'=>'zbser_sent','val' => $status,'type' => '%d')
            )));

        }

        return false;
        
    }


     /**
     * deletes a eventreminder object
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteEventreminder($args=array()){

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

            return zeroBSCRM_db2_deleteGeneric($id,'eventreminders');

        }

        return false;

    }


     /**
     * deletes all eventreminder objects assigned to event
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteEventRemindersForEvent($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'eventID'            => -1

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} Check ID & Delete :)
        $eventID = (int)$eventID;
        if (!empty($eventID) && $eventID > 0) {
            
            $reminders = $this->getEventreminders(array('eventID'=>$eventID,'perPage'=>1000,'ignoreowner'=>true));

            $delcount = 0;
            if (is_array($reminders)) foreach ($reminders as $r){

                $delcount += $this->deleteEventreminder(array('id'=>$r['id']));

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
     * @return array eventreminder (clean obj)
     */
    private function tidy_eventreminder($obj=false,$withCustomFields=false){

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

            
            $res['event'] = (int)$obj->zbser_event;
            $res['remind_at'] = (int)$obj->zbser_remind_at;
            $res['sent'] = (int)$obj->zbser_sent;
            $res['created'] = (int)$obj->zbser_created;
            $res['created_date'] = (isset($obj->zbser_created) && $obj->zbser_created > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbser_created) : false;
            $res['lastupdated'] = (int)$obj->zbser_lastupdated;
            $res['lastupdated_date'] = (isset($obj->zbser_lastupdated) && $obj->zbser_lastupdated > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbser_lastupdated) : false;

            // if set: due
            if (isset($obj->due)) $res['due'] = (int)$obj->due;

        } 


        return $res;


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
    private function db_ready_eventreminder($obj=false){

        // use the generic? (override here if necessary)
        return $this->db_ready_obj($obj);

    }

    // ===========  /   EVENTREMINDER  =======================================================
    // ===============================================================================
    

    
} // / class
