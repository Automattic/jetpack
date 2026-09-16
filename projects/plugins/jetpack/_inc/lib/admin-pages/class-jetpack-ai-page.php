<?php
/**
 * Jetpack AI admin page.
 *
 * Registers the "AI" submenu item under Jetpack and mounts the React-based
 * MCP settings interface.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Agents_Manager\Agents_Manager;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once dirname( __DIR__ ) . '/class-jetpack-ai-feature-flags.php';

/**
 * Builds the Jetpack AI admin page and its sidebar menu entry.
 */
class Jetpack_AI_Page {

	/**
	 * The wp-build route's page id.
	 *
	 * Deliberately not the `jetpack-ai` menu slug: the generated standalone page.php
	 * intercepts `admin_init` for its own id and exits, which would bypass wp-admin's
	 * chrome entirely. The generated wp-admin enqueue matches the screen ID against this.
	 *
	 * @var string
	 */
	const WP_BUILD_PAGE_ID = 'jetpack-ai-hub';

	/**
	 * The screen ID alias_screen_id_for_wp_build() replaced, until it is restored.
	 *
	 * @var string|null
	 */
	private static $wp_build_original_screen_id = null;

	/**
	 * Whether this request renders through wp-build.
	 *
	 * Checks the render function too: if the build output is missing, the request would
	 * otherwise get no bundle at all now that the legacy entry is gone.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function should_render_wp_build() {
		return function_exists( 'jetpack_plugin_jetpack_ai_hub_wp_admin_render_page' );
	}

	/**
	 * Whether the current request targets the AI Hub admin page.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	private static function is_ai_admin_request() {
		if ( ! is_admin() ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the page slug only.
		return isset( $_GET['page'] ) && 'jetpack-ai' === sanitize_text_field( wp_unslash( $_GET['page'] ) );
	}

	/**
	 * Load wp-build for the AI Hub page.
	 *
	 * Scoped to this page so WP_Build_Polyfills does not replace core scripts everywhere else.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_ai_admin_request() ) {
			return;
		}

		$build_index = JETPACK__PLUGIN_DIR . 'build/build.php';
		if ( ! file_exists( $build_index ) ) {
			return;
		}

		// Hooked on either side of the require, so the alias holds only for the generated
		// enqueue check it registers at the same priority.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
		require_once $build_index;
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'restore_screen_id_after_wp_build' ) );

		// wp-build hooks module registration to wp_default_scripts, which has already fired by
		// admin_menu — call it directly or the init module never reaches the import map.
		if ( function_exists( 'jetpack_plugin_register_script_modules' ) ) {
			jetpack_plugin_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Checked with function_exists(); defined in the generated build/modules.php, which Phan excludes.
		}

		if ( class_exists( WP_Build_Polyfills::class ) ) {
			// wp-rich-text is needed because the Scheduled tasks tab reaches @wordpress/dataviews
			// via @wordpress/ui, whose dataform controls unlock rich-text's privateApis at module
			// scope. WP 6.9 exports none, so without it the bundle throws and the page is blank.
			WP_Build_Polyfills::register(
				'jetpack',
				array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
			);
		}
	}

	/**
	 * Point the screen ID at the wp-build page while its generated enqueue check runs.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function alias_screen_id_for_wp_build() {
		$screen = get_current_screen();
		if ( ! $screen ) {
			return;
		}

		self::$wp_build_original_screen_id = $screen->id;
		$screen->id                        = self::WP_BUILD_PAGE_ID;
	}

	/**
	 * Undo alias_screen_id_for_wp_build(), since JITM builds its message path from the screen ID.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function restore_screen_id_after_wp_build() {
		$screen = get_current_screen();
		if ( ! $screen || null === self::$wp_build_original_screen_id ) {
			return;
		}

		$screen->id                        = self::$wp_build_original_screen_id;
		self::$wp_build_original_screen_id = null;
	}

	/**
	 * Register the page and its page-specific hooks.
	 *
	 * The AI Hub owns its full React layout, so it does not need the legacy
	 * Jetpack_Admin_Page lifecycle. Keeping this controller independent also
	 * lets WordPress.com Simple load the same page without replacing its
	 * request-wide Jetpack_Admin_Page compatibility stub.
	 */
	public function add_actions() {
		$is_offline_mode = ( new Status() )->is_offline_mode();

		if ( ! current_user_can( 'manage_options' ) && ( $is_offline_mode || ! Jetpack::is_connection_ready() ) ) {
			return;
		}

		if ( ! Jetpack::is_connection_ready() && ! $is_offline_mode ) {
			return;
		}

		$hook = $this->get_page_hook();
		if ( ! $hook ) {
			return;
		}

		add_action( 'admin_print_scripts-' . $hook, array( $this, 'page_admin_scripts' ) );

		// Preserve the standalone Jetpack page's existing base stylesheet. Simple
		// never loaded it for the Hub because it conflicts with wpcom admin pages.
		if ( ! ( new Host() )->is_wpcom_simple() ) {
			add_action( 'admin_print_styles-' . $hook, array( $this, 'admin_styles' ) );
		}

		$this->add_page_actions( $hook );
	}

