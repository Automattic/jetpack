<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 20/02/2019
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */




/* ======================================================
   Init Func
   ====================================================== */

   function zeroBSCRM_FormsMetaboxSetup(){

        // form language labels
        $zeroBS__Metabox_FormLanguage = new zeroBS__Metabox_FormLanguage( __FILE__ );

        // form settings
        $zeroBS__Metabox_FormSettings = new zeroBS__Metabox_FormSettings( __FILE__ );

        // form embed info
        $zeroBS__Metabox_FormEmbed = new zeroBS__Metabox_FormEmbed( __FILE__ );

        ##WLREMOVE
        // upsell more fields
        if (!zeroBSCRM_hasPaidExtensionActivated()) $zeroBS__Metabox_FormMoreFields = new zeroBS__Metabox_FormMoreFields( __FILE__ );
        ##/WLREMOVE
        
        // save
        $zeroBS__Metabox_FormActions = new zeroBS__Metabox_FormActions( __FILE__ );

   }

   add_action( 'admin_init','zeroBSCRM_FormsMetaboxSetup');

/* ======================================================
   / Init Func
   ====================================================== */


/* ======================================================
  Forms v3 Language Metabox
   ====================================================== */

    class zeroBS__Metabox_FormLanguage extends zeroBS__Metabox{ 
        
        // this is for catching 'new' forms
        private $newRecordNeedsRedir = false;

        // this is to save + edit $fieldPrefix = 'zbsf_';
        private $fieldPrefix = 'zbsf_';

        public function __construct( $plugin_file ) {

            // set these
            // DAL3 switched for objType $this->postType = 'zerobs_customer';
            $this->objType = 'form';
            $this->metaboxID = 'zerobs-form-edit';
            $this->metaboxTitle = __('Form Language Labels','zero-bs-crm');
            $this->metaboxScreen = 'zbs-add-edit-form-edit';
            $this->metaboxArea = 'normal';
            $this->metaboxLocation = 'high';
            $this->saveOrder = 1;
            $this->capabilities = array(

                'can_hide'          => false, // can be hidden
                'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => false, // can be added as tab
                'can_minimise'      => true, // can be minimised
                'can_move'          => true // can be moved

            );

            // call this 
            $this->initMetabox();

        }

        public function html( $form, $metabox ) {

                // localise ID
                $formID = -1; if (is_array($form) && isset($form['id'])) $formID = (int)$form['id'];

                // if new + $zbsObjDataPrefill passed, use that instead of loaded trans.
                if ($formID == -1){
                    global $zbsObjDataPrefill;
                    $form = $zbsObjDataPrefill;
                }

                // fields 
                global $zbsFormFields;

                ?>

				<script type="text/javascript">var zbscrmjs_secToken = '<?php echo esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ); ?>';</script>
                
                <table class="form-table wh-metatab wptbp">
                <?php foreach ($zbsFormFields as $fieldK => $fieldV){

                    #} Ignore no and date, dealt with above
                   switch ($fieldV[0]){

                        case 'text':

                            ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldK ); ?>"><?php esc_html_e($fieldV[1],"zero-bs-crm"); ?>:</label></th>
                            <td>
                                <input type="text" name="<?php echo esc_attr( $this->fieldPrefix.$fieldK ); ?>" id="<?php echo esc_attr( $fieldK ); ?>" class="form-control widetext" placeholder="<?php echo !empty( $fieldV[2] ) ? esc_attr( __( $fieldV[2], 'zero-bs-crm' ) ) : ''; ?>" value="<?php echo !empty( $form[$fieldK] ) ? esc_attr( $form[$fieldK] ) : ''; ?>" />
                            </td></tr><?php

                            break;


                        case 'textarea':

                            ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldK ); ?>"><?php esc_html_e($fieldV[1],"zero-bs-crm"); ?>:</label></th>
                            <td>
                                <textarea name="<?php echo esc_attr( $this->fieldPrefix.$fieldK ); ?>" id="<?php echo esc_attr( $fieldK ); ?>" class="form-control" placeholder="<?php echo !empty( $fieldV[2] ) ? esc_attr( __( $fieldV[2], 'zero-bs-crm' ) ) : ''; ?>"><?php echo !empty( $form[$fieldK] ) ? esc_textarea( $form[$fieldK] ) : ''; ?></textarea>
                            </td></tr><?php

                            break;

                    }

                }

                ?></table>
            <div class="clear"></div><?php

        }

        public function save_data( $form_id, $form ) {

            if (!defined('ZBS_OBJ_SAVED')){

                // debug if (get_current_user_id() == 12) echo 'FIRING<br>';

                define('ZBS_OBJ_SAVED',1);

                // DAL3.0+
                global $zbs;

                // check this
                if (empty($form_id) || $form_id < 1)  $form_id = -1;

                /* old way:

                    global $zbsFormFields;
                    foreach ($zbsFormFields as $fK => $fV){
                        $zbsFormFieldMeta[$fK] = '';
                        if (isset($_POST['zbscf_'.$fK])) {
                            switch ($fV[0]){
                                case 'text':
                                    $zbsFormFieldMeta[$fK] = zeroBSCRM_textProcess($_POST['zbscf_'.$fK]);
                                    break;
                                case 'textarea':
                                    $zbsFormFieldMeta[$fK] = zeroBSCRM_textProcess($_POST['zbscf_'.$fK]);
                                    break;
                                default:
                                    $zbsFormFieldMeta[$fK] = sanitize_text_field($_POST['zbscf_'.$fK]);
                                    break;
                            }
                        }
                    }
                    update_post_meta($post_id, 'zbs_form_field_meta', $zbsFormFieldMeta);

                */

                // DAL3 way: 
                $autoGenAutonumbers = true; // generate if not set :)
                $form = zeroBS_buildObjArr($_POST,array(),$this->fieldPrefix,'',false,ZBS_TYPE_FORM,$autoGenAutonumbers);

                // add/update
                $addUpdateReturn = $zbs->DAL->forms->addUpdateForm(array(

                            'id'    => $form_id,
                            'data'  => $form,
                            'limitedFields' => -1,

                    ));

                // Note: For NEW objs, we make sure a global is set here, that other update funcs can catch 
                // ... so it's essential this one runs first!
                // this is managed in the metabox Class :)
                if ($form_id == -1 && !empty($addUpdateReturn) && $addUpdateReturn != -1) {
                    
                    $form_id = $addUpdateReturn;
                    global $zbsJustInsertedMetaboxID; $zbsJustInsertedMetaboxID = $form_id;

                    // set this so it redirs
                    $this->newRecordNeedsRedir = true;
                }

                // success?
                if ($addUpdateReturn != -1 && $addUpdateReturn > 0){

                    // Update Msg
                    // this adds an update message which'll go out ahead of any content
                    // This adds to metabox: $this->updateMessages['update'] = zeroBSCRM_UI2_messageHTML('info olive mini zbs-not-urgent',__('Contact Updated',"zero-bs-crm"),'','address book outline','contactUpdated');
                    // This adds to edit page
                    $this->updateMessage();

                    // catch any non-critical messages
                    $nonCriticalMessages = $zbs->DAL->getErrors(ZBS_TYPE_FORM);
                    if (is_array($nonCriticalMessages) && count($nonCriticalMessages) > 0) $this->dalNoticeMessage($nonCriticalMessages);


                } else {

                    // fail somehow
                    $failMessages = $zbs->DAL->getErrors(ZBS_TYPE_FORM);

                    // show msg (retrieved from DAL err stack)
                    if (is_array($failMessages) && count($failMessages) > 0)
                        $this->dalErrorMessage($failMessages);
                    else
                        $this->dalErrorMessage(array(__('Insert/Update Failed with general error','zero-bs-crm')));

                    // pass the pre-fill:
                    global $zbsObjDataPrefill; $zbsObjDataPrefill = $form;

        
                }

            }

            return $form;
        }

        // This catches 'new' contacts + redirs to right url
        public function post_save_data($objID,$obj){

            if ($this->newRecordNeedsRedir){

                global $zbsJustInsertedMetaboxID;
                if (!empty($zbsJustInsertedMetaboxID) && $zbsJustInsertedMetaboxID > 0){

                    // redir
                    wp_redirect( jpcrm_esc_link('edit',$zbsJustInsertedMetaboxID,$this->objType) );
                    exit;

                }

            }

        }

        public function updateMessage(){

            global $zbs;

            // zbs-not-urgent means it'll auto hide after 1.5s
            // genericified from DAL3.0
            $msg = zeroBSCRM_UI2_messageHTML('info olive mini zbs-not-urgent',$zbs->DAL->typeStr($zbs->DAL->objTypeKey($this->objType)).' '.__('Updated',"zero-bs-crm"),'','address book outline','contactUpdated');

            $zbs->pageMessages[] = $msg;

        }

    }


