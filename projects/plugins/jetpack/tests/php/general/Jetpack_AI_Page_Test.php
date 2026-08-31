<?php
/**
 * Tests for the Jetpack AI admin page script data.
 *
 * The contract worth locking down: the pre-release a11n gate flag rides the
 * jetpackAiSettings inline script and follows
 * jetpack_is_internal_testing_environment(), so the Features view stays hidden
 * outside internal testing environments while the MCP-only page keeps working.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-ai-page.php';

/**
 * Class Jetpack_AI_Page_Test
 *
 * @covers \Jetpack_AI_Feature_Flags
 * @covers \Jetpack_AI_Page
 */
#[CoversClass( Jetpack_AI_Feature_Flags::class )]
#[CoversClass( Jetpack_AI_Page::class )]
class Jetpack_AI_Page_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the proxied-request marker and the scripts registry.
	 */
	public function tear_down() {
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		unset( $GLOBALS['wp_scripts'] );
		delete_transient( 'jetpack_ai_overview_plan_info' );
		Status_Cache::clear();
		remove_all_filters( 'agents_manager_should_load' );
		remove_all_filters( 'agents_manager_agent_id' );
		remove_all_filters( 'agents_manager_agent_providers' );
		remove_all_filters( 'jetpack_ai_sidebar_agents_manager_data' );
		remove_all_filters( 'jetpack_ai_admin_config' );
		remove_all_filters( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks' );
		remove_all_filters( 'jetpack_is_connection_ready' );
		remove_all_filters( 'jetpack_offline_mode' );
		remove_all_actions( 'admin_print_scripts-jetpack_page_jetpack-ai' );
		remove_all_actions( 'admin_print_styles-jetpack_page_jetpack-ai' );
		remove_all_actions( 'load-jetpack_page_jetpack-ai' );
		unset( $GLOBALS['wp_styles'] );
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Serve a fixed purchase list and site plan, so the plan-name lookup reads
	 * known data instead of contacting WordPress.com.
	 *
	 * @param array  $purchases Purchase objects the site owns.
	 * @param string $plan_slug Slug of the site's current plan, or '' for a free site.
	 */
	private function given_site( array $purchases, $plan_slug = '' ) {
		delete_transient( 'jetpack_ai_overview_plan_info' );

		add_filter(
			'pre_transient_my-jetpack-purchases',
			function () use ( $purchases ) {
				return $purchases;
			}
		);

		// Set the plan through the package's own API: Current_Plan::get() memoises
		// into a private static, so filtering the option read is not enough.
		\Automattic\Jetpack\Current_Plan::update_from_site_record(
			array(
				'plan' => array(
					'product_slug' => '' === $plan_slug ? 'jetpack_free' : $plan_slug,
					'features'     => array( 'active' => array( 'ai-assistant' ) ),
				),
			)
		);
	}

	/**
	 * Answer is_woa_site() without the Atomic constants.
	 *
	 * @param bool $is_woa Whether the site should look like WoA.
	 */
	private function given_woa( $is_woa ) {
		Status_Cache::set( 'is_woa_site', $is_woa );
	}

	/**
	 * A standalone Jetpack AI subscription.
	 *
	 * @return object
	 */
	private function jetpack_ai_purchase() {
		return (object) array(
			'product_slug'  => 'jetpack_ai_yearly',
			'product_name'  => 'Jetpack AI Assistant',
			'expiry_status' => 'active',
			'expiry_date'   => '2027-03-15T00:00:00+00:00',
		);
	}

	/**
	 * A Jetpack AI subscription with auto-renew switched off.
	 *
	 * @return object
	 */
	private function jetpack_ai_purchase_without_auto_renew() {
		$purchase                        = $this->jetpack_ai_purchase();
		$purchase->is_auto_renew_enabled = false;

		return $purchase;
	}

	/**
	 * Run page_admin_scripts() against a fresh scripts registry and decode the
	 * jetpackAiSettings payload it injects.
	 *
	 * @return array Decoded payload.
	 */
	private function get_injected_settings() {
		unset( $GLOBALS['wp_scripts'] );

		( new Jetpack_AI_Page() )->page_admin_scripts();

		$inline = implode( "\n", array_filter( (array) wp_scripts()->get_data( 'jetpack-ai-admin', 'before' ) ) );
		$this->assertSame( 1, preg_match( '/var jetpackAiSettings = (\{.*\});/', $inline, $matches ) );

		$settings = json_decode( $matches[1], true );
		$this->assertIsArray( $settings );

		return $settings;
	}

	/**
	 * Create a page whose menu registration has already returned its hook.
	 *
	 * @return Jetpack_AI_Page
	 */
	private function get_page_with_registered_hook() {
		return new class() extends Jetpack_AI_Page {
			/**
			 * Return the hook assigned to the Jetpack AI menu page.
			 *
			 * @return string
			 */
			public function get_page_hook() {
				return 'jetpack_page_jetpack-ai';
			}
		};
	}

	/**
	 * The standalone page registers through the shared Jetpack admin menu.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_page_hook_registers_jetpack_ai_menu() {
		$this->assertSame( 'jetpack_page_jetpack-ai', ( new Jetpack_AI_Page() )->get_page_hook() );
	}

	/**
	 * The standalone controller registers scripts, styles, and the page loader.
	 */
	public function test_add_actions_registers_standalone_page_hooks() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		add_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );

		$page = $this->get_page_with_registered_hook();
		$page->add_actions();

		$this->assertNotFalse( has_action( 'admin_print_scripts-jetpack_page_jetpack-ai', array( $page, 'page_admin_scripts' ) ) );
		$this->assertNotFalse( has_action( 'admin_print_styles-jetpack_page_jetpack-ai', array( $page, 'admin_styles' ) ) );
		$this->assertNotFalse( has_action( 'load-jetpack_page_jetpack-ai', array( $page, 'load_agents_manager' ) ) );
	}

	/**
	 * Simple sites keep the Hub's own layout without the standalone base stylesheet.
	 */
	public function test_add_actions_skips_standalone_styles_on_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		add_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );

		$page = $this->get_page_with_registered_hook();
		$page->add_actions();

		$this->assertNotFalse( has_action( 'admin_print_scripts-jetpack_page_jetpack-ai', array( $page, 'page_admin_scripts' ) ) );
		$this->assertFalse( has_action( 'admin_print_styles-jetpack_page_jetpack-ai', array( $page, 'admin_styles' ) ) );
	}

	/**
	 * A disconnected site does not expose the page outside offline mode.
	 */
	public function test_add_actions_skips_disconnected_site() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		add_filter( 'jetpack_is_connection_ready', '__return_false', PHP_INT_MAX );
		add_filter( 'jetpack_offline_mode', '__return_false' );

		$page = new Jetpack_AI_Page();
		$page->add_actions();

		$this->assertFalse( has_action( 'admin_print_scripts-jetpack_page_jetpack-ai', array( $page, 'page_admin_scripts' ) ) );
	}

	/**
	 * Offline mode does not expose the page to users without admin access.
	 */
	public function test_add_actions_skips_non_admin_in_offline_mode() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		add_filter( 'jetpack_offline_mode', '__return_true' );

		$page = new Jetpack_AI_Page();
		$page->add_actions();

		$this->assertFalse( has_action( 'admin_print_scripts-jetpack_page_jetpack-ai', array( $page, 'page_admin_scripts' ) ) );
	}

	/**
	 * A host that cannot register the menu does not attach page-specific hooks.
	 */
	public function test_add_actions_stops_when_menu_registration_fails() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		add_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );

		$page = new class() extends Jetpack_AI_Page {
			/**
			 * Simulate a host declining to register the menu.
			 *
			 * @return false
			 */
			public function get_page_hook() {
				return false;
			}
		};
		$page->add_actions();

		$this->assertFalse( has_action( 'admin_print_scripts-jetpack_page_jetpack-ai', array( $page, 'page_admin_scripts' ) ) );
	}

	/**
	 * The standalone stylesheet keeps the legacy Jetpack style metadata.
	 */
	public function test_admin_styles_enqueues_legacy_jetpack_stylesheet() {
		( new Jetpack_AI_Page() )->admin_styles();

		$style = wp_styles()->registered['jetpack-admin'];
		$min   = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

		$this->assertTrue( wp_style_is( 'jetpack-admin', 'enqueued' ) );
		$this->assertStringEndsWith( "css/jetpack-admin{$min}.css", $style->src );
		$this->assertSame( 'replace', $style->extra['rtl'] );
		$this->assertSame( $min, $style->extra['suffix'] );
	}

	/**
	 * Outside internal testing environments the Features view flag is off.
	 */
	public function test_features_view_flag_is_off_by_default() {
		$settings = $this->get_injected_settings();

		$this->assertArrayHasKey( 'showFeaturesView', $settings );
		$this->assertFalse( $settings['showFeaturesView'] );
		$this->assertArrayHasKey( 'featureFlags', $settings );
		$this->assertFalse( $settings['featureFlags'][ Jetpack_AI_Feature_Flags::SCHEDULED_TASKS ] );
	}

	/**
	 * A proxied a8c request marks an internal testing environment and turns
	 * the Features view flag on.
	 */
	public function test_features_view_flag_follows_internal_testing_environment() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$settings = $this->get_injected_settings();

		$this->assertTrue( $settings['showFeaturesView'] );
		$this->assertFalse( $settings['featureFlags'][ Jetpack_AI_Feature_Flags::SCHEDULED_TASKS ] );
	}

	/**
	 * Hosts can hide pre-release views even in an internal testing environment.
	 */
	public function test_features_view_flag_can_be_filtered_by_the_host() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		add_filter(
			'jetpack_ai_admin_config',
			function ( $config ) {
				$config['showGatedViews'] = false;

				return $config;
			}
		);

		$settings = $this->get_injected_settings();

		$this->assertFalse( $settings['showFeaturesView'] );
		$this->assertSame( '', $settings['planName'] );
	}

	/**
	 * Hosts can replace the MCP endpoint contract without copying the page.
	 */
	public function test_admin_settings_can_be_filtered_by_the_host() {
		add_filter(
			'jetpack_ai_admin_config',
			function ( $config ) {
				$config['mcpSettingsApi'] = array(
					'path'   => '/wpcom/v2/sites/123/mcp-abilities',
					'format' => 'wpcom',
				);

				return $config;
			}
		);

		$settings = $this->get_injected_settings();

		$this->assertSame(
			array(
				'path'   => '/wpcom/v2/sites/123/mcp-abilities',
				'format' => 'wpcom',
			),
			$settings['mcpSettingsApi']
		);
	}

	/**
	 * The Scheduled tasks experience is registered as a default-off feature flag.
	 */
	public function test_scheduled_tasks_feature_flag_is_registered() {
		Jetpack_AI_Feature_Flags::register();

		$this->assertSame(
			array(
				'default'     => false,
				'description' => 'Enable the Scheduled tasks tab and Agents Manager sidebar in AI Hub.',
				'owner'       => 'jetpack-ai',
				'name'        => 'ai-hub-scheduled-tasks',
			),
			\Automattic\Jetpack\Feature_Flags\Feature_Flags::get( Jetpack_AI_Feature_Flags::SCHEDULED_TASKS )
		);
	}

	/**
	 * WordPress.com can enable the Scheduled tasks experience through the feature flag filter.
	 */
	public function test_scheduled_tasks_view_can_be_enabled_by_feature_flag() {
		add_filter( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks', '__return_true' );

		( new Jetpack_AI_Page() )->page_admin_scripts();
		$settings = $this->get_injected_settings();

		$this->assertTrue( $settings['featureFlags'][ Jetpack_AI_Feature_Flags::SCHEDULED_TASKS ] );
	}

	/**
	 * The AI Hub page loads the Agents Manager shell with its admin page.
	 */
	public function test_add_page_actions_loads_agents_manager() {
		$page = new Jetpack_AI_Page();
		$page->add_page_actions( 'jetpack_page_jetpack-ai' );

		$this->assertNotFalse(
			has_action( 'load-jetpack_page_jetpack-ai', array( $page, 'load_agents_manager' ) )
		);
	}

	/**
	 * The Agents Manager shell stays dormant while Scheduled tasks are disabled.
	 */
	public function test_agents_manager_shell_is_disabled_by_default() {
		$page = new Jetpack_AI_Page();
		$page->load_agents_manager();

		$this->assertFalse( apply_filters( 'agents_manager_should_load', false ) );
		$this->assertSame( array(), apply_filters( 'agents_manager_agent_providers', array() ) );
		$this->assertSame( array(), apply_filters( 'jetpack_ai_sidebar_agents_manager_data', array() ) );
	}

	/**
	 * The AI Hub page requests the generic Agents Manager shell.
	 */
	public function test_agents_manager_shell_uses_wp_orchestrator() {
		add_filter( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks', '__return_true' );

		$page = new Jetpack_AI_Page();
		$page->load_agents_manager();

		$agents_manager = \Automattic\Jetpack\Agents_Manager\Agents_Manager::get_instance();

		$this->assertInstanceOf( \Automattic\Jetpack\Agents_Manager\Agents_Manager::class, $agents_manager );
		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( $agents_manager, 'enqueue_scripts' ) )
		);
		$this->assertTrue( apply_filters( 'agents_manager_should_load', false ) );
		$this->assertSame( 'wp-orchestrator', apply_filters( 'agents_manager_agent_id', null ) );
	}

	/**
	 * Auto-renew off must reach the client, so the date can read as an expiry.
	 */
	public function test_plan_auto_renew_is_false_when_the_purchase_does_not_renew() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_site( array( $this->jetpack_ai_purchase_without_auto_renew() ) );

		$settings = $this->get_injected_settings();

		$this->assertArrayHasKey( 'planAutoRenew', $settings );
		$this->assertFalse( $settings['planAutoRenew'] );
	}

	/**
	 * A purchase that says nothing about auto-renew is unknown, not off — the
	 * date must keep the renewal wording rather than claim an expiry.
	 */
	public function test_plan_auto_renew_defaults_true_when_the_purchase_omits_it() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_site( array( $this->jetpack_ai_purchase() ) );

		$settings = $this->get_injected_settings();

		$this->assertTrue( $settings['planAutoRenew'] );
	}

	/**
	 * The AI Hub Agents Manager includes the scheduled task starter prompts.
	 */
	public function test_agents_manager_uses_scheduled_task_empty_view() {
		add_filter( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks', '__return_true' );

		$user_id = self::factory()->user->create(
			array(
				'display_name' => 'Sanja',
			)
		);
		wp_set_current_user( $user_id );

		$page = new Jetpack_AI_Page();
		$page->load_agents_manager();

		$providers = apply_filters( 'agents_manager_agent_providers', array() );
		$this->assertContains(
			add_query_arg(
				'ver',
				JETPACK__VERSION,
				plugins_url( '_inc/jetpack-ai-scheduled-tasks-provider.js', JETPACK__PLUGIN_FILE )
			),
			$providers
		);

		$data = apply_filters( 'jetpack_ai_sidebar_agents_manager_data', array() );
		$this->assertSame( 'Howdy Sanja! Let’s schedule a task.', $data['emptyViewHeading'] );
		$this->assertSame( 'Got a different request? Ask away.', $data['emptyViewHelp'] );
		$this->assertSame(
			array(
				array(
					'id'         => 'create-daily-reminder',
					'label'      => 'Create a daily reminder',
					'prompt'     => 'Create a daily reminder',
					'autoSubmit' => true,
				),
				array(
					'id'         => 'draft-weekly-post',
					'label'      => 'Draft a weekly post',
					'prompt'     => 'Draft a weekly post',
					'autoSubmit' => true,
				),
				array(
					'id'         => 'schedule-monthly-report',
					'label'      => 'Schedule a monthly report',
					'prompt'     => 'Schedule a monthly report',
					'autoSubmit' => true,
				),
			),
			$data['scheduledTaskEmptyViewSuggestions']
		);
	}

	/**
	 * The Agents Manager JWT client receives the connection state it needs.
	 */
	public function test_connection_initial_state_is_injected() {
		unset( $GLOBALS['wp_scripts'] );
		add_filter( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks', '__return_true' );

		( new Jetpack_AI_Page() )->page_admin_scripts();

		$inline = implode( "\n", array_filter( (array) wp_scripts()->get_data( 'jetpack-ai-admin', 'before' ) ) );
		$this->assertStringContainsString( 'JP_CONNECTION_INITIAL_STATE', $inline );
	}

	/**
	 * The Agents Manager connection state stays dormant with Scheduled tasks.
	 */
	public function test_connection_initial_state_is_not_injected_by_default() {
		unset( $GLOBALS['wp_scripts'] );

		( new Jetpack_AI_Page() )->page_admin_scripts();

		$inline = implode( "\n", array_filter( (array) wp_scripts()->get_data( 'jetpack-ai-admin', 'before' ) ) );
		$this->assertStringNotContainsString( 'JP_CONNECTION_INITIAL_STATE', $inline );
	}

	/**
	 * The Tracks audience properties ride the same payload (AIINT-586): isTest
	 * is the environment flag, isA11n the identity flag. The test environment
	 * defines no is_automattician() and connects no user, so isA11n is false.
	 */
	public function test_tracks_audience_properties_default_to_false() {
		$settings = $this->get_injected_settings();

		$this->assertArrayHasKey( 'isA11n', $settings );
		$this->assertArrayHasKey( 'isTest', $settings );
		$this->assertFalse( $settings['isA11n'] );
		$this->assertFalse( $settings['isTest'] );
	}

	/**
	 * The usage endpoint proxies as the current user, so the page reports
	 * whether their own account is linked. The test environment links nobody.
	 */
	public function test_user_connection_flag_is_false_without_a_linked_account() {
		$settings = $this->get_injected_settings();

		$this->assertArrayHasKey( 'isUserConnected', $settings );
		$this->assertFalse( $settings['isUserConnected'] );
	}

	/**
	 * A proxied request is a test environment regardless of who made it, so
	 * isTest follows jetpack_is_internal_testing_environment().
	 */
	public function test_tracks_is_test_follows_internal_testing_environment() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$settings = $this->get_injected_settings();

		$this->assertTrue( $settings['isTest'] );
	}

	/**
	 * A WordPress.com site names its own plan, never the Jetpack purchase that
	 * happens to grant AI.
	 */
	public function test_wpcom_site_shows_its_own_plan() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_woa( true );
		$this->given_site(
			array(
				$this->jetpack_ai_purchase(),
				(object) array(
					'product_slug'  => 'business-bundle',
					'product_name'  => 'WordPress.com Business',
					'expiry_status' => 'active',
				),
			),
			'business-bundle'
		);

		$settings = $this->get_injected_settings();

		$this->assertSame( 'Business', $settings['planName'] );
	}

	/**
	 * With no Dotcom plan to name, the card shows nothing rather than falling
	 * back to the Jetpack name.
	 */
	public function test_wpcom_site_shows_nothing_when_its_plan_is_unknown() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_woa( true );
		$this->given_site( array( $this->jetpack_ai_purchase() ), 'business-bundle' );

		$settings = $this->get_injected_settings();

		$this->assertSame( '', $settings['planName'] );
	}

	/**
	 * Self-hosted sites keep the Jetpack purchase name, brand prefix trimmed.
	 */
	public function test_self_hosted_site_shows_the_jetpack_plan() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_woa( false );
		$this->given_site( array( $this->jetpack_ai_purchase() ) );

		$settings = $this->get_injected_settings();

		$this->assertSame( 'AI Assistant', $settings['planName'] );
	}

	/**
	 * The Plan cell's renewal date is the purchase's own expiry — the date My
	 * Jetpack shows — not the monthly AI usage-period rollover.
	 */
	public function test_plan_renewal_date_comes_from_the_purchase() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_woa( false );
		$this->given_site( array( $this->jetpack_ai_purchase() ) );

		$settings = $this->get_injected_settings();

		$this->assertSame( '2027-03-15T00:00:00+00:00', $settings['planRenewsOn'] );
	}

	/**
	 * An expired purchase names nothing, so a lapsed site cannot read as paid.
	 */
	public function test_expired_purchase_is_not_named() {
		$expired                = $this->jetpack_ai_purchase();
		$expired->expiry_status = 'expired';

		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_woa( false );
		$this->given_site( array( $expired ) );

		$settings = $this->get_injected_settings();

		$this->assertSame( '', $settings['planName'] );
	}

	/**
	 * The lookup is memoised for an hour, so the admin page does not repeat a
	 * purchase call that can reach out to WordPress.com on every render.
	 */
	public function test_a_cached_name_is_reused() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		set_transient(
			'jetpack_ai_overview_plan_info',
			array(
				'name'      => 'Cached',
				'renews_on' => '2027-03-15T00:00:00+00:00',
			),
			HOUR_IN_SECONDS
		);

		$settings = $this->get_injected_settings();

		$this->assertSame( 'Cached', $settings['planName'] );
		$this->assertSame( '2027-03-15T00:00:00+00:00', $settings['planRenewsOn'] );
	}

	/**
	 * The name is only looked up for the gated views, so an ungated page ships
	 * an empty value rather than paying for the purchase lookup.
	 */
	public function test_plan_name_is_absent_without_the_gate() {
		$this->given_woa( false );
		$this->given_site( array( $this->jetpack_ai_purchase() ) );

		$settings = $this->get_injected_settings();

		$this->assertSame( '', $settings['planName'] );
	}
}