	/**
	 * Register the "AI" submenu under the Jetpack top-level menu.
	 *
	 * @return string|false Hook returned by Admin_Menu::add_menu().
	 */
	public function get_page_hook() {
		return Admin_Menu::add_menu(
			// "Jetpack AI" is a product name and should not be translated.
			'Jetpack AI',
			'Jetpack AI',
			'manage_options',
			'jetpack-ai',
			array( $this, 'render' ),
			null,
			array(
				'product' => 'jetpack-ai',
				'key'     => 'jetpack-ai',
			)
		);
	}

	/**
	 * Attach page-specific actions.
	 *
	 * @param string $hook The page hook returned by get_page_hook().
	 */
	public function add_page_actions( $hook ) {
		add_action( 'load-' . $hook, array( $this, 'load_agents_manager' ) );
	}

	/**
	 * Enqueue the stylesheet historically supplied by Jetpack_Admin_Page.
	 */
	public function admin_styles() {
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

		wp_enqueue_style( 'jetpack-admin', plugins_url( "css/jetpack-admin{$min}.css", JETPACK__PLUGIN_FILE ), array( 'genericons', 'jetpack-connection' ), JETPACK__VERSION . '-20121016' );
		wp_style_add_data( 'jetpack-admin', 'rtl', 'replace' );
		wp_style_add_data( 'jetpack-admin', 'suffix', $min );
	}

	/**
	 * Request the existing Agents Manager shell for this page.
	 */
	public function load_agents_manager() {
		if ( ! self::is_scheduled_tasks_enabled() ) {
			return;
		}

		Agents_Manager::init();

		add_filter( 'agents_manager_should_load', '__return_true' );
		add_filter( 'agents_manager_agent_id', array( $this, 'get_agents_manager_agent_id' ) );
		add_filter( 'agents_manager_agent_providers', array( $this, 'add_scheduled_tasks_provider' ) );
		add_filter( 'jetpack_ai_sidebar_agents_manager_data', array( $this, 'add_scheduled_tasks_data' ) );
	}

	/**
	 * Use the generic WP Orchestrator agent in AI Hub.
	 *
	 * @return string Agent ID.
	 */
	public function get_agents_manager_agent_id() {
		return 'wp-orchestrator';
	}

	/**
	 * Add the AI Hub provider that supplies scheduled task starter prompts.
	 *
	 * @param array $providers Existing provider module URLs.
	 * @return array Updated provider module URLs.
	 */
	public function add_scheduled_tasks_provider( $providers ) {
		$providers[] = add_query_arg(
			'ver',
			JETPACK__VERSION,
			plugins_url( '_inc/jetpack-ai-scheduled-tasks-provider.js', JETPACK__PLUGIN_FILE )
		);

		return $providers;
	}

