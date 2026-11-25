<?php
/**
 * News sitemap freshness regressions.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemaps.php';

/**
 * Tests the rolling publication window and cached output.
 *
 * @covers \Jetpack_Sitemap_Builder
 * @covers \Jetpack_Sitemap_Librarian
 */
#[CoversClass( Jetpack_Sitemap_Builder::class )]
#[CoversClass( Jetpack_Sitemap_Librarian::class )]
class Jetpack_News_Sitemap_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function set_up() {
		parent::set_up();
		delete_transient( 'jetpack_news_sitemap_xml' );
		delete_transient( 'jetpack_news_sitemap_xml_v2' );
	}

	/** @dataProvider publication_offsets */
	#[DataProvider( 'publication_offsets' )]
	public function test_query_uses_publication_utc_instead_of_local_calendar_days( $offset ) {
		$now    = time();
		$recent = self::factory()->post->create(
			array(
				'post_status'   => 'publish',
				'post_date'     => gmdate( 'Y-m-d H:i:s', $now - 46 * HOUR_IN_SECONDS + $offset * HOUR_IN_SECONDS ),
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', $now - 46 * HOUR_IN_SECONDS ),
			)
		);
		self::factory()->post->create(
			array(
				'post_status'   => 'publish',
				'post_date'     => gmdate( 'Y-m-d H:i:s', $now - 50 * HOUR_IN_SECONDS + $offset * HOUR_IN_SECONDS ),
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', $now - 50 * HOUR_IN_SECONDS ),
			)
		);
		$posts = ( new Jetpack_Sitemap_Librarian() )->query_most_recent_posts( 1000 );
		$this->assertSame( array( $recent ), array_map( 'intval', wp_list_pluck( $posts, 'ID' ) ) );
	}

	public static function publication_offsets() {
		return array(
			'UTC'               => array( 0 ),
			'UTC minus twelve'  => array( -12 ),
			'UTC plus fourteen' => array( 14 ),
		);
	}

	public function test_cache_expires_when_oldest_included_article_leaves_the_window() {
		$now      = time();
		$deadline = $now + 30;
		$post     = self::factory()->post->create(
			array(
				'post_status'   => 'publish',
				'post_date'     => gmdate( 'Y-m-d H:i:s', $deadline - 2 * DAY_IN_SECONDS ),
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', $deadline - 2 * DAY_IN_SECONDS ),
			)
		);
		set_transient( 'jetpack_news_sitemap_xml', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.org/outdated/</loc></url></urlset>', 12 * HOUR_IN_SECONDS );
		$xml = ( new Jetpack_Sitemap_Builder() )->news_sitemap_xml();
		$this->assertStringContainsString( esc_url( get_permalink( $post ) ), $xml );
		$this->assertStringNotContainsString( 'https://example.org/outdated/', $xml );
		$this->assertEqualsWithDelta( $deadline, (int) get_option( '_transient_timeout_jetpack_news_sitemap_xml_v2' ), 1 );
	}

	public function test_no_recent_articles_do_not_invent_a_homepage_entry() {
		$xml = ( new Jetpack_Sitemap_Builder() )->news_sitemap_xml();
		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadXML( $xml ) );
		$this->assertSame( 0, $doc->getElementsByTagNameNS( 'http://www.sitemaps.org/schemas/sitemap/0.9', 'url' )->length );
	}
}
