<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Plugin guesser test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles active plugin guessing.
 *
 * @runClassInSeparateProcess
 * @preserveGlobalState disabled
 */
class Test_Plugin_Locator extends TestCase {

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
	 */
	public function setUp() {
		parent::setUp();

		$this->path_processor = $this->getMockBuilder( Path_Processor::class )->getMock();
		$this->locator        = new Plugin_Locator( $this->path_processor );
	}

	/**
	 * Teardown runs after each test.
	 */
	public function tearDown() {
		parent::tearDown();

		// Make sure all of the test data we made use of is cleaned up after each test.
		cleanup_test_wordpress_data();
	}

	/**
	 * Tests that guessing using option doesn't break when looking for plugins that don't exist.
	 */
	public function test_using_option_does_nothing_without_valid_plugin() {
		$plugin_paths = $this->locator->find_using_option( 'test_plugin_paths' );
		$this->assertTrue( is_array( $plugin_paths ) );
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
		$this->assertTrue( is_array( $plugin_paths ) );
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
			->willReturnOnConsecutiveCalls( false, TEST_DATA_PATH . '/plugins/dummy_current' );

		$plugin_paths = $this->locator->find_using_option( 'test_plugin_paths' );

		$this->assertTrue( is_array( $plugin_paths ) );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/dummy_current', $plugin_paths );
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
			->willReturnOnConsecutiveCalls( false, TEST_DATA_PATH . '/plugins/dummy_current' );

		$plugin_paths = $this->locator->find_using_option( 'test_plugin_paths', true );

		$this->assertTrue( is_array( $plugin_paths ) );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/dummy_current', $plugin_paths );
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
			->willReturnOnConsecutiveCalls( TEST_DATA_PATH . '/plugins/dummy_current', false );

		$plugin_paths = $this->locator->find_using_option( 'test_plugin_paths' );

		$this->assertTrue( is_array( $plugin_paths ) );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/dummy_current', $plugin_paths );
	}

	/**
	 * Tests that plugins activating this request are not discovered if a nonce is not set.
	 */
	public function test_activating_this_request_does_nothing_without_nonce() {
		$_REQUEST['action'] = 'activate';
		$_REQUEST['plugin'] = 'dummy_current/dummy_current.php';

		$plugin_paths = $this->locator->find_activating_this_request();

		$this->assertTrue( is_array( $plugin_paths ) );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that plugins activating this request are not discovered if there aren't any.
	 */
	public function test_activating_this_request_does_nothing_without_parameters() {
		$plugin_paths = $this->locator->find_activating_this_request();

		$this->assertTrue( is_array( $plugin_paths ) );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that single plugins activating this request are found.
	 */
	public function test_activating_this_request_works_for_single() {
		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = 'activate';
		$_REQUEST['plugin']   = 'dummy_current\\\\dummy_current.php';

		$this->path_processor->expects( $this->exactly( 2 ) )
			->method( 'find_directory_with_autoloader' )
			->withConsecutive(
				array( 0 ),
				array( 'dummy_current\\dummy_current.php' )
			)
			->willReturnOnConsecutiveCalls( false, TEST_DATA_PATH . '/plugins/dummy_current' );

		$plugin_paths = $this->locator->find_activating_this_request();

		$this->assertTrue( is_array( $plugin_paths ) );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/dummy_current', $plugin_paths );
	}

	/**
	 * Tests that multiple plugins activating this request are found.
	 */
	public function test_activating_this_request_works_for_multiple() {
		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = 'activate-selected';
		$_REQUEST['checked']  = array( 'dummy_current\\\\dummy_current.php' );

		$this->path_processor->expects( $this->exactly( 2 ) )
			->method( 'find_directory_with_autoloader' )
			->withConsecutive(
				array( 0 ),
				array( 'dummy_current\\dummy_current.php' )
			)
			->willReturnOnConsecutiveCalls( false, TEST_DATA_PATH . '/plugins/dummy_current' );

		$plugin_paths = $this->locator->find_activating_this_request();

		$this->assertTrue( is_array( $plugin_paths ) );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/dummy_current', $plugin_paths );
	}
}
