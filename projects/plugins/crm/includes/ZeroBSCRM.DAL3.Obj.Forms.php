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
* ZBS DAL >> Forms
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_forms extends zbsDAL_ObjectLayer {


    protected $objectType = ZBS_TYPE_FORM;
    protected $objectDBPrefix = 'zbsf_';
    protected $objectModel = array(

        // ID
        'ID' => array('fieldname' => 'ID', 'format' => 'int'),

        // site + team generics
        'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
        'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
        'zbs_owner' => array('fieldname' => 'zbs_owner', 'format' => 'int'),

        // other fields
        'title'            => array(
                // db model:
                'fieldname' => 'zbsf_title', 'format' => 'str',
	            // output model
	            'input_type' => 'text',
	            'label' => 'Form Title',
	            'placeholder'=>'',
	            'essential' => true,
                'max_len' => 200
        ),
        'style' => array('fieldname' => 'zbsf_style', 'format' => 'str'),
        'views' => array('fieldname' => 'zbsf_views', 'format' => 'int'),
        'conversions' => array('fieldname' => 'zbsf_conversions', 'format' => 'int'),
        'label_header'            => array(
                // db model:
                'fieldname' => 'zbsf_label_header', 'format' => 'str',
	            // output model
	            'input_type' => 'text',
	            'label' => 'Header',
	            'placeholder'=> 'Want to find out more?',
                'nocolumn'=>true,
                'max_len' => 200
        ),
        'label_subheader'            => array(
                // db model:
                'fieldname' => 'zbsf_label_subheader', 'format' => 'str',
                // output model
                'input_type' => 'text',
                'label' => 'Sub Header',
                'placeholder'=> 'Drop us a line. We follow up on all contacts',
                'nocolumn'=>true,
                'max_len' => 200
        ),
        'label_firstname'            => array(
                // db model:
                'fieldname' => 'zbsf_label_firstname', 'format' => 'str',
                // output model
                'input_type' => 'text',
                'label' => 'First Name Placeholder',
                'placeholder'=> 'First Name',
                'nocolumn'=>true,
                'max_len' => 200
        ),
        'label_lastname'            => array(
                // db model:
                'fieldname' => 'zbsf_label_lastname', 'format' => 'str',
                // output model
                'input_type' => 'text',
                'label' => 'Last Name Placeholder',
                'placeholder'=> 'Last Name',
                'nocolumn'=>true,
                'max_len' => 200
        ),
        'label_email'            => array(
                // db model:
                'fieldname' => 'zbsf_label_email', 'format' => 'str',
                // output model
                'input_type' => 'text',
                'label' => 'Email Placeholder',
                'placeholder'=> 'Email',
                'nocolumn'=>true,
                'max_len' => 200
        ),
        'label_message'            => array(
                // db model:
                'fieldname' => 'zbsf_label_message', 'format' => 'str',
                // output model
                'input_type' => 'text',
                'label' => 'Message Placeholder',
                'placeholder'=> 'Your Message',
                'nocolumn'=>true,
                'max_len' => 200
        ),
        'label_button'            => array(
                // db model:
                'fieldname' => 'zbsf_label_button', 'format' => 'str',
                // output model
                'input_type' => 'text',
                'label' => 'Submit Button',
                'placeholder'=> 'Submit',
                'nocolumn'=>true,
                'max_len' => 200
        ),
        'label_successmsg'            => array(
                // db model:
                'fieldname' => 'zbsf_label_successmsg', 'format' => 'str',
                // output model
                'input_type' => 'textarea',
                'label' => 'Success Message',
                'placeholder'=> 'Thanks. We will be in touch.',
                'nocolumn'=>true,
                'max_len' => 200
        ),
        'label_spammsg'            => array(
                // db model:
                'fieldname' => 'zbsf_label_spammsg', 'format' => 'str',
                // output model
                'input_type' => 'textarea',
                'label' => 'Spam Message',
                'placeholder'=> 'We will not send you spam. Our team will be in touch within 24 to 48 hours Mon-Fri (but often much quicker)',
                'nocolumn'=>true,
                'max_len' => 200
        ),
        'include_terms_check'            => array(
                // db model:
                'fieldname' => 'zbsf_include_terms_check', 'format' => 'bool',
                /* not live in v3.0, to add v3.1+ 
                // output model
                'input_type' => 'checkbox',
                'label' => 'Include "Terms and Conditions Check"',
                'placeholder'=>'',
                'nocolumn'=>true */
        ),
        'terms_url'            => array(
                // db model:
                'fieldname' => 'zbsf_terms_url', 'format' => 'str',
                /* not live in v3.0, to add v3.1+
                // output model
                'input_type' => 'text',
                'label' => 'Terms and Conditions URL',
                'placeholder'=>'',
                'nocolumn'=>true,
                'max_len' => 200 */
        ),
        'redir_url'            => array(
                // db model:
                'fieldname' => 'zbsf_redir_url', 'format' => 'str',
                /* not live in v3.0, to add v3.1+
                // output model
                'input_type' => 'text',
                'label' => 'Redirection URL',
                'placeholder'=>'',
                'nocolumn'=>true,
                'max_len' => 200 */
        ),
        'font' => array('fieldname' => 'zbsf_font', 'format' => 'str'),
        'colour_bg' => array('fieldname' => 'zbsf_colour_bg', 'format' => 'str'),
        'colour_font' => array('fieldname' => 'zbsf_colour_font', 'format' => 'str'),
        'colour_emphasis' => array('fieldname' => 'zbsf_colour_emphasis', 'format' => 'str'),
        'created' => array('fieldname' => 'zbsf_created', 'format' => 'uts'),
        'lastupdated' => array('fieldname' => 'zbsf_lastupdated', 'format' => 'uts'),
        
        );


    function __construct($args=array()) {


        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            //'tag' => false,

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============


    }



    // ===============================================================================
    // ===========   FORM  ===========================================================

    // generic get Company (by ID)
    // Super simplistic wrapper used by edit page etc. (generically called via dal->contacts->getSingle etc.)
    public function getSingle($ID=-1){

        return $this->getForm($ID);

    }

    // generic get (by ID list)
    // Super simplistic wrapper used by MVP Export v3.0
    public function getIDList($IDs=false){

        return $this->getForms(array(
            'inArr'             => $IDs,
            'page'          => -1,
            'perPage'       => -1
        ));

    }
    
    // generic get (EVERYTHING)
    // expect heavy load!
    public function getAll($IDs=false){

        return $this->getForms(array(
            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    // generic get count of (EVERYTHING)
    public function getFullCount(){

        return $this->getForms(array(
            'count'  => true,
            'page'          => -1,
            'perPage'       => -1,
        ));

    }
    
    /**
     * returns full form line +- details
     *
     * @param int id        form id
     * @param array $args   Associative array of arguments
     *
     * @return array form object
     */
    public function getForm($id=-1,$args=array()){

        global $zbs;

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            // with what?
            'withTags'          => false,
            'withOwner'         => false,

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_FORM), // this'll let you not-check the owner of obj

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

                $selector = 'form.*';
                if (isset($fields) && is_array($fields)) {
                    $selector = '';

                    // always needs id, so add if not present
                    if (!in_array('ID',$fields)) $selector = 'form.ID';

                    foreach ($fields as $f) {
                        if (!empty($selector)) $selector .= ',';
                        $selector .= 'form.'.$f;
                    }
                } else if ($onlyID){
                    $selector = 'form.ID';
                }

            #} ============ / PRE-QUERY ===========


            #} Build query
            $query = "SELECT ".$selector.$extraSelect." FROM ".$ZBSCRM_t['forms'].' as form';
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
                        $res = $this->tidy_form($potentialRes);//$withCustomFields
                    }

                    if ($withTags){

                        // add all tags lines
                        $res['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_FORM,'objid'=>$potentialRes->ID));
                    
                    }

                    return $res;

            }

        } // / if ID

        return false;

    }

    /**
     * returns form detail lines
     *
     * @param array $args Associative array of arguments
     *
     * @return array of form lines
     */
    public function getForms($args=array()){

        global $zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)
            'searchPhrase'  => '', // searches title
            'inArr'             => false,
            'isTagged'          => false, // 1x INT OR array(1,2,3)
            'isNotTagged'       => false, // 1x INT OR array(1,2,3)
            'ownedBy'           => false,
            'olderThan'         => false, // uts
            'newerThan'         => false, // uts

            // returns
            'count'             => false,
            'withTags'          => false,
            'withOwner'         => false,
            'onlyColumns'       => false, // if passed (array('fname','lname')) will return only those columns (overwrites some other 'return' options). NOTE: only works for base fields (not custom fields)

            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0, // this is what page it is (gets * by for limit)
            'perPage'       => 100,
            'whereCase'          => 'AND', // DEFAULT = AND

            // permissions
            'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_FORM), // this'll let you not-check the owner of obj


        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        global $ZBSCRM_t,$wpdb,$zbs;  
        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array(); $joinQ = ''; $extraSelect = '';

        #} ============= PRE-QUERY ============

            #} Capitalise this
            $sortOrder = strtoupper($sortOrder);

            #} If just count, turn off any extra gumpf
            if ($count) {
                $withTags = false;
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
                    $withTags = false;
                    $withOwner = false;

                } else {

                    // deny
                    $onlyColumns = false;

                }


            }

        #} ============ / PRE-QUERY ===========

        #} Build query
        $query = "SELECT form.*".$extraSelect." FROM ".$ZBSCRM_t['forms'].' as form'.$joinQ;

        #} Count override
        if ($count) $query = "SELECT COUNT(form.ID) FROM ".$ZBSCRM_t['forms'].' as form'.$joinQ;

        #} onlyColumns override
        if ($onlyColumns && is_array($onlyColumnsFieldArr) && count($onlyColumnsFieldArr) > 0){

            $columnStr = '';
            foreach ($onlyColumnsFieldArr as $colDBKey => $colStr){

                if (!empty($columnStr)) $columnStr .= ',';
                // this presumes str is db-safe? could do with sanitation?
                $columnStr .= $colDBKey;

            }

            $query = "SELECT ".$columnStr." FROM ".$ZBSCRM_t['forms'].' as form'.$joinQ;

        }

        #} ============= WHERE ================

            #} Add Search phrase
            if (!empty($searchPhrase)){

                // search? - ALL THESE COLS should probs have index of FULLTEXT in db?
                $searchWheres = array();
                $searchWheres['search_ID'] = array('ID','=','%d',$searchPhrase);
                $searchWheres['search_title'] = array('zbsf_title','LIKE','%s','%'.$searchPhrase.'%');

                // 3.0.13 - Added ability to search custom fields (optionally)
                $customFieldSearch = zeroBSCRM_getSetting('customfieldsearch');
                if ($customFieldSearch == 1){
                
                    // simplistic add
                    // NOTE: This IGNORES ownership of custom field lines.
                    $searchWheres['search_customfields'] = array('ID','IN',"(SELECT zbscf_objid FROM ".$ZBSCRM_t['customfields']." WHERE zbscf_objval LIKE %s AND zbscf_objtype = ".ZBS_TYPE_FORM.")",'%'.$searchPhrase.'%');

                }

                // This generates a query like 'zbsf_fname LIKE %s OR zbsf_lname LIKE %s', 
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
            if (!empty($olderThan) && $olderThan > 0 && $olderThan !== false) $wheres['olderThan'] = array('zbsf_created','<=','%d',$olderThan);
            #} newerThan
            if (!empty($newerThan) && $newerThan > 0 && $newerThan !== false) $wheres['newerThan'] = array('zbsf_created','>=','%d',$newerThan);

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
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = form.ID AND zbstl_tagid = %d) > 0)',array(ZBS_TYPE_FORM,$isTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = form.ID AND zbstl_tagid IN (%s)) > 0)',array(ZBS_TYPE_FORM,$tagStr));

                }

            }
            #} Is NOT Tagged (expects 1 tag ID OR array)

                // catch 1 item arr
                if (is_array($isNotTagged) && count($isNotTagged) == 1) $isNotTagged = $isNotTagged[0];
                
            if (!is_array($isNotTagged) && !empty($isNotTagged) && $isNotTagged > 0){

                // add where tagged                 
                // 1 int: 
                $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = form.ID AND zbstl_tagid = %d) = 0)',array(ZBS_TYPE_FORM,$isNotTagged));

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
                    
                    $wheres['direct'][] = array('((SELECT COUNT(ID) FROM '.$ZBSCRM_t['taglinks'].' WHERE zbstl_objtype = %d AND zbstl_objid = form.ID AND zbstl_tagid IN (%s)) = 0)',array(ZBS_TYPE_FORM,$tagStr));

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
                        $resArr = $this->tidy_form($resDataLine);// $withCustomFields

                    }

                    if ($withTags){

                        // add all tags lines
                        $resArr['tags'] = $this->DAL()->getTagsForObjID(array('objtypeid'=>ZBS_TYPE_FORM,'objid'=>$resDataLine->ID));

                    }

					$form_id = $resArr['id'];

                    $res[] = $resArr;

            }
        }

        return $res;
    } 


    /**
     * Returns a count of forms (owned)
     *
     * @return int count
     */
    public function getFormCount($args=array()){

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            // Search/Filtering (leave as false to ignore)

            // permissions
            'ignoreowner'   => true, // this'll let you not-check the owner of obj

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        $whereArr = array();

        return $this->DAL()->getFieldByWHERE(array(
            'objtype' => ZBS_TYPE_FORM,
            'colname' => 'COUNT(ID)',
            'where' => $whereArr,
            'ignoreowner' => $ignoreowner));
        
    }



     /**
     * adds or updates a form object
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateForm($args=array()){

        global $ZBSCRM_t,$wpdb,$zbs;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'owner'         => -1,

            // fields (directly)
            'data'          => array(
                
                'title' => '',
                'style' => '',
                'views' => '',
                'conversions' => '',
                'label_header' => '',
                'label_subheader' => '',
                'label_firstname' => '',
                'label_lastname' => '',
                'label_email' => '',
                'label_message' => '',
                'label_button' => '',
                'label_successmsg' => '',
                'label_spammsg' => '',
                'include_terms_check' => '',
                'terms_url' => '',
                'redir_url' => '',
                'font' => '',
                'colour_bg' => '',
                'colour_font' => '',
                'colour_emphasis' => '',

                // tags
                'tags' => -1, // pass an array of tag ids or tag strings
                'tag_mode' => 'replace', // replace|append|remove

                // allow this to be set for MS sync etc.
                'created' => -1,
                'lastupdated' => '',

            ),

            'limitedFields' => -1, // if this is set it OVERRIDES data (allowing you to set specific fields + leave rest in tact)
            // ^^ will look like: array(array('key'=>x,'val'=>y,'type'=>'%s'))

            // this function as DAL1 func did. 
            'extraMeta'     => -1,
            'automatorPassthrough' => -1,

            'silentInsert' => false, // this was for init Migration - it KILLS all IA for newForm (because is migrating, not creating new :) this was -1 before

            'do_not_update_blanks' => false // this allows you to not update fields if blank (same as fieldoverride for extsource -> in)

        );

        foreach ( $defaultArgs as $argK => $argV ) {
            $$argK = $argV;
            if ( is_array( $args ) && isset( $args[$argK] ) ) {
                if ( is_array( $args[ $argK] ) ) {
                    $newData = $$argK;
                    if ( ! is_array( $newData ) ) {
                        $newData = array();
                    }
                    foreach ( $args[ $argK ] as $subK => $subV ) {
                        $newData[$subK] = $subV;
                    }
                    $$argK = $newData;
                } else {
                    $$argK = $args[$argK];
                }
            }
        }
    
        #} =========== / LOAD ARGS ============

        #} ========== CHECK FIELDS ============
            
            $id = (int) $id;
            
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


            #} If no style, add it in
            if (is_null($data['style']) || !isset($data['style']) || empty($data['style'])){

                //def
                $data['style'] = 'simple';

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
                        $dbData = $this->db_ready_form($data); 
                        //unset($dbData['id']); // this is unset because we use $id, and is update, so not req. legacy issue
                        //unset($dbData['created']); // this is unset because this uses an obj which has been 'updated' against original details, where created is output in the WRONG format :)

                        $origData = $data; //$data = array();               
                        $limitedData = array(); // array(array('key'=>'zbsf_x','val'=>y,'type'=>'%s'))

                        // cycle through + translate into limitedFields (removing any blanks, or arrays (e.g. externalSources))
                        // we also have to remake a 'faux' data (removing blanks for tags etc.) for the post-update updates
                        foreach ($dbData as $k => $v){

                            $intV = (int)$v;

                            // only add if valuenot empty
                            if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){

                                // add to update arr
                                $limitedData[] = array(
                                    'key' => 'zbsf_'.$k, // we have to add zbsf_ here because translating from data -> limited fields
                                    'val' => $v,
                                    'type' => $this->getTypeStr('zbsf_'.$k)
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
                if (!isset($dataArr['zbsf_lastupdated'])){ $dataArr['zbsf_lastupdated'] = time(); $typeArr[] = '%d'; }

            } else {

                // FULL UPDATE/INSERT

                    // UPDATE
                    $dataArr = array( 

                                // ownership
                                // no need to update these (as of yet) - can't move teams etc.
                                //'zbs_site' => zeroBSCRM_installSite(),
                                //'zbs_team' => zeroBSCRM_installTeam(),
                                //'zbs_owner' => $owner,

                                    
                                'zbsf_title' => $data['title'],
                                'zbsf_style' => $data['style'],
                                'zbsf_views' => $data['views'],
                                'zbsf_conversions' => $data['conversions'],
                                'zbsf_label_header' => $data['label_header'],
                                'zbsf_label_subheader' => $data['label_subheader'],
                                'zbsf_label_firstname' => $data['label_firstname'],
                                'zbsf_label_lastname' => $data['label_lastname'],
                                'zbsf_label_email' => $data['label_email'],
                                'zbsf_label_message' => $data['label_message'],
                                'zbsf_label_button' => $data['label_button'],
                                'zbsf_label_successmsg' => $data['label_successmsg'],
                                'zbsf_label_spammsg' => $data['label_spammsg'],
                                'zbsf_include_terms_check' => $data['include_terms_check'],
                                'zbsf_terms_url' => $data['terms_url'],
                                'zbsf_redir_url' => $data['redir_url'],
                                'zbsf_font' => $data['font'],
                                'zbsf_colour_bg' => $data['colour_bg'],
                                'zbsf_colour_font' => $data['colour_font'],
                                'zbsf_colour_emphasis' => $data['colour_emphasis'],
                                'zbsf_lastupdated' => time(),

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
                        $dataArr['zbsf_created'] = $data['created'];$typeArr[] = '%d';
                    } else {
                        $dataArr['zbsf_created'] = time();          $typeArr[] = '%d';
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
                        $ZBSCRM_t['forms'], 
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

                                    $this->addUpdateFormTags(
                                        array(
                                            'id' => $id,
                                            'tag_input' => $data['tags'],
                                            'mode' => $data['tag_mode']
                                        )
                                    );

                                }

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
                                    $this->DAL()->updateMeta(ZBS_TYPE_FORM,$id,'extra_'.$cleanKey,$v);

                                    #} Add it to this, which passes to IA
                                    $confirmedExtraMeta[$cleanKey] = $v;

                                }

                            }


                            #} INTERNAL AUTOMATOR 
                            #} & 
                            #} FALLBACKS
                            // UPDATING CONTACT
                            if (!$silentInsert){


                                // IA General form update (2.87+)
                                zeroBSCRM_FireInternalAutomator('form.update',array(
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
                        $ZBSCRM_t['forms'], 
                        $dataArr, 
                        $typeArr ) > 0){

                    #} Successfully inserted, lets return new ID
                    $newID = $wpdb->insert_id;

                    // tags
                    if (isset($data['tags']) && is_array($data['tags'])) {

                        $this->addUpdateFormTags(
                            array(
                                'id' => $newID,
                                'tag_input' => $data['tags'],
                                'mode' => $data['tag_mode']
                            )
                        );

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
                            $this->DAL()->updateMeta(ZBS_TYPE_FORM,$newID,'extra_'.$cleanKey,$v);

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
                        zeroBSCRM_FireInternalAutomator('form.new',array(
                            'id'=>$newID,
                            'data'=>$dataArr,
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
     * adds or updates a form's tags
     * ... this is really just a wrapper for addUpdateObjectTags
     *
     * @param array $args Associative array of arguments
     *              id (if update), owner, data (array of field data)
     *
     * @return int line ID
     */
    public function addUpdateFormTags($args=array()){

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
                'objtype'   => ZBS_TYPE_FORM,
                'objid'     => $id,
                'tag_input' => $tag_input,
                'tags'      => $tags,
                'tagIDs'    => $tagIDs,
                'mode'      => $mode
            )
        );

    }



     /**
     * deletes a form object
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    public function deleteForm($args=array()){

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

                        'objtype'       => ZBS_TYPE_FORM,
                        'objid'         => $id
                ));

                // delete any external source information
                $this->DAL()->delete_external_sources( array(

                    'obj_type'       => ZBS_TYPE_FORM,
                    'obj_id'         => $id,
                    'obj_source'    => 'all',

                ));
            }
            
        
            $del = zeroBSCRM_db2_deleteGeneric($id,'forms');

            #} Add to automator
            zeroBSCRM_FireInternalAutomator('form.delete',array(
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
     * @return array form (clean obj)
     */
    private function tidy_form($obj=false,$withCustomFields=false){

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

            
            $res['title'] = $this->stripSlashes($obj->zbsf_title);
            $res['style'] = $this->stripSlashes($obj->zbsf_style);
            $res['views'] = (int)$obj->zbsf_views;
            $res['conversions'] = (int)$obj->zbsf_conversions;
            $res['label_header'] = $this->stripSlashes($obj->zbsf_label_header);
            $res['label_subheader'] = $this->stripSlashes($obj->zbsf_label_subheader);
            $res['label_firstname'] = $this->stripSlashes($obj->zbsf_label_firstname);
            $res['label_lastname'] = $this->stripSlashes($obj->zbsf_label_lastname);
            $res['label_email'] = $this->stripSlashes($obj->zbsf_label_email);
            $res['label_message'] = $this->stripSlashes($obj->zbsf_label_message);
            $res['label_button'] = $this->stripSlashes($obj->zbsf_label_button);
            $res['label_successmsg'] = $this->stripSlashes($obj->zbsf_label_successmsg);
            $res['label_spammsg'] = $this->stripSlashes($obj->zbsf_label_spammsg);
            $res['include_terms_check'] = (bool)$obj->zbsf_include_terms_check;
            $res['terms_url'] = $this->stripSlashes($obj->zbsf_terms_url);
            $res['redir_url'] = $this->stripSlashes($obj->zbsf_redir_url);
            $res['font'] = $this->stripSlashes($obj->zbsf_font);
            $res['colour_bg'] = $this->stripSlashes($obj->zbsf_colour_bg);
            $res['colour_font'] = $this->stripSlashes($obj->zbsf_colour_font);
            $res['colour_emphasis'] = $this->stripSlashes($obj->zbsf_colour_emphasis);
            $res['created'] = (int)$obj->zbsf_created;
            //$res['created_date'] = (isset($obj->zbsf_created) && $obj->zbsf_created > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbsf_created) : false;
            $res['created_date'] = (isset($obj->zbsf_created) && $obj->zbsf_created > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsf_created,false,true) : false;
            $res['lastupdated'] = (int)$obj->zbsf_lastupdated;
            //$res['lastupdated_date'] = (isset($obj->zbsf_lastupdated) && $obj->zbsf_lastupdated > 0) ? zeroBSCRM_locale_utsToDatetime($obj->zbsf_lastupdated) : false;
            $res['lastupdated_date'] = (isset($obj->zbsf_lastupdated) && $obj->zbsf_lastupdated > 0) ? zeroBSCRM_date_i18n(-1,$obj->zbsf_lastupdated,false,true) : false;

        } 

        return $res;

    }


    /**
     * Wrapper, use $this->getFormMeta($contactID,$key) for easy retrieval of singular form
     * Simplifies $this->getMeta
     *
     * @param int objtype
     * @param int objid
     * @param string key
     *
     * @return array form meta result
     */
    public function getFormMeta($id=-1,$key='',$default=false){

        global $zbs;

        if (!empty($key)){

            return $this->DAL()->getMeta(array(

                'objtype' => ZBS_TYPE_FORM,
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
     * Returns an ownerid against a form
     * Replaces zeroBS_getCustomerOwner
     *
     * @param int id form ID
     *
     * @return int form owner id
     */
    public function getFormOwner($id=-1){

        global $zbs;

        $id = (int)$id;

        if ($id > 0){

            return $this->DAL()->getFieldByID(array(
                'id' => $id,
                'objtype' => ZBS_TYPE_FORM,
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
    private function db_ready_form($obj=false){

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
    public function listViewObj($form=false,$columnsRequired=array()){

        if (is_array($form) && isset($form['id'])){

            $resArr = $form;

            // a lot of this is legacy <DAL3 stuff just mapped. def could do with an improvement for efficacy's sake.
            // lol needed none for DAL 3 :) perfect object.

            // $resArr['style']        = get_post_meta($form['id'], 'zbs_form_style',true);
            // $resArr['views']        = get_post_meta($form['id'], 'zbs_form_views',true);
            // $resArr['conversions']  = get_post_meta($form['id'], 'zbs_form_conversions',true);
            // $resArr['id'] = $form['id'];
            // $resArr['title'] = $form['title'];

            // $d = new DateTime($form['created']);
            // $formatted_date = $d->format(zeroBSCRM_getDateFormat());

            // use Proper field $resArr['added'] = $formatted_date;
            
            return $resArr;

        }

        return false;

    }

    /**
     * Increase the form views in +1
     *
     * @param $form_id The form ID
     * @return mixed Return the total views
     */
    public function add_form_view( $form_id ) {
        $form = $this->getForm( $form_id );
        $form[ 'views' ]++;

        $this->addUpdateForm( array(
            'id'                    => $form_id,
            'data'                  => $form,
        ) );

        return $form[ 'views' ];
    }

    /**
     * Increase the form conversions in +1
     *
     * @param $form_id The form ID
     * @return mixed Return the total conversions
     */
    public function add_form_conversion( $form_id ) {
        $form = $this->getForm( $form_id );
        $form[ 'conversions' ]++;

        $this->addUpdateForm( array(
            'id'                    => $form_id,
            'data'                  => $form,
        ) );

        return $form[ 'conversions' ];
    }

    // ===========  /   FORM  =======================================================
    // ===============================================================================
    

} // / class
