<?php
/**
 * The newsletter email design screen.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

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
				/* Above #adminmenuwrap (9990) and below #wpadminbar (100000): the editor paints
				   notices and popovers against the viewport, so without this they land behind
				   the admin menu. */
				z-index: 9991;
				inset-block: var(--wp-admin--admin-bar--height, 32px) 0;
				inset-inline: 160px 0;
			}
			body.folded #' . self::HANDLE . ' { inset-inline-start: 36px; }
			@media screen and (max-width: 782px) {
				#' . self::HANDLE . ' { inset-inline-start: 0; }
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
	 * @todo `@wordpress/global-styles-engine` opts into private APIs under a name core only
	 *       allowlisted in WP 7.1, so the bundle throws on 7.0 — polyfill `wp-private-apis`
	 *       here the way `Jetpack_Scan::load_wp_build()` does, or gate the page on 7.1. NL-839 (j).
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
		return array(
			'elementId'      => self::HANDLE,
			'editorSettings' => self::get_iframe_asset_settings(),

			// The editor assigns these to `window.location.href` from its header buttons.
			// Both point at Appearance until the screen has a real entry point (NL-844).
			'urls'           => array(
				'back'     => admin_url( 'themes.php' ),
				'listings' => admin_url( 'themes.php' ),
			),
			'userEmail'      => wp_get_current_user()->user_email,
		);
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

		foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $block ) {
			if ( empty( $block->supports['email'] ) ) {
				continue;
			}

			foreach ( array_merge( $block->style_handles, $block->editor_style_handles ) as $handle ) {
				$handles[] = $handle . '-css';
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
		$assets = _wp_get_iframed_editor_assets();
		$kept   = array();

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
