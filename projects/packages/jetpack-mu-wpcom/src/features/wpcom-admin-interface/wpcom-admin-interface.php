<?php
/**
 * Additional wpcom_admin_interface option on settings.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status\Host;

/**
 * Add the Admin Interface Style setting on the General settings page.
 * This setting allows users to switch between the classic WP-Admin interface and the WordPress.com legacy dashboard.
 * The setting is stored in the wpcom_admin_interface option.
 * The setting is displayed only if the has the wp-admin interface selected.
 */
function wpcomsh_wpcom_admin_interface_settings_field() {
	add_settings_field( 'wpcom_admin_interface', '', 'wpcom_admin_interface_display', 'general', 'default' );

	register_setting( 'general', 'wpcom_admin_interface', array( 'sanitize_callback' => 'esc_attr' ) );
}

/**
 * Display the wpcom_admin_interface setting on the General settings page.
 */
function wpcom_admin_interface_display() {
	$value = get_option( 'wpcom_admin_interface' );

	echo '<tr valign="top"><th scope="row"><label for="wpcom_admin_interface">' . esc_html__( 'Admin Interface Style', 'jetpack-mu-wpcom' ) . '</label></th><td>';
	echo '<fieldset>';
	echo '<label><input type="radio" name="wpcom_admin_interface" value="wp-admin" ' . checked( 'wp-admin', $value, false ) . '/> <span>' . esc_html__( 'Classic style', 'jetpack-mu-wpcom' ) . '</span></label><p>' . esc_html__( 'Use WP-Admin to manage your site.', 'jetpack-mu-wpcom' ) . '</p><br>';
	echo '<label><input type="radio" name="wpcom_admin_interface" value="calypso" ' . checked( 'calypso', $value, false ) . '/> <span>' . esc_html__( 'Default style', 'jetpack-mu-wpcom' ) . '</span></label><p>' . esc_html__( 'Use WordPress.com’s native dashboard to manage your site.', 'jetpack-mu-wpcom' ) . '</p><br>';
	echo '</fieldset>';
}
add_action( 'admin_init', 'wpcomsh_wpcom_admin_interface_settings_field' );

/**
 * Track the wpcom_admin_interface_changed event.
 *
 * @param string $value The new value.
 * @return void
 */
function wpcom_admin_interface_track_changed_event( $value ) {
	$event_name = 'wpcom_admin_interface_changed';
	$properties = array( 'interface' => $value );
	if ( function_exists( 'wpcomsh_record_tracks_event' ) ) {
		wpcomsh_record_tracks_event( $event_name, $properties );
	} else {
		require_lib( 'tracks/client' );
		tracks_record_event( get_current_user_id(), $event_name, $properties );
	}
}

/**
 * Update the wpcom_admin_interface option on wpcom as it's the persistent data.
 * Also implements the redirect from WP Admin to Calypso when the interface option
 * is changed.
 *
 * @access private
 * @since 4.20.0
 *
 * @param string $new_value The new settings value.
 * @param string $old_value The old settings value.
 * @return string The value to update.
 */
function wpcom_admin_interface_pre_update_option( $new_value, $old_value ) {
	if ( $new_value === $old_value ) {
		return $new_value;
	}

	if ( ! class_exists( 'Jetpack_Options' ) || ! class_exists( 'Automattic\Jetpack\Connection\Client' ) || ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return $new_value;
	}

	global $pagenow;
	$on_wp_admin_options_page = isset( $pagenow ) && 'options.php' === $pagenow;

	if ( $on_wp_admin_options_page ) {
		wpcom_admin_interface_track_changed_event( $new_value );
	}

	if ( ! ( new Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ) {
		$blog_id = Jetpack_Options::get_option( 'id' );
		Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/hosting/admin-interface",
			'v2',
			array( 'method' => 'POST' ),
			array( 'interface' => $new_value )
		);
	}

	// We want to redirect to Calypso if the user has switched interface options to 'calypso'
	// Unfortunately we need to run this side-effect in the option updating filter because
	// the general settings page doesn't give us a good point to hook into the form submission.
	if ( 'calypso' === $new_value && $on_wp_admin_options_page ) {
		add_filter(
			'wp_redirect',
			/**
			 * Filters the existing redirect in wp-admin/options.php so we go to Calypso instead
			 * of to a GET version of the WP Admin general options page.
			 */
			function ( $location ) {
				$updated_settings_page = add_query_arg( 'settings-updated', 'true', wp_get_referer() );
				if ( $location === $updated_settings_page ) {
					return 'https://wordpress.com/settings/general/' . wpcom_get_site_slug();
				} else {
					return $location;
				}
			}
		);
	}

	return $new_value;
}
add_filter( 'pre_update_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_update_option', 10, 2 );

