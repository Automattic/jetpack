<?php
/**
 * Jetpack AI Sidebar tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Extensions\AiAssistantPlugin;
use Automattic\Jetpack\Extensions\AiAssistantPlugin\Jetpack_AI_Sidebar;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/ai-assistant-plugin/ai-sidebar/class-jetpack-ai-sidebar.php';

/**
 * Tests for the Jetpack AI Sidebar class.
 */
class Jetpack_AI_Sidebar_Test extends WP_UnitTestCase {
	use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Saved wp_scripts global.
	 *
	 * @var mixed
	 */
	private $saved_wp_scripts;

	/**
	 * Saved wp_styles global.
	 *
	 * @var mixed
	 */
	private $saved_wp_styles;

	/**
	 * Saved current screen.
	 *
	 * @var mixed
	 */
	private $saved_screen;

	/**
	 * Saved current user ID.
	 *
	 * @var int
	 */
	private $saved_current_user_id;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		$this->reset_sidebar_hooks();
		add_filter( 'jetpack_offline_mode', '__return_false' );
		update_option( 'jetpack_offline_mode', '0' );
		Status_Cache::clear();
		delete_transient( AiAssistantPlugin\AI_SIDEBAR_ASSET_TRANSIENT );
		$this->saved_wp_scripts      = $GLOBALS['wp_scripts'] ?? null;
		$this->saved_wp_styles       = $GLOBALS['wp_styles'] ?? null;
		$GLOBALS['wp_scripts']       = new WP_Scripts();
		$GLOBALS['wp_styles']        = new WP_Styles();
		$this->saved_screen          = $GLOBALS['current_screen'] ?? null;
		$this->saved_current_user_id = get_current_user_id();
		$this->simulate_connected_owner();
		// Default to a WoA platform with the AI Assistant setting off. Tests that
		// need the setting on opt in explicitly with enable_ai_assistant_setting().
		$this->simulate_wpcom_platform();
		update_option( 'big_sky_enable', '0' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_transient( AiAssistantPlugin\AI_SIDEBAR_ASSET_TRANSIENT );
		$this->reset_sidebar_hooks();
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_ai_enabled' );
		remove_all_filters( 'jetpack_offline_mode' );
		Status_Cache::clear();
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		delete_option( 'jetpack_offline_mode' );
		delete_option( 'big_sky_enable' );
		$this->reset_platform_constants();
		wp_set_current_user( $this->saved_current_user_id );
		$GLOBALS['current_screen'] = $this->saved_screen;
		$GLOBALS['wp_scripts']     = $this->saved_wp_scripts;
		$GLOBALS['wp_styles']      = $this->saved_wp_styles;
		parent::tear_down();
	}

	/**
	 * Reset sidebar hooks that may be registered by plugin bootstrap or earlier tests.
	 */
	private function reset_sidebar_hooks() {
		remove_all_filters( 'jetpack_ai_sidebar_enabled' );
		remove_all_filters( 'agents_manager_agent_providers' );
		remove_all_filters( 'agents_manager_enabled_in_block_editor' );
		remove_all_filters( 'jetpack_ai_editorial_review_enabled' );
		remove_all_filters( 'jetpack_ai_sidebar_preview_features' );
		remove_all_filters( 'jetpack_ai_sidebar_agents_manager_data' );
		remove_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_abilities_script' ), 201 );
		remove_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_patch_jetpack_ai_sidebar_preview_data' ), 250 );
	}

