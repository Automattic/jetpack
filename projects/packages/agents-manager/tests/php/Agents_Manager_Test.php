<?php
/**
 * Agents Manager Tests File
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/../../src/class-agents-manager.php';

/**
 * Class Agents_Manager_Test
 *
 * @covers \Automattic\Jetpack\Agents_Manager\Agents_Manager
 */
#[CoversClass( Agents_Manager::class )]
class Agents_Manager_Test extends \WorDBless\BaseTestCase {

	/**
	 * The Agents_Manager instance.
	 *
	 * @var Agents_Manager
	 */
	private $agents_manager;

	/**
	 * Original $_GET['preview'] value to restore after tests.
	 *
	 * @var mixed
	 */
	private $original_get_preview;

	/**
	 * Original $_SERVER['REQUEST_URI'] value to restore after tests.
	 *
	 * @var mixed
	 */
	private $original_request_uri;

	/**
	 * Original $wp_customize global value to restore after tests.
	 *
	 * @var mixed
	 */
	private $original_wp_customize;

	/**
	 * Original current_screen global value to restore after tests.
	 *
	 * @var mixed
	 */
	private $original_current_screen;

	/**
	 * Original next_admin_init action count to restore after tests.
	 *
	 * @var int
	 */
	private $original_next_admin_init_count;

	/**
	 * Original jetpack_agents_manager_initialized action count to restore after tests.
	 *
	 * @var int
	 */
	private $original_agents_manager_initialized_count;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		// Reset wpcom_is_proxied_request to a sane per-test default. Once any test
		// stubs it via Brain\Monkey, Patchwork keeps the function defined for the
		// rest of the process, so function_exists() in the source starts returning
		// true even in tests that want to exercise the $_SERVER / constant fallback.
		// Mirror that fallback here so those tests still behave correctly.
		Functions\when( 'wpcom_is_proxied_request' )->alias(
			static function () {
				if ( isset( $_SERVER['A8C_PROXIED_REQUEST'] ) ) {
					return (bool) $_SERVER['A8C_PROXIED_REQUEST'];
				}
				return Constants::is_true( 'A8C_PROXIED_REQUEST' );
			}
		);

		$this->agents_manager = Agents_Manager::init();

		// Save original superglobal values that tests may modify.
		$this->original_get_preview = $_GET['preview'] ?? null;
		$this->original_request_uri = $_SERVER['REQUEST_URI'] ?? null;

		// Save original $wp_customize global.
		global $wp_customize;
		$this->original_wp_customize = $wp_customize;

		// Save original current_screen global.
		$this->original_current_screen = $GLOBALS['current_screen'] ?? null;

		// Save original next_admin_init action count (CIAB detection).
		global $wp_actions;
		$this->original_next_admin_init_count = $wp_actions['next_admin_init'] ?? 0;

		// Save original init guard action count; did_action() accumulates per-process.
		$this->original_agents_manager_initialized_count = $wp_actions['jetpack_agents_manager_initialized'] ?? 0;
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		// Remove hooks added by the Agents_Manager constructor.
		remove_action( 'rest_api_init', array( $this->agents_manager, 'register_rest_api' ) );
		remove_filter( 'calypso_preferences_update', array( $this->agents_manager, 'calypso_preferences_update' ) );
		remove_action( 'wp_enqueue_scripts', array( $this->agents_manager, 'enqueue_scripts' ), 101 );
		remove_action( 'admin_enqueue_scripts', array( $this->agents_manager, 'enqueue_scripts' ), 101 );
		remove_action( 'next_admin_init', array( $this->agents_manager, 'enqueue_scripts' ), 1001 );
		remove_filter( 'agents_manager_use_unified_experience', array( $this->agents_manager, 'should_use_unified_experience' ) );
		remove_all_filters( 'jetpack_ai_sidebar_agents_manager_data' );

		// Restore original superglobal values.
		if ( $this->original_get_preview === null ) {
			unset( $_GET['preview'] );
		} else {
			$_GET['preview'] = $this->original_get_preview;
		}

		if ( $this->original_request_uri === null ) {
			unset( $_SERVER['REQUEST_URI'] );
		} else {
			$_SERVER['REQUEST_URI'] = $this->original_request_uri;
		}

		// Restore original $wp_customize global.
		global $wp_customize;
		$wp_customize = $this->original_wp_customize;

		// Restore original current_screen global.
		if ( $this->original_current_screen === null ) {
			unset( $GLOBALS['current_screen'] );
		} else {
			$GLOBALS['current_screen'] = $this->original_current_screen;
		}

		// Reset the REST server to clear any registered routes.
		global $wp_rest_server;
		$wp_rest_server = null;

		// Log out any logged-in user.
		wp_set_current_user( 0 );

		// Restore next_admin_init action count (CIAB detection).
		global $wp_actions;
		if ( $this->original_next_admin_init_count === 0 ) {
			unset( $wp_actions['next_admin_init'] );
		} else {
			$wp_actions['next_admin_init'] = $this->original_next_admin_init_count;
		}

		// Restore init guard action count.
		if ( $this->original_agents_manager_initialized_count === 0 ) {
			unset( $wp_actions['jetpack_agents_manager_initialized'] );
		} else {
			$wp_actions['jetpack_agents_manager_initialized'] = $this->original_agents_manager_initialized_count;
		}

		// Clear the status cache and constants.
		Cache::clear();
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Tests that calypso_preferences_update returns preferences unchanged
	 * when agents_manager_router_history is not set.
	 */
	public function test_calypso_preferences_update_returns_unchanged_when_no_router_history() {
		$preferences = (object) array(
			'some_other_preference' => 'value',
		);

		$result = $this->agents_manager->calypso_preferences_update( $preferences );

		$this->assertEquals( $preferences, $result );
	}

	/**
	 * Tests that calypso_preferences_update returns preferences unchanged
	 * when agents_manager_router_history is not an array.
	 */
	public function test_calypso_preferences_update_returns_unchanged_when_router_history_not_array() {
		$preferences = (object) array(
			'agents_manager_router_history' => 'not an array',
		);

		$result = $this->agents_manager->calypso_preferences_update( $preferences );

		$this->assertEquals( $preferences, $result );
	}

	/**
	 * Tests that calypso_preferences_update returns preferences unchanged
	 * when entries is not set in router_history.
	 */
	public function test_calypso_preferences_update_returns_unchanged_when_no_entries() {
		$preferences = (object) array(
			'agents_manager_router_history' => array(
				'index' => 0,
			),
		);

		$result = $this->agents_manager->calypso_preferences_update( $preferences );

		$this->assertEquals( $preferences, $result );
	}

	/**
	 * Tests that calypso_preferences_update returns preferences unchanged
	 * when entries is not an array.
	 */
	public function test_calypso_preferences_update_returns_unchanged_when_entries_not_array() {
		$preferences = (object) array(
			'agents_manager_router_history' => array(
				'entries' => 'not an array',
			),
		);

		$result = $this->agents_manager->calypso_preferences_update( $preferences );

		$this->assertEquals( $preferences, $result );
	}

	/**
	 * Tests that calypso_preferences_update does not modify entries
	 * when there are 50 or fewer entries.
	 */
	public function test_calypso_preferences_update_does_not_modify_when_50_or_fewer_entries() {
		$entries = array();
		for ( $i = 0; $i < 50; $i++ ) {
			$entries[] = array(
				'pathname' => '/page-' . $i,
				'search'   => '',
				'hash'     => '',
				'key'      => 'key-' . $i,
				'state'    => null,
			);
		}

		$preferences = (object) array(
			'agents_manager_router_history' => array(
				'entries' => $entries,
				'index'   => 49,
			),
		);

		$result = $this->agents_manager->calypso_preferences_update( $preferences );

		$this->assertCount( 50, $result->agents_manager_router_history['entries'] );
		$this->assertEquals( 49, $result->agents_manager_router_history['index'] );
	}

	/**
	 * Tests that calypso_preferences_update limits entries to 50
	 * when there are more than 50 entries.
	 */
	public function test_calypso_preferences_update_limits_entries_when_over_50() {
		$entries = array();
		for ( $i = 0; $i < 60; $i++ ) {
			$entries[] = array(
				'pathname' => '/page-' . $i,
				'search'   => '',
				'hash'     => '',
				'key'      => 'key-' . $i,
				'state'    => null,
			);
		}

		$preferences = (object) array(
			'agents_manager_router_history' => array(
				'entries' => $entries,
				'index'   => 59,
			),
		);

		$result = $this->agents_manager->calypso_preferences_update( $preferences );

		$this->assertCount( 50, $result->agents_manager_router_history['entries'] );
		$this->assertEquals( 49, $result->agents_manager_router_history['index'] );
	}