/* ======================================================
  / Forms v3 Language Metabox
   ====================================================== */


/* ======================================================
  Forms Settings v3 Metabox
   ====================================================== */

    class zeroBS__Metabox_FormSettings extends zeroBS__Metabox{ 
        
        // this is for catching 'new' contacts
        private $newRecordNeedsRedir = false;

        // this is to save + edit $fieldPrefix = 'zbsf_';
        private $fieldPrefix = 'zbsf_';

        public function __construct( $plugin_file ) {

            // set these
            // DAL3 switched for objType $this->postType = 'zerobs_customer';
            $this->objType = 'form';
            $this->metaboxID = 'zerobs-form-settings';
            $this->metaboxTitle = __('Form Settings','zero-bs-crm');
            $this->metaboxScreen = 'zbs-add-edit-form-edit';
            $this->metaboxArea = 'normal';
            $this->metaboxLocation = 'high';
            $this->saveOrder = 1;
            $this->capabilities = array(

                'can_hide'          => false, // can be hidden
                'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => false, // can be added as tab
                'can_minimise'      => true, // can be minimised
                'can_move'          => true // can be moved

            );

            // call this 
            $this->initMetabox();

        }

        public function html( $form, $metabox ) {

                // localise ID
                $formID = -1; if (is_array($form) && isset($form['id'])) $formID = (int)$form['id'];

                //pre-processing
                 $formcss = ZEROBSCRM_URL . 'css/ZeroBSCRM.admin.frontform.css';
                 $formjs = ZEROBSCRM_URL . 'js/ZeroBSCRM.leadform.js?ver=1.17';
                 $formRoot = get_site_url().'/crmforms';
                 
                 //$zbsfs = get_post_meta($formID,'zbs_form_style',true);
                 // DAL3+ saved in obj
                 $zbsfs = 'simple'; if (is_array($form) && isset($form['style'])) $zbsfs = $form['style'];

            ?>
            <input type="hidden" name="<?php echo esc_attr( $this->fieldPrefix ); ?>style" id="zbs_form_style_post" value="<?php echo esc_attr( $zbsfs ); ?>" />

            <h1 class="welcomeh1"><?php esc_html_e('Welcome to Jetpack CRM Form Creator',"zero-bs-crm");?></h1>
            <h3 class="welcomeh3"><?php esc_html_e("Choose your style for the form you wish to embed (click to choose)","zero-bs-crm");?></h3>
            <p class="zbs_msg"><?php esc_html_e('Make sure to save the form before using the shortcode',"zero-bs-crm");?>.</p>
            <div class="zbs_shortcode_message">
            <p><?php esc_html_e('You can embed this form on this website using the shortcode below (choose your style first). To embed the form on a seperate website use the embed code in the "Embed Code" box below.',"zero-bs-crm");?></p>
            <p class="shorty"><?php if ($formID > 0){

                ?>[jetpackcrm_form id="<?php echo esc_attr( $formID ); ?>" style="<?php  echo esc_attr( $zbsfs ); ?>"]<?php 

            } ?></p>
            </div>

            <div id="form-chooser">
                <!-- 3 styles for now - naked, simple and content grab -->
                <div class="third" id="naked-form">
                    <div class="naked choice <?php if($zbsfs == 'naked'){ echo 'selected';} ?>" data-pid="<?php echo esc_attr( $formID ); ?>" data-style="naked">
                        <div class="blobby" style="margin-bottom:13px;">
                            <p>Lorem Ipsum Text here</p>
                            <p>Lorem Ipsum <span class="br">s</span> Text <span class="br">s</span> here</p>
                            <p>Lorem Ipsum Text here</p>
                            <p>Lorem Ipsum Text here</p>
                            <p>Lorem Ipsum <span class="br">s</span> Text <span class="br">s</span> here</p>
                            <p>Lorem Ipsum Text here</p>
                        </div>
                        <div class="content">
                             <div class="form-wrapper">
                                <div class="input"><?php if(!empty($zbsForm['fname'])){ echo esc_html( $zbsForm['fname'] ); }else{ echo "First Name"; } ?></div><div class="input"><?php if(!empty($zbsForm['email'])){ echo esc_html( $zbsForm['email'] ); }else{ esc_html_e("Email","zero-bs-crm"); } ?></div><div class="send"><?php if(!empty($zbsForm['submit'])){ echo esc_html( $zbsForm['submit'] ); }else{ echo "Submit"; } ?></div>
                            </div>
                        </div>
                        <div class="clear"></div>
                        <div class="blobby">
                            <p>Lorem Ipsum Text here</p>
                            <p>Lorem Ipsum <span class="br">s</span> Text Lorem Ipsum m Ipsum <span class="br">s</span> here</p>
                            <p>Lorem Ipsum Text here</p>
                            <p>Lorem Ipsum Text here</p>
                            <p>Lorem Ipsum <span class="br">s</span> Text <span class="br">s</span> here</p>
                            <p>Lorem Ipsum Text here</p>
                        </div>
                    </div>
                    <div class="caption"><?php esc_html_e("Naked Style","zero-bs-crm");?></div>
                    <div id="naked_html_form" class="hide">
                        
                        <div class='zbs_form_content_wrap <?php if($zbsfs == 'naked'){ echo 'embed-selected';} ?>'>&lt;iframe src='<?php echo esc_html($formRoot); ?>/naked/?fid=<?php echo esc_html( $formID ); ?>' height='200px' width='700px' style='border:0px!important'&gt;&lt;/iframe&gt;
                        </div> <!-- end form content grab -->
                    </div>
                </div>

                <div class="third" id="cgrab-form">
                    <div class="cgrab choice <?php if($zbsfs == 'cgrab'){ echo 'selected';} ?>" data-pid="<?php echo esc_attr( $formID ); ?>" data-style="cgrab">
                        <div class="blobby">
                            <p>Lorem Ipsum Text here</p>
                        </div>
                        <div class="content">
                            <h1><?php if(!empty($zbsForm['header'])){ echo esc_html( $zbsForm['header'] ); }else{ echo "Want to find out more?"; } ?></h1>
                            <h3><?php if(!empty($zbsForm['subheader'])){ echo esc_html( $zbsForm['subheader'] ); }else{ echo "Drop us a line. We follow up on all contacts"; } ?></h3>
                            <div class="form-wrapper">
                                <div class="input"><?php if(!empty($zbsForm['fname'])){ echo esc_html( $zbsForm['fname'] ); }else{ echo "First Name"; } ?></div>
                                <div class="input"><?php if(!empty($zbsForm['lname'])){ echo esc_html( $zbsForm['lname'] ); }else{ echo "Last Name"; } ?></div>
                                <div class="input"><?php if(!empty($zbsForm['email'])){ echo esc_html( $zbsForm['email'] ); }else{ echo "Email"; } ?></div>
                                <div class="textarea"><?php if(!empty($zbsForm['notes'])){ echo esc_html( $zbsForm['notes'] ); }else{ echo "Your Message"; } ?></div>
                                <div class="send"><?php if(!empty($zbsForm['submit'])){ echo esc_html( $zbsForm['submit'] ); }else{ echo "Submit"; } ?></div>
                            </div>
                            <div class="clear"></div>
                            <div class="trailer"><?php if(!empty($zbsForm['spam'])){ echo esc_html( $zbsForm['spam'] ); }else{ echo "We will not send you spam. Our team will be in touch within 24 to 48 hours Mon-Fri (but often much quicker)"; } ?></div>
                        </div>
                        <div class="clear"></div>
                        <div class="blobby">
                            <p>Lorem Ipsum <span class="br">s</span> Text Lorem Ipsum m Ipsum <span class="br">s</span> here</p>
                        </div>
                    </div>
                    <div class="caption"><?php esc_html_e("Content Grab","zero-bs-crm");?></div>
                    <div id="cgrab_html_form" class="hide">
                        
    <div class='zbs_form_content_wrap <?php if($zbsfs == 'cgrab'){ echo 'embed-selected';} ?>'>&lt;iframe src='<?php echo esc_html( $formRoot ); ?>/content/?fid=<?php echo esc_html( $formID ); ?>' height='700px' width='700px' style='border:0px!important'&gt;&lt;/iframe&gt;
    </div> <!-- end form content grab -->
                    </div>


                </div>


                <div class="third" id="simple-form">
                    <div class="simple choice <?php if($zbsfs == 'simple'){ echo 'selected';} ?>" data-pid="<?php echo esc_attr( $formID ); ?>" data-style="simple">
                        <div class="blobby">
                            <p>Lorem Ipsum Text here</p>
                            <p>Lorem Ipsum <span class="br">s</span> Text <span class="br">s</span> here</p>
                            <p>Lorem Ipsum Text here</p>
                        </div>
                        <div class="content">
                            <h1><?php if(!empty($zbsForm['header'])){ echo esc_html( $zbsForm['header'] ); }else{ echo "Want to find out more?"; } ?></h1>
                            <h3><?php if(!empty($zbsForm['subheader'])){ echo esc_html( $zbsForm['subheader'] ); }else{ echo "Drop us a line. We follow up on all contacts"; } ?></h3>
                            <div class="form-wrapper">
                                <div class="input"><?php if(!empty($zbsForm['email'])){ echo esc_html( $zbsForm['email'] ); }else{ echo "Email"; } ?></div><div class="send"><?php if(!empty($zbsForm['submit'])){ echo esc_html( $zbsForm['submit'] ); }else{ echo "Submit"; } ?></div>
                            </div>
                            <div class="clear"></div>
                            <div class="trailer"><?php if(!empty($zbsForm['spam'])){ echo esc_html( $zbsForm['spam'] ); }else{ echo "We will not send you spam. Our team will be in touch within 24 to 48 hours Mon-Fri (but often much quicker)"; } ?></div>
                        </div>
                        <div class="clear"></div>
                        <div class="blobby">
                            <p>Lorem Ipsum Text here</p>
                            <p>Lorem Ipsum <span class="br">s</span> Text Lorem Ipsum m Ipsum <span class="br">s</span> here</p>
                            <p>Lorem Ipsum Text here</p>
                        </div>
                    </div>
                    <div class="caption"><?php esc_html_e("Simple Style","zero-bs-crm");?></div>
                    <div id="simple_html_form" class="hide">
                        <div class='zbs_form_content_wrap <?php if($zbsfs == 'simple'){ echo 'embed-selected';} ?>'>&lt;iframe src='<?php echo esc_html( $formRoot ); ?>/simple/?fid=<?php echo esc_html( $formID ); ?>' height='300px' width='700px' style='border:0px!important'&gt;&lt;/iframe&gt;
                        </div> <!-- end form content grab -->
                    </div>
                </div>
      



            </div>
            <?php /* WH removed, don't seem to be meaningfully used?
            ... moved into proper vars to stop this usage.
            <div id="zbs_form_css" data-css="<?php echo $formcss; ?>"></div>
            <div id="zbs_form_js" data-js="<?php echo $formjs; ?>"></div>
            <div id="zbs_form_action" data-zbsformaction="<?php echo esc_url( admin_url('admin-post.php') ); ?>"></div>

            */ ?>


            <script type="text/javascript">

                var zeroBSCRMFormUrls = {

                    'css' : '<?php echo esc_html( $formcss ); ?>',
                    'js' : '<?php echo esc_html( $formjs ); ?>'
                }
                jQuery(function(){


                    //can move to a seperate script at some point....
                    jQuery('.choice').off("click").on("click",function(e){


                        jQuery('#zbs-form-pre').html(''); //clear out the HTML
                        var zbsf_pid = jQuery(this).data('pid');
                        var zbsf_style = jQuery(this).data('style');

                        jQuery('#zbs_form_style_post').val(zbsf_style);                    
                        if(jQuery('#'+zbsf_style+'_html_form .form-wrapper').hasClass('zbs-form-wrap')){
                           console.log('we have a form inside the wrapper');
                        }else{
                            ///not used? var zbsf_action = jQuery('#zbs_form_action').data('zbsformaction');
                            jQuery('#'+zbsf_style+'_html_form .form-wrapper').wrap("<form action='#' class='zbs-form-wrap' method='post'></form>");
                            jQuery('#'+zbsf_style+'_html_form .form-wrapper').addClass('zbs-form-wrap');
                        }

                        var zbsf_html = jQuery('#'+zbsf_style+'_html_form .zbs_form_content_wrap').html();  //replace with proper HTML form elements
                        // switched for proper global var ^ var zbsf_html_css_link = jQuery('.zbs_form_css').data('css');
                        var zbsf_css_link = "<link rel='stylesheet' href='"+window.zeroBSCRMFormUrls.css +"' type='text/css' media='all' />";

                        //not used? var zbsf_html_js_link = jQuery('#zbs_form_js').data('js');
                        //not used? console.log(zbsf_html_js_link);
                        var zbsf_js_link = "<script type='text/javascript' src='>";
                        zbsf_js_link += jQuery('.ZBSencodedJS').html();
                        //console.log(zbsf_html_css_link);
                        var zbsf_html_encoded =  zbsf_html;

                        jQuery('.choice').removeClass('selected');
                        jQuery(this).addClass('selected');
                        jQuery('.zbs_shortcode_message').show();
                        jQuery('.shorty').html('[jetpackcrm_form id="'+zbsf_pid+'" style="'+zbsf_style+'"]').show();

                        jQuery('#zbs-form-pre').html(zbsf_html_encoded);
                    });

                });</script>
            <div class="clear"></div><?php

        }

        public function save_data( $form_id, $form ) {

                // DAL3.0+
                global $zbs;

                // check this
                if (empty($form_id) || $form_id < 1)  $form_id = -1;

                /* old way:


                    //save down the settings...
                    $zbfs = $_POST['zbs_form_style_post'];
                    update_post_meta($post->ID,'zbs_form_style', $zbfs);
                    $zbs_form_conv = get_post_meta($post->ID, 'zbs_form_conversions', true);
                    $zbs_form_views = get_post_meta($post->ID, 'zbs_form_views', true);
                    if($zbs_form_conv == ''){
                        update_post_meta($post->ID,'zbs_form_conversions',0);
                    }
                    if($zbs_form_views == ''){
                        update_post_meta($post->ID,'zbs_form_views',0);
                    }

                    .. V3 + nothing to do here, main langlabels box does save of style (zbs_form_style_post)

                */

            return $form;

        }


    }