	/**
	 * Customize Agents Manager's empty view for the Scheduled tasks page.
	 *
	 * @param array $data Existing Agents Manager data.
	 * @return array Updated Agents Manager data.
	 */
	public function add_scheduled_tasks_data( $data ) {
		$current_user = wp_get_current_user();

		$data['emptyViewHeading'] = sprintf(
			/* translators: %s: Current user's display name. */
			__( 'Howdy %s! Let’s schedule a task.', 'jetpack' ),
			$current_user->display_name
		);
		$data['emptyViewHelp']                     = __( 'Got a different request? Ask away.', 'jetpack' );
		$data['scheduledTaskEmptyViewSuggestions'] = array(
			array(
				'id'         => 'create-daily-reminder',
				'label'      => __( 'Create a daily reminder', 'jetpack' ),
				'prompt'     => __( 'Create a daily reminder', 'jetpack' ),
				'autoSubmit' => true,
			),
			array(
				'id'         => 'draft-weekly-post',
				'label'      => __( 'Draft a weekly post', 'jetpack' ),
				'prompt'     => __( 'Draft a weekly post', 'jetpack' ),
				'autoSubmit' => true,
			),
			array(
				'id'         => 'schedule-monthly-report',
				'label'      => __( 'Schedule a monthly report', 'jetpack' ),
				'prompt'     => __( 'Schedule a monthly report', 'jetpack' ),
				'autoSubmit' => true,
			),
		);

		return $data;
	}

	/**
	 * Whether the Scheduled tasks tab and its Agents Manager sidebar are enabled.
	 *
	 * @since 16.2
	 *
	 * @return bool
	 */
	private static function is_scheduled_tasks_enabled() {
		return Feature_Flags::is_enabled( Jetpack_AI_Feature_Flags::SCHEDULED_TASKS );
	}

	/**
	 * Enqueue scripts and styles for the AI admin page.
	 */
	public function page_admin_scripts() {
		// wp-build owns the route bundle and its dependencies; this handle only carries the
		// inline settings below, so the plugin version is version enough to bust its cache.
		$script_version = JETPACK__VERSION;

		$blog_id     = Connection_Manager::get_site_id( true );
		$status      = new Status();
		$site_suffix = $status->get_site_suffix();
		// Use the plain hostname for the Atomic activity log URL — get_site_suffix() can
		// include '::' for subdirectory installs, which would break the URL. This matches
		// the approach used by jetpack-mu-wpcom for the sidebar Activity Log link.
		$site_host         = wp_parse_url( home_url(), PHP_URL_HOST );
		$activity_log_site = ( is_string( $site_host ) && '' !== $site_host ) ? $site_host : $site_suffix;
		// On Atomic link to WPCOM activity log; on self-hosted link to the local wp-admin page.
		$activity_log_url = ( new Host() )->is_woa_site()
			? 'https://wordpress.com/activity-log/' . $activity_log_site
			: admin_url( 'admin.php?page=jetpack-activity-log' );

		/*
		 * Link SEO settings to the dedicated Jetpack SEO page where it exists,
		 * falling back to the Traffic settings card. Checking the `rsm_jetpack_seo`
		 * filter is required in addition to the cohort check: is_seo_surface_visible()
		 * alone returns true on all of wpcom-platform even while the flag is off —
		 * it answers only the cohort half, and page registration requires both
		 * (see packages/seo Initializer::init()).
		 */
		$seo_settings_url          = admin_url( 'admin.php?page=jetpack#/traffic' );
		$is_internal_test          = jetpack_is_internal_testing_environment();
		$show_scheduled_tasks_view = self::is_scheduled_tasks_enabled();
		if (
			// The exact-symbol guard matters: the autoloader can select an older
			// jetpack-seo copy from another plugin that has the class but not
			// this method, and class_exists alone would then fatal here.
			method_exists( '\Automattic\Jetpack\SEO\Initializer', 'is_seo_surface_visible' )
			&& (bool) apply_filters( 'rsm_jetpack_seo', false )
			&& \Automattic\Jetpack\SEO\Initializer::is_seo_surface_visible()
		) {
			$seo_settings_url = admin_url( 'admin.php?page=jetpack-seo' );
		}

		// The route bundle is registered by wp-build; this handle exists only to carry the
		// inline settings below, which the app reads from `window.jetpackAiSettings`.
		wp_register_script( 'jetpack-ai-admin', false, array(), $script_version, true );
		wp_enqueue_script( 'jetpack-ai-admin' );

		// Registered on every admin page but only enqueued when depended on, and the esbuild
		// bundles don't pull it in — without it every string renders untranslated.
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			wp_enqueue_script( 'wp-jp-i18n-loader' );
		}

