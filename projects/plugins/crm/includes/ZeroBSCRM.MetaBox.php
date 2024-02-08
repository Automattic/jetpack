<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.52+
 *
 * Copyright 2020 Automattic
 *
 * Date: 27/02/18
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */



/* ======================================================
  Parent Class for all Metabox
   ====================================================== */

    class zeroBS__Metabox {

        static $instance;

        public $typeInt = false; // this was added late in DAL2 migration (28/04/18) but we should migrate to this over the other $postType etc. (started with Metaboxes.TagManger.php)

        // v3.0 this was renamed objType public $postType = false; // set in child class 'zerobs_customer' // ONLY USED IN save funcs etc. maybe, potentially just legacy now.
        public $objType = false; // set in child class 'contact' // ONLY USED IN save funcs etc. maybe, potentially just legacy now.
        public $metaboxID = false; // set in child class 'zerobs-customer-edit';
        public $metaboxTitle = ''; // set in child class __('Customer Details',"zero-bs-crm")
        public $metaboxIcon = ''; // Semantic ui icon e.g. "heartbeat" = <i class="heartbeat icon"></i> - since 2.98.7
        
        // default positions
        public $metaboxScreen = false; // set in child class zerobs_contact
        public $metaboxScreens = false; // added v3.0 - if set and is array, this'll override metaboxScreen in terms of WHERE it's shown - allowing multiple exposed points from one metabox (e.g. contacts + co's) - set in child class zerobs_contact
        public $metaboxArea = false; // set in child class normal
        public $metaboxLocation = false; // set in child class high
        
        // style choices
        public $headless = false; // hides header?
        public $metaboxClasses = ''; // extra classes to add to the wrappers

        // save options
        public $saveOrder = 10; // priority for this metabox to save. MAIN RECORDS use 1 so that later metaboxes can gain ID from newly inserted via global
        public $updateMessages = array();

        // hide/show
        public $live = true; // switching this to false before initMetabox will STOP it loading (allows for 'checks')

        // screen options - defaults - note these are also used in add_meta_box for empties 
        public $capabilities = array(

            'can_hide'          => true, // can be hidden
            'areas'             => array('normal','side'), // areas can be dragged to - normal side = only areas currently
            'can_accept_tabs'   => false,  // can/can't accept tabs onto it
            'can_become_tab'    => false, // can be added as tab
            'can_minimise'      => true, // can be minimised
            'can_move'          => true, // can be rearranged
            'hide_on_new'       => false, // if this is true, on "new" edit's this'll hide (e.g. logs no point till added)

        );

        //public function __construct( $plugin_file ) {
        public function initMetabox(){

            // catch old screen's and translate (in few rare cases)
            if ($this->metaboxScreen == 'zerobs_edit_contact') $this->metaboxScreen = 'zbs-add-edit-contact-edit'; 
            
            if ($this->live){

                // lazy hackaround for now, can be more classy later.
                if (!empty($this->metaboxIcon)) $this->metaboxTitle = '<i class="'.$this->metaboxIcon.' icon"></i> '.$this->metaboxTitle;

                //self::$instance = $this;

                // Create on init, for zbs metaboxes, rather than: add_action( 'add_meta_boxes', array( $this, 'create_meta_box' ) );
                $this->create_meta_box();
                
                // add save func, even if will be blank :)
                // WP was using filters, I'll move to actions (makes more sense to me, having read actions vs filters)
                //add_filter( 'zerobs_save_'.$this->postType, array( $this, 'save_meta_box' ), 10, 2 );
                add_action( 'zerobs_save_'.$this->objType, array( $this, 'save_meta_box' ), $this->saveOrder, 2 );
                // This is fired by edit page do_action

                // this is then set to fire after ALL other save funcs :)
                // ... by way of a 999 priority
                add_action( 'zerobs_save_'.$this->objType, array( $this, 'post_save_meta_box' ), 999, 2 );

            }


        }

        public function create_meta_box() {

            if (isset($this->metaboxScreens) && is_array($this->metaboxScreens)){

                foreach ($this->metaboxScreens as $metaboxScreen){

                    // shown in multiple screens, so add for each

                    if (!empty($metaboxScreen)){

                        zeroBSCRM_add_meta_box(
                            $this->metaboxID, 
                            $this->metaboxTitle,
                            array( $this, 'print_meta_box' ),
                            $metaboxScreen, //$this->metaboxScreen,
                            $this->metaboxArea,
                            $this->metaboxLocation,
                            array(),
                            $this->headless,
                            $this->metaboxClasses,
                            $this->capabilities
                        );  

                    }
                }


            } else {

                // normal, only shown in one place        
                zeroBSCRM_add_meta_box(
                    $this->metaboxID, 
                    $this->metaboxTitle,
                    array( $this, 'print_meta_box' ),
                    $this->metaboxScreen,
                    $this->metaboxArea,
                    $this->metaboxLocation,
                    array(),
                    $this->headless,
                    $this->metaboxClasses,
                    $this->capabilities
                );  

            }
            
        }

        // use this to output data (post nonce :)
        public function html($obj,$metabox){

            // child class will print box here

        }

        /* Not actually used yet... wh used $zbs->pageMessages for brevity, but will work (though will output IN a metabox)
        public function html_msgs($obj,$metabox){

            // This outputs any html msgs directly (probably called by the edit class above)
            if (is_array($this->updateMessages) && count($this->updateMessages) > 0) foreach ($this->updateMessages as $m) echo $m;
        }*/

        // use this to save data in child classes (nonce-checked :)
        public function save_data($objID,$obj){

            // save data

        }

        // use this for post-save data in child classes (nonce-checked :)
        public function post_save_data($objID,$obj){

            // do any actions needed after all metaboxes have saved data

        }

        public function print_meta_box( $obj, $metabox ) {

            // nonce output by parent class
            wp_nonce_field( 'save_' . $this->metaboxID, $this->metaboxID . '_nonce' );

            $this->html($obj,$metabox);


        }

        // Parent class only, let children class simply use func 'save_data'
        public function save_meta_box( $objID, $obj ) {

            // metabox set?
            if (!isset($_POST[$this->metaboxID . '_nonce']) || empty($_POST[$this->metaboxID . '_nonce'] )){ return; }
            // autosave? (legacy, probswill never do as our own page now)
            if( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ){ return; }
            // final nonce check
            if (isset($_POST[$this->metaboxID . '_nonce']) && wp_verify_nonce( $_POST[ $this->metaboxID . '_nonce' ], 'save_' . $this->metaboxID )){

                // here we check if another metabox (e.g. main save record) has fired first + inserted, leaving us an id:)
                global $zbsJustInsertedMetaboxID;
                if ($objID == -1 && isset($zbsJustInsertedMetaboxID) && !empty($zbsJustInsertedMetaboxID) && $zbsJustInsertedMetaboxID > 0) $objID = $zbsJustInsertedMetaboxID;

                // Good to save, this has basically 'checked' the metabox nonce for us, so avoids child-classes having to :)
                $this->save_data($objID,$obj);
                
            }

            return $obj;
        }

        // Parent class only, let children class simply use func 'post_save_data'
        public function post_save_meta_box( $objID, $obj ) {

            // simply fires this
            $this->post_save_data($objID,$obj);

            return $obj;
        }

        // outputs zbs dal notice stack:
        public function dalNoticeMessage($messages=array()){

            $this->dalOutputMessage($messages,'notice',__('General Notice','zero-bs-crm'));

        }

        // outputs zbs dal error stack:
        public function dalErrorMessage($messages=array()){

            $this->dalOutputMessage($messages,'error',__('General Error','zero-bs-crm'));

        }

        // outputs html for a message stack
        public function dalOutputMessage($messages=array(),$type='error',$fallback=''){

            global $zbs;

            // type switch
            switch ($type){

                case 'notice':
                    $classes = 'info green mini';
                    if (empty($fallback)) $fallback = __('General Notice','zero-bs-crm');
                    $msgHeader = __('Update Notice:','zero-bs-crm');
                    $ico = 'sticky note outline';
                    $id = 'generalNotice';
                    break;

                // errs (Default)
                default:
                    $classes = 'info orange mini';
                    if (empty($fallback)) $fallback = __('General Error','zero-bs-crm');
                    $msgHeader = $zbs->DAL->typeStr($zbs->DAL->objTypeKey($this->objType)).' '.__('Could not be saved',"zero-bs-crm");
                    $ico = 'red frown outline';
                    $id = 'couldNotUpdate';
                    break;

            }

            $msgDetail = '';
            if (is_array($messages)) foreach ($messages as $message){

                // < v3.0
                $messageStr = $message;

                // v3.0+ $message becomes a more thoughtful array
                if (is_array($message)){

                    // set this to stop php warnings if not got 'str' attr
                    $messageStr = $fallback;

                    // retrieve
                    if (isset($message['str'])) $messageStr = $message['str'];

                }

                $msgDetail .= $messageStr.'<br />';
            }
            
            // genericified from DAL3.0
            $msg = zeroBSCRM_UI2_messageHTML($classes,$msgHeader,$msgDetail,$ico,$id);

            $zbs->pageMessages[] = $msg;

        }
    }

