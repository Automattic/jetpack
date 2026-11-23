<?php
/**
 * Tests for the announcements VideoPress publishes.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Announcements\Announcement_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\VideoPress\Whats_New
 */
#[CoversClass( Whats_New::class )]
class Whats_New_Test extends BaseTestCase {

	/**
	 * URLs requested during a test.
	 *
	 * @var string[]
	 */
	private $requests = array();

	/**
	 * Answer the feed without the network, and hook the registrant.
	 */
	public function set_up() {
		$this->requests = array();
		add_filter( 'pre_http_request', array( $this, 'answer_request' ), 10, 3 );
		add_action( 'wp_feed_options', array( $this, 'skip_the_feed_cache' ) );

		// `fetch_feed()` converts the feed to the charset of the site, which the test site lacks.
		update_option( 'blog_charset', 'UTF-8' );

		Whats_New::init();
	}

	/**
	 * Drop the hooks, the flag and the main instance of the registry.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer_request' ) );
		remove_action( 'wp_feed_options', array( $this, 'skip_the_feed_cache' ) );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Whats_New::FLAG );
		remove_all_actions( Announcement_Registry::REGISTER_ACTION );

		$instance = new \ReflectionProperty( Announcement_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
	}

	/**
	 * Answers a request with a feed of two posts: one of yesterday and one of 100 days ago.
	 *
	 * @param false|array $response The response so far.
	 * @param array       $args     The arguments of the request.
	 * @param string      $url      The URL requested.
	 * @return array
	 */
	public function answer_request( $response, $args, $url ) {
		$this->requests[] = $url;

		$posts = array(
			'Playlists' => DAY_IN_SECONDS,
			'Player'    => 100 * DAY_IN_SECONDS,
		);

		$items = '';
		foreach ( $posts as $title => $age ) {
			$items .= "<item><title>{$title}</title><link>https://jetpack.com/blog/{$title}/</link>"
				. "<guid isPermaLink=\"false\">https://jetpack.com/?p={$title}</guid>"
				. '<pubDate>' . gmdate( 'D, d M Y H:i:s', time() - $age ) . ' +0000</pubDate></item>';
		}

		return array(
			'headers'  => array( 'content-type' => 'application/rss+xml; charset=UTF-8' ),
			'body'     => '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Jetpack</title>'
				. '<link>https://jetpack.com/</link><description>Jetpack</description>' . $items . '</channel></rss>',
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Keeps a test from reading the feed another one cached.
	 *
	 * @param \SimplePie\SimplePie $feed The feed about to be read.
	 */
	public function skip_the_feed_cache( $feed ) {
		$feed->enable_cache( false );
	}

	public function test_publishes_the_recent_posts_of_its_feed_to_its_channel() {
		add_filter( 'jetpack_feature_flag_enabled_' . Whats_New::FLAG, '__return_true' );

		$announcements = array_values( Announcement_Registry::get_instance()->get_all_registered() );

		$this->assertSame( array( 'https://jetpack.com/feed/?category_name=jetpack-news%2Bvideopress&tag=videopress' ), $this->requests );
		$this->assertSame( array( 'Playlists' ), array_column( $announcements, 'title' ) );
		$this->assertSame( array( Whats_New::CHANNEL ), $announcements[0]['channels'] );
		$this->assertSame( 'videopress/' . md5( 'https://jetpack.com/?p=Playlists' ), $announcements[0]['id'] );
	}

	public function test_reads_no_feed_while_the_flag_is_off() {
		$this->assertSame( array(), Announcement_Registry::get_instance()->get_all_registered() );
		$this->assertSame( array(), $this->requests );
	}
}
