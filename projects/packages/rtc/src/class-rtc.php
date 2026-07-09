<?php
/**
 * Real-time Collaboration (RTC) websocket transport support.
 *
 * Extends Gutenberg's RTC feature with PingHub websocket transport
 * using the WordPress.com infrastructure.
 *
 * @package automattic/jetpack-rtc
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\RTC\REST_Connection_Log;
use Automattic\Jetpack\RTC\REST_Pinghub_Token;
use Automattic\Jetpack\RTC\REST_RTC_Notices;

/**
 * Main RTC class.
 */
class RTC {

	const PACKAGE_VERSION = '0.1.0';

	/**
	 * Option names for the RTC setting.
	 * The old name was used until Gutenberg PR #76643 renamed it.
	 * Both are supported for backwards compatibility.
	 */
	const OPTION_OLD = 'wp_enable_real_time_collaboration';
	const OPTION_NEW = 'wp_collaboration_enabled';

	/**
	 * Whether the hooks have been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the RTC package by registering hooks.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'register_providers' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'load_notices' ) );
		add_action( 'load-options-writing.php', array( __CLASS__, 'unregister_rtc_setting' ) );
		add_action( 'load-options-writing.php', array( __CLASS__, 'override_rtc_setting_default' ) );

		// Hook into both old and new option names for backwards compatibility.
		foreach ( array( self::OPTION_OLD, self::OPTION_NEW ) as $option ) {
			add_filter( 'option_' . $option, array( __CLASS__, 'filter_rtc_option' ), 10 );
			add_filter( 'default_option_' . $option, array( __CLASS__, 'default_rtc_option' ), 20, 2 );
			add_filter( 'pre_option_' . $option, array( __CLASS__, 'pre_rtc_option' ) );
		}
	}

	/**
	 * Determine whether RTC is allowed.
	 *
	 * @return bool
	 */
	public static function is_allowed() {
		/**
		 * Filter whether RTC can be enabled.
		 *
		 * @param bool $is_enabled Whether RTC can be enabled.
		 */
		return apply_filters( 'jetpack_rtc_enabled', false );
	}

	/**
	 * Determine whether RTC is enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		global $pagenow;

		// Real-time collaboration is not enabled in the site editor.
		if (
			'site-editor.php' === $pagenow ||
			( 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'site-editor-v2' === sanitize_text_field( wp_unslash( $_GET['page'] ) ) ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		) {
			return false;
		}

		return self::is_allowed() && (bool) get_option( 'wp_collaboration_enabled' );
	}

	/**
	 * Get the list of active RTC providers.
	 *
	 * @return string[]
	 */
	public static function get_providers() {
		if ( ! self::is_enabled() ) {
			return array();
		}

		$allowed_providers = array( 'http-polling', 'pinghub' );

		$default_providers = array( 'pinghub' );

		/**
		 * Filter the list of RTC providers.
		 *
		 * @param string[] $providers List of provider identifiers.
		 */
		$providers = apply_filters( 'jetpack_rtc_providers', $default_providers );
		if ( ! is_array( $providers ) ) {
			return array();
		}

		return array_values(
			array_filter(
				$providers,
				function ( $provider ) use ( $allowed_providers ) {
					return in_array( $provider, $allowed_providers, true );
				}
			)
		);
	}

	/**
	 * Register REST API routes for the PingHub token endpoint.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		( new REST_Pinghub_Token() )->register_routes();
		( new REST_RTC_Notices() )->register_routes();

		if ( function_exists( 'log2logstash' ) ) {
			( new REST_Connection_Log() )->register_routes();
		}
	}

	/**
	 * Enqueue the assets that extend the RTC providers.
	 *
	 * @return void
	 */
	public static function register_providers() {
		if ( ! self::is_enabled() ) {
			return;
		}

		$providers = self::get_providers();

		// If HTTP polling (Gutenberg's built-in default provider when this script isn't enqueued)
		// is the only provider being used, then we don't need to inject any assets since that's
		// already the default behavior.
		if ( count( $providers ) === 1 && in_array( 'http-polling', $providers, true ) ) {
			return;
		}

		$handle = 'jetpack-rtc-providers';

		Assets::register_script(
			$handle,
			'../build/rtc-providers.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-rtc',
				'enqueue'    => true,
			)
		);

		$data = wp_json_encode(
			array(
				'providers'         => $providers,
				'connectionLogging' => function_exists( 'log2logstash' ),
				'currentPostType'   => get_post_type() ? get_post_type() : null,
				'currentPostId'     => get_the_ID() ? get_the_ID() : null,
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		);

		wp_add_inline_script(
			$handle,
			"var jetpackRTC = $data;",
			'before'
		);
	}

	/**
	 * Unregister the RTC setting field on the Writing page if RTC is not allowed.
	 *
	 * @return void
	 */
	public static function unregister_rtc_setting() {
		if ( self::is_allowed() ) {
			return;
		}

		global $wp_settings_fields;

		foreach ( array( self::OPTION_OLD, self::OPTION_NEW ) as $option ) {
			if ( isset( $wp_settings_fields['writing']['default'][ $option ] ) ) {
				unset( $wp_settings_fields['writing']['default'][ $option ] );
			}
		}
	}

	/**
	 * When RTC is not allowed, always force the option off.
	 * When RTC is allowed, respect the stored option value.
	 *
	 * @param mixed $value  The value of the option.
	 * @return mixed
	 */
	public static function filter_rtc_option( $value ) {
		// RTC not allowed: force the option off, regardless of what's in the DB.
		if ( ! self::is_allowed() ) {
			return '0';
		}

		// RTC allowed: respect whatever is stored.
		return $value;
	}

