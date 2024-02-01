<?php
/*!
* Jetpack CRM
* https://jetpackcrm.com
*
* Client Portal Render Helper
*
*/
namespace Automattic\JetpackCRM;

defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * 
 * Client Portal class that helps rendering the Client Portal HTML.
 * 
 */
class Client_Portal_Render_Helper {
	public $parent_portal;

	public function __construct($parent) {
		$this->parent_portal = $parent;
	}

	/**
	* Shows an object load error and dies.
	*/
	function show_single_obj_error_and_die() {
		$err = '<center>';
		$err .= '<h3>'.__('Error loading object','zero-bs-crm').'</h3>';
		$err .= __('Either this object does not exist or you do not have permission to view it.', 'zero-bs-crm');
		$err .= '</center>';
		echo $err;
		die();
	}

	#} MS - can you make this work with templates, couldn't so dumped (dumbly) here for now:
	function portal_footer() {
		// won't return ours :/
		##WLREMOVE
		global $zbs;
		$showpoweredby_public = $zbs->settings->get( 'showpoweredby_public' ) === 1 ? true : false;
		if ( $showpoweredby_public ) {
			?>
			<div class="zerobs-portal-poweredby" style="font-size:11px;position:absolute;bottom:25px;right:50px;font-size:12px;">
				<?php echo wp_kses( sprintf( __( 'Client Portal by <a href="%s" target="_blank">Jetpack CRM</a>', 'zero-bs-crm' ), esc_url( $zbs->urls['home'] ) ), $zbs->acceptable_restricted_html ); ?>
			</div>
			<?php
		}
		##/WLREMOVE
	}

	/*
	* Outputs html which shows 'you are viewing this as an admin' dialog on portal pages
	*/
	function portal_viewing_as_admin_banner( $admin_message = '' ) {

		global $zbs;

		?><div class='wrapper' style="padding-left:20px;padding-right:20px;padding-bottom:20px;">
			
			<div class='alert alert-info'>
				<?php esc_html_e('You are viewing the Client Portal as an admin','zero-bs-crm'); ?>
				<br />
				[<?php esc_html_e('This message is only shown to admins','zero-bs-crm'); ?>]
				<?php ##WLREMOVE ?>
				<br /><a style="color:orange;font-size:18px;" href="<?php echo esc_url( $zbs->urls['kbclientportal'] ); ?>" target="_blank"><?php esc_html_e('Learn more about the client portal','zero-bs-crm'); ?></a>
				<?php ##/WLREMOVE ?>
			</div>

			<?php $this->admin_message(); ?>

			<?php if ( !empty( $admin_message ) ) { ?>
			<div style="margin:20px;padding:10px;background:red;color:white;text-align:center;">
				<?php echo $admin_message; ?>
			</div>
			<?php } ?>

		</div><?php 

	}

	// upsell shown to admins across whole portal as they view as admin
	function admin_message(){

		global $zbs;

		// temp fix
		if (current_user_can( 'admin_zerobs_manage_options' ) && !function_exists('zeroBSCRM_cpp_register_endpoints')){// !zeroBSCRM_isExtensionInstalled('clientportalpro')){

		##WLREMOVE ?>

		<script type="text/javascript">
			jQuery(function(){
				jQuery('#zbs-close-cpp-note').on( 'click', function(){
					jQuery('.zbs-client-portal-pro-note').remove();
				});
			});
		</script>
		<?php ##/WLREMOVE

		}

		return '';

	}

	function portal_nav( $selected_item = 'dashboard', $do_echo = true ) {
		global $wp_query;

		$nav_html        = '';
		$zbsWarn         = '';
		$dash_link       = zeroBS_portal_link('dash');
		$portal_root_url = \jpcrm_get_client_portal_root_url();
		$nav_html       .= '	<ul id="zbs-nav-tabs">';

		foreach ( $this->parent_portal->endpoints as $endpoint ) {
			if ( $endpoint->hide_from_menu ) {
				continue;
			}
			$link  = $endpoint->slug == 'dashboard' ? esc_url( $portal_root_url ) : esc_url( $portal_root_url . $endpoint->slug );
			$class = $endpoint->slug == $selected_item ? 'active' : '';
			//produce the menu from the array of menu items (easier to extend :-) ).
			// WH: this assumes icon, otehrwise it'll break! :o
			$nav_html .= "<li class='" . $class . "'><a href='" . $link . "'><i class='fa " . $endpoint->icon . "'></i>" . $endpoint->name . "</a></li>";
		}

		$zbs_logout_text = __('Log out',"zero-bs-crm");
		$zbs_logout_text = apply_filters('zbs_portal_logout_text', $zbs_logout_text);

		$zbs_logout_icon = 'fa-sign-out';
		$zbs_logout_icon = apply_filters('zbs_portal_logout_icon', $zbs_logout_icon);

		$nav_html .= "<li><a href='". wp_logout_url( $dash_link ) . "'><i class='fa ".$zbs_logout_icon."' aria-hidden='true'></i>" . $zbs_logout_text . "</a></li>";
		$nav_html .= '</ul>';

		// echo or return nav HTML depending on flag; defaults to echo (legacy support)
		if ( $do_echo ) {
			echo $nav_html;
		} else {
			return $nav_html;
		}
	}
}
