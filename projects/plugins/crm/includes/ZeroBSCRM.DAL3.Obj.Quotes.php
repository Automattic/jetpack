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
* ZBS DAL >> Quotes
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_quotes extends zbsDAL_ObjectLayer {

	protected $objectType = ZBS_TYPE_QUOTE;
    protected $objectDBPrefix = 'zbsq_';
    protected $include_in_templating = true;
	protected $objectModel = array(

		// ID
		'ID' => array('fieldname' => 'ID', 'format' => 'int'),

		// site + team generics
		'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
		'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
		'zbs_owner' => array('fieldname' => 'zbs_owner', 'format' => 'int'),

		// other fields
		'id_override'      => array(
				'fieldname' => 'zbsq_id_override',
				'format' => 'str',
	            'max_len' => 128
		),
        'title'            => array(
                // db model:
                'fieldname' => 'zbsq_title', 'format' => 'str',
	            // output model
	            'input_type' => 'text',
	            'label' => 'Quote Title',
	            'placeholder'=> 'e.g. New Website',
	            'essential' => true,
	            'dal1key' => 'name',
            	'max_len' => 255
        ),
        'currency'         => array(
        		'fieldname' => 'zbsq_currency',
        		'format' => 'curr',
            	'max_len' => 4
        	),
        'value'            => array(
                // db model:
                'fieldname' => 'zbsq_value', 'format' => 'decimal',
	            // output model
	            'input_type' => 'price',
	            'label' => 'Quote Value',
	            'placeholder'=> 'e.g. 500.00',
	            'essential' => true,
	            'dal1key' => 'val'
        ),
        'date'            => array(
                // db model:
                'fieldname' => 'zbsq_date', 'format' => 'uts',
                'autoconvert'=>'date', // NOTE autoconvert makes buildObjArr autoconvert from a 'date' using localisation rules, to a GMT timestamp (UTS)
	            // output model
	            'input_type' => 'date',
	            'label' => 'Quote Date',
	            'placeholder'=>'',
	            'essential' => true
        ), 
		'template'            => array('fieldname' => 'zbsq_template', 'format' => 'str'),
        'content'            => array('fieldname' => 'zbsq_content', 'format' => 'str'),
        'notes'            => array(
                // db model:
                'fieldname' => 'zbsq_notes', 'format' => 'str',
	            // output model
	            'input_type' => 'textarea',
	            'label' => 'Notes',
	            'placeholder'=>''

        ),
        'send_attachments' => array('fieldname' => 'zbsq_send_attachments', 'format' => 'bool'), // note, from 4.0.9 we removed this from the front-end ui as we now show a modal option pre-send allowing user to chose which pdf's to attach
		'hash' => array('fieldname' => 'zbsq_hash', 'format' => 'str'),
		'lastviewed' => array('fieldname' => 'zbsq_lastviewed', 'format' => 'uts'),
		'viewed_count' => array('fieldname' => 'zbsq_viewed_count', 'format' => 'int'),
		'accepted' => array('fieldname' => 'zbsq_accepted', 'format' => 'uts'),
		'acceptedsigned' => array(
				'fieldname' => 'zbsq_acceptedsigned', 
				'format' => 'str',
	            'max_len' => 200
		),
		'acceptedip' => array(
				'fieldname' => 'zbsq_acceptedip',
				'format' => 'str',
	            'max_len' => 64
		),
		'created' => array('fieldname' => 'zbsq_created', 'format' => 'uts'),
		'lastupdated' => array('fieldname' => 'zbsq_lastupdated', 'format' => 'uts'),
		
		);

	    // hardtyped list of types this object type is commonly linked to
	    protected $linkedToObjectTypes = array(

	    	ZBS_TYPE_CONTACT

	    );


	function __construct($args=array()) {


		#} =========== LOAD ARGS ==============
		$defaultArgs = array(

			//'tag' => false,

		); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
		#} =========== / LOAD ARGS =============


	}

	// ===============================================================================
	// ===========   QUOTE  =======================================================

    // generic get Company (by ID)
    // Super simplistic wrapper used by edit page etc. (generically called via dal->contacts->getSingle etc.)
    public function getSingle($ID=-1){

        return $this->getQuote($ID);

    }

    // generic get (by ID list)
    // Super simplistic wrapper used by MVP Export v3.0
    public function getIDList($IDs=false){

        return $this->getQuotes(array(
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

        return $this->getQuotes(array(
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

        return $this->getQuotes(array(
            'count'  => true,
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
	/**
	 * returns full quote line +- details
	 *
	 * @param int id        quote id
	 * @param array $args   Associative array of arguments
	 *
	 * @return array quote object
	 */
	public function getQuote($id=-1,$args=array()){

		global $zbs;

		#} =========== LOAD ARGS ==============
		$defaultArgs = array(

			// if these are passed, will search based on these 
			'id_override'       => false,
			'externalSource'    => false,
			'externalSourceUID' => false,
            'hash'              => false,

			// with what?
			'withLineItems'     => true,
			'withCustomFields'  => true,
            'withAssigned'      => true, // return ['contact'] & ['company'] objs if has link
			'withTags'          => false,
			'withFiles'          => false,
			'withOwner'         => false,

			// permissions
			'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE), // this'll let you not-check the owner of obj

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
					$custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_QUOTE));

					#} Cycle through + build into query
					if (is_array($custFields)) foreach ($custFields as $cK => $cF){

						// add as subquery
						$extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = quote.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) '".$cK."'";
						
						// add params
						$params[] = $cK; $params[] = ZBS_TYPE_QUOTE;

					}

				}

				$selector = 'quote.*';
				if (isset($fields) && is_array($fields)) {
					$selector = '';

					// always needs id, so add if not present
					if (!in_array('ID',$fields)) $selector = 'quote.ID';

					foreach ($fields as $f) {
						if (!empty($selector)) $selector .= ',';
						$selector .= 'quote.'.$f;
					}
				} else if ($onlyID){
					$selector = 'quote.ID';
				}

			#} ============ / PRE-QUERY ===========


			#} Build query
			$query = "SELECT ".$selector.$extraSelect." FROM ".$ZBSCRM_t['quotes'].' as quote';
			#} ============= WHERE ================

				if (!empty($id) && $id > 0){

					#} Add ID
					$wheres['ID'] = array('ID','=','%d',$id);

				}
				if (!empty($id_override) && $id_override > 0){

					#} Add id_override
					//$wheres['search_id'] = array('ID','LIKE','%s','%'.$id_override.'%');
					$wheres['search_id2'] = array('zbsq_id_override','LIKE','%s','%'.$id_override.'%');

				}
                
                if (!empty($hash)){

                    #} Add hash
                    $wheres['hash'] = array('zbsq_hash','=','%s',$hash);

                }
				
				if (!empty($externalSource) && !empty($externalSourceUID)){

					$wheres['extsourcecheck'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_QUOTE." AND zbss_source = %s AND zbss_uid = %s)",array($externalSource,$externalSourceUID));

				}

			#} ============ / WHERE ==============

			#} Build out any WHERE clauses
			$wheresArr = $this->buildWheres($wheres,$whereStr,$params);
			$whereStr = $wheresArr['where']; $params = $params + $wheresArr['params'];
			#} / Build WHERE

			#} Ownership v1.0 - the following adds SITE + TEAM checks, and (optionally), owner          
			$params = array_merge($params,$this->ownershipQueryVars($ignoreowner)); // merges in any req.
			$ownQ = $this->ownershipSQL($ignoreowner,'quote'); if (!empty($ownQ)) $additionalWhere = $this->spaceAnd($additionalWhere).$ownQ; // adds str to query
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
						$res = $this->tidy_quote($potentialRes,$withCustomFields);
					}

					if ($withLineItems){

						// add all line item lines
						$res['lineitems'] = $this->DAL()->lineitems->getLineitems(array('associatedObjType'=>ZBS_TYPE_QUOTE,'associatedObjID'=>$potentialRes->ID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_LINEITEM)));
					
					}
					
                    if ($withAssigned){

                        /* This is for MULTIPLE (e.g. multi contact/companies assigned to an inv)

                            // add all assigned contacts/companies
                            $res['contacts'] = $this->DAL()->contacts->getContacts(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_QUOTE,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $res['companies'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_QUOTE,
                                'hasObjIDLinkedTo'=>$resDataLine->ID,
                                'perPage'=>-1,
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                        .. but we use 1:1, at least now: */

                            // add all assigned contacts/companies
                            $res['contact'] = $this->DAL()->contacts->getContacts(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_QUOTE,
                                'hasObjIDLinkedTo'=>$potentialRes->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                            $res['company'] = $this->DAL()->companies->getCompanies(array(
                                'hasObjTypeLinkedTo'=>ZBS_TYPE_QUOTE,
                                'hasObjIDLinkedTo'=>$potentialRes->ID,
                                'page' => 0,
                                'perPage'=>1, // FORCES 1
                                'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                    
                    }

                    if ($withFiles){

                        $res['files'] = zeroBSCRM_files_getFiles('quote',$potentialRes->ID);
                        
                    }

					if ($withTags){

						// add all tags lines
						$res['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_QUOTE,'objid'=>$potentialRes->ID));
					
					}

					return $res;

			}

		} // / if ID

		return false;

	}

	/**
	 * returns quote detail lines
	 *
	 * @param array $args Associative array of arguments
	 *
	 * @return array of quote lines
	 */
	public function getQuotes($args=array()){

		global $zbs;

		#} ============ LOAD ARGS =============
		$defaultArgs = array(

			// Search/Filtering (leave as false to ignore)
			'searchPhrase'  => '', // searches id, id override, title, content
			'inArr'             => false,
			'isTagged'          => false, // 1x INT OR array(1,2,3)
			'isNotTagged'       => false, // 1x INT OR array(1,2,3)
			'ownedBy'           => false,
			'externalSource'    => false, // e.g. paypal
			'olderThan'         => false, // uts
			'newerThan'         => false, // uts
			'hasAccepted'         => false, // if TRUE only returns accepted
			'hasNotAccepted'       => false, // if TRUE only returns not-accepted
			'assignedContact'	=> false, // assigned to contact id (int)
			'assignedCompany'	=> false, // assigned to company id (int)
            'quickFilters'      => false, // booo

			// returns
			'count'             => false,
			'withLineItems'     => true,
			'withCustomFields'  => true,
			'withTags'          => false,
			'withOwner'         => false,
            'withAssigned'      => false, // return ['contact'] & ['company'] objs if has link
            'withFiles'         => false,
            'suppressContent'	=> false, // do not return html
            'onlyColumns'       => false, // if passed (array('fname','lname')) will return only those columns (overwrites some other 'return' options). NOTE: only works for base fields (not custom fields)

			'sortByField'   => 'ID',
			'sortOrder'     => 'ASC',
			'page'          => 0, // this is what page it is (gets * by for limit)
			'perPage'       => 100,
			'whereCase'          => 'AND', // DEFAULT = AND

			// permissions
			'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE), // this'll let you not-check the owner of obj


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
				$withFiles = false;
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
					$withFiles = false;
					$withOwner = false;
	                $withAssigned = false;

                } else {

                    // deny
                    $onlyColumns = false;

                }


            }

			#} Custom Fields
			if ($withCustomFields){
				
				#} Retrieve any cf
				$custFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_QUOTE));

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
					$extraSelect .= ',(SELECT zbscf_objval FROM '.$ZBSCRM_t['customfields']." WHERE zbscf_objid = quote.ID AND zbscf_objkey = %s AND zbscf_objtype = %d LIMIT 1) ".$cKey;
					
					// add params
					$params[] = $cK; $params[] = ZBS_TYPE_QUOTE;

				}

			}

		#} ============ / PRE-QUERY ===========

		#} Build query
		$query = "SELECT quote.*".$extraSelect." FROM ".$ZBSCRM_t['quotes'].' as quote'.$joinQ;

		#} Count override
		if ($count) $query = "SELECT COUNT(quote.ID) FROM ".$ZBSCRM_t['quotes'].' as quote'.$joinQ;

        #} onlyColumns override
        if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

            $columnStr = '';
            foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                if (!empty($columnStr)) $columnStr .= ',';
                // this presumes str is db-safe? could do with sanitation?
                $columnStr .= $colDBKey;

            }

            $query = "SELECT ".$columnStr." FROM ".$ZBSCRM_t['quotes'].' as quote'.$joinQ;

        }

		#} ============= WHERE ================

			#} Add Search phrase
			if (!empty($searchPhrase)){

				// search? - ALL THESE COLS should probs have index of FULLTEXT in db?
				$searchWheres = array();
				$searchWheres['search_id'] = array('ID','LIKE','%s','%'.$searchPhrase.'%');
				$searchWheres['search_id_override'] = array('zbsq_id_override','LIKE','%s','%'.$searchPhrase.'%');
				$searchWheres['search_title'] = array('zbsq_title','LIKE','%s','%'.$searchPhrase.'%');
				$searchWheres['search_content'] = array('zbsq_content','LIKE','%s','%'.$searchPhrase.'%');

                // 3.0.13 - Added ability to search custom fields (optionally)
                $customFieldSearch = zeroBSCRM_getSetting('customfieldsearch');
                if ($customFieldSearch == 1){
                
                    // simplistic add
                    // NOTE: This IGNORES ownership of custom field lines.
                    $searchWheres['search_customfields'] = array('ID','IN',"(SELECT zbscf_objid FROM ".$ZBSCRM_t['customfields']." WHERE zbscf_objval LIKE %s AND zbscf_objtype = ".ZBS_TYPE_QUOTE.")",'%'.$searchPhrase.'%');

                }

				// This generates a query like 'zbsq_fname LIKE %s OR zbsq_lname LIKE %s', 
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
				$wheres['externalsource'] = array('ID','IN','(SELECT DISTINCT zbss_objid FROM '.$ZBSCRM_t['externalsources']." WHERE zbss_objtype = ".ZBS_TYPE_QUOTE." AND zbss_source = %s)",$externalSource);

			}

			// quick addition for mike
			#} olderThan
			if (!empty($olderThan) && $olderThan > 0 && $olderThan !== false) $wheres['olderThan'] = array('zbsq_created','<=','%d',$olderThan);
			#} newerThan
			if (!empty($newerThan) && $newerThan > 0 && $newerThan !== false) $wheres['newerThan'] = array('zbsq_created','>=','%d',$newerThan);

			// status
			if (!empty($hasAccepted) && $hasAccepted) $wheres['hasAccepted'] = array('zbsq_accepted','>','%d',0);
			if (!empty($hasNotAccepted) && $hasNotAccepted) $wheres['hasnotAccepted'] = array('zbsq_accepted','<=','%d',0);

            // assignedContact + assignedCompany
            if (!empty($assignedContact) && $assignedContact !== false && $assignedContact > 0) $wheres['assignedContact'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_QUOTE." AND zbsol_objtype_to = ".ZBS_TYPE_CONTACT." AND zbsol_objid_to = %d)",$assignedContact);
            if (!empty($assignedCompany) && $assignedCompany !== false && $assignedCompany > 0) $wheres['assignedCompany'] = array('ID','IN','(SELECT zbsol_objid_from FROM '.$ZBSCRM_t['objlinks']." WHERE zbsol_objtype_from = ".ZBS_TYPE_QUOTE." AND zbsol_objtype_to = ".ZBS_TYPE_COMPANY." AND zbsol_objid_to = %d)",$assignedCompany);

            #} Quick filters - adapted from DAL1 (probs can be slicker)
            if (is_array($quickFilters) && count($quickFilters) > 0){

                // cycle through
                foreach ($quickFilters as $qFilter){

                	/* 
                        // where status = x
                        // USE hasStatus above now...
                        if (substr($qFilter,0,7) == 'status_'){

                            $qFilterStatus = substr($qFilter,7);
                            $qFilterStatus = str_replace('_',' ',$qFilterStatus);

                            // check status
                            $wheres['quickfilterstatus'] = array('zbsq_status','LIKE','%s',ucwords($qFilterStatus));

                        }

                    */

                    #} <3.0 we used firm status's for quotes, now we infer:
                    if ($qFilter == 'status_accepted'){

                    	$wheres['quickfilterstatus'] = array('zbsq_accepted','>','0');

                    }
                    if ($qFilter == 'status_notaccepted'){

                    	$wheres['quickfilterstatus'] = array('zbsq_accepted','<','1');

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
				$wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = quote.ID AND zbstl_tagid = %d) > 0)',array(ZBS_TYPE_QUOTE,$isTagged));

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
					
					$wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = quote.ID AND zbstl_tagid IN (%s)) > 0)',array(ZBS_TYPE_QUOTE,$tagStr));

				}

			}
			#} Is NOT Tagged (expects 1 tag ID OR array)

				// catch 1 item arr
				if (is_array($isNotTagged) && count($isNotTagged) == 1) $isNotTagged = $isNotTagged[0];
				
			if (!is_array($isNotTagged) && !empty($isNotTagged) && $isNotTagged > 0){

				// add where tagged                 
				// 1 int: 
				$wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = quote.ID AND zbstl_tagid = %d) = 0)',array(ZBS_TYPE_QUOTE,$isNotTagged));

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
					
					$wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = quote.ID AND zbstl_tagid IN (%s)) = 0)',array(ZBS_TYPE_QUOTE,$tagStr));

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

                'customer'				=> '(SELECT zbsol_objid_to FROM '.$ZBSCRM_t['objlinks'].' WHERE zbsol_objtype_from = '.ZBS_TYPE_QUOTE.' AND zbsol_objtype_to = '.ZBS_TYPE_CONTACT.' AND zbsol_objid_from = quote.ID)',                           

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
		$ownQ = $this->ownershipSQL($ignoreowner,'quote'); if (!empty($ownQ)) $additionalWhere = $this->spaceAnd($additionalWhere).$ownQ; // adds str to query
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
					$resArr = $this->tidy_quote($resDataLine,$withCustomFields);

                }

				if ($withLineItems){

					// add all line item lines
					$resArr['lineitems'] = $this->DAL()->lineitems->getLineitems(array('associatedObjType'=>ZBS_TYPE_QUOTE,'associatedObjID'=>$resDataLine->ID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_LINEITEM)));
				
				}

                if ($withFiles){

                    $resArr['files'] = zeroBSCRM_files_getFiles('quote',$resDataLine->ID);
                    
                }

				if ($withTags){

					// add all tags lines
					$resArr['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_QUOTE,'objid'=>$resDataLine->ID));

				}

                if ($withAssigned){

                    /* This is for MULTIPLE (e.g. multi contact/companies assigned to an inv)

                        // add all assigned contacts/companies
                        $res['contacts'] = $this->DAL()->contacts->getContacts(array(
                            'hasObjTypeLinkedTo'=>ZBS_TYPE_QUOTE,
                            'hasObjIDLinkedTo'=>$resDataLine->ID,
                            'perPage'=>-1,
                            'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                        $res['companies'] = $this->DAL()->companies->getCompanies(array(
                            'hasObjTypeLinkedTo'=>ZBS_TYPE_QUOTE,
                            'hasObjIDLinkedTo'=>$resDataLine->ID,
                            'perPage'=>-1,
                            'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                    .. but we use 1:1, at least now: */

                        // add all assigned contacts/companies
                        $resArr['contact'] = $this->DAL()->contacts->getContacts(array(
                            'hasObjTypeLinkedTo'=>ZBS_TYPE_QUOTE,
                            'hasObjIDLinkedTo'=>$resDataLine->ID,
                            'page' => 0,
                            'perPage'=>1, // FORCES 1
                            'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

                        $resArr['company'] = $this->DAL()->companies->getCompanies(array(
                            'hasObjTypeLinkedTo'=>ZBS_TYPE_QUOTE,
                            'hasObjIDLinkedTo'=>$resDataLine->ID,
                            'page' => 0,
                            'perPage'=>1, // FORCES 1
                            'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

                
                }

                if ($suppressContent) unset($resArr['content']);

				$res[] = $resArr;

			}
		}

		return $res;
	} 



	/**
	 * Returns a count of quotes (owned)
	 * .. inc by status
	 *
	 * @return int count
	 */
	public function getQuoteCount($args=array()){

		#} ============ LOAD ARGS =============
		$defaultArgs = array(

			// Search/Filtering (leave as false to ignore)
			'withStatus'    => false, // will be str if used

			// permissions
			'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE), // this'll let you not-check the owner of obj

		); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
		#} =========== / LOAD ARGS =============

		$whereArr = array();

		if ($withStatus !== false && !empty($withStatus)) $whereArr['status'] = array('zbsq_status','=','%s',$withStatus);

		return $this->DAL()->getFieldByWHERE(array(
			'objtype' => ZBS_TYPE_QUOTE,
			'colname' => 'COUNT(ID)',
			'where' => $whereArr,
			'ignoreowner' => $ignoreowner));
		
	}

	 /**
	 * adds or updates a quote object
	 *
	 * @param array $args Associative array of arguments
	 *              id (if update), owner, data (array of field data)
	 *
	 * @return int line ID
	 */
	public function addUpdateQuote($args=array()){

		global $ZBSCRM_t,$wpdb,$zbs;
			
		#} Retrieve any cf
		$customFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_QUOTE));
		$addrCustomFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_ADDRESS));

		#} ============ LOAD ARGS =============
		$defaultArgs = array(

			'id'            => -1,
			'owner'         => -1,

			// fields (directly)
			'data'          => array(

				'id_override' => '',
				'title' => '',
				'currency' => '',
				'value' => '',
				'date' => '',
				'template' => '',
				'content' => '',
				'notes' => '',
                'send_attachments' => -1,
				'hash' => '',
				'lastviewed' => '',
				'viewed_count' => '',
				'accepted' => '',
				'acceptedsigned' => '',
				'acceptedip' => '',

				// lineitems:
				'lineitems'     => false, 
				// will be an array of lineitem lines (as per matching lineitem database model)
				// note:    if no change desired, pass "false"
				//          if removal of all/change, pass empty array

				// Note Custom fields may be passed here, but will not have defaults so check isset()

				// obj links:
				'contacts' => false, // array of id's
				'companies' => false, // array of id's

                // tags
                'tags' => -1, // pass an array of tag ids or tag strings
                'tag_mode' => 'replace', // replace|append|remove

				'externalSources' => -1, // if this is an array(array('source'=>src,'uid'=>uid),multiple()) it'll add :)

				// allow this to be set for MS sync, Migrations etc.
				'created' => -1,
				'lastupdated' => '',

			),

			'limitedFields' => -1, // if this is set it OVERRIDES data (allowing you to set specific fields + leave rest in tact)
			// ^^ will look like: array(array('key'=>x,'val'=>y,'type'=>'%s'))

			// this function as DAL1 func did. 
			'extraMeta'     => -1,
			'automatorPassthrough' => -1,

			'silentInsert' => false, // this was for init Migration - it KILLS all IA for newQuote (because is migrating, not creating new :) this was -1 before

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
			// (either as key zbsq_source or source, for example)
			// then switches them into the $data array, for separate update
			// where this'll fall over is if NO normal contact data is sent to update, just custom fields
			if (is_array($limitedFields) && is_array($customFields)){

					//$customFieldKeys = array_keys($customFields);
					$newLimitedFields = array();

					// cycle through
					foreach ($limitedFields as $field){

						// some weird case where getting empties, so added check
						if (isset($field['key']) && !empty($field['key'])){ 

							$dePrefixed = ''; if (substr($field['key'],0,strlen('zbsq_')) === 'zbsq_') $dePrefixed = substr($field['key'], strlen('zbsq_'));

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
			if (!user_can($owner,'admin_zerobs_usr')) $owner = -1;

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
						$dbData = $this->db_ready_quote($data);
						//unset($dbData['id']); // this is unset because we use $id, and is update, so not req. legacy issue
						//unset($dbData['created']); // this is unset because this uses an obj which has been 'updated' against original details, where created is output in the WRONG format :)

						$origData = $data; //$data = array();               
						$limitedData = array(); // array(array('key'=>'zbsq_x','val'=>y,'type'=>'%s'))

						// cycle through + translate into limitedFields (removing any blanks, or arrays (e.g. externalSources))
						// we also have to remake a 'faux' data (removing blanks for tags etc.) for the post-update updates
						foreach ($dbData as $k => $v){

							$intV = (int)$v;

							// only add if valuenot empty
							if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){

								// add to update arr
								$limitedData[] = array(
									'key' => 'zbsq_'.$k, // we have to add zbsq_ here because translating from data -> limited fields
									'val' => $v,
									'type' => $this->getTypeStr('zbsq_'.$k)
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
            $was_accepted_before = $this->getQuoteAccepted( $id );

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
				if (!isset($dataArr['zbsq_lastupdated'])){ $dataArr['zbsq_lastupdated'] = time(); $typeArr[] = '%d'; }

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

									
								'zbsq_id_override' => $data['id_override'],
								'zbsq_title' => $data['title'],
								'zbsq_currency' => $data['currency'],
								'zbsq_value' => $data['value'],
								'zbsq_date' => $data['date'],
								'zbsq_template' => $data['template'],
								'zbsq_content' => $data['content'],
								'zbsq_notes' => $data['notes'],
								'zbsq_send_attachments' => $data['send_attachments'],
								'zbsq_hash' => $data['hash'],
								'zbsq_lastviewed' => $data['lastviewed'],
								'zbsq_viewed_count' => $data['viewed_count'],
								'zbsq_accepted' => $data['accepted'],
								'zbsq_acceptedsigned' => $data['acceptedsigned'],
								'zbsq_acceptedip' => $data['acceptedip'],
								'zbsq_lastupdated' => time(),

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
								'%d', // send_attachment
								'%s',
								'%d',
								'%d',
								'%d',
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
						$dataArr['zbsq_created'] = $data['created'];$typeArr[] = '%d';
					} else {
						$dataArr['zbsq_created'] = time();          $typeArr[] = '%d';
					}


                    // and on new inserts, if no hash passed, it gen's one
                    if (isset($dataArr['zbsq_hash']) && $dataArr['zbsq_hash'] == '') $dataArr['zbsq_hash'] = zeroBSCRM_generateHash(20);

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

			/* WH included this "for now" - status change for IA, not sure if used for this obj,?

				#} Check if obj exists (here) - for now just brutal update (will error when doesn't exist)
				$originalStatus = $this->getQuoteStatus($id);

				// log any change of status
				if (isset($dataArr['zbsq_status']) && !empty($dataArr['zbsq_status']) && !empty($originalStatus) && $dataArr['zbsq_status'] != $originalStatus){

					// status change
					$statusChange = array(
						'from' => $originalStatus,
						'to' => $dataArr['zbsq_status']
						);
				}
			*/

				#} Attempt update
				if ($wpdb->update( 
						$ZBSCRM_t['quotes'], 
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
											$this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$id,'objType'=>ZBS_TYPE_QUOTE));

											// addupdate each
											foreach ($data['lineitems'] as $lineitem) {

												// slight rejig of passed so works cleanly with data array style
												$lineItemID = false; if (isset($lineitem['ID'])) $lineItemID = $lineitem['ID'];
												$this->DAL()->lineitems->addUpdateLineitem(array(
													'id'=>$lineItemID,
													'linkedObjType' => ZBS_TYPE_QUOTE,
													'linkedObjID' => $id,
													'data'=>$lineitem
													));

											}

									} else {

										// delete all lineitems
										$this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$id,'objType'=>ZBS_TYPE_QUOTE));

									}


								}

								// / Line Items ==== 


                                // OBJ LINKS - to contacts/companies
                                $this->addUpdateObjectLinks($id,$data['contacts'],ZBS_TYPE_CONTACT); ///13567
                                $this->addUpdateObjectLinks($id,$data['companies'],ZBS_TYPE_COMPANY);
			                    // IA also gets 'againstid' historically, but we'll pass as 'against id's'
			                    $againstIDs = array('contacts'=>$data['contacts'],'companies'=>$data['companies']);

			                    // tags
			                    if (isset($data['tags']) && is_array($data['tags'])) {

			                        $this->addUpdateQuoteTags(
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
											'obj_type_id'      => ZBS_TYPE_QUOTE,
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
														'objtype'   => ZBS_TYPE_QUOTE,
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
									$this->DAL()->updateMeta(ZBS_TYPE_QUOTE,$id,'extra_'.$cleanKey,$v);

									#} Add it to this, which passes to IA
									$confirmedExtraMeta[$cleanKey] = $v;

								}

							}


							#} INTERNAL AUTOMATOR 
							#} & 
							#} FALLBACKS
							// UPDATING CONTACT
							if (!$silentInsert){


								// IA General quote update (2.87+)
								zeroBSCRM_FireInternalAutomator('quote.update',array(
										'id'=>$id,
										'data'=>$data,
			                            'againstids'=>array(),//$againstIDs,
										'extsource'=>false, //$approvedExternalSource,
										'automatorpassthrough'=>$automatorPassthrough, #} This passes through any custom log titles or whatever into the Internal automator recipe.
										'extraMeta'=>$confirmedExtraMeta #} This is the "extraMeta" passed (as saved)
									));

                                // First check if the quote status is new before fire the event
								if ( empty( $was_accepted_before ) && $data['accepted'] ) {

                                    // IA quote.accepted
                                    zeroBSCRM_FireInternalAutomator('quote.accepted', array(
                                        'id' => $id,
                                        'data' => $data,
                                        'againstids' => false,
                                        'extsource' => false,
                                        'automatorpassthrough' => false,
                                        'extraMeta' => $confirmedExtraMeta,
                                    ));
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
						$ZBSCRM_t['quotes'], 
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
								$this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$newID,'objType'=>ZBS_TYPE_QUOTE));

								// addupdate each
								foreach ($data['lineitems'] as $lineitem) {

									// slight rejig of passed so works cleanly with data array style
									$lineItemID = false; if (isset($lineitem['ID'])) $lineItemID = $lineitem['ID'];
									$this->DAL()->lineitems->addUpdateLineitem(array(
										'id'=>$lineItemID,
										'linkedObjType' => ZBS_TYPE_QUOTE,
										'linkedObjID' => $newID,
										'data'=>$lineitem
										));

								}

						} else {

							// delete all lineitems
							$this->DAL()->lineitems->deleteLineItemsForObject(array('objID'=>$newID,'objType'=>ZBS_TYPE_QUOTE));

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

                        $this->addUpdateQuoteTags(
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
								'obj_type_id'      => ZBS_TYPE_QUOTE,
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
											'objtype'   => ZBS_TYPE_QUOTE,
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
							$this->DAL()->updateMeta(ZBS_TYPE_QUOTE,$newID,'extra_'.$cleanKey,$v);

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
						zeroBSCRM_FireInternalAutomator('quote.new',array(
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
	 * adds or updates a quote's tags
	 * ... this is really just a wrapper for addUpdateObjectTags
	 *
	 * @param array $args Associative array of arguments
	 *              id (if update), owner, data (array of field data)
	 *
	 * @return int line ID
	 */
	public function addUpdateQuoteTags($args=array()){

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
                'objtype'   => ZBS_TYPE_QUOTE,
                'objid'     => $id,
                'tag_input' => $tag_input,
                'tags'      => $tags,
                'tagIDs'    => $tagIDs,
                'mode'      => $mode
            )
        );

	}

    /**
     * updates template for a quote
     *
     * @param int id quote ID
     * @param int template ID
     *
     * @return bool
     */
    public function setQuoteTemplate($id=-1,$template=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->addUpdateQuote(array(
                'id'=>$id,
                'limitedFields'=>array(
                    array('key'=>'zbsq_template','val' => $template,'type' => '%d')
            )));

        }

        return false;
        
    }


     /**
     * accepts/unaccepts a quote 
     * ... this is really just a wrapper for addUpdateQuote
     * ... and replaces zeroBS_markQuoteAccepted + zeroBS_markQuoteUnAccepted
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateQuoteAccepted($args=array()){

        global $ZBSCRM_t,$wpdb;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'           		=> -1,
            'accepted'          => -1,
            'signedby'			=> '',
            'ip'				=> ''

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} ========== CHECK FIELDS ============

            // check id
            $id = (int)$id; if (empty($id) || $id <= 0) return false;

            // WPID may be -1 (NULL)
            // -1 does okay here if ($WPID == -1) $WPID = '';

        #} ========= / CHECK FIELDS ===========


        #} Enact
        $r = $this->addUpdateQuote(array(
            'id'            =>  $id,
            'limitedFields' =>array(
                array('key'=>'zbsq_accepted','val'=>$accepted,'type'=>'%d'),
                array('key'=>'zbsq_acceptedsigned','val'=>$signedby,'type'=>'%s'),
                array('key'=>'zbsq_acceptedip','val'=>$ip,'type'=>'%s')
                )));


    	// if quote was accepted, run internal automator quote.accepted
    	if ( $accepted ){

			// fire automator
			zeroBSCRM_FireInternalAutomator('quote.accepted',array(
				'id'=>$id,
				'data'=>array('signed'=>$signedby,'ip'=>$ip),
                'againstids'=>false,
				'extsource'=>false,
				'automatorpassthrough'=>false, 
				'extraMeta'=>false
			));

    	}


    	return $r;

    }

    /**
     * updates status for an quote (no blanks allowed)
     *
     * @param int id quote ID
     * @param string quote Status
     *
     * @return bool
     */
    public function setQuoteStatus($id=-1,$status=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0 && !empty($status) && $status !== -1){

            return $this->addUpdateQuote(array(
                'id'=>$id,
                'limitedFields'=>array(
                    array('key'=>'zbsq_status','val' => $status,'type' => '%s')
            )));

        }

        return false;
        
    }



	 /**
	 * deletes a quote object
	 *
	 * @param array $args Associative array of arguments
	 *              id
	 *
	 * @return int success;
	 */
	public function deleteQuote($args=array()){

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

						'objtype'       => ZBS_TYPE_QUOTE,
						'objid'         => $id
				));

                // delete any external source information
                $this->DAL()->delete_external_sources( array(

                    'obj_type'       => ZBS_TYPE_FORM,
                    'obj_id'         => $id,
                    'obj_source'    => 'all',

                ));

			}

            $del = zeroBSCRM_db2_deleteGeneric($id,'quotes');

            #} Add to automator
            zeroBSCRM_FireInternalAutomator('quote.delete',array(
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
	 * @return array quote (clean obj)
	 */
	private function tidy_quote($obj=false,$withCustomFields=false){

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
			
			$res['id_override'] = $this->stripSlashes($obj->zbsq_id_override);
			$res['title'] = $this->stripSlashes($obj->zbsq_title);
			$res['currency'] = $this->stripSlashes($obj->zbsq_currency);
			$res['value'] = $this->stripSlashes($obj->zbsq_value);
			$res['date'] = (int)$obj->zbsq_date;
			$res['date_date'] = (isset($obj->zbsq_date) && $obj->zbsq_date > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsq_date,false,true) : false;
			$res['template'] = (int)$this->stripSlashes($obj->zbsq_template);
			$res['content'] = $this->stripSlashes($obj->zbsq_content);
			$res['notes'] = $this->stripSlashes($obj->zbsq_notes);
			$res['send_attachments'] = (bool)$obj->zbsq_send_attachments;
			$res['hash'] = $this->stripSlashes($obj->zbsq_hash);
			$res['lastviewed'] = (int)$obj->zbsq_lastviewed;
			$res['lastviewed_date'] = (isset($obj->zbsq_lastviewed) && $obj->zbsq_lastviewed > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsq_lastviewed,false,true) : false;
			$res['viewed_count'] = (int)$obj->zbsq_viewed_count;
			$res['accepted'] = (int)$obj->zbsq_accepted;
			$res['accepted_date'] = (isset($obj->zbsq_accepted) && $obj->zbsq_accepted > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsq_accepted,false,true) : false;
			$res['acceptedsigned'] = (int)$obj->zbsq_accepted;
			$res['acceptedip'] = (int)$obj->zbsq_accepted;
			$res['created'] = (int)$obj->zbsq_created;
			$res['created_date'] = (isset($obj->zbsq_created) && $obj->zbsq_created > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsq_created,false,true) : false;
			$res['lastupdated'] = (int)$obj->zbsq_lastupdated;
			$res['lastupdated_date'] = (isset($obj->zbsq_lastupdated) && $obj->zbsq_lastupdated > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsq_lastupdated,false,true) : false;

			// determine status :)
			$res['status'] = -1; // not yet pub
			if (isset($res['template']) && $res['template'] > 0) $res['status'] = -2; // published not accepted
			if (isset($res['accepted']) && $res['accepted'] > 0) $res['status'] = 1; // accepted

            // custom fields - tidy any that are present:
            if ($withCustomFields) $res = $this->tidyAddCustomFields(ZBS_TYPE_QUOTE,$obj,$res,false);

		} 


		return $res;


	}


	/**
	 * Wrapper, use $this->getQuoteMeta($contactID,$key) for easy retrieval of singular quote
	 * Simplifies $this->getMeta
	 *
	 * @param int objtype
	 * @param int objid
	 * @param string key
	 *
	 * @return array quote meta result
	 */
	public function getQuoteMeta($id=-1,$key='',$default=false){

		global $zbs;

		if (!empty($key)){

			return $this->DAL()->getMeta(array(

				'objtype' => ZBS_TYPE_QUOTE,
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
	 * Returns content body against a quote
	 * ... Replaces zeroBS_getQuoteBuilderContent() really
	 *
	 * @param int id quote ID
	 *
	 * @return int quote owner id
	 */
	public function getQuoteContent($id=-1){

		global $zbs;

		$id = (int)$id;

		if ($id > 0){

			return $this->DAL()->getFieldByID(array(
				'id' => $id,
				'objtype' => ZBS_TYPE_QUOTE,
				'colname' => 'zbsq_content',
				'ignoreowner'=>true));

		}

		return false;
		
	}

	/**
	 * Returns quote template ID, or 0
	 *
	 * @param int id quote ID
	 *
	 * @return int quote template ID, or 0
	 */
	public function getQuoteTemplateID($id=-1){

		global $zbs;

		$id = (int)$id;

		if ($id > 0){

			return $this->DAL()->getFieldByID(array(
				'id' => $id,
				'objtype' => ZBS_TYPE_QUOTE,
				'colname' => 'zbsq_template',
				'ignoreowner'=>true));

		}

		return false;
		
	}


	/**
	 * Returns quote accepted UTC time, if accepted
	 *
	 * @param int id quote ID
	 *
	 * @return int UTC accepted, or 0
	 */
	public function getQuoteAcceptedTime($id=-1){

		global $zbs;

		$id = (int)$id;

		if ($id > 0){

			return $this->DAL()->getFieldByID(array(
				'id' => $id,
				'objtype' => ZBS_TYPE_QUOTE,
				'colname' => 'zbsq_accepted',
				'ignoreowner'=>true));

		}

		return false;
		
	}

	/**
	 * Returns quote accepted details, if accepted
	 *
	 * @param int id quote ID
	 *
	 * @return array (Accepted deets)
	 */
	public function getQuoteAccepted($id=-1){

		global $zbs;

		$id = (int)$id;

		if ($id > 0){

			$ret = array(

				'accepted' => $this->DAL()->getFieldByID(array(
									'id' => $id,
									'objtype' => ZBS_TYPE_QUOTE,
									'colname' => 'zbsq_accepted',
									'ignoreowner'=>true)),

				'acceptedsigned' => $this->DAL()->getFieldByID(array(
									'id' => $id,
									'objtype' => ZBS_TYPE_QUOTE,
									'colname' => 'zbsq_acceptedsigned',
									'ignoreowner'=>true)),

				'acceptedip' => $this->DAL()->getFieldByID(array(
									'id' => $id,
									'objtype' => ZBS_TYPE_QUOTE,
									'colname' => 'zbsq_acceptedip',
									'ignoreowner'=>true))

			);

		}

		return false;
		
	}

	/**
	 * Returns an ownerid against a quote
	 * Replaces zeroBS_getCustomerOwner
	 *
	 * @param int id quote ID
	 *
	 * @return int quote owner id
	 */
	public function getQuoteOwner($id=-1){

		global $zbs;

		$id = (int)$id;

		if ($id > 0){

			return $this->DAL()->getFieldByID(array(
				'id' => $id,
				'objtype' => ZBS_TYPE_QUOTE,
				'colname' => 'zbs_owner',
				'ignoreowner'=>true));

		}

		return false;
		
	}

	/**
	 * Returns the first contact associated with a quote
	 *
	 * @param int id quote ID
	 *
	 * @return int quote contact id
	 */
	public function getQuoteContactID($id=-1){

		global $zbs;

		$id = (int)$id;

		if ($id > 0){

			$contacts = $this->DAL()->getObjsLinkedToObj(array(

	            'objtypefrom'       => ZBS_TYPE_QUOTE,
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
     * Returns an hash against a quote
     *
     * @param int id quote ID
     *
     * @return str quote hash string
     */
    public function getQuoteHash($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_QUOTE,
                'colname' => 'zbsq_hash',
                'ignoreowner'=>true));

        }

        return false;
        
    }

	/**
	 * Returns an status against a quote
	 *
	 * @param int id quote ID
	 *
	 * @return str quote status string
	 */
	/* IS THIS USED?
	public function getQuoteStatus($id=-1){

		global $zbs;

		$id = (int)$id;

		if ($id > 0){

			return $this->DAL()->getFieldByID(array(
				'id' => $id,
				'objtype' => ZBS_TYPE_QUOTE,
				'colname' => 'zbsq_status',
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
	private function db_ready_quote($obj=false){

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
    public function listViewObj($quote=false,$columnsRequired=array()){

        if (is_array($quote) && isset($quote['id'])){

			$resArr = $quote;

			if (isset($quote['id_override']) && $quote['id_override'] !== null) 
				$resArr['zbsid'] = $quote['id_override'];
			else
				$resArr['zbsid'] = $quote['id'];

			#} Custom columns

				#} Status
		        $resArr['statusint'] = -2; // def 

		        	// determine status - this is now done in tidy_quote
		        	if (isset($quote['status'])) $resArr['statusint'] = $quote['status'];

		        if ($resArr['statusint'] == -2){

		                #} is published
		                $resArr['status'] = '<span class="ui label orange">'.__('Not accepted yet',"zero-bs-crm").'</span>';

		        } else if ($resArr['statusint'] == -1){

		                #} not yet published
		                $resArr['status'] = '<span class="ui label grey">'.__('Draft',"zero-bs-crm").'</span>';


		        } else {

		        	#} Accepted
		        	$resArr['status'] = '<span class="ui label green">'.__('Accepted',"zero-bs-crm").' ' . date(zeroBSCRM_getDateFormat(),$quote['accepted']) . '</span>';

		        } 


				#} customer
				if (in_array('customer', $columnsRequired)){

		            #} Convert $contact arr into list-view-digestable 'customer'// & unset contact for leaner data transfer
		            $resArr['customer'] = zeroBSCRM_getSimplyFormattedContact($quote['contact'],(in_array('assignedobj', $columnsRequired))); 

		            #} Convert $contact arr into list-view-digestable 'customer'// & unset contact for leaner data transfer
		            // not yet. $resArr['company'] = zeroBSCRM_getSimplyFormattedCompany($transaction['company'],(in_array('assignedobj', $columnsRequired))); 


				}

			// let it use proper obj.
			//$resArr['added'] = $quote['created_date'];
			// prev was 'val'
			$resArr['value'] = zeroBSCRM_formatCurrency($resArr['value']);


            return $resArr;

        }

        return false;

    }


	// ===========  /   QUOTE  =======================================================
	// ===============================================================================


} // / class

