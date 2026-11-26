<?php
/**
 * SocialSpec tests.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Socialspec;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Publicize\Socialspec\Socialspec
 * @covers \Automattic\Jetpack\Publicize\Socialspec\Contact
 * @covers \Automattic\Jetpack\Publicize\Socialspec\Following
 */
#[CoversClass( Socialspec::class )]
#[CoversClass( Contact::class )]
#[CoversClass( Following::class )]
class Socialspec_Test extends BaseTestCase {

	/**
	 * WorDBless has no site charset.
	 */
	public function set_up() {
		parent::set_up();
		add_filter(
			'pre_option_blog_charset',
			static function () {
				return 'UTF-8';
			}
		);
	}

	/**
	 * Forget the request, the flag and the filters between tests.
	 */
	public function tear_down() {
		remove_all_filters( 'pre_option_blog_charset' );
		unset( $_SERVER['REQUEST_URI'] );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Socialspec::FEATURE_FLAG );
		remove_all_filters( 'jetpack_social_following' );
		remove_all_filters( 'home_url' );
		remove_all_filters( 'pre_option_blogname' );
		remove_all_filters( 'pre_option_blogdescription' );
		Feature_Flags::reset();
		parent::tear_down();
	}

	/**
	 * The documents are served only with the feature flag on.
	 */
	public function test_is_enabled() {
		Socialspec::init();
		$this->assertFalse( Socialspec::is_enabled() );

		add_filter( 'jetpack_feature_flag_enabled_' . Socialspec::FEATURE_FLAG, '__return_true' );
		$this->assertTrue( Socialspec::is_enabled() );
	}

	/**
	 * The file name is read from the path below the home URL.
	 *
	 * @dataProvider provide_requests
	 *
	 * @param string      $home     Home URL.
	 * @param string      $uri      Request URI.
	 * @param string|null $expected File name.
	 */
	#[DataProvider( 'provide_requests' )]
	public function test_get_requested_name( $home, $uri, $expected ) {
		add_filter(
			'home_url',
			static function ( $url, $path ) use ( $home ) {
				return $home . $path;
			},
			10,
			2
		);
		$_SERVER['REQUEST_URI'] = $uri;

		$this->assertSame( $expected, Socialspec::get_requested_name() );
	}

	/**
	 * Home URLs, request URIs and the requested file name.
	 *
	 * @return array[]
	 */
	public static function provide_requests() {
		return array(
			'root'                   => array( 'https://example.org', '/.well-known/contact.vcf?x=1', 'contact.vcf' ),
			'subdirectory'           => array( 'https://example.org/blog', '/blog/.well-known/following.opml', 'following.opml' ),
			'outside a subdirectory' => array( 'https://example.org/blog', '/.well-known/contact.vcf', null ),
			'another path'           => array( 'https://example.org', '/about/', null ),
		);
	}

	/**
	 * The contact card escapes text values and folds long lines.
	 */
	public function test_contact() {
		$options = array(
			'blogname'        => 'Müller &amp; Söhne, Köln; ' . str_repeat( 'ä', 40 ),
			'blogdescription' => "Line one\nLine two",
		);
		foreach ( $options as $option => $value ) {
			add_filter(
				'pre_option_' . $option,
				static function () use ( $value ) {
					return $value;
				}
			);
		}

		$vcard = ( new Contact() )->get_content();

		$this->assertStringStartsWith( "BEGIN:VCARD\r\nVERSION:3.0\r\n", $vcard );
		$this->assertStringEndsWith( "END:VCARD\r\n", $vcard );
		$this->assertStringContainsString( 'NOTE:Line one\nLine two', $vcard );
		$this->assertStringNotContainsString( 'EMAIL', $vcard );

		foreach ( explode( "\r\n", $vcard ) as $line ) {
			$this->assertLessThanOrEqual( 75, strlen( $line ) );
			$this->assertTrue( mb_check_encoding( $line, 'UTF-8' ) );
		}

		$this->assertStringContainsString( 'FN:Müller & Söhne\, Köln\; ', str_replace( "\r\n ", '', $vcard ) );
	}

	/**
	 * The following list keeps valid feeds only and escapes their attributes.
	 */
	public function test_following() {
		add_filter(
			'jetpack_social_following',
			static function () {
				return array(
					array(
						'type'    => 'rss',
						'text'    => 'Feed &amp; "Co" <b>',
						'xmlUrl'  => 'https://feed.example/feed/?a=1&b=2',
						'htmlUrl' => '/relative',
						'on"x'    => 'injected',
					),
					array(
						'xmlUrl' => 'https://untitled.example/feed/',
					),
					array(
						'text'   => 'Bad scheme',
						'xmlUrl' => 'javascript:alert(1)',
					),
					array(
						'text' => 'No feed',
					),
					'not an outline',
				);
			}
		);

		$opml = ( new Following() )->get_content();

		$this->assertStringContainsString( '<outline type="rss" text="Feed &amp; &quot;Co&quot; &lt;b&gt;" xmlUrl="https://feed.example/feed/?a=1&amp;b=2" />', $opml );
		$this->assertStringContainsString( '<outline xmlUrl="https://untitled.example/feed/" text="untitled.example" />', $opml );
		$this->assertSame( 2, substr_count( $opml, '<outline' ) );

		$xml = simplexml_load_string( $opml );
		$this->assertNotFalse( $xml );
		$this->assertSame( '2.0', (string) $xml['version'] );
	}

	/**
	 * Without feeds there is no following list.
	 */
	public function test_following_without_feeds() {
		$this->assertNull( ( new Following() )->get_content() );
	}
}
