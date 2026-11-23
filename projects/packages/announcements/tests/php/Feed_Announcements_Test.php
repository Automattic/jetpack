<?php
/**
 * Tests for the announcements read from a feed.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Announcements\Feed_Announcements
 * @covers ::Automattic\Jetpack\Announcements\get_announcements_from_feed
 */
#[CoversClass( Feed_Announcements::class )]
#[CoversFunction( 'Automattic\Jetpack\Announcements\get_announcements_from_feed' )]
class Feed_Announcements_Test extends BaseTestCase {

	const FEED_URL = 'https://example.com/feed/';

	const ITEM = array(
		'title'       => '<title>VideoPress now supports playlists</title>',
		'link'        => '<link>https://example.com/blog/playlists/</link>',
		'guid'        => '<guid isPermaLink="false">https://example.com/?p=12</guid>',
		'date'        => '<pubDate>Thu, 24 Sep 2026 15:00:00 +0000</pubDate>',
		'categories'  => '<category><![CDATA[Jetpack News]]></category><category><![CDATA[VideoPress]]></category>',
		'description' => '<description><![CDATA[<p>Group your videos in a <strong>playlist</strong>.</p>]]></description>',
		'image'       => '<media:thumbnail url="https://example.com/playlists.png" />',
	);

	/**
	 * What the feed answers: its body, or the error of a request that failed.
	 *
	 * @var string|\WP_Error
	 */
	private $answer;

	/**
	 * Requests made for the feed during a test.
	 *
	 * @var int
	 */
	private $requests = 0;

	/**
	 * Answer the requests of the feed without the network.
	 */
	public function set_up() {
		$this->requests = 0;
		add_filter( 'pre_http_request', array( $this, 'answer_request' ) );

		// `fetch_feed()` converts the feed to the charset of the site, which the test site lacks.
		update_option( 'blog_charset', 'UTF-8' );
	}

