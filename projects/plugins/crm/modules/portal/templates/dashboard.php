<?php
/**
 * Portal Dashboard Page
 *
 * This is used as the main dashboard page of the portal
 *
 * @package automattic/jetpack-crm
 * @see     https://jetpackcrm.com/kb/
 * @version 3.0
 */

defined( 'ABSPATH' ) || exit( 0 ); // Don't allow direct access

global $zbs;
$portal = $zbs->modules->portal;

do_action( 'zbs_enqueue_scripts_and_styles' );
?>

<div class="alignwide zbs-site-main zbs-portal-grid">
	<nav class="zbs-portal-nav">
		<?php $portal->render->portal_nav( 'dashboard' ); ?>
	</nav>

	<div class="zbs-portal-content">
		<?php
		// admin msg (upsell cpp) (checks perms itself, safe to run)
		$portal->render->admin_message();

		$page_title = __( 'Welcome to your Dashboard', 'zero-bs-crm' );
		$page_title = apply_filters( 'zbs_portal_dashboard_title', $page_title );
		?>
		<h2><?php echo esc_html( $page_title ); ?></h2>
		<div class="zbs-entry-content" style="position:relative;">
			<p>
				<?php
				// add actions for additional content
				do_action( 'zbs_pre_dashboard_content' );

				$dashboard = __( 'Welcome to your Client Portal dashboard. From here you can view your information using the portal navigation bar.', 'zero-bs-crm' );
				// added so this can be modified, with a shortcode too
				$dashboard = apply_filters( 'zbs_portal_dashboard_content', $dashboard );
				echo $dashboard; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

				do_action( 'zbs_post_dashboard_content' );
				?>
			</p>
		</div>
	</div>
	<div class="zbs-portal-grid-footer"><?php $portal->render->portal_footer(); ?></div>
</div>
