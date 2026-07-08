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
		\Jetpack_Gutenberg::reset();
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
		// Enable the sidebar by default via the override filter so the behaviour
		// tests exercise the downstream wiring. has_ai_features() stays on the
		// self-hosted connection path. The wpcom/Big Sky gating itself is covered
		// by the preview-gate tests, which remove this override.
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_true' );
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
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'jetpack_disable_seo_tools' );
		remove_all_filters( 'ai_seo_enhancer_enabled' );
		Status_Cache::clear();
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		delete_option( 'jetpack_offline_mode' );
		delete_option( 'big_sky_enable' );
		Constants::clear_single_constant( 'IS_WPCOM' );
		Constants::clear_single_constant( 'ATOMIC_SITE_ID' );
		Constants::clear_single_constant( 'ATOMIC_CLIENT_ID' );
		Constants::clear_single_constant( 'WPCOMSH__PLUGIN_FILE' );
		Status_Cache::clear();
		wp_set_current_user( $this->saved_current_user_id );
		$GLOBALS['current_screen'] = $this->saved_screen;
		$GLOBALS['wp_scripts']     = $this->saved_wp_scripts;
		$GLOBALS['wp_styles']      = $this->saved_wp_styles;
		\Jetpack_Gutenberg::reset();
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
		remove_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		remove_filter( 'jetpack_gutenberg', '__return_true' );
		remove_filter( 'jetpack_set_available_extensions', array( __CLASS__, 'get_sidebar_extension_allowlist' ) );
		remove_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_abilities_script' ), 201 );
		remove_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_patch_jetpack_ai_sidebar_preview_data' ), 250 );
		remove_action( 'jetpack_register_gutenberg_extensions', array( Jetpack_AI_Sidebar::class, 'register_toolbar_button_extension' ), 99 );
	}

	/**
	 * Limit Jetpack Gutenberg availability checks to the sidebar extension under test.
	 *
	 * @return array
	 */
	public static function get_sidebar_extension_allowlist() {
		return array( AiAssistantPlugin\AI_SIDEBAR_TOOLBAR_BUTTON_EXTENSION );
	}

	/**
	 * Enable Jetpack Gutenberg availability checks for the sidebar extension under test.
	 */
	private function enable_sidebar_extension_availability_checks() {
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		add_filter( 'jetpack_gutenberg', '__return_true' );
		add_filter( 'jetpack_set_available_extensions', array( __CLASS__, 'get_sidebar_extension_allowlist' ) );
		Status_Cache::clear();
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
	 * Simulate a WordPress.com platform (WoA/Atomic) site so Host::is_wpcom_platform()
	 * is true while is_wpcom_simple() stays false — keeping has_ai_features() on the
	 * connection path.
	 */
	private function simulate_wpcom_platform() {
		Constants::set_constant( 'IS_WPCOM', false );
		Constants::set_constant( 'ATOMIC_SITE_ID', 123456789 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', '2' );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/wpcomsh/wpcomsh.php' );
		Status_Cache::clear();
	}

	/**
	 * Simulate a WordPress.com Simple site so Host::is_wpcom_simple() is true.
	 */
	private function simulate_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		Constants::set_constant( 'ATOMIC_SITE_ID', false );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', false );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', false );
		Status_Cache::clear();
	}

	/**
	 * Simulate a self-hosted site so Host::is_wpcom_platform() is false.
	 */
	private function simulate_self_hosted() {
		Constants::set_constant( 'IS_WPCOM', false );
		Constants::set_constant( 'ATOMIC_SITE_ID', false );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', false );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', false );
		Status_Cache::clear();
	}

	/**
	 * Mark legacy Jetpack AI block toolbar extensions as available.
	 */
	private function make_legacy_block_toolbar_extensions_available() {
		\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-support' );
		\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-image-extension' );
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
	 * Whether the preview gate is open, observed through a public surface.
	 *
	 * Uses enable_agents_manager_in_post_editor(), which returns the preview gate
	 * ANDed with the post-editor and AI-features checks — both satisfied by the
	 * gate tests (set_up connects an owner; this sets the post editor screen) —
	 * so it reflects is_jetpack_ai_sidebar_preview_enabled() without reflection.
	 *
	 * @return bool
	 */
	private function gate_open(): bool {
		$this->set_block_editor_screen();
		return Jetpack_AI_Sidebar::enable_agents_manager_in_post_editor( false );
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
			has_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_patch_jetpack_ai_sidebar_preview_data' ) ),
			'maybe_patch_jetpack_ai_sidebar_preview_data should be hooked by default.'
		);
		$this->assertNotFalse(
			has_action( 'jetpack_register_gutenberg_extensions', array( Jetpack_AI_Sidebar::class, 'register_toolbar_button_extension' ) ),
			'register_toolbar_button_extension should be hooked by default.'
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
		$this->assertFalse(
			has_action( 'jetpack_register_gutenberg_extensions', array( Jetpack_AI_Sidebar::class, 'register_toolbar_button_extension' ) ),
			'register_toolbar_button_extension should not be hooked when filter is false.'
		);
	}

	/**
	 * Test that init() does nothing on a self-hosted site (off the wpcom platform).
	 */
	public function test_init_does_nothing_on_self_hosted() {
		remove_all_filters( 'jetpack_ai_sidebar_enabled' );
		$this->simulate_self_hosted();
		Jetpack_AI_Sidebar::init();

		$this->assertFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should not be hooked on a self-hosted site.'
		);
		$this->assertFalse(
			has_filter( 'agents_manager_enabled_in_block_editor', array( Jetpack_AI_Sidebar::class, 'enable_agents_manager_in_post_editor' ) ),
			'enable_agents_manager_in_post_editor should not be hooked on a self-hosted site.'
		);
		$this->assertFalse(
			has_action( 'jetpack_register_gutenberg_extensions', array( Jetpack_AI_Sidebar::class, 'register_toolbar_button_extension' ) ),
			'register_toolbar_button_extension should not be hooked when the preview gate is false.'
		);
	}

	/**
	 * Test that the preview surface can initialize without AI Editorial Review.
	 */
	public function test_init_registers_hooks_when_preview_is_enabled_without_ai_editorial_review() {
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
		Jetpack_AI_Sidebar::init();

		$this->assertNotFalse(
			has_filter( 'agents_manager_agent_providers', array( Jetpack_AI_Sidebar::class, 'register_provider' ) ),
			'register_provider should be hooked when the preview gate is true.'
		);
		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_abilities_script' ) ),
			'maybe_enqueue_abilities_script should be hooked when the preview gate is true.'
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
			has_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_enqueue_abilities_script' ) ),
			'maybe_enqueue_abilities_script should be hooked when filter is true.'
		);
		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( Jetpack_AI_Sidebar::class, 'maybe_patch_jetpack_ai_sidebar_preview_data' ) ),
			'maybe_patch_jetpack_ai_sidebar_preview_data should be hooked when filter is true.'
		);
		$this->assertNotFalse(
			has_action( 'jetpack_register_gutenberg_extensions', array( Jetpack_AI_Sidebar::class, 'register_toolbar_button_extension' ) ),
			'register_toolbar_button_extension should be hooked when filter is true.'
		);
	}

	// ──────────────────────────────────────────────────
	// is_jetpack_ai_sidebar_preview_enabled() gate tests
	// ──────────────────────────────────────────────────

	/**
	 * The preview gate is closed on the wpcom platform when Big Sky is absent.
	 *
	 * Declared first in this section so it runs before any test that declares the
	 * Big_Sky stub (a class cannot be undeclared once it exists).
	 */
	public function test_preview_disabled_without_big_sky() {
		if ( class_exists( 'Big_Sky' ) ) {
			$this->markTestSkipped( 'Big_Sky was declared by an earlier test in this process and cannot be undeclared.' );
		}
		remove_all_filters( 'jetpack_ai_sidebar_enabled' );
		$this->simulate_wpcom_simple();

		$this->assertFalse( $this->gate_open() );
	}

	/**
	 * The preview gate is closed off the WordPress.com platform, even with Big Sky present.
	 */
	public function test_preview_disabled_on_self_hosted() {
		remove_all_filters( 'jetpack_ai_sidebar_enabled' );
		$this->simulate_self_hosted();
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '1' );

		$this->assertFalse( $this->gate_open() );
	}

	/**
	 * The preview gate is open on WordPress.com Simple with Big Sky present (defaults on).
	 */
	public function test_preview_enabled_on_wpcom_simple_with_big_sky() {
		remove_all_filters( 'jetpack_ai_sidebar_enabled' );
		$this->simulate_wpcom_simple();
		$this->simulate_big_sky_class();
		delete_option( 'big_sky_enable' );
		// big_sky_enable absent -> defaults to '1' on Simple.

		$this->assertTrue( $this->gate_open() );
	}

	/**
	 * The preview gate defaults closed on WoA/Atomic when big_sky_enable is absent.
	 */
	public function test_preview_disabled_on_atomic_when_setting_absent() {
		remove_all_filters( 'jetpack_ai_sidebar_enabled' );
		$this->simulate_wpcom_platform();
		$this->simulate_big_sky_class();
		delete_option( 'big_sky_enable' );
		// big_sky_enable absent -> defaults to '0' on WoA/Atomic.

		$this->assertFalse( $this->gate_open() );
	}

	/**
	 * The preview gate is closed when Big Sky is explicitly turned off.
	 */
	public function test_preview_disabled_when_big_sky_option_off() {
		remove_all_filters( 'jetpack_ai_sidebar_enabled' );
		$this->simulate_wpcom_simple();
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '0' );

		$this->assertFalse( $this->gate_open() );
	}

	/**
	 * The jetpack_ai_sidebar_enabled filter overrides the gate in both directions.
	 */
	public function test_preview_filter_overrides_gate() {
		// Gate is closed off-platform; the filter forces it on.
		remove_all_filters( 'jetpack_ai_sidebar_enabled' );
		$this->simulate_self_hosted();
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_true' );
		$this->assertTrue( $this->gate_open() );

		// Gate is open on Simple + Big Sky; the filter forces it off.
		remove_all_filters( 'jetpack_ai_sidebar_enabled' );
		$this->simulate_wpcom_simple();
		$this->simulate_big_sky_class();
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_false' );
		$this->assertFalse( $this->gate_open() );
	}

	// ──────────────────────────────────────────────────
	// Sidebar toolbar button tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that the toolbar button stays disabled until its preview feature is released.
	 */
	public function test_toolbar_button_disabled_by_default() {
		$this->set_block_editor_screen();

		$this->assertFalse( Jetpack_AI_Sidebar::is_toolbar_button_enabled() );
	}

	/**
	 * Test that the preview feature flag activates the toolbar button.
	 */
	public function test_toolbar_button_enabled_by_preview_feature_flag() {
		$this->set_block_editor_screen();
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			static function ( $features ) {
				$features['blockToolbarButton'] = true;
				return $features;
			}
		);

		$this->assertTrue( Jetpack_AI_Sidebar::is_toolbar_button_enabled() );
	}

	/**
	 * Test that the sidebar kill switch disables the toolbar button.
	 */
	public function test_toolbar_button_respects_sidebar_kill_switch() {
		$this->set_block_editor_screen();
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			static function ( $features ) {
				$features['blockToolbarButton'] = true;
				return $features;
			}
		);
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_false' );

		$this->assertFalse( Jetpack_AI_Sidebar::is_toolbar_button_enabled() );
	}

	/**
	 * Test that the active sidebar registers the toolbar button feature.
	 */
	public function test_register_toolbar_button_extension_marks_feature_available() {
		$this->set_block_editor_screen();
		$this->make_legacy_block_toolbar_extensions_available();
		$this->enable_sidebar_extension_availability_checks();
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_true' );
		add_filter( 'jetpack_ai_sidebar_preview_enabled', '__return_true' );
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			static function ( $features ) {
				$features['blockToolbarButton'] = true;
				return $features;
			}
		);

		Jetpack_AI_Sidebar::register_toolbar_button_extension();

		$this->assertTrue( \Jetpack_Gutenberg::is_available( AiAssistantPlugin\AI_SIDEBAR_TOOLBAR_BUTTON_EXTENSION ) );
		$this->assertTrue( \Jetpack_Gutenberg::is_available( 'ai-assistant-support' ) );
		$this->assertTrue( \Jetpack_Gutenberg::is_available( 'ai-assistant-image-extension' ) );
		$this->assertTrue( \Jetpack_Gutenberg::get_availability()[ AiAssistantPlugin\AI_SIDEBAR_TOOLBAR_BUTTON_EXTENSION ]['available'] );
	}

	/**
	 * Test that the toolbar button feature stays unavailable until the preview feature is released.
	 */
	public function test_register_toolbar_button_extension_skips_when_toolbar_button_disabled() {
		$this->set_block_editor_screen();
		$this->make_legacy_block_toolbar_extensions_available();
		$this->enable_sidebar_extension_availability_checks();
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			static function ( $features ) {
				$features['blockToolbarButton'] = false;
				return $features;
			}
		);

		Jetpack_AI_Sidebar::register_toolbar_button_extension();

		$this->assertFalse( \Jetpack_Gutenberg::is_available( AiAssistantPlugin\AI_SIDEBAR_TOOLBAR_BUTTON_EXTENSION ) );
		$availability = \Jetpack_Gutenberg::get_availability()[ AiAssistantPlugin\AI_SIDEBAR_TOOLBAR_BUTTON_EXTENSION ];
		$this->assertFalse( $availability['available'] );
		$this->assertSame( 'jetpack_ai_sidebar_feature_disabled', $availability['unavailable_reason'] );
	}

	/**
	 * Test that the toolbar button feature stays unavailable outside the post editor.
	 */
	public function test_register_toolbar_button_extension_skips_page_editor() {
		$this->set_page_block_editor_screen();
		$this->make_legacy_block_toolbar_extensions_available();
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			static function ( $features ) {
				$features['blockToolbarButton'] = true;
				return $features;
			}
		);

		Jetpack_AI_Sidebar::register_toolbar_button_extension();

		$this->assertFalse( \Jetpack_Gutenberg::is_available( AiAssistantPlugin\AI_SIDEBAR_TOOLBAR_BUTTON_EXTENSION ) );
		$this->assertTrue( \Jetpack_Gutenberg::is_available( 'ai-assistant-support' ) );
		$this->assertTrue( \Jetpack_Gutenberg::is_available( 'ai-assistant-image-extension' ) );
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
	 * The AI Editorial Review filter is decoupled from this Agents Manager entrypoint.
	 *
	 * The preview gate is wpcom/Big Sky-based, so turning AI Editorial Review off
	 * does not close the gate (AI Editorial Review only affects the exposed data).
	 */
	public function test_enable_agents_manager_in_post_editor_ignores_ai_editorial_review_filter() {
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );
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
	// add_agents_manager_data() tests
	// ──────────────────────────────────────────────────

	/**
	 * Platform-emitted Agents Manager data gets the AI Editorial Review flag.
	 */
	public function test_add_agents_manager_data_exposes_ai_editorial_review_enabled() {
		$this->set_block_editor_screen();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_true' );

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( 'wp-orchestrator', $data['agentId'] );
		$this->assertSame( true, $data['jetpackAiSidebar']['enabled'] );
		$this->assertSame( true, $data['jetpackAiSidebar']['features']['aiEditorialReview'] );
		$this->assertSame( true, $data['jetpackAiSidebar']['features']['blockTransformations'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['blockToolbarButton'] );
		// generateFeedback, proofreadContent, optimizeTitleSuggestion, seoSuggestions and excerptSuggestion are in development: off outside testing environments.
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['generateFeedback'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['proofreadContent'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['optimizeTitleSuggestion'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['seoSuggestions'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['excerptSuggestion'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['chatHistory'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['supportGuides'] );
	}

	/**
	 * Activate the seo-tools module for the duration of the test. SEO suggestions
	 * require it: the module registers the SEO meta fields the suggestions write to.
	 */
	private function activate_seo_tools_module(): void {
		add_filter(
			'jetpack_active_modules',
			static function ( $modules ) {
				$modules   = is_array( $modules ) ? $modules : array();
				$modules[] = 'seo-tools';
				return array_values( array_unique( $modules ) );
			}
		);
	}

	/**
	 * In an internal testing environment, the in-development suggestions (Generate
	 * Feedback, Proofreader, Optimize Title, SEO suggestions and the excerpt
	 * suggestion) are exposed. The test plan supports advanced-seo, and the
	 * seo-tools module is activated so the SEO suggestions gate is satisfied.
	 */
	public function test_add_agents_manager_data_exposes_in_development_features_in_testing_environment() {
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->activate_seo_tools_module();

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( true, $data['jetpackAiSidebar']['features']['generateFeedback'] );
		$this->assertSame( true, $data['jetpackAiSidebar']['features']['proofreadContent'] );
		$this->assertSame( true, $data['jetpackAiSidebar']['features']['optimizeTitleSuggestion'] );
		$this->assertSame( true, $data['jetpackAiSidebar']['features']['seoSuggestions'] );
		$this->assertSame( true, $data['jetpackAiSidebar']['features']['excerptSuggestion'] );
	}

	/**
	 * The generic preview features filter cannot expose in-development suggestions
	 * outside an internal testing environment.
	 */
	public function test_add_agents_manager_data_preview_features_filter_cannot_enable_in_development_features() {
		$this->set_block_editor_screen();
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			function ( $features ) {
				$features['generateFeedback']        = true;
				$features['proofreadContent']        = true;
				$features['optimizeTitleSuggestion'] = true;
				$features['seoSuggestions']          = true;
				$features['excerptSuggestion']       = true;
				return $features;
			}
		);

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( false, $data['jetpackAiSidebar']['features']['generateFeedback'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['proofreadContent'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['optimizeTitleSuggestion'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['seoSuggestions'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['excerptSuggestion'] );
	}

	/**
	 * The generic preview features filter can still disable the excerpt suggestion
	 * inside a testing environment (the gate raises the floor, not the ceiling).
	 */
	public function test_add_agents_manager_data_preview_features_filter_can_disable_excerpt_suggestion_in_testing_environment() {
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			function ( $features ) {
				$features['excerptSuggestion'] = false;
				return $features;
			}
		);

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( false, $data['jetpackAiSidebar']['features']['excerptSuggestion'] );
	}

	/**
	 * The generic preview features filter can still disable Optimize Title inside a
	 * testing environment (the gate raises the floor, not the ceiling).
	 */
	public function test_add_agents_manager_data_preview_features_filter_can_disable_optimize_title_in_testing_environment() {
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			function ( $features ) {
				$features['optimizeTitleSuggestion'] = false;
				return $features;
			}
		);

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( false, $data['jetpackAiSidebar']['features']['optimizeTitleSuggestion'] );
	}

	/**
	 * The generic preview features filter can still disable SEO suggestions inside a
	 * testing environment (the gate raises the floor, not the ceiling).
	 */
	public function test_add_agents_manager_data_preview_features_filter_can_disable_seo_suggestions_in_testing_environment() {
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->activate_seo_tools_module();
		add_filter(
			'jetpack_ai_sidebar_preview_features',
			function ( $features ) {
				$features['seoSuggestions'] = false;
				return $features;
			}
		);

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( false, $data['jetpackAiSidebar']['features']['seoSuggestions'] );
	}

	/**
	 * SEO suggestions require the seo-tools module: hidden even in a testing
	 * environment while the module is inactive, since the SEO meta fields the
	 * suggestions write to are not registered.
	 */
	public function test_seo_suggestions_disabled_when_seo_tools_module_inactive() {
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( false, $data['jetpackAiSidebar']['features']['seoSuggestions'] );
	}

	/**
	 * SEO suggestions respect the jetpack_disable_seo_tools kill switch — the same
	 * filter the seo-tools module enables when a conflicting SEO plugin owns the
	 * site's SEO.
	 */
	public function test_seo_suggestions_disabled_when_seo_tools_disabled_by_filter() {
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->activate_seo_tools_module();
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( false, $data['jetpackAiSidebar']['features']['seoSuggestions'] );
	}

	/**
	 * SEO suggestions respect the ai_seo_enhancer_enabled kill switch that disables
	 * the whole SEO Enhancer surface.
	 */
	public function test_seo_suggestions_disabled_when_seo_enhancer_disabled_by_filter() {
		$this->set_block_editor_screen();
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->activate_seo_tools_module();
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( false, $data['jetpackAiSidebar']['features']['seoSuggestions'] );
	}

	/**
	 * The Big Sky provider is preserved so the editor can fall back to the Big Sky
	 * sidebar when Jetpack AI Sidebar is unavailable. agentProviders passes through untouched.
	 */
	public function test_add_agents_manager_data_preserves_big_sky_provider() {
		$this->set_block_editor_screen();

		$providers = array(
			'https://example.com/wp-content/plugins/big-sky-plugin/build/calypso-agent-provider/index.js?ver=123',
			'https://widgets.wp.com/agents-manager/jetpack-ai-sidebar.provider.mjs',
			array( 'provider' => 'metadata' ),
		);

		$data = Jetpack_AI_Sidebar::add_agents_manager_data(
			array(
				'sectionName'    => 'gutenberg',
				'agentProviders' => $providers,
			)
		);

		$this->assertSame( $providers, $data['agentProviders'] );
	}

	/**
	 * Preview and AI Editorial Review have separate gates.
	 */
	public function test_add_agents_manager_data_allows_preview_without_ai_editorial_review() {
		$this->set_block_editor_screen();
		add_filter( 'jetpack_ai_editorial_review_enabled', '__return_false' );

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertSame( 'wp-orchestrator', $data['agentId'] );
		$this->assertSame( true, $data['jetpackAiSidebar']['enabled'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['aiEditorialReview'] );
		$this->assertSame( true, $data['jetpackAiSidebar']['features']['blockTransformations'] );
		$this->assertSame( false, $data['jetpackAiSidebar']['features']['blockToolbarButton'] );
	}

	/**
	 * Platform-emitted preview data is scoped to the post editor.
	 */
	public function test_add_agents_manager_data_skips_page_editor() {
		$this->set_page_block_editor_screen();

		$data = Jetpack_AI_Sidebar::add_agents_manager_data( array( 'sectionName' => 'gutenberg' ) );

		$this->assertArrayNotHasKey( 'agentId', $data );
		$this->assertArrayNotHasKey( 'jetpackAiSidebar', $data );
	}

	/**
	 * Invalid upstream filter data should pass through without a TypeError.
	 */
	public function test_add_agents_manager_data_ignores_non_array_data() {
		$this->assertNull( Jetpack_AI_Sidebar::add_agents_manager_data( null ) );
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

		// agentProviders is left untouched so the Big Sky provider survives as a fallback.
		$this->assertStringNotContainsString(
			'agentsManagerData.agentProviders',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'agentsManagerData.agentId = "wp-orchestrator"',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringContainsString(
			'agentsManagerData.jetpackAiSidebar = {"enabled":true',
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
			'agentsManagerData.jetpackAiSidebar',
			$this->get_agents_manager_inline_script()
		);
	}

	/**
	 * The external AM payload patch is gated by the preview surface.
	 */
	public function test_patch_jetpack_ai_sidebar_preview_data_skips_when_preview_disabled() {
		$this->set_block_editor_screen();
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_false' );
		wp_enqueue_script( 'agents-manager', 'https://example.com/am.js', array(), '1.0', true );
		wp_add_inline_script( 'agents-manager', 'const agentsManagerData = { sectionName: "gutenberg" };', 'before' );

		Jetpack_AI_Sidebar::maybe_patch_jetpack_ai_sidebar_preview_data();

		$this->assertStringNotContainsString(
			'agentsManagerData.agentId',
			$this->get_agents_manager_inline_script()
		);
		$this->assertStringNotContainsString(
			'agentsManagerData.jetpackAiSidebar',
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
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_false' );

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
		add_filter( 'jetpack_ai_sidebar_enabled', '__return_false' );

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
	 * Test full flow: init() wires the Agents Manager data filter so the
	 * payload emitted by the Agents Manager package receives Jetpack's
	 * preview fields.
	 */
	public function test_full_flow_injects_agents_manager_data() {
		$this->set_block_editor_screen();
		Jetpack_AI_Sidebar::init();

		$data = apply_filters(
			'jetpack_ai_sidebar_agents_manager_data',
			array( 'sectionName' => 'gutenberg' )
		);

		$this->assertSame( 'wp-orchestrator', $data['agentId'] );
		$this->assertSame( true, $data['jetpackAiSidebar']['enabled'] );
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
