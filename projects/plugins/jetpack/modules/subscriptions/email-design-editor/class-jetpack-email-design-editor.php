<?php
/**
 * The newsletter email design screen.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Newsletter\Urls as Newsletter_Urls;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers an Appearance page that mounts the WooCommerce email editor against the
 * newsletter template, so a creator sets their email design once for the whole site.
 *
 * The design itself lives on the WordPress.com shadow blog: the browser fetches it from
 * `/wpcom/v2/email-editor-bootstrap` and this page supplies only what describes *this*
 * installation. See NL-839.
 */
class Jetpack_Email_Design_Editor {

	/**
	 * The `page` query arg the screen answers to.
	 */
	const PAGE_SLUG = 'jetpack-email-design';

	/**
	 * The feature flag gating the screen. Registered off, forced on for testing with
	 * `wp companion feature-flag enable jetpack-email-design`.
	 */
	const FEATURE_FLAG = 'jetpack-email-design';

	/**
	 * The script handle, and the id of the element the editor mounts into.
	 */
	const HANDLE = 'jetpack-email-design-editor';

	/**
	 * Flags for JSON handed to a `<script>` tag.
	 */
	const JSON_FLAGS = JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP;

	/**
	 * The hook suffix `add_theme_page()` returned, or null when the page is not registered.
	 *
	 * @var string|null
	 */
	private static $hook_suffix = null;

