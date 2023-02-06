<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.1.19
 *
 * Copyright 2020 Automattic
 *
 * Date: 25/10/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */


# NOTE: http://themeflection.com/replace-wordpress-submit-meta-box/


/* ======================================================
   Init Func
   ====================================================== */

   function zeroBSCRM_SubmitMetaboxSetup(){

        $zeroBS__SubmitMetabox = new zeroBS__SubmitMetabox( __FILE__ );
        
   }

   add_action( 'admin_init','zeroBSCRM_SubmitMetaboxSetup');

/* ======================================================
   / Init Func
   ====================================================== */


/* ======================================================
  Submit Metabox
   ====================================================== */

    class zeroBS__SubmitMetabox {

        static $instance;
        #private $packPerm;
        #private $pack;
        private $postTypes;
        private $postTypesLabels;

        public function __construct( $plugin_file ) {
           # if ( $this->instance instanceof wProject_Metabox ) {
            #    wp_die( sprintf( __( 'Cannot instantiate singleton class: %1$s. Use %1$s::$instance instead.', 'zero-bs-crm' ), __CLASS__ ) );
            #} else {
                self::$instance = $this;
            #}


            #$this->postType = 'zerobs_customer';
            #add_action( 'add_meta_boxes', array( $this, 'create_meta_box' ) );
            #} Moved to multiples 1.1.19 WH

            $this->postTypes = array('zerobs_invoice');        
            #} Temp
            $this->postTypesLabels = array(
                'zerobs_invoice' => 'Invoice'
            );
            add_action( 'add_meta_boxes', array( $this, 'initMetaBox' ) );

            #add_filter( 'save_post', array( $this, 'save_meta_box' ), 10, 2 );
        }

        public function initMetaBox(){

            if (count($this->postTypes) > 0) foreach ($this->postTypes as $pt){

                #} pass an arr
                $callBackArr = array($this,$pt);

                add_meta_box(
                    'wpzbscsub_itemdetails_'.$pt,
                    __($this->postTypesLabels[$pt],"zero-bs-crm") .' Actions', #quick title
                    array( $this, 'print_meta_box' ),
                    $pt,
                    'side',
                    'low',
                    $callBackArr
                );

            }

        }
        /*
        public function create_meta_box() {


            #} Don't share for new customers :)
            #if (isset($this->ID)){

                    add_meta_box(
                        'wpzbscext_itemdetails',
                        'External Source(s)',
                        array( $this, 'print_meta_box' ),
                        $this->postType,
                        'side',
                        'low'
                    );            

            #}
        }
        */
        public function print_meta_box( $post, $metabox ) {

                #} Post type
                $postType = ''; if (isset($metabox['args']) && isset($metabox['args'][1]) && !empty($metabox['args'][1])) $postType = $metabox['args'][1];

                #} Only load if is legit.
                if (in_array($postType,array('zerobs_invoice'))){
                
                    #} if a saved post...
                    if (isset($post->post_status) && $post->post_status != "auto-draft"){
                    ?>
                        <input type="hidden" name="meta_box_ids[]" value="<?php echo esc_attr($metabox['id']); ?>" />

                
                                <?php
                                $zbs_inv_meta = get_post_meta($post->ID,'zbs_customer_invoice_meta', true); 
                            
                                if(!isset($zbs_inv_meta['status'])){
                                    $zbs_stat = 'Draft';
                                }else{
                                    $zbs_stat = $zbs_inv_meta['status'];
                                }

                                global $zbsCustomerInvoiceFields;

                               $sel='';
                                ?>
                                <div class="zbs-actions-side">
                                    <div class="row">
                                        <div class='pull-left zbs-what'>
                                            <?php esc_html_e('Status',"zero-bs-crm"); ?>
                                        </div>
                                        <div class="action pull-right">
                                            <select id="invoice_status" name="invoice_status">
                                                <?php foreach($zbsCustomerInvoiceFields['status'][3] as $z){
                                                    if($z == $zbs_stat){$sel = 'selected'; }else{ $sel = '';}
                                                    echo '<option value="'.esc_attr($z).'"'. esc_attr($sel) .'>'.esc_html__($z,"zero-bs-crm").'</option>';
                                                } ?>
                                            </select>
                                        </div>
                                    </div>
                                </div>





                                <div class="clear"></div>

                                <?php do_action('zbs_invpro_itemlink'); ?>

                                <div class="clear"></div>
                         
                       
                            <div class='bottom zbs-invoice-actions-bottom'>
                                <button class='button button-primary button-large pull-right' id="zbs_invoice_save"><?php esc_attr_e("Update","zero-bs-crm"); ?></button>
                                <?php

                                    #} Quick ver of this: http://themeflection.com/replace-wordpress-submit-meta-box/

                                ?><div id="delete-action" class='pull-left'>
                                 <?php
                                 if ( current_user_can( "delete_post", $post->ID ) ) {
                                   if ( !EMPTY_TRASH_DAYS )
                                        $delete_text = __('Delete Permanently', "zero-bs-crm");
                                   else
                                        $delete_text = __('Move to Trash', "zero-bs-crm");
                                 ?>
                                 <a class="submitdelete deletion" href="<?php echo get_delete_post_link($post->ID); ?>"><?php echo esc_html($delete_text); ?></a><?php
                                 } //if ?>
                                </div>
                                <div class='clear'></div>
                            </div>
                    <?php


                    } else {

                        ?>

                    <?php do_action('zbs_invpro_itemlink'); ?>

                    <button class='button button-primary button-large' id="zbs_invoice_save"><?php esc_html_e("Save","zero-bs-crm"); ?></button>

                     <?php

                        #} If it's a new post 

                        #} Gross hide :/


                }

            } // / only load if post type

        }

       /* not req public function save_meta_box( $post_id, $post ) {
            if( empty( $_POST['meta_box_ids'] ) ){ return; }
            foreach( $_POST['meta_box_ids'] as $metabox_id ){
                if( ! wp_verify_nonce( $_POST[ $metabox_id . '_nonce' ], 'save_' . $metabox_id ) ){ continue; }
                #if( count( $_POST[ $metabox_id . '_fields' ] ) == 0 ){ continue; }
                if( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ){ continue; }

                if( $metabox_id == 'wpzbscext_itemdetails'  && $post->post_type == $this->postType){

                    #} Nothing needed
                }
            }

            return $post;
        } */
    }


/* ======================================================
  / Submit Metabox
   ====================================================== */