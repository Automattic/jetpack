<?php
/**
 * Agents Manager Tests File
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

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

		// Reset the REST server to clear any registered routes.
		global $wp_rest_server;
		$wp_rest_server = null;

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
	 * Tests that add_inline_script adds script with empty providers by default.
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
}