/* ======================================================
  / Forms Settings v3 Metabox
   ====================================================== */



/* ======================================================
  Forms embed v3 Metabox
   ====================================================== */

    class zeroBS__Metabox_FormEmbed extends zeroBS__Metabox{ 

        public function __construct( $plugin_file ) {

            // set these
            // DAL3 switched for objType $this->postType = 'zerobs_customer';
            $this->objType = 'form';
            $this->metaboxID = 'zerobs-form-embed';
            $this->metaboxTitle = __('Form Embedding','zero-bs-crm');
            $this->metaboxScreen = 'zbs-add-edit-form-edit';
            $this->metaboxArea = 'normal';
            $this->metaboxLocation = 'low';
            $this->saveOrder = 1;
            $this->capabilities = array(

                'can_hide'          => false, // can be hidden
                'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => false, // can be added as tab
                'can_minimise'      => true, // can be minimised
                'can_move'          => true // can be moved

            );

            // call this 
            $this->initMetabox();

        }

        public function html( $form, $metabox ) {

                global $zbs;

                // localise ID
                $formID = -1; if (is_array($form) && isset($form['id'])) $formID = (int)$form['id'];
                $zbsfs = 'simple'; if (is_array($form) && isset($form['style'])) $zbsfs = $form['style'];
             
                // get js url
                $formjs = ZEROBSCRM_URL . 'js/ZeroBSCRM.leadform.js?ver='.$zbs->version;

            ?><div id="form-embed">
                <h1 class="welcomeh1"><?php esc_html_e('Embed Code',"zero-bs-crm");?></h1>
                <h3 class="welcomeh3"><?php esc_html_e('Use the code below to embed this form on another site',"zero-bs-crm");?></h3>
                <pre id="zbs-form-pre"></pre>
            </div>
            <script type="text/javascript">
                jQuery(function(){
                    
                    // initial embed code, rest dealt with by style selection
                    var zbsembed = jQuery('.embed-selected').html();
                    jQuery('#zbs-form-pre').html(zbsembed);

                });
            </script>
            <div class='ZBSencodedJS hide'>&lt;script type='text/javascript' src='<?php echo esc_html( $formjs ); ?>'&gt;&lt;/script&gt;</div>
            <?php

        }

    }
