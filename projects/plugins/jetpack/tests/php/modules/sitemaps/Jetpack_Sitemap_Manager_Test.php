<?php

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemaps.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-utils.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-posts.php';

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
	 * @dataProvider sitemap_contents
	 */
	#[DataProvider( 'sitemap_contents' )]
	public function test_readiness_uses_the_stored_master_index( $contents, $ready ) {
		$librarian = new Jetpack_Sitemap_Librarian();
		$this->assertFalse( $this->manager->is_sitemap_ready() );
		$librarian->store_sitemap_data( '0', JP_MASTER_SITEMAP_TYPE, $contents, '' );
		$this->assertSame( $ready, $this->manager->is_sitemap_ready() );
		$librarian->delete_sitemap_data( jp_sitemap_filename( JP_MASTER_SITEMAP_TYPE, '0' ), JP_MASTER_SITEMAP_TYPE );
		$this->assertFalse( $this->manager->is_sitemap_ready() );
	}

	public static function sitemap_contents() {
		return array(
			'empty storage'   => array( '', false ),
			'generated index' => array( '<sitemapindex/>', true ),
		);
	}

	public function test_core_fallback_honors_noindex_before_pagination_and_preserves_other_queries() {
		$visible = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$hidden  = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		update_post_meta( $visible, 'jetpack_seo_noindex', '0' );
		update_post_meta( $hidden, 'jetpack_seo_noindex', '1' );
		$callback = array( 'Jetpack_SEO_Posts', 'exclude_noindex_posts_from_jetpack_sitemap' );
		add_filter( 'jetpack_sitemap_skip_post', $callback, 10, 2 );
		$limit = static function () {
			return 1;
		};
		add_filter( 'wp_sitemaps_max_urls', $limit );
		$provider = new WP_Sitemaps_Posts();
		$this->assertSame( 1, $provider->get_max_num_pages( 'post' ) );
		$this->assertSame( array( get_permalink( $visible ) ), array_column( $provider->get_url_list( 1, 'post' ), 'loc' ) );
		$this->assertContains(
			$hidden,
			wp_list_pluck( get_posts( array( 'suppress_filters' => false ) ), 'ID' )
		);
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );
		$this->assertSame( 2, $provider->get_max_num_pages( 'post' ) );
		$this->assertSame( array( get_permalink( $hidden ) ), array_column( $provider->get_url_list( 2, 'post' ), 'loc' ) );
		remove_filter( 'jetpack_disable_seo_tools', '__return_true' );
		remove_filter( 'wp_sitemaps_max_urls', $limit );
		remove_filter( 'jetpack_sitemap_skip_post', $callback );
	}

	public function test_core_fallback_honors_custom_jetpack_post_exclusions() {
		$visible = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$hidden  = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$exclude = static function ( $skip, $post ) use ( $hidden ) {
			return $skip || $hidden === $post->ID;
		};
		add_filter( 'jetpack_sitemap_skip_post', $exclude, 10, 2 );
		$provider = new WP_Sitemaps_Posts();
		$this->assertSame( array( get_permalink( $visible ) ), array_column( $provider->get_url_list( 1, 'post' ), 'loc' ) );
		remove_filter( 'jetpack_sitemap_skip_post', $exclude );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState  disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_cli_generation_defers_cache_recovery_to_a_web_request() {
		define( 'WP_CLI', true );
		$GLOBALS['seo_test_purged_urls'] = array();
		$this->register_pressable_cache_stub();
		$purges = array();
		$record = static function ( $urls ) use ( &$purges ) {
			$purges[] = $urls;
		};
		add_action( 'edge_cache_purge_uris', $record );
		$librarian = new Jetpack_Sitemap_Librarian();
		$librarian->store_sitemap_data( '0', JP_MASTER_SITEMAP_TYPE, '<sitemapindex/>', '' );
		$this->assertSame( array(), $purges );
		$this->assertSame( 'first-build', get_option( 'jetpack_sitemap_pending_cache_purge' ) );
		Jetpack_Sitemap_Manager::callback_purge_pending_index_cache();
		$this->assertSame( 'first-build', get_option( 'jetpack_sitemap_pending_cache_purge' ) );
		delete_option( 'jetpack_sitemap_pending_cache_purge' );
		$librarian->store_sitemap_data( '0', JP_MASTER_SITEMAP_TYPE, '<sitemapindex><sitemap/></sitemapindex>', '' );
		$this->assertSame( 'urls', get_option( 'jetpack_sitemap_pending_cache_purge' ) );
		$this->assertSame( array(), $GLOBALS['seo_test_purged_urls'] );
		remove_action( 'edge_cache_purge_uris', $record );
	}

	/**
	 * @dataProvider cache_purge_scopes
	 */
	#[DataProvider( 'cache_purge_scopes' )]
	public function test_web_request_consumes_pending_recovery_once( $pending, $edge_purges ) {
		update_option( 'jetpack_sitemap_pending_cache_purge', $pending, false );
		$purges = array();
		$record = static function ( $urls ) use ( &$purges ) {
			$purges[] = $urls;
		};
		add_action( 'edge_cache_purge_uris', $record );
		Jetpack_Sitemap_Manager::callback_purge_pending_index_cache();
		$this->assertFalse( get_option( 'jetpack_sitemap_pending_cache_purge' ) );
		Jetpack_Sitemap_Manager::callback_purge_pending_index_cache();
		$this->assertCount( $edge_purges, $purges );
		remove_action( 'edge_cache_purge_uris', $record );
	}

	public static function cache_purge_scopes() {
		return array(
			'first build'     => array( 'first-build', 1 ),
			'routine rebuild' => array( 'urls', 0 ),
		);
	}

	/**
	 * @dataProvider sitemap_contents
	 */
	#[DataProvider( 'sitemap_contents' )]
	public function test_robots_discovery_follows_index_readiness( $contents, $ready ) {
		$librarian = new Jetpack_Sitemap_Librarian();
		$librarian->store_sitemap_data( '0', JP_MASTER_SITEMAP_TYPE, $contents, '' );
		$core_line  = 'Sitemap: ' . esc_url( get_sitemap_url( 'index' ) ) . "\n";
		$other_line = 'Sitemap: ' . esc_url( get_sitemap_url( 'index' ) ) . "-custom.xml\n";
		$output     = $this->manager->callback_filter_core_robots( "User-agent: *\n" . $core_line . $other_line );
		$this->assertSame( ( $ready ? "User-agent: *\n" : "User-agent: *\n" . $core_line ) . $other_line, $output );
		ob_start();
		$this->manager->callback_action_do_robotstxt();
		$jetpack_output = ob_get_clean();
		$this->assertSame( $ready, false !== strpos( $jetpack_output, 'Sitemap: ' . esc_url( jetpack_sitemap_uri() ) . "\n" ) );
	}

	public function test_master_changes_notify_cache_adapters_with_only_discovery_urls() {
		$changes = array();
		$record  = static function ( $url, $urls ) use ( &$changes ) {
			$changes[] = array( $url, $urls );
		};
		add_action( 'jetpack_sitemap_index_updated', $record, 10, 2 );
		$librarian = new Jetpack_Sitemap_Librarian();
		$librarian->store_sitemap_data( '1', JP_PAGE_SITEMAP_TYPE, '<urlset/>', '' );
		$this->assertSame( array(), $changes );
		$librarian->store_sitemap_data( '0', JP_MASTER_SITEMAP_TYPE, '<sitemapindex/>', '' );
		$this->assertSame(
			array( array( jetpack_sitemap_uri(), array( jetpack_sitemap_uri(), get_sitemap_url( 'index' ), home_url( '/robots.txt' ) ) ) ),
			$changes
		);
		$librarian->delete_sitemap_data( jp_sitemap_filename( JP_MASTER_SITEMAP_TYPE, '0' ), JP_MASTER_SITEMAP_TYPE );
		$this->assertCount( 2, $changes );
		remove_action( 'jetpack_sitemap_index_updated', $record );
	}

	/**
	 * @dataProvider         cache_permalink_structures
	 * @runInSeparateProcess
	 * @preserveGlobalState  disabled
	 */
	#[DataProvider( 'cache_permalink_structures' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_batcache_invalidation_uses_the_cache_permalink( $permalink_structure, $provider ) {
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( $permalink_structure );
		if ( 'pressable' === $provider ) {
			$this->register_pressable_cache_stub();
		} else {
			// phpcs:ignore Squiz.PHP.InnerFunctions.NotAllowed -- Isolated optional-plugin stub.
			function batcache_clear_url( $url ) {
				$GLOBALS['seo_test_purged_urls'][] = $url;
			}
		}
		$GLOBALS['seo_test_purged_urls'] = array();
		Jetpack_Sitemap_Manager::callback_invalidate_index_cache();
		$this->assertSame(
			$permalink_structure
			? array( jetpack_sitemap_uri(), get_sitemap_url( 'index' ), home_url( '/robots.txt' ) )
			: array( home_url( '/' ), home_url( '/robots.txt' ) ),
			$GLOBALS['seo_test_purged_urls']
		);
	}

	private function register_pressable_cache_stub() {
		// phpcs:ignore Squiz.PHP.InnerFunctions.NotAllowed -- Isolated optional-plugin stub.
		function pcm_flush_batcache_url( $url ) {
			$GLOBALS['seo_test_purged_urls'][] = $url;
		}
	}

	public static function cache_permalink_structures() {
		return array(
			'plain Batcache'   => array( '', 'batcache' ),
			'pretty Batcache'  => array( '/%postname%/', 'batcache' ),
			'plain Pressable'  => array( '', 'pressable' ),
			'pretty Pressable' => array( '/%postname%/', 'pressable' ),
		);
	}

	/**
	 * @dataProvider initial_index_contents
	 */
	#[DataProvider( 'initial_index_contents' )]
	public function test_edge_purge_occurs_only_when_an_index_first_becomes_usable( $initial_contents ) {
		$purges = array();
		$record = static function ( $urls ) use ( &$purges ) {
			$purges[] = $urls;
		};
		add_action( 'edge_cache_purge_uris', $record );
		$librarian = new Jetpack_Sitemap_Librarian();
		if ( null !== $initial_contents ) {
			$librarian->store_sitemap_data( '0', JP_MASTER_SITEMAP_TYPE, $initial_contents, '' );
		}
		$this->assertSame( array(), $purges );
		$librarian->store_sitemap_data( '0', JP_MASTER_SITEMAP_TYPE, '<sitemapindex/>', '' );
		$this->assertSame( array( array( jetpack_sitemap_uri(), get_sitemap_url( 'index' ), home_url( '/robots.txt' ) ) ), $purges );
		$librarian->store_sitemap_data( '0', JP_MASTER_SITEMAP_TYPE, '<sitemapindex><sitemap/></sitemapindex>', '' );
		$this->assertCount( 1, $purges );
		remove_action( 'edge_cache_purge_uris', $record );
	}

	public static function initial_index_contents() {
		return array(
			'new index'   => array( null ),
			'empty index' => array( '' ),
		);
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
	 * Tests default value of 'jetpack_sitemap_location' filter.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_filter_sitemap_location_sets_option_default() {
		// Start with an empty option.
		delete_option( 'jetpack_sitemap_location' );

		// Check default value.
		$this->manager->callback_action_filter_sitemap_location();
		$location = get_option( 'jetpack_sitemap_location' );
		$this->assertSame( '', $location );

		// Clean up.
		delete_option( 'jetpack_sitemap_location' );
	}

	/**
	 * Tests value of 'jetpack_sitemap_location' when a filter is added.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_filter_sitemap_location_sets_option_add() {
		// Start with an empty option.
		delete_option( 'jetpack_sitemap_location' );

		// Set the location.
		function add_location( $string ) { // phpcs:ignore Squiz.PHP.InnerFunctions.NotAllowed,Squiz.Commenting.FunctionComment.WrongStyle
			$string .= '/blah';
			return $string;
		}
		add_filter( 'jetpack_sitemap_location', 'add_location' );

		$this->manager->callback_action_filter_sitemap_location();
		$location = get_option( 'jetpack_sitemap_location' );
		$this->assertEquals( '/blah', $location );

		// Clean up.
		delete_option( 'jetpack_sitemap_location' );
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