/* ======================================================
  / Parent Class for all Metabox
   ====================================================== */





/* ======================================================
  Global metabox helper funcs
   ====================================================== */

// ZBS splintered version of add_meta_box (wholly our own from now on, do not assume can be swapped out directly, may need integration)
// https://developer.wordpress.org/reference/functions/add_meta_box/
function zeroBSCRM_add_meta_box( $id, $title, $callback, $screen = null, $context = 'advanced', $priority = 'default', $callback_args = null, $headless = false, $extraClasses = '', $capabilities=false) {

    // $id, $title, $callback,$headless
    //echo 'zeroBSCRM_add_meta_box '.$id.':<pre>'; print_r(array('head'=>$headless)); echo '</pre>';

    global $zbs;

    // simply maintains this array $zbs->metaboxes
    //$zbs->metaboxes[] 
 
    if ( empty( $screen ) ) {
        $screen = get_current_screen();
    } elseif ( is_string( $screen ) ) {
        // leave as is for zbs :) 
         $screen = convert_to_screen( $screen );
    } elseif ( is_array( $screen ) ) {
        foreach ( $screen as $single_screen ) {
            zeroBSCRM_add_meta_box( $id, $title, $callback, $single_screen, $context, $priority, $callback_args, $headless, $extraClasses, $capabilities );
        }
    }
    //  echo 'screen:<pre>'; print_r($screen); echo '</pre>!'; exit();
    if ( ! isset( $screen->id ) ) {
        return;
    }
 
    $page = $screen->id;
 
    if ( !isset($zbs->metaboxes) )
        $zbs->metaboxes = array();
    if ( !isset($zbs->metaboxes[$page]) )
        $zbs->metaboxes[$page] = array();
    if ( !isset($zbs->metaboxes[$page][$context]) )
        $zbs->metaboxes[$page][$context] = array();
 
    foreach ( array_keys($zbs->metaboxes[$page]) as $a_context ) {
        foreach ( array('high', 'core', 'default', 'low') as $a_priority ) {
            if ( !isset($zbs->metaboxes[$page][$a_context][$a_priority][$id]) )
                continue;
 
            // If a core box was previously added or removed by a plugin, don't add.
            if ( 'core' == $priority ) {
                // If core box previously deleted, don't add
                if ( false === $zbs->metaboxes[$page][$a_context][$a_priority][$id] )
                    return;
 
                /*
                 * If box was added with default priority, give it core priority to
                 * maintain sort order.
                 */
                if ( 'default' == $a_priority ) {
                    $zbs->metaboxes[$page][$a_context]['core'][$id] = $zbs->metaboxes[$page][$a_context]['default'][$id];
                    unset($zbs->metaboxes[$page][$a_context]['default'][$id]);
                }
                return;
            }
            // If no priority given and id already present, use existing priority.
            if ( empty($priority) ) {
                $priority = $a_priority;
            /*
             * Else, if we're adding to the sorted priority, we don't know the title
             * or callback. Grab them from the previously added context/priority.
             */
            } elseif ( 'sorted' == $priority ) {
                $title = $zbs->metaboxes[$page][$a_context][$a_priority][$id]['title'];
                $callback = $zbs->metaboxes[$page][$a_context][$a_priority][$id]['callback'];
                $callback_args = $zbs->metaboxes[$page][$a_context][$a_priority][$id]['args'];
                $headless = $zbs->metaboxes[$page][$a_context][$a_priority][$id]['headless'];
                $extraClasses = $zbs->metaboxes[$page][$a_context][$a_priority][$id]['extraclasses'];
                $capabilities = $zbs->metaboxes[$page][$a_context][$a_priority][$id]['capabilities'];
            }
            // An id can be in only one priority and one context.
            if ( $priority != $a_priority || $context != $a_context )
                unset($zbs->metaboxes[$page][$a_context][$a_priority][$id]);
        }
    }
 
    if ( empty($priority) )
        $priority = 'low';

    // default caps
    if (!is_array($capabilities)) $capabilities = array(

            'can_hide'          => false, // can be hidden
            'areas'             => array('normal','side'), // areas can be dragged to - normal side = only areas currently
            'can_accept_tabs'   => false,  // can/can't accept tabs onto it
            'can_become_tab'    => false, // can be added as tab
            'can_minimise'      => true, // can be minimised
            'can_move'          => true // can be moved

        );
 
    if ( !isset($zbs->metaboxes[$page][$context][$priority]) )
        $zbs->metaboxes[$page][$context][$priority] = array();
 
    $zbs->metaboxes[$page][$context][$priority][$id] = array('id' => $id, 'title' => $title, 'callback' => $callback, 'args' => $callback_args, 'headless' => $headless, 'extraclasses' => $extraClasses, 'capabilities' => $capabilities);
}
/**
 * Meta-Box template function (ZBS MODIFIED VER)
 *
 * @global array $zbs->metaboxes
 *
 * @staticvar bool $already_sorted
 *
 * @param string           $screen
 * @param string           $context box context
 * @param mixed            $object  gets passed to the box callback function as first parameter
 * @return int number of meta_boxes
 */