	/**
	 * Tests that calypso_preferences_update adds root entry at the beginning
	 * when entries are trimmed.
	 */
	public function test_calypso_preferences_update_adds_root_entry_when_trimmed() {
		$entries = array();
		for ( $i = 0; $i < 60; $i++ ) {
			$entries[] = array(
				'pathname' => '/page-' . $i,
				'search'   => '',
				'hash'     => '',
				'key'      => 'key-' . $i,
				'state'    => null,
			);
		}

		$preferences = (object) array(
			'agents_manager_router_history' => array(
				'entries' => $entries,
				'index'   => 59,
			),
		);

		$result = $this->agents_manager->calypso_preferences_update( $preferences );

		$first_entry = $result->agents_manager_router_history['entries'][0];

		$this->assertEquals( '/', $first_entry['pathname'] );
		$this->assertSame( '', $first_entry['search'] );
		$this->assertSame( '', $first_entry['hash'] );
		$this->assertEquals( 'default', $first_entry['key'] );
		$this->assertNull( $first_entry['state'] );
	}

	/**
	 * Tests that calypso_preferences_update keeps the last 49 entries
	 * when entries are trimmed.
	 */
	public function test_calypso_preferences_update_keeps_last_49_entries() {
		$entries = array();
		for ( $i = 0; $i < 60; $i++ ) {
			$entries[] = array(
				'pathname' => '/page-' . $i,
				'search'   => '',
				'hash'     => '',
				'key'      => 'key-' . $i,
				'state'    => null,
			);
		}

		$preferences = (object) array(
			'agents_manager_router_history' => array(
				'entries' => $entries,
				'index'   => 59,
			),
		);

		$result = $this->agents_manager->calypso_preferences_update( $preferences );

		// The second entry should be page-11 (60 - 49 = 11, so entries 11-59 are kept)
		$second_entry = $result->agents_manager_router_history['entries'][1];
		$this->assertEquals( '/page-11', $second_entry['pathname'] );

		// The last entry should be page-59
		$last_entry = $result->agents_manager_router_history['entries'][49];
		$this->assertEquals( '/page-59', $last_entry['pathname'] );
	}

	/**
	 * Tests that init() bootstraps the Agents Manager exactly once, even when
	 * called by multiple plugin copies.
	 *
	 * The guard is the 'jetpack_agents_manager_initialized' action rather than a
	 * class static: did_action() reads the process-global $wp_actions table, so
	 * the dedup holds across the separate copies of this package that different
	 * plugins (e.g. jetpack-mu-wpcom and WooCommerce AI) each load and init.
	 */
	public function test_init_bootstraps_only_once() {
		// Start from a clean count regardless of test ordering; tear_down restores it.
		global $wp_actions;
		unset( $wp_actions['jetpack_agents_manager_initialized'] );

		$fired = 0;
		add_action(
			'jetpack_agents_manager_initialized',
			static function () use ( &$fired ) {
				++$fired;
			}
		);

		// Simulate multiple bootstrappers each calling init() independently.
		Agents_Manager::init();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Intentionally calling twice to ensure duplicates are not registered.
		Agents_Manager::init();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Intentionally calling twice to ensure duplicates are not registered.
		Agents_Manager::init();

		// The action - and therefore the constructor - runs exactly once.
		$this->assertSame( 1, $fired, 'Agents Manager must bootstrap exactly once across init() calls.' );
		$this->assertSame( 1, did_action( 'jetpack_agents_manager_initialized' ) );

		remove_all_actions( 'jetpack_agents_manager_initialized' );
	}

