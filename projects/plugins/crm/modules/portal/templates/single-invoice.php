<?php
/**
 * Single Invoice Template
 *
 * The single invoice template
 *
 * @author 		ZeroBSCRM
 * @package 	Templates/Portal/Invoice
 * @see			https://kb.jetpackcrm.com/
 * @version     3.0
 * 
 */
if ( ! defined( 'ABSPATH' ) ) exit; // Don't allow direct access

global $zbs;
$portal   = $zbs->modules->portal;
$single_invoice_endpoint = new Automattic\JetpackCRM\Invoices_Endpoint( $portal );

// Enqueuement
do_action( 'zbs_enqueue_scripts_and_styles' );

// get raw id or hash from URL
$obj_id = $portal->get_obj_id_from_current_portal_page_url( ZBS_TYPE_INVOICE );

// fail if invalid object or no permissions to view it
if ( !$obj_id ) {
  $portal->render->show_single_obj_error_and_die();
}

$show_nav = ( $portal->is_user_enabled() || ! $portal->access_is_via_hash( ZBS_TYPE_INVOICE ) ) ;
?>
<style>
.stripe-button-el{
  background: none !important;
  border: 0px !important;
  box-shadow: none !important;
}
.zbs-back-to-invoices a:hover{
  text-decoration:none;
}
</style>

<div class="alignwide zbs-site-main zbs-portal-grid<?php echo $show_nav?'':' no-nav' ?>">
  <?php if ( $show_nav ) { ?>
    <nav class="zbs-portal-nav"><?php echo $portal->render->portal_nav( $portal->get_endpoint( ZBS_TYPE_INVOICE ), false ); ?></nav>
  <?php } ?>
  <div class='zbs-portal-content zbs-portal-invoices-list'>
    <div class='zbs-entry-content zbs-single-invoice-portal' style="position:relative;">
      <?php $single_invoice_endpoint->single_invoice_html_output( $obj_id, true ); ?>
    </div>
  </div>
  <div class="zbs-portal-grid-footer"><?php $portal->render->portal_footer(); ?></div>
</div>
