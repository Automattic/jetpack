<?php
/**
 * Tests for the announcements My Jetpack publishes.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Announcements\Announcement_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\My_Jetpack\Whats_New
 */
#[CoversClass( Whats_New::class )]
class Whats_New_Test extends TestCase {

	/**
	 * Requests made for the feed during a test.
	 *
	 * @var int
	 */
	private $requests = 0;

	/**
	 * Answer the feed without the network, and hook the registrant.
	 */
	public function setUp(): void {
		parent::setUp();

		$this->requests = 0;
		add_filter( 'pre_http_request', array( $this, 'answer_request' ) );
		add_action( 'wp_feed_options', array( $this, 'skip_the_feed_cache' ) );

		// `fetch_feed()` converts the feed to the charset of the site, which the test site lacks.
		update_option( 'blog_charset', 'UTF-8' );

		Whats_New::init();
	}

	/**
	 * Drop the hooks, the flag and the main instance of the registry.
	 */
	public function tearDown(): void {
		remove_filter( 'pre_http_request', array( $this, 'answer_request' ) );
		remove_action( 'wp_feed_options', array( $this, 'skip_the_feed_cache' ) );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Initializer::WHATS_NEW_FLAG );
		remove_all_actions( Announcement_Registry::REGISTER_ACTION );

		$instance = new \ReflectionProperty( Announcement_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		parent::tearDown();
	}

	/**
	 * Answers a request with a feed of two posts: one of yesterday, one of 40 days ago.
	 *
	 * @return array
	 */
	public function answer_request() {
		++$this->requests;

		$ages = array(
			'Yesterday' => DAY_IN_SECONDS,
			'Long ago'  => 40 * DAY_IN_SECONDS,
		);

		$items = '';
		foreach ( $ages as $title => $age ) {
			$items .= "<item><title>{$title}</title><link>https://jetpack.com/blog/{$age}/</link>"
				. "<guid isPermaLink=\"false\">https://jetpack.com/?p={$age}</guid>"
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

	public function test_publishes_the_recent_posts_of_jetpack_com_to_its_channel() {
		add_filter( 'jetpack_feature_flag_enabled_' . Initializer::WHATS_NEW_FLAG, '__return_true' );

		$announcements = array_values( Announcement_Registry::get_instance()->get_all_registered() );

		$this->assertSame( array( 'Yesterday' ), array_column( $announcements, 'title' ) );
		$this->assertSame( array( Whats_New::CHANNEL ), $announcements[0]['channels'] );
		$this->assertSame( 'my-jetpack/' . md5( 'https://jetpack.com/?p=' . DAY_IN_SECONDS ), $announcements[0]['id'] );
	}

	public function test_reads_no_feed_while_the_flag_is_off() {
		$this->assertSame( array(), Announcement_Registry::get_instance()->get_all_registered() );
		$this->assertSame( 0, $this->requests );
	}
}
