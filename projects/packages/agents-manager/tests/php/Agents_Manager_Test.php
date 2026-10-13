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
	 * Original $_GET['tab'] value to restore after tests.
	 *
	 * @var mixed
	 */
	private $original_get_tab;

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
		Functions\when( 'is_automattician' )->justReturn( false );

		$this->agents_manager = Agents_Manager::init();

		// Save original superglobal values that tests may modify.
		$this->original_get_preview = $_GET['preview'] ?? null;
		$this->original_get_tab     = $_GET['tab'] ?? null;
		$this->original_request_uri = $_SERVER['REQUEST_URI'] ?? null;

		// Save original $wp_customize global.
		global $wp_customize;
		$this->original_wp_customize = $wp_customize;

		// Save original current_screen global.
		$this->original_current_screen = $GLOBALS['current_screen'] ?? null;

		global $wp_actions;

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
		remove_all_filters( 'jetpack_ai_sidebar_agents_manager_data' );
		remove_action( 'admin_bar_menu', array( $this->agents_manager, 'add_admin_bar_nodes' ), 100 );
		remove_all_filters( 'agents_manager_enabled_in_block_editor' );
		remove_all_filters( 'agents_manager_should_load' );

		// Restore original superglobal values.
		if ( $this->original_get_preview === null ) {
			unset( $_GET['preview'] );
		} else {
			$_GET['preview'] = $this->original_get_preview;
		}

		if ( $this->original_get_tab === null ) {
			unset( $_GET['tab'] );
		} else {
			$_GET['tab'] = $this->original_get_tab;
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

		global $wp_actions;

		// Restore init guard action count.
		if ( $this->original_agents_manager_initialized_count === 0 ) {
			unset( $wp_actions['jetpack_agents_manager_initialized'] );
		} else {
			$wp_actions['jetpack_agents_manager_initialized'] = $this->original_agents_manager_initialized_count;
		}

		// Clear the status cache and constants.
		Cache::clear();
		Constants::clear_constants();
		remove_all_filters( 'agents_manager_variant' );

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
	 * Tests that enqueue_scripts adds script with empty providers by default.
	 */
	public function test_enqueue_scripts_with_empty_providers() {
		Functions\when( 'wpcom_is_proxied_request' )->justReturn( false );

		// Set admin context - scripts only enqueue in admin.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		// Register the agents-manager script so we can attach inline script to it.
		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Add a filter to request the Agents Manager shell.
		add_filter(
			'agents_manager_should_load',
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
		$this->assertStringContainsString( '"isA11n":false', $inline_script );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts exposes the deployed build version as `{variant}:{version}`,
	 * even in dev mode, where the enqueue cache buster is a random number.
	 */
	public function test_enqueue_scripts_exposes_deployed_version() {
		Functions\when( 'wpcom_is_proxied_request' )->justReturn( true );

		// Set admin context - scripts only enqueue in admin.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		// Register the agents-manager script so we can attach inline script to it.
		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		add_filter( 'agents_manager_should_load', '__return_true', 20 );
		$force_variant = static function () {
			return 'wp-admin';
		};
		add_filter( 'agents_manager_variant', $force_variant );
		// Seed the cached asset metadata so no fetch is attempted.
		set_transient(
			'agents-manager-asset-wp-admin.asset.json',
			array(
				'version'      => 'abc123',
				'dependencies' => array(),
			)
		);

		$this->agents_manager->enqueue_scripts();

		global $wp_scripts;
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"isDevMode":true', $inline_script );
		$this->assertStringContainsString( '"version":"wp-admin:abc123"', $inline_script );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
		remove_filter( 'agents_manager_variant', $force_variant );
		delete_transient( 'agents-manager-asset-wp-admin.asset.json' );
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

		// Add a filter to request the Agents Manager shell.
		add_filter(
			'agents_manager_should_load',
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
		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts exposes whether the site runs on the WordPress.com platform.
	 *
	 * @param string $platform Hosting platform to simulate: 'none', 'simple', or 'woa'.
	 * @param string $expected Expected JSON-encoded isWpcomPlatform value.
	 * @dataProvider provide_is_wpcom_platform
	 */
	#[DataProvider( 'provide_is_wpcom_platform' )]
	public function test_enqueue_scripts_exposes_is_wpcom_platform( $platform, $expected ) {
		Constants::set_constant( 'IS_WPCOM', 'simple' === $platform );
		if ( 'woa' === $platform ) {
			Cache::set( 'is_woa_site', true );
		}

		// Set admin context - scripts only enqueue in admin.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		// Reset the script registry to ensure test isolation.
		global $wp_scripts;
		$wp_scripts = null;

		// Register the agents-manager script so we can attach inline script to it.
		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Add a filter to request the Agents Manager shell.
		add_filter(
			'agents_manager_should_load',
			'__return_true',
			// Use a higher priority to ensure it runs after the class's own filter.
			20
		);

		$this->agents_manager->enqueue_scripts();

		// Re-fetch global after wp_register_script initializes it.
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array(); // @phan-suppress-current-line PhanTypeExpectedObjectPropAccessButGotNull

		// Find the inline script containing agentsManagerData.
		$inline_script = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"isWpcomPlatform":' . $expected, $inline_script );

		// Clean up the filter.
		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
	}

	/**
	 * Data provider for test_enqueue_scripts_exposes_is_wpcom_platform.
	 *
	 * @return array<string, array{0: string, 1: string}>
	 */
	public static function provide_is_wpcom_platform() {
		return array(
			'non-wpcom site' => array( 'none', 'false' ),
			'Simple site'    => array( 'simple', 'true' ),
			'WoA site'       => array( 'woa', 'true' ),
		);
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

		// Enable Agents Manager in the block editor without taking over Help Center.
		add_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );

		$this->agents_manager->enqueue_scripts();

		$this->assertTrue( wp_script_is( 'help-center', 'enqueued' ), 'Help Center script should remain enqueued in block-editor-only mode.' );
		$this->assertTrue( wp_style_is( 'help-center-style', 'enqueued' ), 'Help Center style should remain enqueued in block-editor-only mode.' );

		remove_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );
	}

	/**
	 * Tests that the sparkle icon's aria-label follows a locale switch within the request.
	 *
	 * The admin-bar endpoint switches locale for `_locale=user`, so the icon markup cannot
	 * be built once and reused.
	 */
	public function test_sparkle_icon_aria_label_follows_a_locale_switch() {
		require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';

		$label  = 'Agent';
		$filter = static function ( $translation, $text ) use ( &$label ) {
			return 'Agent' === $text ? $label : $translation;
		};
		add_filter( 'gettext', $filter, 10, 2 );

		$first = new \WP_Admin_Bar();
		$first->initialize();
		$this->agents_manager->add_ai_chat_button( $first );

		$label  = 'Demander a l IA';
		$second = new \WP_Admin_Bar();
		$second->initialize();
		$this->agents_manager->add_ai_chat_button( $second );

		remove_filter( 'gettext', $filter, 10 );

		$this->assertStringContainsString( 'aria-label="Agent"', $first->get_node( 'agents-manager-ai-chat' )->title );
		$this->assertStringContainsString( 'aria-label="Demander a l IA"', $second->get_node( 'agents-manager-ai-chat' )->title );
	}

	/**
	 * Tests that `menu_title` is not HTML-escaped.
	 *
	 * It is API data, and core escapes it again when rendering the group's aria-label.
	 */
	public function test_menu_title_is_not_html_escaped() {
		$filter = static fn( $translation, $text ) => 'Agent' === $text ? "L'IA" : $translation;
		add_filter( 'gettext', $filter, 10, 2 );

		global $wp_admin_bar;
		require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';
		$wp_admin_bar = new \WP_Admin_Bar();
		$wp_admin_bar->initialize();
		$this->agents_manager->add_ai_chat_button( $wp_admin_bar );

		remove_filter( 'gettext', $filter, 10 );

		$this->assertSame( "L'IA", $wp_admin_bar->get_node( 'agents-manager-ai-chat' )->meta['menu_title'] );
	}

	/**
	 * Tests that the AI chat button owns the full UI mount target.
	 */
	public function test_ai_chat_button_owns_full_ui_mount_target() {
		global $wp_admin_bar;

		require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';
		$wp_admin_bar = new \WP_Admin_Bar();
		$wp_admin_bar->initialize();

		$this->agents_manager->add_ai_chat_button( $wp_admin_bar );

		$ai_node = $wp_admin_bar->get_node( 'agents-manager-ai-chat' );

		$this->assertNotNull( $ai_node );
		$this->assertStringContainsString( 'agents-manager-masterbar', $ai_node->meta['html'] ?? '' );
	}

	/**
	 * Tests that the AI chat button renders the "Agent" label, pre-hidden only when
	 * the cached state says the chat will restore visible.
	 *
	 * @dataProvider provide_cached_open_states
	 *
	 * @param array|null $cached_state  The user's cached open state, or null when unknown.
	 * @param bool       $is_pre_hidden Whether the label is expected to start hidden.
	 */
	#[DataProvider( 'provide_cached_open_states' )]
	public function test_ai_chat_button_pre_hides_the_agent_label_only_when_the_chat_will_restore_visible( $cached_state, $is_pre_hidden ) {
		require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';
		$wp_admin_bar = new \WP_Admin_Bar();
		$wp_admin_bar->initialize();

		if ( null !== $cached_state ) {
			// The cached state is only read for a connected user.
			$user_id = wp_insert_user(
				array(
					'user_login' => 'test_cached_state_user',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			);
			wp_set_current_user( $user_id );
			\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'test.token.' . $user_id ) );
			set_transient( 'agents_manager_open_state_' . $user_id, $cached_state );
		}

		$this->agents_manager->add_ai_chat_button( $wp_admin_bar );

		$node = $wp_admin_bar->get_node( 'agents-manager-ai-chat' );
		$this->assertStringContainsString(
			'<span class="agents-manager-ai-chat-label" aria-hidden="true"><span>Agent</span></span>',
			$node->title
		);
		$this->assertSame( $is_pre_hidden ? 'is-chat-visible' : null, $node->meta['class'] ?? null );
	}

	/**
	 * Cached open states and whether the label starts hidden for each.
	 */
	public static function provide_cached_open_states() {
		return array(
			'unknown'   => array( null, false ),
			'closed'    => array(
				array(
					'agents_manager_open'      => false,
					'agents_manager_minimized' => false,
				),
				false,
			),
			'open'      => array(
				array(
					'agents_manager_open'      => true,
					'agents_manager_minimized' => false,
				),
				true,
			),
			'minimized' => array(
				array(
					'agents_manager_open'      => true,
					'agents_manager_minimized' => true,
				),
				false,
			),
		);
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
	 * Tests that a WordPress.com proxy marks the visitor as an Automattician for tracking.
	 */
	public function test_is_tracking_automattician_returns_true_for_wpcom_proxy() {
		Functions\when( 'wpcom_is_proxied_request' )->justReturn( true );

		$this->assertTrue( $this->call_is_tracking_automattician() );
	}

	/**
	 * Tests that an Atomic proxy marks the visitor as an Automattician for tracking.
	 */
	public function test_is_tracking_automattician_returns_true_for_atomic_proxy() {
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );

		$this->assertTrue( $this->call_is_tracking_automattician() );
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
	 * Calls the private tracking classifier.
	 *
	 * @return bool
	 */
	private function call_is_tracking_automattician() {
		$reflection = new \ReflectionClass( Agents_Manager::class );
		$method     = $reflection->getMethod( 'is_tracking_automattician' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( null );
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
	 * Tests that the plugin information iframe cannot be enabled by a variant filter.
	 */
	public function test_get_active_variant_returns_null_in_plugin_information_iframe() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'plugin-install' );
		$_GET['tab'] = 'plugin-information';

		add_filter(
			'agents_manager_variant',
			static function () {
				return 'wp-admin';
			}
		);

		$this->assertNull( Agents_Manager::get_active_variant() );
	}

	/**
	 * Tests that a variant filter still controls the parent plugin screen.
	 */
	public function test_get_active_variant_allows_parent_plugin_screen() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'plugin-install' );
		unset( $_GET['tab'] );

		add_filter(
			'agents_manager_variant',
			static function () {
				return 'wp-admin';
			}
		);

		$this->assertSame( 'wp-admin', Agents_Manager::get_active_variant() );
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
	 * Tests that Agents Manager remains inactive on the frontend for eligible logged-in editors.
	 */
	public function test_get_variant_returns_null_on_frontend_for_eligible_editor() {
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

		// Request the Agents Manager shell.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );

		$variant = $this->call_get_variant();

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
		wp_set_current_user( 0 );

		$this->assertNull( $variant );
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

		add_filter( 'agents_manager_should_load', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"currentUser":', $inline_script );
		$this->assertStringContainsString( 'Enqueue Test', $inline_script );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
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
		add_filter( 'agents_manager_should_load', '__return_true', 20 );

		add_filter(
			'jetpack_ai_sidebar_agents_manager_data',
			function ( $data ) {
				$data['customFeatureEnabled'] = true;
				return $data;
			}
		);

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"customFeatureEnabled":true', $inline_script );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
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
		add_filter( 'agents_manager_should_load', '__return_true', 20 );
		add_filter( 'jetpack_ai_sidebar_agents_manager_data', '__return_null' );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"wp-admin"', $inline_script );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
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

		add_filter( 'agents_manager_should_load', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"site":', $inline_script );
		$this->assertStringContainsString( 'testsite.example.com', $inline_script );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
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

		// Request the Agents Manager shell. Jetpack is not connected (default test state),
		// so is_jetpack_disconnected() returns false for non-Jetpack sites.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"wp-admin"', $inline_script );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
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

		// Request the Agents Manager shell. Jetpack is not connected (default test state),
		// so is_jetpack_disconnected() returns false for non-Jetpack sites.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"gutenberg"', $inline_script );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
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

		// Request the Agents Manager shell. Jetpack is not connected (default test state),
		// so is_jetpack_disconnected() returns false for non-Jetpack sites.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"wp-admin"', $inline_script );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
	}

	/**
	 * Tests that wp-admin does not enqueue Agents Manager when Jetpack is disconnected.
	 */
	public function test_enqueue_scripts_skips_disconnected_wp_admin() {
		// Set admin context - scripts only enqueue in admin.
		$this->set_admin_context();

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );

		// Request the Agents Manager shell and simulate a Jetpack site with a disconnected user.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$this->agents_manager->enqueue_scripts();

		$this->assertFalse( wp_script_is( 'agents-manager', 'enqueued' ) );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );
	}

	/**
	 * Tests that enqueue_scripts includes sectionName as gutenberg-disconnected in block editor
	 * when the Agents Manager shell is requested but Jetpack is disconnected.
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

		// Request the Agents Manager shell and simulate a Jetpack site with a disconnected user.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_scripts, 'wp_scripts should be initialized after enqueue_scripts' );
		$inline_scripts = $wp_scripts->registered['agents-manager']->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( '"sectionName":"gutenberg-disconnected"', $inline_script );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );
	}

	/**
	 * Tests that should_enqueue_script returns false when Jetpack is disconnected in wp-admin.
	 */
	public function test_should_enqueue_script_returns_false_when_disconnected_in_admin() {
		$this->set_admin_context();
		$_SERVER['REQUEST_URI'] = '/wp-admin/index.php';

		// Request the Agents Manager shell and simulate a Jetpack site with a disconnected user.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$result = $this->call_should_enqueue_script();

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );

		$this->assertFalse( $result );
	}

	/**
	 * Tests that should_enqueue_script returns true when the Agents Manager shell is requested but Jetpack is disconnected (in block editor).
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

		// Request the Agents Manager shell and simulate a Jetpack site with a disconnected user.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$result = $this->call_should_enqueue_script();

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that CSS is enqueued for connected variants but not for gutenberg-disconnected.
	 */
	public function test_css_enqueued_only_for_wp_admin_variants() {
		// Test wp-admin variant (connected) - should enqueue CSS.
		$this->set_admin_context();
		global $wp_styles;
		$wp_styles = null;

		wp_register_script( 'agents-manager', 'https://example.com/agents-manager.js', array(), '1.0', true );
		wp_register_style( 'agents-manager-style', 'https://example.com/agents-manager.css', array(), '1.0' );
		set_transient(
			'agents-manager-asset-wp-admin.asset.json',
			array(
				'dependencies' => array(),
				'version'      => '1.0',
			)
		);

		// Request the Agents Manager shell. Not a Jetpack site, so is_jetpack_disconnected() returns false.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertNotNull( $wp_styles, 'wp_styles should be initialized' );
		$this->assertTrue( wp_style_is( 'agents-manager-style', 'enqueued' ), 'CSS should be enqueued for wp-admin variant' );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
		delete_transient( 'agents-manager-asset-wp-admin.asset.json' );

		// Test gutenberg-disconnected variant (the Agents Manager shell requested + Jetpack disconnected) - should NOT enqueue CSS.
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
		set_transient(
			'agents-manager-asset-gutenberg-disconnected.asset.json',
			array(
				'dependencies' => array(),
				'version'      => '1.0',
			)
		);

		// Request the Agents Manager shell and simulate a Jetpack site with a disconnected user.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );
		// Do not connect the user - is_user_connected() will return false by default.

		$this->agents_manager->enqueue_scripts();

		// For gutenberg-disconnected variant, CSS should not be enqueued.
		$this->assertFalse( wp_style_is( 'agents-manager-style', 'enqueued' ), 'CSS should NOT be enqueued for gutenberg-disconnected variant' );

		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );
		delete_transient( 'agents-manager-asset-gutenberg-disconnected.asset.json' );
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
	 * Tests that is_enabled returns false by default when no filters are active.
	 */
	public function test_is_enabled_returns_false_by_default() {
		// Ensure no block editor context.
		$this->assertFalse( is_admin() );

		$result = Agents_Manager::is_enabled();

		$this->assertFalse( $result );
	}

	/**
	 * Tests that is_enabled returns true when an integration requests the shell.
	 */
	public function test_is_enabled_returns_true_when_shell_is_requested() {
		add_filter( 'agents_manager_should_load', '__return_true' );

		$result = Agents_Manager::is_enabled();

		remove_filter( 'agents_manager_should_load', '__return_true' );

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
	 * Tests that an integration can load Agents Manager on WooCommerce Admin.
	 */
	public function test_should_enqueue_script_returns_true_on_woocommerce_admin_when_requested() {
		// Set admin context first.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'woocommerce_page_wc-admin' );

		add_filter( 'agents_manager_should_load', '__return_true' );

		$result = $this->call_should_enqueue_script();

		remove_filter( 'agents_manager_should_load', '__return_true' );

		$this->assertTrue( $result, 'Agents Manager should load on WooCommerce Admin when requested.' );
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

		// Request the Agents Manager shell. Not a Jetpack site, so the connected wp-admin variant is used.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );

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
		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
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
		add_filter( 'agents_manager_should_load', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertFalse(
			wp_script_is( 'agents-manager-translations', 'enqueued' ),
			'Translation script should not be enqueued for an English locale'
		);

		remove_filter( 'locale', $locale_filter );
		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
		delete_transient( 'agents-manager-asset-wp-admin.asset.json' );
	}

	/**
	 * Tests that translations are not loaded for disconnected variants, whose minimal
	 * bundles have no translatable in-app UI. Mirrors Help Center's behavior.
	 */
	public function test_translations_not_enqueued_for_disconnected_variant() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'post' );
		$screen = get_current_screen();

		$reflection = new \ReflectionClass( $screen );
		$property   = $reflection->getProperty( 'is_block_editor' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $screen, true );

		global $wp_scripts;
		$wp_scripts = null;

		set_transient(
			'agents-manager-asset-gutenberg-disconnected.asset.json',
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

		// A requested shell in the editor with a disconnected user yields gutenberg-disconnected.
		add_filter( 'agents_manager_should_load', '__return_true', 20 );
		add_filter( 'is_jetpack_site', '__return_true', 20 );

		$this->agents_manager->enqueue_scripts();

		$this->assertFalse(
			wp_script_is( 'agents-manager-translations', 'enqueued' ),
			'Translation script should not be enqueued for the gutenberg-disconnected variant'
		);

		remove_filter( 'locale', $locale_filter );
		remove_filter( 'agents_manager_should_load', '__return_true', 20 );
		remove_filter( 'is_jetpack_site', '__return_true', 20 );
		delete_transient( 'agents-manager-asset-gutenberg-disconnected.asset.json' );
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

	/**
	 * Puts the request into the context described by $ctx.
	 *
	 * @param array<string, mixed> $ctx Context flags from provide_admin_bar_contexts().
	 */
	private function apply_admin_bar_context( array $ctx = array() ) {
		$ctx = array_merge(
			array(
				'screen'         => 'dashboard',
				'block_editor'   => false,
				'admin_bar'      => true,
				'variant'        => null,
				'editor_enabled' => false,
				'should_load'    => false,
				'p2'             => false,
				'iframe_tab'     => false,
				'editor_user'    => false,
			),
			$ctx
		);

		if ( $ctx['editor_user'] ) {
			// `WP_Admin_Bar::initialize()` indexes this by blog ID for logged-in users.
			Functions\when( 'get_blogs_of_user' )->justReturn(
				array( get_current_blog_id() => (object) array( 'userblog_id' => get_current_blog_id() ) )
			);

			wp_set_current_user(
				wp_insert_user(
					array(
						'user_login' => 'am-editor',
						'user_pass'  => 'password',
						'role'       => 'editor',
					)
				)
			);
		}

		require_once ABSPATH . 'wp-admin/includes/screen.php';

		// Always stubbed: Patchwork keeps a stubbed function defined for the rest of the
		// process, so a conditional stub would leak into later tests.
		Functions\when( 'get_stylesheet' )->justReturn( $ctx['p2'] ? 'pub/p2-breathe' : 'twentytwentyfour' );

		if ( null !== $ctx['screen'] ) {
			set_current_screen( $ctx['screen'] );

			if ( $ctx['block_editor'] ) {
				$screen     = get_current_screen();
				$reflection = new \ReflectionClass( $screen );
				$property   = $reflection->getProperty( 'is_block_editor' );
				if ( PHP_VERSION_ID < 80100 ) {
					$property->setAccessible( true );
				}
				$property->setValue( $screen, true );
			}
		} else {
			unset( $GLOBALS['current_screen'] );
		}

		if ( $ctx['iframe_tab'] ) {
			$_GET['tab'] = 'plugin-information';
		}

		Functions\when( 'is_admin_bar_showing' )->justReturn( $ctx['admin_bar'] );

		if ( null !== $ctx['variant'] ) {
			$variant = $ctx['variant'];
			add_filter( 'agents_manager_variant', static fn() => $variant );
		}

		if ( $ctx['editor_enabled'] ) {
			add_filter( 'agents_manager_enabled_in_block_editor', '__return_true' );
		}

		if ( $ctx['should_load'] ) {
			add_filter( 'agents_manager_should_load', '__return_true' );
		}
	}

	/**
	 * Renders the admin bar, firing `admin_bar_menu` with no enqueue hook first — the same
	 * conditions as the admin-bar REST endpoints.
	 *
	 * @return \WP_Admin_Bar The rendered admin bar.
	 */
	private function render_admin_bar() {
		global $wp_admin_bar;

		require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';
		$wp_admin_bar = new \WP_Admin_Bar();
		$wp_admin_bar->initialize();

		do_action_ref_array( 'admin_bar_menu', array( &$wp_admin_bar ) );

		return $wp_admin_bar;
	}

	/**
	 * Renders the admin bar and returns the Agents Manager node IDs on it.
	 *
	 * @return string[] Sorted Agents Manager node IDs.
	 */
	private function render_agents_manager_nodes() {
		$wp_admin_bar = $this->render_admin_bar();

		$ids = array_values(
			array_filter(
				array_keys( $wp_admin_bar->get_nodes() ?? array() ),
				static fn( $id ) => str_starts_with( (string) $id, 'agents-manager' )
			)
		);
		sort( $ids );

		return $ids;
	}

	/**
	 * Locks the node set each surface renders, so a change to how the nodes are registered
	 * cannot silently alter which of them appear.
	 *
	 * @param array<string, mixed> $ctx      Request context.
	 * @param string[]             $expected Expected node IDs.
	 * @dataProvider provide_admin_bar_contexts
	 */
	#[DataProvider( 'provide_admin_bar_contexts' )]
	public function test_admin_bar_nodes_match_context( array $ctx, array $expected ) {
		$this->apply_admin_bar_context( $ctx );

		$this->assertSame( $expected, $this->render_agents_manager_nodes() );
	}

	/**
	 * Data provider for the admin-bar node matrix.
	 *
	 * @return array<string, array{0: array<string, mixed>, 1: string[]}>
	 */
	public static function provide_admin_bar_contexts() {
		$ai_chat = 'agents-manager-ai-chat';

		return array(
			'wp-admin, requested shell'              => array(
				array( 'should_load' => true ),
				array( $ai_chat ),
			),
			'front end, disconnected adds no nodes'  => array(
				array(
					'screen'      => null,
					'editor_user' => true,
					'should_load' => true,
				),
				array(),
			),
			'editor with admin bar, editor-only'     => array(
				array(
					'screen'         => 'post',
					'block_editor'   => true,
					'editor_enabled' => true,
				),
				array( $ai_chat ),
			),
			'editor with admin bar, requested shell' => array(
				array(
					'screen'       => 'post',
					'block_editor' => true,
					'should_load'  => true,
				),
				array( $ai_chat ),
			),
			'editor with admin bar, not enabled'     => array(
				array(
					'screen'       => 'post',
					'block_editor' => true,
				),
				array(),
			),
			'editor without admin bar'               => array(
				array(
					'screen'         => 'post',
					'block_editor'   => true,
					'editor_enabled' => true,
					'admin_bar'      => false,
				),
				array(),
			),
			'wp-admin, not enabled'                  => array(
				array(),
				array(),
			),
			'editor with admin bar, disconnected'    => array(
				array(
					'screen'       => 'post',
					'block_editor' => true,
					'should_load'  => true,
					'variant'      => 'gutenberg-disconnected',
				),
				array(),
			),
			'P2 frontend is excluded'                => array(
				array(
					'screen'      => null,
					'p2'          => true,
					'should_load' => true,
					'variant'     => 'wp-admin',
				),
				array(),
			),
			'plugin information iframe is excluded'  => array(
				array(
					'screen'      => 'plugin-install',
					'iframe_tab'  => true,
					'should_load' => true,
				),
				array(),
			),
		);
	}
}
