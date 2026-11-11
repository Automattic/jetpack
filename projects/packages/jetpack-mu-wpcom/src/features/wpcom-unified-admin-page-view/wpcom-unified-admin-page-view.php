<?php
/**
 * WPCom Unified Tracking for WP Admin Page Views.
 * Similar to what we're doing in wpcom-wpadmin-page-view, but using the same page view definition across all WPCom.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Unified_Admin_Page_View;

/**
 * The site properties shared by the wp-admin Tracks events.
 *
 * @return array|null The properties, or null when there is no site to describe.
 */
function wpcom_unified_admin_tracks_props() {
	$is_simple_site = defined( 'IS_WPCOM' ) && IS_WPCOM;

	if ( $is_simple_site ) {
		global $current_blog;
		if ( ! $current_blog instanceof \WP_Site ) {
			return null;
		}
		$blog_id = $current_blog->blog_id;
	} else {
		$blog_id = _wpcom_get_current_blog_id();
	}

	return array(
		'site_type' => $is_simple_site ? 'simple' : 'atomic',
		'blog_id'   => $blog_id,
	);
}

/**
 * Bump a unified Tracks stat for every wp-admin page view, and for every time Screen Options is opened or closed.
 */
function wpcom_unified_track_admin_page_views() {
	global $current_user, $current_screen;
	if ( ! $current_user instanceof \WP_User || ! $current_screen instanceof \WP_Screen ) {
		return;
	}

	$site_props = wpcom_unified_admin_tracks_props();
	if ( null === $site_props ) {
		return;
	}

	$user_types      = 'simple' === $site_props['site_type'] ? \WPCOM_User::get_types() : wpcom_atomic_get_user_types();
	$wpcom_user_id   = 'simple' === $site_props['site_type']
		? absint( $current_user->ID )
		: (int) get_user_meta( absint( $current_user->ID ), 'wpcom_user_id', true );
	$wpcom_user_data = 'simple' === $site_props['site_type'] ? null : get_user_meta( absint( $current_user->ID ), 'wpcom_user_data', true );
	$user_login      = (int) ( $wpcom_user_data->ID ?? 0 ) === $wpcom_user_id && ! empty( $wpcom_user_data->login )
		? $wpcom_user_data->login
		: $current_user->user_login;

	$event_props = array(
		'route'              => $current_screen->id,
		'source'             => 'wp-admin',
		'site_type'          => $site_props['site_type'],
		'is_block_editor'    => $current_screen->is_block_editor,
		'blog_id'            => $site_props['blog_id'],
		'user_type'          => implode( ',', $user_types ),
		'is_local_only_user' => 0 === $wpcom_user_id,
	);
	?>
	<script type="text/javascript">
		var _admin_pv_props = <?php echo wp_json_encode( $event_props, JSON_HEX_TAG ); ?>;
		_tkq = window._tkq || [];
		<?php if ( $wpcom_user_id > 0 ) : ?>
		_tkq.push( [ 'identifyUser', <?php echo (int) $wpcom_user_id; ?>, <?php echo wp_json_encode( $user_login, JSON_HEX_TAG ); ?> ] );
		<?php endif; ?>
		_tkq.push( [ 'recordEvent', 'wpcom_unified_admin_page_view', _admin_pv_props ] );
		( function ( props ) {
			document.addEventListener( 'click', function ( event ) {
				var button = event.target.closest && event.target.closest( '#show-settings-link' );
				var panel = button && document.getElementById( button.getAttribute( 'aria-controls' ) );
				if ( panel ) {
					// This listener captures the click before core toggles the panel, so a hidden panel is about to open.
					var action = panel.getClientRects().length ? 'close' : 'open';
					window._tkq.push( [ 'recordEvent', 'wpcom_admin_screen_options_toggle', Object.assign( { action: action }, props ) ] );
				}
			}, true );
		} )( <?php echo wp_json_encode( array( 'route' => $current_screen->id ) + $site_props, JSON_HEX_TAG ); ?> );
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
