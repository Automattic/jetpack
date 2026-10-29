<?php
/**
 * A class that adds the scan notice to the admin bar.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Scan;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Protect\Threat_Count;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use WP_Admin_Bar;

/**
 * Class Main
 *
 * Responsible for loading the admin bar notice if threats are found.
 *
 * @package Automattic\Jetpack\Scan
 */
class Admin_Bar_Notice {
	const SCRIPT_NAME = 'jetpack-scan-show-notice';

	/**
	 * The singleton instance of this class.
	 *
	 * @var Admin_Bar_Notice
	 */
	protected static $instance;

	/**
	 * The Protect dashboard's stored count, once read.
	 *
	 * @var int|null
	 */
	private $protect_count;

	/**
	 * Whether the Protect dashboard's count has been read in this request.
	 *
	 * @var bool
	 */
	private $protect_count_read = false;

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

		// Inject the data-ampdevmode attribute into the inline <script> output via wp_localize_script(). To revisit after https://github.com/ampproject/amp-wp/issues/4598.
		add_filter(
			'amp_dev_mode_element_xpaths',
			static function ( $expressions ) {
				$expressions[] = '//script[ contains( text(), "Jetpack_Scan" ) ]';
				return $expressions;
			}
		);
	}

	/**
	 * Whether to even try to display the notice or now.
	 *
	 * @return bool
	 */
	private function should_try_to_display_notice() {
		if ( ( new Status() )->is_offline_mode() ) {
			return false;
		}

		// Jetpack Scan is currently not supported on multisite.
		if ( is_multisite() ) {
			return false;
		}

		// Check if VaultPress is active, the assumtion there is that VaultPress is working.
		// It has its own notice in the admin bar.
		if ( class_exists( 'VaultPress' ) ) {
			return false;
		}

		// Check if Protect is active.
		// It has its own notice in the admin bar.
		if ( class_exists( 'Jetpack_Protect' ) ) {
			return false;
		}

		// Only show the notice to admins.
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Add the inline styles and scripts if they are needed.
	 */
	public function enqueue_toolbar_script() {
		$this->add_inline_styles();

		// The Protect dashboard's own script refreshes its count; otherwise this one fetches it when nothing is cached.
		// On the Protect page, fixing or ignoring a threat sends the new count with the same event.
		$needs_refresh = $this->uses_protect_count()
			? Threat_Count::needs_refresh() || $this->is_protect_dashboard_page()
			: null === $this->has_threats();
		if ( ! $needs_refresh ) {
			return;
		}

		Assets::register_script(
			self::SCRIPT_NAME,
			'_inc/build/scan/admin-bar-notice.min.js',
			JETPACK__PLUGIN_FILE,
			array(
				'in_footer'    => true,
				'strategy'     => 'defer',
				'nonmin_path'  => 'modules/scan/admin-bar-notice.js',
				'dependencies' => array( 'admin-bar' ),
				'enqueue'      => true,
			)
		);
		$script_data = array(
			'nonce'              => wp_create_nonce( 'wp_rest' ),
			'scan_endpoint'      => get_rest_url( null, 'jetpack/v4/scan' ),
			'scan_dashboard_url' => $this->get_scan_url(),
			/* translators: %s is the alert icon */
			'singular'           => sprintf( esc_html__( '%s Threat found', 'jetpack' ), $this->get_icon() ),
			/* translators: %s is the alert icon */
			'multiple'           => sprintf( esc_html__( '%s Threats found', 'jetpack' ), $this->get_icon() ),
		);
		if ( $this->uses_protect_count() ) {
			$script_data['count_event'] = Threat_Count::EVENT;
		}
		wp_localize_script( self::SCRIPT_NAME, 'Jetpack_Scan', $script_data );
	}

	/**
	 * Adds the inline styles if they are needed.
	 */
	public function add_inline_styles() {
		// We know there are no threats so lets not include any css.
		if ( ! $this->keeps_node() ) {
			return;
		}

		// We might be showing the threats in the admin bar lets make sure that they look great!
		$hide_wording_on_mobile = '#wp-admin-bar-jetpack-scan-notice.is-hidden { display:none; } @media screen and (max-width: 959px ) { #wpadminbar #wp-admin-bar-jetpack-scan-notice { width:32px; } #wpadminbar #wp-admin-bar-jetpack-scan-notice a { color: transparent!important; } }';
		$style                  = '#wp-admin-bar-jetpack-scan-notice svg { float:left; margin-top: 4px; margin-right: 6px; width: 18px; height: 22px; }' . $hide_wording_on_mobile;
		if ( is_rtl() ) {
			$style = '#wp-admin-bar-jetpack-scan-notice svg { float:right; margin-top: 4px; margin-left: 6px; width: 18px; height: 22px; }' . $hide_wording_on_mobile;
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

		if ( ! $this->keeps_node() ) {
			return;
		}
		$has_threats = $this->has_threats();

		$node = array(
			'id'     => 'jetpack-scan-notice',
			'title'  => '',
			'parent' => 'top-secondary',
			'meta'   => array(
				'title' => esc_attr__( 'View security scan details', 'jetpack' ),
				'class' => 'error is-hidden',
			),
		);

		if ( $has_threats ) {
			$node['href']          = esc_url( $this->get_scan_url() );
			$node['meta']['class'] = 'error';
			if ( ! $this->has_protect_dashboard() ) {
				$node['meta']['target'] = '_blank';
				$node['meta']['rel']    = 'noopener noreferrer';
			}
			$node['title'] = sprintf(
				esc_html(
				/* translators: %s is the alert icon */
					_n( '%s Threat found', '%s Threats found', $this->get_threat_count(), 'jetpack' )
				),
				$this->get_icon()
			);
		}

		$wp_admin_bar->add_node( $node );
	}

	/**
	 * Whether the Protect dashboard, which lists the threats inside wp-admin, is loaded.
	 *
	 * @return bool
	 */
	private function has_protect_dashboard() {
		// The standalone Protect plugin needs no check: with it active, this notice is never shown.
		return (bool) did_action( 'jetpack_protect_dashboard_initialized' );
	}

	/**
	 * Whether this is the Protect dashboard page, where the threat count can change without a reload.
	 *
	 * @return bool
	 */
	private function is_protect_dashboard_page() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only compared, to pick which script loads.
		return is_admin() && $this->has_protect_dashboard() && isset( $_GET['page'] ) && 'jetpack-protect' === $_GET['page'];
	}

	/**
	 * Whether the admin bar gets a node, hidden while there are no threats, so a later count can show it.
	 *
	 * @return bool
	 */
	private function keeps_node() {
		return false !== $this->has_threats() || ( $this->uses_protect_count() && $this->is_protect_dashboard_page() );
	}

	/**
	 * Whether the count comes from the Protect dashboard, so the admin bar and the Protect menu item agree.
	 *
	 * @return bool
	 */
	private function uses_protect_count() {
		return $this->has_protect_dashboard() && method_exists( Threat_Count::class, 'get_cached' );
	}

	/**
	 * The Protect dashboard's stored count, read once per request.
	 *
	 * @return int|null Null when no status has been stored yet.
	 */
	private function get_protect_count() {
		if ( ! $this->protect_count_read ) {
			$this->protect_count      = Threat_Count::get_cached();
			$this->protect_count_read = true;
		}
		return $this->protect_count;
	}

	/**
	 * Where the threats are listed: the Protect dashboard when it is loaded, Jetpack Cloud otherwise.
	 *
	 * @return string
	 */
	private function get_scan_url() {
		return $this->has_protect_dashboard()
			? admin_url( 'admin.php?page=jetpack-protect' )
			: Redirect::get_url( 'calypso-scanner' );
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
		if ( $this->uses_protect_count() ) {
			$count = $this->get_protect_count();
			// An expired zero is unknown, so the notice keeps a hidden node the refresh can reveal.
			if ( null === $count || ( 0 === $count && Threat_Count::needs_refresh() ) ) {
				return null;
			}
			return $count > 0;
		}

		$scan_state = get_transient( 'jetpack_scan_state' );
		if ( empty( $scan_state ) ) {
			return null;
		}
		// Return true if there is at least one threat found.
		return isset( $scan_state->threats[0] );
	}

	/**
	 * Returns the number of threats found or 0.
	 *
	 * @return int
	 */
	public function get_threat_count() {
		if ( ! $this->has_threats() ) {
			return 0;
		}

		if ( $this->uses_protect_count() ) {
			return (int) $this->get_protect_count();
		}

		$scan_state = get_transient( 'jetpack_scan_state' );
		return is_array( $scan_state->threats ) ? count( $scan_state->threats ) : 0;
	}
}
