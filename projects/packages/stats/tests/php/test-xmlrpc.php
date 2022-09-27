<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests Options class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Constants;
use Jetpack_Options;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Class to test the XMLRPC class.
 *
 * @covers Automattic\Jetpack\Stats\XMLRPC
 */
class Test_XMLRPC extends BaseTestCase {
	/**
	 * An instance of XMLRPC class.
	 *
	 * @var XMLRPC
	 */
	protected $xmlrpc_instance;

	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::setUp();
		Constants::set_constant( 'STATS_VERSION', '9' );
		Jetpack_Options::update_option( 'id', 1234 );

		$this->xmlrpc_instance = XMLRPC::init();
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
		Constants::clear_constants();

		$reflected_class    = new \ReflectionClass( 'Automattic\Jetpack\Stats\XMLRPC' );
		$reflected_property = $reflected_class->getProperty( 'instance' );
		$reflected_property->setAccessible( true );
		$reflected_property = $reflected_property->setValue( null );
	}

	/**
	 * Test XMLRPC::init adds the 'jetpack_xmlrpc_unauthenticated_methods' filter.
	 */
	public function test_jetpack_xmlrpc_unauthenticated_methods_filter() {

		$has_filter = has_filter( 'jetpack_xmlrpc_unauthenticated_methods', array( $this->xmlrpc_instance, 'xmlrpc_methods' ) );
		$this->assertEquals( 10, $has_filter );
	}

	/**
	 * Test XMLRPC::xmlrpc_methods.
	 */
	public function test_xmlrpc_methods() {
		$xmlrpc_methods = $this->xmlrpc_instance->xmlrpc_methods( array() );
		$this->assertArrayHasKey( 'jetpack.getBlog', $xmlrpc_methods );
	}

	/**
	 * Test XMLRPC::getBlog.
	 */
	public function test_get_blog() {
		$blog_description = '<p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>';
		update_option( 'blogdescription', $blog_description );
		$stats_blog = $this->xmlrpc_instance->get_blog();

		$expected_stats_blog = array(
			'admin_bar'           => true,
			'count_roles'         => array(),
			'do_not_track'        => true,
			'version'             => '9',
			'host'                => 'example.org',
			'path'                => '/',
			'blogname'            => false,
			'blogdescription'     => '&lt;p&gt;Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.&lt;/p&gt;',
			'siteurl'             => 'http://example.org',
			'gmt_offset'          => false,
			'timezone_string'     => false,
			'stats_version'       => '9',
			'stats_api'           => 'jetpack',
			'page_on_front'       => false,
			'permalink_structure' => false,
			'category_base'       => false,
			'tag_base'            => false,
		);

		$this->assertSame( $expected_stats_blog, $stats_blog );
	}
}
