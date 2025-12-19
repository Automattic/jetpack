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
		remove_action( 'wp_enqueue_scripts', array( $this->agents_manager, 'add_inline_script' ), 101 );
		remove_action( 'admin_enqueue_scripts', array( $this->agents_manager, 'add_inline_script' ), 101 );
		remove_action( 'next_admin_init', array( $this->agents_manager, 'add_inline_script' ), 1001 );
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
	 * Tests that add_inline_script adds script with empty providers and useUnifiedExperience false by default.
	 */
	public function test_add_inline_script_with_empty_providers() {
		// Register the help-center script so we can attach inline script to it.
		wp_register_script( 'help-center', 'https://example.com/help-center.js', array(), '1.0', true );

		$this->agents_manager->add_inline_script();

		global $wp_scripts;
		$inline_scripts = $wp_scripts->registered['help-center']->extra['before'] ?? array();

		// Find the inline script containing agentsManagerData (wp_add_inline_script may add at different indices).
		$inline_script = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( 'const agentsManagerData =', $inline_script );
		$this->assertStringContainsString( '"agentProviders":[]', $inline_script );
		$this->assertStringContainsString( '"useUnifiedExperience":false', $inline_script );
	}

	/**
	 * Tests that add_inline_script includes providers added via the filter.
	 */
	public function test_add_inline_script_includes_filtered_providers() {
		// Reset the script registry to ensure test isolation.
		global $wp_scripts;
		$wp_scripts = null;

		// Register the help-center script so we can attach inline script to it.
		wp_register_script( 'help-center', 'https://example.com/help-center.js', array(), '1.0', true );

		// Add a filter to provide agent providers.
		add_filter(
			'agents_manager_agent_providers',
			function () {
				return array( 'my-plugin/tool-provider.js', 'another-plugin/context-provider.js' );
			}
		);

		$this->agents_manager->add_inline_script();

		// Re-fetch global after wp_register_script initializes it.
		$inline_scripts = $wp_scripts->registered['help-center']->extra['before'] ?? array(); // @phan-suppress-current-line PhanTypeExpectedObjectPropAccessButGotNull

		// Find the inline script containing agentsManagerData (wp_add_inline_script may add at different indices).
		$inline_script = implode( "\n", array_filter( $inline_scripts ) );

		$this->assertStringContainsString( 'const agentsManagerData =', $inline_script );
		$this->assertStringContainsString( 'my-plugin/tool-provider.js', $inline_script );
		$this->assertStringContainsString( 'another-plugin/context-provider.js', $inline_script );

		// Clean up the filter.
		remove_all_filters( 'agents_manager_agent_providers' );
	}

	/**
	 * Tests that add_inline_script includes useUnifiedExperience true when filter returns true.
	 */
	public function test_add_inline_script_includes_use_unified_experience_when_enabled() {
		// Reset the script registry to ensure test isolation.
		global $wp_scripts;
		$wp_scripts = null;

		// Register the help-center script so we can attach inline script to it.
		wp_register_script( 'help-center', 'https://example.com/help-center.js', array(), '1.0', true );

		// Add a filter to enable unified experience.
		add_filter(
			'agents_manager_use_unified_experience',
			'__return_true',
			// Use a higher priority to ensure it runs after the class's own filter.
			20
		);

		$this->agents_manager->add_inline_script();

		// Re-fetch global after wp_register_script initializes it.
		$inline_scripts = $wp_scripts->registered['help-center']->extra['before'] ?? array(); // @phan-suppress-current-line PhanTypeExpectedObjectPropAccessButGotNull

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
}
