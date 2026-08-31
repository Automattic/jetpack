<?php
/**
 * Test Class for  Jetpack_WPCOM_Block_Editor_Test
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Block_Editor\Jetpack_WPCOM_Block_Editor;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Class Jetpack_WPCOM_Block_Editor.
 *
 * @covers Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Block_Editor\Jetpack_WPCOM_Block_Editor
 */
#[CoversClass( Jetpack_WPCOM_Block_Editor::class )]
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
	 * Runs the routine after each test is executed.
	 */
	public function tear_down() {
		parent::tear_down();

		foreach (
			array(
				'wpcom-block-editor-default-editor-script',
				'wpcom-block-editor-wpcom-editor-script',
				'wpcom-block-editor-wpcom-editor-styles',
				'wpcom-block-editor-calypso-editor-script',
				'wpcom-block-editor-calypso-editor-styles',
			) as $handle
		) {
			wp_dequeue_script( $handle );
			wp_deregister_script( $handle );
			wp_dequeue_style( $handle );
			wp_deregister_style( $handle );
		}
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
	 * Tests that remote block editor scripts declare their WordPress package dependencies.
	 */
	public function test_enqueue_block_editor_assets_declares_remote_script_dependencies() {
		$wpcom_block_editor = Jetpack_WPCOM_Block_Editor::init();
		$wpcom_block_editor->enqueue_block_editor_assets();

		$this->assertScriptDependencies(
			'wpcom-block-editor-default-editor-script',
			array(
				'react',
				'wp-block-editor',
				'wp-blocks',
				'wp-compose',
				'wp-data',
				'wp-rich-text',
			)
		);

		$this->assertScriptDependencies(
			'wpcom-block-editor-wpcom-editor-script',
			array(
				'lodash',
				'react',
				'wp-block-editor',
				'wp-blocks',
				'wp-components',
				'wp-compose',
				'wp-data',
				'wp-dom-ready',
				'wp-element',
				'wp-hooks',
				'wp-i18n',
				'wp-plugins',
				'wp-primitives',
				'wp-url',
			)
		);
	}

	/**
	 * Asserts that a script declares the exact generated asset metadata dependencies.
	 *
	 * @param string $handle                Script handle.
	 * @param array  $expected_dependencies Expected dependencies.
	 */
	private function assertScriptDependencies( $handle, $expected_dependencies ) {
		$registered_script = wp_scripts()->registered[ $handle ] ?? null;

		$this->assertNotNull( $registered_script, "Expected $handle to be registered." );
		$this->assertSame(
			$expected_dependencies,
			$registered_script->deps,
			"Expected $handle dependencies to match generated Calypso asset metadata."
		);
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
