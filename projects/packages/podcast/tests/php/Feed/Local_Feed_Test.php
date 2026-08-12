<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests\Feed;

use Automattic\Jetpack\Podcast\Feed\Local_Feed;
use Automattic\Jetpack\Podcast\Podcast;
use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionProperty;
use WorDBless\BaseTestCase;
use WP_Query;
use WP_Term;

/**
 * @covers \Automattic\Jetpack\Podcast\Feed\Local_Feed
 */
#[CoversClass( Local_Feed::class )]
class Local_Feed_Test extends BaseTestCase {

	const CATEGORY_ID = 7;

	protected function setUp(): void {
		parent::setUp();
		if ( ! taxonomy_exists( 'category' ) ) {
			register_taxonomy( 'category', 'post', array( 'hierarchical' => true ) );
		}

		$term = new WP_Term(
			(object) array(
				'term_id'          => self::CATEGORY_ID,
				'name'             => 'Podcast',
				'slug'             => 'podcast',
				'taxonomy'         => 'category',
				'term_taxonomy_id' => self::CATEGORY_ID,
			)
		);
		wp_cache_set( self::CATEGORY_ID, $term, 'terms' );

		update_option( 'podcasting_category_id', self::CATEGORY_ID );
		$this->set_module_active( true );
	}

	protected function tearDown(): void {
		$this->set_module_active( false );
		delete_option( 'podcasting_category_id' );
		wp_cache_flush();
		parent::tearDown();
	}

	/**
	 * `Podcast::init()` is a process-wide one-shot, so drive its flag directly
	 * rather than letting test order decide what this class sees.
	 *
	 * @param bool $active Whether the package should look initialized.
	 */
	private function set_module_active( bool $active ): void {
		( new ReflectionProperty( Podcast::class, 'initialized' ) )->setValue( null, $active );
	}

	private function feed_url(): string {
		return (string) get_term_feed_link( self::CATEGORY_ID, 'category' );
	}

	/**
	 * Detection has to survive the variance that doesn't change which resource
	 * the URL names, or the common local case silently keeps fetching itself.
	 */
	public function test_matches_equivalent_forms_of_the_local_feed_url() {
		$canonical = $this->feed_url();
		$host      = (string) wp_parse_url( $canonical, PHP_URL_HOST );

		$equivalent = array(
			$canonical,
			rtrim( $canonical, '/' ),
			str_replace( 'http://', 'https://', $canonical ),
			str_replace( '://' . $host, '://www.' . $host, $canonical ),
			add_query_arg(
				array(
					'feed' => 'rss2',
					'cat'  => self::CATEGORY_ID,
				),
				home_url( '/' )
			),
		);

		foreach ( $equivalent as $url ) {
			$this->assertTrue( Local_Feed::is_local_feed( $url ), $url );
		}
	}

	public function test_rejects_urls_that_are_not_this_sites_podcast_feed() {
		$other = str_replace(
			(string) wp_parse_url( home_url(), PHP_URL_HOST ),
			'someone-elses-podcast.test',
			$this->feed_url()
		);

		$this->assertFalse( Local_Feed::is_local_feed( $other ) );
		$this->assertFalse( Local_Feed::is_local_feed( home_url( '/feed/' ) ) );
		$this->assertFalse( Local_Feed::is_local_feed( '' ) );
	}

	/**
	 * The block renders on sites where the module is off, and there the real
	 * feed carries none of the customizations this class mirrors.
	 */
	public function test_rejects_local_feed_when_the_module_is_inactive() {
		$this->set_module_active( false );

		$this->assertFalse( Local_Feed::is_local_feed( $this->feed_url() ) );
	}

	/**
	 * Password-protected and enclosure-less posts must be excluded in SQL, so
	 * `LIMIT` keeps paginating over episodes that actually have playable audio.
	 */
	public function test_constrain_query_excludes_protected_and_enclosureless_posts() {
		global $wpdb;

		$tagged = new WP_Query();
		$tagged->set( Local_Feed::QUERY_FLAG, true );
		$where = Local_Feed::constrain_query( '', $tagged );

		$this->assertStringContainsString( "{$wpdb->posts}.post_password = ''", $where );
		$this->assertStringContainsString( "meta_key = 'enclosure'", $where );

		$this->assertSame( '', Local_Feed::constrain_query( '', new WP_Query() ) );
	}
}