		// The Tracks sender (w.js); without it, queued events never leave the
		// browser. Consent-gated like the other surfaces that load it.
		$can_send_tracks = ( new Tracking( 'jetpack', new Connection_Manager() ) )->should_enable_tracking( new Terms_Of_Service(), $status );
		if ( $can_send_tracks ) {
			Tracking::register_tracks_functions_scripts( true );
		}

		if ( $show_scheduled_tasks_view ) {
			Connection_Initial_State::render_script( 'jetpack-ai-admin' );
		}

		$host = new Host();

		/**
		 * Filters the host-specific AI Hub configuration.
		 *
		 * @since 16.2
		 *
		 * @param array $config AI Hub host configuration.
		 */
		$config = apply_filters(
			'jetpack_ai_admin_config',
			array(
				// The Overview and Features views launch on non-VIP self-hosted sites first.
				// Keep this filterable so hosts can close them independently.
				'showGatedViews'    => ! $host->is_vip_site()
					&& ( ! $host->is_wpcom_platform() || ( $host->is_woa_site() && $is_internal_test ) ),
				'showA12sBadge'     => $host->is_woa_site() && $is_internal_test,
				'isUserConnected'   => ( new Connection_Manager() )->is_user_connected(),
				// My Jetpack is removed on VIP, so that route dead-ends there.
				'userConnectionUrl' => $host->is_vip_site()
					? 'admin.php?page=jetpack#/connect-user'
					: 'admin.php?page=my-jetpack#/connection',
				'mcpSettingsApi'    => array(
					'path'   => '/wpcom/v2/jetpack-ai/mcp-settings',
					'format' => 'jetpack',
				),
			)
		);

		$show_gated_views = ! empty( $config['showGatedViews'] );

		$plan_info = $show_gated_views ? self::get_ai_plan_info() : array( 'name' => '' );

		$settings = array(
			'blogId'            => $blog_id ? (int) $blog_id : 0,
			'activityLogUrl'    => $activity_log_url,
			'seoSettingsUrl'    => $seo_settings_url,
			'siteAdminUrl'      => admin_url(),
			'userConnectionUrl' => esc_url_raw( $config['userConnectionUrl'] ),
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'pluginUrl'         => plugins_url( '', JETPACK__PLUGIN_FILE ),
			// Images ship from the plugin directory, so the plugin version is what busts their cache.
			'assetsVersion'     => JETPACK__VERSION,
			// The redirect entry bakes in the jetpack_ai_yearly product and
			// a post-checkout return to this page, so both can be
			// retargeted without shipping a code change.
			'upgradeUrl'        => Redirect::get_url( 'jetpack-ai-hub-upgrade' ),
			// The purchase granting AI — the usage card only uses it to pick
			// the right loading-skeleton shape before the usage fetch lands.
			// Only looked up when a gated view can render the card.
			'planName'          => $plan_info['name'],
			'showFeaturesView'  => $show_gated_views,
			'showA12sBadge'     => ! empty( $config['showA12sBadge'] ),
			// The tab and its Agents Manager sidebar ship disabled by default.
			'featureFlags'      => array(
				Jetpack_AI_Feature_Flags::SCHEDULED_TASKS => $show_scheduled_tasks_view,
			),
			// The usage endpoint proxies as the current user, which needs
			// their own WordPress.com account linked — not just the site.
			'isUserConnected'   => ! empty( $config['isUserConnected'] ),
			// Tracks audience properties for the jetpack_mcp_* events, per the
			// Tracks standards for AI product events (AIINT-586). The client
			// sends them as the strings 'true'/'false' (AIINT-576).
			'isA11n'            => self::is_current_user_automattician(),
			'isTest'            => $is_internal_test,
			// Identity for Tracks; the lookup can call WordPress.com on a
			// cache miss, so it shares the sender's guard.
			'tracksUserData'    => $can_send_tracks ? self::get_tracks_user_data() : null,
			'mcpSettingsApi'    => $config['mcpSettingsApi'],
		);