/**
 * Determines whether the admin interface has been recently changed by checking the presence of the `admin-interface-changed` query param.
 *
 * @return bool
 */
function wpcom_has_admin_interface_changed() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	return ( sanitize_key( wp_unslash( $_GET['admin-interface-changed'] ?? 'false' ) ) ) === 'true';
}

/**
 * Determine if the intro tour for the classic admin interface should be shown.
 *
 * @return bool
 */
function wpcom_should_show_classic_tour() {
	if ( get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
		return false;
	}

	$tour_completed_option = get_option( 'wpcom_classic_tour_completed' );
	$is_tour_in_progress   = $tour_completed_option === '0';
	$is_tour_completed     = $tour_completed_option === '1';

	if ( $is_tour_completed ) {
		return false;
	}

	if ( ! wpcom_has_admin_interface_changed() && ! $is_tour_in_progress ) {
		return false;
	}

	// Don't show the tour to non-administrators since it highlights features that are unavailable to them.
	if ( ! current_user_can( 'manage_options' ) ) {
		return false;
	}

	global $pagenow;
	return $pagenow === 'index.php';
}

/**
 * Render the HTML template needed by the classic tour script.
 */
function wpcom_render_classic_tour_template() {
	if ( ! wpcom_should_show_classic_tour() ) {
		return;
	}
	?>
	<template id="wpcom-classic-tour-step-template">
		<div class="wpcom-classic-tour-step">
			<button class="button button-secondary" data-action="dismiss" title="<?php esc_attr_e( 'Dismiss', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-no-alt"></span></button>
			<h3>{{title}}</h3>
			<p>{{description}}</p>
			<div class="wpcom-classic-tour-step-footer">
				<div class="wpcom-classic-tour-step-current"><?php esc_html_e( 'Step {{currentStep}} of {{totalSteps}}', 'jetpack-mu-wpcom' ); ?></div>
				<button data-action="prev" class="button button-secondary"><?php esc_html_e( 'Previous', 'jetpack-mu-wpcom' ); ?></button>
				<button data-action="next" class="button button-primary"><?php esc_html_e( 'Next', 'jetpack-mu-wpcom' ); ?></button>
				<button data-action="dismiss" class="button button-primary"><?php esc_html_e( 'Got it!', 'jetpack-mu-wpcom' ); ?></button>
			</div>
		</div>
	</template>
	<?php
}
add_action( 'admin_footer', 'wpcom_render_classic_tour_template' );

/**
 * Enqueue the scripts that show an intro tour with some educational tooltips for folks who turn the classic admin interface on.
 */
