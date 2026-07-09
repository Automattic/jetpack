<?php
/**
 * Adds a "launch site" button to the admin bar.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

/**
 * Determine whether the launch button should be shown/enhanced on this request.
 *
 * @return bool
 */
function wpcom_should_show_launch_button(): bool {
	$current_blog_id = get_current_blog_id();

	if ( function_exists( 'is_graylisted' ) && is_graylisted( $current_blog_id ) ) {
		return false;
	}

	if ( ! is_user_logged_in() ) {
		return false;
	}

	if ( ! is_user_member_of_blog( get_current_user_id(), $current_blog_id ) ) {
		return false;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		return false;
	}

	if ( function_exists( 'has_blog_sticker' ) && has_blog_sticker( 'difm-lite-in-progress' ) ) {
		return false;
	}

	// No button for agency-managed sites.
	if ( ! empty( get_option( 'is_fully_managed_agency_site' ) ) ) {
		return false;
	}

	if ( get_option( 'launch-status' ) !== 'unlaunched' ) {
		return false;
	}

	if ( $current_blog_id === 1 && defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		return false;
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a context check, not a form submission.
	$is_preview = isset( $_GET['preview'] ) && 'true' === sanitize_text_field( wp_unslash( $_GET['preview'] ) );
	if ( $is_preview ) {
		return false;
	}

	return true;
}

/**
 * Adds a "launch site" button to the admin bar.
 *
 * @param WP_Admin_Bar $admin_bar The WordPress admin bar.
 */
function wpcom_add_launch_button_to_admin_bar( WP_Admin_Bar $admin_bar ) {
	if ( ! wpcom_should_show_launch_button() ) {
		return;
	}

	$icon = '<svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M10.6242 9.74354L7.62419 12.1261V13.2995C7.62419 13.4418 7.77653 13.5322 7.90147 13.4641L10.5265 12.0322C10.5867 11.9994 10.6242 11.9363 10.6242 11.8676V9.74354ZM6.49919 12.0875L3.91203 9.50037H2.7001C1.70383 9.50037 1.07079 8.43399 1.54786 7.55937L2.97968 4.93437C3.20967 4.51272 3.65161 4.25036 4.13191 4.25036H7.17569C9.1325 2.16798 11.3176 0.754637 14.1427 0.531305C14.9004 0.471402 15.5282 1.09911 15.4682 1.85687C15.2449 4.68199 13.8316 6.86706 11.7492 8.82386V11.8676C11.7492 12.3479 11.4868 12.7899 11.0652 13.0199L8.44018 14.4517C7.56557 14.9288 6.49919 14.2957 6.49919 13.2995V12.0875ZM6.25602 5.37536H4.13191C4.0633 5.37536 4.00017 5.41284 3.96731 5.47308L2.53549 8.09808C2.46734 8.22303 2.55777 8.37536 2.7001 8.37536H3.87344L6.25602 5.37536Z"
		/>
		<path d="M0.498047 13.3962C0.498047 12.2341 1.44011 11.2921 2.60221 11.2921C3.76431 11.2921 4.70638 12.2341 4.70638 13.3962C4.70638 14.5583 3.76431 15.5004 2.60221 15.5004H1.06055C0.749887 15.5004 0.498047 15.2486 0.498047 14.9379V13.3962Z" />
	</svg>';

	$blog_domain = wp_parse_url( home_url(), PHP_URL_HOST );
	$admin_bar->add_menu(
		array(
			'id'     => 'menu-id',
			'parent' => null,
			'group'  => null,
			'title'  => '<span class="ab-icon">' . $icon . '</span><span class="ab-label">' . __( 'Launch site', 'jetpack-mu-wpcom' ) . '</span>',
			'href'   => add_query_arg(
				array(
					'siteSlug' => $blog_domain,
					'ref'      => 'wp-admin',
				),
				'https://wordpress.com/start/launch-site'
			),
			'meta'   => array(
				// Use `admin-color-modern` to keep the button always in blueberry (modern scheme).
				'class' => 'launch-site admin-color-modern',
			),
		)
	);
}

/**
 * Enqueue wp-components styles and the celebration modal bundle CSS.
 *
 * The celebration modal uses @wordpress/components (Modal, Button, Tooltip).
 * On the frontend, wp-components CSS is not loaded automatically, so we enqueue
 * it here together with the compiled bundle CSS that contains the modal's own styles.
 */
function wpcom_enqueue_components_styles() {
	if ( ! wpcom_should_show_launch_button() ) {
		return;
	}

	// Enqueue WordPress's built-in wp-components stylesheet.
	// In admin contexts it may already be queued; wp_enqueue_style() is idempotent.
	wp_enqueue_style( 'wp-components' );

	// Enqueue the compiled bundle CSS (contains celebrate-launch-modal SCSS).
	$css_file = is_rtl() ? 'adminbar-launch-button.rtl.css' : 'adminbar-launch-button.css';
	$css_path = Jetpack_Mu_Wpcom::BASE_DIR . 'build/adminbar-launch-button/' . $css_file;

	// Fall back to LTR file if RTL file is missing.
	if ( ! file_exists( $css_path ) ) {
		$css_file = 'adminbar-launch-button.css';
		$css_path = Jetpack_Mu_Wpcom::BASE_DIR . 'build/adminbar-launch-button/' . $css_file;
	}

	if ( file_exists( $css_path ) ) {
		wp_enqueue_style(
			'adminbar-launch-button-bundle',
			plugins_url( 'build/adminbar-launch-button/' . $css_file, Jetpack_Mu_Wpcom::BASE_FILE ),
			array( 'wp-components' ),
			filemtime( $css_path )
		);
	}
}

/**
 * Enqueue the necessary assets for the admin bar button.
 */
function wpcom_enqueue_launch_button_assets() {
	if ( ! wpcom_should_show_launch_button() ) {
		return;
	}

	$version = filemtime( __DIR__ . '/style.css' );
	wp_enqueue_style( 'launch-banner', plugins_url( 'style.css', __FILE__ ), array(), $version );

	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/adminbar-launch-button/adminbar-launch-button.asset.php';

	wp_enqueue_script(
		'adminbar-launch-button',
		plugins_url( 'build/adminbar-launch-button/adminbar-launch-button.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/adminbar-launch-button/adminbar-launch-button.js' ),
		true
	);

	$bundles      = function_exists( 'wpcom_get_site_purchases' ) ? wp_list_filter( wpcom_get_site_purchases(), array( 'product_type' => 'bundle' ) ) : array();
	$current_plan = array_pop( $bundles );

	$launch_button_data = wp_json_encode(
		array(
			'blogId'          => get_current_blog_id(),
			'siteUrl'         => home_url(),
			'siteDomain'      => wp_parse_url( home_url(), PHP_URL_HOST ),
			'sitePlan'        => $current_plan,
			'hasCustomDomain' => function_exists( 'wpcom_site_has_feature' ) && wpcom_site_has_feature( 'custom-domain' ),
		),
		JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
	);

	wp_add_inline_script(
		'adminbar-launch-button',
		"var JETPACK_LAUNCH_BUTTON_DATA = $launch_button_data;",
		'before'
	);

	Common\wpcom_enqueue_tracking_scripts( 'adminbar-launch-button' );
}

/**
 * Enqueue a wp-admin only script that flags the launch button as being in wp-admin.
 *
 * This is used to determine whether to reload the page when the celebration modal is closed.
 */
function wpcom_enqueue_admin_launch_button_assets() {
	if ( ! wpcom_should_show_launch_button() ) {
		return;
	}

	wp_add_inline_script(
		'adminbar-launch-button',
		'var JETPACK_LAUNCH_BUTTON_DATA_ADMIN = true;',
		'before'
	);
}

add_action( 'admin_bar_menu', 'wpcom_add_launch_button_to_admin_bar', 500 );
add_action( 'wp_enqueue_scripts', 'wpcom_enqueue_components_styles' );
add_action( 'wp_enqueue_scripts', 'wpcom_enqueue_launch_button_assets' );
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_components_styles' );
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_launch_button_assets' );
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_admin_launch_button_assets' );