function zeroBSCRM_do_meta_boxes( $screen, $context, $object ) {
        global $zbs;
        static $already_sorted = false;

        if ( empty( $screen ) )
                $screen = get_current_screen();
        elseif ( is_string( $screen ) )
                $screen = convert_to_screen( $screen );
        $page = $screen->id;

        // is this page a new edit: 
        global $zbsPage;
        $isNewEdit = false; if (isset($zbsPage['new_edit'])) $isNewEdit = $zbsPage['new_edit']; //echo 'pre:<pre>'.print_r($zbsPage,1).'</pre>';

        printf('<div id="zbs-%s-sortables" class="zbs-metaboxes zbs-metabox-sortables">', esc_html($context));
        /* This was the previous wp organisation, which nearly worked for us, except we now want tab groups :)
        $hidden = get_hidden_meta_boxes( $screen );
        // Grab the ones the user has manually sorted. Pull them out of their previous context/priority and into the one the user chose
        if ( ! $already_sorted && $sorted = get_user_option( "meta-box-order_$page" ) ) {
                foreach ( $sorted as $box_context => $ids ) {
                        foreach ( explode( ',', $ids ) as $id ) {
                                if ( $id && 'dashboard_browser_nag' !== $id ) {
                                        zeroBSCRM_add_meta_box( $id, null, null, $screen, $box_context, 'sorted' );
                                }
                        }
                }
        }
        */

        //echo 'Screen: '.$zbs->pageKey.' # '.$context;
        // use ours
				$screenOpts = $zbs->global_screen_options(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
        $hidden = array(); if (is_array($screenOpts) && isset($screenOpts['mb_hidden']) && is_array($screenOpts['mb_hidden'])) $hidden = $screenOpts['mb_hidden'];
        $minimised = array(); if (is_array($screenOpts) && isset($screenOpts['mb_mini']) && is_array($screenOpts['mb_mini'])) $minimised = $screenOpts['mb_mini'];

    
        // Basically here 
        // $zbs->metaboxes[ $page ][ $context ] = DEFAULTs
        // $screenOptionsList = USER DESIRED ORDER
        zeroBSCRM_applyScreenOptions($screenOpts,$page,$context);

        $already_sorted = true;
        $i = 0;
        if ( isset( $zbs->metaboxes[ $page ][ $context ] ) ) {
                foreach ( array( 'high', 'sorted', 'core', 'default', 'low' ) as $priority ) {
                        if ( isset( $zbs->metaboxes[ $page ][ $context ][ $priority ]) ) {
                                foreach ( (array) $zbs->metaboxes[ $page ][ $context ][ $priority ] as $boxID => $box ) {
                                        if ( false == $box ) // || ! $box['title']
                                                continue;

                                        // hide_on_new (if this page is edit->new, and this metabox has hide_on_new - just don't load it.)
                                        if ($isNewEdit && isset($box['capabilities']) && isset($box['capabilities']['hide_on_new']) && $box['capabilities']['hide_on_new']){
                                                continue;
                                        }

                                        $i++;

                                        // if tab group  
                                        // https://semantic-ui.com/modules/tab.html#/examples
                                        if (isset($box['istagroup'])){

                                            // this puts out header
                                            zeroBSCRM_do_meta_box_htmlTabHead($boxID,$box);

                                            // this puts out each as body to header
                                            $indx = 0;
                                            foreach ($box['boxes'] as $subbox){

                                                // active tab
                                                $isActive = false; if ($indx == 0) $isActive = true;

                                                // final html - simple normal out
                                                zeroBSCRM_do_meta_box_html($subbox,$page,$hidden,$object,$minimised,true,$isActive);

                                                $indx++;

                                            }

                                        } else {

                                            // final html - simple normal out
                                            zeroBSCRM_do_meta_box_html($box,$page,$hidden,$object,$minimised);

                                        }

                                }
                        }
                }
        }
        echo "</div>";
        return $i;
}

function zeroBSCRM_applyScreenOptions($screenOpts = false,$page = '', $context = ''){

	global $zbs;

	if ( ! is_array( $screenOpts ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$screenOpts = $zbs->global_screen_options(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}
    $screenOptionsList = array(); if (is_array($screenOpts) && isset($screenOpts['mb_'.$context]) && is_array($screenOpts['mb_'.$context])) $screenOptionsList = $screenOpts['mb_'.$context];
    // not needed here: $hidden = array(); if (is_array($screenOpts) && isset($screenOpts['mb_hidden']) && is_array($screenOpts['mb_hidden'])) $hidden = $screenOpts['mb_hidden'];

    // Basically here 
    // $zbs->metaboxes[ $page ][ $context ] = DEFAULTs
    // $screenOptionsList = USER DESIRED ORDER

    // if default + screenoptions order:
        if ( isset( $zbs->metaboxes[ $page ][ $context ] ) && isset($screenOptionsList) && is_array($screenOptionsList) && count($screenOptionsList) > 0 ) {

            // DEBUG echo '<h2>Global</h2><pre>'; print_r($zbs->metaboxes[ $page ][ $context ]); echo '</pre>';
            // DEBUG echo '<h2>User</h2><pre>'; print_r($screenOptionsList); echo '</pre>';

            // so here we merge the two into a MEGA list :)
            $metaboxes = $zbs->metaboxes[ $page ][ $context ]; //array('high'=>array(), 'sorted'=>array(), 'core'=>array(), 'default'=>array(), 'low'=>array());
            $soMetaboxes = array();

            // for the sake of our metaboxes + simplicity
            // for now we'll only use to priority slots 'high','low'
            // ... leaving the others in place.
            // So:
            // - No screen options = load as normal, based on wp priorities (as added in metabox init)
            // - Screen options = load these in order user has saved (all under 'high')
            //  ... when there is a new metabox added by us (so not in 'screenoptions') this is added either 'high' or 'low'
            //  ... always at the end of whatever priority it is given in its metabox init :)

            foreach ($screenOptionsList as $metaboxID => $metaboxVal){

                // these'll be in priority order
                // ... so we PICK them out of wherever they are, and add them to wherever they need to be
                // but because we just store the ID in the screenopts we have to do a bit of a dance..

                // NOTE this also has to catch TABS which are csv's of mb id's
                // here we check if tab
                $tabgroup = false;
                if ($metaboxVal != 'self'){

                    // is tab section
                    $mbIDsToAdd = explode(',', $metaboxVal);
                    $tabgroup = true;

                } else {

                    // only one
                    $mbIDsToAdd = array($metaboxID);

                }

                // then we cycle through each (provided) id
                foreach ($mbIDsToAdd as $mbIDToAdd){

                        // first we find it in existing arrs
                        $existingMB = false;
                        $fromPriority = false;

                            // through each prioty
                            foreach ($metaboxes as $priority => $metaboxArr){

                                // log source
                                $fromPriority = $priority;

                                // through each mb
                                foreach ($metaboxArr as $mbID => $mb){

                                    // found it
                                    if ($mbIDToAdd == $mbID){

                                        // grab item
                                        $existingMB = $mb;
                                        break 2;

                                    }

                                }

                            }

                            // if found it
                            if ($existingMB !== false){

                                // remove it from current place
                                unset($metaboxes[$fromPriority][$mbIDToAdd]);

                                if ($tabgroup){

                                    // set if not set
                                    if (!isset($soMetaboxes[$metaboxID])) $soMetaboxes[$metaboxID] = array();
                                    if (!isset($soMetaboxes[$metaboxID]['boxes'])) $soMetaboxes[$metaboxID]['boxes'] = array();

                                    // add to our pile (of piles)
                                    $soMetaboxes[$metaboxID]['boxes'][$mbIDToAdd] = $existingMB;

                                    // make sure this flag is set
                                    $soMetaboxes[$metaboxID]['istagroup'] = true;


                                } else {

                                    // add to our pile
                                    $soMetaboxes[$metaboxID] = $existingMB;

                                }


                            }

                } // each mb id (1 or tabs multi)

            }

            // now if we have any in our pile, we shoehorn them in at the top of high (for now)
            // so... when we add a new metabox (That people wont have saved in their screen opts)
            // ... it'll do this:
            // if priority = high - add to TOP
            // if priority != high - add at bottom
            if (count($soMetaboxes) > 0){

                $newHighPriority = array();

                // first clone in any in from other high priority array 
                // (this'll catch where we've added new metaboxes that the user doesn't have in their screen opts)
                if (isset($metaboxes['high']) && is_array($metaboxes['high']) && count($metaboxes['high']) > 0) foreach ($metaboxes['high'] as $mbID => $mb){
                    if (!in_array($mbID,array_keys($soMetaboxes))) $newHighPriority[$mbID] = $mb;
                }

                // add ours :)
                $newHighPriority = array_merge($newHighPriority,$soMetaboxes);

                // add any in from other priority arrays
                // (this'll catch where we've added new metaboxes that the user doesn't have in their screen opts)
                foreach ( array( 'sorted', 'core', 'default', 'low' ) as $priority ) {
                    if (isset($metaboxes[$priority]) && count($metaboxes[$priority]) > 0) foreach ($metaboxes[$priority] as $mbID => $mb){
                        if (!in_array($mbID,array_keys($soMetaboxes))) $newHighPriority[$mbID] = $mb;
                    }
                }

                // then overwrite it! (effectively for )
                // actually needs to be totally overwritten $metaboxes['high'] = $newHighPriority;
                $zbs->metaboxes[ $page ][ $context ] = array('high'=>$newHighPriority);

                // and clean up 
                unset($newHighPriority,$soMetaboxes,$metaboxes);

            }

        }
}

//https://semantic-ui.com/modules/tab.html#/examples
function zeroBSCRM_do_meta_box_htmlTabHead($tabsID='',$tabs=false){

    if ($tabs !== false){

        //echo '<h1>'.$tabsID.'</h1><pre>';print_r($tabs); echo '</pre>';
    
        echo '<div class="ui top attached tabular menu zbs-metabox-tabgroup" id="zbs-metaboxtabs-'.esc_attr($tabsID).'" data-tabid="'.esc_attr($tabsID).'">';

            $indx = 0;

            // this puts out each as body to header
            foreach ($tabs['boxes'] as $subbox){

                echo '<a class="item';
                if ($indx == 0) echo ' active';
                echo '" data-tab="'.esc_attr($subbox['id']).'">'. esc_html( $subbox['title'] ) .'</a>';
                $indx++;

            }

        echo '</div>';


    }

}


function zeroBSCRM_do_meta_box_html($box,$page,$hidden,$object,$minimised,$isTabPane=false,$isActiveTab=false){

        /* HTML adapted to suit semantic, from this, the previous wp code: 
        $hidden_class = in_array($box['id'], $hidden) ? ' hide-if-js' : '';
        echo '<div id="' . $box['id'] . '" class="postbox ' . postbox_classes($box['id'], $page) . $hidden_class . '" ' . '>' . "\n";
        if ( 'dashboard_browser_nag' != $box['id'] ) {
                $widget_title = $box[ 'title' ];
                if ( is_array( $box[ 'args' ] ) && isset( $box[ 'args' ][ '__widget_basename' ] ) ) {
                        $widget_title = $box[ 'args' ][ '__widget_basename' ];
                        // Do not pass this parameter to the user callback function.
                        unset( $box[ 'args' ][ '__widget_basename' ] );
                }
                echo '<button type="button" class="handlediv" aria-expanded="true">';
                echo '<span class="screen-reader-text">' . sprintf( __( 'Toggle panel: %s', 'zero-bs-crm' ), $widget_title ) . '</span>';
                echo '<span class="toggle-indicator" aria-hidden="true"></span>';
                echo '</button>';
        }
        echo "<h2 class='hndle'><span>{$box['title']}</span></h2>\n";
        echo '<div class="inside">' . "\n";
        call_user_func($box['callback'], $object, $box);
        echo "</div>\n";
        echo "</div>\n";
        */

        $htmlClasses = 'ui segment'; 

        // headless?
        $headless = false; if (isset($box['headless']) && $box['headless']) $headless = true;

        // extra classes
        $extraClasses = ''; if (isset($box['extraclasses']) && $box['extraclasses']) $extraClasses = $box['extraclasses'];

        // convert capabilites into data-atr
        // these get added to headed meta only...
        // Also set vars here e.g. canMinimise 
        $dataAttrStr = ''; $canMinimise = false; $canHide = false; $canMove = false;
        if (isset($box['capabilities']) && is_array($box['capabilities'])){

            if (isset($box['capabilities']['can_minimise']) && $box['capabilities']['can_minimise']) $canMinimise = true;
            if (isset($box['capabilities']['can_hide']) && $box['capabilities']['can_hide']) $canHide = true;
            if (isset($box['capabilities']['can_move']) && $box['capabilities']['can_move']) $canMove = true;


            foreach ($box['capabilities'] as $capKey => $capVal){
                if (!empty($dataAttrStr)) $dataAttrStr .= ' ';

                // arrays get csv'd
                $capVStr = ''; 
                if (is_array($capVal)) 
                    $capVStr = implode(',', $capVal);
                else
                    $capVStr = $capVal;

                $dataAttrStr .= 'data-'.str_replace('_','-',$capKey).'="'.$capVStr.'"';
            }

        }

        // classes
        $classes = 'zbs-metabox'; $extraAttrs = '';

        // hidden class
        $classes .= in_array($box['id'], $hidden) ? ' hide-if-js zbs-hidden' : '';

        // minimised class
        $classes .= in_array($box['id'], $minimised) ? ' zbs-minimised' : '';

        // static class
        $classes .= $canMove ? '' : ' zbs-static';

        // if is a tab pane...
        // class="ui bottom attached tab segment active" data-tab="first"
        if ($isTabPane) {
            $classes .= ' ui bottom attached tab segment';
            if ($isActiveTab) $classes .= ' active';
            $extraAttrs .= ' data-tab="'.$box['id'].'"';

            // always
            $canMinimise = false;
            $headless = true;
            $htmlClasses = '';
        }


        echo '<div class="'.esc_attr($classes).'" id="' . esc_attr($box['id']) . '" '.esc_attr($extraAttrs.$dataAttrStr).'>';


            // hide/minimise option
            $hideMinimiseMenu = '';
            if ($canMinimise){

                // minimise - <i class="dropdown icon"></i> 
                // now inc both carets, class presence turns on/off
                $hideMinimiseMenu = '<div class="ui right item zbs-metabox-minimise"><i class="caret up icon"></i><i class="caret down icon"></i></div>';
                
            }

            if (!$headless){
                echo '<div id="' . esc_attr( $box['id'] ) . '-head" class="zbs-metabox-head ui top attached borderless menu '. esc_attr( $extraClasses . postbox_classes($box['id'], $page) ) . '" ' . '>' . "\n"; //. $hidden_class
                /* not sure if we need this :)
                if ( 'dashboard_browser_nag' != $box['id'] ) {
                        $widget_title = $box[ 'title' ];
                        if ( is_array( $box[ 'args' ] ) && isset( $box[ 'args' ][ '__widget_basename' ] ) ) {
                                $widget_title = $box[ 'args' ][ '__widget_basename' ];
                                // Do not pass this parameter to the user callback function.
                                unset( $box[ 'args' ][ '__widget_basename' ] );
                        }
                        echo '<button type="button" class="handlediv" aria-expanded="true">';
                        echo '<span class="screen-reader-text">' . sprintf( __( 'Toggle panel: %s', 'zero-bs-crm' ), $widget_title ) . '</span>';
                        echo '<span class="toggle-indicator" aria-hidden="true"></span>';
                        echo '</button>';
                } */
                
                    // txt
                    echo '<div class="header item">'.$box['title'].'</div>'.$hideMinimiseMenu."\n";

                    // right hand menu, if one
                    /* For now, was css glitching, can look later as don't need yet
                    echo '<div class="right menu">';

                        // drop down
                        echo '<div class="ui dropdown icon item"><i class="angle double up icon"></i>';

                            echo '<div class="menu">';

                                echo '<div class="item">Testing</div>';

                            echo '</div>';

                        echo '</div>';// / dropdown

                    echo '</div>';
                    */


                echo '</div>';

                $htmlClasses .= ' bottom attached';
            }
            echo '<div id="' . esc_attr($box['id']) . '-box" class="zbs-metabox-body '.esc_attr($htmlClasses).' '.esc_attr($extraClasses).'">' . "\n"; //$hidden_class.
                call_user_func($box['callback'], $object, $box);
            echo "</div>"; // /.zbs-metabox-body
            echo '<div id="' . esc_attr($box['id']) . '-block" class="zbs-metabox-block"><div>'.$box['title'].'</div></div>'; // this is BLOCKER for drag-drop support -//<i class="arrows alternate icon"></i>
        echo "</div>\n";
}


// retrieves metabox list for current page (all contexts)
// does so without priorities (e.g. high,low)
function zeroBSCRM_getCurrentMetaboxesFlatArr(){

    $mb = array('normal'=>array(),'side'=>array());
    $mbWithPriorities = zeroBSCRM_getCurrentMetaboxes();

    if (is_array($mbWithPriorities)){

        foreach ( array( 'normal', 'side' ) as $context ) {

            foreach ( array( 'high', 'sorted', 'core', 'default', 'low' ) as $priority ) {

                if (isset($mbWithPriorities[$context]) && isset($mbWithPriorities[$context][$priority]) && is_array($mbWithPriorities[$context][$priority])){

                    $mb[$context] = array_merge($mb[$context],$mbWithPriorities[$context][$priority]);
                }

            }
        }

    }


    return $mb;

}

// retrieves metabox list for current page (all contexts)
function zeroBSCRM_getCurrentMetaboxes(){

    global $zbs;

    $metaboxes = array();
    $pageKey = $zbs->pageKey;

    // cycle through context/[priority]
    foreach ( array( 'normal', 'side' ) as $context ) {

        $mb = zeroBSCRM_getMetaboxes($pageKey,$context);
        //echo 'pagekey:'.$pageKey.'+'.$context.'<br><pre>'; print_r($mb); echo '</pre>';

        if (is_array($mb) && count($mb) > 0) $metaboxes[$context] = $mb;

    }

    return $metaboxes;

}

// retrieves metabox list for a page + context
// (NOTE: Does not sort by user screen options)
function zeroBSCRM_getMetaboxes($page='',$context=''){
    
    global $zbs;

    if (isset($zbs->metaboxes[ $page ]) && isset($zbs->metaboxes[ $page ][ $context ])) return $zbs->metaboxes[ $page ][ $context ];

    return array();

}
