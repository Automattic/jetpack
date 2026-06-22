<?php
/**
 * Jetpack AI Sidebar tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\AiAssistantPlugin;
use Automattic\Jetpack\Extensions\AiAssistantPlugin\Jetpack_AI_Sidebar;
use Automattic\Jetpack\Status\Cache as Status_Cache;

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
		delete_transient( AiAssistantPlugin\AM_ASSET_TRANSIENT );
		delete_transient( AiAssistantPlugin\AM_ASSET_DC_TRANSIENT );
		delete_transient( AiAssistantPlugin\AI_SIDEBAR_ASSET_TRANSIENT );
		$this->saved_wp_scripts      = $GLOBALS['wp_scripts'] ?? null;
		$this->saved_wp_styles       = $GLOBALS['wp_styles'] ?? null;
		$GLOBALS['wp_scripts']       = new WP_Scripts();
		$GLOBALS['wp_styles']        = new WP_Styles();
		$this->saved_screen          = $GLOBALS['current_screen'] ?? null;
		$this->saved_current_user_id = get_current_user_id();
		$this->simulate_connected_owner();
		// Ensure Big Sky is disabled by default so tests aren't affected by the
		// Big_Sky class persisting across tests once it is declared.
		update_option( 'big_sky_enable', '0' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_transient( AiAssistantPlugin\AM_ASSET_TRANSIENT );
		delete_transient( AiAssistantPlugin\AM_ASSET_DC_TRANSIENT );
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
		remove_all_filters( 'jetpack_ai_sidebar_preview_enabled' );
		remove_all_filters( 'jetpack_ai_sidebar_preview_features' );
		remove_all_filters( 'jetpack_ai_sidebar_agents_manager_data' );
		remove_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_am' ), 200 );
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
	 * Simulate the Big_Sky class existing.
	 */
	private function simulate_big_sky_class() {
		if ( ! class_exists( 'Big_Sky' ) ) {
			eval( 'class Big_Sky {}' ); // @codingStandardsIgnoreLine — minimal stub for unit test isolation.
		}
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
		$this->mock_asset_request( "agents-manager-{$variant}.asset.json", $data );
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
			has_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_am' ) ),
			'maybe_enqueue_am should be hooked by default.'
		);
	}

	/**
	 * Test that init() does nothing when the sidebar gate is explicitly disabled.
	 */
	public function test_init_does_nothing_when_filter_is_false() {
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
	 * Test that init() does nothing when the preview gate is disabled.
	 */
	public function test_init_does_nothing_when_preview_gate_is_false() {
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_false' );
		Jetpack_AI_Sidebar::init();

		$this->assertFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should not be hooked when the preview gate is false.'
		);
		$this->assertFalse(
			has_filter( 'agents_manager_enabled_in_block_editor', array( Jetpack_AI_Sidebar::class, 'enable_agents_manager_in_post_editor' ) ),
			'enable_agents_manager_in_post_editor should not be hooked when the preview gate is false.'
		);
	}

	/**
	 * Test that the preview surface can initialize without AI Editorial Review.
	 */
	public function test_init_registers_hooks_when_preview_is_enabled_without_ai_editorial_review() {
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_true' );
		Jetpack_AI_Sidebar::init();

		$this->assertNotFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should be hooked when the preview gate is true.'
		);
		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_am' ) ),
			'maybe_enqueue_am should be hooked when the preview gate is true.'
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
			has_filter( 'jetpack_ai_sidebar_agents_manager_data', array( Jetpack_AI_Sidebar::class, 'add_agents_manager_data' ) ),
			'add_agents_manager_data should be hooked when filter is true.'
		);
		$this->assertNotFalse(
			has_filter( 'agents_manager_enabled_in_block_editor', array( Jetpack_AI_Sidebar::class, 'enable_agents_manager_in_post_editor' ) ),
			'enable_agents_manager_in_post_editor should be hooked when filter is true.'
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
	// agents_manager_enabled_in_block_editor() tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that the Agents Manager block-editor gate opens in the post editor.
	 */
	public function test_enable_agents_manager_in_post_editor_enables_post_editor() {
		$this->set_block_editor_screen();

		$this->assertTrue( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false ) );
	}

	/**
	 * Test that the Agents Manager block-editor gate does not open in the page editor.
	 */
	public function test_enable_agents_manager_in_post_editor_skips_page_editor() {
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
	 * Test that the AI Editorial Review kill switch closes this Agents Manager entrypoint.
	 */
	public function test_enable_agents_manager_in_post_editor_respects_ai_editorial_review_filter() {
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		$this->set_block_editor_screen();

		$this->assertFalse( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false ) );
	}

	/**
	 * Test that the preview surface can open independently of AI Editorial Review.
	 */
	public function test_enable_agents_manager_in_post_editor_respects_preview_filter() {
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_true' );
		$this->set_block_editor_screen();

		$this->assertTrue( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false ) );
	}

	/**
	 * Test that the Agents Manager block-editor gate does not open when AI features are disabled.
	 */
	public function test_enable_agents_manager_in_post_editor_skips_when_ai_disabled() {
		add_filter( 'jetpack_ai_enabled', '__return_false' );
		$this->set_block_editor_screen();

		$this->assertFalse( Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false ) );
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
	 * Test that maybe_enqueue_am does nothing outside the post editor.
	 */
	public function test_maybe_enqueue_am_skips_page_editor() {
		$this->set_page_block_editor_screen();
		$this->cache_am_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertFalse( wp_script_is( 'agents-manager', 'enqueued' ) );
	}

	/**
	 * Test that maybe_enqueue_am does nothing when the preview gate is disabled.
	 */
	public function test_maybe_enqueue_am_skips_when_preview_disabled() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_false' );

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
	 * Test that maybe_enqueue_am enqueues when Big Sky exists but is disabled.
	 */
	public function test_maybe_enqueue_am_enqueues_when_big_sky_is_disabled() {
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '0' );
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertTrue( wp_script_is( 'agents-manager', 'enqueued' ) );
	}

	/**
	 * The AI Editorial Review-specific filter controls the feature flag.
	 */
	public function test_maybe_enqueue_am_respects_ai_editorial_review_filter() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_true' );

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertStringContainsString( '"agentId":"wp-orchestrator"', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"aiEditorialReviewEnabled":false', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"jetpackAiSidebarPreview":{"enabled":true', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"aiEditorialReview":false', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"generateFeedback":false', $this->get_agents_manager_inline_script() );
	}

	/**
	 * AI Editorial Review is on by default when no filter override is present.
	 */
	public function test_maybe_enqueue_am_exposes_ai_editorial_review_by_default() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertStringContainsString( '"agentId":"wp-orchestrator"', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"aiEditorialReviewEnabled":true', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"jetpackAiSidebarPreview":{"enabled":true', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"aiEditorialReview":true', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"generateFeedback":false', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"blockTransformations":true', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"optimizeTitleSuggestion":false', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"chatHistory":false', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"supportGuides":false', $this->get_agents_manager_inline_script() );
	}

	/**
	 * The generic preview features filter cannot bypass the Optimize Title gate.
	 */
	public function test_maybe_enqueue_am_prevents_preview_features_filter_from_enabling_optimize_title() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			function ( $features ) {
				$features['optimizeTitleSuggestion'] = true;
				return $features;
			}
		);

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertStringContainsString( '"optimizeTitleSuggestion":false', $this->get_agents_manager_inline_script() );
	}

	/**
	 * The generic preview features filter cannot bypass the Generate Feedback gate.
	 */
	public function test_maybe_enqueue_am_prevents_preview_features_filter_from_enabling_generate_feedback() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			function ( $features ) {
				$features['generateFeedback'] = true;
				return $features;
			}
		);

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertStringContainsString( '"generateFeedback":false', $this->get_agents_manager_inline_script() );
	}

	/**
	 * The generic preview features filter can disable Optimize Title in dev mode.
	 */
	public function test_maybe_enqueue_am_allows_preview_features_filter_to_disable_optimize_title_in_dev_mode() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			function ( $features ) {
				$features['optimizeTitleSuggestion'] = false;
				return $features;
			}
		);

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertStringContainsString( '"optimizeTitleSuggestion":false', $this->get_agents_manager_inline_script() );
	}

	/**
	 * Dev-mode signals keep AI Editorial Review enabled by default.
	 */
	public function test_maybe_enqueue_am_exposes_ai_editorial_review_enabled_in_dev_mode() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertStringContainsString( '"aiEditorialReviewEnabled":true', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"optimizeTitleSuggestion":true', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"generateFeedback":true', $this->get_agents_manager_inline_script() );
	}

	/**
	 * The AI Editorial Review-specific filter can suppress the flag even in dev mode.
	 */
	public function test_maybe_enqueue_am_allows_ai_editorial_review_filter_to_disable_dev_mode() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_true' );

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertStringContainsString( '"aiEditorialReviewEnabled":false', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"jetpackAiSidebarPreview":{"enabled":true', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"aiEditorialReview":false', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"generateFeedback":true', $this->get_agents_manager_inline_script() );
	}

	/**
	 * Platform-emitted Agents Manager data gets the AI Editorial Review flag.
	 */
	public function test_add_agents_manager_data_exposes_ai_editorial_review_enabled() {
		$this->set_block_editor_screen();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_true' );

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( 'wp-orchestrator', $data['agentId'] );
		$this->assertSame( true, $data['aiEditorialReviewEnabled'] );
		$this->assertSame( true, $data['jetpackAiSidebarPreview']['enabled'] );
		$this->assertSame( true, $data['jetpackAiSidebarPreview']['features']['aiEditorialReview'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['generateFeedback'] );
		$this->assertSame( true, $data['jetpackAiSidebarPreview']['features']['blockTransformations'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['optimizeTitleSuggestion'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['chatHistory'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['supportGuides'] );
	}

	/**
	 * Dev-mode signals expose Optimize Title in externally emitted Agents Manager data.
	 */
	public function test_add_agents_manager_data_exposes_optimize_title_in_dev_mode() {
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( true, $data['jetpackAiSidebarPreview']['features']['optimizeTitleSuggestion'] );
	}

	/**
	 * Big Sky's provider should not participate in the Jetpack AI Sidebar surface.
	 */
	public function test_add_agents_manager_data_filters_big_sky_provider() {
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
	 * Preview and AI Editorial Review have separate gates.
	 */
	public function test_add_agents_manager_data_allows_preview_without_ai_editorial_review() {
		$this->set_block_editor_screen();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_true' );

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( 'wp-orchestrator', $data['agentId'] );
		$this->assertSame( false, $data['aiEditorialReviewEnabled'] );
		$this->assertSame( true, $data['jetpackAiSidebarPreview']['enabled'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['aiEditorialReview'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['generateFeedback'] );
		$this->assertSame( true, $data['jetpackAiSidebarPreview']['features']['blockTransformations'] );
		$this->assertSame( false, $data['jetpackAiSidebarPreview']['features']['optimizeTitleSuggestion'] );
	}

	/**
	 * Platform-emitted preview data is scoped to the post editor.
	 */
	public function test_add_agents_manager_data_skips_page_editor() {
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
	 * A misbehaving filter that returns non-array must not break the payload.
	 */
	public function test_maybe_enqueue_am_falls_back_when_filter_returns_non_array() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		add_filter( 'jetpack_ai_sidebar_agents_manager_data', '__return_null' );

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		// Original payload with Jetpack's authoritative flags is still emitted.
		$this->assertStringContainsString(
			'"agentId":"wp-orchestrator"',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'"aiEditorialReviewEnabled":',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'"jetpackAiSidebarPreview":',
			$this->get_agents_manager_inline_script()
		);
	}

	/**
	 * Generic Agents Manager data filters should not override Jetpack's AI Editorial Review flag.
	 */
	public function test_maybe_enqueue_am_keeps_ai_editorial_review_flag_authoritative_after_data_filter() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_true' );
		add_filter(
			'jetpack_ai_sidebar_agents_manager_data',
			function ( $data ) {
				$data['aiEditorialReviewEnabled'] = false;
				return $data;
			},
			20
		);

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertStringContainsString( '"aiEditorialReviewEnabled":true', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"aiEditorialReview":true', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"generateFeedback":false', $this->get_agents_manager_inline_script() );
	}

	/**
	 * The generic data filter should not bypass the AI Editorial Review-specific gate.
	 */
	public function test_maybe_enqueue_am_prevents_data_filter_from_enabling_ai_editorial_review() {
		$this->set_block_editor_screen();
		$this->cache_am_asset_data();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_true' );
		add_filter(
			'jetpack_ai_sidebar_agents_manager_data',
			function ( $data ) {
				$data['aiEditorialReviewEnabled'] = true;
				return $data;
			},
			20
		);

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		$this->assertStringContainsString( '"aiEditorialReviewEnabled":false', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"aiEditorialReview":false', $this->get_agents_manager_inline_script() );
		$this->assertStringContainsString( '"generateFeedback":false', $this->get_agents_manager_inline_script() );
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
		$filter_calls = 0;
		add_filter(
			'jetpack_ai_sidebar_agents_manager_data',
			function ( $data ) use ( &$filter_calls ) {
				++$filter_calls;
				return $data;
			}
		);

		Jetpack_AI_Sidebar::maybe_enqueue_am();

		// Source should remain the original, not the CDN URL.
		$this->assertSame( $original_src, $GLOBALS['wp_scripts']->registered['agents-manager']->src );
		$this->assertSame( 0, $filter_calls );
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
	// maybe_patch_jetpack_ai_sidebar_preview_data() tests
	// ──────────────────────────────────────────────────

	/**
	 * When AM is enqueued by an external host (e.g. Big Sky on Atomic) and our
	 * data filter never fires, the patch script sets Jetpack AI Sidebar Preview
	 * data so the client gating still works.
	 */
	public function test_patch_jetpack_ai_sidebar_preview_data_sets_fields_when_am_enqueued_externally() {
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
		$this->assertStringContainsString(
			'"optimizeTitleSuggestion":true',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'"generateFeedback":true',
			$this->get_agents_manager_inline_script()
		);
	}

	/**
	 * When AM was not enqueued by anyone, the patch is a no-op.
	 */
	public function test_patch_jetpack_ai_sidebar_preview_data_noop_when_am_not_enqueued() {
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		Jetpack_AI_Sidebar::maybe_patch_jetpack_ai_sidebar_preview_data();

		$this->assertFalse( wp_script_is( 'agents-manager', 'enqueued' ) );
	}

	/**
	 * The external AM payload patch is limited to the post editor.
	 */
	public function test_patch_jetpack_ai_sidebar_preview_data_skips_page_editor() {
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
	 * The external AM payload patch is gated by the preview surface.
	 */
	public function test_patch_jetpack_ai_sidebar_preview_data_skips_when_preview_disabled() {
		$this->set_block_editor_screen();
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_false' );
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
	 * Test that abilities script is not enqueued outside the post editor.
	 */
	public function test_abilities_script_skips_page_editor() {
		$this->set_page_block_editor_screen();
		$this->cache_sidebar_asset_data();

		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertFalse( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	/**
	 * Test that abilities script is not enqueued when the preview gate is disabled.
	 */
	public function test_abilities_script_skips_when_preview_disabled() {
		$this->set_block_editor_screen();
		$this->cache_sidebar_asset_data();
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_false' );

		Jetpack_AI_Sidebar::maybe_enqueue_abilities_script();

		$this->assertFalse( wp_script_is( 'jetpack-ai-provider', 'enqueued' ) );
	}

	/**
	 * Test that abilities script is enqueued in the post block editor.
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
	 * Test that register_provider adds provider URL (does not enqueue assets).
	 */
	public function test_register_provider_adds_url() {
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
		$this->set_page_block_editor_screen();
		$this->cache_sidebar_asset_data();

		$existing  = array( 'https://example.com/provider-a.mjs' );
		$providers = Jetpack_AI_Sidebar::register_provider( $existing );

		$this->assertSame( $existing, $providers );
	}

	/**
	 * Test that register_provider returns existing providers when the preview gate is disabled.
	 */
	public function test_register_provider_skips_when_preview_disabled() {
		$this->set_block_editor_screen();
		$this->cache_sidebar_asset_data();
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_false' );

		$existing  = array( 'https://example.com/provider-a.mjs' );
		$providers = Jetpack_AI_Sidebar::register_provider( $existing );

		$this->assertSame( $existing, $providers );
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
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_false' );
		Jetpack_AI_Sidebar::init();

		$providers = apply_filters( 'agents_manager_agent_providers', array() );

		$this->assertCount( 0, $providers );
	}
}