		wp_add_inline_script(
			'jetpack-ai-admin',
			'var jetpackAiSettings = ' . wp_json_encode(
				$settings,
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);

		/*
		 * `@automattic/jetpack-analytics` reads `window.jpTracksContext.blog_id` at
		 * event-fire time and attaches it to every Tracks event fired from this page.
		 * Without it, JS-fired events from self-hosted sites carry no blog_id — the
		 * Tracks pixel cannot resolve the site — so the events cannot be joined to
		 * plan or site data. Mirrors Connection\Initial_State::render().
		 */
		wp_add_inline_script(
			'jetpack-ai-admin',
			sprintf(
				'window.jpTracksContext = window.jpTracksContext || {}; window.jpTracksContext.blog_id = %s;',
				absint( $blog_id )
			),
			'before'
		);
	}

	/**
	 * Connected-user identity for Tracks; null when no WordPress.com account is
	 * linked. Two keys only, so email and locale stay out of the page HTML.
	 *
	 * @return array{userid:int, username:string}|null
	 */
	private static function get_tracks_user_data() {
		$identity = \Jetpack_Tracks_Client::get_connected_user_tracks_identity();
		if ( ! is_array( $identity ) || ! isset( $identity['userid'] ) || ! isset( $identity['username'] ) ) {
			return null;
		}

		return array(
			'userid'   => (int) $identity['userid'],
			'username' => (string) $identity['username'],
		);
	}

	/**
	 * Whether the current user is an Automattician.
	 *
	 * Identity check for the Tracks `is_a11n` audience property — it answers
	 * "who is this", not "may they use the tool", so it deliberately does not
	 * consult the MCP allowlist: allowlisted external testers are not a11ns.
	 *
	 * On wpcom Simple/Atomic the platform's is_automattician() is authoritative.
	 * Self-hosted Jetpack has no platform check; there the Tracks identity of a
	 * connected user is their WordPress.com account, so the connected account's
	 * email domain is the identity signal.
	 *
	 * @return bool
	 */
	private static function is_current_user_automattician() {
		if ( function_exists( 'is_automattician' ) ) {
			return (bool) is_automattician( get_current_user_id() );
		}

		$user_data = ( new Connection_Manager() )->get_connected_user_data();
		$email     = is_array( $user_data ) && ! empty( $user_data['email'] )
			? strtolower( (string) $user_data['email'] )
			: '';

		return '' !== $email && '@automattic.com' === substr( $email, -15 );
	}