/* ======================================================
  / Forms embed v3 Metabox
   ====================================================== */



/* ======================================================
  Forms get more fields v3 Metabox
   ====================================================== */

    class zeroBS__Metabox_FormMoreFields extends zeroBS__Metabox{ 

        public function __construct( $plugin_file ) {

            // set these
            // DAL3 switched for objType $this->postType = 'zerobs_customer';
            $this->objType = 'form';
            $this->metaboxID = 'zerobs-form-morefields';
            $this->metaboxTitle = __('Want More Fields?','zero-bs-crm');
            $this->metaboxScreen = 'zbs-add-edit-form-edit';
            $this->metaboxArea = 'normal';
            $this->metaboxLocation = 'low';
            $this->saveOrder = 1;
            $this->capabilities = array(

                'can_hide'          => false, // can be hidden
                'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => false, // can be added as tab
                'can_minimise'      => true, // can be minimised
                'can_move'          => true // can be moved

            );

            ##WLREMOVE
            $this->initMetabox();
            ##/WLREMOVE

        }

        public function html( $form, $metabox ) {

                // this was in as js, wh converted for v3+
                $moreTitle = __('Need More Fields?',"zero-bs-crm");
                $moreDesc = __('Jetpack CRM forms cover simple use contact and subscription forms, but if you need more we suggest using a form plugin like Contact Form 7 or Gravity Forms:',"zero-bs-crm").' <a href="https://jetpackcrm.com/feature/forms/#benefit" target="_blank">'.__('See Options','zero-bs-crm').'</a>';
                $moreFinal = '<div id="form-upsell"><h1 class="welcomeh1">'.$moreTitle.'</h1><p style="text-align:center;padding: 2em;font-size: 1.2em;padding-top: 0;">'.$moreDesc.'</p></div>';

                echo $moreFinal;

        }

    }
