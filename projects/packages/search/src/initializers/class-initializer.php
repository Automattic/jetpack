<?php
/**
 * Initializer base class.
 *
 * @package    @automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use WP_Error;
/**
 * Base class for the initializer pattern.
 */
class Initializer {

	/**
	 * Whether a block-driven experience owns the search results this request
	 * — Embedded, or the experimental blocks Overlay. Set to `true` in
	 * `init_search_blocks()` only when the `jetpack_search_blocks_enabled`
	 * gate is on AND the saved experience is one of those (the Overlay arm
	 * additionally requires `jetpack_search_overlay_block_template_enabled`).
	 * In those experiences both Classic and Instant Search are suppressed, so
	 * `init_search()` returns falsy by design; `init()` reads this flag to
	 * treat that as a no-op rather than a real failure. Anchoring on the
	 * actually-wired-up state (not a filter read) prevents the abort carve-out
	 * from being bypassed on a site that doesn't have Search Blocks registered.
	 *
	 * @var bool
	 */
	private static $block_search_active = false;

	/**
	 * Initialize the search package.
	 *
	 * The method is called from the `Config` class.
	 */
	public static function init() {
		// Load compatibility files - at this point all plugins are already loaded.
		static::include_compatibility_files();

		// Set up package version hook.
		add_filter( 'jetpack_package_versions', __NAMESPACE__ . '\Package::send_version_to_tracker' );

		/**
		 * The filter allows abortion of the Jetpack Search package initialization.
		 *
		 * @since 0.11.2
		 *
		 * @param boolean $init_search_package Default value is true.
		 */
		if ( ! apply_filters( 'jetpack_search_init_search_package', true ) ) {
			/**
			 * Fires when the Jetpack Search fails and would fallback to MySQL.
			 *
			 * @since Jetpack 7.9.0
			 * @param string $reason Reason for Search fallback.
			 * @param mixed  $data   Data associated with the request, such as attempted search parameters.
			 */
			do_action( 'jetpack_search_abort', 'jetpack_search_init_search_package_filter', null );
			return;
		}

		static::init_before_connection();

		// Check whether Jetpack Search should be initialized in the first place .
		if ( ! static::is_connected() || ! static::is_search_supported() ) {
			/** This filter is documented in search/src/initalizers/class-initalizer.php */
			do_action( 'jetpack_search_abort', 'inactive', null );
			return;
		}

		// Register the Search 3.0 Interactivity API blocks. Connection +
		// plan are already guaranteed by the abort above; this call only
		// layers the Phase 1 feature flag on top, mirroring how
		// `init_search()` layers `is_instant_search_enabled` on top of
		// the same upstream gate.
		static::init_search_blocks();

		$blog_id = Helper::get_wpcom_site_id();
		if ( ! $blog_id ) {
			/** This filter is documented in search/src/initalizers/class-initalizer.php */
			do_action( 'jetpack_search_abort', 'no_blog_id', null );
			return;
		}

		if ( ! ( new Module_Control() )->is_active() ) {
			/** This filter is documented in search/src/initalizers/class-initalizer.php */
			do_action( 'jetpack_search_abort', 'module_inactive', null );
			return;
		}

		// Initialize search package. The block-driven experiences (Embedded /
		// blocks Overlay) intentionally skip both instant and classic init
		// (Search_Blocks owns the UI), so a falsy return there is by design —
		// not an abort. Anything else falsy is a real failure. Anchor on the
		// actually-wired-up flag (set in `init_search_blocks()` only when the
		// blocks gate passed) rather than a filter read, so flipping a filter
		// without the blocks gate can never bypass the abort.
		$initialized = static::init_search( $blog_id )
			|| self::$block_search_active;

		if ( ! $initialized ) {
			/** This filter is documented in search/src/initalizers/class-initalizer.php */
			do_action( 'jetpack_search_abort', 'jetpack_search_init_search', null );
			return;
		}

		/**
		 * Fires when the Jetpack Search package has been initialized.
		 *
		 * @since 0.11.2
		 */
		do_action( 'jetpack_search_loaded' );
	}

	/**
	 * Extra tweaks to make Jetpack Search play well with others.
	 */
	public static function include_compatibility_files() {
		if ( class_exists( 'Jetpack' ) ) {
			require_once Package::get_installed_path() . 'compatibility/jetpack.php';
		}
		require_once Package::get_installed_path() . 'compatibility/search-0.15.2.php';
		require_once Package::get_installed_path() . 'compatibility/search-0.17.0.php';
		require_once Package::get_installed_path() . 'compatibility/unsupported-browsers.php';
	}

	/**
	 * Init functionality required for connection.
	 */
	protected static function init_before_connection() {
		// Set up Search API endpoints.
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
		// The dashboard has to be initialized before connection.
		( new Dashboard() )->init_hooks();
		( new AI_Answers() )->init();
	}

