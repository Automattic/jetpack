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

use Automattic\JetpackCRM\Segment_Condition_Exception;

defined( 'ZEROBSCRM_PATH' ) || exit;

/**
* ZBS DAL >> Segments
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_segments extends zbsDAL_ObjectLayer {

    protected $objectType = ZBS_TYPE_SEGMENT;
    protected $objectModel = array(

        // ID
        'ID' => array('fieldname' => 'ID', 'format' => 'int'),

        // site + team generics
        'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
        'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
        'zbs_owner' => array('fieldname' => 'zbs_owner', 'format' => 'int'),

        // other fields
        'name' => array('fieldname' => 'zbsseg_name', 'format' => 'str'),
        'slug' => array('fieldname' => 'zbsseg_slug', 'format' => 'str'),
        'matchtype' => array('fieldname' => 'zbsseg_matchtype', 'format' => 'str'),
        'created' => array('fieldname' => 'zbsseg_created', 'format' => 'uts'),
        'lastupdated' => array('fieldname' => 'zbsseg_lastupdated', 'format' => 'uts'),
        'compilecount' => array('fieldname' => 'zbsseg_compilecount', 'format' => 'int'),
        'lastcompiled' => array('fieldname' => 'zbsseg_lastcompiled', 'format' => 'uts'),

        );


    function __construct($args=array()) {

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            //'tag' => false,

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============


    }


    // ===============================================================================
    // ===========   SEGMENTS  =======================================================

    // generic get Company (by ID)
    // Super simplistic wrapper used by edit page etc. (generically called via dal->contacts->getSingle etc.)
    public function getSingle($ID=-1){

        return $this->getSegment($ID);

    }
    
    // This was actually written pre DAL2 and so still has some legacy layout of func 
    // etc. To be slowly refined if needed.
    
           
   /**
     * get a segment (header line)
     */
    public function getSegment($segmentID=-1,$withConditions=false,$checkOwnershipID=false){

        if ($segmentID > 0){
    
            global $ZBSCRM_t,$wpdb;

            $additionalWHERE = ''; $queryVars = array($segmentID);

            // check ownership
            // THIS ShoULD BE STANDARDISED THROUGHOUT DAL (ON DB2)
                // $checkOwnershipID = ID = check against that ID
                // $checkOwnershipID = true = check against get_current_user_id
                // $checkOwnershipID = false = do not check
            
            if ($checkOwnershipID === true){

                $segmentOwner = get_current_user_id();

            } elseif ($checkOwnershipID > 0){

                $segmentOwner = (int)$checkOwnershipID;

            } // else is false, don't test

            if (isset($segmentOwner)){

                // add check
                $additionalWHERE = 'AND zbs_owner = %d';
                $queryVars[] = $segmentOwner;

            }
            

            $potentialSegment = $wpdb->get_row( $this->prepare("SELECT * FROM ".$ZBSCRM_t['segments']." WHERE ID = %d ".$additionalWHERE."ORDER BY ID ASC LIMIT 0,1",$queryVars), OBJECT );

            if (isset($potentialSegment) && isset($potentialSegment->ID)){

                #} Retrieved :) fill + return
                
                    // tidy
                    $segment = $this->tidy_segment($potentialSegment);

                    if ($withConditions) {

                        $segment['conditions'] = $this->getSegmentConditions($segment['id']);

                    }

                    // this catches any 'broken' state segments.
                    // ... for now this is done via a setting, later we should build an error stack via DAL #refined-error-stack
                    $error_string = $this->segment_error( $segment['id'] );
                    if ( !empty( $error_string ) ){
                        $segment['error'] = zeroBSCRM_textExpose( $error_string );
                    }

                return $segment;
            }

        }

        return false;
    
   }

     /**
     * get Sements Pass -1 for $perPage and $page and this'll return ALL
     */
    public function getSegments($ownerID=-1,$perPage=10,$page=0,$withConditions=false,$searchPhrase='',$inArr='',$sortByField='',$sortOrder='DESC'){

                global $zbs,$ZBSCRM_t,$wpdb;

                $segments = false;

                // build query
                $sql = "SELECT * FROM ".$ZBSCRM_t['segments'];
                $wheres = array();
                $params = array();
                $orderByStr = '';

                    // Owner

                        // escape (all)
                        if ($ownerID != -99){

                            if ($ownerID === -1) $ownerID = get_current_user_id();

                            if (!empty($ownerID)) $wheres['zbs_owner'] = array('=',$ownerID,'%d');

                        }


                    // search phrase
                    if (!empty($searchPhrase)){

                        $wheres['zbsseg_name'] = array('LIKE','%'.$searchPhrase.'%','%s');

                    }

                    // in array
                    if (is_array($inArr) && count($inArr) > 0){

                        $wheres['ID'] = array('IN','('.implode(',', $inArr).')','%s');

                    }

                    // add where's to SQL
                    // + 
                    // feed in params
                    $whereStr = '';
                    if (count($wheres) > 0) foreach ($wheres as $key => $whereArr) {

                        if (!empty($whereStr)) 
                            $whereStr .= ' AND ';
                        else
                            $whereStr .= ' WHERE ';

                        // add in - NOTE: this is TRUSTING key + whereArr[0]
                        $whereStr .= $key.' '.$whereArr[0].' '.$whereArr[2];

                        // feed in params
                        $params[] = $whereArr[1];
                    }

                    // append to sql
                    $sql .= $whereStr;



                    // sort by
                    if (!empty($sortByField)){

                        if (!in_array($sortOrder, array('DESC','ASC'))) $sortOrder = 'DESC';

                        // parametise order field as is unchecked
                        //$orderByStr = ' ORDER BY %s '.$sortOrder;
                        //$params[] = $sortByField;
                        $orderByStr = ' ORDER BY '.$sortByField.' '.$sortOrder;

                    }


                    // pagination
                    if ($page == -1 && $perPage == -1){

                        // NO LIMITS :o


                    } else {

                        // Because SQL USING zero indexed page numbers, we remove -1 here
                        // ... DO NOT change this without seeing usage of the function (e.g. list view) - which'll break
                        $page = (int)$page-1;
                        if ($page < 0) $page = 0;

						// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						$orderByStr .= sprintf( ' LIMIT %d, %d ', (int) $page * (int) $perPage, (int) $perPage );
                    }

                    // append to sql
                    $sql .= $orderByStr;

                $query = $this->prepare($sql,$params);

                try {

                    $potentialSegments = $wpdb->get_results( $query, OBJECT );

                } catch (Exception $e){

                    // error with sql :/ for now nothin

                }

                if (isset($potentialSegments) && is_array($potentialSegments)) $segments = $potentialSegments;

                // TIDY
                $res = array();
                if (count($segments) > 0) foreach ($segments as $segment) {

                    // tidy
                    $resArr = $this->tidy_segment($segment);

                    // TO ADD to query / here withConditions
                    // TODO: REFACTOR into query? More efficient?
                    if ($withConditions) $resArr['conditions'] = $this->getSegmentConditions($segment->ID);

                    // this catches any 'broken' state segments.
                    // ... for now this is done via a setting, later we should build an error stack via DAL #refined-error-stack
                    $error_string = $this->segment_error( $segment->ID );
                    if ( !empty( $error_string ) ){
                        $resArr['error'] = zeroBSCRM_textExpose( $error_string );
                    }
                                
                    $res[] = $resArr;

                }

                return $res;
            
           }

           // brutal simple temp func (should be a wrapper really. segments to tidy up post DAL2 other obj)
           public function getSegmentCount(){

                global $ZBSCRM_t,$wpdb;

                // build query
                $sql = "SELECT COUNT(ID) FROM ".$ZBSCRM_t['segments'];

                return $wpdb->get_var($sql);
            
           }


             /**
             * deletes a Segment object (and its conditions)
             *
             * @param array $args Associative array of arguments
             *              id
             *
             * @return int success;
             */
            public function deleteSegment($args=array()){

                global $ZBSCRM_t, $wpdb, $zbs;

                #} ============ LOAD ARGS =============
                $defaultArgs = array(

                    'id'            => -1,
                    'saveOrphans'   => -1

                ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
                #} =========== / LOAD ARGS ============

                #} Check ID & Delete :)
                $id = (int)$id;
                if (!empty($id) && $id > 0) {

                    $segment = $this->getSegment( $id );

                    $deleted = zeroBSCRM_db2_deleteGeneric($id,'segments');

                        // delete segment conditions?
                        // check $deleted?

                        $del = $wpdb->delete( 
                                    $ZBSCRM_t['segmentsconditions'], 
                                    array( // where
                                        'zbscondition_segmentid' => $id
                                        ),
                                    array(
                                        '%d'
                                        )
                                    );

                        #} Add to automator
                        zeroBSCRM_FireInternalAutomator('segment.delete',array(
                            'id'            => $id,
                            'saveOrphans'   => $saveOrphans,
                        ));

                        $customViews = $zbs->settings->get('customviews2');
                        $segment_slug = $segment['slug'];
                        unset( $customViews['customer_filters']["segment_$segment_slug"] );
                        $zbs->settings->update('customviews2', $customViews);

                        return $del;

                }

                return false;

            }

             /**
             * tidys a segment
             */
            public function tidy_segment($obj=false){

                $res = false;


                if (isset($obj->ID)){
                    $res = array();
                    $res['id'] = $obj->ID;
                    
                    $res['name'] = $obj->zbsseg_name;
                    $res['slug'] = $obj->zbsseg_slug;
                    $res['matchtype'] = $obj->zbsseg_matchtype;

                    $res['created'] = $obj->zbsseg_created;
                    $res['lastupdated'] = $obj->zbsseg_lastupdated;
                    $res['compilecount'] = $obj->zbsseg_compilecount;
                    $res['lastcompiled'] = $obj->zbsseg_lastcompiled;

                    // pretty date outputs for list viw
                    $res['createddate'] = zeroBSCRM_locale_utsToDate($obj->zbsseg_created);
                    $res['lastcompileddate'] = zeroBSCRM_locale_utsToDate($obj->zbsseg_lastcompiled);
                } 

                return $res;

           }

             /**
             * tidys a segment condition
             */
            public function tidy_segment_condition($obj=false){

                $res = false;

                if (isset($obj->ID)){
                    $res = array();
                    $res['id'] = $obj->ID;
                    
                    $res['segmentID'] = $obj->zbscondition_segmentid;
                    $res['type'] = $obj->zbscondition_type;
                    $res['operator'] = $obj->zbscondition_op;
                    $res['value'] = zeroBSCRM_textExpose($obj->zbscondition_val);
                    $res['value2'] = zeroBSCRM_textExpose($obj->zbscondition_val_secondary);

                    // applies any necessary conversions e.g. uts -> date
                    $res['valueconv'] = zeroBSCRM_segments_typeConversions($res['value'],$res['type'],$res['operator'],'out');
                    $res['value2conv'] = zeroBSCRM_segments_typeConversions($res['value2'],$res['type'],$res['operator'],'out');

                } 

                return $res;

           }

           
           /**
             * This is designed to mimic zeroBS_getSegments, but only to return a total count :) 
             */
            public function getSegmentsCountIncParams($ownerID=-1,$perPage=10,$page=0,$withConditions=false,$searchPhrase='',$inArr='',$sortByField='',$sortOrder='DESC'){

                global $zbs,$ZBSCRM_t,$wpdb;

                $segmentCount = false;

                // build query
                $sql = "SELECT COUNT(ID) segcount FROM ".$ZBSCRM_t['segments'];
                $wheres = array();
                $params = array();
                $orderByStr = '';

                    // Owner

                        // escape (all)
                        if ($ownerID != -99){

                            if ($ownerID === -1) $ownerID = get_current_user_id();

                            if (!empty($ownerID)) $wheres['zbs_owner'] = array('=',$ownerID,'%d');

                        }


                    // search phrase
                    if (!empty($searchPhrase)){

                        $wheres['zbsseg_name'] = array('LIKE',$searchPhrase,'%s');

                    }

                    // in array
                    if (is_array($inArr) && count($inArr) > 0){

                        $wheres['ID'] = array('IN','('.implode(',', $inArr).')','%s');

                    }

                    // add where's to SQL
                    // + 
                    // feed in params
                    $whereStr = '';
                    if (count($wheres) > 0) foreach ($wheres as $key => $whereArr) {

                        if (!empty($whereStr)) 
                            $whereStr .= ' AND ';
                        else
                            $whereStr .= ' WHERE ';

                        // add in - NOTE: this is TRUSTING key + whereArr[0]
                        $whereStr .= $key.' '.$whereArr[0].' '.$whereArr[2];

                        // feed in params
                        $params[] = $whereArr[1];
                    }

                    // append to sql
                    $sql .= $whereStr;

                $query = $this->prepare($sql,$params);

                try {

                    $potentialSegmentCount = $wpdb->get_row( $query, OBJECT );

                } catch (Exception $e){

                    // error with sql :/ for now nothin

                }

                if (isset($potentialSegmentCount) && isset($potentialSegmentCount->segcount)) $segmentCount = $potentialSegmentCount->segcount;

                return $segmentCount;
            
           }


           /**
             * builds a preview (top 5 + count) of a set of conditions which could be against a segment
             * expects a filtered list of conditions (e.g. zeroBSCRM_segments_filterConditions if sent through POST)
             *
             * Throws @Segment_Condition_Exception
             */
            public function previewSegment($conditions=array(),$matchType='all',$countOnly=false){

                    
                    // retrieve getContacts arguments from a list of segment conditions
                    $contactGetArgs = $this->segmentConditionsToArgs($conditions,$matchType);

                    // add top 5 + count params
                    $contactGetArgs['sortByField'] = 'RAND()';
                    $contactGetArgs['sortOrder'] = '';
                    $contactGetArgs['page'] = 0;
                    $contactGetArgs['perPage'] = 5;
                    $contactGetArgs['ignoreowner'] = zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT);

                    // count ver
                    $countContactGetArgs = $contactGetArgs;
                    $countContactGetArgs['perPage'] = 100000;
                    $countContactGetArgs['count'] = true;

                    // count only
                    if ( $countOnly ) {
                        return $this->DAL()->contacts->getContacts($countContactGetArgs);
                    }

                    // Retrieve
                    return array(
                        // DEBUG 
                        //'conditions' => $conditions, // TEMP - remove this
                        //'args' => $contactGetArgs, // TEMP - remove this
                        'count'=>$this->DAL()->contacts->getContacts($countContactGetArgs),
                        'list'=>$this->DAL()->contacts->getContacts($contactGetArgs)
                    );

           }


           /**
             * used by previewSegment and getSegmentAudience to build condition args
             */
           public function segmentConditionsToArgs($conditions=array(),$matchType='all'){

                if (is_array($conditions) && count($conditions) > 0){

                    $contactGetArgs = array();
                    $conditionIndx = 0; // this allows multiple queries for SAME field (e.g. status = x or status = y)

                    // cycle through & add to contact request arr
                    foreach ($conditions as $condition){

                        $newArgs = $this->segmentConditionArgs($condition,$conditionIndx); $additionalWHERE = false;

                        // legit? merge (must be recursive)
                        if (is_array($newArgs)) $contactGetArgs = array_merge_recursive($contactGetArgs,$newArgs);

                        $conditionIndx++;

                    }

                    // match type ALL is default, this switches to ANY
                    if ($matchType == 'one') $contactGetArgs['whereCase'] = 'OR';

                    return $contactGetArgs;                            

                }

                return array();

           }
           
           /**
             * get a segment (header line)
             */
            public function getSegmentBySlug($segmentSlug=-1,$withConditions=false,$checkOwnershipID=false){

                if (!empty($segmentSlug)){
            
                    global $ZBSCRM_t,$wpdb;

                    $additionalWHERE = ''; $queryVars = array($segmentSlug);

                    // check ownership
                    // THIS ShoULD BE STANDARDISED THROUGHOUT DAL (ON DB2)
                        // $checkOwnershipID = ID = check against that ID
                        // $checkOwnershipID = true = check against get_current_user_id
                        // $checkOwnershipID = false = do not check
                    
                    if ($checkOwnershipID === true){

                        $segmentOwner = get_current_user_id();

                    } elseif ($checkOwnershipID > 0){

                        $segmentOwner = (int)$checkOwnershipID;

                    } // else is false, don't test

                    if (isset($segmentOwner)){

                        // add check
                        $additionalWHERE = 'AND zbs_owner = %d';
                        $queryVars[] = $segmentOwner;

                    }
                    

                    $potentialSegment = $wpdb->get_row( $this->prepare("SELECT * FROM ".$ZBSCRM_t['segments']." WHERE zbsseg_slug = %s ".$additionalWHERE."ORDER BY ID ASC LIMIT 0,1",$queryVars), OBJECT );

                    if (isset($potentialSegment) && isset($potentialSegment->ID)){

                        #} Retrieved :) fill + return
                        
                            // tidy
                            $segment = $this->tidy_segment($potentialSegment);

                            if ($withConditions) {

                                $segment['conditions'] = $this->getSegmentConditions($segment['id']);

                            }


                        return $segment;
                    }

                }

                return false;

            }

            /*
            * Compatibility for typo:
            * #backward-compatibility
            */
            public function getSegementAudience($segmentID=-1,$page=0,$perPage=20,$sortByField='ID',$sortOrder='DESC',$onlyCount=false,$withDND=false){
                return $this->getSegmentAudience( $segmentID, $page, $perPage, $sortByField, $sortOrder, $onlyCount, $withDND );
            }

	/**
	 * Runs a filtered search on customers based on a segment's condition
	 *
	 * @param int $segment_id ID of segment.
	 * @param int $page Page number.
	 * @param int $per_page Number of objects per page.
	 * @param int $sort_by_field Field to sort by.
	 * @param int $sort_order Sort order.
	 * @param int $only_count Only return counts.
	 * @param int $with_dnd Return DND info.
	 * @param int $limited_fields Only return specific fields.
	 *
	 * @return array or count ($onlyCount)
	 */
	public function getSegmentAudience(
		$segment_id = -1,
		$page = 0,
		$per_page = 20,
		$sort_by_field = 'ID',
		$sort_order = 'DESC',
		$only_count = false,
		$with_dnd = false,
		$limited_fields = false
	) {

		// assumes sensible paging + sort vars... no checking of them

		if ( $segment_id > 0 ) {

			#} Retrieve segment + conditions
			$segment = $this->getSegment( $segment_id, true );

			$conditions = array();
			if ( isset( $segment['conditions'] ) ) {
				$conditions = $segment['conditions'];
			}

			$match_type = 'all';
			if ( isset( $segment['matchtype'] ) ) {
				$match_type = $segment['matchtype'];
			}

			try {

				// retrieve getContacts arguments from a list of segment conditions
				$contact_get_args = $this->segmentConditionsToArgs( $conditions, $match_type );

				// Remove any segment area error notice
				$this->remove_segment_error( $segment_id );

			} catch ( Segment_Condition_Exception $exception ) {

				// We're missing the condition class for one or more of this segment's conditions.
				$this->segment_error_condition_missing( $segment_id, $exception );

				// return fail
				return false;

			}

			// needs to be ownerless for now
			$contact_get_args['ignoreowner'] = zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT );

			// add paging params
			$contact_get_args['sortByField'] = $sort_by_field;
			$contact_get_args['sortOrder']   = $sort_order;
			$contact_get_args['page']        = $page;

			if ( $per_page !== -1 ) {
				$contact_get_args['perPage'] = $per_page; // over 100k? :o
			} else {
				// no limits
				$contact_get_args['page']    = -1;
				$contact_get_args['perPage'] = -1;
			}

			// count ver
			if ( $only_count ) {
				$contact_get_args['page']    = -1;
				$contact_get_args['perPage'] = -1;
				$contact_get_args['count']   = true;

				$count = $this->DAL()->contacts->getContacts( $contact_get_args );

				// effectively a compile, so update compiled no on record
				$this->updateSegmentCompiled( $segment_id, $count, time() );

				return $count;
			}

			// got dnd?
			if ( $with_dnd ) {
				$contact_get_args['withDND'] = true;
			}

			// limited fields?
			if ( is_array( $limited_fields ) ) {
				$contact_get_args['onlyColumns'] = $limited_fields;
			}

			$contact_get_args['withAssigned'] = true;

			$contacts = $this->DAL()->contacts->getContacts( $contact_get_args );

			// if no limits, update compile record (effectively a compile)
			if ( $contact_get_args['page'] === -1 && $contact_get_args['perPage'] === -1 ) {

				$this->updateSegmentCompiled( $segment_id, count( $contacts ), time() );

			}

			// Retrieve
			return $contacts;

		}

		return false;
	}

           /**
             * checks all segments against a contact
             */
            public function getSegmentsContainingContact($contactID=-1,$justIDs=false){

                $ret = array();

                if ($contactID > 0){

                    // get all segments
                    $segments = $this->getSegments(-1,1000,0,true);

                    if (count($segments) > 0) {

                        foreach ($segments as $segment){

                            // pass obj to check (saves it querying)
                            if ($this->isContactInSegment($contactID, $segment['id'],$segment)){

                                // is in segment
                                if ($justIDs)
                                    $ret[] = $segment['id'];
                                else
                                    $ret[] = $segment;

                            }

                        } // foreach segment

                    } // if segments

                } // if contact id

                return $ret;

           }

           /**
             * Checks if a contact matches segment conditions
             * ... can pass $segmentObj to avoid queries (performance) if already have it
             */
            public function isContactInSegment($contactID=-1,$segmentID=-1,$segmentObj=false){

                if ($segmentID > 0 && $contactID > 0){

                    #} Retrieve segment + conditions
                    if (is_array($segmentObj)) 
                        $segment = $segmentObj;
                    else
                        $segment = $this->getSegment($segmentID,true);

                    #} Set these
                    $conditions = array(); if (isset($segment['conditions'])) $conditions = $segment['conditions'];
                    $matchType = 'all'; if (isset($segment['matchtype'])) $matchType = $segment['matchtype'];

                        try {

                            // retrieve getContacts arguments from a list of segment conditions
                            $contactGetArgs = $this->segmentConditionsToArgs($conditions,$matchType);

                        } catch ( Segment_Condition_Exception $exception ){

                            // We're missing the condition class for one or more of this segment's conditions.
                            $this->segment_error_condition_missing( $segmentID, $exception );

                            // return false, because of the segment error, we cannot be sure.
                            return false;
                            
                        }

                        // add paging params
                        $contactGetArgs['page'] = -1;
                        $contactGetArgs['perPage'] = -1;
                        $contactGetArgs['count'] = true;

                        // add id check (via rough additionalWhere)
                        if (!isset($contactGetArgs['additionalWhereArr'])) $contactGetArgs['additionalWhereArr'] = array();
                        $contactGetArgs['additionalWhereArr']['idCheck'] = array("ID",'=','%d',$contactID);

                        // should only ever be 1 or 0
                        $count = $this->DAL()->contacts->getContacts($contactGetArgs);

                        if ($count == 1) 
                            return true;

                        // nope.
                        return false;

                }

                return false;

           }

           /**
             * Compiles all segments             
             */
            public function compile_all_segments(){

                // get all segments
                $segments = $this->getSegments(-1,1000,0,true);

                if (count($segments) > 0) foreach ($segments as $segment){

                        // compile this segment
                        $this->compileSegment( $segment['id'] );

                } // foreach segment

                return false;

           }

           /**
             * Compiles any segments which are affected by a single contact change
             * includeSegments is an array of id's - this allows you to pass 'what contact was in before' (because these need --1)
             */
            public function compileSegmentsAffectedByContact($contactID=-1,$includeSegments=array()){

                if ($contactID > 0){

                    // get all segments
                    $segments = $this->getSegments(-1,1000,0,true);

                    if (count($segments) > 0) foreach ($segments as $segment){

                        // pass obj to check (saves it querying)
                        if ($this->isContactInSegment($contactID, $segment['id'],$segment) || in_array($segment['id'], $includeSegments)){

                            // is in segment

                            // compile this segment
                            $this->compileSegment($segment['id']);

                        }

                    } // foreach segment

                } // if contact id

                return false;

           }

            /*
             * Compiles any segments which are affected by a quote change
             *
             * This means segments with conditions of type:
             * quotecount
             *
             * Here we accept a @param of @quote to allow future refinements where by exact conditions are compared.
             */
            public function compileSegmentsAffectedByQuote( $quote = array() ){

                if ( is_array( $quote ) ){

                    // get all segments
                    $segments = $this->getSegments(-1,1000,0,true);

                    if (count($segments) > 0) foreach ($segments as $segment){

                        // does this segment have a condition we're watching for
                        if ( $this->segmentHasConditionType( $segment, 
                            array(
                                'quotecount'
                            )
                        ) ){

                            // recompile the segment
                            $this->compileSegment($segment['id']);

                        }

                    } // foreach segment

                } // if contact id

                return false;

            }

            /*
             * Compiles any segments which are affected by an invoice change
             *
             * This means segments with conditions of type:
             * invcount
             * successtotaltransval
             *
             * Here we accept a @param of @invoice to allow future refinements where by exact conditions are compared.
             */
            public function compileSegmentsAffectedByInvoice( $invoice = array() ){

                if ( is_array( $invoice ) ){

                    // get all segments
                    $segments = $this->getSegments(-1,1000,0,true);

                    if (count($segments) > 0) foreach ($segments as $segment){

                        // does this segment have a condition we're watching for
                        if ( $this->segmentHasConditionType( $segment, 
                            array(
                                'invcount',
                                'successtotaltransval'
                            )
                        ) ){

                            // recompile the segment
                            $this->compileSegment($segment['id']);

                        }

                    } // foreach segment

                } // if contact id

                return false;

            }

            /*
             * Compiles any segments which are affected by a transaction change
             *
             * This means segments with conditions of type:
             * trancount
             * successsingletransval
             * successtotaltransval
             * successtransref
             * successtransname
             * successtransstr
             *
             * Here we accept a @param of @transaction to allow future refinements where by exact conditions are compared.
             *
             */
            public function compileSegmentsAffectedByTransaction( $transaction = array() ){

                if ( is_array( $transaction ) ){

                    // get all segments
                    $segments = $this->getSegments(-1,1000,0,true);

                    if (count($segments) > 0) foreach ($segments as $segment){

                        // does this segment have a condition we're watching for
                        if ( $this->segmentHasConditionType( $segment, 
                            array(
                                'trancount',
                                'successsingletransval',
                                'successtotaltransval',
                                'successtransref',
                                'successtransname',
                                'successtransstr'
                            )
                        ) ){

                            // recompile the segment
                            $this->compileSegment($segment['id']);

                        }

                    } // foreach segment

                } // if contact id

                return false;

            }


           
           /**
             * 
             */
            public function getSegmentConditions($segmentID=-1){

                if ($segmentID > 0){

                    global $ZBSCRM_t,$wpdb;

                    $potentialSegmentConditions = $wpdb->get_results( $this->prepare("SELECT * FROM ".$ZBSCRM_t['segmentsconditions']." WHERE zbscondition_segmentid = %d",$segmentID) );

                    if (is_array($potentialSegmentConditions) && count($potentialSegmentConditions) > 0) {

                        $returnConditions = array();

                        foreach ($potentialSegmentConditions as $condition){

                            $returnConditions[] = $this->tidy_segment_condition($condition);

                        }


                        return $returnConditions;

                    }
                    

                }

                return false;
            
           }


           /**
             * Simple func to update the segment compiled count (says how many contacts currently in segment)
             */
           public function updateSegmentCompiled($segmentID=-1,$segmentCount=0,$compiledUTS=-1){
                
                global $ZBSCRM_t,$wpdb;

                if ($segmentID > 0){

                    // checks
                    $count = 0; if ($segmentCount > 0) $count = (int)$segmentCount;
                    $compiled = time(); if ($compiledUTS > 0) $compiled = (int)$compiledUTS;

                    if ($wpdb->update( 
                            $ZBSCRM_t['segments'], 
                            array( 
                                'zbsseg_compilecount' => $count,
                                'zbsseg_lastcompiled' => $compiled
                            ), 
                            array( // where
                                'ID' => $segmentID
                                ),
                            array( 
                                '%d', 
                                '%d'
                            ),
                            array(
                                '%d'
                                )
                            ) !== false){

                            // udpdated
                            return true;

                        } else {

                            // could not update?!
                            return false;

                        }


                }

           }

           /**
             * 
             */
            public function addUpdateSegment($segmentID=-1,$segmentOwner=-1,$segmentName='',$segmentConditions=array(),$segmentMatchType='all',$forceCompile=false){

                global $ZBSCRM_t,$wpdb;

                #} After ops, shall I compile audience?
                $toCompile = $forceCompile;

                if ($segmentID > 0){

                    #} Update a segment

                        #} Owner - if -1 then use current user
                        if ($segmentOwner <= 0) $segmentOwner = get_current_user_id();

                        #} Empty name = untitled
                        if (empty($segmentName)) $segmentName = __('Untitled Segment',"zero-bs-crm");

                        // slug auto-updates with name, (fix later if issue)
                        // in fact, just leave as whatever first set? (affects quickfilter URLs etc?)
                        // just did in end
                        #} Generate slug
                        $segmentSlug = $this->makeSlug($segmentName);

                        #} update header line
                        if ($wpdb->update( 
                            $ZBSCRM_t['segments'], 
                            array( 
                                'zbs_owner' => $segmentOwner,
                                'zbsseg_name' => $segmentName,
                                'zbsseg_slug' => $segmentSlug,
                                'zbsseg_matchtype' => $segmentMatchType,
                                'zbsseg_lastupdated' => time()
                            ), 
                            array( // where
                                'ID' => $segmentID
                                ),
                            array( 
                                '%d', 
                                '%s',
                                '%s',
                                '%s',
                                '%d'
                            ),
                            array(
                                '%d'
                                )
                            ) !== false){

                            // updated, move on..

                            // add segment conditions
                            $this->addUpdateSegmentConditions($segmentID,$segmentConditions);

                            // return id
                            $returnID = $segmentID;

                            // force to compile
                            $toCompile = true; $compileID = $segmentID;

                        } else {

                            // could not update?!
                            return false;

                        }
                    

                } else {

                    #} Add a new segment

                        #} Owner - if -1 then use current user
                        if ($segmentOwner <= 0) $segmentOwner = get_current_user_id();

                        #} Empty name = untitled (should never happen because of UI)
                        if (empty($segmentName)) $segmentName = __('Untitled Segment',"zero-bs-crm");

                        #} Generate slug
                        $segmentSlug = $this->makeSlug($segmentName);

                        #} Add header line
                        if ($wpdb->insert( 
                            $ZBSCRM_t['segments'], 
                            array( 
                                'zbs_owner' => $segmentOwner,
                                'zbsseg_name' => $segmentName,
                                'zbsseg_slug' => $segmentSlug,
                                'zbsseg_matchtype' => $segmentMatchType,
                                'zbsseg_created' => time(),
                                'zbsseg_lastupdated' => time(),
                                'zbsseg_lastcompiled' => time(), // we'll compile it shortly, set as now :)
                            ), 
                            array( 
                                '%d', 
                                '%s',
                                '%s',
                                '%s',
                                '%d',
                                '%d',
                                '%d'
                            ) 
                        ) > 0){

                            // inserted, let's move on
                            $newSegmentID = $wpdb->insert_id;

                            // add segment conditions
                            $this->addUpdateSegmentConditions($newSegmentID,$segmentConditions);

                            // force to compile
                            $toCompile = true; $compileID = $newSegmentID;

                            // return id
                            $returnID = $newSegmentID;

                        } else {

                            // could not insert?!
                            return false;

                        }

                } // / new

                // "compile" segments?
                if ($toCompile && !empty($compileID)){

                    // compiles + logs how many in segment against record
                    $totalInSegment = $this->compileSegment($compileID);

                }

                if (isset($returnID))
                    return $returnID;
                else
                    return false;
            
           }


           public function addUpdateSegmentConditions($segmentID=-1,$conditions=array()){

                if ($segmentID > 0 && is_array($conditions)){

                    // lazy - here I NUKE all existing conditions then readd...
                    $this->removeSegmentConditions($segmentID);

                        if (is_array($conditions) && count($conditions) > 0){

                            $retConditions = array();

                            foreach ($conditions as $sCondition){


                                $newConditionID = $this->addUpdateSegmentCondition(-1,$segmentID,$sCondition);

                                if (!empty($newConditionID)){

                                    // new condition added, insert
                                    $retConditions[$newConditionID] = $sCondition;

                                } else {

                                    // error inserting condition?!
                                    return false;

                                }

                            }

                            return $retConditions;

                        }


                } 

                return array();

           }

           /**
             * 
             */
            public function addUpdateSegmentCondition($conditionID=-1,$segmentID=-1,$conditionDetails=array()){

                global $ZBSCRM_t,$wpdb;

                #} Check/build empty condition details
                $condition = array(
                    'type' => '',
                    'operator' => '',
                    'val' => '',
                    'valsecondary' => ''
                );
                if (isset($conditionDetails['type'])) $condition['type'] = $conditionDetails['type'];
                if (isset($conditionDetails['value'])) $condition['val'] = $conditionDetails['value'];
                if (isset($conditionDetails['operator']) && $conditionDetails['operator'] !== -1) $condition['operator'] = $conditionDetails['operator'];
                if (isset($conditionDetails['value2'])) $condition['valsecondary'] = $conditionDetails['value2'];

                // update or insert?
                if ($conditionID > 0){

                    #} Update a segment condition

                        #} update line
                        if ($wpdb->update( 
                            $ZBSCRM_t['segmentsconditions'], 
                            array( 
                                'zbscondition_segmentid' => $segmentID,
                                'zbscondition_type' => $condition['type'],
                                'zbscondition_op' => $condition['operator'],
                                'zbscondition_val' => $condition['val'],
                                'zbscondition_val_secondary' => $condition['valsecondary']
                            ), 
                            array( // where
                                'ID' => $conditionID
                                ),
                            array( 
                                '%d', 
                                '%s',
                                '%s',
                                '%s',
                                '%s'
                            ),
                            array(
                                '%d'
                                )
                            ) !== false){

                            return $conditionID;

                        } else {

                            // could not update?!
                            return false;

                        }
                    

                } else {

                    #} Add a new segmentcondition


                        #} Add condition line
                        if ($wpdb->insert( 
                            $ZBSCRM_t['segmentsconditions'], 
                            array( 
                                'zbscondition_segmentid' => $segmentID,
                                'zbscondition_type' => $condition['type'],
                                'zbscondition_op' => $condition['operator'],
                                'zbscondition_val' => $condition['val'],
                                'zbscondition_val_secondary' => $condition['valsecondary']
                            ), 
                            array( 
                                '%d', 
                                '%s',
                                '%s',
                                '%s',
                                '%s'
                            ) 
                        ) > 0){


                            // inserted
                            return $wpdb->insert_id;

                        } else {

                            // could not insert?!
                            return false;

                        }

                } // / new

                return false;

            
           }


           /**
             *  Does the segment have a condition of type x?
             * 
             * @param array segment - segment obj as returned by getSegment(s)
             * @param array condition_type - array of condition types to check for
             */
            public function segmentHasConditionType( $segment = array(), $condition_types = array() ){

                // got a legit segment, and some conditions?
                if ( is_array( $segment ) && isset( $segment['conditions'] ) && is_array( $segment['conditions'] ) && is_array( $condition_types ) ){

                    // cycle through segment conditions & check
                    foreach ( $segment['conditions'] as $condition ){

                        if ( in_array( $condition['type'], $condition_types ) ) return true;

                    }


                }

                return false;
                
            }

           /**
             *  empty all conditions against seg
             */
            public function removeSegmentConditions($segmentID=-1){

                if (!empty($segmentID)) {

                    global $ZBSCRM_t,$wpdb;

                    return $wpdb->delete( 
                                $ZBSCRM_t['segmentsconditions'], 
                                array( // where
                                    'zbscondition_segmentid' => $segmentID
                                    ),
                                array(
                                    '%d'
                                    )
                                );

                }

                return false;
            
           }



           /**
             * Segment rules
             * takes a condition + returns a contact dal2 get arr param
             * 
             */
            public function segmentConditionArgs($condition=array(),$conditionKeySuffix=''){

                if (is_array($condition) && isset($condition['type']) && isset($condition['operator'])){

                    global $zbs,$wpdb,$ZBSCRM_t;

			if ( ! empty( $condition['type'] ) ) {
				// normalise type string
				$condition_type  = preg_replace( '/^zbsc_/', '', $condition['type'] );
				$filter_tag = $this->makeSlug( $condition_type ) . '_zbsSegmentArgumentBuild';

				$potential_args = apply_filters( $filter_tag, false, $condition, $conditionKeySuffix ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				// got anything back?

				if ( $potential_args !== false ) {
					return $potential_args;
				}
			}

			switch ( $condition['type'] ) {

                        case 'status':
                        case 'zbsc_status':

                        /* while this is right, it doesn't allow for MULTIPLE status cond lines, so do via sql:
                            if ($condition['operator'] == 'equal')
                                return array('hasStatus'=>$condition['value']);
                            else
                                return array('otherStatus'=>$condition['value']);
                        */
                            if ($condition['operator'] == 'equal')
                                return array('additionalWhereArr'=>
                                            array('statusEqual'.$conditionKeySuffix=>array("zbsc_status",'=','%s',$condition['value']))
                                        );
                            else
                                return array('additionalWhereArr'=>
                                            array('statusEqual'.$conditionKeySuffix=>array("zbsc_status",'<>','%s',$condition['value']))
                                        );

                            break;

                        case 'fullname': // 'equal','notequal','contains'

                            if ($condition['operator'] == 'equal')
                                return array('additionalWhereArr'=>
                                            array('fullnameEqual'.$conditionKeySuffix=>array("CONCAT(zbsc_fname,' ',zbsc_lname)",'=','%s',$condition['value']))
                                        );
                            elseif ($condition['operator'] == 'notequal')
                                return array('additionalWhereArr'=>
                                            array('fullnameEqual'.$conditionKeySuffix=>array("CONCAT(zbsc_fname,' ',zbsc_lname)",'<>','%s',$condition['value']))
                                        );
                            elseif ($condition['operator'] == 'contains')
                                return array('additionalWhereArr'=>
                                            array('fullnameEqual'.$conditionKeySuffix=>array("CONCAT(zbsc_fname,' ',zbsc_lname)",'LIKE','%s','%'.$condition['value'].'%'))
                                        );
                            break;

                        case 'email':
                        case 'zbsc_email':

                            if ($condition['operator'] == 'equal'){
                                // while this is right, it doesn't allow for MULTIPLE status cond lines, so do via sql:
                                // return array('hasEmail'=>$condition['value']);
                                /* // this was good, but was effectively AND
                                return array('additionalWhereArr'=>
                                            array(
                                                'email'.$conditionKeySuffix=>array('zbsc_email','=','%s',$condition['value']),
                                                'emailAKA'.$conditionKeySuffix=>array('ID','IN',"(SELECT aka_id FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_CONTACT." AND aka_alias = %s)",$condition['value'])
                                                )
                                        );
                                */
                                // This was required to work with OR (e.g. postcode 1 = x or postcode 2 = x)
                                // -----------------------
                                // This generates a query like 'zbsc_fname LIKE %s OR zbsc_lname LIKE %s', 
                                // which we then need to include as direct subquery
                                /* THIS WORKS: but refactored below
                                $conditionQArr = $this->buildWheres(array(
                                                                    'email'.$conditionKeySuffix=>array('zbsc_email','=','%s',$condition['value']),
                                                                    'emailAKA'.$conditionKeySuffix=>array('ID','IN',"(SELECT aka_id FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_CONTACT." AND aka_alias = %s)",$condition['value'])
                                                                    ),'',array(),'OR',false);
                                if (is_array($conditionQArr) && isset($conditionQArr['where']) && !empty($conditionQArr['where'])){                                    
                                    return array('additionalWhereArr'=>array('direct'=>array(array('('.$conditionQArr['where'].')',$conditionQArr['params']))));
                                }
                                return array();
                                */
                                // this way for OR situations
                                return $this->segmentBuildDirectOrClause(array(
                                                                    'email'.$conditionKeySuffix=>array('zbsc_email','=','%s',$condition['value']),
                                                                    'emailAKA'.$conditionKeySuffix=>array('ID','IN',"(SELECT aka_id FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_CONTACT." AND aka_alias = %s)",$condition['value'])
                                                                    ),'OR');
                                // -----------------------
                            } elseif ($condition['operator'] == 'notequal')
                                return array('additionalWhereArr'=>
                                            array(
                                                'notEmail'.$conditionKeySuffix=>array('zbsc_email','<>','%s',$condition['value']),
                                                'notEmailAka'.$conditionKeySuffix=>array('ID','NOT IN',"(SELECT aka_id FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_CONTACT." AND aka_alias = %s)",$condition['value'])
                                                )
                                        );
                            elseif ($condition['operator'] == 'contains')
                                return array('additionalWhereArr'=>
                                            array('emailContains'.$conditionKeySuffix=>array("zbsc_email",'LIKE','%s','%'.$condition['value'].'%'))
                                        );

							break;

                        // TBA (When DAL2 trans etc.)
                        case 'totalval': // 'equal','notequal','larger','less','floatrange'

                            break;

                        case 'dateadded': // 'before','after','daterange','datetimerange','beforeequal','afterequal','previousdays'

                            // date added
                            if ($condition['operator'] == 'before')
                                return array('additionalWhereArr'=>
                                            array('olderThan'.$conditionKeySuffix=>array('zbsc_created','<','%d',$condition['value']))
                                        );
                            elseif ($condition['operator'] == 'beforeequal')
                                return array('additionalWhereArr'=>
                                            array( 'olderThanEqual' . $conditionKeySuffix => array( 'zbsc_created', '<=', '%d', $condition['value'] ) )
                                        );
                            elseif ($condition['operator'] == 'after')
                                return array('additionalWhereArr'=>
                                            array('newerThan'.$conditionKeySuffix=>array('zbsc_created','>','%d',$condition['value']))
                                        );
                            elseif ($condition['operator'] == 'afterequal')
                                return array('additionalWhereArr'=>
                                            array( 'newerThanEqual' . $conditionKeySuffix => array( 'zbsc_created', '>=', '%d', $condition['value'] ) )
                                        );
                            elseif (
                                        $condition['operator'] == 'daterange'
                                        ||
                                        $condition['operator'] == 'datetimerange'
                                    ){

                                $before = false; $after = false;
                                // split out the value 
                                if (isset($condition['value']) && !empty($condition['value'])) $after = (int)$condition['value'];
                                if (isset($condition['value2']) && !empty($condition['value2'])) $before = (int)$condition['value2'];

                                // while this is right, it doesn't allow for MULTIPLE status cond lines, so do via sql:
                                // return array('newerThan'=>$after,'olderThan'=>$before);
                                return array('additionalWhereArr'=>
                                            array(
                                                'newerThan' . $conditionKeySuffix => array( 'zbsc_created', '>=', '%d', $condition['value'] ),
                                                'olderThan' . $conditionKeySuffix => array( 'zbsc_created', '<=', '%d', $condition['value2'] )
                                            )
                                        );
                            } elseif ($condition['operator'] == 'previousdays'){

                                $days_value = (int)$condition['value'];
                                $midnight = strtotime( "midnight" );
                                $previous_days_uts = $midnight - ( ( 60 * 60 * 24 ) * $days_value );

                                return array('additionalWhereArr'=>
                                            array(
                                                'newerThanPreviousDays' . $conditionKeySuffix => array( 'zbsc_created', '<=', '%d', time() ),
                                                'olderThanPreviousDays' . $conditionKeySuffix => array( 'zbsc_created', '>=', '%d', $previous_days_uts )
                                            )
                                        );
                            }   

                            break;

                        case 'datelastcontacted': // 'before','after','daterange','datetimerange','beforeequal','afterequal','previousdays'

                            // contactedAfter
                            if ($condition['operator'] == 'before') // datetime
                                return array('additionalWhereArr'=>
                                            array('contactedBefore'.$conditionKeySuffix=>array('zbsc_lastcontacted','<','%d',$condition['value']))
                                        );
                            elseif ($condition['operator'] == 'beforeequal') // date
                                return array('additionalWhereArr'=>
                                            array( 'contactedBeforeEqual' . $conditionKeySuffix => array( 'zbsc_lastcontacted', '<=', '%d', $condition['value'] ) )
                                        );
                            elseif ($condition['operator'] == 'after') //datetime
                                return array('additionalWhereArr'=>
                                            array('contactedAfter'.$conditionKeySuffix=>array('zbsc_lastcontacted','>','%d',$condition['value']))
                                        );
                            elseif ($condition['operator'] == 'afterequal') // date
                                return array('additionalWhereArr'=>
                                            array( 'contactedAfterEqual' . $conditionKeySuffix => array( 'zbsc_lastcontacted', '>=', '%d', $condition['value'] ) )
                                        );
                            elseif (
                                        $condition['operator'] == 'daterange'
                                        ||
                                        $condition['operator'] == 'datetimerange'
                                    ){

                                $before = false; $after = false;
                                // split out the value 
                                if (isset($condition['value']) && !empty($condition['value'])) $after = (int)$condition['value'];
                                if (isset($condition['value2']) && !empty($condition['value2'])) $before = (int)$condition['value2'];

                                // while this is right, it doesn't allow for MULTIPLE status cond lines, so do via sql:
                                // return array('contactedAfter'=>$after,'contactedBefore'=>$before);
                                return array('additionalWhereArr'=>
                                            array(
                                                'contactedAfter'.$conditionKeySuffix=>array('zbsc_lastcontacted','>=','%d',$after),
                                                'contactedBefore'.$conditionKeySuffix=>array('zbsc_lastcontacted','<=','%d',$before)
                                            )
                                        );
                            } elseif ( $condition['operator'] == 'previousdays' ){

                                $days_value = (int)$condition['value'];
                                $previous_days_uts = strtotime( "-" . $days_value . " days" );

                                return array('additionalWhereArr'=>
                                            array(
                                                'contactedAfterPreviousDays' . $conditionKeySuffix => array( 'zbsc_lastcontacted', '<=', '%d', time() ),
                                                'contactedBeforePreviousDays' . $conditionKeySuffix => array( 'zbsc_lastcontacted', '>=', '%d', $previous_days_uts )
                                            )
                                        );
                            }

                            break;

                        case 'tagged': // 'tag'

                            // while this is right, it doesn't allow for MULTIPLE status cond lines, so do via sql:
                            // return array('isTagged'=>$condition['value']);
                            // NOTE
                            // ... this is a DIRECT query, so format for adding here is a little diff
                            // ... and only works (not overriding existing ['direct']) because the calling func of this func has to especially copy separately
                            return array('additionalWhereArr'=>
                                            array('direct' => array(
                                                array('(SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = contact.ID AND zbstl_tagid = %d) > 0',array(ZBS_TYPE_CONTACT,$condition['value']))
                                                )
                                            )
                                        );                        

                            break;

                        case 'nottagged': // 'tag'

                            // while this is right, it doesn't allow for MULTIPLE status cond lines, so do via sql:
                            // return array('isNotTagged'=>$condition['value']);

                            // NOTE
                            // ... this is a DIRECT query, so format for adding here is a little diff
                            // ... and only works (not overriding existing ['direct']) because the calling func of this func has to especially copy separately
                            return array('additionalWhereArr'=>
                                            array('direct' => array(
                                                array('(SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = contact.ID AND zbstl_tagid = %d) = 0',array(ZBS_TYPE_CONTACT,$condition['value']))
                                                )
                                            )
                                        ); 
                            break;

				default:
					break;

			}
		}

                // if we get here we've failed to create any arguments for this condiition
                // ... to avoid scenarios such as mail campaigns going out to 'less filtered than intended' audiences
                // ... we throw an error
                $this->error_condition_exception( 
                    'segment_condition_produces_no_args', 
                    __( 'Segment Condition produces no filtering arguments', 'zero-bs-crm'), 
                    array( 'condition' => $condition )
                 );

                return false;

           }

            // ONLY USED FOR SEGMENT SQL BUILING CURRENTLY, deep.
            // -----------------------
            // This was required to work with OR (e.g. postcode 1 = x or postcode 2 = x)
            // -----------------------
            // This generates a query like 'zbsc_fname LIKE %s OR zbsc_lname LIKE %s', 
            // which we then need to include as direct subquery
            public function segmentBuildDirectOrClause($directQueries=array(),$andOr='OR'){
            /* this works, in segmentConditionArgs(), adapted below to fit generic func to keep it DRY
                $conditionQArr = $this->buildWheres(array(
                                                    'email'.$conditionKeySuffix=>array('zbsc_email','=','%s',$condition['value']),
                                                    'emailAKA'.$conditionKeySuffix=>array('ID','IN',"(SELECT aka_id FROM ".$ZBSCRM_t['aka']." WHERE aka_type = ".ZBS_TYPE_CONTACT." AND aka_alias = %s)",$condition['value'])
                                                    ),'',array(),'OR',false);
                if (is_array($conditionQArr) && isset($conditionQArr['where']) && !empty($conditionQArr['where'])){                                    
                    return array('additionalWhereArr'=>array('direct'=>array(array('('.$conditionQArr['where'].')',$conditionQArr['params']))));
                }
                return array();

            */
                $directArr = $this->buildWheres($directQueries,'',array(),$andOr,false);
                if (is_array($directArr) && isset($directArr['where']) && !empty($directArr['where'])){                                    
                    return array('additionalWhereArr'=>array('direct'=>array(array('('.$directArr['where'].')',$directArr['params']))));
                }
                return array();
            }


           /**
             *  Compile a segment ()
             */
            public function compileSegment($segmentID=-1){

                if ( !empty( $segmentID ) ) {

                    // 'GET' the segment count without paging limits
                    // ... this func then automatically updates the compile record, so nothing to do :) 
                    return $this->getSegementAudience($segmentID,-1,-1,'ID','DESC',true);

                }

                return false;
            
           }

           /**
             *  Throw an exception
             */
            protected function error_condition_exception($code, $message, $data){

                throw new Segment_Condition_Exception( $code, $message, $data );

           }



           /**
             *  Checks that a segment audience can be compiled or if it has any outstanding errors
             *  ... returning as a string if so.
             *  ... for now this is done via a setting, later we should build an error stack via DAL #refined-error-stack
             */
            public function segment_error( $segment_id ){
                
                global $zbs;

                // sanitise and check
                $segment_id = (int)$segment_id;
                if ( $segment_id <= 0 ) return '';

                // Retrieve any setting value
                return $zbs->settings->get( 'segment-error-' . $segment_id );

           }

           /**
             *  Updates any stored segment audience error
             *  ... for now this is done via a setting, later we should build an error stack via DAL #refined-error-stack
             */
            public function add_segment_error( $segment_id, $error_string ){
                
                global $zbs;

                // sanitise and check
                $segment_id = (int)$segment_id;
                if ( $segment_id <= 0 ) return false;

                // Set segment area error notice
                $zbs->settings->update( 'segment-error-' . $segment_id, $error_string );                

           }


           /**
             *  Removes any stored segment audience error
             *  ... for now this is done via a setting, later we should build an error stack via DAL #refined-error-stack
             */
            public function remove_segment_error( $segment_id ){
    
                global $zbs;

                // sanitise and check
                $segment_id = (int)$segment_id;
                if ( $segment_id <= 0 ) return false;

                // Remove any segment area error notice
                $zbs->settings->delete( 'segment-error-' . $segment_id );                

           }


           /**
             *  Flags up a segment error where a used condition was missing in building a segment
             *
             * @param int - Segment ID
             * @param Exception - the related exception
             */
           public function segment_error_condition_missing( $segmentID, $exception ){

                // Not all conditions were able to produce arguments
                // Here we are best to return an empty audience and alert the admin
                // e.g. building a segment for a mail campaign without all conditions 
                // and sending to a larger-than-expected audience is more dangerous than sending to zero.
                $error_string =  $exception->get_error_code();

                // Set an admin notification to warn admin (max once every 2 days)                        
                $transient_flag = get_transient( 'crm-segment-condition-missing-arg' );
                if ( !$transient_flag ){

                    // insert notification
                    zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'segments.orphaned.conditions', 'segmentconditionmissing' );
                    
                    // set transient
                    set_transient( 'crm-segment-condition-missing-arg', 1, 24 * 2 * HOUR_IN_SECONDS );

                }

                // Set segment area error notice
                $this->add_segment_error( $segmentID, $error_string );
           }


           /**
             *  Migrates a superseded condition in the db to an up to date condition key
             *
             * @param string $superseded_key - the key of the old condition which has been replaced
             * @param string $new_key - the key to replace it with
             */
           public function migrate_superseded_condition( $superseded_key, $new_key ){

                global $zbs, $ZBSCRM_t, $wpdb;

                // very short and brutal. Ignores any ownership
                $query = "UPDATE " . $ZBSCRM_t['segmentsconditions'] . " SET zbscondition_type = %s WHERE zbscondition_type = %s";
                $q = $wpdb->prepare( $query, array( $new_key, $superseded_key ) );
                return $wpdb->query( $q );

           }




        

    // =========== / SEGMENTS      ===================================================
    // ===============================================================================
} // / class
