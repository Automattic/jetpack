<?php
/**
 * WPCom Unified Tracking for WP Admin Page Views.
 * Similar to what we're doing in wpcom-wpadmin-page-view, but using the same page view definition across all WPCom.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Unified_Admin_Page_View;

/**
 * Bump a unified Tracks stat for every wp-admin page view.
 */
function wpcom_unified_track_admin_page_views() {
	$is_simple_site = defined( 'IS_WPCOM' ) && IS_WPCOM;
	$is_atomic_site = ! $is_simple_site;

	global $current_user, $current_blog, $current_screen;
	if ( ! $current_user instanceof \WP_User || ! $current_screen instanceof \WP_Screen ) {
		return;
	}
	$blog_id    = null;
	$user_types = array();

	if ( $is_simple_site ) {
		if ( ! $current_blog instanceof \WP_Site ) {
			return;
		}
		$blog_id    = $current_blog->blog_id;
		$user_types = \WPCOM_User::get_types();
	}

	if ( $is_atomic_site ) {
		$blog_id    = _wpcom_get_current_blog_id();
		$user_types = wpcom_atomic_get_user_types();
	}
	$event_props = array(
		'route'           => $current_screen->id,
		'source'          => 'wp-admin',
		'is_block_editor' => $current_screen->is_block_editor,
		'blog_id'         => $blog_id,
		'user_type'       => implode( ',', $user_types ),
	);
	?>
	<script type="text/javascript">
		var _admin_pv_props = <?php echo wp_json_encode( $event_props, JSON_HEX_TAG ); ?>;
		_tkq = window._tkq || [];
		_tkq.push( [ 'identifyUser', <?php echo (int) $current_user->ID; ?>, <?php echo wp_json_encode( $current_user->user_login, JSON_HEX_TAG ); ?> ] );
		_tkq.push( [ 'recordEvent', 'wpcom_unified_admin_page_view', _admin_pv_props ] );
	</script>
	<?php
}
add_action( 'admin_footer', __NAMESPACE__ . '\wpcom_unified_track_admin_page_views' );
// Track customizer page views the same as any wp-admin page.
add_action( 'customize_controls_print_footer_scripts', __NAMESPACE__ . '\wpcom_unified_track_admin_page_views' );

/**
 * Retrieves the user types for Atomic sites.
 *
 * @return array An array of user types.
 */
function wpcom_atomic_get_user_types() {
	$user_types = array();

	if ( get_account_age_in_days() <= 14 ) {
		$user_types[] = 'New User';
	}

	$subscriptions = wpcomsh_get_wpcom_active_subscriptions();
	if ( count( $subscriptions ) > 0 ) {
		$user_types[] = 'Paid';
	}

	if ( wpcom_site_has_feature( \WPCOM_Features::PRIORITY_SUPPORT ) ) {
		$user_types[] = 'Business';
	}

	return $user_types;
}

/**
 * Calculate the number of days since the current user registered their account.
 *
 * @global \WP_User $current_user The current user object.
 *
 * @return float The age of the account in days.
 */
function get_account_age_in_days() {
	global $current_user;

	return ( time() - strtotime( $current_user->user_registered ) ) / DAY_IN_SECONDS;
}
