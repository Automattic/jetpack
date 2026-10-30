<?php
/**
 * Tests for the sharing button destination helper.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-share-destination-helper.php';

/**
 * @covers \Jetpack_Share_Destination_Helper
 */
#[CoversClass( Jetpack_Share_Destination_Helper::class )]
class Jetpack_Share_Destination_Helper_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private const MASTODON  = 'share';
	private const WORDPRESS = 'wp-admin/post-new.php';

	/**
	 * @dataProvider provide_accepted_addresses
	 *
	 * @param string $address      Address the reader entered.
	 * @param string $path         Path appended to the address.
	 * @param bool   $upgrade_http Whether http:// is rewritten to https://.
	 * @param string $expected     Expected endpoint.
	 */
	#[DataProvider( 'provide_accepted_addresses' )]
	public function test_get_endpoint_normalizes_address( $address, $path, $upgrade_http, $expected ) {
		$this->assertSame( $expected, Jetpack_Share_Destination_Helper::get_endpoint( $address, $path, $upgrade_http ) );
	}

	/**
	 * Data provider for test_get_endpoint_normalizes_address.
	 *
	 * @return array<string, array{string, string, bool, string}>
	 */
	public static function provide_accepted_addresses() {
		$upgrade = Jetpack_Share_Destination_Helper::UPGRADE_HTTP;
		$keep    = Jetpack_Share_Destination_Helper::KEEP_HTTP;

		return array(
			'bare host'                     => array( 'mastodon.social', self::MASTODON, $upgrade, 'https://mastodon.social/share' ),
			'surrounding whitespace'        => array( "  mastodon.social\n", self::MASTODON, $upgrade, 'https://mastodon.social/share' ),
			'trailing zero-width space'     => array( "https://mastodon.social\u{200B}", self::MASTODON, $upgrade, 'https://mastodon.social/share' ),
			'ideographic full stop'         => array( "https://mstdn\u{3002}jp", self::MASTODON, $upgrade, 'https://mstdn.jp/share' ),
			'full-width full stop'          => array( "https://mstdn\u{FF0E}jp", self::MASTODON, $upgrade, 'https://mstdn.jp/share' ),
			'trailing slash'                => array( 'https://mastodon.social/', self::MASTODON, $upgrade, 'https://mastodon.social/share' ),
			'http upgraded'                 => array( 'http://mastodon.social', self::MASTODON, $upgrade, 'https://mastodon.social/share' ),
			'uppercase scheme'              => array( 'HTTPS://mastodon.social', self::MASTODON, $upgrade, 'https://mastodon.social/share' ),
			'port kept'                     => array( 'https://mastodon.example:8443', self::MASTODON, $upgrade, 'https://mastodon.example:8443/share' ),
			'subdirectory, query, frag'     => array( 'https://example.com/sub/?q=1#f', self::MASTODON, $upgrade, 'https://example.com/sub/share' ),
			'percent-encoding preserved'    => array( 'https://example.com/%7Euser/', self::MASTODON, $upgrade, 'https://example.com/%7Euser/share' ),
			'site: http kept, subdirectory' => array( 'http://example.com/blog', self::WORDPRESS, $keep, 'http://example.com/blog/wp-admin/post-new.php' ),
			'site: uppercase http kept'     => array( 'HTTP://example.com', self::WORDPRESS, $keep, 'http://example.com/wp-admin/post-new.php' ),
			'site: https kept'              => array( 'https://example.com', self::WORDPRESS, $keep, 'https://example.com/wp-admin/post-new.php' ),
			'site: bare domain'             => array( 'example.com', self::WORDPRESS, $keep, 'https://example.com/wp-admin/post-new.php' ),
			'site: host and port'           => array( 'localhost:8080', self::WORDPRESS, $keep, 'https://localhost:8080/wp-admin/post-new.php' ),
		);
	}

	/**
	 * @dataProvider provide_refused_addresses
	 *
	 * @param string $address      Address the reader entered.
	 * @param string $path         Path appended to the address.
	 * @param bool   $upgrade_http Whether http:// is rewritten to https://.
	 */
	#[DataProvider( 'provide_refused_addresses' )]
	public function test_get_endpoint_refuses_address( $address, $path, $upgrade_http ) {
		$this->assertNull( Jetpack_Share_Destination_Helper::get_endpoint( $address, $path, $upgrade_http ) );
	}

	/**
	 * Data provider for test_get_endpoint_refuses_address.
	 *
	 * @return array<string, array{string, string, bool}>
	 */
	public static function provide_refused_addresses() {
		$upgrade = Jetpack_Share_Destination_Helper::UPGRADE_HTTP;
		$keep    = Jetpack_Share_Destination_Helper::KEEP_HTTP;

		return array(
			'empty'                 => array( '', self::MASTODON, $upgrade ),
			'whitespace only'       => array( '   ', self::MASTODON, $upgrade ),
			'javascript'            => array( 'javascript:alert(1)', self::MASTODON, $upgrade ),
			'data'                  => array( 'data:text/html,hello', self::MASTODON, $upgrade ),
			'ftp'                   => array( 'ftp://mastodon.social', self::MASTODON, $upgrade ),
			'user'                  => array( 'https://user@evil.example', self::MASTODON, $upgrade ),
			'host-looking user'     => array( 'https://mastodon.social@evil.example', self::MASTODON, $upgrade ),
			'user and password'     => array( 'https://user:pass@evil.example', self::MASTODON, $upgrade ),
			'scheme without host'   => array( 'https://', self::MASTODON, $upgrade ),
			'path without host'     => array( 'https:///share', self::MASTODON, $upgrade ),
			'backslash in host'     => array( 'https://evil.example\\.mastodon.social', self::MASTODON, $upgrade ),
			'protocol-relative URL' => array( '//evil.example', self::MASTODON, $upgrade ),
			'site: ftp'             => array( 'ftp://example.com', self::WORDPRESS, $keep ),
		);
	}
}
