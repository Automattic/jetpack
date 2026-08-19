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
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/class.jetpack-admin-page.php';

/**
 * Builds the Jetpack AI admin page and its sidebar menu entry.
 */
class Jetpack_AI_Page extends Jetpack_Admin_Page {

	/**
	 * Hide the "AI" sidebar entry when Jetpack is not yet connected.
	 * Other Jetpack products follow the same convention.
	 *
	 * @var bool
	 */
	protected $dont_show_if_not_active = true;

	/**
	 * Register the "AI" submenu under the Jetpack top-level menu.
	 *
	 * @return string|false Hook returned by Admin_Menu::add_menu().
	 */
	public function get_page_hook() {
		return Admin_Menu::add_menu(
			// "Jetpack AI" is a product name and should not be translated.
			'Jetpack AI',
			'AI',
			'manage_options',
			'jetpack-ai',
			array( $this, 'render' ),
			4
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
	 * Request the existing Agents Manager shell for this page.
	 */
	public function load_agents_manager() {
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
		$data['emptyViewHelp'] = __( 'Got a different request? Ask away.', 'jetpack' );
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
	 * No additional styles needed: AdminPage from @automattic/jetpack-components
	 * owns the full layout and does not need the wrap_ui admin.css / style.min.css
	 * bundle (which zeroes out #wpcontent padding and conflicts with AdminPage's
	 * margin-left compensation).
	 */
	public function additional_styles() {}

	/**
	 * Enqueue scripts and styles for the AI admin page.
	 */
	public function page_admin_scripts() {
		$script_path    = JETPACK__PLUGIN_DIR . '_inc/build/jetpack-ai-admin.asset.php';
		$script_deps    = array( 'wp-element', 'wp-components', 'wp-i18n', 'wp-polyfill' );
		$script_version = JETPACK__VERSION;

		if ( file_exists( $script_path ) ) {
			$asset_manifest = include $script_path;
			$script_deps    = $asset_manifest['dependencies'];
			$script_version = $asset_manifest['version'];
		}

		$blog_id     = Connection_Manager::get_site_id( true );
		$site_suffix = ( new Status() )->get_site_suffix();
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
		$seo_settings_url = admin_url( 'admin.php?page=jetpack#/traffic' );
		$is_internal_test = jetpack_is_internal_testing_environment();
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

		wp_enqueue_script(
			'jetpack-ai-admin',
			plugins_url( '_inc/build/jetpack-ai-admin.js', JETPACK__PLUGIN_FILE ),
			$script_deps,
			$script_version,
			true
		);

		wp_set_script_translations( 'jetpack-ai-admin', 'jetpack' );
		Connection_Initial_State::render_script( 'jetpack-ai-admin' );

		// Pre-release gate for the Overview and Features views. Everything the
		// gated views need hangs off this one flag, so opening them up to
		// everyone is a single change here.
		$show_gated_views = jetpack_is_internal_testing_environment();

		$plan_info = $show_gated_views ? self::get_ai_plan_info() : array(
			'name'       => '',
			'renews_on'  => '',
			'auto_renew' => true,
		);

		wp_add_inline_script(
			'jetpack-ai-admin',
			'var jetpackAiSettings = ' . wp_json_encode(
				array(
					'blogId'                 => $blog_id ? (int) $blog_id : 0,
					'activityLogUrl'         => $activity_log_url,
					'seoSettingsUrl'         => $seo_settings_url,
					'siteAdminUrl'           => admin_url(),
					'apiRoot'                => esc_url_raw( rest_url() ),
					'apiNonce'               => wp_create_nonce( 'wp_rest' ),
					'pluginUrl'              => plugins_url( '', JETPACK__PLUGIN_FILE ),
					// Route through the Jetpack redirect service so the upgrade
					// destination for the MCP upsell can be retargeted without
					// shipping a code change.
					'upgradeUrl'       => Redirect::get_url( 'jetpack-ai-upgrade-url-for-jetpack-sites', array( 'path' => 'jetpack_ai_yearly' ) ),
					// The purchase granting AI, for the Overview usage card — the
					// usage endpoint cannot name it. Only looked up when a gated
					// view can render it.
					'planName'         => $plan_info['name'],
					// The plan's own renewal date, matching My Jetpack — the
					// usage-period rollover is a different, monthly date.
					'planRenewsOn'     => $plan_info['renews_on'],
					// The same date reads "Renews on" or "Expires on" depending on
					// auto-renew, matching My Jetpack and the wpcom subscriptions page.
					'planAutoRenew'    => $plan_info['auto_renew'],
					'showFeaturesView' => $show_gated_views,
					// Pre-release gate for the Scheduled tasks tab.
					'showScheduledTasksView' => $show_gated_views,
					// The walkthrough videos link to WordPress.com courses, so the
					// Overview only shows them on WordPress.com-hosted sites (i4 thread).
					'isWpcomHosted'    => ( new Host() )->is_woa_site(),
					// The usage endpoint proxies as the current user, which needs
					// their own WordPress.com account linked — not just the site.
					'isUserConnected'  => ( new Connection_Manager() )->is_user_connected(),
					// Tracks audience properties for the jetpack_mcp_* events, per the
					// Tracks standards for AI product events (AIINT-586). The client
					// sends them as the strings 'true'/'false' (AIINT-576).
					'isA11n'                 => self::is_current_user_automattician(),
					'isTest'                 => $is_internal_test,
				),
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

		wp_enqueue_style(
			'jetpack-ai-admin',
			plugins_url( '_inc/build/jetpack-ai-admin.css', JETPACK__PLUGIN_FILE ),
			array( 'wp-components' ),
			$script_version
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
	 * Name and renewal date of the purchase granting this site AI ("Jetpack
	 * Complete"), from My Jetpack's purchase data — its Plans section's source.
	 *
	 * The renewal is the purchase's expiry date, matching what My Jetpack
	 * shows — not the AI usage-period rollover, which is a different date.
	 *
	 * @return array{name: string, renews_on: string} Empty strings when nothing
	 *                                                paid grants AI or the data
	 *                                                is unavailable.
	 */
	private static function get_ai_plan_info() {
		$empty = array(
			'name'       => '',
			'renews_on'  => '',
			'auto_renew' => true,
		);

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
		// next page load can try again instead of pinning a blank plan cell.
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
			$info['name']      = (string) preg_replace( '/^(Jetpack|WordPress\.com) /', '', (string) $purchase->product_name );
			$info['renews_on'] = (string) ( $purchase->expiry_date ?? '' );
			// Absent means unknown, not off: only a purchase that positively
			// reports auto-renew off should relabel the date as an expiry.
			$info['auto_renew'] = ! isset( $purchase->is_auto_renew_enabled )
				|| (bool) $purchase->is_auto_renew_enabled;
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
	 * Render the page container. The React app mounts into this div.
	 *
	 * AdminPage from @automattic/jetpack-components handles the full-page layout.
	 */
	public function page_render() {
		?>
		<div id="jetpack-ai-root"></div>
		<?php
	}
}
