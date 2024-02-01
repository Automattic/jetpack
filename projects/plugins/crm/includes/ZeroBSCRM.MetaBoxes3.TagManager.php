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

   function zeroBSCRM_TagManagerMetaboxSetup(){

      // lazy page switch
      $typeInt = -1;
      if (zeroBSCRM_is_customertags_page()) $typeInt = ZBS_TYPE_CONTACT;
      if (zeroBSCRM_is_companytags_page()) $typeInt = ZBS_TYPE_COMPANY;
      if (zeroBSCRM_is_quotetags_page()) $typeInt = ZBS_TYPE_QUOTE;
      if (zeroBSCRM_is_invoicetags_page()) $typeInt = ZBS_TYPE_INVOICE;
      if (zeroBSCRM_is_transactiontags_page()) $typeInt = ZBS_TYPE_TRANSACTION;
      if (zeroBSCRM_is_formtags_page()) $typeInt = ZBS_TYPE_FORM;
      if (zeroBSCRM_is_tasktags_page()) $typeInt = ZBS_TYPE_TASK;

        if ($typeInt > 0){

            // Tag List
            $zeroBS__Metabox_TagList = new zeroBS__Metabox_TagList( __FILE__, $typeInt );

            // Add Tags
            $zeroBS__Metabox_TagAdd = new zeroBS__Metabox_TagAdd( __FILE__, $typeInt );

        }

   }

   add_action( 'admin_init','zeroBSCRM_TagManagerMetaboxSetup');


/* ======================================================
   / Init Func
   ====================================================== */



/* ======================================================
  Declare Globals
   ====================================================== */

    #} Used throughout
    // Don't know who added this, but GLOBALS are out of scope here
    //global $zbsCustomerFields,$zbsCustomerQuoteFields,$zbsCustomerInvoiceFields;

/* ======================================================
  / Declare Globals
   ====================================================== */


   // PerfTest: zeroBSCRM_performanceTest_startTimer('custmetabox');