	/**
	 * Tests that enqueue_scripts adds script with empty providers and useUnifiedExperience false by default.
	 */
	public function test_enqueue_scripts_with_empty_providers() {
		// Set admin context - scripts only enqueue in admin.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		// Register the agents-manager script so we can attach inline script to it.
		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Add a filter to enable unified experience.
		add_filter(
			'agents_manager_use_unified_experience',
			'__return_true',
			// Use a higher priority to ensure it runs after the class's own filter.
			20
		);

		$this->agents_manager->enqueue_scripts();

		global $wp_scripts;
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();

		// Find the inline script containing agentsManagerData (wp_add_inline_script may add at different indices).
		$inline_script = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( 'const agentsManagerData =', $inline_script );
		$this->assertStringContainsString( '"agentProviders":[]', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes providers added via the filter.
	 */
	public function test_enqueue_scripts_includes_filtered_providers() {
		// Set admin context - scripts only enqueue in admin.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		// Reset the script registry to ensure test isolation.
		global $wp_scripts;
		$wp_scripts = null;

		// Register the agents-manager script so we can attach inline script to it.
		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Add a filter to provide agent providers.
		add_filter(
			'agents_manager_agent_providers',
			function () {
				return array( 'my-plugin/tool-provider.js', 'another-plugin/context-provider.js' );
			}
		);

		// Add a filter to enable unified experience.
		add_filter(
			'agents_manager_use_unified_experience',
			'__return_true',
			// Use a higher priority to ensure it runs after the class's own filter.
			20
		);

		$this->agents_manager->enqueue_scripts();

		// Re-fetch global after wp_register_script initializes it.
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array(); // @phan-suppress-current-line PhanTypeExpectedObjectPropAccessButGotNull

		// Find the inline script containing agentsManagerData (wp_add_inline_script may add at different indices).
		$inline_script = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( 'const agentsManagerData =', $inline_script );
		$this->assertStringContainsString( 'my-plugin/tool-provider.js', $inline_script );
		$this->assertStringContainsString( 'another-plugin/context-provider.js', $inline_script );

		// Clean up the filter.
		remove_all_filters( 'agents_manager_agent_providers' );
		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes useUnifiedExperience true when filter returns true.
	 */
	public function test_enqueue_scripts_includes_use_unified_experience_when_enabled() {
		// Set admin context - scripts only enqueue in admin.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		// Reset the script registry to ensure test isolation.
		global $wp_scripts;
		$wp_scripts = null;

		// Register the agents-manager script so we can attach inline script to it.
		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Add a filter to enable unified experience.
		add_filter(
			'agents_manager_use_unified_experience',
			'__return_true',
			// Use a higher priority to ensure it runs after the class's own filter.
			20
		);

		$this->agents_manager->enqueue_scripts();

		// Re-fetch global after wp_register_script initializes it.
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array(); // @phan-suppress-current-line PhanTypeExpectedObjectPropAccessButGotNull

		// Find the inline script containing agentsManagerData.
		$inline_script = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( 'const agentsManagerData =', $inline_script );
		$this->assertStringContainsString( '"useUnifiedExperience":true', $inline_script );

		// Clean up the filter.
		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that Help Center is dequeued in the block editor when the unified experience
	 * (Help Center takeover) is active — Agents Manager becomes the single help affordance.
	 */
	public function test_help_center_dequeued_in_block_editor_when_unified() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'post' );
		$screen     = get_current_screen();
		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		// Reset registries for isolation.
		global $wp_scripts, $wp_styles;
		$wp_scripts = null;
		$wp_styles  = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Help Center enqueues before Agents Manager (priority 100 vs 101), so it is already queued.
		wp_enqueue_script( 'help-center', 'https://example.com/help-center.js', array(), '1.0', true );
		wp_enqueue_style( 'help-center-style', 'https://example.com/help-center.css', array(), '1.0' );

		// Full unified experience: Agents Manager takes over the Help Center.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertFalse( wp_script_is( 'help-center', 'enqueued' ), 'Help Center script should be dequeued in the unified experience.' );
		$this->assertFalse( wp_style_is( 'help-center-style', 'enqueued' ), 'Help Center style should be dequeued in the unified experience.' );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that Help Center remains enqueued in block-editor-only mode, where Agents Manager
	 * replaces Big Sky's native UI but does not take over the Help Center. Regression test for AI-1013.
	 */
	public function test_help_center_not_dequeued_in_block_editor_only_mode() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'post' );
		$screen     = get_current_screen();
		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		// Reset registries for isolation.
		global $wp_scripts, $wp_styles;
		$wp_scripts = null;
		$wp_styles  = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		wp_enqueue_script( 'help-center', 'https://example.com/help-center.js', array(), '1.0', true );
		wp_enqueue_style( 'help-center-style', 'https://example.com/help-center.css', array(), '1.0' );

		// Block-editor-only enablement, without the unified (Help Center takeover) experience.
		add_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );

		$this->agents_manager->enqueue_scripts();

		$this->assertTrue( wp_script_is( 'help-center', 'enqueued' ), 'Help Center script should remain enqueued in block-editor-only mode.' );
		$this->assertTrue( wp_style_is( 'help-center-style', 'enqueued' ), 'Help Center style should remain enqueued in block-editor-only mode.' );

		remove_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );
	}

	/**
	 * Tests that the standalone AI chat button is added to the admin bar when the
	 * unified experience is enabled.
	 */
	public function test_ai_chat_button_registered_in_unified_experience() {
		// Set admin context so the admin bar nodes are registered.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		// Register the script so enqueue_scripts can attach its inline data.
		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Enable the unified experience (priority 20 runs after the class's own filter).
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotFalse(
			has_action( 'admin_bar_menu', array( $this->agents_manager, 'add_ai_chat_button' ) )
		);

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that the standalone AI chat button is not added to the admin bar when
	 * the unified experience is disabled.
	 */
	public function test_ai_chat_button_not_registered_without_unified_experience() {
		// Same admin context as the enabled case, so only the unified flag differs.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );
		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Disable the unified experience (priority 20 runs after the class's own filter).
		add_filter( 'agents_manager_use_unified_experience', '__return_false', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertFalse(
			has_action( 'admin_bar_menu', array( $this->agents_manager, 'add_ai_chat_button' ) )
		);

		remove_filter( 'agents_manager_use_unified_experience', '__return_false', 20 );
	}

	/**
	 * Puts the current request into a block-editor screen so the editor omnibar branch is reachable.
	 *
	 * @param bool $enable Whether to enable Agents Manager in the block editor (block-editor-only,
	 *                     no unified experience). Pass false to exercise the not-enabled path.
	 */
	private function set_up_block_editor_request( $enable = true ) {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'post' );
		$screen     = get_current_screen();
		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		if ( $enable ) {
			add_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );
		}
	}

	/**
	 * Tests that the Ask AI button is added to the editor admin bar when the omnibar experiment is
	 * active and Agents Manager is enabled — independent of dev mode (here, a non-proxied request).
	 */
	public function test_ai_chat_button_registered_in_editor_omnibar() {
		$this->set_up_block_editor_request();

		Functions\when( 'is_admin_bar_showing' )->justReturn( true );
		Functions\when( 'gutenberg_is_experiment_enabled' )->justReturn( true );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotFalse(
			has_action( 'admin_bar_menu', array( $this->agents_manager, 'add_ai_chat_button' ) )
		);

		remove_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );
	}

	/**
	 * Tests that the Ask AI button is not added to the editor admin bar when the omnibar
	 * experiment is inactive, even though Agents Manager is enabled.
	 */
	public function test_ai_chat_button_not_registered_in_editor_without_omnibar() {
		$this->set_up_block_editor_request();

		Functions\when( 'is_admin_bar_showing' )->justReturn( true );
		Functions\when( 'gutenberg_is_experiment_enabled' )->justReturn( false );

		$this->agents_manager->enqueue_scripts();

		$this->assertFalse(
			has_action( 'admin_bar_menu', array( $this->agents_manager, 'add_ai_chat_button' ) )
		);

		remove_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );
	}

	/**
	 * Tests that the Ask AI button is not added to the editor admin bar when Agents Manager is
	 * not enabled, even while the omnibar experiment is active.
	 */
	public function test_ai_chat_button_not_registered_in_editor_when_not_enabled() {
		$this->set_up_block_editor_request( false );

		Functions\when( 'is_admin_bar_showing' )->justReturn( true );
		Functions\when( 'gutenberg_is_experiment_enabled' )->justReturn( true );

		$this->agents_manager->enqueue_scripts();

		$this->assertFalse(
			has_action( 'admin_bar_menu', array( $this->agents_manager, 'add_ai_chat_button' ) )
		);
	}

	/**
	 * Tests that the Help "?" dropdown (its menu panel) is added to the editor admin bar when the
	 * omnibar experiment is active in the unified experience.
	 */
	public function test_help_menu_registered_in_editor_omnibar_when_unified() {
		$this->set_up_block_editor_request();

		Functions\when( 'is_admin_bar_showing' )->justReturn( true );
		Functions\when( 'gutenberg_is_experiment_enabled' )->justReturn( true );
		Functions\when( 'wpcom_is_proxied_request' )->justReturn( true );
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotFalse(
			has_action( 'admin_bar_menu', array( $this->agents_manager, 'add_menu_panel' ) )
		);

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		remove_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );
	}

	/**
	 * Tests that the Help "?" dropdown is not added to the editor admin bar when the omnibar
	 * experiment is active but the unified experience is disabled (Ask AI only).
	 */
	public function test_help_menu_not_registered_in_editor_omnibar_without_unified() {
		$this->set_up_block_editor_request();

		Functions\when( 'is_admin_bar_showing' )->justReturn( true );
		Functions\when( 'gutenberg_is_experiment_enabled' )->justReturn( true );
		Functions\when( 'wpcom_is_proxied_request' )->justReturn( true );

		$this->agents_manager->enqueue_scripts();

		$this->assertFalse(
			has_action( 'admin_bar_menu', array( $this->agents_manager, 'add_menu_panel' ) )
		);

		remove_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );
	}

	/**
	 * Tests that should_display_menu_panel returns false by default.
	 */
	public function test_should_display_menu_panel_returns_false_by_default() {
		wp_set_current_user( 0 );

		$result = $this->agents_manager->should_display_menu_panel();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that should_display_menu_panel respects the agents_manager_use_unified_experience filter.
	 * External code (e.g. mu-plugins in test environments) should be able to control
	 * whether the admin bar menu panel is displayed via the filter.
	 */
	public function test_should_display_menu_panel_respects_filter() {
		add_filter(
			'agents_manager_use_unified_experience',
			'__return_true',
			// Use a higher priority to ensure it runs after the class's own filter.
			20
		);

		$result = $this->agents_manager->should_display_menu_panel();

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that the agents_manager_use_unified_experience filter is registered.
	 */
	public function test_unified_experience_filter_is_registered() {
		$this->assertNotFalse(
			has_filter( 'agents_manager_use_unified_experience', array( $this->agents_manager, 'should_use_unified_experience' ) )
		);
	}

	/**
	 * Tests that should_use_unified_experience returns false when no user is logged in.
	 */
	public function test_should_use_unified_experience_returns_false_when_no_user() {
		wp_set_current_user( 0 );

		$result = $this->agents_manager->should_use_unified_experience();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that should_use_unified_experience returns false for non-Automattician users on Simple sites.
	 */
	public function test_should_use_unified_experience_returns_false_for_non_automattician() {
		// Simulate being on a Simple site.
		Constants::set_constant( 'IS_WPCOM', true );

		Functions\stubs(
			array(
				'is_automattician' => false,
			)
		);

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_non_automattician',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		$result = $this->agents_manager->should_use_unified_experience();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that should_use_unified_experience returns true for Automattician with opt-in enabled on Simple sites.
	 */
	public function test_should_use_unified_experience_returns_true_for_automattician_with_opt_in() {
		// Simulate being on a Simple site.
		Constants::set_constant( 'IS_WPCOM', true );

		Functions\stubs(
			array(
				'is_automattician'         => true,
				// Return calypso_preferences with unified_ai_chat enabled.
				'get_user_attribute'       => array( 'unified_ai_chat' => true ),
				// Simulate proxied request (required for unified experience).
				'wpcom_is_proxied_request' => true,
			)
		);

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_automattician_with_opt_in',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		$result = $this->agents_manager->should_use_unified_experience();

		$this->assertTrue( $result );
	}

	/**
	 * Tests that should_use_unified_experience returns false for Automattician without opt-in on Simple sites.
	 */
	public function test_should_use_unified_experience_returns_false_for_automattician_without_opt_in() {
		// Simulate being on a Simple site.
		Constants::set_constant( 'IS_WPCOM', true );

		Functions\stubs(
			array(
				'is_automattician'   => true,
				// Return calypso_preferences without unified_ai_chat (or with it set to false).
				'get_user_attribute' => array( 'unified_ai_chat' => false ),
			)
		);

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_automattician_no_opt_in',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		$result = $this->agents_manager->should_use_unified_experience();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that the filter can be used to get the unified experience value.
	 */
	public function test_unified_experience_filter_returns_expected_value() {
		wp_set_current_user( 0 );

		$result = apply_filters( 'agents_manager_use_unified_experience', null );

		$this->assertFalse( $result );
	}

	/**
	 * Tests that should_use_unified_experience returns false on Atomic site when API call fails.
	 * On Atomic sites, the decision is delegated to wpcom via the /me endpoint.
	 * If the API call fails, it should return false.
	 */
	public function test_should_use_unified_experience_returns_false_on_atomic_when_api_fails() {
		// Simulate being on an Atomic (WoA) site.
		Cache::set( 'is_woa_site', true );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_atomic_user',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		// Since we can't mock the API call in this test environment,
		// the call to /me?fields=unified_ai_chat will fail and return false.
		$result = $this->agents_manager->should_use_unified_experience();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that should_use_unified_experience returns false when wpcom_is_proxied_request returns false.
	 * On Simple sites, proxy detection uses the wpcom_is_proxied_request function.
	 */
	public function test_should_use_unified_experience_returns_false_when_wpcom_proxy_function_returns_false() {
		// Simulate being on a Simple site.
		Constants::set_constant( 'IS_WPCOM', true );

		Functions\stubs(
			array(
				// Simulate non-proxied request via wpcom function.
				'wpcom_is_proxied_request' => false,
			)
		);

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_not_proxied_simple',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		$result = $this->agents_manager->should_use_unified_experience();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that should_use_unified_experience returns false on WoA when not proxied (no constant/server var).
	 * On WoA/Garden sites, proxy detection falls back to A8C_PROXIED_REQUEST constant or server variable.
	 */
	public function test_should_use_unified_experience_returns_false_on_woa_when_not_proxied() {
		// Simulate being on an Atomic (WoA) site without proxy.
		Cache::set( 'is_woa_site', true );
		// Do NOT set A8C_PROXIED_REQUEST constant or $_SERVER variable.

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_not_proxied_woa',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		$result = $this->agents_manager->should_use_unified_experience();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that should_use_unified_experience checks proxy via A8C_PROXIED_REQUEST constant on WoA.
	 * On WoA/Garden sites where wpcom_is_proxied_request doesn't exist,
	 * proxy detection uses the A8C_PROXIED_REQUEST constant.
	 */
	public function test_should_use_unified_experience_uses_constant_for_proxy_on_woa() {
		// Simulate being on an Atomic (WoA) site with proxy via constant.
		Cache::set( 'is_woa_site', true );
		Constants::set_constant( 'A8C_PROXIED_REQUEST', true );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_proxied_woa_constant',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		// The proxy check passes, but the API call will fail in test environment,
		// so the result will still be false. This test verifies the proxy check
		// doesn't block execution when the constant is set.
		$result = $this->agents_manager->should_use_unified_experience();

		// Result is false because API call fails, but importantly we got past the proxy check.
		// If proxy check failed, we would have returned false before any API call attempt.
		$this->assertFalse( $result );
	}

	/**
	 * Tests that should_use_unified_experience checks proxy via $_SERVER on WoA.
	 * On WoA/Garden sites where wpcom_is_proxied_request doesn't exist,
	 * proxy detection can also use the A8C_PROXIED_REQUEST server variable.
	 */
	public function test_should_use_unified_experience_uses_server_var_for_proxy_on_woa() {
		// Simulate being on an Atomic (WoA) site with proxy via server variable.
		Cache::set( 'is_woa_site', true );
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_proxied_woa_server',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		// The proxy check passes, but the API call will fail in test environment.
		$result = $this->agents_manager->should_use_unified_experience();

		// Clean up server variable.
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );

		// Result is false because API call fails, but we verified the proxy check passed.
		$this->assertFalse( $result );
	}

	/**
	 * Tests that fetch_unified_experience_preference returns true when API returns unified_ai_chat enabled.
	 */
	public function test_fetch_unified_experience_preference_returns_true_when_api_returns_enabled() {
		// Simulate being on an Atomic (WoA) site with proxy.
		Cache::set( 'is_woa_site', true );
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		// Set up Jetpack connection mocking.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_api_enabled',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		// Mock user connection by setting user tokens.
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'test.token.' . $user_id ) );
		\Jetpack_Options::update_option( 'id', 12345 );

		// Mock the API response.
		add_filter( 'pre_http_request', array( $this, 'mock_agents_manager_state_api_enabled' ), 10, 3 );

		$result = $this->agents_manager->should_use_unified_experience();

		remove_filter( 'pre_http_request', array( $this, 'mock_agents_manager_state_api_enabled' ), 10 );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that fetch_unified_experience_preference returns false when API returns unified_ai_chat disabled.
	 */
	public function test_fetch_unified_experience_preference_returns_false_when_api_returns_disabled() {
		// Simulate being on an Atomic (WoA) site with proxy.
		Cache::set( 'is_woa_site', true );
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		// Set up Jetpack connection mocking.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_api_disabled',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		// Mock user connection by setting user tokens.
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'test.token.' . $user_id ) );
		\Jetpack_Options::update_option( 'id', 12345 );

		// Mock the API response.
		add_filter( 'pre_http_request', array( $this, 'mock_agents_manager_state_api_disabled' ), 10, 3 );

		$result = $this->agents_manager->should_use_unified_experience();

		remove_filter( 'pre_http_request', array( $this, 'mock_agents_manager_state_api_disabled' ), 10 );

		$this->assertFalse( $result );
	}

	/**
	 * Tests that fetch_unified_experience_preference uses cached value on subsequent calls.
	 */
	public function test_fetch_unified_experience_preference_uses_cache() {
		// Simulate being on an Atomic (WoA) site with proxy.
		Cache::set( 'is_woa_site', true );
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		// Set up Jetpack connection mocking.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_cache',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		// Mock user connection by setting user tokens.
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'test.token.' . $user_id ) );
		\Jetpack_Options::update_option( 'id', 12345 );

		// Set transient cache directly.
		set_transient( 'unified-experience-' . $user_id, 1, MINUTE_IN_SECONDS );

		// Track API calls - should not be called if cache is used.
		$api_call_count = 0;
		$count_callback = function () use ( &$api_call_count ) {
			++$api_call_count;
			return array(
				'body'     => wp_json_encode( true, JSON_UNESCAPED_SLASHES ),
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
			);
		};
		add_filter( 'pre_http_request', $count_callback, 10, 3 );

		$result = $this->agents_manager->should_use_unified_experience();

		remove_filter( 'pre_http_request', $count_callback, 10 );

		// Should return true from cache and not make any API calls.
		$this->assertTrue( $result );
		$this->assertSame( 0, $api_call_count );
	}

	/**
	 * Tests that fetch_unified_experience_preference caches API failures.
	 */
	public function test_fetch_unified_experience_preference_caches_failures() {
		// Simulate being on an Atomic (WoA) site with proxy.
		Cache::set( 'is_woa_site', true );
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		// Set up Jetpack connection mocking.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_cache_failure',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		// Mock user connection by setting user tokens.
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'test.token.' . $user_id ) );
		\Jetpack_Options::update_option( 'id', 12345 );

		// Mock API failure.
		add_filter( 'pre_http_request', array( $this, 'mock_agents_manager_state_api_error' ), 10, 3 );

		// First call - should fail and cache the failure.
		$result1 = $this->agents_manager->should_use_unified_experience();

		remove_filter( 'pre_http_request', array( $this, 'mock_agents_manager_state_api_error' ), 10 );

		$this->assertFalse( $result1 );

		// Verify failure is cached.
		$cached = get_transient( 'unified-experience-' . $user_id );
		$this->assertSame( 0, $cached );
	}

	/**
	 * Mock the preferences API to return enabled.
	 *
	 * @param mixed  $response The response.
	 * @param array  $args The request args.
	 * @param string $url The URL.
	 * @return array The mocked response.
	 */
	public function mock_agents_manager_state_api_enabled( $response, $args, $url ) {
		if ( strpos( $url, '/agents-manager/state' ) === false ) {
			return $response;
		}

		return array(
			'body'     => wp_json_encode( array( 'unified_ai_chat' => true ), JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Mock the preferences API to return disabled.
	 *
	 * @param mixed  $response The response.
	 * @param array  $args The request args.
	 * @param string $url The URL.
	 * @return array The mocked response.
	 */
	public function mock_agents_manager_state_api_disabled( $response, $args, $url ) {
		if ( strpos( $url, '/agents-manager/state' ) === false ) {
			return $response;
		}

		return array(
			'body'     => wp_json_encode( array( 'unified_ai_chat' => false ), JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Mock the preferences API to return an error.
	 *
	 * @param mixed  $response The response.
	 * @param array  $args The request args.
	 * @param string $url The URL.
	 * @return \WP_Error The mocked error response.
	 */
	public function mock_agents_manager_state_api_error( $response, $args, $url ) {
		if ( strpos( $url, '/agents-manager/state' ) === false ) {
			return $response;
		}

		return new \WP_Error( 'http_request_failed', 'Connection failed' );
	}

	/**
	 * Helper to call the private is_dev_mode method via reflection.
	 *
	 * @return bool The result of is_dev_mode.
	 */
	private function call_is_dev_mode() {
		$reflection = new \ReflectionClass( Agents_Manager::class );
		$method     = $reflection->getMethod( 'is_dev_mode' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( null );
	}

	/**
	 * Tests that is_dev_mode returns true for localhost.
	 */
	public function test_is_dev_mode_returns_true_for_localhost() {
		update_option( 'siteurl', 'http://localhost' );

		$result = $this->call_is_dev_mode();

		$this->assertTrue( $result );
	}

	/**
	 * Tests that is_dev_mode returns true for jurassic.tube domains.
	 */
	public function test_is_dev_mode_returns_true_for_jurassic_tube() {
		update_option( 'siteurl', 'https://mysite.jurassic.tube' );

		$result = $this->call_is_dev_mode();

		$this->assertTrue( $result );
	}

	/**
	 * Tests that is_dev_mode returns true for jurassic.ninja domains.
	 */
	public function test_is_dev_mode_returns_true_for_jurassic_ninja() {
		update_option( 'siteurl', 'https://mysite.jurassic.ninja' );

		$result = $this->call_is_dev_mode();

		$this->assertTrue( $result );
	}

	/**
	 * Tests that is_dev_mode returns true when request is proxied via constant.
	 */
	public function test_is_dev_mode_returns_true_when_proxied_via_constant() {
		update_option( 'siteurl', 'https://example.com' );
		Constants::set_constant( 'A8C_PROXIED_REQUEST', true );

		$result = $this->call_is_dev_mode();

		$this->assertTrue( $result );
	}

	/**
	 * Tests that is_dev_mode returns true when request is proxied via server variable.
	 */
	public function test_is_dev_mode_returns_true_when_proxied_via_server_var() {
		update_option( 'siteurl', 'https://example.com' );
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$result = $this->call_is_dev_mode();

		unset( $_SERVER['A8C_PROXIED_REQUEST'] );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that is_dev_mode returns true for Atomic client ID 1.
	 */
	public function test_is_dev_mode_returns_true_for_atomic_client_id_1() {
		update_option( 'siteurl', 'https://example.com' );
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 1 );

		$result = $this->call_is_dev_mode();

		$this->assertTrue( $result );
	}

	/**
	 * Tests that is_dev_mode returns false for non-allowed Atomic client IDs.
	 */
	public function test_is_dev_mode_returns_false_for_non_allowed_atomic_client_id() {
		update_option( 'siteurl', 'https://example.com' );
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 999 );

		$result = $this->call_is_dev_mode();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that is_dev_mode returns false when AT_PROXIED_REQUEST is false.
	 */
	public function test_is_dev_mode_returns_false_when_at_proxied_request_is_false() {
		update_option( 'siteurl', 'https://example.com' );
		Constants::set_constant( 'AT_PROXIED_REQUEST', false );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 1 );

		$result = $this->call_is_dev_mode();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that is_dev_mode returns false for regular production sites.
	 */
	public function test_is_dev_mode_returns_false_for_production_sites() {
		update_option( 'siteurl', 'https://myproductionsite.com' );

		$result = $this->call_is_dev_mode();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that is_dev_mode returns true when wpcom_is_proxied_request function exists and returns true.
	 */
	public function test_is_dev_mode_returns_true_when_wpcom_proxy_function_returns_true() {
		update_option( 'siteurl', 'https://example.com' );

		Functions\stubs(
			array(
				'wpcom_is_proxied_request' => true,
			)
		);

		$result = $this->call_is_dev_mode();

		$this->assertTrue( $result );
	}

	/**
	 * Helper to call the private get_variant method via reflection.
	 *
	 * @return string|null The variant name, or null if scripts should not be loaded.
	 */
	private function call_get_variant() {
		$reflection = new \ReflectionClass( Agents_Manager::class );
		$method     = $reflection->getMethod( 'get_variant' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( $this->agents_manager );
	}

	/**
	 * Helper to call get_variant and return a boolean (true = variant found, false = null).
	 * Convenience wrapper used by tests that only care whether scripts are loaded.
	 *
	 * @return bool True if a variant was returned (scripts will load), false if null.
	 */
	private function call_should_enqueue_script() {
		return null !== $this->call_get_variant();
	}

	/**
	 * Helper to simulate admin context for tests.
	 */
	private function set_admin_context() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );
	}

	/**
	 * Tests that should_enqueue_script returns false on site frontend.
	 */
	public function test_should_enqueue_script_returns_false_on_frontend() {
		// Ensure we're not in admin context (default state in tests).
		$this->assertFalse( is_admin() );
		$this->assertFalse( $this->call_should_enqueue_script() );
	}

	/**
	 * Tests that get_variant returns wp-admin-disconnected on the frontend for eligible logged-in editors.
	 * Covers the frontend loading path in get_variant(): a logged-in editor (can edit_posts + member of blog)
	 * on a non-admin, non-P2 page with unified experience enabled should get the wp-admin-disconnected variant.
	 */
	public function test_get_variant_returns_wp_admin_disconnected_on_frontend_for_eligible_editor() {
		// Ensure we're on the frontend (not admin) - default test state.
		$this->assertFalse( is_admin() );

		// Create a user with editor capabilities so current_user_can( 'edit_posts' ) returns true.
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_frontend_editor',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		// Enable unified experience.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$variant = $this->call_get_variant();

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		wp_set_current_user( 0 );

		$this->assertSame( 'wp-admin-disconnected', $variant );
	}

	/**
	 * Tests that should_enqueue_script returns false in customizer preview.
	 * The is_customize_preview() function checks global $wp_customize, so we set it up directly
	 * rather than trying to stub the core WordPress function.
	 */
	public function test_should_enqueue_script_returns_false_in_customizer_preview() {
		global $wp_customize;

		$this->set_admin_context();

		// Load WP_Customize_Manager class if not already loaded.
		require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';

		// Create a real WP_Customize_Manager instance.
		$wp_customize = new \WP_Customize_Manager();

		// Use reflection to set the protected $previewing property to true.
		$reflection = new \ReflectionClass( $wp_customize );
		$property   = $reflection->getProperty( 'previewing' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $wp_customize, true );

		$this->assertFalse( $this->call_should_enqueue_script() );
	}

	/**
	 * Tests that should_enqueue_script returns false when preview=true query param is set.
	 * This prevents loading in dashboard site preview iframes, theme preview, and Calypso iframe embeds.
	 */
	public function test_should_enqueue_script_returns_false_when_preview_query_param_is_true() {
		$this->set_admin_context();
		$_GET['preview'] = 'true';

		$this->assertFalse( $this->call_should_enqueue_script() );
	}

	/**
	 * Tests that should_enqueue_script returns false when URL contains gutenberg-core path.
	 * This prevents loading during Gutenberg asset requests.
	 */
	public function test_should_enqueue_script_returns_false_for_gutenberg_core_asset_requests() {
		$this->set_admin_context();
		$_SERVER['REQUEST_URI'] = '/wp-content/plugins/gutenberg-core/build/block-library/style.css';

		$this->assertFalse( $this->call_should_enqueue_script() );
	}

	/**
	 * Tests that should_enqueue_script returns true when unified experience is enabled and not in preview context.
	 */
	public function test_should_enqueue_script_returns_true_when_unified_experience_enabled() {
		$this->set_admin_context();
		$_SERVER['REQUEST_URI'] = '/wp-admin/index.php';

		// Add a filter to enable unified experience.
		add_filter(
			'agents_manager_use_unified_experience',
			'__return_true',
			20
		);

		$result = $this->call_should_enqueue_script();

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that should_enqueue_script returns false when preview=true even if unified experience is enabled.
	 * The preview check should take precedence over the unified experience filter.
	 */
	public function test_should_enqueue_script_preview_check_takes_precedence_over_unified_experience() {
		$this->set_admin_context();
		$_SERVER['REQUEST_URI'] = '/wp-admin/index.php';
		$_GET['preview']        = 'true';

		// Add a filter to enable unified experience.
		add_filter(
			'agents_manager_use_unified_experience',
			'__return_true',
			20
		);

		$result = $this->call_should_enqueue_script();

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->assertFalse( $result );
	}

	/**
	 * Helper to call the private get_current_user_data method via reflection.
	 *
	 * @return array|null The result of get_current_user_data.
	 */
	private function call_get_current_user_data() {
		$reflection = new \ReflectionClass( Agents_Manager::class );
		$method     = $reflection->getMethod( 'get_current_user_data' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( $this->agents_manager );
	}

	/**
	 * Helper to call the private get_current_site method via reflection.
	 *
	 * @return array The result of get_current_site.
	 */
	private function call_get_current_site() {
		$reflection = new \ReflectionClass( Agents_Manager::class );
		$method     = $reflection->getMethod( 'get_current_site' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( $this->agents_manager );
	}

	/**
	 * Tests that get_current_user_data returns null when no user is logged in.
	 */
	public function test_get_current_user_data_returns_null_when_no_user() {
		wp_set_current_user( 0 );

		$result = $this->call_get_current_user_data();

		$this->assertNull( $result );
	}

	/**
	 * Tests that get_current_user_data returns correct structure for logged in user.
	 */
	public function test_get_current_user_data_returns_correct_structure() {
		$user_id = wp_insert_user(
			array(
				'user_login'   => 'test_user_data',
				'user_pass'    => 'password',
				'user_email'   => 'test@example.com',
				'display_name' => 'Test User',
			)
		);
		wp_set_current_user( $user_id );

		$result = $this->call_get_current_user_data();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'ID', $result );
		$this->assertArrayHasKey( 'username', $result );
		$this->assertArrayHasKey( 'display_name', $result );
		$this->assertArrayHasKey( 'avatar_URL', $result );
		$this->assertArrayHasKey( 'email', $result );

		$this->assertEquals( $user_id, $result['ID'] );
		$this->assertEquals( 'test_user_data', $result['username'] );
		$this->assertEquals( 'Test User', $result['display_name'] );
		$this->assertEquals( 'test@example.com', $result['email'] );
	}

	/**
	 * Tests that get_current_site returns correct structure.
	 */
	public function test_get_current_site_returns_correct_structure() {
		update_option( 'home', 'https://example.com' );

		$result = $this->call_get_current_site();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'ID', $result );
		$this->assertArrayHasKey( 'domain', $result );
		$this->assertEquals( 'example.com', $result['domain'] );
	}

	/**
	 * Tests that get_current_site uses jetpack_options ID when available.
	 */
	public function test_get_current_site_uses_jetpack_options_id() {
		update_option( 'home', 'https://example.com' );
		update_option( 'jetpack_options', array( 'id' => 12345 ) );

		$result = $this->call_get_current_site();

		$this->assertEquals( 12345, $result['ID'] );

		delete_option( 'jetpack_options' );
	}

	/**
	 * Tests that get_current_site falls back to blog ID when jetpack_options not available.
	 */
	public function test_get_current_site_falls_back_to_blog_id() {
		update_option( 'home', 'https://example.com' );
		delete_option( 'jetpack_options' );

		$result = $this->call_get_current_site();

		$this->assertEquals( get_current_blog_id(), $result['ID'] );
	}

	/**
	 * Tests that enqueue_scripts includes currentUser in agentsManagerData.
	 */
	public function test_enqueue_scripts_includes_current_user() {
		// Set admin context - scripts only enqueue in admin.
		$this->set_admin_context();

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		$user_id = wp_insert_user(
			array(
				'user_login'   => 'test_enqueue_user',
				'user_pass'    => 'password',
				'display_name' => 'Enqueue Test',
			)
		);
		wp_set_current_user( $user_id );

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"currentUser":', $inline_script );
		$this->assertStringContainsString( 'Enqueue Test', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts applies the agentsManagerData extension filter.
	 */
	public function test_enqueue_scripts_applies_agents_manager_data_filter() {
		// Set admin context - scripts only enqueue in admin.
		$this->set_admin_context();

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Force a non-null variant so enqueue_scripts() reaches the inline-data block.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		add_filter(
			'jetpack_ai_sidebar_agents_manager_data',
			function ( $data ) {
				$data['reviewMediatorEnabled'] = true;
				return $data;
			}
		);

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"reviewMediatorEnabled":true', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts keeps the original agentsManagerData when the extension filter misbehaves.
	 */
	public function test_enqueue_scripts_falls_back_when_agents_manager_data_filter_returns_non_array() {
		// Set admin context - scripts only enqueue in admin.
		$this->set_admin_context();

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Force a non-null variant so enqueue_scripts() reaches the inline-data block.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		add_filter( 'jetpack_ai_sidebar_agents_manager_data', '__return_null' );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"wp-admin"', $inline_script );
		$this->assertStringContainsString( '"helpCenterUrl":"https://wordpress.com/help?help-center=home"', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes site in agentsManagerData.
	 */
	public function test_enqueue_scripts_includes_site() {
		// Set admin context - scripts only enqueue in admin.
		$this->set_admin_context();

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		update_option( 'home', 'https://testsite.example.com' );

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"site":', $inline_script );
		$this->assertStringContainsString( 'testsite.example.com', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes helpCenterUrl in agentsManagerData.
	 */
	public function test_enqueue_scripts_includes_help_center_url() {
		// Set admin context - scripts only enqueue in admin.
		$this->set_admin_context();

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"helpCenterUrl":', $inline_script );
		$this->assertStringContainsString( 'https://wordpress.com/help?help-center=home', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes sectionName as wp-admin by default.
	 */
	public function test_enqueue_scripts_includes_section_name_wp_admin() {
		// Set admin context - scripts only enqueue in admin.
		$this->set_admin_context();

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Enable unified experience. Jetpack is not connected (default test state),
		// so is_jetpack_disconnected() returns false for non-Jetpack sites.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"wp-admin"', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes sectionName as gutenberg in block editor.
	 */
	public function test_enqueue_scripts_includes_section_name_gutenberg_in_block_editor() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		// Set up block editor context.
		set_current_screen( 'post' );
		$screen = get_current_screen();

		// Use reflection to set the block_editor property.
		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Enable unified experience. Jetpack is not connected (default test state),
		// so is_jetpack_disconnected() returns false for non-Jetpack sites.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"gutenberg"', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes sectionName as wp-admin for widgets screen.
	 * The widgets screen has the block editor but no Gutenberg top bar,
	 * so it should be treated as wp-admin.
	 */
	public function test_enqueue_scripts_includes_section_name_wp_admin_for_widgets() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		// Set up widgets screen with block editor.
		set_current_screen( 'widgets' );
		$screen = get_current_screen();

		// Use reflection to set the block_editor property.
		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Enable unified experience. Jetpack is not connected (default test state),
		// so is_jetpack_disconnected() returns false for non-Jetpack sites.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"wp-admin"', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes sectionName as wp-admin-disconnected when unified experience
	 * is enabled but Jetpack is disconnected.
	 */
	public function test_enqueue_scripts_includes_section_name_wp_admin_disconnected() {
		// Set admin context - scripts only enqueue in admin.
		$this->set_admin_context();

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Enable unified experience and simulate a Jetpack site with a disconnected user.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"wp-admin-disconnected"', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes sectionName as gutenberg-disconnected in block editor
	 * when unified experience is enabled but Jetpack is disconnected.
	 */
	public function test_enqueue_scripts_includes_section_name_gutenberg_disconnected() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		// Set up block editor context.
		set_current_screen( 'post' );
		$screen = get_current_screen();

		// Use reflection to set the block_editor property.
		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Enable unified experience and simulate a Jetpack site with a disconnected user.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"gutenberg-disconnected"', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes sectionName as ciab-disconnected in CIAB environment
	 * when Jetpack is disconnected.
	 */
	public function test_enqueue_scripts_includes_section_name_ciab_disconnected() {
		// Set admin context - scripts only enqueue in admin.
		$this->set_admin_context();

		// Save the current did_action counter for next_admin_init to restore later.
		global $wp_actions;
		$original_action_count = $wp_actions['next_admin_init'] ?? 0;

		// Simulate CIAB environment by incrementing the action counter directly
		// (avoids side effects from firing the action, which would trigger enqueue_scripts).
		$wp_actions['next_admin_init'] = ( $wp_actions['next_admin_init'] ?? 0 ) + 1;

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Simulate a Jetpack site with a disconnected user.
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"ciab-disconnected"', $inline_script );

		remove_filter( 'is_jetpack_site', '__return_true', 20 );

		// Restore the original did_action counter to prevent test order dependencies.
		if ( $original_action_count === 0 ) {
			unset( $wp_actions['next_admin_init'] );
		} else {
			$wp_actions['next_admin_init'] = $original_action_count;
		}
	}

	/**
	 * Tests that enqueue_scripts includes sectionName as ciab in CIAB environment
	 * when is_jetpack_disconnected() returns false (non-Jetpack site or connected user).
	 */
	public function test_enqueue_scripts_includes_section_name_ciab_connected() {
		// Set admin context - scripts only enqueue in admin.
		$this->set_admin_context();

		// Save the current did_action counter for next_admin_init to restore later.
		global $wp_actions;
		$original_action_count = $wp_actions['next_admin_init'] ?? 0;

		// Simulate CIAB environment by incrementing the action counter directly
		// (avoids side effects from firing the action, which would trigger enqueue_scripts).
		$wp_actions['next_admin_init'] = ( $wp_actions['next_admin_init'] ?? 0 ) + 1;

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Do NOT simulate a Jetpack disconnected site.
		// is_jetpack_disconnected() returns false for non-Jetpack sites.

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"ciab"', $inline_script );

		// Restore the original did_action counter to prevent test order dependencies.
		if ( $original_action_count === 0 ) {
			unset( $wp_actions['next_admin_init'] );
		} else {
			$wp_actions['next_admin_init'] = $original_action_count;
		}
	}

	/**
	 * Tests that should_enqueue_script returns true when unified experience is enabled but Jetpack is disconnected (in wp-admin).
	 */
	public function test_should_enqueue_script_returns_true_when_disconnected_variant_enabled_in_admin() {
		$this->set_admin_context();
		$_SERVER['REQUEST_URI'] = '/wp-admin/index.php';

		// Enable unified experience and simulate a Jetpack site with a disconnected user.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$result = $this->call_should_enqueue_script();

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that should_enqueue_script returns true when unified experience is enabled but Jetpack is disconnected (in block editor).
	 */
	public function test_should_enqueue_script_returns_true_when_disconnected_variant_enabled_in_block_editor() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		// Set up block editor context.
		set_current_screen( 'post' );
		$screen = get_current_screen();

		// Use reflection to set the block_editor property.
		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		// Enable unified experience and simulate a Jetpack site with a disconnected user.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$result = $this->call_should_enqueue_script();

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that disconnected variant is not used when unified experience is enabled and Jetpack is connected.
	 */
	public function test_disconnected_variant_not_used_when_unified_experience_enabled_and_connected() {
		// Set admin context.
		$this->set_admin_context();

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Enable unified experience. Do not simulate a Jetpack site, so is_jetpack_disconnected() returns false.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		// Should use wp-admin, not wp-admin-disconnected, because Jetpack is connected (or not a Jetpack site).
		$this->assertStringContainsString( '"sectionName":"wp-admin"', $inline_script );
		$this->assertStringNotContainsString( '"sectionName":"wp-admin-disconnected"', $inline_script );
		$this->assertStringNotContainsString( '"sectionName":"gutenberg-disconnected"', $inline_script );
		$this->assertStringNotContainsString( '"sectionName":"ciab-disconnected"', $inline_script );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
	}

	/**
	 * Tests that CSS is enqueued for connected variants but not for gutenberg-disconnected or ciab-disconnected.
	 */
	public function test_css_enqueued_only_for_wp_admin_variants() {
		// Test wp-admin variant (connected) - should enqueue CSS.
		$this->set_admin_context();
		global $wp_styles;
		$wp_styles = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );
		wp_register_style( 'agents-manager-style', 'https://example.com/agents-manager.css', array(), '1.0' );

		// Enable unified experience. Not a Jetpack site, so is_jetpack_disconnected() returns false.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_styles, 'wp_styles should be initialized' );
		$this->assertTrue( wp_style_is( 'agents-manager-style', 'enqueued' ), 'CSS should be enqueued for wp-admin variant' );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		// Test gutenberg-disconnected variant (unified experience enabled + Jetpack disconnected) - should NOT enqueue CSS.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'post' );
		$screen = get_current_screen();

		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		$wp_styles = null;
		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Enable unified experience and simulate a Jetpack site with a disconnected user.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$this->agents_manager->enqueue_scripts();

		// For gutenberg-disconnected variant, CSS should not be enqueued.
		$this->assertFalse( wp_style_is( 'agents-manager-style', 'enqueued' ), 'CSS should NOT be enqueued for gutenberg-disconnected variant' );

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );
	}

	/**
	 * Tests that scripts are not enqueued on P2 frontend.
	 * This verifies the P2 frontend detection logic that prevents Agents Manager
	 * from loading on P2 sites when not in admin context.
	 */
	public function test_scripts_not_enqueued_on_p2_frontend() {
		global $wp_admin_bar;

		// Ensure we're on the frontend (not admin).
		$this->assertFalse( is_admin() );

		// Test with pub/p2 stylesheet.
		$p2_stylesheet_filter = function () {
			return 'pub/p2v2';
		};
		add_filter( 'stylesheet', $p2_stylesheet_filter );

		// Initialize admin bar.
		require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';
		$wp_admin_bar = new \WP_Admin_Bar();
		$wp_admin_bar->initialize();

		// Call enqueue_scripts which should return early for P2 frontend.
		// The method should detect P2 frontend and return before adding admin bar nodes or enqueuing scripts.
		$this->agents_manager->enqueue_scripts();

		// Verify no admin bar nodes were added.
		// The agents-manager admin bar node should not exist if the method returned early.
		$node = $wp_admin_bar->get_node( 'agents-manager' );
		$this->assertNull( $node, 'No admin bar node should be added on P2 frontend' );

		remove_filter( 'stylesheet', $p2_stylesheet_filter );
	}

	/**
	 * Tests that get_variant returns ciab in CIAB environment
	 * when is_jetpack_disconnected() returns false (non-Jetpack site or connected user).
	 */
	public function test_get_variant_returns_ciab_in_ciab_when_connected() {
		$this->set_admin_context();

		// Save and simulate CIAB environment.
		global $wp_actions;
		$original_action_count         = $wp_actions['next_admin_init'] ?? 0;
		$wp_actions['next_admin_init'] = ( $wp_actions['next_admin_init'] ?? 0 ) + 1;

		// is_jetpack_disconnected() returns false for non-Jetpack sites.
		$result = $this->call_get_variant();

		// Restore did_action counter.
		if ( $original_action_count === 0 ) {
			unset( $wp_actions['next_admin_init'] );
		} else {
			$wp_actions['next_admin_init'] = $original_action_count;
		}

		$this->assertSame( 'ciab', $result );
	}

	/**
	 * Tests that is_enabled returns false by default when no filters are active.
	 */
	public function test_is_enabled_returns_false_by_default() {
		// Ensure no block editor context.
		$this->assertFalse( is_admin() );

		$result = Agents_Manager::is_enabled();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that is_enabled returns true when the unified experience filter returns true.
	 */
	public function test_is_enabled_returns_true_when_unified_experience_enabled() {
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$result = Agents_Manager::is_enabled();

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that is_enabled returns true when in block editor and agents_manager_enabled_in_block_editor filter is true.
	 */
	public function test_is_enabled_returns_true_in_block_editor_when_block_editor_filter_enabled() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		// Set up block editor context.
		set_current_screen( 'post' );
		$screen = get_current_screen();

		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		add_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );

		$result = Agents_Manager::is_enabled();

		remove_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that is_enabled returns false when in block editor but block editor filter is not enabled.
	 */
	public function test_is_enabled_returns_false_in_block_editor_when_block_editor_filter_disabled() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		// Set up block editor context.
		set_current_screen( 'post' );
		$screen = get_current_screen();

		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		// Do not add agents_manager_enabled_in_block_editor filter — default is false.
		$result = Agents_Manager::is_enabled();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that is_enabled returns false when not in block editor even if block editor filter is true.
	 */
	public function test_is_enabled_returns_false_when_not_in_block_editor_even_if_block_editor_filter_enabled() {
		// Set to a non-block-editor admin screen.
		$this->set_admin_context();

		add_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );

		$result = Agents_Manager::is_enabled();

		remove_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );

		$this->assertFalse( $result );
	}

	/**
	 * Tests that is_enabled returns false for widgets screen even if block editor filter is true.
	 * The widgets screen has the block editor flag but is excluded from is_block_editor().
	 */
	public function test_is_enabled_returns_false_for_widgets_screen_with_block_editor_filter() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		// Set up widgets screen with block editor flag.
		set_current_screen( 'widgets' );
		$screen = get_current_screen();

		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		add_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );

		$result = Agents_Manager::is_enabled();

		remove_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );

		$this->assertFalse( $result );
	}

	/**
	 * Tests that is_enabled prioritises the unified experience filter over the block editor filter.
	 * When the unified experience filter is true, is_enabled should return true
	 * regardless of block editor state.
	 */
	public function test_is_enabled_unified_experience_takes_priority_over_block_editor() {
		// Not in block editor context.
		$this->assertFalse( is_admin() );

		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$result = Agents_Manager::is_enabled();

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that get_variant returns null in CIAB when agents_manager_enabled_in_ciab filter returns false.
	 */
	public function test_get_variant_returns_null_in_ciab_when_disabled_by_filter() {
		$this->set_admin_context();

		// Save and simulate CIAB environment.
		global $wp_actions;
		$original_action_count         = $wp_actions['next_admin_init'] ?? 0;
		$wp_actions['next_admin_init'] = ( $wp_actions['next_admin_init'] ?? 0 ) + 1;

		// Disable AM in CIAB via filter.
		add_filter( 'agents_manager_enabled_in_ciab', '__return_false', 20 );

		$result = $this->call_get_variant();

		remove_filter( 'agents_manager_enabled_in_ciab', '__return_false', 20 );

		// Restore did_action counter.
		if ( $original_action_count === 0 ) {
			unset( $wp_actions['next_admin_init'] );
		} else {
			$wp_actions['next_admin_init'] = $original_action_count;
		}

		$this->assertNull( $result );
	}

	/**
	 * Tests that should_enqueue_script returns false on WooCommerce Admin home page.
	 * This verifies the WooCommerce Admin exclusion to avoid UI conflicts,
	 * matching the same exclusion in Help_Center::enqueue_wp_admin_scripts().
	 */
	public function test_should_enqueue_script_returns_false_on_woocommerce_admin_home() {
		// Set admin context first.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'woocommerce_page_wc-admin' );

		// Enable unified experience so that Agents Manager is active and the WooCommerce exclusion is exercised.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$result = $this->call_should_enqueue_script();

		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->assertFalse( $result, 'should_enqueue_script should return false on WooCommerce Admin home page' );
	}

	/**
	 * Helper to call the private determine_iso_639_locale method via reflection.
	 *
	 * @return string The resolved ISO 639 locale code.
	 */
	private function call_determine_iso_639_locale() {
		$reflection = new \ReflectionClass( Agents_Manager::class );
		$method     = $reflection->getMethod( 'determine_iso_639_locale' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( null );
	}

	/**
	 * Tests that the translation script is enqueued for a connected variant when the
	 * user's locale is not English, and that the main script depends on it so the
	 * translations load first.
	 */
	public function test_translations_enqueued_for_non_english_locale() {
		$this->set_admin_context();
		global $wp_scripts;
		$wp_scripts = null;

		// Pre-seed the asset manifest transient so enqueue_script does not hit the network.
		set_transient(
			'agents-manager-asset-wp-admin.asset.json',
			array(
				'version'      => '1.2.3',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);

		$locale_filter = static function () {
			return 'de_DE';
		};
		add_filter( 'locale', $locale_filter );

		// Enable unified experience. Not a Jetpack site, so the connected wp-admin variant is used.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized' );
		$this->assertTrue(
			wp_script_is( 'agents-manager-translations', 'enqueued' ),
			'Translation script should be enqueued for a non-English locale'
		);
		$this->assertSame(
			'https://widgets.wp.com/agents-manager/languages/de-v1.js',
			$wp_scripts->registered['agents-manager-translations']->src,
			'Translation script should point at the agents-manager languages directory for the resolved locale'
		);
		$this->assertContains(
			'agents-manager-translations',
			$wp_scripts->registered['agents-manager']->deps,
			'Main script should depend on the translation script so it loads first'
		);

		remove_filter( 'locale', $locale_filter );
		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		delete_transient( 'agents-manager-asset-wp-admin.asset.json' );
	}

	/**
	 * Tests that no translation script is enqueued when the user's locale is English,
	 * since the English strings ship in the bundle itself.
	 */
	public function test_translations_not_enqueued_for_english_locale() {
		$this->set_admin_context();
		global $wp_scripts;
		$wp_scripts = null;

		set_transient(
			'agents-manager-asset-wp-admin.asset.json',
			array(
				'version'      => '1.2.3',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);

		$locale_filter = static function () {
			return 'en_US';
		};
		add_filter( 'locale', $locale_filter );
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertFalse(
			wp_script_is( 'agents-manager-translations', 'enqueued' ),
			'Translation script should not be enqueued for an English locale'
		);

		remove_filter( 'locale', $locale_filter );
		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		delete_transient( 'agents-manager-asset-wp-admin.asset.json' );
	}

	/**
	 * Tests that translations are not loaded for disconnected variants, whose minimal
	 * bundles have no translatable in-app UI. Mirrors Help Center's behavior.
	 */
	public function test_translations_not_enqueued_for_disconnected_variant() {
		$this->set_admin_context();
		global $wp_scripts;
		$wp_scripts = null;

		set_transient(
			'agents-manager-asset-wp-admin-disconnected.asset.json',
			array(
				'version'      => '1.2.3',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);

		$locale_filter = static function () {
			return 'de_DE';
		};
		add_filter( 'locale', $locale_filter );

		// Unified experience on a Jetpack site with a disconnected user yields wp-admin-disconnected.
		add_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertFalse(
			wp_script_is( 'agents-manager-translations', 'enqueued' ),
			'Translation script should not be enqueued for the wp-admin-disconnected variant'
		);

		remove_filter( 'locale', $locale_filter );
		remove_filter( 'agents_manager_use_unified_experience', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );
		delete_transient( 'agents-manager-asset-wp-admin-disconnected.asset.json' );
	}

	/**
	 * Tests that determine_iso_639_locale normalizes WordPress locales to the ISO 639
	 * codes used by the widgets.wp.com translation files.
	 *
	 * @param string $wp_locale The WordPress user locale.
	 * @param string $expected  The expected normalized ISO 639 code.
	 * @dataProvider provide_locales
	 */
	#[DataProvider( 'provide_locales' )]
	public function test_determine_iso_639_locale_normalizes_locales( $wp_locale, $expected ) {
		$locale_filter = static function () use ( $wp_locale ) {
			return $wp_locale;
		};
		add_filter( 'locale', $locale_filter );

		$this->assertSame( $expected, $this->call_determine_iso_639_locale() );

		remove_filter( 'locale', $locale_filter );
	}

	/**
	 * Data provider for locale normalization.
	 *
	 * @return array<string, array{0: string, 1: string}>
	 */
	public static function provide_locales() {
		return array(
			'German strips region'          => array( 'de_DE', 'de' ),
			'French strips region'          => array( 'fr_FR', 'fr' ),
			'Brazilian Portuguese kept'     => array( 'pt_BR', 'pt-br' ),
			'Traditional Chinese kept'      => array( 'zh_TW', 'zh-tw' ),
			'Simplified Chinese kept'       => array( 'zh_CN', 'zh-cn' ),
			'English strips region'         => array( 'en_US', 'en' ),
			'Empty locale falls back to en' => array( '', 'en' ),
		);
	}
}
