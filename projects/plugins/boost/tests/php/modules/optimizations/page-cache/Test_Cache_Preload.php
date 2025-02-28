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
class Test_Cache_Preload extends TestCase {

	/**
	 * Set up tests.
	 */
	protected function setUp(): void {
		parent::setUp();
		// Set up Brain Monkey to mock WordPress functions
		\Brain\Monkey\setUp();
	}

	/**
	 * Tear down tests.
	 */
	protected function tearDown(): void {
		// Tear down Brain Monkey
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
		$this->assertTrue( Cache_Preload::is_available() );
	}

	/**
	 * Test get_posts_to_preload returns the correct option value.
	 */
	public function test_get_posts_to_preload() {
		$expected_posts = array( 'https://example.com', 'https://example.com/page' );

		Functions\expect( 'get_option' )
			->once()
			->with( 'jetpack_boost_posts_to_preload', array() )
			->andReturn( $expected_posts );

		$preload = new Cache_Preload();
		$this->assertEquals( $expected_posts, $preload->get_posts_to_preload() );
	}

	/**
	 * Test set_posts_to_preload correctly updates the option.
	 */
	public function test_set_posts_to_preload() {
		$posts          = array( 'https://example.com', 'https://example.com/page', 'https://example.com' );
		$expected_posts = array( 'https://example.com', 'https://example.com/page' );

		Functions\expect( 'update_option' )
			->once()
			->with( 'jetpack_boost_posts_to_preload', $expected_posts, false )
			->andReturn( true );

		$preload = new Cache_Preload();
		$preload->set_posts_to_preload( $posts );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test schedule_cornerstone_preload correctly schedules all cornerstone pages.
	 */
	public function test_schedule_cornerstone_preload() {
		$cornerstone_pages = array( 'https://example.com', 'https://example.com/page' );

		// Mock the Cornerstone_Utils::get_list method
		$cornerstone_utils = Mockery::mock( 'alias:' . Cornerstone_Utils::class );
		$cornerstone_utils->shouldReceive( 'get_list' )
			->once()
			->andReturn( $cornerstone_pages );

		// Create a partial mock of Cache_Preload
		$preload = Mockery::mock( Cache_Preload::class )->makePartial();
		$preload->shouldReceive( 'schedule_preload' )
			->once()
			->with( $cornerstone_pages );

		$preload->schedule_cornerstone_preload();
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test schedule_preload_cronjob correctly schedules the cron event.
	 */
	public function test_schedule_preload_cronjob() {
		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'jetpack_boost_preload_pages' )
			->andReturn( false );

		Functions\expect( 'wp_schedule_single_event' )
			->once()
			->with( Mockery::type( 'int' ), 'jetpack_boost_preload_pages' );

		$preload = new Cache_Preload();
		$preload->schedule_preload_cronjob();
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test schedule_preload_cronjob doesn't schedule when already scheduled.
	 */
	public function test_schedule_preload_cronjob_already_scheduled() {
		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'jetpack_boost_preload_pages' )
			->andReturn( 1000 );

		Functions\expect( 'wp_schedule_single_event' )
			->never();

		$preload = new Cache_Preload();
		$preload->schedule_preload_cronjob();
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test preload_pages with an empty queue.
	 */
	public function test_preload_pages_empty_queue() {
		// Set up the mock
		$preload = Mockery::mock( Cache_Preload::class )->makePartial();
		$preload->shouldReceive( 'get_posts_to_preload' )
			->once()
			->andReturn( array() );

		$preload->preload_pages();
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test preload_pages with posts in the queue.
	 */
	public function test_preload_pages_with_queue() {
		$posts = array( 'https://example.com', 'https://example.com/page' );

		// Set up the mock
		$preload = Mockery::mock( Cache_Preload::class )->makePartial();
		$preload->shouldReceive( 'get_posts_to_preload' )
			->once()
			->andReturn( $posts );

		Functions\expect( 'update_option' )
			->once()
			->with( 'jetpack_boost_posts_to_preload', array(), false )
			->andReturn( true );

		$preload->preload_pages();
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test schedule_preload with a single URL.
	 */
	public function test_schedule_preload_single() {
		$existing = array( 'https://example.com/existing' );
		$new_url  = 'https://example.com/new';
		$expected = array( 'https://example.com/existing', 'https://example.com/new' );

		// Set up the mock
		$preload = Mockery::mock( Cache_Preload::class )->makePartial();

		$preload->shouldReceive( 'get_posts_to_preload' )
			->once()
			->andReturn( $existing );

		$preload->shouldReceive( 'set_posts_to_preload' )
			->once()
			->with( $expected );

		$preload->shouldReceive( 'schedule_preload_cronjob' )
			->once();

		$preload->schedule_preload( $new_url );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test schedule_preload with multiple URLs.
	 */
	public function test_schedule_preload_multiple() {
		$existing = array( 'https://example.com/existing' );
		$new_urls = array( 'https://example.com/new1', 'https://example.com/new2' );
		$expected = array(
			'https://example.com/existing',
			'https://example.com/new1',
			'https://example.com/new2',
		);

		// Set up the mock
		$preload = Mockery::mock( Cache_Preload::class )->makePartial();

		$preload->shouldReceive( 'get_posts_to_preload' )
			->once()
			->andReturn( $existing );

		$preload->shouldReceive( 'set_posts_to_preload' )
			->once()
			->with( $expected );

		$preload->shouldReceive( 'schedule_preload_cronjob' )
			->once();

		$preload->schedule_preload( $new_urls );
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

		// Set up the mock
		$preload = Mockery::mock( Cache_Preload::class )->makePartial();
		$preload->shouldReceive( 'schedule_preload' )
			->once()
			->with( $permalink );

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
		$preload = Mockery::mock( Cache_Preload::class )->makePartial();
		$preload->shouldReceive( 'schedule_preload' )->never();

		$preload->handle_post_update( $post_id );
		$this->expectNotToPerformAssertions();
	}

	/**
	 * Test handle_cache_invalidation when all cache is invalidated.
	 */
	public function test_handle_cache_invalidation_all() {
		$path              = '/';
		$cornerstone_pages = array( 'https://example.com/page1', 'https://example.com/page2' );

		// Mock the Cornerstone_Utils class
		$cornerstone_utils = Mockery::mock( 'alias:' . Cornerstone_Utils::class );
		$cornerstone_utils->shouldReceive( 'get_list' )
			->once()
			->andReturn( $cornerstone_pages );

		// Set up the mock
		$preload = Mockery::mock( Cache_Preload::class )->makePartial();
		$preload->shouldReceive( 'schedule_preload' )
			->once()
			->with( $cornerstone_pages );

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

		$expected_posts = array( 'https://example.com', 'https://example.com/page' );

		Functions\expect( 'get_option' )
			->once()
			->with( 'jetpack_boost_posts_to_preload', array() )
			->andReturn( $expected_posts );

		$preload = Mockery::mock( Cache_Preload::class )->makePartial();

		Functions\expect( 'update_option' )
			->once()
			->with( 'jetpack_boost_posts_to_preload', array_merge( $expected_posts, array( $path ) ), false )
			->andReturn( true );

		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'jetpack_boost_preload_pages' )
			->andReturn( false );

		Functions\expect( 'wp_schedule_single_event' )
			->once()
			->with( Mockery::type( 'int' ), 'jetpack_boost_preload_pages' );

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

		// Set up the mock
		$preload = Mockery::mock( Cache_Preload::class )->makePartial();
		$preload->shouldReceive( 'schedule_preload' )->never();

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
			->withArgs( array( 'jetpack_boost_preload_pages', Mockery::type( 'array' ) ) );

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
}