	/**
	 * Stop answering.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer_request' ) );
	}

	/**
	 * Answers a request with the feed of the test.
	 *
	 * @return array|\WP_Error
	 */
	public function answer_request() {
		++$this->requests;

		if ( is_wp_error( $this->answer ) ) {
			return $this->answer;
		}

		return array(
			'headers'  => array( 'content-type' => 'application/rss+xml; charset=UTF-8' ),
			'body'     => $this->answer,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Serves a feed with one item: the one of the tests, with some of its parts replaced.
	 *
	 * @param array $parts Parts of the item to replace, by name. An empty string removes one.
	 */
	private function serve_item( array $parts = array() ) {
		$this->answer = '<?xml version="1.0" encoding="UTF-8"?>'
			. '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel>'
			. '<title>Example</title><link>https://example.com/</link><description>Example</description>'
			. '<item>' . implode( '', array_merge( self::ITEM, $parts ) ) . '</item>'
			. '</channel></rss>';
	}

	public function test_turns_an_item_into_the_data_of_an_announcement() {
		$this->serve_item();

		$this->assertSame(
			array(
				array(
					'id'         => 'my-plugin/' . md5( 'https://example.com/?p=12' ),
					'args'       => array(
						'date'    => '2026-09-24T15:00:00+00:00',
						'title'   => 'VideoPress now supports playlists',
						'excerpt' => 'Group your videos in a playlist.',
						'link'    => 'https://example.com/blog/playlists/',
						'media'   => array(
							'type' => 'image',
							'url'  => 'https://example.com/playlists.png',
							'alt'  => '',
						),
					),
					'categories' => array( 'Jetpack News', 'VideoPress' ),
				),
			),
			get_announcements_from_feed( self::FEED_URL, 'my-plugin' )
		);
	}

	/**
	 * @dataProvider provide_markup
	 *
	 * @param string $markup Markup, as the XML of a feed carries it.
	 * @param string $title  The title the announcement keeps.
	 */
	#[DataProvider( 'provide_markup' )]
	public function test_keeps_plain_text_of_the_feed( $markup, $title ) {
		$this->serve_item(
			array(
				'title'       => "<title>Tabs {$markup}</title>",
				'description' => "<description>Tabs {$markup}</description>",
			)
		);

		$args = get_announcements_from_feed( self::FEED_URL, 'my-plugin' )[0]['args'];

		$this->assertSame( $title, $args['title'] );
		$this->assertFalse( strpbrk( $args['title'] . $args['excerpt'], '<>' ) );
	}

	public static function provide_markup() {
		return array(
			'an ampersand'         => array( '&amp; more', 'Tabs & more' ),
			'a tag'                => array( '&lt;b&gt;now&lt;/b&gt;', 'Tabs now' ),
			'a script'             => array( '&lt;script&gt;alert( 1 )&lt;/script&gt;', 'Tabs' ),
			'a tag inside a CDATA' => array( '<![CDATA[<img src=x onerror=alert( 1 )>]]>', 'Tabs' ),
			'an unclosed tag'      => array( '&lt;a href="javascript:alert( 1 )"', 'Tabs' ),
			// Decoded once, so what is left is text and not a tag.
			'a tag encoded twice'  => array( '&amp;lt;img src=x onerror=alert( 1 )&amp;gt;', 'Tabs &lt;img src=x onerror=alert( 1 )&gt;' ),
		);
	}

	/**
	 * @dataProvider provide_images
	 *
	 * @param string      $image    The image of the item, as the XML of a feed carries it.
	 * @param string|null $expected The URL the announcement keeps, or null for none.
	 */
	#[DataProvider( 'provide_images' )]
	public function test_keeps_the_image_of_an_item_over_https_only( $image, $expected ) {
		$this->serve_item( array( 'image' => $image ) );

		$media = get_announcements_from_feed( self::FEED_URL, 'my-plugin' )[0]['args']['media'];

		$this->assertSame( $expected, $media['url'] ?? null );
	}

	public static function provide_images() {
		return array(
			'a thumbnail over http' => array( '<media:thumbnail url="http://example.com/playlists.png" />', null ),
			'an image as enclosure' => array( '<enclosure url="https://example.com/playlists.jpg" type="image/jpeg" length="1" />', 'https://example.com/playlists.jpg' ),
			'a video as enclosure'  => array( '<enclosure url="https://example.com/playlists.mp4" type="video/mp4" length="1" />', null ),
			'no image'              => array( '', null ),
		);
	}

	/**
	 * @dataProvider provide_unusable_items
	 *
	 * @param array $parts Parts of the item to replace.
	 */
	#[DataProvider( 'provide_unusable_items' )]
	public function test_skips_an_item_without_a_title_a_date_or_a_link( array $parts ) {
		$this->serve_item( $parts );

		$this->assertSame( array(), get_announcements_from_feed( self::FEED_URL, 'my-plugin' ) );
	}

	public static function provide_unusable_items() {
		return array(
			'no title'           => array( array( 'title' => '' ) ),
			'no date'            => array( array( 'date' => '' ) ),
			'no link'            => array( array( 'link' => '' ) ),
			'a link to a script' => array( array( 'link' => '<link>javascript:alert( 1 )</link>' ) ),
		);
	}

	public function test_keeps_the_id_of_an_item_after_an_edit() {
		$this->serve_item();
		$first = get_announcements_from_feed( self::FEED_URL, 'my-plugin' )[0]['id'];

		$this->serve_item( array( 'title' => '<title>Playlists, in VideoPress</title>' ) );
		$second = get_announcements_from_feed( 'https://example.com/feed/edited/', 'my-plugin' )[0]['id'];

		$this->assertSame( $first, $second );
	}

	public function test_leaves_a_feed_that_failed_alone() {
		$this->answer = new \WP_Error( 'http_request_failed', 'The feed is down.' );

		$this->assertSame( array(), get_announcements_from_feed( self::FEED_URL, 'my-plugin' ) );

		$requests = $this->requests;
		$this->serve_item();

		$this->assertGreaterThan( 0, $requests );
		$this->assertSame( array(), get_announcements_from_feed( self::FEED_URL, 'my-plugin' ) );
		$this->assertSame( $requests, $this->requests );
	}

	public function test_returns_what_the_registry_accepts() {
		$this->serve_item();
		$announcement = get_announcements_from_feed( self::FEED_URL, 'my-plugin' )[0];

		$registered = ( new Announcement_Registry() )->register(
			$announcement['id'],
			$announcement['args'] + array( 'channels' => array( 'my-plugin' ) )
		);

		$this->assertSame( $announcement['args']['title'], $registered['title'] ?? null );
		$this->assertSame( $announcement['args']['link'], $registered['link'] ?? null );
	}
}
