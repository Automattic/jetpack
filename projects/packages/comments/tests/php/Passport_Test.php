<?php
/**
 * Tests for Passport.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Comments\Passport
 */
#[CoversClass( Passport::class )]
class Passport_Test extends BaseTestCase {

	const BLOG_ID = 123;

	public function set_up() {
		parent::set_up();
		Jetpack_Options::update_option( 'id', self::BLOG_ID );
	}

	public function tear_down() {
		$_COOKIE = array();
		parent::tear_down();
	}

	public static function cookie( array $payload = array(), $salt = null ) {
		$payload = array_merge(
			array(
				'site_commenter_id' => 'c1',
				'name'              => 'Ann',
				'expires_at'        => time() + HOUR_IN_SECONDS,
				'blog_id'           => self::BLOG_ID,
			),
			$payload
		);
		$encoded = rtrim( strtr( base64_encode( wp_json_encode( $payload, JSON_UNESCAPED_SLASHES ) ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		return $encoded . '.' . hash_hmac( 'sha256', 'jetpack-comment-passport|' . $encoded, $salt ?? wp_salt( 'auth' ) );
	}

	/**
	 * @dataProvider provide_read
	 */
	#[DataProvider( 'provide_read' )]
	public function test_read( $payload, $salt, $accepted ) {
		$_COOKIE[ Passport::COOKIE ] = self::cookie( $payload, $salt );

		$identity = Passport::read();

		$this->assertSame( $accepted, null !== $identity );
		if ( $accepted ) {
			$this->assertNotNull( $identity );
			$this->assertSame( 'Ann', $identity['name'] );
		}
	}

	public static function provide_read() {
		return array(
			'valid'         => array( array(), null, true ),
			'bad signature' => array( array(), 'another-salt', false ),
			'other blog'    => array( array( 'blog_id' => 456 ), null, false ),
			'expired'       => array( array( 'expires_at' => time() - 1 ), null, false ),
			'no commenter'  => array( array( 'site_commenter_id' => '' ), null, false ),
		);
	}
}
