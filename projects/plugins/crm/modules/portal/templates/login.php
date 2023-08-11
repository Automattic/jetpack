<?php
/**
 * Login Template
 *
 * This is the login page for the Portal
 *
 * @author 		ZeroBSCRM
 * @package 	Templates/Portal/Login
 * @see			https://jetpackcrm.com/kb/
 * @version     3.0
 * 
 */
if ( ! defined( 'ABSPATH' ) ) exit; 

global $zbs;
$portal = $zbs->modules->portal;

do_action( 'zbs_enqueue_scripts_and_styles' );

$portalPage = zeroBSCRM_getSetting('portalpage');
$portalLink = get_page_link($portalPage);

?>
<div id="zbs-main" class="alignwide zbs-site-main">
	<div class="zbs-client-portal-wrap main site-main zbs-post zbs-hentry">

<?php

$args = array(
	'echo'           => true,
	'remember'       => true,
	'redirect'       => $portalLink,
	'form_id'        => 'loginform',
	'id_username'    => 'user_login',
	'id_password'    => 'user_pass',
	'id_remember'    => 'rememberme',
	'id_submit'      => 'wp-submit',
	'label_username' => __( 'Email Address', 'zero-bs-crm' ),
	'label_password' => __( 'Password', 'zero-bs-crm' ),
	'label_remember' => __( 'Remember Me', 'zero-bs-crm' ),
	'label_log_in'   => __( 'Log In', 'zero-bs-crm' ),
	'value_username' => '',
	'value_remember' => false
);

// add a filter for now, which adds a hidden field, which lets our redir catcher catch failed logins + bringback
add_filter( 'login_form_bottom', 'zeroBSCRM_portal_loginFooter');
function zeroBSCRM_portal_loginFooter($prev=''){

	return $prev.'<input type="hidden" name="fromzbslogin" value="1" />';
}

// catch fails
if (isset($_GET['login']) && $_GET['login'] == 'failed'){

	echo '<div class="alert alert-info">'.esc_html__('Your username or password was incorrect. Please try again','zero-bs-crm').'</div>';

}

echo '<div class="container zbs-portal-login" style="margin-top:20px;text-align:center;">';

?>
<h2><?php esc_html_e(apply_filters('zbs_portal_login_title', __('Welcome to your Client Portal',"zero-bs-crm")),'zero-bs-crm'); ?></h2>
<p><?php esc_html_e(apply_filters('zbs_portal_login_content', __("Please login to your Client Portal to be able to view your documents","zero-bs-crm"),'zero-bs-crm')); ?></p>
<div class="login-form">
<?php
wp_login_form( $args );
do_action('login_form');
?>
<a href="<?php echo esc_url( wp_lostpassword_url( get_permalink() ) ); ?>" alt="<?php esc_attr_e( 'Lost Password', 'zero-bs-crm' ); ?>"><?php esc_html_e( 'Lost Password', 'zero-bs-crm' ); ?></a>
</div>
<?php
echo '</div>';


?>
	<?php $portal->render->portal_footer(); ?>

	</div>

</div>