	/**
	 * Simulate a connected Jetpack owner.
	 */
	private function simulate_connected_owner() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
	}

	/**
	 * Simulate a WordPress.com platform site (WoA) so Host::is_wpcom_platform() is true
	 * while is_wpcom_simple() stays false — keeping has_ai_features() on the
	 * connected-owner / jetpack_ai_enabled path the other tests rely on. Every platform
	 * constant is overridden so the result is the same regardless of the test
	 * environment's real constants (e.g. JETPACK_TEST_WPCOMSH).
	 */
	private function simulate_wpcom_platform() {
		Constants::set_constant( 'IS_WPCOM', false );
		Constants::set_constant( 'ATOMIC_SITE_ID', 123456789 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', '2' );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/wpcomsh/wpcomsh.php' );
		Status_Cache::clear();
	}

	/**
	 * Simulate a WordPress.com Simple site so Host::is_wpcom_simple() is true, with every
	 * other platform constant overridden off.
	 */
	private function simulate_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		Constants::set_constant( 'ATOMIC_SITE_ID', false );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', false );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', false );
		Status_Cache::clear();
	}

	/**
	 * Simulate a self-hosted Jetpack site by overriding every WordPress.com platform
	 * constant to false, forcing Host::is_wpcom_platform() false regardless of the test
	 * environment's real constants (e.g. JETPACK_TEST_WPCOMSH, where they may be defined).
	 */
	private function simulate_self_hosted() {
		Constants::set_constant( 'IS_WPCOM', false );
		Constants::set_constant( 'ATOMIC_SITE_ID', false );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', false );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', false );
		Status_Cache::clear();
	}

	/**
	 * Simulate the Big_Sky class existing, as it does when the Big Sky plugin is present.
	 */
	private function simulate_big_sky_class() {
		if ( ! class_exists( 'Big_Sky' ) ) {
			eval( 'class Big_Sky {}' ); // @codingStandardsIgnoreLine — minimal stub for unit test isolation.
		}
	}

	/**
	 * Simulate the WordPress.com AI Assistant setting being enabled.
	 */
	private function enable_ai_assistant_setting() {
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '1' );
	}

	/**
	 * Clear the platform-constant overrides so this test class never leaks WordPress.com
	 * platform state into later test classes.
	 */
	private function reset_platform_constants() {
		Constants::clear_single_constant( 'IS_WPCOM' );
		Constants::clear_single_constant( 'ATOMIC_SITE_ID' );
		Constants::clear_single_constant( 'ATOMIC_CLIENT_ID' );
		Constants::clear_single_constant( 'WPCOMSH__PLUGIN_FILE' );
		Status_Cache::clear();
	}

	/**
	 * Get the inline agentsManagerData script.
	 *
	 * @return string Inline script contents.
	 */
	private function get_agents_manager_inline_script() {
		$inline_scripts = $GLOBALS['wp_scripts']->registered['agents-manager']->extra['before'] ?? array();
		return implode( "\n", array_filter( $inline_scripts ) );
	}

	/**
	 * Set the current screen to a block editor.
	 */
	private function set_block_editor_screen() {
		set_current_screen( 'post' );
		get_current_screen()->is_block_editor = true;
	}

	/**
	 * Set the current screen to the page block editor.
	 */
	private function set_page_block_editor_screen() {
		set_current_screen( 'post' );
		$screen                  = get_current_screen();
		$screen->post_type       = 'page';
		$screen->is_block_editor = true;
	}

	/**
	 * Enable the AI sidebar feature via filter.
	 */
	private function enable_sidebar() {
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_true' );
	}

	/**
	 * Cache AI sidebar asset data so register_provider succeeds.
	 *
	 * @param array|null $data Asset data to cache.
	 */
	private function cache_sidebar_asset_data( $data = null ) {
		if ( null === $data ) {
			$data = array(
				'version'      => '1.0.0-test',
				'dependencies' => array( 'wp-element', 'wp-data' ),
			);
		}
		set_transient( AiAssistantPlugin\AI_SIDEBAR_ASSET_TRANSIENT, $data, HOUR_IN_SECONDS );
		$this->mock_asset_request( 'jetpack-ai-sidebar.asset.json', $data );
	}

	/**
	 * Mock a CDN asset manifest response for tests that run with SCRIPT_DEBUG.
	 *
	 * @param string $filename Asset manifest filename.
	 * @param array  $data     Asset data.
	 */
	private function mock_asset_request( $filename, $data ) {
		add_filter(
			'pre_http_request',
			static function ( $preempt, $parsed_args, $url ) use ( $filename, $data ) {
				if ( ! is_string( $url ) || substr( $url, -strlen( $filename ) ) !== $filename ) {
					return $preempt;
				}

				return array(
					'headers'  => array(
						'content-type' => 'application/json',
					),
					'body'     => wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP ),
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'cookies'  => array(),
				);
			},
			10,
			3
		);
	}

	// ──────────────────────────────────────────────────
	// init() tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that init() registers hooks by default for AI Editorial Review.
	 */
	public function test_init_registers_hooks_by_default() {
		$this->enable_ai_assistant_setting();

		Jetpack_AI_Sidebar::init();

		$this->assertNotFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should be hooked by default.'
		);
		$this->assertNotFalse(
			has_filter( 'agents_manager_enabled_in_block_editor', array( Jetpack_AI_Sidebar::class, 'enable_agents_manager_in_post_editor' ) ),
			'enable_agents_manager_in_post_editor should be hooked by default.'
		);
		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_abilities_script' ) ),
			'maybe_enqueue_abilities_script should be hooked by default.'
		);
	}

	/**
	 * Test that init() does nothing when the sidebar gate is explicitly disabled.
	 */
	public function test_init_does_nothing_when_filter_is_false() {
		$this->enable_ai_assistant_setting();
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_false' );
		Jetpack_AI_Sidebar::init();

		$this->assertFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should not be hooked when filter is false.'
		);
		$this->assertFalse(
			has_filter( 'agents_manager_enabled_in_block_editor', array( Jetpack_AI_Sidebar::class, 'enable_agents_manager_in_post_editor' ) ),
			'enable_agents_manager_in_post_editor should not be hooked when filter is false.'
		);
	}

	/**
	 * Test that init() still opens the sidebar when only AI Editorial Review is disabled.
	 */
	public function test_init_registers_hooks_when_ai_editorial_review_filter_is_false() {
		$this->enable_ai_assistant_setting();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		Jetpack_AI_Sidebar::init();

		$this->assertNotFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should be hooked when the AI Assistant setting is enabled.'
		);
		$this->assertNotFalse(
			has_filter( 'agents_manager_enabled_in_block_editor', array( Jetpack_AI_Sidebar::class, 'enable_agents_manager_in_post_editor' ) ),
			'enable_agents_manager_in_post_editor should be hooked when the AI Assistant setting is enabled.'
		);
	}

	/**
	 * Test that init() does nothing when the site-level AI assistant setting is disabled.
	 */
	public function test_init_does_nothing_when_ai_assistant_setting_disabled() {
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '0' );
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_true' );
		Jetpack_AI_Sidebar::init();

		$this->assertFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should not be hooked when the site-level AI assistant setting is disabled.'
		);
		$this->assertFalse(
			has_filter( 'agents_manager_enabled_in_block_editor', array( Jetpack_AI_Sidebar::class, 'enable_agents_manager_in_post_editor' ) ),
			'enable_agents_manager_in_post_editor should not be hooked when the site-level AI assistant setting is disabled.'
		);
	}

	/**
	 * Test that init() does nothing when the Big Sky class is absent, even if the option is enabled.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_init_does_nothing_when_big_sky_class_missing() {
		update_option( 'big_sky_enable', '1' );
		Jetpack_AI_Sidebar::init();

		$this->assertFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should not be hooked when Big Sky is unavailable.'
		);
		$this->assertFalse(
			has_filter( 'agents_manager_enabled_in_block_editor', array( Jetpack_AI_Sidebar::class, 'enable_agents_manager_in_post_editor' ) ),
			'enable_agents_manager_in_post_editor should not be hooked when Big Sky is unavailable.'
		);
	}

	/**
	 * Test that init() does nothing on a non-WordPress.com platform (self-hosted),
	 * even when big_sky_enable is present and enabled.
	 */
	public function test_init_does_nothing_on_self_hosted() {
		$this->enable_ai_assistant_setting();
		$this->simulate_self_hosted();
		Jetpack_AI_Sidebar::init();

		$this->assertFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should not be hooked on a self-hosted (non-WordPress.com) site.'
		);
		$this->assertFalse(
			has_filter( 'agents_manager_enabled_in_block_editor', array( Jetpack_AI_Sidebar::class, 'enable_agents_manager_in_post_editor' ) ),
			'enable_agents_manager_in_post_editor should not be hooked on a self-hosted site.'
		);
	}

	/**
	 * Test that init() defaults open on Simple when big_sky_enable is absent — the
	 * toggle is enforced server-side by WordPress.com there, so an unset option stays open.
	 */
	public function test_init_registers_hooks_when_setting_absent_on_simple() {
		$this->simulate_wpcom_simple();
		$this->simulate_big_sky_class();
		delete_option( 'big_sky_enable' );
		Jetpack_AI_Sidebar::init();

		$this->assertNotFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should be hooked on Simple when the setting is absent (defaults on).'
		);
	}

	/**
	 * Test that init() defaults closed on Atomic when big_sky_enable is absent — the
	 * option mirrors the Site Settings > AI Assistant toggle, so absent means never enabled.
	 */
	public function test_init_does_nothing_when_setting_absent_on_atomic() {
		$this->simulate_big_sky_class();
		delete_option( 'big_sky_enable' );
		Jetpack_AI_Sidebar::init();

		$this->assertFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should not be hooked on Atomic when the setting is absent (never enabled).'
		);
	}

	/**
	 * Test that init() registers hooks when the feature filter is true.
	 */
	public function test_init_registers_hooks_when_enabled() {
		$this->enable_ai_assistant_setting();
		$this->enable_sidebar();
		Jetpack_AI_Sidebar::init();

		$this->assertNotFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should be hooked when filter is true.'
		);
		$this->assertNotFalse(
			has_filter( 'jetpack_ai_sidebar_agents_manager_data', array( Jetpack_AI_Sidebar::class, 'add_agents_manager_data' ) ),
			'add_agents_manager_data should be hooked when filter is true.'
		);
		$this->assertNotFalse(
			has_filter( 'agents_manager_enabled_in_block_editor', array( Jetpack_AI_Sidebar::class, 'enable_agents_manager_in_post_editor' ) ),
			'enable_agents_manager_in_post_editor should be hooked when filter is true.'
		);
		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_abilities_script' ) ),
			'maybe_enqueue_abilities_script should be hooked when filter is true.'
		);
	}

	// ──────────────────────────────────────────────────
	// agents_manager_enabled_in_block_editor() tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that the Agents Manager block-editor gate opens in the post editor.
	 */
	public function test_enable_agents_manager_in_post_editor_enables_post_editor() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();

		$this->assertTrue( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false ) );
	}

	/**
	 * Test that the Agents Manager block-editor gate does not open in the page editor.
	 */
	public function test_enable_agents_manager_in_post_editor_skips_page_editor() {
		$this->enable_ai_assistant_setting();
		$this->set_page_block_editor_screen();

		$this->assertFalse( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false ) );
	}

	/**
	 * Test that the Agents Manager block-editor gate preserves existing true values.
	 */
	public function test_enable_agents_manager_in_post_editor_preserves_existing_true() {
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		$this->set_page_block_editor_screen();

		$this->assertTrue( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( true ) );
	}

	/**
	 * Test that the Agents Manager block-editor gate is controlled by the AI Assistant setting.
	 */
	public function test_enable_agents_manager_in_post_editor_ignores_ai_editorial_review_filter() {
		$this->enable_ai_assistant_setting();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		$this->set_block_editor_screen();

		$this->assertTrue( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false ) );
	}

	/**
	 * Test that the Agents Manager block-editor gate respects the site-level AI assistant setting.
	 */
	public function test_enable_agents_manager_in_post_editor_respects_disabled_ai_assistant_setting() {
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '0' );
		$this->set_block_editor_screen();

		$this->assertFalse( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false ) );
	}

	/**
	 * Test that the Agents Manager block-editor gate defaults closed on Atomic when the
	 * setting is absent (the option mirrors the Site Settings > AI Assistant toggle).
	 */
	public function test_enable_agents_manager_in_post_editor_defaults_closed_when_setting_absent_on_atomic() {
		$this->simulate_big_sky_class();
		delete_option( 'big_sky_enable' );
		$this->set_block_editor_screen();

		$this->assertFalse( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false ) );
	}

	/**
	 * Test that the Agents Manager block-editor gate does not open when AI features are disabled.
	 */
	public function test_enable_agents_manager_in_post_editor_skips_when_ai_disabled() {
		$this->enable_ai_assistant_setting();
		add_filter( 'jetpack_ai_enabled', '__return_false' );
		$this->set_block_editor_screen();

		$this->assertFalse( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false ) );
	}

	/**
	 * Platform-emitted Agents Manager data gets the AI Editorial Review flag.
	 */
	public function test_add_agents_manager_data_exposes_ai_editorial_review_enabled() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_true' );

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( 'wp-orchestrator', $data['agentId'] );
		$this->assertSame( true, $data['aiEditorialReviewEnabled'] );
		$this->assertSame( true, $data['jetpackAiSidebarPreview']['enabled'] );
		$this->assertSame( true, $data['jetpackAiSidebarPreview']['features']['aiEditorialReview'] );
		$this->assertSame( true, $data['jetpackAiSidebarPreview']['features']['blockTransformations'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['optimizeTitleSuggestion'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['chatHistory'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['supportGuides'] );
	}

	/**
	 * Platform-emitted Agents Manager data reflects the AI Editorial Review feature flag.
	 */
	public function test_add_agents_manager_data_exposes_ai_editorial_review_disabled() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( 'wp-orchestrator', $data['agentId'] );
		$this->assertSame( false, $data['aiEditorialReviewEnabled'] );
		$this->assertSame( true, $data['jetpackAiSidebarPreview']['enabled'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['aiEditorialReview'] );
		$this->assertSame( true, $data['jetpackAiSidebarPreview']['features']['blockTransformations'] );
	}

	/**
	 * Big Sky's provider should not participate in the Jetpack AI Sidebar surface.
	 */
	public function test_add_agents_manager_data_filters_big_sky_provider() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();

		$data = Jetpack_AI_Sidebar::add_agents_manager_data(
			array(
				'sectionName'    => 'gutenberg',
				'agentProviders' => array(
					'https://example.com/wp-content/plugins/big-sky-plugin/build/calypso-agent-provider/index.js?ver=123',
					'https://widgets.wp.com/agents-manager/jetpack-ai-sidebar.provider.mjs',
					array( 'provider' => 'metadata' ),
				),
			)
		);

		$this->assertSame(
			array(
				'https://widgets.wp.com/agents-manager/jetpack-ai-sidebar.provider.mjs',
				array( 'provider' => 'metadata' ),
			),
			$data['agentProviders']
		);
	}

	/**
	 * Platform-emitted preview data is scoped to the post editor.
	 */
	public function test_add_agents_manager_data_skips_page_editor() {
		$this->enable_ai_assistant_setting();
		$this->set_page_block_editor_screen();

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertArrayNotHasKey( 'agentId', $data );
		$this->assertArrayNotHasKey( 'aiEditorialReviewEnabled', $data );
		$this->assertArrayNotHasKey( 'jetpackAiSidebarPreview', $data );
	}

	/**
	 * Invalid upstream filter data should pass through without a TypeError.
	 */
	public function test_add_agents_manager_data_ignores_non_array_data() {
		$this->assertNull( Jetpack_AI_Sidebar::add_agents_manager_data( null ) );
	}

	/**
	 * Platform-emitted preview data is gated by the site-level AI Assistant setting.
	 */
	public function test_add_agents_manager_data_respects_disabled_ai_assistant_setting() {
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '0' );
		$this->set_block_editor_screen();

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertArrayNotHasKey( 'agentId', $data );
		$this->assertArrayNotHasKey( 'aiEditorialReviewEnabled', $data );
		$this->assertArrayNotHasKey( 'jetpackAiSidebarPreview', $data );
	}

	// ──────────────────────────────────────────────────
	// maybe_patch_jetpack_ai_sidebar_preview_data() tests
	// ──────────────────────────────────────────────────

	/**
	 * When AM is enqueued by an external host (e.g. Big Sky on Atomic) and our
	 * data filter never fires, the patch script sets Jetpack AI Sidebar Preview
	 * data so the client gating still works.
	 */
	public function test_patch_jetpack_ai_sidebar_preview_data_sets_fields_when_am_enqueued_externally() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		// Simulate an external host having enqueued AM and declared upstream
		// data with both Jetpack AI Sidebar and Big Sky providers.
		wp_enqueue_script( 'agents-manager', 'https://example.com/am.js', array(), '1.0', true );
		wp_add_inline_script(
			'agents-manager',
			'const agentsManagerData = { sectionName: "gutenberg", agentProviders: [ "https://example.com/wp-content/plugins/big-sky-plugin/build/calypso-agent-provider/index.js?ver=123", "https://widgets.wp.com/agents-manager/jetpack-ai-sidebar.provider.mjs" ] };',
			'before'
		);

		Jetpack_AI_Sidebar::maybe_patch_jetpack_ai_sidebar_preview_data();

		$this->assertStringContainsString(
			'agentsManagerData.agentProviders = agentsManagerData.agentProviders.filter',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'/big-sky-plugin/build/calypso-agent-provider/',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'agentsManagerData.agentId = "wp-orchestrator"',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'agentsManagerData.aiEditorialReviewEnabled = true',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'agentsManagerData.jetpackAiSidebarPreview = {"enabled":true',
			$this->get_agents_manager_inline_script()
		);
	}

	/**
	 * When AM was not enqueued by anyone, the patch is a no-op.
	 */
	public function test_patch_jetpack_ai_sidebar_preview_data_noop_when_am_not_enqueued() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		Jetpack_AI_Sidebar::maybe_patch_jetpack_ai_sidebar_preview_data();

		$this->assertFalse( wp_script_is( 'agents-manager', 'enqueued' ) );
	}

	/**
	 * The external AM payload patch is limited to the post editor.
	 */
	public function test_patch_jetpack_ai_sidebar_preview_data_skips_page_editor() {
		$this->enable_ai_assistant_setting();
		$this->set_page_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		wp_enqueue_script( 'agents-manager', 'https://example.com/am.js', array(), '1.0', true );
		wp_add_inline_script( 'agents-manager', 'const agentsManagerData = { sectionName: "gutenberg" };', 'before' );

		Jetpack_AI_Sidebar::maybe_patch_jetpack_ai_sidebar_preview_data();

		$this->assertStringNotContainsString(
			'agentsManagerData.agentId',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringNotContainsString(
			'agentsManagerData.aiEditorialReviewEnabled',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringNotContainsString(
			'agentsManagerData.jetpackAiSidebarPreview',
			$this->get_agents_manager_inline_script()
		);
	}

	/**
	 * The external AM payload patch reflects the AI Editorial Review feature flag.
	 */
	public function test_patch_jetpack_ai_sidebar_preview_data_sets_disabled_ai_editorial_review_flag() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		wp_enqueue_script( 'agents-manager', 'https://example.com/am.js', array(), '1.0', true );
		wp_add_inline_script( 'agents-manager', 'const agentsManagerData = { sectionName: "gutenberg" };', 'before' );

		Jetpack_AI_Sidebar::maybe_patch_jetpack_ai_sidebar_preview_data();

		$this->assertStringContainsString(
			'agentsManagerData.agentId = "wp-orchestrator"',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'agentsManagerData.aiEditorialReviewEnabled = false',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'agentsManagerData.jetpackAiSidebarPreview = {"enabled":true',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'"aiEditorialReview":false',
			$this->get_agents_manager_inline_script()
		);
	}

	// ──────────────────────────────────────────────────
	// maybe_enqueue_abilities_script() tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that abilities script is not enqueued outside block editor.
	 */
	public function test_abilities_script_skips_non_block_editor() {
		$this->enable_ai_assistant_setting();
		set_current_screen( 'dashboard' );
		$this->cache_sidebar_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertFalse( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	/**
	 * Test that abilities script is not enqueued outside the post editor.
	 */
	public function test_abilities_script_skips_page_editor() {
		$this->enable_ai_assistant_setting();
		$this->set_page_block_editor_screen();
		$this->cache_sidebar_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertFalse( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	/**
	 * Test that abilities script is enqueued when only AI Editorial Review is disabled.
	 */
	public function test_abilities_script_enqueues_when_ai_editorial_review_disabled() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		$this->cache_sidebar_asset_data();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );

		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertTrue( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	/**
	 * Test that abilities script is enqueued in the post block editor.
	 */
	public function test_abilities_script_enqueues_in_block_editor() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		$this->cache_sidebar_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertTrue( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	/**
	 * Test that abilities script is skipped when AI features are disabled.
	 */
	public function test_abilities_script_skips_when_ai_disabled() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		$this->cache_sidebar_asset_data();
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertFalse( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	// ──────────────────────────────────────────────────
	// register_provider() tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that register_provider adds provider URL (does not enqueue assets).
	 */
	public function test_register_provider_adds_url() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		$this->cache_sidebar_asset_data();

		$providers = Jetpack_AI_Sidebar::register_provider( array() );

		$this->assertCount( 1, $providers );
		$this->assertStringContainsString( 'jetpack-ai-sidebar.provider.mjs', $providers[0] );
		// Asset enqueueing is handled by maybe_enqueue_abilities_script, not register_provider.
		$this->assertFalse( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
		$this->assertFalse( wp_style_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	/**
	 * Test that register_provider returns existing providers unchanged when asset data fails.
	 */
	public function test_register_provider_returns_unchanged_when_no_asset_data() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		// Block remote fetches.
		add_filter(
			'pre_http_request',
			function () {
				return new WP_Error( 'blocked', 'No HTTP.' );
			}
		);
		// Clear any cached data.
		delete_transient( AiAssistantPlugin\AI_SIDEBAR_ASSET_TRANSIENT );

		$existing  = array( 'https://example.com/other-provider.mjs' );
		$providers = Jetpack_AI_Sidebar::register_provider( $existing );

		// No hardcoded fallback — skip registration when asset manifest is unavailable.
		$this->assertCount( 1, $providers );
		$this->assertSame( 'https://example.com/other-provider.mjs', $providers[0] );
	}

	/**
	 * Test that register_provider preserves existing providers.
	 */
	public function test_register_provider_preserves_existing_providers() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		$this->cache_sidebar_asset_data();

		$existing  = array( 'https://example.com/provider-a.mjs', 'https://example.com/provider-b.mjs' );
		$providers = Jetpack_AI_Sidebar::register_provider( $existing );

		$this->assertCount( 3, $providers );
		$this->assertSame( 'https://example.com/provider-a.mjs', $providers[0] );
		$this->assertSame( 'https://example.com/provider-b.mjs', $providers[1] );
		$this->assertStringContainsString( 'jetpack-ai-sidebar.provider.mjs', $providers[2] );
	}

	/**
	 * Test that register_provider returns existing providers unchanged outside the post editor.
	 */
	public function test_register_provider_skips_page_editor() {
		$this->enable_ai_assistant_setting();
		$this->set_page_block_editor_screen();
		$this->cache_sidebar_asset_data();

		$existing  = array( 'https://example.com/provider-a.mjs' );
		$providers = Jetpack_AI_Sidebar::register_provider( $existing );

		$this->assertSame( $existing, $providers );
	}

	/**
	 * Test that register_provider still adds the provider when only AI Editorial Review is disabled.
	 */
	public function test_register_provider_adds_url_when_ai_editorial_review_disabled() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		$this->cache_sidebar_asset_data();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );

		$existing  = array( 'https://example.com/provider-a.mjs' );
		$providers = Jetpack_AI_Sidebar::register_provider( $existing );

		$this->assertCount( 2, $providers );
		$this->assertSame( 'https://example.com/provider-a.mjs', $providers[0] );
		$this->assertStringContainsString( 'jetpack-ai-sidebar.provider.mjs', $providers[1] );
	}

	// ──────────────────────────────────────────────────
	// Asset data tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that AI sidebar asset data is cached and used when enqueueing.
	 */
	public function test_sidebar_asset_data_is_cached() {
		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$this->markTestSkipped( 'Asset manifest transients are bypassed when SCRIPT_DEBUG is enabled.' );
		}

		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		$this->cache_sidebar_asset_data(
			array(
				'version'      => 'cached-version',
				'dependencies' => array(),
			)
		);

		// Enqueue is handled by maybe_enqueue_abilities_script, not register_provider.
		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertTrue( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
		$registered = $GLOBALS['wp_scripts']->registered['jetpack-ai-provider'] ?? null;
		$this->assertNotNull( $registered );
		$this->assertSame( 'cached-version', $registered->ver );
	}

	/**
	 * Test that enqueue is skipped when asset manifest fetch fails.
	 */
	public function test_sidebar_asset_data_skips_enqueue_when_fetch_fails() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		// Block remote fetches.
		add_filter(
			'pre_http_request',
			function () {
				return new WP_Error( 'blocked', 'No HTTP.' );
			}
		);

		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertFalse( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );

		$providers = Jetpack_AI_Sidebar::register_provider( array() );
		$this->assertCount( 0, $providers );
	}

	// ──────────────────────────────────────────────────
	// Filter integration tests
	// ──────────────────────────────────────────────────

	/**
	 * Test full flow: init, simulate AM filter, verify provider registered.
	 */
	public function test_full_flow_with_default_enabled() {
		$this->enable_ai_assistant_setting();
		$this->set_block_editor_screen();
		Jetpack_AI_Sidebar::init();
		$this->cache_sidebar_asset_data();

		$providers = apply_filters( 'agents_manager_agent_providers', array() );

		$this->assertCount( 1, $providers );
		$this->assertStringContainsString( 'jetpack-ai-sidebar.provider.mjs', $providers[0] );
	}

	/**
	 * Test full flow: filter disabled, init, verify no provider registered.
	 */
	public function test_full_flow_with_filter_disabled() {
		$this->enable_ai_assistant_setting();
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_false' );
		Jetpack_AI_Sidebar::init();

		$providers = apply_filters( 'agents_manager_agent_providers', array() );

		$this->assertCount( 0, $providers );
	}
}
