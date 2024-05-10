<?php
/**
 * Test Class for  Jetpack_WPCOM_Block_Editor_Test
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Block_Editor\Jetpack_WPCOM_Block_Editor;

/**
 * Class Jetpack_WPCOM_Block_Editor.
 *
 * @covers Jetpack_WPCOM_Block_Editor
 */
class Jetpack_WPCOM_Block_Editor_Test extends \WorDBless\BaseTestCase {
	/**
	 * User ID.
	 *
	 * @var int
	 */
	public $user_id;

	/**
	 * Runs the routine before each test is executed.
	 */
	public function set_up() {
		parent::set_up();
		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'test_user',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		Constants::set_constant( 'JETPACK__API_VERSION', '1' );
	}
	/**
	 * Test_verify_frame_nonce.
	 */
	public function test_verify_frame_nonce() {
		$wpcom_block_editor = Jetpack_WPCOM_Block_Editor::init();

		// Empty nonce.
		$this->assertFalse( $wpcom_block_editor->verify_frame_nonce( '', '' ) );

		// No user id.
		$this->assertFalse( $wpcom_block_editor->verify_frame_nonce( time() . ':0:' . wp_hash( '' ), 'action' ) );

		// No Jetpack token.
		$this->assertFalse( $wpcom_block_editor->verify_frame_nonce( $this->create_nonce(), 'action' ) );

		( new Automattic\Jetpack\Connection\Tokens() )->update_user_token( $this->user_id, sprintf( '%s.%d.%d', 'token', Constants::get_constant( 'JETPACK__API_VERSION' ), $this->user_id ), true );

		$nonce = $this->create_nonce();

		// User ID mismatch.
		$this->assertWPError( $wpcom_block_editor->verify_frame_nonce( $nonce, 'action' ) );

		wp_set_current_user( $this->user_id );

		// Success!
		$this->assertTrue( $wpcom_block_editor->verify_frame_nonce( $nonce, 'action' ) );

		// Cleanup.
		Jetpack_Options::delete_option( array( 'user_tokens', 'master_user' ) );
	}

	/**
	 * Utility method to create a nonce.
	 *
	 * @return string
	 */
	public function create_nonce() {
		add_filter( 'salt', array( $this, 'filter_salt' ), 10, 2 );
		$expiration = time() + MINUTE_IN_SECONDS;
		$hash       = wp_hash( "$expiration|action|{$this->user_id}", 'jetpack_frame_nonce' );
		remove_filter( 'salt', array( $this, 'filter_salt' ) );

		return "$expiration:{$this->user_id}:$hash";
	}

	/**
	 * Filters the WordPress salt.
	 *
	 * @param string $salt   Salt for the given scheme.
	 * @param string $scheme Authentication scheme.
	 * @return string
	 */
	public function filter_salt( $salt, $scheme ) {
		if ( 'jetpack_frame_nonce' === $scheme ) {
			$token = ( new Automattic\Jetpack\Connection\Tokens() )->get_access_token( $this->user_id );

			if ( $token ) {
				$salt = $token->secret;
			}
		}

		return $salt;
	}

	/**
	 * Asserts that the given value is an instance of WP_Error.
	 *
	 * @param mixed  $actual  The value to check.
	 * @param string $message Optional. Message to display when the assertion fails.
	 */
	public function assertWPError( $actual, $message = '' ) {
		$this->assertInstanceOf( 'WP_Error', $actual, $message );
	}
}
