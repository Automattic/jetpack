<?php
/**
 * Tests for Checkpoint.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Comments\Checkpoint
 */
#[CoversClass( Checkpoint::class )]
class Checkpoint_Test extends BaseTestCase {

	public function set_up() {
		parent::set_up();
		Jetpack_Options::update_option( 'id', Passport_Test::BLOG_ID );
		Jetpack_Options::update_option( 'blog_token', 'key.secret' );
		add_filter(
			'wp_die_handler',
			function () {
				return function ( $message, $title, $args ) {
					throw new RuntimeException( (string) $args['response'] );
				};
			}
		);
	}

	public function tear_down() {
		$_POST   = array();
		$_COOKIE = array();
		unset( $_SERVER['HTTP_ORIGIN'] );
		parent::tear_down();
	}

	/**
	 * @dataProvider provide_admit_refuses
	 */
	#[DataProvider( 'provide_admit_refuses' )]
	public function test_admit_refuses( $post, $origin, $answer ) {
		$_POST                  = $post;
		$_SERVER['HTTP_ORIGIN'] = $origin;
		add_filter(
			'pre_http_request',
			function () use ( $answer ) {
				return array(
					'headers'  => array(),
					'body'     => wp_json_encode( array( 'code' => $answer ), JSON_UNESCAPED_SLASHES ),
					'response' => array( 'code' => 400 ),
					'cookies'  => array(),
				);
			}
		);

		$this->expectExceptionMessage( '403' );
		Checkpoint::init()->admit();
	}

	public static function provide_admit_refuses() {
		$home = 'http://example.org';

		return array(
			'cross-site code'     => array( array( Checkpoint::CODE_FIELD => 'abc' ), 'https://evil.test', '' ),
			'passport, no cookie' => array( array( Checkpoint::PASSPORT_FIELD => '1' ), $home, '' ),
			'spent code'          => array( array( Checkpoint::CODE_FIELD => 'abc' ), $home, 'code_used' ),
			'expired code'        => array( array( Checkpoint::CODE_FIELD => 'abc' ), $home, 'code_expired' ),
		);
	}

	public function test_admit_with_passport() {
		$_POST[ Checkpoint::PASSPORT_FIELD ] = '1';
		$_COOKIE[ Passport::COOKIE ]         = Passport_Test::cookie();
		$_SERVER['HTTP_ORIGIN']              = home_url();

		Checkpoint::init()->admit();

		$this->assertSame( 0, get_option( 'comment_registration', 1 ) );
	}
}
