<?php
/**
 * Jetpack > Comments, the comment settings screen.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Screen_Id;

/**
 * Registers the screen and hands its wp-build app what only PHP knows.
 */
class Settings_Page {

	/**
	 * Menu slug.
	 */
	const SLUG = 'jetpack-comments';

	/**
	 * The wp-build page ID, which wp-build's generated enqueue check compares the screen ID against.
	 */
	const WP_BUILD_PAGE = 'jetpack-comments-settings';

	private const RENDER_FUNCTION    = 'jetpack_comments_jetpack_comments_settings_wp_admin_render_page';
	private const MODULES_FUNCTION   = 'jetpack_comments_register_script_modules';
	private const INTERCEPT_FUNCTION = 'jetpack_comments_jetpack_comments_settings_intercept_render';

	/**
	 * Modules the screen toggles besides Comments itself, none of which need the Comments module.
	 */
	const FEATURE_MODULES = array( 'gravatar-hovercards', 'markdown', 'comment-likes' );

	/**
	 * The real screen ID while it is aliased.
	 *
	 * @var string|null
	 */
	private static $original_screen_id = null;

	/**
	 * Hook the screen up. Safe to call more than once.
	 *
	 * @return void
	 */
	public static function init() {
		if ( has_action( 'admin_menu', array( __CLASS__, 'maybe_load' ) ) ) {
			return;
		}

		// Priority 1: the build must load before the menu registers.
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load' ), 1 );
		// Priority 999: Admin_Menu processes its queue at 1000.
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ), 999 );
		// Priority 20: past the module's own default.
		add_filter( 'jetpack_module_configuration_url_comments', array( __CLASS__, 'configuration_url' ), 20 );
	}

	/**
	 * Whether this site gets the screen: it runs Jetpack Comments, and is connected as the Comments module requires.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return Comments::is_enabled() && ( new Connection_Manager() )->is_connected();
	}

	/**
	 * Send the module's Configure links here.
	 *
	 * @param string $url Default configuration URL.
	 * @return string
	 */
	public static function configuration_url( $url ) {
		return self::is_available() ? admin_url( 'admin.php?page=' . self::SLUG ) : $url;
	}

	/**
	 * Add the screen to the Jetpack menu, shown whether or not the Comments module is on.
	 *
	 * @return void
	 */
	public static function add_menu() {
		if ( ! self::is_available() ) {
			return;
		}

		$title = __( 'Comments', 'jetpack-comments' );

		// Atomic builds its own Jetpack menu, which Admin_Menu does not manage.
		if ( ( new Host() )->is_woa_site() ) {
			add_submenu_page( 'jetpack', $title, $title, 'manage_options', self::SLUG, array( __CLASS__, 'render' ) );
			return;
		}

		Admin_Menu::add_menu( $title, $title, 'manage_options', self::SLUG, array( __CLASS__, 'render' ), null, array( 'key' => self::SLUG ) );
	}

	/**
	 * Render the app, or say why it is missing.
	 *
	 * @return void
	 */
	public static function render() {
		if ( function_exists( self::RENDER_FUNCTION ) ) {
			call_user_func( self::RENDER_FUNCTION );
			return;
		}

		printf(
			'<div class="wrap"><div class="notice notice-error"><p>%s</p></div></div>',
			esc_html__( 'The Comments settings could not be loaded. Rebuild the jetpack-comments package and reload the page.', 'jetpack-comments' )
		);
	}

	/**
	 * Load the wp-build app when this request is for the screen.
	 *
	 * @return void
	 */
	public static function maybe_load() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only decides which screen to render.
		$page = isset( $_GET['page'] ) && is_string( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';

		if ( ! is_admin() || self::SLUG !== $page || ! self::is_available() ) {
			return;
		}

		$build_index = dirname( __DIR__, 2 ) . '/build/build.php';
		if ( ! file_exists( $build_index ) ) {
			return;
		}

		$require = static function () use ( $build_index ) {
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
			'jetpack-comments',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_i18n_loader' ) );
		add_action( 'admin_head', array( __CLASS__, 'print_theme_assets' ) );
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ) );
	}

	/**
	 * Show wp-build's generated enqueue check the page ID it expects.
	 *
	 * @return void
	 */
	public static function alias_screen_id() {
		$screen = get_current_screen();
		if ( ! $screen ) {
			return;
		}

		self::$original_screen_id = $screen->id;
		$screen->id               = self::WP_BUILD_PAGE;
	}

	/**
	 * Put the real screen ID back for everything after the generated check.
	 *
	 * @return void
	 */
	public static function restore_screen_id() {
		$screen = get_current_screen();
		if ( ! $screen || null === self::$original_screen_id ) {
			return;
		}

		$screen->id               = self::$original_screen_id;
		self::$original_screen_id = null;
	}

	/**
	 * Jetpack's i18n loader is registered everywhere but only enqueued on demand; the init module needs it.
	 *
	 * @return void
	 */
	public static function enqueue_i18n_loader() {
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			wp_enqueue_script( 'wp-jp-i18n-loader' );
		}
	}

	/**
	 * Print the theme's fonts and preset variables for the preview.
	 *
	 * The preview's shadow root inherits custom properties from here, but browsers ignore an @font-face declared inside one.
	 *
	 * @return void
	 */
	public static function print_theme_assets() {
		if ( ! wp_theme_has_theme_json() ) {
			return;
		}

		if ( function_exists( 'wp_print_font_faces' ) ) {
			wp_print_font_faces();
		}

		printf( "<style id=\"jetpack-comments-preview-variables\">\n%s\n</style>\n", wp_strip_all_tags( wp_get_global_stylesheet( array( 'variables' ) ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CSS, stripped of tags.
	}

	/**
	 * Hand the first render the settings, plus what the preview needs to look like the site.
	 *
	 * @param array $data Script data.
	 * @return array
	 */
	public static function add_script_data( $data ) {
		$data = is_array( $data ) ? $data : array();

		if ( ! current_user_can( 'manage_options' ) ) {
			return $data;
		}

		$modules   = new Modules();
		$available = array_values( array_filter( self::FEATURE_MODULES, array( $modules, 'is_module' ) ) );
		$css       = dirname( __DIR__, 2 ) . '/build/comments.css';

		$data['jetpack_comments'] = array(
			'settings'   => array(
				'comments'                             => $modules->is_active( 'comments' ),
				'highlander_comment_form_prompt'       => (string) get_option( 'highlander_comment_form_prompt', '' ),
				'enable_blocks_comments'               => (bool) get_option( 'enable_blocks_comments', true ),
				'gravatar-hovercards'                  => $modules->is_active( 'gravatar-hovercards' ),
				'comment-likes'                        => $modules->is_active( 'comment-likes' ),
				'markdown'                             => $modules->is_active( 'markdown' ),
				'wpcom_publish_comments_with_markdown' => (bool) get_option( 'wpcom_publish_comments_with_markdown' ),
			),
			'modules'    => $available,
			'overrides'  => self::module_overrides(),
			'discussion' => array(
				'url'                 => admin_url( 'options-discussion.php' ),
				'requireNameEmail'    => (bool) get_option( 'require_name_email' ),
				'commentRegistration' => (bool) get_option( 'comment_registration' ),
				'showAvatars'         => (bool) get_option( 'show_avatars' ),
				'cookiesOptIn'        => (bool) get_option( 'show_comments_cookies_opt_in' ),
			),
			'newsletter' => array(
				'active'           => $modules->is_active( 'subscriptions' ),
				// The page's router reads its route, hash included, only from `p`.
				'url'              => admin_url( 'admin.php?page=jetpack-newsletter&p=' . rawurlencode( '/?tab=settings#subscriptions' ) ),
				// Simple stores an option's "off" as an empty string, Jetpack as 0.
				'subscribeBlog'    => ! in_array( get_option( 'stb_enabled', 1 ), array( '', '0', 0 ), true ),
				'subscribeReplies' => ! in_array( get_option( 'stc_enabled', 1 ), array( '', '0', 0 ), true ),
			),
			'preview'    => array(
				'styleUrl'      => file_exists( $css ) ? add_query_arg( 'ver', (string) filemtime( $css ), Assets::normalize_path( plugins_url( '../../build/comments.css', __FILE__ ) ) ) : '',
				'theme'         => self::theme_styles(),
				'defaultAvatar' => Avatars::default_url( 80 ),
			),
		);

		return $data;
	}

	/**
	 * Modules a filter forces on or off, whose toggles the screen locks as Jetpack's dashboard does.
	 *
	 * @return object Module slug => 'active' or 'inactive'. An object, so none encodes as `{}`.
	 */
	private static function module_overrides() {
		$overrides = array();

		// The Jetpack plugin owns overrides; another plugin's autoloader may serve this package without it.
		if ( class_exists( 'Jetpack_Modules_Overrides' ) ) {
			foreach ( array_merge( array( 'comments' ), self::FEATURE_MODULES ) as $module ) {
				$override = \Jetpack_Modules_Overrides::instance()->get_module_override( $module );
				if ( $override ) {
					$overrides[ $module ] = $override;
				}
			}
		}

		return (object) $overrides;
	}

	/**
	 * The theme's type, colors, and buttons, as custom properties for the preview.
	 *
	 * @return array|null Null for a theme without theme.json, whose global styles are only core's defaults.
	 */
	public static function theme_styles() {
		if ( ! wp_theme_has_theme_json() ) {
			return null;
		}

		$styles = wp_get_global_styles();
		$map    = array(
			'--jpc-font-family'           => array( 'typography', 'fontFamily' ),
			'--jpc-font-size'             => array( 'typography', 'fontSize' ),
			'--jpc-line-height'           => array( 'typography', 'lineHeight' ),
			'--jpc-color'                 => array( 'color', 'text' ),
			'--jpc-background'            => array( 'color', 'background' ),
			'--jpc-link'                  => array( 'elements', 'link', 'color', 'text' ),
			'--jpc-heading-font-family'   => array( array( 'elements', 'h3', 'typography', 'fontFamily' ), array( 'elements', 'heading', 'typography', 'fontFamily' ) ),
			'--jpc-heading-font-size'     => array( array( 'elements', 'h3', 'typography', 'fontSize' ), array( 'elements', 'heading', 'typography', 'fontSize' ) ),
			'--jpc-heading-font-weight'   => array( array( 'elements', 'h3', 'typography', 'fontWeight' ), array( 'elements', 'heading', 'typography', 'fontWeight' ) ),
			'--jpc-heading-line-height'   => array( array( 'elements', 'h3', 'typography', 'lineHeight' ), array( 'elements', 'heading', 'typography', 'lineHeight' ) ),
			'--jpc-heading-color'         => array( array( 'elements', 'h3', 'color', 'text' ), array( 'elements', 'heading', 'color', 'text' ) ),
			'--jpc-button-background'     => array( 'elements', 'button', 'color', 'background' ),
			'--jpc-button-color'          => array( 'elements', 'button', 'color', 'text' ),
			'--jpc-button-font-family'    => array( 'elements', 'button', 'typography', 'fontFamily' ),
			'--jpc-button-font-weight'    => array( 'elements', 'button', 'typography', 'fontWeight' ),
			'--jpc-button-text-transform' => array( 'elements', 'button', 'typography', 'textTransform' ),
			'--jpc-button-letter-spacing' => array( 'elements', 'button', 'typography', 'letterSpacing' ),
			'--jpc-button-radius'         => array( 'elements', 'button', 'border', 'radius' ),
			'--jpc-button-border-width'   => array( 'elements', 'button', 'border', 'width' ),
			'--jpc-button-border-style'   => array( 'elements', 'button', 'border', 'style' ),
			'--jpc-button-border-color'   => array( 'elements', 'button', 'border', 'color' ),
		);

		$tokens = array();
		foreach ( $map as $property => $paths ) {
			$paths = is_array( $paths[0] ) ? $paths : array( $paths );
			foreach ( $paths as $path ) {
				$value = self::style_value( $styles, $path );
				if ( '' !== $value ) {
					$tokens[ $property ] = $value;
					break;
				}
			}
		}

		return $tokens;
	}

	/**
	 * One global styles value as CSS, with theme.json's `var:preset|…` shorthand expanded as core expands it.
	 *
	 * @param array $styles Global styles.
	 * @param array $path   Keys to the value.
	 * @return string Empty when unset or not a plain value.
	 */
	private static function style_value( $styles, $path ) {
		$value = $styles;
		foreach ( $path as $key ) {
			if ( ! is_array( $value ) || ! isset( $value[ $key ] ) ) {
				return '';
			}
			$value = $value[ $key ];
		}

		if ( ! is_string( $value ) && ! is_numeric( $value ) ) {
			return '';
		}

		$value = trim( (string) $value );
		if ( str_starts_with( $value, 'var:' ) ) {
			$value = 'var(--wp--' . str_replace( '|', '--', substr( $value, 4 ) ) . ')';
		}

		// A value, never a way out of one.
		return preg_match( '/[;{}<>]/', $value ) ? '' : $value;
	}
}
