<?php
/**
 * Jetpack AI Sidebar tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\AiAssistantPlugin;
use Automattic\Jetpack\Extensions\AiAssistantPlugin\Jetpack_AI_Sidebar;

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
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		delete_transient( AiAssistantPlugin\AM_ASSET_TRANSIENT );
		delete_transient( AiAssistantPlugin\AM_ASSET_DC_TRANSIENT );
		delete_transient( AiAssistantPlugin\AI_SIDEBAR_ASSET_TRANSIENT );
		$this->saved_wp_scripts = $GLOBALS['wp_scripts'] ?? null;
		$this->saved_wp_styles  = $GLOBALS['wp_styles'] ?? null;
		$GLOBALS['wp_scripts']  = new WP_Scripts();
		$GLOBALS['wp_styles']   = new WP_Styles();
		$this->saved_screen     = $GLOBALS['current_screen'] ?? null;
		$this->simulate_connected_owner();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_transient( AiAssistantPlugin\AM_ASSET_TRANSIENT );
		delete_transient( AiAssistantPlugin\AM_ASSET_DC_TRANSIENT );
		delete_transient( AiAssistantPlugin\AI_SIDEBAR_ASSET_TRANSIENT );
		remove_all_filters( 'jetpack_ai_sidebar_enabled' );
		remove_all_filters( 'agents_manager_agent_providers' );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_ai_enabled' );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		$GLOBALS['current_screen'] = $this->saved_screen;
		$GLOBALS['wp_scripts']     = $this->saved_wp_scripts;
		$GLOBALS['wp_styles']      = $this->saved_wp_styles;
		parent::tear_down();
	}

	/**
	 * Simulate a connected Jetpack owner.
	 */
	private function simulate_connected_owner() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
	}

	/**
	 * Set the current screen to a block editor.
	 */
	private function set_block_editor_screen() {
		set_current_screen( 'post' );
		get_current_screen()->is_block_editor = true;
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
	}

	/**
	 * Cache AM asset data so maybe_enqueue_am succeeds.
	 *
	 * @param string     $variant The variant name.
	 * @param array|null $data    Asset data to cache.
	 */
	private function cache_am_asset_data( $variant = 'gutenberg', $data = null ) {
		if ( null === $data ) {
			$data = array(
				'version'      => '1.0.0-test',
				'dependencies' => array( 'wp-element' ),
			);
		}
		$transient = str_contains( $variant, 'disconnected' )
			? AiAssistantPlugin\AM_ASSET_DC_TRANSIENT
			: AiAssistantPlugin\AM_ASSET_TRANSIENT;
		set_transient( $transient, $data, HOUR_IN_SECONDS );
	}

	// ──────────────────────────────────────────────────
	// init() tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that init() does nothing when the feature filter is false (default).
	 */
	public function test_init_does_nothing_when_filter_is_false() {
		Jetpack_AI_Sidebar::init();

		$this->assertFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should not be hooked when filter is false.'
		);
	}

	/**
	 * Test that init() registers hooks when the feature filter is true.
	 */
	public function test_init_registers_hooks_when_enabled() {
		$this->enable_sidebar();
		Jetpack_AI_Sidebar::init();

		$this->assertNotFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should be hooked when filter is true.'
		);
		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_am' ) ),
			'maybe_enqueue_am should be hooked when filter is true.'
		);
		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_abilities_script' ) ),
			'maybe_enqueue_abilities_script should be hooked when filter is true.'
		);
	}

	// ──────────────────────────────────────────────────
	// maybe_enqueue_am() tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that maybe_enqueue_am does nothing outside the block editor.
	 */
	public function test_maybe_enqueue_am_skips_non_block_editor() {
		set_current_screen( 'dashboard' );
		$this->cache_am_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertFalse( wp_script_is( 'agents-manager', 'enqueued' ) );
	}

	/**
	 * Test that maybe_enqueue_am enqueues scripts in the block editor.
	 */
	public function test_maybe_enqueue_am_enqueues_in_block_editor() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertTrue( wp_script_is( 'agents-manager', 'enqueued' ) );
	}

	/**
	 * Test that maybe_enqueue_am skips when AM is already loaded.
	 */
	public function test_maybe_enqueue_am_skips_when_am_already_loaded() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();

		// Simulate AM already enqueued.
		wp_enqueue_script( 'agents-manager', 'https://example.com/am.js', array(), '1.0', true );

		// Reset enqueue to track if our code adds it again.
		$original_src = $GLOBALS['wp_scripts']->registered['agents-manager']->src;

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		// Source should remain the original, not the CDN URL.
		$this->assertSame( $original_src, $GLOBALS['wp_scripts']->registered['agents-manager']->src );
	}

	/**
	 * Test that maybe_enqueue_am skips when AI features are disabled.
	 */
	public function test_maybe_enqueue_am_skips_when_ai_disabled() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertFalse( wp_script_is( 'agents-manager', 'enqueued' ) );
	}

	// ──────────────────────────────────────────────────
	// maybe_enqueue_abilities_script() tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that abilities script is not enqueued outside block editor.
	 */
	public function test_abilities_script_skips_non_block_editor() {
		set_current_screen( 'dashboard' );
		$this->cache_sidebar_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertFalse( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	/**
	 * Test that abilities script is enqueued in block editor.
	 */
	public function test_abilities_script_enqueues_in_block_editor() {
		$this->set_block_editor_screen();
		$this->cache_sidebar_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertTrue( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	/**
	 * Test that abilities script is skipped when AI features are disabled.
	 */
	public function test_abilities_script_skips_when_ai_disabled() {
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
	 * Test that register_provider adds provider URL and enqueues scripts.
	 */
	public function test_register_provider_adds_url_and_enqueues() {
		$this->cache_sidebar_asset_data();

		$providers = Jetpack_AI_Sidebar::register_provider( array() );

		$this->assertCount( 1, $providers );
		$this->assertStringContainsString( 'jetpack-ai-sidebar.provider.mjs', $providers[0] );
		$this->assertTrue( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
		$this->assertTrue( wp_style_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	/**
	 * Test that register_provider returns existing providers unchanged when asset data fails.
	 */
	public function test_register_provider_returns_unchanged_when_no_asset_data() {
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

		// Should still have our provider because of the hardcoded fallback.
		$this->assertCount( 2, $providers );
		$this->assertSame( 'https://example.com/other-provider.mjs', $providers[0] );
	}

	/**
	 * Test that register_provider preserves existing providers.
	 */
	public function test_register_provider_preserves_existing_providers() {
		$this->cache_sidebar_asset_data();

		$existing  = array( 'https://example.com/provider-a.mjs', 'https://example.com/provider-b.mjs' );
		$providers = Jetpack_AI_Sidebar::register_provider( $existing );

		$this->assertCount( 3, $providers );
		$this->assertSame( 'https://example.com/provider-a.mjs', $providers[0] );
		$this->assertSame( 'https://example.com/provider-b.mjs', $providers[1] );
		$this->assertStringContainsString( 'jetpack-ai-sidebar.provider.mjs', $providers[2] );
	}

	// ──────────────────────────────────────────────────
	// Asset data tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that AI sidebar asset data is cached in a transient.
	 */
	public function test_sidebar_asset_data_is_cached() {
		$this->cache_sidebar_asset_data(
			array(
				'version'      => 'cached-version',
				'dependencies' => array(),
			)
		);

		// Trigger register_provider which calls get_ai_sidebar_asset_data().
		Jetpack_AI_Sidebar::register_provider( array() );

		// The enqueued script should use the cached version.
		$this->assertTrue( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
		$registered = $GLOBALS['wp_scripts']->registered['jetpack-ai-provider'] ?? null;
		$this->assertNotNull( $registered );
		$this->assertSame( 'cached-version', $registered->ver );
	}

	/**
	 * Test that AM asset data uses hardcoded fallback when remote fetch fails.
	 */
	public function test_sidebar_asset_data_uses_hardcoded_fallback() {
		// Block remote fetches.
		add_filter(
			'pre_http_request',
			function () {
				return new WP_Error( 'blocked', 'No HTTP.' );
			}
		);

		$providers = Jetpack_AI_Sidebar::register_provider( array() );

		// Should still work via hardcoded fallback.
		$this->assertCount( 1, $providers );
		$this->assertTrue( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );

		$registered = $GLOBALS['wp_scripts']->registered['jetpack-ai-provider'] ?? null;
		$this->assertNotNull( $registered );
		$this->assertSame( 'fallback', $registered->ver );
	}

	// ──────────────────────────────────────────────────
	// Filter integration tests
	// ──────────────────────────────────────────────────

	/**
	 * Test full flow: enable filter, init, simulate AM filter, verify provider registered.
	 */
	public function test_full_flow_with_filter_enabled() {
		$this->enable_sidebar();
		Jetpack_AI_Sidebar::init();
		$this->cache_sidebar_asset_data();

		$providers = apply_filters( 'agents_manager_agent_providers', array() );

		$this->assertCount( 1, $providers );
		$this->assertStringContainsString( 'jetpack-ai-sidebar.provider.mjs', $providers[0] );
	}

	/**
	 * Test full flow: filter disabled (default), init, verify no provider registered.
	 */
	public function test_full_flow_with_filter_disabled() {
		// Don't enable the filter — defaults to false.
		Jetpack_AI_Sidebar::init();

		$providers = apply_filters( 'agents_manager_agent_providers', array() );

		$this->assertCount( 0, $providers );
	}
}