function wpcom_classic_tour_enqueue_scripts() {
	if ( ! wpcom_should_show_classic_tour() ) {
		return;
	}

	update_option( 'wpcom_classic_tour_completed', '0' );

	wp_enqueue_style(
		'wpcom-classic-tour',
		plugins_url( 'classic-tour.css', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);

	wp_enqueue_script(
		'wpcom-classic-tour',
		plugins_url( 'classic-tour.js', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION,
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);

	$data = array(
		'dismissNonce' => wp_create_nonce( 'wpcom_dismiss_classic_tour' ),
		'steps'        => array(
			array(
				'target'      => '.toplevel_page_wpcom-hosting-menu',
				'placement'   => 'right-bottom',
				'title'       => esc_html__( 'Upgrades is now Hosting', 'jetpack-mu-wpcom' ),
				'description' => esc_html__( 'The Hosting menu contains the My Home page and all items from the Upgrades menu, including Plans, Domains, Emails, Purchases, and more.', 'jetpack-mu-wpcom' ),
				'position'    => 'fixed',
			),
			array(
				'target'      => '.wpcom_site_management_widget__site-actions',
				'placement'   => 'bottom',
				'title'       => esc_html__( 'Hosting overview', 'jetpack-mu-wpcom' ),
				'description' => esc_html__( 'Access the new site management panel and all developer tools such as hosting configuration, GitHub deployments, metrics, PHP logs, and server logs.', 'jetpack-mu-wpcom' ),
				'position'    => 'absolute',
			),
			array(
				'target'      => '.wp-admin-bar-all-sites',
				'placement'   => 'bottom-right',
				'title'       => esc_html__( 'All your sites', 'jetpack-mu-wpcom' ),
				'description' => esc_html__( 'Click here to access your sites, domains, Reader, account settings, and more.', 'jetpack-mu-wpcom' ),
				'position'    => 'fixed',
			),
		),
	);

	wp_add_inline_script(
		'wpcom-site-menu',
		'window.wpcomClassicTour = ' . wp_json_encode( $data ) . ';'
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_classic_tour_enqueue_scripts' );

/**
 * Handles the AJAX requests to dismiss the classic tour.
 */
function wpcom_dismiss_classic_tour() {
	check_ajax_referer( 'wpcom_dismiss_classic_tour' );
	update_option( 'wpcom_classic_tour_completed', '1' );
	wp_die();
}
add_action( 'wp_ajax_wpcom_dismiss_classic_tour', 'wpcom_dismiss_classic_tour' );

/**
 * Displays a success notice in the dashboard after changing the admin interface.
 */
function wpcom_show_admin_interface_notice() {
	if ( ! wpcom_has_admin_interface_changed() ) {
		return;
	}

	global $pagenow;
	if ( $pagenow !== 'index.php' ) {
		return;
	}

	wp_admin_notice(
		__( 'Admin interface style changed.', 'jetpack-mu-wpcom' ),
		array(
			'type'        => 'success',
			'dismissible' => true,
		)
	);
}
add_action( 'admin_notices', 'wpcom_show_admin_interface_notice' );

/**
 * Check if the duplicate views experiment is enabled.
 *
 * @return boolean
 */
function wpcom_is_duplicate_views_experiment_enabled() {
	// TODO: We don't know yet the experiment name.
	$experiment_platform = 'calypso';
	$experiment_name     = "{$experiment_platform}_duplicate_views_placeholder";

	static $is_enabled = null;
	if ( $is_enabled !== null ) {
		return $is_enabled;
	}

	if ( ( new Host() )->is_wpcom_simple() ) {
		$is_enabled = 'treatment' === \ExPlat\assign_current_user( $experiment_name );
		return $is_enabled;
	}

	$option_name = 'duplicate_views_experiment_assignment';
	$variation   = get_user_option( $option_name, get_current_user_id() );

	if ( false !== $variation ) {
		$is_enabled = 'treatment' === $variation;
		return $is_enabled;
	}

	if ( ! ( new Jetpack_Connection() )->is_user_connected() ) {
		$is_enabled = false;
		return $is_enabled;
	}

	$request_path = add_query_arg(
		array( 'experiment_name' => $experiment_name ),
		"/experiments/0.1.0/assignments/{$experiment_platform}"
	);
	$response     = Client::wpcom_json_api_request_as_user( $request_path, 'v2' );

	if ( is_wp_error( $response ) ) {
		$is_enabled = false;
		return $is_enabled;
	}

	$response_code = wp_remote_retrieve_response_code( $response );

	if ( 200 !== $response_code ) {
		$is_enabled = false;
		return $is_enabled;
	}

	$data = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( isset( $data['variations'] ) && isset( $data['variations'][ $experiment_name ] ) ) {
		$variation = $data['variations'][ $experiment_name ];
		update_user_option( get_current_user_id(), $option_name, $variation, true );

		$is_enabled = 'treatment' === $variation;
		return $is_enabled;
	} else {
		$is_enabled = false;
		return $is_enabled;
	}
}
