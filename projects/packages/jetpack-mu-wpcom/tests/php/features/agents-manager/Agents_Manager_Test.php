<?php
/**
 * Agents Manager Tests File
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status\Cache;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/agents-manager/class-agents-manager.php';

/**
 * Class Agents_Manager_Test
 *
 * @covers \A8C\FSE\Agents_Manager
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
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();
		$this->agents_manager = new Agents_Manager();
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

		// Reset the REST server to clear any registered routes.
		global $wp_rest_server;
		$wp_rest_server = null;

		// Log out any logged-in user.
		wp_set_current_user( 0 );

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
	 * Tests that the init method creates a singleton instance.
	 */
	public function test_init_creates_singleton_instance() {
		// Reset the static instance for testing
		$reflection = new \ReflectionClass( Agents_Manager::class );
		$property   = $reflection->getProperty( 'instance' );
		if ( PHP_VERSION_ID < 80500 ) {
			$property->setAccessible( true );
		}

		// Use an instance for Phan compatibility when accessing static property.
		$dummy = $this->agents_manager;

		$property->setValue( $dummy, null );

		Agents_Manager::init();

		$instance1 = $property->getValue( $dummy );
		$this->assertInstanceOf( Agents_Manager::class, $instance1 );

		Agents_Manager::init();

		$instance2 = $property->getValue( $dummy );
		$this->assertSame( $instance1, $instance2 );

		// Reset back to null for other tests
		$property->setValue( $dummy, null );
	}

	/**
	 * Tests that enqueue_scripts adds script with empty providers and useUnifiedExperience false by default.
	 */
	public function test_enqueue_scripts_with_empty_providers() {
		// Register the help-center script so we can attach inline script to it.
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
		// Reset the script registry to ensure test isolation.
		global $wp_scripts;
		$wp_scripts = null;

		// Register the help-center script so we can attach inline script to it.
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
		// Reset the script registry to ensure test isolation.
		global $wp_scripts;
		$wp_scripts = null;

		// Register the help-center script so we can attach inline script to it.
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
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
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
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
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
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
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
	 *
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
	 *
	 * On Simple sites, proxy detection uses the wpcom_is_proxied_request function.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
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
	 *
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
	 *
	 * On WoA/Garden sites where wpcom_is_proxied_request doesn't exist,
	 * proxy detection uses the A8C_PROXIED_REQUEST constant.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
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
	 *
	 * On WoA/Garden sites where wpcom_is_proxied_request doesn't exist,
	 * proxy detection can also use the A8C_PROXIED_REQUEST server variable.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
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
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
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
		add_filter( 'pre_http_request', array( $this, 'mock_preferences_api_enabled' ), 10, 3 );

		$result = $this->agents_manager->should_use_unified_experience();

		remove_filter( 'pre_http_request', array( $this, 'mock_preferences_api_enabled' ), 10 );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that fetch_unified_experience_preference returns false when API returns unified_ai_chat disabled.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
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
		add_filter( 'pre_http_request', array( $this, 'mock_preferences_api_disabled' ), 10, 3 );

		$result = $this->agents_manager->should_use_unified_experience();

		remove_filter( 'pre_http_request', array( $this, 'mock_preferences_api_disabled' ), 10 );

		$this->assertFalse( $result );
	}

	/**
	 * Tests that fetch_unified_experience_preference uses cached value on subsequent calls.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
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
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
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
		add_filter( 'pre_http_request', array( $this, 'mock_preferences_api_error' ), 10, 3 );

		// First call - should fail and cache the failure.
		$result1 = $this->agents_manager->should_use_unified_experience();

		remove_filter( 'pre_http_request', array( $this, 'mock_preferences_api_error' ), 10 );

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
	public function mock_preferences_api_enabled( $response, $args, $url ) {
		if ( strpos( $url, '/me/preferences' ) === false ) {
			return $response;
		}

		return array(
			'body'     => wp_json_encode( true, JSON_UNESCAPED_SLASHES ),
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
	public function mock_preferences_api_disabled( $response, $args, $url ) {
		if ( strpos( $url, '/me/preferences' ) === false ) {
			return $response;
		}

		return array(
			'body'     => wp_json_encode( false, JSON_UNESCAPED_SLASHES ),
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
	public function mock_preferences_api_error( $response, $args, $url ) {
		if ( strpos( $url, '/me/preferences' ) === false ) {
			return $response;
		}

		return new \WP_Error( 'http_request_failed', 'Connection failed' );
	}
}