	/**
	 * Name of the purchase granting this site AI ("Jetpack Complete"), from
	 * My Jetpack's purchase data — its Plans section's source.
	 *
	 * @return array{name: string} An empty string when nothing paid grants AI
	 *                             or the data is unavailable.
	 */
	private static function get_ai_plan_info() {
		$empty = array( 'name' => '' );

		if ( ! class_exists( '\Automattic\Jetpack\My_Jetpack\Products\Jetpack_Ai' ) ) {
			return $empty;
		}

		// The purchase lookup can make remote requests; cache the outcome
		// (empty included) so the admin page pays that cost at most hourly.
		$cached = get_transient( 'jetpack_ai_overview_plan_info' );
		if ( is_array( $cached ) ) {
			return array_merge( $empty, $cached );
		}

		// A failed lookup is not "no purchase": skip the hour-long cache so the
		// next page load can try again instead of pinning a blank name.
		if ( is_wp_error( \Automattic\Jetpack\My_Jetpack\Wpcom_Products::get_site_current_purchases() ) ) {
			return $empty;
		}

		$purchase = \Automattic\Jetpack\My_Jetpack\Products\Jetpack_Ai::get_paid_plan_purchase_for_product();

		// A WordPress.com site names its own plan, never a Jetpack one.
		if ( self::is_jetpack_purchase( $purchase ) && ( new Host() )->is_woa_site() ) {
			$purchase = self::get_wpcom_plan_purchase();
		}

		$info = $empty;
		if ( $purchase && ! empty( $purchase->product_name ) && 'expired' !== ( $purchase->expiry_status ?? '' ) ) {
			// The design shows the bare plan name ("Complete", "Business"), so
			// trim the store names' brand prefixes; they are untranslated.
			$info['name'] = (string) preg_replace( '/^(Jetpack|WordPress\.com) /', '', (string) $purchase->product_name );
		}

		set_transient( 'jetpack_ai_overview_plan_info', $info, HOUR_IN_SECONDS );

		return $info;
	}

	/**
	 * Whether a purchase was bought from the Jetpack store.
	 *
	 * @param object|null $purchase Purchase from My Jetpack.
	 * @return bool
	 */
	private static function is_jetpack_purchase( $purchase ) {
		return (bool) $purchase && 0 === strpos( (string) ( $purchase->product_slug ?? '' ), 'jetpack_' );
	}

	/**
	 * The purchase behind the site's current WordPress.com plan.
	 *
	 * The plan record carries only a slug and a display name lives on purchases,
	 * so the slug is matched back to the purchase that created it.
	 *
	 * @return object|null Null when the plan or its purchase cannot be found.
	 */
	private static function get_wpcom_plan_purchase() {
		$current_plan = \Automattic\Jetpack\My_Jetpack\Wpcom_Products::get_site_current_plan();
		$plan_slug    = is_array( $current_plan ) && ! empty( $current_plan['product_slug'] )
			? (string) $current_plan['product_slug']
			: '';

		// An empty slug simply matches nothing below, so it needs no guard.
		foreach ( (array) \Automattic\Jetpack\My_Jetpack\Wpcom_Products::get_site_current_purchases() as $purchase ) {
			if ( $plan_slug === ( $purchase->product_slug ?? '' ) ) {
				return $purchase;
			}
		}

		return null;
	}

	/**
	 * Override the base render() to skip wrap_ui entirely.
	 *
	 * Wrap_ui renders the Jetpack masthead header and static footer, which
	 * duplicate the header/footer that AdminPage (React) already provides.
	 * Calling page_render() directly lets AdminPage own the full layout.
	 */
	public function render() {
		$this->page_render();
	}

	/**
	 * Render the page, or say why it could not be rendered.
	 *
	 * The generated wp-build page owns the markup the app mounts into.
	 */
	public function page_render() {
		if ( self::should_render_wp_build() ) {
			jetpack_plugin_jetpack_ai_hub_wp_admin_render_page(); // @phan-suppress-current-line PhanUndeclaredFunction -- should_render_wp_build() checks function_exists(); defined in the generated build/pages/, which Phan excludes.
			return;
		}

		// The build output is missing; say so rather than leaving a silent blank page.
		printf(
			'<div class="wrap"><h1>%s</h1><div class="notice notice-error"><p>%s</p></div></div>',
			esc_html__( 'Jetpack AI', 'jetpack' ),
			esc_html__( 'Jetpack AI could not be loaded because its assets are missing. Reinstalling or updating the plugin usually fixes this. If it keeps happening, contact your site administrator or host.', 'jetpack' )
		);
	}
}

/*
 * wp-build must load before add_actions() runs on any host, so hook it here: Jetpack_Admin and
 * mu-wpcom's WordPress.com Simple integration both require this file before `admin_menu`, and
 * add_action() dedupes.
 */
add_action( 'admin_menu', array( 'Jetpack_AI_Page', 'maybe_load_wp_build' ), 1 );
