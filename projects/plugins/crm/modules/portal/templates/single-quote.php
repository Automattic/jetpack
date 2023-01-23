<?php
/**
 * Single Quote Template
 *
 * The Single Quote Portal Page 
 *
 * @author 		ZeroBSCRM
 * @package 	Templates/Portal/Quote
 * @see			https://kb.jetpackcrm.com/
 * @version     3.0
 * 
 */

// Don't allow direct access
if ( ! defined( 'ABSPATH' ) ) exit;

global $zbs;
$portal = $zbs->modules->portal;
$single_quote_endpoint = new Automattic\JetpackCRM\Single_Quote_Endpoint( $portal );

// Enqueuement
do_action( 'zbs_enqueue_scripts_and_styles' );

// get raw id or hash from URL
$obj_id = $portal->get_obj_id_from_current_portal_page_url( ZBS_TYPE_QUOTE );

// fail if invalid object or no permissions to view it
if ( !$obj_id ) {
  $portal->render->show_single_obj_error_and_die();
}

$show_nav = ( $portal->is_user_enabled() || !$portal->access_is_via_hash( ZBS_TYPE_QUOTE ) ) ;
?>
<style>
.zerobs-proposal-body{
    font-size: 16px;
    box-shadow: 0px 1px 2px 0 rgba(34,36,38,0.15);
    margin: 1rem 0em;
    padding: 20px;
    border-radius: 0.28571429rem;
    border: 1px solid rgba(34,36,38,0.15);
    margin-top: -32px;
}
.zerobs-proposal-body li, .zerobs-proposal-body li span{
  padding:5px;
  line-height: 18px;
}
.zerobs-proposal-body table td, table tbody th {
  border: 1px solid #ddd;
  padding: 8px;
  font-size: 16px;
}
.zerobs-proposal-body ul{
  padding-left:20px;
}
</style>

<div class="alignwide zbs-site-main zbs-portal-grid<?php echo $show_nav?'':' no-nav' ?>">
  <?php if ( $show_nav ) { ?>
    <nav class="zbs-portal-nav"><?php echo $portal->render->portal_nav( $portal->get_endpoint( ZBS_TYPE_QUOTE ), false ); ?></nav>
  <?php } ?>
  <div class="zbs-portal-content zbs-portal-quote-single">
    <?php $single_quote_endpoint->single_quote_html_output( $obj_id, true ); ?>
  </div>
  <div class="zbs-portal-grid-footer"><?php $portal->render->portal_footer(); ?></div>
</div>