	/**
	 * Wire the screen up.
	 */
	public static function init() {
		// Registered here rather than on `admin_menu` so the flag exists under WP-CLI, REST
		// and cron too — `wp companion feature-flag list` reads it from one of those.
		self::register_feature_flags();

		add_action( 'admin_menu', array( __CLASS__, 'add_admin_page' ) );

		// Priority 20, because `Newsletter\Settings::add_script_data()` replaces the whole
		// `newsletter` key at the default priority on the page this link appears on.
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ), 20 );
	}

	/**
	 * Tell the Newsletter settings page where this screen is, or that there is none.
	 *
	 * @param array $data The script data so far.
	 * @return array The script data, with `newsletter.emailDesignUrl` null when there is no screen.
	 */
	public static function add_script_data( $data ) {
		$url = self::get_url();

		// The `return` arg is what sends the editor's back button here rather than to the
		// dashboard; {@see self::exit_url()} is where it is read and validated. Encoded first
		// because `add_query_arg()` does not: the settings URL's own `&` would end the value.
		$data['newsletter']['emailDesignUrl'] = '' === $url
			? null
			: add_query_arg( 'return', rawurlencode( Newsletter_Urls::get_newsletter_settings_url() ), $url );

		return $data;
	}

	/**
	 * The screen's own URL, or an empty string when this request has no such screen.
	 *
	 * Read back from the registration, not built from the slug, so a link cannot outlive the page:
	 * `add_theme_page()` registers nothing without `edit_theme_options`, which `manage_options` --
	 * all the Newsletter settings page asks for -- does not imply.
	 *
	 * @return string
	 */
	public static function get_url() {
		return function_exists( 'menu_page_url' ) ? (string) menu_page_url( self::PAGE_SLUG, false ) : '';
	}

	/**
	 * Declare the screen's feature flag.
	 */
	public static function register_feature_flags() {
		Feature_Flags::register(
			self::FEATURE_FLAG,
			array(
				'default'     => false,
				'description' => 'Edit the newsletter email design in wp-admin, under Appearance.',
				'owner'       => 'jetpack-newsletter',
			)
		);
	}

	/**
	 * Whether the screen should exist on this site.
	 *
	 * The WordPress.com `email-design-editor` sticker gates the bootstrap endpoint, not this
	 * page: a Jetpack site cannot read stickers without an API call, so the screen carries
	 * its own gate.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return Feature_Flags::is_enabled( self::FEATURE_FLAG );
	}

	/**
	 * Add the screen under Appearance.
	 */
	public static function add_admin_page() {
		if ( ! self::is_enabled() ) {
			return;
		}

		self::$hook_suffix = add_theme_page(
			__( 'Email Design', 'jetpack' ),
			__( 'Email Design', 'jetpack' ),
			'edit_theme_options',
			self::PAGE_SLUG,
			array( __CLASS__, 'render' )
		);

		if ( self::$hook_suffix ) {
			add_action( 'load-' . self::$hook_suffix, array( __CLASS__, 'on_load' ) );
		}
	}

	/**
	 * Scope everything else to this one screen.
	 */
	public static function on_load() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_filter( 'admin_body_class', array( __CLASS__, 'add_fullscreen_body_class' ) );
	}

	/**
	 * Put the screen in fullscreen mode before the bundle has loaded.
	 *
	 * `wp-editor` hides the admin menu on this class, and the editor sets it from a React
	 * component — so it cannot apply until the bundle has loaded and the bootstrap has answered,
	 * and the page visibly reflows a few seconds in. Setting it here makes fullscreen the layout
	 * from first paint. The admin bar is untouched, which keeps a way out if the editor fails.
	 *
	 * @param string $classes Space-separated admin body classes.
	 * @return string
	 */
	public static function add_fullscreen_body_class( $classes ) {
		return trim( $classes . ' is-fullscreen-mode' );
	}

	/**
	 * Enqueue the editor bundle and the block-editor assets it expects to find.
	 */
	public static function enqueue_assets() {
		$asset_path = JETPACK__PLUGIN_DIR . '_inc/build/email-design-editor.asset.php';

		if ( ! file_exists( $asset_path ) ) {
			return;
		}

		$asset = include $asset_path;

		self::enqueue_block_editor_assets();

		// `@woocommerce/email-editor` opts into core's private APIs as `@wordpress/edit-site`,
		// resolved against the site's `wp-private-apis`. Re-check on a package bump. NL-839 (j).
		wp_enqueue_script(
			self::HANDLE,
			plugins_url( '_inc/build/email-design-editor.js', JETPACK__PLUGIN_FILE ),
			$asset['dependencies'],
			$asset['version'],
			true
		);
		wp_set_script_translations( self::HANDLE, 'jetpack' );

		// `wp-editor`, `wp-block-editor` and `wp-preferences` are what lay the editor's frame
		// out; without them every region stacks into one narrow column. Keep the list to
		// handles WordPress registers — an unregistered one drops this stylesheet silently,
		// which is `wp-interface`'s trap.
		wp_enqueue_style(
			self::HANDLE,
			plugins_url( '_inc/build/email-design-editor.css', JETPACK__PLUGIN_FILE ),
			array(
				'wp-components',
				'wp-block-editor',
				'wp-editor',
				'wp-edit-blocks',
				'wp-preferences',
				'wp-format-library',
			),
			$asset['version']
		);
		wp_style_add_data( self::HANDLE, 'rtl', 'replace' );
		wp_add_inline_style( self::HANDLE, self::get_layout_css() );

		wp_add_inline_script(
			self::HANDLE,
			'window.JetpackEmailDesignEditor = ' . wp_json_encode( self::get_screen_data(), self::JSON_FLAGS ) . ';',
			'before'
		);
	}

	/**
	 * Fill the screen with the editor.
	 *
	 * The editor's frame expects a viewport, not the flow of an admin page: inside the usual
	 * wp-admin content column it collapses to a fraction of the height and scrolls its own
	 * regions. Woo avoids this by running on `post.php`, which is already fullscreen.
	 *
	 * @return string
	 */
	private static function get_layout_css() {
		return '
			#wpcontent { padding-inline-start: 0; }
			#wpfooter { display: none; }
			#' . self::HANDLE . ' {
				position: fixed;
				/* Below #wpadminbar (99999) so the editor\'s own popovers and snackbars, which ask
				   for 100000, cannot cover it — this caps everything inside. The admin menu is
				   hidden on this screen, so there is nothing else left to clear. */
				z-index: 99990;
				inset-block: var(--wp-admin--admin-bar--height, 32px) 0;
				inset-inline: 0;
			}
			/* wp-edit-post pins this and the screen does not load it, so without this the
			   snackbar renders in flow beside the header instead of over the canvas. */
			#' . self::HANDLE . ' .components-editor-notices__snackbar {
				position: absolute;
				inset-block-end: 20px;
				inset-inline-start: 20px;
			}
		';
	}

	/**
	 * Reproduce what the package's `Assets_Manager` does on WooCommerce's own screen.
	 *
	 * None of this happens automatically on a custom admin page: without it the editor
	 * mounts against no block library, no block categories and no server-side block
	 * definitions. See NL-839 (a).
	 *
	 * @todo Firing `enqueue_block_editor_assets` wholesale is the leading suspect for the
	 *       second Styles button — it pulls in core's site-editing global styles UI. NL-839 (e).
	 */
	private static function enqueue_block_editor_assets() {
		// Named rather than built from a post: there is no post here, and `get_block_categories()`
		// hands whatever it gets to filters that type-hint the context.
		$context = new WP_Block_Editor_Context( array( 'name' => 'jetpack/email-design' ) );

		wp_enqueue_media();

		do_action( 'enqueue_block_assets' );
		do_action( 'enqueue_block_editor_assets' );

		wp_enqueue_style( 'wp-edit-blocks' );
		wp_enqueue_style( 'wp-format-library' );

		wp_add_inline_script(
			'wp-blocks',
			sprintf( 'wp.blocks.setCategories( %s );', wp_json_encode( get_block_categories( $context ), self::JSON_FLAGS ) ),
			'after'
		);
		wp_add_inline_script(
			'wp-blocks',
			sprintf(
				'wp.blocks.unstable__bootstrapServerSideBlockDefinitions( %s );',
				wp_json_encode( get_block_editor_server_block_settings(), self::JSON_FLAGS )
			),
			'after'
		);
	}

	/**
	 * What the page hands the bundle, as `window.JetpackEmailDesignEditor`.
	 *
	 * Every WordPress.com id — the template's, the global-styles record's — comes from the
	 * bootstrap response instead, because they are namespaced to the shadow blog's theme and
	 * a locally computed one is right on Simple and wrong everywhere else. See NL-839 (c).
	 *
	 * @return array
	 */
	private static function get_screen_data() {
		$exit_url = self::exit_url();

		return array(
			'elementId'      => self::HANDLE,
			'editorSettings' => self::get_iframe_asset_settings(),

			// The editor assigns these to `window.location.href` from its header buttons. Both
			// leave the editor, and there is one design rather than a list, so both go to the
			// same place.
			'urls'           => array(
				'back'     => $exit_url,
				'listings' => $exit_url,
			),
			'userEmail'      => wp_get_current_user()->user_email,
		);
	}

	/**
	 * Where the editor's header buttons leave to.
	 *
	 * The `return` arg the Newsletter settings link carries, so the editor goes back to whichever
	 * of its two entry points was used. Validated like core's Customizer validates its own
	 * (`wp-admin/customize.php`), and narrowed to wp-admin so the button cannot be aimed off it.
	 *
	 * Without a usable one -- entered from Appearance, a bookmark, a reload -- the dashboard, as
	 * the site editor does from the same menu (`__experimentalDashboardLink`).
	 *
	 * @return string
	 */
	private static function exit_url() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read as a navigation target only, and validated below.
		$return = isset( $_GET['return'] ) ? wp_validate_redirect( esc_url_raw( wp_unslash( $_GET['return'] ) ), '' ) : '';

		if ( '' !== $return && 0 === strpos( $return, admin_url() ) ) {
			return $return;
		}

		return admin_url( '/' );
	}

	/**
	 * The two editor settings that describe this installation rather than the design.
	 *
	 * WordPress.com strips both from the bootstrap bundle, because there they would name
	 * WordPress.com's own asset URLs and push them into the site's canvas.
	 *
	 * @return array
	 */
	private static function get_iframe_asset_settings() {
		// Absent before WP 6.3, and private, but it is what core's own block editors call to
		// resolve the assets an iframed canvas needs.
		if ( ! function_exists( '_wp_get_iframed_editor_assets' ) ) {
			return array();
		}

		$handles = self::get_allowed_iframe_style_handles();

		return array(
			'__unstableResolvedAssets'  => self::get_resolved_assets( $handles ),
			'allowedIframeStyleHandles' => $handles,
		);
	}

	/**
	 * The stylesheet handles the canvas is allowed to keep.
	 *
	 * Mirrors the package's `Settings_Controller::get_allowed_iframe_style_handles()`. An empty
	 * list is not a no-op: the client strips every stylesheet not named here, so omitting this
	 * leaves the canvas painted in the site's own styles rather than the email's.
	 *
	 * @return string[]
	 */
	private static function get_allowed_iframe_style_handles() {
		$handles = array(
			'wp-components-css',
			'wp-reset-editor-styles-css',
			'wp-block-library-css',
			'wp-block-editor-content-css',
			'wp-edit-blocks-css',
		);

		// Registration args reach the block type verbatim — `WP_Block_Type::set_props()` normalizes
		// only `attributes`, and `register_block_type_args` can rewrite the rest — so a block
		// declaring a bare string here would otherwise fatal the screen inside `array_merge()`.
		foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $block ) {
			if ( ! is_array( $block->supports ) || empty( $block->supports['email'] ) ) {
				continue;
			}

			foreach ( array_merge( (array) $block->style_handles, (array) $block->editor_style_handles ) as $handle ) {
				if ( is_string( $handle ) ) {
					$handles[] = $handle . '-css';
				}
			}
		}

		return $handles;
	}

	/**
	 * The iframe assets, trimmed to the allowed handles.
	 *
	 * @param string[] $allowed Handles to keep.
	 * @return array The `_wp_get_iframed_editor_assets()` shape, with `styles` filtered.
	 */
	private static function get_resolved_assets( array $allowed ) {
		// Core collects the canvas's assets by buffering `wp_print_footer_scripts()`, one of the two
		// actions `wp_auth_check_load()` puts its "Session expired" dialog on. Core's own editor is
		// built before `admin_enqueue_scripts` registers that; this screen is not. NL-957.
		$had_auth_check = remove_action( 'wp_print_footer_scripts', 'wp_auth_check_html', 5 );

		$assets = _wp_get_iframed_editor_assets();

		if ( $had_auth_check ) {
			add_action( 'wp_print_footer_scripts', 'wp_auth_check_html', 5 );
		}

		$kept = array();

		foreach ( explode( "\n", (string) $assets['styles'] ) as $asset ) {
			foreach ( $allowed as $handle ) {
				if ( str_contains( $asset, $handle ) ) {
					$kept[] = $asset;
					break;
				}
			}
		}

		$assets['styles'] = implode( "\n", $kept );

		return $assets;
	}

	/**
	 * Render the container the editor mounts into.
	 */
	public static function render() {
		printf( '<div id="%s" class="jetpack-email-design-editor"></div>', esc_attr( self::HANDLE ) );
	}
}

Jetpack_Email_Design_Editor::init();
