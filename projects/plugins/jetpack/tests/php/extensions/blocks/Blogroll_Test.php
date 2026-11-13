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
	 * The OPML lists every item with a feed once, also from nested blogrolls.
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
				'feed_url' => 'https://feed.example/feed/',
			)
		);
		$post    = self::factory()->post->create_and_get(
			array(
				'post_title'   => 'Sites I read',
				'post_content' => wp_slash(
					self::blogroll( $feed . $no_feed ) . '<!-- wp:group --><div class="wp-block-group">' . self::blogroll( $nested . $dupe ) . '</div><!-- /wp:group -->'
				),
			)
		);

		$opml = simplexml_load_string( Blogroll\get_opml( $post ) );

		$this->assertNotFalse( $opml );
		$this->assertSame( 'Sites I read', (string) $opml->head->title );

		$outlines = array();
		foreach ( $opml->body->outline as $outline ) {
			$outlines[] = array(
				'type'    => (string) $outline['type'],
				'text'    => (string) $outline['text'],
				'xmlUrl'  => (string) $outline['xmlUrl'],
				'htmlUrl' => (string) $outline['htmlUrl'],
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
					'text'    => 'Nested',
					'xmlUrl'  => 'https://nested.example/rss',
					'htmlUrl' => 'https://nested.example/',
				),
			),
			$outlines
		);
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
		$with    = self::factory()->post->create( array( 'post_content' => self::blogroll( '' ) ) );
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
