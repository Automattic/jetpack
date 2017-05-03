<?php
/**
 * Test suite for testing object cache behaviour
 */
class WP_Test_Object_Cache_Jetpack extends WP_UnitTestCase {

	/**
	 * @var WP_Object_Cache a saved instance of the cache class.
	 */
	protected static $stored_cache;

	/**
	 * @var Jetpack_Test_Object_Cache a mock instance of the cache class.
	 */
	protected static $cache;

	public static function setUpBeforeClass() {
		global $wp_object_cache;
		parent::setUpBeforeClass();

		require_once dirname( __FILE__ ) . "/../lib/class-wp-object-cache.php";

		self::$stored_cache = $wp_object_cache;

		wp_using_ext_object_cache( true );
	}

	public function setUp() {
		global $wp_object_cache;
		parent::setUp();

		$wp_object_cache = self::$cache = $this->getMockBuilder( 'Jetpack_Test_Object_Cache' )
						 ->setMethods( array( 'get', 'set' ) )
						 ->getMock();
	}

	public static function tearDownAfterClass() {
		global $wp_object_cache;
		parent::tearDownAfterClass();

		wp_using_ext_object_cache( false );

		$wp_object_cache = self::$stored_cache;
	}

	function test_generate_secrets_get_saved_to_cache() {

		self::$cache->expects( $this->once() )
			->method( 'set' )
			->with( $this->equalTo( 'jetpack_some_name_' . get_current_user_id() ) );

		Jetpack::generate_secrets( 'some_name' );
	}

	/**
	 * @requires PHP 5.3
	 */
	function test_generate_secrets_restores_from_cache() {
		self::$cache->expects( $this->once() )
			->method( 'get' )
			->with( $this->equalTo( 'jetpack_some_name_' . get_current_user_id() ) )
			->willReturn( 'some_secret' );

		$this->assertEquals( get_transient( 'jetpack_some_name_' . get_current_user_id() ), 'some_secret' );
	}

	/**
	 * @requires PHP 5.3
	 */
	function test_generate_secrets_handles_errors() {
		self::$cache->expects( $this->once() )
			->method( 'set' )
			->with( $this->equalTo( 'jetpack_some_name_' . get_current_user_id() ) )
			->willReturn( false );

		$secret = Jetpack::generate_secrets( 'some_name' );

		$this->assertInstanceOf( 'WP_Error', $secret );
	}
}
