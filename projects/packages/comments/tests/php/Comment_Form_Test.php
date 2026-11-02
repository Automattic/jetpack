<?php
/**
 * Tests for Comment_Form.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Comments\Comment_Form
 */
#[CoversClass( Comment_Form::class )]
class Comment_Form_Test extends BaseTestCase {

	public function set_up() {
		parent::set_up();
		add_filter(
			'wp_die_handler',
			function () {
				/** @return never */
				return function () {
					throw new RuntimeException();
				};
			}
		);
	}

	public function tear_down() {
		$_POST = array();
		unset( $_SERVER['HTTP_ORIGIN'] );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * @dataProvider provide_verify_nonce
	 */
	#[DataProvider( 'provide_verify_nonce' )]
	public function test_verify_nonce( $logged_in, $nonce, $origin, $allowed ) {
		if ( $logged_in ) {
			wp_set_current_user(
				wp_insert_user(
					array(
						'user_login' => 'reader',
						'user_pass'  => 'pass',
					)
				)
			);
		}
		if ( null !== $nonce ) {
			$_POST[ Comment_Form::NONCE_NAME ] = 'valid' === $nonce ? wp_create_nonce( Comment_Form::NONCE_ACTION ) : $nonce;
		}
		if ( null !== $origin ) {
			$_SERVER['HTTP_ORIGIN'] = $origin;
		}

		if ( ! $allowed ) {
			$this->expectException( RuntimeException::class );
		}
		Comment_Form::init()->verify_nonce();
		$this->addToAssertionCount( 1 );
	}

	public static function provide_verify_nonce() {
		return array(
			'logged out, no nonce'             => array( false, null, null, false ),
			'logged out, cached nonce'         => array( false, 'stale', null, true ),
			'logged in, valid nonce'           => array( true, 'valid', null, true ),
			'logged in, bad nonce'             => array( true, 'stale', null, false ),
			'logged in, bad nonce, same site'  => array( true, 'stale', 'http://example.org', true ),
			'logged in, bad nonce, other site' => array( true, 'stale', 'https://evil.test', false ),
		);
	}
}
