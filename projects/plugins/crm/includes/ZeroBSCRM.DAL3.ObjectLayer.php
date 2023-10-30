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
* ZBS DAL >> Object Class
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_ObjectLayer {

    protected $objectType = -1; // e.g. ZBS_TYPE_CONTACT
    protected $objectModel = -1; // array('DBFIELD(e.g. zbs_owner'=>array('Local field (e.g. owner)','format (int)'))
            // formats:
            // int = (int)
            // uts = uts + converted to locale date _datestr
            //
    protected $objectTableName = -1;
    protected $objectFieldCSV = -1; // assumes model wont change mid-load :)
    protected $include_in_templating = false; // if true, object types fields will be accessible in templating

    // hardtyped list of types this object type is commonly linked to
    // Note that as of 4.1.1 this mechanism is only used via DAL3.Export to know what typical links to look for, it is not a hard rule, or currently respected anywhere else.
    // e.g. Invoice object type may be commonly linked to 'contact' or 'company' object types
    protected $linkedToObjectTypes = array();


    function __construct($args=array()) {


        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            //'tag' => false,

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        // check objectModel + err if not legit

        // ==== AUTO TRANSLATION
        // Any labels passed with $objectModel need passing through translation :)
        if (is_array($this->objectModel)) foreach ($this->objectModel as $key => $fieldArr){

            if (isset($fieldArr['label'])) $fieldArr['label'] = __($fieldArr['label'],'zero-bs-crm');
            if (isset($fieldArr['placeholder'])) $fieldArr['placeholder'] = __($fieldArr['placeholder'],'zero-bs-crm');
            if (isset($fieldArr['options']) && is_array($fieldArr['options'])){

                $newOptions = array();
                foreach ($fieldArr['options'] as $o){
                    $newOptions[] =__($o,'zero-bs-crm');
                }
                $fieldArr['options'] = $newOptions;
                unset($newOptions);
            } 

        }

    }

    // return core vars
    public function objTableName(){
        return $this->objectTableName;
    }
    public function objType(){
        return $this->objectType;
    }
    public function objModel($appendCustomFields=false){
        return $this->objectModel;
    }
    public function linkedToObjectTypes(){
        return $this->linkedToObjectTypes;
    }
    public function is_included_in_templating(){
        return $this->include_in_templating;
    }

    // return the objModel with additional custom fields as if they were db-ready fields
    // Note: This is a bridging function currently only used in DAL3.Exports.php, 
    // ... a refactoring of the dbmodel+customfields+globalfieldarrays is necessary pre v4.0
    // ... in mean time, avoid usage in the initial field setup linkages
    //
    // Note: Also the format of the custom field arr will differ from the objmodel field arr's
    // ... to distinguish, look for attribute 'custom-field'
    // ... but probably best to generally avoid usage of this function until reconciled the above note.
    // see gh-253
    public function objModelIncCustomFields(){

        global $zbs;

        $customFields = false;
        $model = $this->objectModel;

        // turn ZBS_TYPE_CONTACT (1) into "contact"
        $typeStr = $this->DAL()->objTypeKey($this->objectType);

        // Direct retrieval v3+
        if (!empty($typeStr)) $customFields = $zbs->DAL->setting('customfields_'.$typeStr,array());

        // if is an obj which has custom field capacity:
        if (isset($customFields) && is_array($customFields)){

            // add to model        
            foreach ($customFields as $fieldKey => $field){

                // Unpacks csv options and sets 'custom-field' attr
                // Adds it to arr
                // ignores potential collisions (e.g. custom field with key 'status'), these should be blocked by UI
                $model[$fieldKey] = zeroBSCRM_customFields_processCustomField($field);

            }


        }

        // if obj also has addresses, check for address custom fields
        // Adapted from DAL3.Fields.php
        // see gh-253
        if ($this->includesAddressFields()){

            #} Retrieve
            $addrCustomFields = $zbs->DAL->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_ADDRESS));

            #} Addresses
            if (is_array($addrCustomFields) && count($addrCustomFields) > 0){

                $cfIndx = 1;
                foreach ($addrCustomFields as $fieldKey => $field){

                    // unpacks csv options and sets 'custom-field' attr
                    $fieldO = zeroBSCRM_customFields_processCustomField($field);

                    // splice them in to the end of the e.g. 'second address' group

                        // Addr1

                            // for this specifically, we also add '[area]'
                            $fieldO['area'] = 'Main Address';

                            // find index
                            $mainAddrIndx = -1; $i = 0; foreach ($model as $k => $f) {
                                if (isset($f['area']) && $f['area'] == 'Main Address') $mainAddrIndx = $i;
                                $i++;
                            }

                            // splice
                            $mainAddrIndx++; // req
                            $model = array_merge( 
                                array_slice( $model, 0, $mainAddrIndx, true ), 
                                array( 'addr_'.$fieldKey => $fieldO ), 
                                array_slice( $model, $mainAddrIndx, null, true ) 
                            );

                        // Addr2
                            
                            // change area
                            $fieldO['area'] = 'Second Address';

                            // find index
                            $secAddrIndx = -1; $i = 0; foreach ($model as $k => $f) {
                                if (isset($f['area']) && $f['area'] == 'Second Address') $secAddrIndx = $i;
                                $i++;
                            }

                            // splice
                            $secAddrIndx++; // req
                            $model = array_merge( 
                                array_slice( $model, 0, $secAddrIndx, true ), 
                                array( 'secaddr_'.$fieldKey => $fieldO ), 
                                array_slice( $model, $secAddrIndx, null, true ) 
                            );

                }

            }

        }

        return $model;

    }


    /**
     * returns bool depending on whether object has custom fields setup
     *
     *
     * @return bool
     */
    public function hasCustomFields($includeHidden=false){

        global $zbs;        

        $fieldsToHide = array();

        // turn ZBS_TYPE_CONTACT (1) into "contact"
        $typeStr = $this->DAL()->objTypeKey($this->objectType);

        // any to hide?
        if (!$includeHidden){

            $fieldHideOverrides = $zbs->settings->get('fieldhides');
            if (isset($fieldHideOverrides[$typeStr])) $fieldsToHide = $fieldHideOverrides[$typeStr];        

        }

        // Direct retrieval v3+
        if (!empty($typeStr)) {

            $customFields = $zbs->DAL->setting('customfields_'.$typeStr,array());

            // got custom fields?
            if (isset($customFields) && is_array($customFields)){

                // cycle through custom fields      
                foreach ($customFields as $fieldKey => $field){

                    // hidden?
                    if ($includeHidden || !in_array($fieldKey, $fieldsToHide)){

                        return true;

                    }

                }

            }

        }

        return false;

    }


    /**
     * returns custom fields for an object
     * .. optionally excluding hidden (from fieldsort page)
     *
     *
     * @return array custom fields
     */
    public function getCustomFields($includeHidden=false){

        global $zbs;

        $returnCustomFields = array(); $fieldsToHide = array();

        // turn ZBS_TYPE_CONTACT (1) into "contact"
        $typeStr = $this->DAL()->objTypeKey($this->objectType);

        // any to hide?
        if (!$includeHidden){

            $fieldHideOverrides = $zbs->settings->get('fieldhides');
            if (isset($fieldHideOverrides[$typeStr])) $fieldsToHide = $fieldHideOverrides[$typeStr];        

        }

        // Direct retrieval v3+
        if (!empty($typeStr)) {

            $customFields = $zbs->DAL->setting('customfields_'.$typeStr,array());

            // got custom fields?
            if (isset($customFields) && is_array($customFields)){

                // cycle through custom fields
                foreach ($customFields as $fieldKey => $field){

                    // hidden?
                    if ( $includeHidden || !$fieldsToHide || ( is_array( $fieldsToHide ) && ! in_array( $fieldKey, $fieldsToHide ) ) ) {

                        // Unpacks csv options and sets 'custom-field' attr
                        // Adds it to arr
                        $returnCustomFields[$fieldKey] = $field;

                    }

                }

            }

        }

        return $returnCustomFields;

    }

    public function includesAddressFields(){

        if (isset($this->objectIncludesAddresses)) return true;

        return false;
    }

    public function DAL(){

        // hmm this is reference to a kind of 'parent' but not parent class. not sure best reference here.
        // (to get back to $zbs->DAL)
        // ... this allows us to centralise the reference in all children classes, at least, but probs a more oop logical way to do this
        // is mostly helpers like buildWhere etc. but also other DAL funcs.
        global $zbs;
        return $zbs->DAL;
    }

    // internal sql helpers
    private function objFieldCSV(){
        
        // assumes model wont change :)
        if ($this->objectFieldCSV == -1 || $this->objectFieldCSV == ''){

            $x = ''; if (is_array($this->objectModel)) foreach ($this->objectModel as $k => $v) {
                if (!empty($x)) $x .= ',';
                $x .= $k;
            }

            $this->objectFieldCSV = $x;

        }

        return $this->objectFieldCSV;
    }


    // basic get any (first 10 paged)
    public function get($args=array()){

        // hmm this is reference to a kind of 'parent' but not parent class. not sure best reference here.
        // (to get back to $zbs->DAL)
        global $zbs;

        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',
            'page'          => 0,
            'perPage'       => 10,

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============

        #} ========== CHECK FIELDS ============

            // always ignore owner for now (settings global)
            $ignoreowner = true;
        
        #} ========= / CHECK FIELDS ===========

        global $ZBSCRM_t,$wpdb; 
        $wheres = array('direct'=>array()); $whereStr = ''; $additionalWhere = ''; $params = array(); $res = array();

        #} Build query
        $query = "SELECT ".$this->objFieldCSV." FROM ".$this->objectTableName;

        #} ============= WHERE ================


        #} ============ / WHERE ===============

        #} Build out any WHERE clauses
        $wheresArr= $zbs->DAL2->buildWheres($wheres,$whereStr,$params);
        $whereStr = $wheresArr['where']; $params = $params + $wheresArr['params'];
        #} / Build WHERE

        #} Ownership v1.0 - the following adds SITE + TEAM checks, and (optionally), owner
        $params = array_merge($params,$zbs->DAL2->tools-->ownershipQueryVars($ignoreowner)); // merges in any req.
        $ownQ = $zbs->DAL2->ownershipSQL($ignoreowner); if (!empty($ownQ)) $additionalWhere = $zbs->DAL2->spaceAnd($additionalWhere).$ownQ; // adds str to query
        #} / Ownership

        #} Append to sql (this also automatically deals with sortby and paging)
        $query .= $zbs->DAL2->buildWhereStr($whereStr,$additionalWhere) . $zbs->DAL2->buildSort($sortByField,$sortOrder) . $zbs->DAL2->buildPaging($page,$perPage);

        try {

            #} Prep & run query
            $queryObj = $zbs->DAL2->prepare($query,$params);
            $potentialRes = $zbs->DAL2->get_results($queryObj, OBJECT);

        } catch (Exception $e){

            #} General SQL Err
            $zbs->DAL2->catchSQLError($e);

        }

        #} Interpret results (Result Set - multi-row)
        if (isset($potentialRes) && is_array($potentialRes) && count($potentialRes) > 0) {

            #} Has results, tidy + return 
            foreach ($potentialRes as $resDataLine) {

                // tidy (simple)
                $resArr = $this->tidy($resDataLine);
                $res[] = $resArr;

            }
        }

        return $res;

    }


    // takes $this->objectModel and converts any applicable fields
    // into old-form (legacy) $globalFieldArr (as used to be hard-typed in Fields.php Pre DAL3)
    #} #FIELDLOADING
    public function generateFieldsGlobalArr(){

        if (isset($this->objectModel) && is_array($this->objectModel)){

            // build it
            $retArr = array();

            // cycle through fields
            foreach ($this->objectModel as $dal3key => $fieldModel){

                // if they have 'input_type' then they're designed to be loaded into the global field var
                // .. if not, they're DB-only / loaded elsewhere stuff
                if (is_array($fieldModel) && isset($fieldModel['input_type'])){

                    // should be loaded. Build it.
                    $retArr[$dal3key] = array();

                    // Old format as follows:
                    /*'fname' => array(
                        'text',                         // input type
                        __('First Name',"zero-bs-crm"), // label
                        'e.g. John',                    // placeholder
                        // extra options: +-
                        'options'=>array('Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof','Mr & Mrs'),
                        'essential' => true
                        'area'=>__('Main Address',"zero-bs-crm"),
                        'migrate'=>'addresses'
                        'opt'=>'secondaddress',
                    ) */

                    // map them in

                    // input type = [0]
                    $retArr[$dal3key][0] = $fieldModel['input_type'];

                    // input label = [1]
                    $retArr[$dal3key][1] = '';
                    if ( isset( $fieldModel['label'] ) ) {
                        $retArr[$dal3key][1] = __( $fieldModel['label'], 'zero-bs-crm' );
                        $second_address_label = zeroBSCRM_getSetting( 'secondaddresslabel' );
                        if ( empty( $second_address_label ) ) {
                            $second_address_label = __( 'Second Address', 'zero-bs-crm' );
                        }
                        if( !empty( $fieldModel['area'] ) && $fieldModel['area'] == 'Second Address' ) {
                            $retArr[$dal3key][1] .= ' (' . esc_html( $second_address_label ) . ')';
                        }
                    }

                    // input placeholder = [2]
                    $retArr[$dal3key][2] = (isset($fieldModel['placeholder'])) ? $fieldModel['placeholder'] : '';
            
                    // extra options (all key-referenced)
                    //if (isset($fieldModel['options']))      $retArr[$dal3key]['options'] = $fieldModel['options'];
                        // [options] == [3] in old global obj model world
                        if (isset($fieldModel['options']))      $retArr[$dal3key][3] = $fieldModel['options'];

                    if (isset($fieldModel['essential']))    $retArr[$dal3key]['essential'] = $fieldModel['essential'];
                    if (isset($fieldModel['area']))         $retArr[$dal3key]['area'] = $fieldModel['area'];
                    if (isset($fieldModel['migrate']))      $retArr[$dal3key]['migrate'] = $fieldModel['migrate'];
                    if (isset($fieldModel['opt']))          $retArr[$dal3key]['opt'] = $fieldModel['opt'];
                    if (isset($fieldModel['nocolumn']))     $retArr[$dal3key]['nocolumn'] = $fieldModel['nocolumn'];
                    if (isset($fieldModel['default']))      $retArr[$dal3key]['default'] = $fieldModel['default'];

                    // should all have (where different from dal3key):
                    if (isset($fieldModel['dal1key']))       $retArr[$dal3key]['dal1key'] = $fieldModel['dal1key'];

                }

            } // / foreach field

            // return built fieldGlobalArr (should mimic old DAL1/2 Fields.php)
            return $retArr;

        }

        return array();

    }

    // returns a translation matrix of DAL1key => DAL3key, where possible, using 'dal1key' attribute in data model
    public function getDAL1toDAL3ConversionMatrix(){

        $ret = array();

        if (isset($this->objectModel) && is_array($this->objectModel)){

                //foreach ($arraySource as $k => $v){
                foreach ($this->objectModel as $v3Key => $fieldObj){

                    if (isset($fieldObj['dal1key'])){

                        $ret[$fieldObj['dal1key']] = $v3Key;

                    }

                }

        }

        return $ret;

    }


    // generic get X (by ID)
    // designed to be overriden by each child.
    public function getSingle($ID=-1){

        return false;

    }

    /**
     * Helper to retrieve Custom Fields with Data for an object
     *
     * @return array summarised custom fields including values, for object
     */
    public function getSingleCustomFields($ID=-1,$includeHidden=false){

        global $zbs;

        if ($ID > 0){

            // retrieve custom fields
            $customFields = $this->getCustomFields($includeHidden);

            // retrieve object data
            $objectData = $this->getSingle($ID); if (!is_array($objectData)) $objectData = array();

            // Build return
            $return = array();
            if (is_array($customFields)) foreach($customFields as $k => $v){

                $return[] = array(
                    'id'    => $v[3],
                    'name'  => $v[1],
                    'value' => (isset($objectData[$v[3]]) ? $objectData[$v[3]] : ''),
                    'type'  => $v[0]
                );

            }

            return $return;

        } 

        return false;
    }

    // generic get X (by IDs)
    // designed to be overriden by each child.
    public function getIDList($IDs=array()){

        return false;

    }

    // generic get X (EVERYTHING)
    // designed to be overriden by each child.
    // expect heavy load!
    public function getAll($IDs=array()){

        return false;

    }

    // generic get count of (EVERYTHING)
    // designed to be overriden by each child.
    public function getFullCount(){

        return false;

    }

    // Ownership - simplistic GET owner of obj
    public function getOwner($objID=-1){

        // check
        if ($objID < 1) return false;
    
        return $this->DAL()->getObjectOwner(array(
            
            'objID'         => $objID,
            'objTypeID'     => $this->objectType

        ));

    }

    // Ownership - simplistic SET owner of obj
    public function setOwner($objID=-1,$ownerID=-1){

        // check
        if ($objID < 1 || $ownerID < 1) return false;
    
        // set owner
        return $this->DAL()->setObjectOwner(array(
            
            'objID'         => $objID,
            'objTypeID'     => $this->objectType,
            'ownerID'       => $ownerID

        ));

    }

    


     /**
     * Wrapper, use $this->updateMeta($objid,$key,$val) for easy update of obj meta :)
     * (Uses built in type)
     *
     * @param string key
     * @param string value
     *
     * @return bool result
     */
    public function updateMeta($objid=-1,$key='',$val=''){
        
        if (!empty($key) && isset($this->objectType) && $this->objectType > 0){ // && !empty($val)

            return $this->DAL()->addUpdateMeta(array(

                'data' => array(

                    'objid'     => $objid,
                    'objtype'   => $this->objectType,
                    'key'       => $key,
                    'val'       => $val
                )

            ));

        }

        return false;
    }
    

    /**
     * tidy's the object from wp db into clean array
     * ... also converts uts to local datetime etc. politely
     *
     * @param array $obj (DB obj)
     *
     * @return array (clean obj)
     */
    public function tidy($obj=false){

            global $zbs;

            $res = false;

            if (isset($obj->ID)){

                // THESE must be standard :)
                $res = array();
                $res['id'] = (int)$obj->ID;
                /* 
                  `zbs_site` INT NULL DEFAULT NULL,
                  `zbs_team` INT NULL DEFAULT NULL,
                  `zbs_owner` INT NOT NULL,
                */
                $res['owner'] = (int)$obj->zbs_owner;

                // cycle through + pull in
                foreach ($this->objectModel as $dbkey => $val){

                    // if not already set
                    if (!isset($res[$val['fieldname']])){

                        switch ($val['format']){

                            case 'int':

                                $res[$val['fieldname']] = (int)$obj->$dbkey;
                                break;

                            case 'uts':

                                // normal return
                                $res[$val['fieldname']] = (int)$obj->$dbkey;

                                // auto add locale str
                                $res[$val['fieldname'].'_datestr'] = zeroBSCRM_locale_utsToDatetime($obj->$dbkey);
                                break;

                            default:

                                $res[$val['fieldname']] = $obj->$dbkey;
                                break;


                        }

                    }


                }


            } // if is obj id


        return $res;


    }


    /**
     * Offers generic custom field tidying, where an obj and it's cleaned version are passed
     * ... centralised here as all objects (which have custom fields) had this repeated
     *
     * @param int $objTypeID e.g. 1 = ZBS_TYPE_CONTACT
     * @param obj $obj (DB obj)
     * @param array $res (tidied DB obj)
     * @param bool $includeAddrCustomFields (whether or not to also probe + tidy custom fields for addrs (mainly contacts + company tidying))
     *
     * @return array (clean obj)
     */
    public function tidyAddCustomFields($objTypeID=ZBS_TYPE_CONTACT,$obj=false,$res=false,$includeAddrCustomFields=false){
      
        // vague catch
        if ($obj == false || $res == false) return $res;

        #} Retrieve any cf
        $customFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>$objTypeID));

        if (is_array($customFields)) foreach ($customFields as $cK => $cF){

            // custom field (e.g. 'third name') it'll be passed here as 'third-name'
            // ... problem is mysql does not like that :) so we have to chage here:
            // in this case we REVERSE this: prepend cf's with cf_ and we switch - for _
            // ... by using $cKey below, instead of cK
            $cKey = 'cf_'.str_replace('-','_',$cK);

            $res[$cK] = '';

            // if normal
            if (isset($obj->$cK)) $res[$cK] = $this->stripSlashes($obj->$cK);
            
            // if cf
            if (isset($obj->$cKey)) $res[$cK] = $this->stripSlashes($obj->$cKey);

            // if date_type, format
            if ( isset($cF[0] ) && $cF[0] === 'date') {

                // make a _date field
                if ( '' === $res[$cK] ) {
                    $res[$cK.'_cfdate'] = '';
                } else {
                    $res[$cK.'_cfdate'] = zeroBSCRM_date_i18n( -1, $res[$cK], false, true );
                    $res[$cK.'_datetime_str'] = jpcrm_uts_to_datetime_str( $res[$cK] );
                    $res[$cK.'_date_str'] = jpcrm_uts_to_date_str( $res[$cK] );
                }
            }
        }

        #} Retrieve addr custfiedls
        $addrCustomFields = $this->DAL()->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_ADDRESS));

        if (is_array($addrCustomFields)) foreach ($addrCustomFields as $cK => $cF){

            // v2:
            //$cKN = (int)$cK+1;
            //$cKey = 'addr_cf'.$cKN;
            //$cKey2 = 'secaddr_cf'.$cKN;
            // v3:                    
            //$cKey = 'addr_'.$cK;
            //$cKey2 = 'secaddr_'.$cK;
            // v4: 
            // These keys were causing alias collisions in mysql when keys ended up like 'addr_house-type'
            // ... where the sort couldn't be fired for that key due to the - character
            // ... so from 4.0.7+ we processed these adding a prefix `addrcf_` (and `secaddrcf_`) and replacing - for _            
            $cKey = 'addrcf_'.str_replace('-','_',$cK);
            $cKey2 = 'secaddrcf_'.str_replace('-','_',$cK);

            // Note we still want to return as `addr_house-type` not `addrcf_house_type`
            $res['addr_'.$cK] = '';
            $res['secaddr_'.$cK] = '';

            // retrieve
            if (isset($obj->$cKey)) $res['addr_'.$cK] = $this->stripSlashes($obj->$cKey);
            if (isset($obj->$cKey2)) $res['secaddr_'.$cK] = $this->stripSlashes($obj->$cKey2);

            // if date_type, format
            if (isset($cF[0]) && $cF[0] == 'date'){

                // make a _date field
                if ( isset( $res['addr_' . $cK] ) ) {
                    $res['addr_' . $cK . '_cfdate'] = zeroBSCRM_date_i18n( -1, $res['addr_' . $cK], false, true );
                    $res['addr_' . $cK . '_datetime_str'] = jpcrm_uts_to_datetime_str( $res['addr_' . $cK] );
                    $res['addr_' . $cK . '_date_str'] = jpcrm_uts_to_date_str( $res['addr_' . $cK] );
                }
                if ( isset( $res['secaddr_' . $cK] ) ) {
                    $res['secaddr_' . $cK . '_cfdate'] = zeroBSCRM_date_i18n( -1, $res['secaddr_' . $cK], false, true );
                    $res['secaddr_' . $cK . '_datetime_str'] = jpcrm_uts_to_datetime_str( $res['secaddr_' . $cK] );
                    $res['secaddr_' . $cK . '_date_str'] = jpcrm_uts_to_date_str( $res['secaddr_' . $cK] );
                }
                
            }

        }

        return $res;

    }

    /**
     * this takes a dataArray passed for update/insert and works through
     * the fields, checking against the obj model for compliance
     * initially this only includes max_len checks as fix for gh-270
     *
     * @param array $dataArr (pre-insert obj)
     *
     * @return bool
     */
    public function wpdbChecks($dataArr=array()){

        // req.
        global $zbs;

        $checksFailed = array();

        if ($zbs->isDAL3() && $this->objectType > 0 && is_array($dataArr) && isset($this->objectDBPrefix)){

            // new return
            $retArr = $dataArr;

            foreach ($dataArr as $key => $val){

                // use $objectDBPrefix to retrieve the objmodel key
                // zbsi_id_override => id_override
                $fieldKey = str_replace($this->objectDBPrefix,'', $key);

                // max length check?
                if (!empty($fieldKey) && isset($this->objectModel[$fieldKey]) && isset($this->objectModel[$fieldKey]['max_len'])){

                    // check length
                    if (strlen($val) > $this->objectModel[$fieldKey]['max_len']){

                        // > max_len
                        // .. abbreviate
                        $retArr[$key] = substr($val, 0, ($this->objectModel[$fieldKey]['max_len']-3)).'...';

                        // Add notice
                        $label = $fieldKey; if (isset($this->objectModel[$fieldKey]['label'])) $label = $this->objectModel[$fieldKey]['label'];
                        $msg = __('The value for the field:','zero-bs-crm').' "'.$label.'" '.__('was too long and has been abbreviated','zero-bs-crm');
                        $zbs->DAL->addError(305,$this->objectType,$msg,$fieldKey);
                    


                    }

                }

            }

            // return (possibly modified arr)
            return $retArr;

        }

        return $dataArr;

    }

    /**
     * this takes the current database insert/update or any object
     * and validates it against the dbmodel for that objtype for uniqueness
     * e.g. if a field in the dbmodel has force_unique, it's checked that that field is in fact unique, 
     * returning false if so
     * Note: Blanks side-step this check if attribute 'can_be_blank', but are still are still subject to 'not_empty' check 
     * ... (verifyNonEmptyValues) if that attribute is specified in the obj model
     *
     * This'll also add an error to the stack, if it can
     *
     * @param array $obj (clean obj)
     *
     * @return bool
     */
    public function verifyUniqueValues($objArr=array(),$id=-1){

        // req.
        global $zbs;

        $checksFailed = array();

        if ($zbs->isDAL3() && $this->objectType > 0 && is_array($objArr)){

            // DAL3+ we now have proper object models, so can check for 'force_unique' flags against field

                // get an obj model, if set
                // note: importantly, v2->v3 migration in v3.0 uses DAL2 objModel drop-in function here, so be aware this may be used during v2->v3 migration
                $potentialModel = $zbs->DAL->objModel($this->objectType);

                // will be objlayer model if set
                if (is_array($potentialModel)){

                    // cycle through each field verify where necessary
                    foreach ($potentialModel as $fieldKey => $fieldDetail){

                        // there's a few we ignore :)
                        if (in_array($fieldKey, array('ID','zbs_site','zbs_team','zbs_owner'))) continue;

                        // verify unique fields are unique + unused
                        // note. If 'can_be_blank' is also set against the field, blank doesn't get checked here                        
                        if (isset($fieldDetail['force_unique']) && $fieldDetail['force_unique']){

                            if (isset($fieldDetail['can_be_blank']) && $fieldDetail['can_be_blank'] && empty($objArr[$fieldKey])){

                                // field is blank, and is allowed to be!

                            } else {

                                // needs to ensure field is unique.

                                    // get existing id, if set
                                    $whereArr = array(); // colname zbsc_email
                                    $whereArr['uniquecheck'] = array($fieldDetail['fieldname'],'=','%s',$objArr[$fieldKey]);

                                    $potentialID = $zbs->DAL->getFieldByWHERE(array(
                                        'objtype' => $this->objectType, // ZBS_TYPE_CONTACT
                                        'colname' => 'ID',
                                        'where' => $whereArr,
                                        'ignoreowner' => true));

                                    // catch dupes (exists, but it's not this)
                                    if ($potentialID > 0 && $potentialID != $id){

                                        // pass back the failed field.
                                        $checksFailed[$fieldKey] = $fieldDetail;

                                    }

                            }

                        }

                    } // / foreach

                } // / if has model


        }    

        // got any fails?
        if (count($checksFailed) > 0) {

            // can't update, some non-uniques.

            // set reason msg
            if ( is_array( $checksFailed ) ) {
                foreach ( $checksFailed as $fieldKey => $fieldDetail ) {
                    $fk = $fieldKey;
                    if ( isset( $fieldDetail['label'] ) ) {
                        $fk = $fieldDetail['label'];
                    }
                    if( $fk === 'id_override' ) {
                        $msg = __('Duplicated reference. The reference should be unique', 'zero-bs-crm');
                    } else {
                        $msg = __('The value for the field:', 'zero-bs-crm') . ' "' . $fk . '" ' . __('was not unique (exists)', 'zero-bs-crm');
                    }

                    $zbs->DAL->addError( 301, $this->objectType, $msg, $fieldKey );
                }
            }

                // return fail
                return false;

        } // / fails unique field verify        

        return true;

    }

    /**
     * this takes the current database insert/update or any object
     * and validates it against the dbmodel for that objtype for empties
     * e.g. if a field in the dbmodel has not_empty, it's checked that that field is in fact not empty 
     * returning false if so
     * Note this is inverse to 'can_be_blank' flag
     *
     * This'll also add an error to the stack, if it can
     *
     * @param array $obj (clean obj)
     *
     * @return bool
     */
    public function verifyNonEmptyValues($objArr=array()){

        // req.
        global $zbs;

        $checksFailed = array();

        if ($zbs->isDAL3() && $this->objectType > 0 && is_array($objArr)){

            // DAL3+ we now have proper object models, so can check for 'force_unique' flags against field

                // get an obj model, if set
                // note: importantly, v2->v3 migration in v3.0 uses DAL2 objModel drop-in function here, so be aware this may be used during v2->v3 migration
                $potentialModel = $zbs->DAL->objModel($this->objectType);

                // will be objlayer model if set
                if (is_array($potentialModel)){

                    // cycle through each field verify where necessary
                    foreach ($potentialModel as $fieldKey => $fieldDetail){

                        // verify fields are not empty
                        // note. This ignores 'can_be_blank', if is somehow set despite setting not_empty
                        if (isset($fieldDetail['not_empty']) && $fieldDetail['not_empty']){

                            // needs to ensure field is not empty                            
                            if (empty($objArr[$fieldKey])){

                                // pass back the failed field.
                                $checksFailed[$fieldKey] = $fieldDetail;

                            }


                        }

                    } // / foreach

                } // / if has model


        }

        // got any fails?
        if (count($checksFailed) > 0){

                // can't update, some empties.

                // set reason msg
                if (is_array($checksFailed)) foreach ($checksFailed as $fieldKey => $fieldDetail){
                    $fk = $fieldKey; if (isset($fieldDetail['label'])) $fk = $fieldDetail['label'];
                    $msg = __('The field:','zero-bs-crm').' "'.$fk.'" '.__('is required','zero-bs-crm');                    
                    $zbs->DAL->addError(304,$this->objectType,$msg,$fieldKey);
                }

                // return fail
                return false;

        } // / fails non blank field verify

        return true;

    }


    /**
     * remove any non-db fields from the object
     * basically takes array like array('owner'=>1,'fname'=>'x','fullname'=>'x')
     * and returns array like array('owner'=>1,'fname'=>'x')
     *
     * @param array $obj (clean obj)
     *
     * @return array (db ready arr)
     */
    public function db_ready_obj($obj=false){

            global $zbs;

            // here it has to use the KEY which is without prefix (e.g. status, not zbsc_status) :)
            if (isset($this->objectModel) && is_array($this->objectModel)){

                $ret = array();
                if (is_array($obj)){

                    foreach ($this->objectModel as $fKey => $fObj){

                        if (isset($obj[$fKey])) $ret[$fKey] = $obj[$fKey];

                    }

                    // gross backward compat - long may this die.
                    if ($zbs->db2CompatabilitySupport) $ret['meta'] = $ret;

                }

            }

            return $ret;


    }

    /**
     * genericified link array of id's with this obj
     * Takes current area (e.g. EVENT) as first type, and assigns objlinks EVENT -> $toObjType
     *
     * @param int $objectID (int of this obj id)
     * @param array $objectIDsArr (array of ints (IDs)) - NOTE: can pass 'unset' as str to wipe links
     * @param int $toObjectType (int of obj link type)
     *
     * @return bool of action
     */
    public function addUpdateObjectLinks($objectID=-1,$objectIDsArr=false,$toObjectType=false){
            if ($toObjectType > 0 && $objectID > 0){

                // GENERICIFIED OBJ LINKS
                if (isset($objectIDsArr) && is_array($objectIDsArr) && count($objectIDsArr) > 0){
                
                    // replace existing
                    $this->DAL()->addUpdateObjLinks(array(
                                                    'objtypefrom'       => $this->objectType,
                                                    'objtypeto'         => $toObjectType,
                                                    'objfromid'         => $objectID,
                                                    'objtoids'          => $objectIDsArr,
                                                    'mode'              => 'replace'));

                    return true;

                } else if (isset($objectIDsArr) && $objectIDsArr == 'unset') {

                    // wipe previous links
                    $deleted = $this->DAL()->deleteObjLinks(array(
                                'objtypefrom'       => $this->objectType,
                                'objtypeto'         => $toObjectType,
                                'objfromid'     =>      $objectID)); // where id =

                    return true;

                }

            }


            return false;
    }
    

    // ===============================================================================
    // =========== DAL2 WRAPPERS =====================================================
    // These are dumb, and pass back directly to parent $zbs->DAL equivilents, centralising them
    // ... this is so we can keep $this->lazyTable etc. usage which is simpler than $this->DAL()->lazyTable 


        public function lazyTable($objType=-1){

            // pass back to main $zbs->DAL
            return $this->DAL()->lazyTable($objType);

        }
        public function lazyTidy($objType=-1,$obj=false){

            // pass back to main $zbs->DAL
            return $this->DAL()->lazyTidy($objType,$obj);

        }
        public function lazyTidyGeneric($obj=false){

            // pass back to main $zbs->DAL
            return $this->DAL()->lazyTidyGeneric($obj);

        }
        public function space($str='',$pre=false){

            // pass back to main $zbs->DAL
            return $this->DAL()->space($str,$pre);

        }
        public function spaceAnd($str=''){

            // pass back to main $zbs->DAL
            return $this->DAL()->spaceAnd($str);

        }
        public function spaceWhere($str=''){

            // pass back to main $zbs->DAL
            return $this->DAL()->spaceWhere($str);

        }
        public function delimiterIf($delimiter,$ifStr=''){

            // pass back to main $zbs->DAL
            return $this->DAL()->delimiterIf($delimiter,$ifStr);

        }
        public function stripSlashes($obj=false){
			return zeroBSCRM_stripSlashes( $obj );
        }
        public function decodeIfJSON($str=''){

            // pass back to main $zbs->DAL
            return $this->DAL()->decodeIfJSON($str);

        }
        public function build_csv($array=array()){

            // pass back to main $zbs->DAL
            return $this->DAL()->build_csv($array);

        }
        public function buildWhereStr($whereStr='',$additionalWhere=''){

            // pass back to main $zbs->DAL
            return $this->DAL()->buildWhereStr($whereStr,$additionalWhere);

        }
        public function buildWheres($wheres=array(),$whereStr='',$params=array(),$andOr='AND',$includeInitialWHERE=true){

            // pass back to main $zbs->DAL
            return $this->DAL()->buildWheres($wheres,$whereStr,$params,$andOr,$includeInitialWHERE);

        }
        public function buildSort($sortByField='',$sortOrder='ASC'){

            // pass back to main $zbs->DAL
            return $this->DAL()->buildSort($sortByField,$sortOrder);

        }
        public function buildPaging($page=-1,$perPage=-1){

            // pass back to main $zbs->DAL
            return $this->DAL()->buildPaging($page,$perPage);

        }
        public function buildWPMetaQueryWhere($metaKey=-1,$metaVal=-1){

            // pass back to main $zbs->DAL
            return $this->DAL()->buildWPMetaQueryWhere($metaKey,$metaVal);

        }
        public function getTypeStr($fieldKey=''){

            // pass back to main $zbs->DAL
            return $this->DAL()->getTypeStr($fieldKey);

        }
        public function prepare($sql='',$params=array()){

            // pass back to main $zbs->DAL
            return $this->DAL()->prepare($sql,$params);

        }
        public function catchSQLError($errObj=-1){

            // pass back to main $zbs->DAL
            return $this->DAL()->catchSQLError($errObj);

        }
        // legacy signpost, this is now overwritten by DAL->contacts->fullname
        public function format_fullname($contactArr=array()){

            // pass back to main $zbs->DAL
            return $this->DAL()->format_fullname($contactArr);

        }
        // legacy signpost, this is now overwritten by DAL->[contacts|companies]->format_name_etc
        public function format_name_etc($contactArr=array(),$args=array()){

            // pass back to main $zbs->DAL
            return $this->DAL()->format_name_etc($contactArr,$args);

        }
        public function format_address($contactArr=array(),$args=array()){

            // pass back to main $zbs->DAL
            return $this->DAL()->format_address($contactArr,$args);

        }
        public function makeSlug($string, $replace = array(), $delimiter = '-') {

            // pass back to main $zbs->DAL
            return $this->DAL()->makeSlug($string,$replace,$delimiter);

        }
        public function makeSlugCleanStr($string='', $delimiter='-'){

            // pass back to main $zbs->DAL
            return $this->DAL()->makeSlugCleanStr($string,$delimiter);

        }
        public function ownershipQueryVars($ignoreOwner=false){

            // pass back to main $zbs->DAL
            return $this->DAL()->ownershipQueryVars($ignoreOwner);

        }
        public function ownershipSQL($ignoreOwner=false,$table=''){

            // pass back to main $zbs->DAL
            return $this->DAL()->ownershipSQL($ignoreOwner,$table);

        }
        public function addUpdateCustomField($args=array()){

            // pass back to main $zbs->DAL
            return $this->DAL()->addUpdateCustomField($args);

        }



    // =========== / DAL2 WRAPPERS ===================================================
    // ===============================================================================
} // / class
