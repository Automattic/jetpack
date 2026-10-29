<?php
/**
 * The newsletter email design screen.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

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
	 * The feature flag gating the screen. Registered off, and on Atomic answered by the filter
	 * below rather than by `wp companion feature-flag enable jetpack-email-design`.
	 */
	const FEATURE_FLAG = 'jetpack-email-design';

	/**
	 * The WordPress.com blog sticker that turns the screen on. See NL-1040.
	 */
	const STICKER = 'email-design-editor';

	/**
	 * The script handle, and the id of the element the editor mounts into.
	 */
	const HANDLE = 'jetpack-email-design-editor';

	/**
	 * Flags for JSON handed to a `<script>` tag.
	 */
	const JSON_FLAGS = JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP;

	/**
	 * The event the screen's arrival is recorded under, which reaches Tracks as
	 * `jetpack_newsletter_email_design_view` -- `record_user_event()` adds the prefix itself.
	 */
	const VIEW_EVENT = 'newsletter_email_design_view';

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

		// Last, so that on Atomic the sticker cannot be overridden by a filter added later --
		// a flag that outlives the sticker is not a kill switch.
		add_filter( 'jetpack_feature_flag_enabled_' . self::FEATURE_FLAG, array( __CLASS__, 'filter_flag_for_atomic' ), PHP_INT_MAX );

		add_action( 'admin_menu', array( __CLASS__, 'add_admin_page' ) );

		// Priority 20, because `Newsletter\Settings::add_script_data()` replaces the whole
		// `newsletter` key at the default priority on the page this link appears on.
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ), 20 );
	}

	/**
	 * Tell the admin where this screen is, or that there is none.
	 *
	 * The bare URL: each surface that links here adds its own `return` arg, because each one is
	 * somewhere different to go back to. {@see self::exit_url()} reads and validates it.
	 *
	 * @param array $data The script data so far.
	 * @return array The script data, with `newsletter.emailDesignUrl` null when there is no screen.
	 */
	public static function add_script_data( $data ) {
		$url = self::get_url();

		$data['newsletter']['emailDesignUrl'] = '' === $url ? null : $url;

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
	 * Answer the flag from the Atomic sticker, or the a8c proxy, where there is one to read.
	 *
	 * The incoming value is dropped rather than widened: on Atomic the sticker is the whole
	 * switch, so removing it has to close the screen -- for everyone who is not on the proxy --
	 * even where the flag was forced on.
	 *
	 * The proxy clause is the a12 rollout (NL-41), and gates dogfooding rather than access:
	 * wpcom's `/wpcom/v2/email-editor-bootstrap` still decides whether the blog is in, so on a
	 * customer's site the screen errors rather than exposing or saving anything.
	 *
	 * Off Atomic wpcomsh's reader answers false for every sticker, because its
	 * `Atomic_Persistent_Data` is a blank stand-in there -- hence the platform check, or the
	 * flag would be pinned off on a site whose only way in is the flag. The reader is checked
	 * as well: a host can define `IS_ATOMIC` without loading wpcomsh, and calling it then is
	 * a fatal.
	 *
	 * @param bool $enabled Whether the flag is enabled so far.
	 * @return bool
	 */
	public static function filter_flag_for_atomic( $enabled ) {
		if ( ! defined( 'IS_ATOMIC' ) || ! IS_ATOMIC || ! function_exists( 'wpcomsh_is_site_sticker_active' ) ) {
			return (bool) $enabled;
		}

		// Read through `Constants` rather than `defined()`, as the rest of the monorepo's
		// `AT_PROXIED_REQUEST` call sites do, so this branch is reachable from tests at all.
		return (bool) wpcomsh_is_site_sticker_active( self::STICKER )
			|| Constants::is_true( 'AT_PROXIED_REQUEST' );
	}

	/**
	 * Whether the screen should exist on this site.
	 *
	 * On Atomic the `email-design-editor` sticker and the a8c proxy decide, through the filter
	 * above; on Simple wpcom's mu-plugin turns the flag on alongside the sticker. A self-hosted
	 * site cannot read its own blog's stickers, so the flag is the gate there -- the sticker
	 * still gates the bootstrap.
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

		// On `shutdown` rather than here: the Tracks pixel is a blocking request with a one-second
		// timeout, so recorded now it would sit in front of the screen's first paint.
		add_action( 'shutdown', array( __CLASS__, 'record_screen_view' ) );
	}

	/**
	 * Record the arrival, with the route that brought the creator here.
	 *
	 * Server-side so the three routes are counted the same way: entered from the Appearance menu
	 * there is no click to record, and recorded here it also counts a creator whose editor never
	 * loaded, which the bundle's own events cannot. See NL-1088.
	 */
	public static function record_screen_view() {
		// Jetpack's recorder refuses on Simple: it asks the terms of service and the user's
		// connection, and a Simple site has neither to answer with. WordPress.com records its own
		// events there instead, and does not prefix the name, so this passes the whole one.
		if ( ( new Host() )->is_wpcom_simple() ) {
			if ( function_exists( 'wpcom_record_tracks_event' ) ) {
				wpcom_record_tracks_event( 'jetpack_' . self::VIEW_EVENT, self::screen_view_properties() );
			}

			return;
		}

		$connection = new Connection_Manager( 'jetpack' );

		( new Tracking( 'jetpack', $connection ) )->record_user_event(
			self::VIEW_EVENT,
			self::screen_view_properties()
		);
	}

	/**
	 * What the arrival event carries.
	 *
	 * Separate from the call above because that one cannot be asserted: Tracks refuses to record
	 * for a test user, before the event is built, so these are the only part of the contract with
	 * whoever reads the funnel that a test can see.
	 *
	 * @return array
	 */
	private static function screen_view_properties() {
		return array(
			'source'    => self::read_source(),
			'site_type' => self::site_type(),
		);
	}

	/**
	 * Which surface sent the creator here.
	 *
	 * An explicit arg rather than a guess at the others: the previewer's link carries neither
	 * `post_id` nor `return` when the post is unsaved and has no id, which is indistinguishable
	 * from the Appearance menu. Allowlisted because the arg is as hand-editable as any other.
	 *
	 * @return string
	 */
	private static function read_source() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read as an attribution label only, and allowlisted below.
		$source = isset( $_GET['source'] ) ? sanitize_key( wp_unslash( $_GET['source'] ) ) : '';

		if ( '' === $source ) {
			return 'admin_menu';
		}

		return in_array( $source, array( 'newsletter_settings', 'preview_modal' ), true )
			? $source
			: 'unknown';
	}

	/**
	 * The platform, spelled the way `getSiteType()` spells it for the screen's other events.
	 *
	 * @return string
	 */
	private static function site_type() {
		$host = new Host();

		if ( $host->is_wpcom_simple() ) {
			return 'simple';
		}

		return $host->is_woa_site() ? 'woa' : 'jetpack';
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
		self::enqueue_tracks_transport();

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
			/* The screen is styles-only: the root block editing mode is `disabled`, so nothing is
			   insertable and core filters disabled blocks out of List View. Drop when blocks land. NL-1086. */
			#' . self::HANDLE . ' .editor-document-tools__inserter-toggle,
			#' . self::HANDLE . ' .editor-document-tools__document-overview-toggle {
				display: none;
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

			// The post the canvas should preview, where the previewer sent one. The design itself
			// stays site-wide. {@see self::preview_post_id()}
			'postId'         => self::preview_post_id(),

			// What the bundle needs to record its own events. {@see self::get_tracks_data()}
			'tracks'         => self::get_tracks_data(),
		);
	}

	/**
	 * Enqueue the Tracks sender, where this site may send at all.
	 *
	 * `Jetpack_Gutenberg` enqueues `jp-tracks` for the block editor and then dequeues it whenever
	 * `wp_should_load_block_editor_scripts_and_styles()` is false, which this screen is -- it is an
	 * Appearance page, so `is_block_editor()` answers no. Without this the queue the analytics
	 * package pushes onto is never drained and every event is silently lost.
	 *
	 * Simple already has it: `w.js` arrives with the masterbar there.
	 */
	private static function enqueue_tracks_transport() {
		if ( ! self::can_send_tracks() || ( new Host() )->is_wpcom_simple() ) {
			return;
		}

		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
	}

	/**
	 * Whether this site and this creator may be recorded.
	 *
	 * @return bool
	 */
	private static function can_send_tracks() {
		// The gate below asks about the terms of service and the user's connection, which are both
		// things a Simple site has none of, so it answers no there for a site that records
		// everything else it does. WordPress.com loads the sender and identifies the user itself.
		if ( ( new Host() )->is_wpcom_simple() ) {
			return true;
		}

		$tracking = new Tracking( 'jetpack', new Connection_Manager( 'jetpack' ) );

		return $tracking->should_enable_tracking( new Terms_Of_Service(), new Status() );
	}

	/**
	 * The identity the bundle records against, or the refusal.
	 *
	 * Narrowed to the two fields the analytics package takes, so the email address and locale that
	 * `get_connected_user_tracks_identity()` also returns stay out of the page's HTML. A site can
	 * be allowed to send with no connected user, which records anonymously, so `canSend` is asked
	 * separately rather than inferred from having an identity.
	 *
	 * @return array
	 */
	private static function get_tracks_data() {
		if ( ! self::can_send_tracks() ) {
			return array(
				'canSend'  => false,
				'userData' => null,
				'blogId'   => null,
			);
		}

		return array(
			'canSend'  => true,
			'userData' => self::tracks_identity(),
			'blogId'   => self::tracks_blog_id(),
		);
	}

	/**
	 * Who the bundle records against, or nobody.
	 *
	 * Narrowed to the two fields the analytics package takes, so the email address and locale that
	 * `get_connected_user_tracks_identity()` also returns stay out of the page's HTML.
	 *
	 * Nobody on Simple: WordPress.com has already identified the logged-in user to the sender it
	 * loaded, and ours would replace that with an identity derived from a connection Simple does
	 * not have. Elsewhere a site can still record with no connected user, anonymously, which is
	 * why `canSend` is asked separately from this.
	 *
	 * @return array|null
	 */
	private static function tracks_identity() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return null;
		}

		$identity = Jetpack_Tracks_Client::get_connected_user_tracks_identity();

		if ( ! $identity ) {
			return null;
		}

		return array(
			'userid'   => $identity['userid'],
			'username' => $identity['username'],
		);
	}

	/**
	 * The WordPress.com blog the events name.
	 *
	 * Read the way the connected user's identity reads it, so both name one blog -- except on
	 * Simple, where the blog is a WordPress.com blog already and the Jetpack option that names it
	 * everywhere else is not what identifies it.
	 *
	 * @return int
	 */
	private static function tracks_blog_id() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return get_current_blog_id();
		}

		return (int) Jetpack_Options::get_option( 'id', 0 );
	}

	/**
	 * The post the canvas should preview, or null to leave the default.
	 *
	 * The previewer's link carries the post the reader was looking at, so changing the design does
	 * not replace it with the sample post. See NL-1051.
	 *
	 * Capability-checked here as well as on WordPress.com, so a hand-edited URL cannot name a post
	 * this user may not read. `absint()` is as forgiving as `exit_url()`'s validation -- `12abc`
	 * arrives as 12 -- which only ever yields an id shape `edit_post` then has the final word on.
	 *
	 * @return int|null
	 */
	private static function preview_post_id() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read as a preview target only, and capability-checked below.
		$post_id = isset( $_GET['post_id'] ) ? absint( wp_unslash( $_GET['post_id'] ) ) : 0;

		if ( $post_id > 0 && current_user_can( 'edit_post', $post_id ) ) {
			return $post_id;
		}

		return null;
	}

	/**
	 * Where the editor's header buttons leave to.
	 *
	 * The `return` arg, where the surface that linked here sent one, so the editor goes back the
	 * way the reader came. Validated like core's Customizer validates its own
	 * (`wp-admin/customize.php`), and narrowed to wp-admin so the button cannot be aimed off it.
	 *
	 * Without a usable one -- Appearance, a bookmark, a reload, or the previewer's new tab, which
	 * sends none on purpose -- the dashboard, as the site editor does from the same menu
	 * (`__experimentalDashboardLink`).
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
