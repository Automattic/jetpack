<?php
/**
 * Blogroll block tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\Blogroll;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/blogroll/blogroll.php';

/**
 * Blogroll block tests.
 */
class Blogroll_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Markup of a blogroll item.
	 *
	 * @param array $attrs Block attributes.
	 * @return string
	 */
	private static function item( $attrs ) {
		return '<!-- wp:jetpack/blogroll-item ' . serialize_block_attributes( $attrs ) . ' --><div class="wp-block-jetpack-blogroll-item"></div><!-- /wp:jetpack/blogroll-item -->';
	}

	/**
	 * Markup of a blogroll block.
	 *
	 * @param string $items Inner blocks markup.
	 * @return string
	 */
	private static function blogroll( $items ) {
		return '<!-- wp:jetpack/blogroll --><div class="wp-block-jetpack-blogroll">' . $items . '</div><!-- /wp:jetpack/blogroll -->';
	}

	/**
	 * The OPML lists every valid feed once, also from nested blogrolls.
	 */
	public function test_get_opml() {
		$feed    = self::item(
			array(
				'name'     => '<em>Feed</em> & Co',
				'url'      => 'https://feed.example/',
				'feed_url' => 'https://feed.example/feed/',
			)
		);
		$no_feed = self::item(
			array(
				'name' => 'No feed',
				'url'  => 'https://nofeed.example/',
			)
		);
		$bad     = self::item(
			array(
				'name'     => 'Bad feed',
				'url'      => 'https://bad.example/',
				'feed_url' => 'javascript:alert(1)',
			)
		);
		$no_site = self::item(
			array(
				'name'     => 'No site',
				'feed_url' => 'https://nosite.example/feed',
			)
		);
		$no_base = self::item( array( 'feed_url' => '/feed/' ) ) . self::item( array( 'feed_url' => '//nobase.example/feed' ) );
		$array   = self::item( array( 'feed_url' => array( 'https://array.example/feed' ) ) );
		$odd     = self::item(
			array(
				'name'     => array( 'Odd' ),
				'url'      => '/about/',
				'feed_url' => 'https://odd.example/feed',
			)
		);
		$nested  = self::item(
			array(
				'name'     => 'Nested',
				'url'      => 'https://nested.example/',
				'feed_url' => 'https://nested.example/rss',
			)
		);
		$dupe    = self::item(
			array(
				'name'     => 'Duplicate',
				'url'      => 'https://feed.example/',
				'feed_url' => 'http://feed.example/feed',
			)
		);
		$post    = self::factory()->post->create_and_get(
			array(
				'post_title'   => 'Sites I read',
				'post_content' => wp_slash(
					self::blogroll( $feed . $no_feed . $bad . $no_site . $no_base . $array . $odd ) . '<!-- wp:group --><div class="wp-block-group">' . self::blogroll( $nested . $dupe ) . '</div><!-- /wp:group -->'
				),
			)
		);

		$span_title = function ( $title ) {
			return '<span class="icon"></span>' . $title;
		};
		add_filter( 'the_title', $span_title );
		$opml = simplexml_load_string( Blogroll\get_opml( $post ) );
		remove_filter( 'the_title', $span_title );

		$this->assertNotFalse( $opml );
		$this->assertSame( 'Sites I read', (string) $opml->head->title );

		$outlines = array();
		foreach ( $opml->body->outline as $outline ) {
			$outlines[] = array(
				'type'    => (string) $outline['type'],
				'text'    => (string) $outline['text'],
				'xmlUrl'  => (string) $outline['xmlUrl'],
				'htmlUrl' => isset( $outline['htmlUrl'] ) ? (string) $outline['htmlUrl'] : null,
			);
		}

		$this->assertSame(
			array(
				array(
					'type'    => 'rss',
					'text'    => 'Feed & Co',
					'xmlUrl'  => 'https://feed.example/feed/',
					'htmlUrl' => 'https://feed.example/',
				),
				array(
					'type'    => 'rss',
					'text'    => 'No site',
					'xmlUrl'  => 'https://nosite.example/feed',
					'htmlUrl' => null,
				),
				array(
					'type'    => 'rss',
					'text'    => '',
					'xmlUrl'  => 'https://odd.example/feed',
					'htmlUrl' => null,
				),
				array(
					'type'    => 'rss',
					'text'    => 'Nested',
					'xmlUrl'  => 'https://nested.example/rss',
					'htmlUrl' => 'https://nested.example/',
				),
			),
			$outlines
		);
	}

	/**
	 * A blogroll in a synced pattern is published, and a pattern that includes itself ends.
	 */
	public function test_synced_pattern() {
		$pattern_id = self::factory()->post->create( array( 'post_type' => 'wp_block' ) );
		wp_update_post(
			array(
				'ID'           => $pattern_id,
				'post_content' => wp_slash(
					self::blogroll( self::item( array( 'feed_url' => 'https://feed.example/feed/' ) ) ) . '<!-- wp:block {"ref":' . $pattern_id . '} /-->'
				),
			)
		);
		$post = self::factory()->post->create_and_get( array( 'post_content' => '<!-- wp:block {"ref":' . $pattern_id . '} /-->' ) );

		$this->assertTrue( Blogroll\has_opml( $post ) );
		$this->assertSame( array( 'https://feed.example/feed' ), array_keys( Blogroll\get_opml_items( parse_blocks( $post->post_content ) ) ) );
	}

	/**
	 * `?opml` on a static front page still resolves to that page.
	 */
	public function test_static_front_page() {
		$page = self::factory()->post->create(
			array(
				'post_type'    => 'page',
				'post_content' => wp_slash( self::blogroll( self::item( array( 'feed_url' => 'https://feed.example/feed/' ) ) ) ),
			)
		);
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page );

		$this->go_to( add_query_arg( 'opml', '', home_url( '/' ) ) );

		$this->assertSame( $page, Blogroll\get_opml_post()->ID ?? null );
	}

	/**
	 * Only a public post with a blogroll publishes OPML.
	 *
	 * @dataProvider provide_posts
	 *
	 * @param array $args     Post arguments.
	 * @param bool  $expected Whether the post publishes OPML.
	 */
	#[DataProvider( 'provide_posts' )]
	public function test_has_opml( $args, $expected ) {
		$post = self::factory()->post->create_and_get( $args );

		$this->assertSame( $expected, Blogroll\has_opml( $post ) );
	}

	/**
	 * Posts with and without an OPML file.
	 *
	 * @return array
	 */
	public static function provide_posts() {
		$content = self::blogroll( self::item( array( 'feed_url' => 'https://feed.example/feed/' ) ) );

		return array(
			'published with blogroll' => array( array( 'post_content' => $content ), true ),
			'blogroll without feeds'  => array( array( 'post_content' => self::blogroll( self::item( array( 'name' => 'No feed' ) ) ) ), false ),
			'without blogroll'        => array( array( 'post_content' => '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->' ), false ),
			'draft'                   => array(
				array(
					'post_content' => $content,
					'post_status'  => 'draft',
				),
				false,
			),
			'password protected'      => array(
				array(
					'post_content'  => $content,
					'post_password' => 'secret',
				),
				false,
			),
		);
	}

	/**
	 * The discovery link is printed on a post with a blogroll only.
	 */
	public function test_print_opml_link() {
		$with    = self::factory()->post->create( array( 'post_content' => self::blogroll( self::item( array( 'feed_url' => 'https://feed.example/feed/' ) ) ) ) );
		$without = self::factory()->post->create( array( 'post_content' => 'Hi' ) );

		$this->go_to( get_permalink( $with ) );
		$link = self::print_opml_link();

		$this->assertStringContainsString( 'rel="blogroll" type="text/x-opml"', $link );
		$this->assertStringContainsString( esc_url( add_query_arg( 'opml', '', get_permalink( $with ) ) ), $link );

		$this->go_to( get_permalink( $without ) );
		$this->assertSame( '', self::print_opml_link() );
	}

	/**
	 * Output of print_opml_link().
	 *
	 * @return string
	 */
	private static function print_opml_link() {
		ob_start();
		Blogroll\print_opml_link();
		return (string) ob_get_clean();
	}
}
