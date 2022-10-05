<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests XMLRPC_Provider class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Jetpack_Options;

/**
 * Class to test the XMLRPC_Provider class.
 *
 * @covers Automattic\Jetpack\Stats\XMLRPC_Provider
 */
class Test_XMLRPC_Provider extends StatsBaseTestCase {
	/**
	 * An instance of XMLRPC_Provider class.
	 *
	 * @var Automattic\Jetpack\Stats\XMLRPC_Provider
	 */
	protected $xmlrpc_instance;

	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::set_up();

		$this->xmlrpc_instance = XMLRPC_Provider::init();
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		parent::tear_down();

		$reflected_class    = new \ReflectionClass( 'Automattic\Jetpack\Stats\XMLRPC_Provider' );
		$reflected_property = $reflected_class->getProperty( 'instance' );
		$reflected_property->setAccessible( true );
		$reflected_property = $reflected_property->setValue( null );
	}

	/**
	 * Test XMLRPC_Provider::init adds the 'jetpack_xmlrpc_unauthenticated_methods' filter.
	 */
	public function test_jetpack_xmlrpc_unauthenticated_methods_filter() {

		$has_filter = has_filter( 'jetpack_xmlrpc_unauthenticated_methods', array( $this->xmlrpc_instance, 'xmlrpc_methods' ) );
		$this->assertEquals( 10, $has_filter );
	}

	/**
	 * Test XMLRPC_Provider::xmlrpc_methods.
	 */
	public function test_xmlrpc_methods_will_not_add_get_blog_without_connection() {
		Jetpack_Options::delete_option( 'blog_token' );
		$xmlrpc_methods = $this->xmlrpc_instance->xmlrpc_methods( array() );
		$this->assertArrayNotHasKey( 'jetpack.getBlog', $xmlrpc_methods );
	}

	/**
	 * Test XMLRPC_Provider::xmlrpc_methods.
	 */
	public function test_xmlrpc_methods_will_not_add_get_blog_without_active_stats_module() {
		$xmlrpc_methods = $this->xmlrpc_instance->xmlrpc_methods( array() );
		$this->assertArrayNotHasKey( 'jetpack.getBlog', $xmlrpc_methods );
	}

	/**
	 * Test XMLRPC_Provider::xmlrpc_methods.
	 */
	public function test_xmlrpc_methods_with_active_stats_module() {
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		$xmlrpc_methods = $this->xmlrpc_instance->xmlrpc_methods( array() );
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		$this->assertArrayHasKey( 'jetpack.getBlog', $xmlrpc_methods );
	}

	/**
	 * Test XMLRPC_Provider::getBlog.
	 */
	public function test_get_blog() {
		$blog_description = '<p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>';
		update_option( 'blogdescription', $blog_description );
		$stats_blog = $this->xmlrpc_instance->get_blog();

		$expected_stats_blog = array(
			'admin_bar'           => true,
			'count_roles'         => array(),
			'do_not_track'        => true,
			'version'             => self::DEFAULT_STATS_VERSION,
			'host'                => 'example.org',
			'path'                => '/',
			'blogname'            => false,
			'blogdescription'     => '&lt;p&gt;Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.&lt;/p&gt;',
			'siteurl'             => 'http://example.org',
			'gmt_offset'          => false,
			'timezone_string'     => false,
			'stats_version'       => self::DEFAULT_STATS_VERSION,
			'stats_api'           => 'jetpack',
			'page_on_front'       => false,
			'permalink_structure' => false,
			'category_base'       => false,
			'tag_base'            => false,
		);

		$this->assertSame( $expected_stats_blog, $stats_blog );
	}
}
