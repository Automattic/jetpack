<?php
/**
 * Atomic Storage Provider Test file.
 *
 * @package wpcomsh
 */

require_once __DIR__ . '/../connection/class-atomic-storage-provider.php';

/**
 * Class AtomicStorageProviderTest.
 */
class AtomicStorageProviderTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The Atomic Storage Provider instance.
	 *
	 * @var Atomic_Storage_Provider
	 */
	private $provider;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Create provider instance
		$this->provider = new Atomic_Storage_Provider();

		// Clean up any existing options
		delete_option( 'jetpack_private_options' );
		delete_option( 'master_user' );
	}

	/**
	 * Test is_available method.
	 */
	public function test_is_available() {
		$this->assertTrue( $this->provider->is_available() );
	}

	/**
	 * Test should_handle method.
	 */
	public function test_should_handle() {
		$this->assertTrue( $this->provider->should_handle( 'blog_token' ) );
		$this->assertTrue( $this->provider->should_handle( 'id' ) );
		$this->assertTrue( $this->provider->should_handle( 'master_user' ) );
		$this->assertTrue( $this->provider->should_handle( 'user_tokens' ) );
		$this->assertFalse( $this->provider->should_handle( 'other_option' ) );
	}

	/**
	 * Test get_master_user_id with valid token.
	 */
	public function test_get_master_user_id_valid() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'test@example.com' ) );

		$token_data = wp_json_encode(
			array(
				'user_email' => 'test@example.com',
				'secret'     => 'token.secret',
			)
		);

		$result = $this->provider->get_master_user_id( $token_data );
		$this->assertSame( $user_id, $result );
	}

	/**
	 * Test get_master_user_id with invalid user email in token.
	 */
	public function test_get_master_user_id_invalid() {
		$token_data = wp_json_encode(
			array(
				'user_email' => 'nonexistent@example.com',
				'secret'     => 'token.secret',
			)
		);

		$result = $this->provider->get_master_user_id( $token_data );
		$this->assertFalse( $result );
	}

	/**
	 * Test get_master_user_id with empty token.
	 */
	public function test_get_master_user_id_empty() {
		$result = $this->provider->get_master_user_id( '' );
		$this->assertFalse( $result );
	}

	/**
	 * Test get_master_user_id with invalid token format.
	 */
	public function test_get_master_user_id_invalid_format() {
		$result = $this->provider->get_master_user_id( 'not-valid-json' );
		$this->assertFalse( $result );
	}

	/**
	 * Test get_master_user_id with invalid email format in token.
	 */
	public function test_get_master_user_id_invalid_email_format() {
		$token_data = wp_json_encode(
			array(
				'user_email' => 'not-an-email',
				'secret'     => 'token.secret',
			)
		);

		$result = $this->provider->get_master_user_id( $token_data );
		$this->assertFalse( $result );
	}

	/**
	 * Test get_user_tokens with invalid input.
	 */
	public function test_get_user_tokens_invalid_input() {
		// Empty input
		$this->assertFalse( $this->provider->get_user_tokens( '' ) );

		// Invalid JSON
		$this->assertFalse( $this->provider->get_user_tokens( 'invalid-json' ) );

		// Missing properties
		$this->assertFalse( $this->provider->get_user_tokens( '{"user_email":"test@example.com"}' ) );
		$this->assertFalse( $this->provider->get_user_tokens( '{"secret":"token.secret"}' ) );
	}

	/**
	 * Test get_user_tokens with non-existent user.
	 */
	public function test_get_user_tokens_nonexistent_user() {
		$token_data = wp_json_encode(
			array(
				'user_email' => 'nonexistent@example.com',
				'secret'     => 'token.secret',
			)
		);

		$this->assertFalse( $this->provider->get_user_tokens( $token_data ) );
	}

	/**
	 * Test get_user_tokens with no existing tokens (Condition 2).
	 */
	public function test_get_user_tokens_no_existing_tokens() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'test@example.com' ) );

		$token_data = wp_json_encode(
			array(
				'user_email' => 'test@example.com',
				'secret'     => 'token.secret',
			)
		);

		// Call get_user_tokens directly
		$result = $this->provider->get_user_tokens( $token_data );

		$expected = array( $user_id => 'token.secret.' . $user_id );
		$this->assertSame( $expected, $result );
	}

	/**
	 * Test get_user_tokens with existing matching token (Condition 3).
	 */
	public function test_get_user_tokens_existing_matching() {
		$user_id       = static::factory()->user->create( array( 'user_email' => 'test@example.com' ) );
		$other_user_id = static::factory()->user->create( array( 'user_email' => 'other@example.com' ) );

		// Set existing tokens with other users
		$existing_tokens = array(
			$user_id       => 'token.secret.' . $user_id,
			$other_user_id => 'other.token.' . $other_user_id,
		);
		update_option( 'jetpack_private_options', array( 'user_tokens' => $existing_tokens ) );

		$token_data = wp_json_encode(
			array(
				'user_email' => 'test@example.com',
				'secret'     => 'token.secret',
			)
		);

		// Call get_user_tokens directly
		$result = $this->provider->get_user_tokens( $token_data );

		// Should return merged array with both tokens
		$expected = array(
			$user_id       => 'token.secret.' . $user_id,
			$other_user_id => 'other.token.' . $other_user_id,
		);
		$this->assertSame( $expected, $result );
	}
}
