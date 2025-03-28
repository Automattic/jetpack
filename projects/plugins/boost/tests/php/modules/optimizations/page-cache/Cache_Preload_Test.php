<?php
/**
 * Tests for Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Cache_Preload class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Cache_Preload;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Brain\Monkey\Functions;
use Mockery;
use PHPUnit\Framework\TestCase;

/**
 * Class Test_Cache_Preload
 */
class Cache_Preload_Test extends TestCase {

	/**
	 * Set up tests.
	 */
	protected function setUp(): void {
		parent::setUp();
		// Set up Brain Monkey to mock WordPress functions.
		\Brain\Monkey\setUp();
	}

	/**
	 * Tear down tests.
	 */
	protected function tearDown(): void {
		// Tear down Brain Monkey.
		\Brain\Monkey\tearDown();
		Mockery::close();
		parent::tearDown();
	}

	/**
	 * Test the get_slug method returns the correct value.
	 */
	public function test_get_slug() {
		$this->assertEquals( 'cache_preload', Cache_Preload::get_slug() );
	}

	/**
	 * Test the is_available method returns true.
	 */
	public function test_is_available() {
		$this->assertTrue( Cache_Preload::is_available(), 'Should return true when constant is defined as true' );
	}

	/**
	 * Test schedule correctly schedules the event.
	 */
	public function test_schedule() {
		$posts = array( 'https://example.com', 'https://example.com/page' );
		Functions\expect( 'wp_schedule_single_event' )
			->once()
			->with( Mockery::type( 'int' ), 'jetpack_boost_preload', array( $posts ) );

		$preload = new Cache_Preload();
		$preload->schedule( $posts );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test preload with an empty queue.
	 */
	public function test_preload_empty_posts() {
		// Set up the mock
		$preload = new Cache_Preload();

		$preload->request_pages( array() );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test preload method rebuilds cache for provided URLs.
	 */
	public function test_preload() {
		define( 'JETPACK_BOOST_CACHE_DURATION', 1 );
		define( 'ABSPATH', '/pseudo' );

		$urls = array( 'https://example.com', 'https://example.com/page' );

		$preload = new Cache_Preload();
		// Mock wp_remote_get
		foreach ( $urls as $url ) {
			Functions\expect( 'wp_remote_get' )
				->once()
				->with( $url, Mockery::type( 'array' ) );
			Functions\expect( 'wp_remote_retrieve_response_code' )
				->once()
				->withAnyArgs()
				->andReturn( 200 );
		}

		// Mock WordPress functions
		Functions\expect( 'remove_action' )
			->once()
			->withArgs( array( 'jetpack_boost_invalidate_cache_success', array( $preload, 'handle_cache_invalidation' ) ) );

		Functions\expect( 'add_action' )
			->once()
			->withArgs( array( 'jetpack_boost_invalidate_cache_success', array( $preload, 'handle_cache_invalidation' ), 10, 2 ) );

		// Execute the method being tested
		$preload->preload( $urls );

		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test request_pages with posts in the queue.
	 */
	public function test_request_pages_with_posts() {
		$posts = array( 'https://example.com', 'https://example.com/page' );

		// Set up the mock
		$preload = new Cache_Preload();

		// Mock wp_remote_get
		foreach ( $posts as $post ) {
			Functions\expect( 'wp_remote_get' )
				->once()
				->with( $post, Mockery::type( 'array' ) );
			Functions\expect( 'wp_remote_retrieve_response_code' )
				->once()
				->withAnyArgs()
				->andReturn( 200 );
		}

		$preload->request_pages( $posts );

		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test schedule with a single URL.
	 */
	public function test_schedule_single() {
		$new_url = array( 'https://example.com/new' );

		// Set up the mock
		$preload = new Cache_Preload();

		Functions\expect( 'wp_schedule_single_event' )
			->once()
			->with( Mockery::type( 'int' ), 'jetpack_boost_preload', array( $new_url ) );

		$preload->schedule( $new_url );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test schedule with multiple URLs.
	 */
	public function test_schedule_multiple() {
		$new_urls = array( 'https://example.com/new1', 'https://example.com/new2' );

		// Set up the mock
		$preload = new Cache_Preload();

		Functions\expect( 'wp_schedule_single_event' )
			->once()
			->with( Mockery::type( 'int' ), 'jetpack_boost_preload', array( $new_urls ) );

		$preload->schedule( $new_urls );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test handle_post_update when the post is a cornerstone page.
	 */
	public function test_handle_post_update_cornerstone() {
		$post_id   = 123;
		$permalink = 'https://example.com/cornerstone';

		Functions\expect( 'get_permalink' )
			->once()
			->with( $post_id )
			->andReturn( $permalink );

		// Mock the Cornerstone_Utils class
		$cornerstone_utils = Mockery::mock( 'alias:' . Cornerstone_Utils::class );
		$cornerstone_utils->shouldReceive( 'is_cornerstone_page' )
			->once()
			->with( $post_id )
			->andReturn( true );

		Functions\expect( 'wp_schedule_single_event' )
			->once()
			->with( Mockery::type( 'int' ), 'jetpack_boost_preload', array( array( $permalink ) ) );

		$preload = new Cache_Preload();
		$preload->handle_post_update( $post_id );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test handle_post_update when the post is not a cornerstone page.
	 */
	public function test_handle_post_update_not_cornerstone() {
		$post_id = 123;

		// Mock the Cornerstone_Utils class
		$cornerstone_utils = Mockery::mock( 'alias:' . Cornerstone_Utils::class );
		$cornerstone_utils->shouldReceive( 'is_cornerstone_page' )
			->once()
			->with( $post_id )
			->andReturn( false );

		// Set up the mock
		$preload = new Cache_Preload();

		// The schedule should never be called because the post is not a cornerstone page
		Functions\expect( 'get_permalink' )->never();
		Functions\expect( 'wp_schedule_single_event' )->never();

		$preload->handle_post_update( $post_id );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test handle_cache_invalidation when all cache is invalidated.
	 */
	public function test_handle_cache_invalidation_all() {
		$path = '/';

		Functions\expect( 'wp_schedule_single_event' )
			->once()
			->with( Mockery::type( 'int' ), 'jetpack_boost_preload_cornerstone' );

		// Set up the mock
		$preload = new Cache_Preload();
		$preload->handle_cache_invalidation( $path, Filesystem_Utils::DELETE_ALL );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test handle_cache_invalidation when a specific cornerstone page has their cache invalidated.
	 */
	public function test_handle_cache_invalidation_specific_cornerstone() {
		$path              = 'https://example.com/page1';
		$cornerstone_pages = array( 'https://example.com/page1', 'https://example.com/page2' );

		// Mock the Cornerstone_Utils class
		$cornerstone_utils = Mockery::mock( 'alias:' . Cornerstone_Utils::class );
		$cornerstone_utils->shouldReceive( 'get_list' )
			->once()
			->andReturn( $cornerstone_pages );

		Functions\expect( 'wp_schedule_single_event' )
			->once()
			->with( Mockery::type( 'int' ), 'jetpack_boost_preload', array( array( $path ) ) );

		$preload = new Cache_Preload();
		$preload->handle_cache_invalidation( $path, Filesystem_Utils::DELETE_FILE );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test handle_cache_invalidation when a non-cornerstone page is invalidated.
	 */
	public function test_handle_cache_invalidation_non_cornerstone() {
		$path              = 'https://example.com/page3';
		$cornerstone_pages = array( 'https://example.com/page1', 'https://example.com/page2' );

		// Mock the Cornerstone_Utils class
		$cornerstone_utils = Mockery::mock( 'alias:' . Cornerstone_Utils::class );
		$cornerstone_utils->shouldReceive( 'get_list' )
			->once()
			->andReturn( $cornerstone_pages );

		// Since this is not a cornerstone page, no scheduling should happen
		Functions\expect( 'wp_schedule_single_event' )->never();

		$preload = new Cache_Preload();
		$preload->handle_cache_invalidation( $path, Filesystem_Utils::DELETE_FILE );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test the setup method registers the correct hooks.
	 */
	public function test_setup() {
		Functions\expect( 'add_action' )
			->once()
			->withArgs( array( 'update_option_jetpack_boost_ds_cornerstone_pages_list', Mockery::type( 'array' ) ) );

		Functions\expect( 'add_action' )
			->once()
			->withArgs( array( 'jetpack_boost_preload', Mockery::type( 'array' ) ) );

		Functions\expect( 'add_action' )
			->once()
			->withArgs( array( 'post_updated', Mockery::type( 'array' ), 10, 1 ) );

		Functions\expect( 'add_action' )
			->once()
			->withArgs( array( 'jetpack_boost_invalidate_cache_success', Mockery::type( 'array' ), 10, 2 ) );

		$preload = new Cache_Preload();
		$preload->setup();
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test the activate method.
	 */
	public function test_activate() {
		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'jetpack_boost_preload_cornerstone' )
			->andReturn( false );

		Functions\expect( 'wp_schedule_event' )
			->once()
			->with( Mockery::type( 'int' ), 'twicehourly', 'jetpack_boost_preload_cornerstone' );

		Cache_Preload::activate();
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test schedule_cornerstone method.
	 */
	public function test_schedule_cornerstone() {
		Functions\expect( 'wp_schedule_single_event' )
			->once()
			->with( Mockery::type( 'int' ), 'jetpack_boost_preload_cornerstone' );

		$preload = new Cache_Preload();
		$preload->schedule_cornerstone();
		$this->expectNotToPerformAssertions();
	}
}
