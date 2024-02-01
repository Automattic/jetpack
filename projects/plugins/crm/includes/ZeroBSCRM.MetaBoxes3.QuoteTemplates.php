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

   function zeroBSCRM_QuotesTemplatesMetaboxSetup(){

        // main detail
        $zeroBS__Metabox_QuoteTemplate = new zeroBS__Metabox_QuoteTemplate( __FILE__ );

        // save
        $zeroBS__Metabox_QuoteTemplateActions = new zeroBS__Metabox_QuoteTemplateActions( __FILE__ );

   }

   add_action( 'admin_init','zeroBSCRM_QuotesTemplatesMetaboxSetup');


/* ======================================================
   / Init Func
   ====================================================== */


/* ======================================================
  Quote Template Metabox
   ====================================================== */

    class zeroBS__Metabox_QuoteTemplate extends zeroBS__Metabox{ 
        
        // this is for catching 'new' quote templates
        private $newRecordNeedsRedir = false;

        public function __construct( $plugin_file ) {

            // set these
            $this->objType = 'quotetemplate';
            $this->metaboxID = 'zerobs-quote-template-edit';
            $this->metaboxTitle = __('Quote Template','zero-bs-crm'); // will be headless anyhow
            $this->metaboxScreen = 'zbs-add-edit-quotetemplate-edit';
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

        public function html( $quoteTemplate, $metabox ) {

                global $zbs;

                // localise ID
                $quoteTemplateID = -1; if (is_array($quoteTemplate) && isset($quoteTemplate['id'])) $quoteTemplateID = (int)$quoteTemplate['id'];
                $quoteTemplateContent = ''; if (is_array($quoteTemplate) && isset($quoteTemplate['content'])) $quoteTemplateContent = $quoteTemplate['content'];
                
                ?>
                <script type="text/javascript">var zbscrmjs_secToken = '<?php echo esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ); ?>';</script>
                <?php

                // pass specific placeholder list for WYSIWYG inserter
                // <TBC> is there a better place to pass this? 
                $placeholder_templating = $zbs->get_templating();
                $placeholder_list = $placeholder_templating->get_placeholders_for_tooling( array( 'quote', 'contact', 'global' ), false, false );
                echo '<script>var jpcrm_placeholder_list = ' . json_encode( $placeholder_templating->simplify_placeholders_for_wysiwyg( $placeholder_list ) ) . ';</script>';

                // Fields:
                // CPT just had Title + Content
                // DAL3 has more :)

                #} Retrieve fields from global
                /* this is all debug
                global $zbsCustomerQuoteFields; $fields2 = $zbsCustomerQuoteFields;
                // Debug 
                echo 'Fields:<pre>'.print_r($fields2,1).'</pre>';

                $fields3 = $zbs->DAL->quotetemplates->generateFieldsGlobalArr();
                echo 'Fields2:<pre>'.print_r($fields3,1).'</pre>';
                exit();
                */

                // for mvp v3.0 we now just hard-type these, as there a lesser obj rarely used.
                $fields = array(

                        'title' => array(

                            0 => 'text',
                            1 => __('Template Title','zero-bs-crm'),
                            2 => '', // placeholder
                            'essential' => 1

                        ),

                        'value' => array(

                            0 => 'price',
                            1 => __('Starting Value','zero-bs-crm'),
                            2 => '', // placeholder
                            'essential' => 1

                        ),

                        'notes' => array(

                            0 => 'textarea',
                            1 => __('Notes','zero-bs-crm'),
                            2 => '', // placeholder
                            'essential' => 1

                        )
                );

				?>
					<div>
						<div class="jpcrm-form-grid" id="wptbpMetaBoxMainItem">
					<?php

                    // output fields
                    $skipFields = array('content'); // dealt with below
                    zeroBSCRM_html_editFields($quoteTemplate,$fields,'zbsqt_',$skipFields);
                        ##WLREMOVE
                        // template placeholder helper
								echo '<div class="jpcrm-form-group jpcrm-form-group-span-2" style="text-align:end;"><span class="ui basic black label">' . esc_html__( 'Did you know: You can now use Quote Placeholders?', 'zero-bs-crm' ) . ' <a href="' . esc_url( $zbs->urls['kbquoteplaceholders'] ) . '" target="_blank">' . esc_html__( 'Read More', 'zero-bs-crm' ) . '</a></span></div>';
                        ##/WLREMOVE

						$content = wp_kses( $quoteTemplateContent, $zbs->acceptable_html ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

								echo '<div class="jpcrm-form-group jpcrm-form-group-span-2">';
                        // remove "Add contact form" button from Jetpack
                        remove_action( 'media_buttons', 'grunion_media_button', 999 );
                        wp_editor( $content, 'zbs_quotetemplate_content', array(
                            'editor_height' => 580
                        ));
								echo '</div>';
					?>
					</div></div>
					<?php
              
        }

        public function save_data( $quoteTemplateID, $quoteTemplate ) {

            if (!defined('ZBS_OBJ_SAVED')){

                define('ZBS_OBJ_SAVED',1);

                // DAL3.0+
                global $zbs;

                // check this
                if (empty($quoteTemplateID) || $quoteTemplateID < 1)  $quoteTemplateID = -1;

                /* old way:
        
                    Was previously just a CPT

                */
                $extraMeta = array();

                // retrieve _POST into arr     
                $autoGenAutonumbers = true; // generate if not set               
                $quoteTemplate = zeroBS_buildObjArr($_POST,array(),$fieldPrefix='zbsqt_',$outputPrefix='',false,ZBS_TYPE_QUOTETEMPLATE,$autoGenAutonumbers);
                
                // content (from other metabox actually)
                if (isset($_POST['zbs_quotetemplate_content'])) {

                    #} Save content
					$quoteTemplate['content'] = wp_kses( $_POST['zbs_quotetemplate_content'], $zbs->acceptable_html ); //phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase,WordPress.Security.NonceVerification.Missing,WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- to follow up with.

                    #} update templated vars
                    // Think this was here in err... if (isset($_POST['zbs_quote_template_id_used'])) $quote['template'] = (int)sanitize_text_field($_POST['zbs_quote_template_id_used']);

                }

                // Debug echo 'updating: <pre>'.print_r($quoteTemplate,1).'</pre>'; exit();

                // add/update
                $addUpdateReturn = $zbs->DAL->quotetemplates->addUpdateQuoteTemplate(array(

                            'id'    => $quoteTemplateID,
                            'data'  => $quoteTemplate,
                            'extraMeta' => $extraMeta,
                            'limitedFields' => -1

                    ));

                // Note: For NEW objs, we make sure a global is set here, that other update funcs can catch 
                // ... so it's essential this one runs first!
                // this is managed in the metabox Class :)
                if ($quoteTemplateID == -1 && !empty($addUpdateReturn) && $addUpdateReturn != -1) {
                    
                    $quoteTemplateID = $addUpdateReturn;
                    global $zbsJustInsertedMetaboxID; $zbsJustInsertedMetaboxID = $quoteTemplateID;

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
                    $nonCriticalMessages = $zbs->DAL->getErrors(ZBS_TYPE_QUOTETEMPLATE);
                    if (is_array($nonCriticalMessages) && count($nonCriticalMessages) > 0) $this->dalNoticeMessage($nonCriticalMessages);


                } else {

                    // fail somehow
                    $failMessages = $zbs->DAL->getErrors(ZBS_TYPE_QUOTETEMPLATE);

                    // show msg (retrieved from DAL err stack)
                    if (is_array($failMessages) && count($failMessages) > 0)
                        $this->dalErrorMessage($failMessages);
                    else
                        $this->dalErrorMessage(array(__('Insert/Update Failed with general error','zero-bs-crm')));

                    // pass the pre-fill:
                    global $zbsObjDataPrefill; $zbsObjDataPrefill = $quoteTemplate;

        
                }

            }

            return $quoteTemplate;
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
  / Quote Template Metabox
   ====================================================== */



/* ======================================================
    Quote Template Actions Metabox
   ====================================================== */

    class zeroBS__Metabox_QuoteTemplateActions extends zeroBS__Metabox{ 

        public function __construct( $plugin_file ) {

            // set these
            $this->objType = 'quotetemplate';
            $this->metaboxID = 'zerobs-quotetemplate-actions';
            $this->metaboxTitle = __('Quote Template','zero-bs-crm').' '.__('Actions','zero-bs-crm'); // will be headless anyhow
            $this->headless = true;
            $this->metaboxScreen = 'zbs-add-edit-quotetemplate-edit';
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

        public function html( $quoteTemplate, $metabox ) {

            ?><div class="zbs-generic-save-wrap">

                    <div class="ui medium dividing header"><i class="save icon"></i> <?php esc_html_e('Template','zero-bs-crm'); ?> <?php esc_html_e('Actions','zero-bs-crm'); ?></div>

            <?php

            // localise ID & content
            $quoteTemplateID = -1; if (is_array($quoteTemplate) && isset($quoteTemplate['id'])) $quoteTemplateID = (int)$quoteTemplate['id'];
            

                #} if a saved obj...
                if ($quoteTemplateID > 0){ // existing

                    ?>

                    <div class="zbs-quotetemplate-actions-bottom zbs-objedit-actions-bottom">

							<button class="ui button black" type="button" id="zbs-edit-save"><?php esc_html_e( 'Update', 'zero-bs-crm' ); ?> <?php esc_html_e( 'Template', 'zero-bs-crm' ); ?></button>

                        <?php

                            // delete?

                         // for now just check if can modify, later better, granular perms.
                         if ( zeroBSCRM_permsQuotes() ) { 
                        ?><div id="zbs-quotetemplate-actions-delete" class="zbs-objedit-actions-delete">
                             <a class="submitdelete deletion" href="<?php echo jpcrm_esc_link( 'delete', $quoteTemplateID, 'quotetemplate' ); ?>"><?php esc_html_e('Delete Permanently', "zero-bs-crm"); ?></a>
                        </div>
                        <?php } // can delete  ?>
                        
                        <div class='clear'></div>

                    </div>
                <?php


                } else {

                    // NEW quote template ?>

                    <div class="zbs-quotetemplate-actions-bottom zbs-objedit-actions-bottom">
                        
							<button class="ui button black" type="button" id="zbs-edit-save"><?php esc_html_e( 'Save', 'zero-bs-crm' ); ?> <?php esc_html_e( 'Template', 'zero-bs-crm' ); ?></button>

                    </div>

                 <?php

                }

            ?></div><?php // / .zbs-generic-save-wrap
              
        } // html

        // saved via main metabox
    }


/* ======================================================
  / Quote Template Action Metabox
   ====================================================== */