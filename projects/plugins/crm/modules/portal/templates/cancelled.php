<?php
/**
 * Payment Cancelled Page
 *
 * This is used as a 'Payment Cancelled' page following a cancelled payment
 *
 * @author 		ZeroBSCRM
 * @package 	Templates/Portal/Cancelled
 * @see			https://jetpackcrm.com/kb/
 * @version     3.0
 * 
 */

if ( ! defined( 'ABSPATH' ) ) exit; // Don't allow direct access

global $zbs;
$portal = $zbs->modules->portal;

$uid = get_current_user_id();
$show_nav = ( ( $uid !== 0 ) && $portal->is_user_enabled() ) ;

do_action( 'zbs_enqueue_scripts_and_styles' );
?>
<div class="alignwide zbs-site-main zbs-portal-grid<?php echo $show_nav?'':' no-nav' ?>">
<?php 
	if ( $show_nav ) :
?>
	<nav class="zbs-portal-nav">
		<?php
			//moved into func
			$portal->render->portal_nav('dashboard');
		?>
	</nav>
<?php 
	endif;
?>
	<div class="zbs-portal-content">
			<h2><?php esc_html_e("Payment Cancelled", "zero-bs-crm"); ?></h2>
			<div class='zbs-entry-content' style="position:relative;">
				<p>
				<?php esc_html_e("Your payment was cancelled.", "zero-bs-crm"); ?>
				</p>
			</div>
	</div>
	<div class="zbs-portal-grid-footer"><?php $portal->render->portal_footer(); ?></div>
</div>
