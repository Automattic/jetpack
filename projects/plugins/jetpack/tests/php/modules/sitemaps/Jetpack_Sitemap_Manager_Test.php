<?php

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemaps.php';

/**
 * Test class for Jetpack_Sitemap_Manager
 *
 * @covers Jetpack_Sitemap_Manager
 */
#[CoversClass( Jetpack_Sitemap_Manager::class )]
class Jetpack_Sitemap_Manager_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @var Jetpack_Sitemap_Manager
	 */
	private $manager;

	public function set_up() {
		parent::set_up();
		$this->manager = new Jetpack_Sitemap_Manager();
	}

	/**
	 * Constructor does not throw any fatal errors.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_constructor() {
		$manager = new Jetpack_Sitemap_Manager(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->assertTrue( true );
	}

	/**
	 * Tests that the sitemap cron schedule is added correctly.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_adds_cron_schedule() {
		$schedules = array();
		$result    = $this->manager->callback_add_sitemap_schedule( $schedules );

		$this->assertArrayHasKey( 'sitemap-interval', $result );
		$this->assertEquals( 'Sitemap Interval', $result['sitemap-interval']['display'] );
		$this->assertEquals( JP_SITEMAP_INTERVAL, $result['sitemap-interval']['interval'] );
	}

	/**
	 * Tests that robots.txt is modified correctly.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_modifies_robotstxt() {
		ob_start();
		$this->manager->callback_action_do_robotstxt();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Sitemap: ', $output );
		$this->assertStringContainsString( 'sitemap.xml', $output );
		$this->assertStringContainsString( 'news-sitemap.xml', $output );
	}

	/**
	 * Tests that the news sitemap cache is flushed when a post is published.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_flushes_news_sitemap_cache() {
		// Set up a mock cache entry
		set_transient( 'jetpack_news_sitemap_xml', 'test cache data' );

		$this->manager->callback_action_flush_news_sitemap_cache();

		$this->assertFalse( get_transient( 'jetpack_news_sitemap_xml' ) );
	}

	/**
	 * Tests that all sitemap data is purged correctly.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_purges_all_data() {
		// Set up mock data
		set_transient( 'jetpack_news_sitemap_xml', 'test cache data' );

		$this->manager->callback_action_purge_data();

		$this->assertFalse( get_transient( 'jetpack_news_sitemap_xml' ) );
	}
}
