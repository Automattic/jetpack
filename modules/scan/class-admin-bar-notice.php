<?php
/**
 * A class that adds the scan notice to the admin bar.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Scan;

use function Automattic\Jetpack\enqueue_async_script as jetpack_enqueue_async_script;
use Automattic\Jetpack\Redirect;

/**
 * Class Main
 *
 * Responsible for loading the admin bar notice if threats are found.
 *
 * @package Automattic\Jetpack\Scan
 */
class Admin_Bar_Notice {
	const SCRIPT_NAME    = 'jetpack-scan-show-notice';
	const SCRIPT_VERSION = '1';

	/**
	 * The singleton instance of this class.
	 *
	 * @var Admin_Bar_Notice
	 */
	protected static $instance;

	/**
	 * Get the singleton instance of the class.
	 *
	 * @return Admin_Bar_Notice
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new Admin_Bar_Notice();
			self::$instance->init_hooks();
		}

		return self::$instance;
	}
	/**
	 * Initalize the hooks as needed.
	 */
	private function init_hooks() {
		if ( ! $this->should_try_to_display_notice() ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_toolbar_script' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_toolbar_script' ) );
		add_action( 'admin_bar_menu', array( $this, 'add_threats_to_toolbar' ), 999 );
	}

	/**
	 * Whether to even try to display the notice or now.
	 *
	 * @return bool
	 */
	private function should_try_to_display_notice() {
		if ( is_multisite() ) {
			return false; // Jetpack Scan is currently not supported on multisite.
		}

		// Check if VaultPress is active.
		if ( class_exists( 'VaultPress' ) ) {
			return false;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return false; // Only show the notice to admins.
		}

		return true;
	}

	/**
	 * Add the inline styles and scripts if they are needed.
	 */
	public function enqueue_toolbar_script() {
		$this->add_inline_styles();

		if ( ! is_null( $this->has_threats() ) ) {
			return;
		}

		// We don't know about threats in the cache lets load the JS that fetches the info and updates the admin bar.
		jetpack_enqueue_async_script( self::SCRIPT_NAME, '_inc/build/scan/admin-bar-notice.min.js', 'modules/scan/admin-bar-notice.js', array(), self::SCRIPT_VERSION, true );

		$script_data = array(
			'nonce'              => wp_create_nonce( 'wp_rest' ),
			'scan_endpoint'      => get_rest_url( null, 'jetpack/v4/scan' ),
			'scan_dashboard_url' => Redirect::get_url( 'calypso-scanner' ),
			/* translators: %s is the alert icon */
			'singular'           => sprintf( esc_html__( '%s Threat found', 'jetpack' ), $this->get_icon() ),
			/* translators: %s is the alert icon */
			'multiple'           => sprintf( esc_html__( '%s Threats found', 'jetpack' ), $this->get_icon() ),
		);
		wp_localize_script( self::SCRIPT_NAME, 'Jetpack_Scan', $script_data );
	}

	/**
	 * Adds the inline styles if they are needed.
	 */
	public function add_inline_styles() {
		// We know there are no threats so lets not include any css.
		if ( false === $this->has_threats() ) {
			return;
		}

		// We might be showing the threats in the admin bar lets make sure that they look great!
		$style = '#wp-admin-bar-jetpack-scan-notice svg { float:left; margin-top: 4px; margin-right: 6px; width: 18px; height: 22px; }';
		if ( is_rtl() ) {
			$style = '#wp-admin-bar-jetpack-scan-notice svg { float:right; margin-top: 4px; margin-left: 6px; width: 18px; height: 22px; }';
		}
		wp_add_inline_style( 'admin-bar', $style );
	}

	/**
	 * Add the link to the admin bar.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar WP Admin Bar class object.
	 */
	public function add_threats_to_toolbar( $wp_admin_bar ) {
		if ( ! $this->should_try_to_display_notice() ) {
			return;
		}

		$has_threats = $this->has_threats();
		if ( false === $has_threats ) {
			return;
		}

		$node = array(
			'id'     => 'jetpack-scan-notice',
			'title'  => '',
			'parent' => 'top-secondary',
			'meta'   => array(
				'title' => esc_attr__( 'Visit your scan dashboard', 'jetpack' ),
				'class' => 'error',
			),
		);

		// No need to do anything...
		if ( $has_threats ) {
			/* translators: %s is the alert icon */
			$node['title']           = sprintf( esc_html__( '%s Threats found', 'jetpack' ), $this->get_icon() );
			$node['href']            = esc_url( Redirect::get_url( 'calypso-scanner' ) );
			$node['meta']['onclick'] = 'window.open( this.href ); return false;';
		}

		$wp_admin_bar->add_node( $node );
	}

	/**
	 * Returns the shield icon.
	 *
	 * @return string
	 */
	private function get_icon() {
		return '<svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 0L0 4V10C0 15.55 3.84 20.74 9 22C14.16 20.74 18 15.55 18 10V4L9 0Z" fill="#D63638"/><path d="M7.99121 6.00894H10.0085V11.9968H7.99121V6.00894Z" fill="#FFF"/><path d="M7.99121 14.014H10.0085V15.9911H7.99121V14.014Z" fill="#FFF"/></svg>';
	}

	/**
	 *
	 * Return Whether boolean cached threats exist or null if the state is unknown.
	 * * @return boolean or null
	 */
	public function has_threats() {
		$scan_state = get_transient( 'jetpack_scan_state' );
		if ( empty( $scan_state ) ) {
			return null;
		}

		// Return true if there is at least one threat found.
		return (bool) isset( $scan_state->threats[0] );
	}
}
