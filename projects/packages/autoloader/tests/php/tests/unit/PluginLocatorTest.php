<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Plugin guesser test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles active plugin guessing.
 *
 * @runClassInSeparateProcess
 * @preserveGlobalState disabled
 */
class PluginLocatorTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

	/**
	 * A mock of the path processor we're using.
	 *
	 * @var Path_Processor|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $path_processor;

	/**
	 * The plugin locator that we're testing.
	 *
	 * @var Plugin_Locator
	 */
	private $locator;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->path_processor = $this->getMockBuilder( Path_Processor::class )->getMock();
		$this->locator        = new Plugin_Locator( $this->path_processor );
	}

	/**
	 * Teardown runs after each test.
	 *
	 * @after
	 */
	public function tear_down() {
		// Make sure all of the test data we made use of is cleaned up after each test.
		cleanup_test_wordpress_data();
	}

	/**
	 * Tests that the locator is able to find the path to the currently executing plugin.
	 */
	public function test_finds_current_plugin() {
		$this->path_processor->expects( $this->once() )
			->method( 'find_directory_with_autoloader' )
			->with( TEST_PLUGIN_DIR, array() )
			->willReturn( TEST_PLUGIN_DIR );

		$path = $this->locator->find_current_plugin();

		$this->assertEquals( TEST_PLUGIN_DIR, $path );
	}

	/**
	 * Tests that the locator throws an exception when the currently executing plugin is not an autoloaded plugin.
	 */
	public function test_finds_current_plugin_throws_exception_when_not_autoloaded() {
		$this->path_processor->expects( $this->once() )
			->method( 'find_directory_with_autoloader' )
			->with( TEST_PLUGIN_DIR, array() )
			->willReturn( false );

		$this->expectExceptionMessage( 'Failed to locate plugin' );

		$this->locator->find_current_plugin();
	}

	/**
	 * Tests that guessing using option doesn't break when looking for plugins that don't exist.
	 */
	public function test_using_option_does_nothing_without_valid_plugin() {
		$plugin_paths = $this->locator->find_using_option( 'test_plugin_paths' );
		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );

		add_test_option(
			'test_plugin_paths',
			array( 'test/test.php' )
		);
		$this->path_processor->expects( $this->exactly( 2 ) )
			->method( 'find_directory_with_autoloader' )
			->withConsecutive(
				array( 0 ),
				array( 'test/test.php' )
			)
			->willReturn( false );

		$plugin_paths = $this->locator->find_using_option( 'test_plugin_paths' );
		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that it can guess plugins that are stored in an option.
	 */
	public function test_using_option_finds_in_option() {
		add_test_option(
			'test_plugin_paths',
			array( 'dummy_current/dummy_current.php' )
		);

		$this->path_processor->expects( $this->exactly( 2 ) )
			->method( 'find_directory_with_autoloader' )
			->withConsecutive(
				array( 0 ),
				array( 'dummy_current/dummy_current.php' )
			)
			->willReturnOnConsecutiveCalls( false, WP_PLUGIN_DIR . '/dummy_current' );

		$plugin_paths = $this->locator->find_using_option( 'test_plugin_paths' );

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( WP_PLUGIN_DIR . '/dummy_current', $plugin_paths );
	}

	/**
	 * Tests that it can find plugins that are stored in a site option.
	 */
	public function test_using_option_finds_in_site_option() {
		add_test_site_option(
			'test_plugin_paths',
			array( 'dummy_current/dummy_current.php' )
		);

		$this->path_processor->expects( $this->exactly( 2 ) )
			->method( 'find_directory_with_autoloader' )
			->withConsecutive(
				array( 0 ),
				array( 'dummy_current/dummy_current.php' )
			)
			->willReturnOnConsecutiveCalls( false, WP_PLUGIN_DIR . '/dummy_current' );

		$plugin_paths = $this->locator->find_using_option( 'test_plugin_paths', true );

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( WP_PLUGIN_DIR . '/dummy_current', $plugin_paths );
	}

	/**
	 * Tests that it can guess plugins that are stored in an option's key.
	 */
	public function test_using_option_finds_plugin_in_key() {
		add_test_option(
			'test_plugin_paths',
			array( 'dummy_current/dummy_current.php' => 123456 )
		);

		$this->path_processor->expects( $this->exactly( 2 ) )
			->method( 'find_directory_with_autoloader' )
			->withConsecutive(
				array( 'dummy_current/dummy_current.php' ),
				array( 123456 )
			)
			->willReturnOnConsecutiveCalls( WP_PLUGIN_DIR . '/dummy_current', false );

		$plugin_paths = $this->locator->find_using_option( 'test_plugin_paths' );

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( WP_PLUGIN_DIR . '/dummy_current', $plugin_paths );
	}

	/**
	 * Tests that it does not give errors or warnings when the option contains unexpected data.
	 */
	public function test_using_option_handles_invalid_data() {
		add_test_option(
			'test_plugin_paths',
			'invalid'
		);

		$this->path_processor->expects( $this->never() )->method( 'find_directory_with_autoloader' );

		$plugin_paths = $this->locator->find_using_option( 'test_plugin_paths' );

		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that plugins in request parameters are not discovered if a nonce is not set.
	 */
	public function test_using_request_action_returns_nothing_without_nonce() {
		$_REQUEST['action'] = 'activate';
		$_REQUEST['plugin'] = 'dummy_current/dummy_current.php';

		$plugin_paths = $this->locator->find_using_request_action( array( 'activate' ) );

		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );

		$_REQUEST['action'] = 'deactivate';
		$_REQUEST['plugin'] = 'dummy_current/dummy_current.php';

		$plugin_paths = $this->locator->find_using_request_action( array( 'deactivate' ) );

		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );

		$_REQUEST['action']  = 'activate-selected';
		$_REQUEST['checked'] = array( 'dummy_current/dummy_current.php' );

		$plugin_paths = $this->locator->find_using_request_action( array( 'activate-selected' ) );

		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that plugins in the request action are not found if the action is not found.
	 */
	public function test_using_request_action_returns_nothing_without_action() {
		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = '';

		$plugin_paths = $this->locator->find_using_request_action( array( 'activate' ) );

		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );

		$_REQUEST['action'] = 'activate';
		$_REQUEST['plugin'] = 'dummy_current\\\\dummy_current.php';

		$plugin_paths = $this->locator->find_using_request_action( array() );

		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that plugins in the request action can be found for single actions.
	 */
	public function test_using_request_action_works_for_single() {
		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = 'activate';
		$_REQUEST['plugin']   = 'dummy_current\\\\dummy_current.php';

		$this->path_processor->expects( $this->exactly( 2 ) )
			->method( 'find_directory_with_autoloader' )
			->withConsecutive(
				array( 0 ),
				array( 'dummy_current\\dummy_current.php' )
			)
			->willReturnOnConsecutiveCalls( false, WP_PLUGIN_DIR . '/dummy_current' );

		$plugin_paths = $this->locator->find_using_request_action( array( 'activate' ) );

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( WP_PLUGIN_DIR . '/dummy_current', $plugin_paths );
	}

	/**
	 * Tests that plugins in the request action can be found for multiple actions.
	 */
	public function test_using_request_action_works_for_multiple() {
		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = 'activate-selected';
		$_REQUEST['checked']  = array( 'dummy_current\\\\dummy_current.php' );

		$this->path_processor->expects( $this->exactly( 2 ) )
			->method( 'find_directory_with_autoloader' )
			->withConsecutive(
				array( 0 ),
				array( 'dummy_current\\dummy_current.php' )
			)
			->willReturnOnConsecutiveCalls( false, WP_PLUGIN_DIR . '/dummy_current' );

		$plugin_paths = $this->locator->find_using_request_action( array( 'activate-selected' ) );

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( WP_PLUGIN_DIR . '/dummy_current', $plugin_paths );
	}
}
