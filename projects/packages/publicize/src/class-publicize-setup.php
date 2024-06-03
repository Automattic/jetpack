<?php
/**
 * Main Publicize class.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status\Host;

/**
 * The class to configure and initialize the publicize package.
 */
class Publicize_Setup {

	/**
	 * Whether to update the plan information from WPCOM when initialising the package.
	 *
	 * @var bool
	 */
	public static $refresh_plan_info = false;

	/**
	 * To configure the publicize package, when called via the Config package.
	 */
	public static function configure() {
		add_action( 'jetpack_feature_publicize_enabled', array( __CLASS__, 'on_jetpack_feature_publicize_enabled' ) );
	}

	/**
	 * To configure the publicize package, when called via the Config package.
	 */
	public static function on_jetpack_feature_publicize_enabled() {
		global $publicize_ui;

		if ( ! isset( $publicize_ui ) ) {
			$publicize_ui = new Publicize_UI();

		}

		// Adding on a higher priority to make sure we're the first field registered.
		// The priority parameter can be removed once we deprecate WPCOM_REST_API_V2_Post_Publicize_Connections_Field
		add_action( 'rest_api_init', array( new Connections_Post_Field(), 'register_fields' ), 5 );
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
		add_action( 'current_screen', array( static::class, 'on_current_screen_action' ) );

		add_action( 'rest_api_init', array( static::class, 'register_core_options' ) );
		add_action( 'admin_init', array( static::class, 'register_core_options' ) );

		// Flagged to be removed after deprecation.
		// @deprecated $$next_version$$
		add_action( 'rest_api_init', array( new Auto_Conversion\REST_Settings_Controller(), 'register_routes' ) );

		( new Social_Image_Generator\Setup() )->init();
	}

	/**
	 * Registers the core options for the Publicize package.
	 */
	public static function register_core_options() {
		( new Jetpack_Social_Settings\Settings() )->register_settings();
		( new Jetpack_Social_Settings\Dismissed_Notices() )->register();
	}

	/**
	 * Retrieves the blog ID based on the environment we're running in.
	 *
	 * @return int The WPCOM blog ID.
	 */
	public static function get_blog_id() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM ? get_current_blog_id() : \Jetpack_Options::get_option( 'id' );
	}

	/**
	 * Get current URL.
	 *
	 * @return string Current URL.
	 */
	public static function get_current_url() {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$host = ! empty( $_SERVER['HTTP_HOST'] ) ? wp_unslash( $_SERVER['HTTP_HOST'] ) : wp_parse_url( home_url(), PHP_URL_HOST );
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$path = ! empty( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';
		return esc_url_raw( ( is_ssl() ? 'https' : 'http' ) . '://' . $host . $path );
	}

	/**
	 * Hook into the current screen action.
	 */
	public static function on_current_screen_action() {
		$current_screen = get_current_screen();

		if ( empty( $current_screen ) || 'post' !== $current_screen->base ) {
			return;
		}

		self::init_sharing_limits( $current_screen );

		$is_simple_site = defined( 'IS_WPCOM' ) && IS_WPCOM;
		$is_atomic_site = ( new Host() )->is_woa_site();

		if ( $current_screen->is_block_editor() || $is_simple_site || $is_atomic_site ) {
			return;
		}

		add_action( 'publicize_classic_editor_form_after', array( static::class, 'render_classic_editor_nudge' ), 11 );
	}

	/**
	 * Initialise share limits if they should be enabled.
	 *
	 * @param \WP_Screen $current_screen The current screen object.
	 */
	public static function init_sharing_limits( $current_screen ) {
		global $publicize;

		if ( $publicize->has_paid_plan( self::$refresh_plan_info ) ) {
			return;
		}

		$info = $publicize->get_publicize_shares_info( self::get_blog_id() );

		if ( is_wp_error( $info ) ) {
			return;
		}

		if ( empty( $info['is_share_limit_enabled'] ) ) {
			return;
		}

		$connections      = $publicize->get_filtered_connection_data();
		$shares_remaining = $info['shares_remaining'];

		$share_limits = new Share_Limits( $connections, $shares_remaining, ! $current_screen->is_block_editor(), self::get_current_url() );
		$share_limits->enforce_share_limits();
	}

	/**
	 * Render the classic editor nudge.
	 */
	public static function render_classic_editor_nudge() {
		global $publicize;

		if ( $publicize->has_paid_features() ) {
			return;
		}

		$current_url = self::get_current_url();

		$link = sprintf(
			'<a href="%1$s" target="_blank" rel="noopener noreferrer">%2$s</a>',
			Redirect::get_url(
				'jetpack-social-basic-plan-block-editor',
				array(
					'query' => 'redirect_to=' . rawurlencode( $current_url ),
				)
			),
			__( 'Unlock enhanced media sharing features.', 'jetpack-publicize-pkg' )
		);

		$kses_allowed_tags = array(
			'a' => array(
				'href'   => array(),
				'target' => array(),
			),
		);

		echo '<p><em>' . wp_kses( $link, $kses_allowed_tags ) . ' </em></p>';
	}
}
