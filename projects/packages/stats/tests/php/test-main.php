<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests Main class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Stats\Main as Stats;

/**
 * Class to test the Main class.
 *
 * @covers Automattic\Jetpack\Stats\Main
 * @todo Needs more unit tests
 */
class Test_Main extends StatsBaseTestCase {
	/**
	 * An instance of Main class.
	 *
	 * @var Automattic\Jetpack\Stats\Main
	 */
	protected $stats;

	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::set_up();

		$this->stats = Stats::init();
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		parent::tear_down();

		unset( $_SERVER['HTTP_DNT'] );

		$reflected_class    = new \ReflectionClass( 'Automattic\Jetpack\Stats\Main' );
		$reflected_property = $reflected_class->getProperty( 'instance' );
		$reflected_property->setAccessible( true );
		$reflected_property = $reflected_property->setValue( null );

		$reflected_class    = new \ReflectionClass( 'Automattic\Jetpack\Stats\XMLRPC_Provider' );
		$reflected_property = $reflected_class->getProperty( 'instance' );
		$reflected_property->setAccessible( true );
		$reflected_property = $reflected_property->setValue( null );
	}

	/**
	 * Test Main::init adds the `template_redirect` hook.
	 */
	public function test_template_redirect_hook() {
		$has_action = has_action( 'template_redirect', array( 'Automattic\Jetpack\Stats\Main', 'template_redirect' ) );
		$this->assertSame( 1, $has_action );
	}

	/**
	 * Test Main::init adds the `wp_head` hook.
	 */
	public function test_wp_head_hook() {
		$has_action = has_action( 'wp_head', array( 'Automattic\Jetpack\Stats\Main', 'hide_smile_css' ) );
		$this->assertEquals( 10, $has_action );
	}

	/**
	 * Test Main::init adds the `embed_head` hook.
	 */
	public function test_embed_head_hook() {
		$has_action = has_action( 'embed_head', array( 'Automattic\Jetpack\Stats\Main', 'hide_smile_css' ) );
		$this->assertEquals( 10, $has_action );
	}

	/**
	 * Test Main::init adds the 'map_meta_cap' filter.
	 */
	public function test_map_meta_cap_filter() {

		$has_filter = has_filter( 'map_meta_cap', array( 'Automattic\Jetpack\Stats\Main', 'map_meta_caps' ) );
		$this->assertEquals( 10, $has_filter );
	}

	/**
	 * Test Main::jetpack_is_dnt_enabled.
	 */
	public function test_jetpack_is_dnt_enabled() {
		$_SERVER['HTTP_DNT'] = true;
		add_filter( 'jetpack_honor_dnt_header_for_stats', array( __CLASS__, 'filter_jetpack_honor_dnt_header_for_stats' ), 10, 2 );
		$this->assertTrue( Stats::jetpack_is_dnt_enabled() );
		remove_filter( 'jetpack_honor_dnt_header_for_stats', array( __CLASS__, 'filter_jetpack_honor_dnt_header_for_stats' ), 10, 2 );
	}

	/**
	 * Test Main::jetpack_is_dnt_enabled without the `jetpack_honor_dnt_header_for_stats` filter.
	 */
	public function test_jetpack_is_dnt_enabled_without_filter() {
		$_SERVER['HTTP_DNT'] = true;

		$this->assertFalse( Stats::jetpack_is_dnt_enabled() );
	}

	/**
	 * Test Main::map_meta_caps
	 */
	public function test_view_stats_meta_mapping() {
		$dummy_user_id = wp_insert_user(
			array(
				'user_login' => 'dummy',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);

		$this->assertTrue( user_can( $dummy_user_id, 'view_stats' ) );
	}

	/**
	 * Filter the option which decides honor DNT or not.
	 *
	 * @param bool $honour_dnt Honors DNT for clients who don't want to be tracked. Defaults to false.
	 * @return bool
	 */
	public static function filter_jetpack_honor_dnt_header_for_stats( $honour_dnt = false ) {
		return true;
	}
}