/* ======================================================
  / Forms get more fields v3 Metabox
   ====================================================== */


/* ======================================================
    Form Action Metabox
   ====================================================== */

    class zeroBS__Metabox_FormActions extends zeroBS__Metabox{ 

        public function __construct( $plugin_file ) {

            // set these
            $this->objType = 'form';
            $this->metaboxID = 'zerobs-form-actions';
            $this->metaboxTitle = __('Form','zero-bs-crm').' '.__('Actions','zero-bs-crm'); // will be headless anyhow
            $this->headless = true;
            $this->metaboxScreen = 'zbs-add-edit-form-edit';
            $this->metaboxArea = 'side';
            $this->metaboxLocation = 'high';
            $this->saveOrder = 1;
            $this->capabilities = array(

                'can_hide'          => false, // can be hidden
                'areas'             => array('side'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => false, // can be added as tab
                'can_minimise'      => true, // can be minimised
                'can_move'          => true // can be moved

            );

            // call this 
            $this->initMetabox();

        }

        public function html( $form, $metabox ) {

            ?><div class="zbs-generic-save-wrap">

                    <div class="ui medium dividing header"><i class="save icon"></i> <?php esc_html_e('Form Actions','zero-bs-crm'); ?></div>

            <?php

            // localise ID & content
            $formID = -1; if (is_array($form) && isset($form['id'])) $formID = (int)$form['id'];
            

                #} if a saved obj...
                if ($formID > 0){ // existing

                    ?>

                    <div class="zbs-form-actions-bottom zbs-objedit-actions-bottom">

                        <button class="ui button green" type="button" id="zbs-edit-save"><?php esc_html_e("Update","zero-bs-crm"); ?> <?php esc_html_e("Form","zero-bs-crm"); ?></button>

                        <?php

                            // delete?

                         // for now just check if can modify, later better, granular perms.
                         if ( zeroBSCRM_permsQuotes() ) { 
                        ?><div id="zbs-form-actions-delete" class="zbs-objedit-actions-delete">
                             <a class="submitdelete deletion" href="<?php echo jpcrm_esc_link( 'delete', $formID, 'form' ); ?>"><?php esc_html_e('Delete Permanently', "zero-bs-crm"); ?></a>
                        </div>
                        <?php } // can delete  ?>
                        
                        <div class='clear'></div>

                    </div>
                <?php


                } else {

                    // NEW form ?>

                    <div class="zbs-form-actions-bottom zbs-objedit-actions-bottom">
                        
                        <button class="ui button green" type="button" id="zbs-edit-save"><?php esc_html_e("Save","zero-bs-crm"); ?> <?php esc_html_e("Form","zero-bs-crm"); ?></button>

                    </div>

                 <?php

                }

            ?></div><?php // / .zbs-generic-save-wrap
              
        } // html

        // saved via main metabox

    }


/* ======================================================
  / Form Action Metabox
   ====================================================== */