	/**
	 * Register the Search 3.0 Interactivity API blocks on this request,
	 * gated by the Phase 1 feature flag.
	 *
	 * Called from `init()` after the upstream connection + Search-plan
	 * abort, so on entry the site is guaranteed to be connected and on a
	 * plan that supports Search (paid plans or the free
	 * `jetpack_search_free` product). The remaining gate is the
	 * feature-flag opt-in.
	 *
	 * Sits before the blog_id and module-active checks because admins
	 * should be able to configure Search blocks in the editor regardless
	 * of which runtime experience is enabled — matching how Instant
	 * Search layers its own opt-in on top of the same connection + plan
	 * gate further down in `init_search()`.
	 */
	protected static function init_search_blocks() {
		/**
		 * Filter whether the Jetpack Search 3.0 Interactivity API blocks are enabled.
		 *
		 * Necessary but not sufficient on its own — registration also
		 * requires the site to be connected and on a plan that supports
		 * Search (paid plans or the free `jetpack_search_free` product).
		 *
		 * @param bool $enabled Default true.
		 */
		if ( ! apply_filters( 'jetpack_search_blocks_enabled', true ) ) {
			return;
		}

		Search_Blocks::init();

		// When the Search blocks own the front-end results (Embedded / blocks
		// Overlay), Classic Search would otherwise run a server-side
		// Elasticsearch query plus a WP_Query to hydrate the posts on every
		// search request — work the blocks immediately discard. Suppress it so
		// it never runs, the same way Instant Search replaces Classic;
		// `Search_Blocks::filter__posts_pre_query` then short-circuits the
		// remaining core database search. With both handlers gone `init_search()`
		// returns false by design, so this flag tells `init()` not to treat that
		// as an abort.
		//
		// Front-end only, matching the `posts_pre_query` registration guard:
		// leaving Classic Search to initialize normally in wp-admin keeps the
		// change scoped to the search page and avoids dropping admin-side hooks.
		if ( ! is_admin() && Search_Blocks::owns_search_results() ) {
			add_filter( 'jetpack_search_classic_search_enabled', '__return_false' );
			self::$block_search_active = true;
		}

		// Experimental block-template overlay (available by default, opt-in
		// via the Experience Selector; see
		// `Search_Blocks::is_block_template_overlay_enabled()`): bypass the
		// preact `SearchApp` so it doesn't race the block overlay for
		// `?s=`, popstate, and theme search-trigger selectors. Suppressing
		// at the init filter is cleaner than dequeuing post-enqueue. Gated on
		// the overlay path specifically — Embedded never enables Instant Search,
		// so there is nothing to suppress there.
		if ( Search_Blocks::is_block_template_overlay_enabled() ) {
			add_filter( 'jetpack_search_init_instant_search', '__return_false' );
		}
	}

	/**
	 * Init the search package.
	 *
	 * @param int $blog_id WPCOM blog ID.
	 */
	protected static function init_search( $blog_id ) {
		// We could provide CLI to enable search/instant search, so init them regardless of whether the module is active or not.
		static::init_cli();

		$success                   = false;
		$is_instant_search_enabled = ( new Module_Control() )->is_instant_search_enabled();
		if ( $is_instant_search_enabled ) {
			// Enable Instant search experience.
			$success = static::init_instant_search( $blog_id );
		}
		/**
		 * Filter whether classic search should be enabled. By this stage, search module would be enabled already.
		 *
		 * @since 0.39.6
		 * @param boolean initial value whether classic search is enabled.
		 * @param boolean filtered result whether classic search is enabled.
		 */
		if ( apply_filters( 'jetpack_search_classic_search_enabled', ! $is_instant_search_enabled ) ) {
			// Enable the classic search experience.
			$success = static::init_classic_search( $blog_id );
		}

		if ( $success ) {
			// registers Jetpack Search widget.
			add_action( 'widgets_init', array( static::class, 'jetpack_search_widget_init' ) );
		}

		return $success;
	}

	/**
	 * Init Instant Search and its dependencies.
	 *
	 * @param int $blog_id WPCOM blog ID.
	 */
	protected static function init_instant_search( $blog_id ) {
		/**
		 * The filter allows abortion of the Instant Search initialization.
		 *
		 * @since 0.11.2
		 *
		 * @param boolean $init_instant_search Default value is true.
		 */
		if ( ! apply_filters( 'jetpack_search_init_instant_search', true ) ) {
			return;
		}

		// Enable the instant search experience.
		Instant_Search::initialize( $blog_id );
		// Register instant search configurables as WordPress settings.
		new Settings();
		// Instantiate "Customberg", the live search configuration interface.
		Customberg::instance();
		// Enable configuring instant search within the Customizer iff it's not using a block theme.
		if ( ! wp_is_block_theme() ) {
			new Customizer();
		}
		return true;
	}

	/**
	 * Init Classic Search.
	 *
	 * @param int $blog_id WPCOM blog ID.
	 */
	protected static function init_classic_search( $blog_id ) {
		/**
		 * The filter allows abortion of the Classic Search initialization.
		 *
		 * @since 0.11.2
		 *
		 * @param boolean $init_instant_search Default value is true.
		 */
		if ( ! apply_filters( 'jetpack_search_init_classic_search', true ) ) {
			return;
		}
		Inline_Search::get_instance_maybe_fallback_to_classic( $blog_id );

		return true;
	}

	/**
	 * Register jetpack-search CLI if `\CLI` exists.
	 *
	 * @return void
	 */
	protected static function init_cli() {
		if ( defined( 'WP_CLI' ) && \WP_CLI ) {
			\WP_CLI::add_command( 'jetpack-search', __NAMESPACE__ . '\CLI' );
		}
	}

	/**
	 * Register the widget if Jetpack Search is available and enabled.
	 */
	public static function jetpack_search_widget_init() {
		register_widget( 'Automattic\Jetpack\Search\Search_Widget' );
	}

	/**
	 * Check if site has been connected.
	 */
	protected static function is_connected() {
		return ( new Connection_Manager( Package::SLUG ) )->is_connected();
	}

	/**
	 * Check if search is supported by current plan.
	 */
	protected static function is_search_supported() {
		return ( new Plan() )->supports_search();
	}

	/**
	 * Perform necessary initialization steps for classic and instant search in the constructor.
	 *
	 * @deprecated
	 */
	public static function initialize() {
		return new WP_Error(
			'invalid-method',
			/* translators: %s: Method name. */
			sprintf( __( "Method '%s' not implemented. Must be overridden in subclass.", 'jetpack-search-pkg' ), __METHOD__ ),
			array( 'status' => 405 )
		);
	}
}
