<?php
/**
 * Loads the React version of Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings_App;

use Automattic\Jetpack\Sharing_Likes\REST\Settings_Controller;
use Automattic\Jetpack\Sharing_Likes\REST\Status_Controller;
use Automattic\Jetpack\Sharing_Likes\Settings\Placement_Section;
use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Screen_Id;
use WP_REST_Request;

/**
 * Swaps the PHP screen for the wp-build app on sites that opt in.
 *
 * Everything here runs on the Sharing page only: the polyfills force-replace core script handles.
 */
final class Settings_App {

	/**
	 * Opt-in filter. Off by default while the React screen is being built.
	 */
	public const FILTER = 'rsm_jetpack_ui_modernization_sharing_likes';

	/**
	 * The wp-build page ID, which wp-build's generated enqueue check compares the screen ID against.
	 */
	public const WP_BUILD_PAGE = 'jetpack-sharing-settings';

	private const RENDER_FUNCTION    = 'jetpack_sharing_likes_jetpack_sharing_settings_wp_admin_render_page';
	private const MODULES_FUNCTION   = 'jetpack_sharing_likes_register_script_modules';
	private const INTERCEPT_FUNCTION = 'jetpack_sharing_likes_jetpack_sharing_settings_intercept_render';

	/**
	 * Whether `load()` loaded the build in this request.
	 *
	 * @var bool
	 */
	private static $loaded = false;

	/**
	 * The real screen ID while it is aliased.
	 *
	 * @var string|null
	 */
	private static $original_screen_id = null;

	/**
	 * Hook the loader.
	 */
	public static function init(): void {
		// Priority 1: opt-in code adds the filter on `plugins_loaded`, and the menu registers at 10.
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load' ), 1 );
	}

	/**
	 * Load the app when this request is for it.
	 */
	public static function maybe_load(): void {
		if ( self::should_load() ) {
			self::load( dirname( __DIR__, 2 ) . '/build/build.php' );
		}
	}

	/**
	 * Whether this is a wp-admin request for the Sharing page on a site that opted in.
	 *
	 * Not true for Calypso's `wpcom/v2/admin-menu`, which fires `admin_menu` in a REST request.
	 */
	public static function should_load(): bool {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only decides which screen to render.
		if ( ! is_admin() || ! isset( $_GET['page'] ) || ! is_string( $_GET['page'] ) ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only decides which screen to render.
		if ( Settings_Page::SLUG !== sanitize_text_field( wp_unslash( $_GET['page'] ) ) ) {
			return false;
		}

		return (bool) apply_filters( self::FILTER, false );
	}

	/**
	 * Load the generated build and everything the page needs around it.
	 *
	 * Public so tests can point it at a fixture; callers go through `maybe_load()`.
	 *
	 * @param string $build_index Path to wp-build's `build.php`.
	 */
	public static function load( string $build_index ): void {
		if ( self::$loaded || ! file_exists( $build_index ) ) {
			return;
		}

		$require = static function () use ( $build_index ): void {
			require_once $build_index;
		};

		// An older wp-build-polyfills under the Jetpack autoloader may predate load_with_alias().
		if ( method_exists( WP_Build_Screen_Id::class, 'load_with_alias' ) ) {
			WP_Build_Screen_Id::load_with_alias( array( __CLASS__, 'alias_screen_id' ), array( __CLASS__, 'restore_screen_id' ), $require );
		} else {
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'alias_screen_id' ) );
			$require();
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'restore_screen_id' ) );
		}

		// A stale or partial build can't render the page, so don't swap core's scripts for it.
		if ( ! function_exists( self::RENDER_FUNCTION ) ) {
			remove_action( 'admin_enqueue_scripts', array( __CLASS__, 'alias_screen_id' ) );
			remove_action( 'admin_enqueue_scripts', array( __CLASS__, 'restore_screen_id' ) );
			return;
		}

		// The generated file registers these on `wp_default_scripts`, which has already fired by `admin_menu`.
		if ( function_exists( self::MODULES_FUNCTION ) ) {
			call_user_func( self::MODULES_FUNCTION );
		}

		remove_action( 'admin_init', self::INTERCEPT_FUNCTION );

		WP_Build_Polyfills::register(
			'jetpack-sharing-likes',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_i18n_loader' ) );
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ) );

		self::$loaded = true;
	}

	/**
	 * The generated render function, once the build loaded.
	 */
	public static function render_callback(): ?callable {
		return self::$loaded && function_exists( self::RENDER_FUNCTION ) ? self::RENDER_FUNCTION : null;
	}

	/**
	 * Show wp-build's generated enqueue check the page ID it expects.
	 */
	public static function alias_screen_id(): void {
		$screen = get_current_screen();
		if ( ! $screen ) {
			return;
		}

		self::$original_screen_id = $screen->id;
		$screen->id               = self::WP_BUILD_PAGE;
	}

	/**
	 * Put the real screen ID back for everything after the generated check.
	 */
	public static function restore_screen_id(): void {
		$screen = get_current_screen();
		if ( ! $screen || null === self::$original_screen_id ) {
			return;
		}

		$screen->id               = self::$original_screen_id;
		self::$original_screen_id = null;
	}

	/**
	 * Jetpack's i18n loader is registered everywhere but only enqueued on demand; the init module needs it.
	 */
	public static function enqueue_i18n_loader(): void {
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			wp_enqueue_script( 'wp-jp-i18n-loader' );
		}
	}

	/**
	 * Hand the first render what the routes would answer, plus what only PHP knows.
	 *
	 * @param array $data Script data.
	 * @return array
	 */
	public static function add_script_data( $data ) {
		$data = is_array( $data ) ? $data : array();

		if ( ! current_user_can( 'manage_options' ) ) {
			return $data;
		}

		$data['sharing_likes'] = array(
			'status'              => ( new Status_Controller() )->get_status()->get_data(),
			// An empty list would encode as `[]`.
			'settings'            => (object) ( new Settings_Controller() )->get_item( new WP_REST_Request() )->get_data(),
			'placement_choices'   => array_map(
				static function ( string $choice ): array {
					return array(
						'value' => $choice,
						'label' => Placement_Section::label_for( $choice ),
					);
				},
				Placement_Section::choices()
			),
			'multibyte_supported' => function_exists( 'mb_stripos' ),
			'private_site'        => ( new Status() )->is_private_site(),
		);

		return $data;
	}
}