	/**
	 * When RTC is allowed and the option is NOT stored yet,
	 * default the option to enabled (1), unless the old option
	 * has a stored value to migrate from.
	 *
	 * This handles the Gutenberg upgrade path: e.g. a site on 22.7 stored
	 * wp_enable_real_time_collaboration, then upgraded to 22.8 which reads
	 * wp_collaboration_enabled — the new option inherits the old value.
	 *
	 * @param mixed  $default The default value.
	 * @param string $option  The option name.
	 * @return mixed
	 */
	public static function default_rtc_option( $default = '', $option = '' ) {
		// RTC not allowed: keep default disabled.
		if ( ! self::is_allowed() ) {
			return '0';
		}
		// RTC allowed and option is not stored yet
		if ( $option === self::OPTION_NEW ) {
			// If the old option is set, use that.
			return get_option( self::OPTION_OLD );
		}
		// Default to enabled.
		return '1';
	}

	/**
	 * Disable RTC for super admins that are not members of the blog to avoid
	 * accidentally exposing their presence to site users (e.g. during support).
	 * Skip this on the Writing settings page so they can still toggle the option.
	 *
	 * @return mixed
	 */
	public static function pre_rtc_option() {
		global $pagenow;

		if ( 'options-writing.php' !== $pagenow && is_super_admin() && ! is_user_member_of_blog() ) {
			return '0';
		}

		// Returning false to let `get_option` proceed normally.
		return false;
	}

	/**
	 * Override the default for the Gutenberg RTC setting so it defaults to enabled in the UI.
	 *
	 * @return void
	 */
	public static function override_rtc_setting_default() {
		global $wp_registered_settings;

		// No need to override the setting when RTC is not allowed, since we unregister it
		// in `unregister_rtc_setting`.
		if ( ! self::is_allowed() ) {
			return;
		}

		foreach ( array( self::OPTION_OLD, self::OPTION_NEW ) as $option ) {
			// Only re-register the option if Gutenberg already registered it.
			if ( ! isset( $wp_registered_settings[ $option ] ) ) {
				continue;
			}

			unregister_setting( 'writing', $option );

			register_setting(
				'writing',
				$option,
				array(
					'type'              => 'boolean',
					'description'       => __( 'Enable Real-Time Collaboration', 'jetpack-rtc' ),
					'sanitize_callback' => 'rest_sanitize_boolean',
					'default'           => true,
					'show_in_rest'      => true,
				)
			);
		}
	}

	/**
	 * Get the maximum number of peers allowed per room.
	 *
	 * @return int Max peers per room.
	 */
	public static function get_max_peers_per_room() {
		return (int) apply_filters( 'jetpack_rtc_max_peers_per_room', 3 );
	}

	/**
	 * Check if the current user is the plan owner for this site.
	 * Works on Simple sites (via wpcom_get_blog_owner) and Atomic sites
	 * (via Jetpack connection master_user). Returns false on self-hosted
	 * since there is no WP.com plan to upgrade.
	 *
	 * @return bool
	 */
	public static function is_plan_owner() {
		$current_user_id = get_current_user_id();

		// Simple sites: wpcom_get_blog_owner is the canonical source.
		if ( function_exists( 'wpcom_get_blog_owner' ) ) {
			$owner_id = wpcom_get_blog_owner( get_wpcom_blog_id() );
			return (int) $current_user_id === (int) $owner_id;
		}

		// Atomic sites: the Jetpack connection master_user is the plan owner.
		if ( class_exists( 'Jetpack_Options' ) ) {
			$master_user = \Jetpack_Options::get_option( 'master_user' );
			if ( $master_user ) {
				return (int) $current_user_id === (int) $master_user;
			}
		}

		return false;
	}

	/**
	 * Get the site slug for use in WP.com URLs.
	 *
	 * @return string
	 */
	private static function get_site_slug() {
		if ( function_exists( 'wpcom_get_site_slug' ) ) {
			return wpcom_get_site_slug();
		}

		if ( class_exists( '\Automattic\Jetpack\Status' ) ) {
			$jetpack_status = new \Automattic\Jetpack\Status();
			return $jetpack_status->get_site_suffix();
		}

		return '';
	}

	/**
	 * Enqueue the assets that handle the RTC notices.
	 *
	 * @return void
	 */
	public static function load_notices() {
		if ( ! self::is_enabled() ) {
			return;
		}

		$handle = 'jetpack-rtc-notices';

		Assets::register_script(
			$handle,
			'../build/rtc-notices.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-rtc',
				'enqueue'    => true,
			)
		);

		$is_admin_user = current_user_can( 'manage_options' );
		$is_plan_owner = self::is_plan_owner();
		$post_type     = get_post_type();

		$data = wp_json_encode(
			array(
				'assetsUrl'          => plugins_url( '../build/', __FILE__ ),
				'isAdmin'            => $is_admin_user,
				'isPlanOwner'        => $is_plan_owner,
				'postId'             => get_the_ID(),
				'postType'           => $post_type ? $post_type : null,
				'userId'             => get_current_user_id(),
				'postTitle'          => get_the_title(),
				'postEditUrl'        => get_edit_post_link( get_the_ID(), 'raw' ),
				'postsListUrl'       => admin_url( 'edit.php' ),
				'siteSlug'           => self::get_site_slug(),
				'maxPeersPerRoom'    => self::get_max_peers_per_room(),
				'enableLimitNotices' => apply_filters( 'jetpack_rtc_enable_limit_notices', false ),
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		);

		wp_add_inline_script(
			$handle,
			"var jetpackRtcNotices = $data;",
			'before'
		);
	}
}