/* ======================================================
  Tag List Metabox
   ====================================================== */

    class zeroBS__Metabox_TagList extends zeroBS__Metabox{ 

	/**
	 * The legacy object name (e.g. 'zerobs_customer')
	 *
	 * @var string
	 */
	private $postType; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase

        public function __construct( $plugin_file, $typeInt = ZBS_TYPE_CONTACT ) {

          global $zbs;

            // set these
            $this->typeInt = $typeInt;
            $this->postType = $zbs->DAL->typeCPT($typeInt);
            $this->metaboxID = 'zerobs-'.$zbs->DAL->objTypeKey($typeInt).'-tags-edit';
            $this->metaboxTitle = __($zbs->DAL->typeStr($typeInt).' Tags',"zero-bs-crm");
            $this->metaboxScreen = 'zerobs_edit_tags'; // we can use anything here as is now using our func
            $this->metaboxArea = 'normal';
            $this->metaboxLocation = 'high';
            $this->saveOrder = 1;
            // headless!
            $this->headless = true;

            // call this 
            $this->initMetabox();

        }

        public function html( $contact, $metabox ) {

            global $zbs;

            // Get all tags
            $tags = $zbs->DAL->getTagsForObjType(array(

                'objtypeid'=>$this->typeInt,
                'excludeEmpty'=>false,
                'withCount'=>true,
                'ignoreowner' => true,
                // sort
                'sortByField'   => 'tagcount',
                'sortOrder'   => 'DESC'

                ));

            // pre-inject some potential js errors :)
            ?><div id="zbs-error-prep"><?php

            echo zeroBSCRM_UI2_messageHTML('info hidden',__('Tag Exists',"zero-bs-crm"),__('Cannot add a tag. A tag already exists with this text',"zero-bs-crm"),'','zbsTagAlreadyExists');
            echo zeroBSCRM_UI2_messageHTML('info hidden',__('Tag Text Empty',"zero-bs-crm"),__('You cannot add empty tags',"zero-bs-crm"),'','zbsTagEmpty');

            ?></div><?php

            // long term perhaps we need a list metabox type, for now, hardcoded:
              ?><table class="ui celled table" id="zbs-tag-manager" style="margin-top:0;">
                  <thead>
                      <tr>
                        <th><?php esc_html_e('Name',"zero-bs-crm"); ?></th>
                        <th><?php esc_html_e('Slug',"zero-bs-crm"); ?></th>
                        <?php /* this shows 1 date as DAL2 migration...<th><?php _e('First Used',"zero-bs-crm"); ?></th> */ ?>
                        <th class="center aligned"><?php esc_html_e('Count',"zero-bs-crm"); ?></th>
                        <th class="center aligned"><?php esc_html_e('Action','zero-bs-crm'); ?></th>
                      </tr>
                  </thead>
                  <tbody>
                      <?php
                        if (count($tags) > 0){ 
                          foreach ($tags as $tag){

                            $link = jpcrm_esc_link('listtagged',-1,$this->postType,-1,$tag['id']);
                            ?>
                            <tr>
										<td><?php if ( isset( $tag['name'] ) ) echo '<a href="' . esc_url( $link ) . '" class="ui large label">' . esc_html( $tag['name'] ) . '</a>'; // phpcs:ignore Generic.ControlStructures.InlineControlStructure.NotAllowed ?></td>
                              <td><?php if (isset($tag['slug'])) echo esc_html( $tag['slug'] ); ?></td>
                              <?php /* this shows 1 date as DAL2 migration... <td><?php if (isset($tag['created']) && !empty($tag['created']) && $tag['created'] !== -1) echo zeroBSCRM_locale_utsToDate($tag['created']); ?></td> */ ?>
                              <td class="center aligned"><?php if (isset($tag['count'])) echo '<a href="' . esc_url( $link ) . '">' . esc_html( zeroBSCRM_prettifyLongInts($tag['count']) ) . '</a>'; ?></td>
										<td class="center aligned"><button type="button" class="ui mini button black zbs-delete-tag" data-tagid="<?php echo esc_attr( $tag['id'] ); ?>"><i class="trash alternate icon"></i> <?php esc_html_e( 'Delete', 'zero-bs-crm' ); ?></button></td>
                            </tr>
                            <?php
                          }
                        }
                      ?>
                  </tbody>
                </table><?php

                if (count($tags) == 0) echo zeroBSCRM_UI2_messageHTML('info',__('No Tags Found',"zero-bs-crm"),__('There are no Tags here, create one using the box to the right.',"zero-bs-crm"),'disabled warning sign','zbsNoTagResults');


                ?><script type="text/javascript">
            <?php #} Nonce for AJAX
                echo "var zbscrmjs_secToken = '" . esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ) . "';";  ?>

                var zbsTagListLang = {

                    'delete': '<?php zeroBSCRM_slashOut(__('Delete',"zero-bs-crm")); ?>',

                    'deleteswaltitle': '<?php zeroBSCRM_slashOut(__('Are you sure?','zero-bs-crm')); ?>',
                    'deleteswaltext': '<?php zeroBSCRM_slashOut(__('This will delete the tag and remove it from any tagged '.__($zbs->DAL->typeStr($this->typeInt),'zero-bs-crm').'. This is irreversable.','zero-bs-crm')); ?>',
                    'deleteswalconfirm': '<?php zeroBSCRM_slashOut(__('Yes, delete the tag!','zero-bs-crm')); ?>',


                    'tagdeleted':'<?php zeroBSCRM_slashOut(__('Tag Deleted!','zero-bs-crm')); ?>',
                    'tagremoved':'<?php zeroBSCRM_slashOut(__('Your tag has been removed.','zero-bs-crm')); ?>',
                    'tagnotdeleted':'<?php zeroBSCRM_slashOut(__('Tag Not Deleted!','zero-bs-crm')); ?>',
                    'tagnotremoved':'<?php zeroBSCRM_slashOut(__('Your tag was not removed, please try again.','zero-bs-crm')); ?>',

                };


                </script><?php


        }
    }

/* ======================================================
  / Tag List Metabox
   ====================================================== */




/* ======================================================
  Create Tags Box
   ====================================================== */

    class zeroBS__Metabox_TagAdd extends zeroBS__Metabox_Tags{

	/**
	 * The legacy object name (e.g. 'zerobs_customer')
	 *
	 * @var string
	 */
	private $postType; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase

        public function __construct( $plugin_file, $typeInt = ZBS_TYPE_CONTACT) {

          global $zbs;
        
            $this->typeInt = $typeInt; // until db2 ZBS_TYPE_CONTACT;
            $this->postType = $zbs->DAL->typeCPT($typeInt);
            $this->metaboxID = 'zerobs-'.$zbs->DAL->objTypeKey($typeInt).'-tags';
            $this->metaboxTitle = __('Add '.$zbs->DAL->typeStr($typeInt).' Tags',"zero-bs-crm");
            $this->metaboxScreen = 'zerobs_edit_tags'; // we can use anything here as is now using our func
            $this->metaboxArea = 'side';
            $this->metaboxLocation = 'high';

            // call this 
            $this->initMetabox();

        }

        // html + save dealt with by parent class :) 
    }

/* ======================================================
  / Create Tags Box
   ====================================================== */
