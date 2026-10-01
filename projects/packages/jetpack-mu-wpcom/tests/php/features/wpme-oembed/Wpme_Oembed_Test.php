<?php
/**
 * Tests for resolving the site's own wp.me shortlinks in oEmbed requests.
 *
 * Runs in separate processes because get_wpcom_blog_id() reads IS_ATOMIC via defined().
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpme-oembed/wpme-oembed.php';

/**
 * @covers ::wpcom_wpme_oembed_request_post_id
 * @covers ::wpcom_wpme_base62_decode
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversFunction( 'wpcom_wpme_oembed_request_post_id' )]
#[CoversFunction( 'wpcom_wpme_base62_decode' )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Wpme_Oembed_Test extends \WorDBless\BaseTestCase {

	/**
	 * Makes this an Atomic site with WordPress.com blog ID 12345, which is `3d7` in base62.
	 */
	public function set_up() {
		parent::set_up();
		define( 'IS_ATOMIC', true );
		update_option( 'jetpack_options', array( 'id' => 12345 ) );
	}

	/**
	 * @dataProvider provide_urls
	 *
	 * @param int    $post_id  The post ID resolved by core.
	 * @param string $url      The requested URL.
	 * @param int    $expected The expected post ID.
	 */
	#[DataProvider( 'provide_urls' )]
	public function test_request_post_id( $post_id, $url, $expected ) {
		$this->assertSame( $expected, wpcom_wpme_oembed_request_post_id( $post_id, $url ) );
	}

	/**
	 * Data provider for test_request_post_id.
	 *
	 * @return array
	 */
	public static function provide_urls() {
		return array(
			'own post'              => array( 0, 'https://wp.me/p3d7-G', 42 ),
			'own page'              => array( 0, 'https://wp.me/P3d7-G', 42 ),
			'own attachment'        => array( 0, 'http://wp.me/a3d7-G', 42 ),
			'other blog'            => array( 0, 'https://wp.me/p3d8-G', 0 ),
			'already resolved'      => array( 7, 'https://wp.me/p3d7-G', 7 ),
			'not a shortlink'       => array( 0, 'https://example.com/?p=42', 0 ),
			'unknown type'          => array( 0, 'https://wp.me/x3d7-G', 0 ),
			'overlong post segment' => array( 0, 'https://wp.me/p3d7-zzzzzzzzzzz', 0 ),
			'overlong blog segment' => array( 0, 'https://wp.me/p00000000003d7-G', 0 ),
		);
	}

	/**
	 * WorDBless can't look posts up by slug, so only the miss is covered here.
	 */
	public function test_ignores_unknown_slug_shortlink() {
		$this->assertSame( 0, wpcom_wpme_oembed_request_post_id( 0, 'https://wp.me/s3d7-nope' ) );
	}
}
