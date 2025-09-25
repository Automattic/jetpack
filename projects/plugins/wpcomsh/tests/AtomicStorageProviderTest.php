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

		// Reset mock data
		Atomic_Persistent_Data::$data = array();

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
	 * Test get method with blog_id.
	 */
	public function test_get_blog_id() {
		Atomic_Persistent_Data::set( 'JETPACK_BLOG_ID', '12345' );
		$result = $this->provider->get( 'id' );
		$this->assertSame( 12345, $result );
	}

	/**
	 * Test get_master_user_id with valid email.
	 */
	public function test_get_master_user_id_valid() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'test@example.com' ) );

		$result = $this->provider->get_master_user_id( 'test@example.com' );
		$this->assertSame( $user_id, $result );
	}

	/**
	 * Test get_master_user_id with invalid email.
	 */
	public function test_get_master_user_id_invalid() {
		$result = $this->provider->get_master_user_id( 'nonexistent@example.com' );
		$this->assertFalse( $result );
	}

	/**
	 * Test get_master_user_id with empty email.
	 */
	public function test_get_master_user_id_empty() {
		$result = $this->provider->get_master_user_id( '' );
		$this->assertFalse( $result );
	}

	/**
	 * Test get_master_user_id with invalid email format.
	 */
	public function test_get_master_user_id_invalid_format() {
		$result = $this->provider->get_master_user_id( 'not-an-email' );
		$this->assertFalse( $result );
	}

	/**
	 * Test blog token validation with no existing token.
	 */
	public function test_blog_token_no_existing() {
		Atomic_Persistent_Data::set( 'JETPACK_BLOG_TOKEN', 'external.token.123' );

		$result = $this->provider->get( 'blog_token' );
		$this->assertSame( 'external.token.123', $result );
	}

	/**
	 * Test blog token validation with matching existing token.
	 */
	public function test_blog_token_matching() {
		Atomic_Persistent_Data::set( 'JETPACK_BLOG_TOKEN', 'external.token.123' );

		// Set existing token in database
		update_option( 'jetpack_private_options', array( 'blog_token' => 'external.token.123' ) );

		$result = $this->provider->get( 'blog_token' );
		$this->assertSame( 'external.token.123', $result );

		// Token should still exist in database
		$options = get_option( 'jetpack_private_options' );
		$this->assertSame( 'external.token.123', $options['blog_token'] );
	}

	/**
	 * Test blog token validation with mismatched existing token.
	 */
	public function test_blog_token_mismatch() {
		$this->expectOutputString( 'Jetpack blog token mismatch detected. Clearing blog token.' . PHP_EOL );

		Atomic_Persistent_Data::set( 'JETPACK_BLOG_TOKEN', 'external.token.123' );

		// Set different existing token in database
		update_option( 'jetpack_private_options', array( 'blog_token' => 'old.token.456' ) );

		$result = $this->provider->get( 'blog_token' );
		$this->assertSame( 'external.token.123', $result );

		// Old token should be cleared from database
		$options = get_option( 'jetpack_private_options', array() );
		$this->assertArrayNotHasKey( 'blog_token', $options );
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

		// Set master_user directly in database since get_user_tokens calls Jetpack_Options::get_option
		update_option( 'master_user', $user_id );

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

		// Set master_user directly in database
		update_option( 'master_user', $user_id );

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

	/**
	 * Test get_user_tokens with existing mismatched token (Condition 4).
	 */
	public function test_get_user_tokens_existing_mismatch() {
		$user_id       = static::factory()->user->create( array( 'user_email' => 'test@example.com' ) );
		$other_user_id = static::factory()->user->create( array( 'user_email' => 'other@example.com' ) );

		// Set master_user directly in database
		update_option( 'master_user', $user_id );

		// Set existing tokens with mismatched master user token
		$existing_tokens = array(
			$user_id       => 'old.token.' . $user_id,
			$other_user_id => 'other.token.' . $other_user_id,
		);
		update_option( 'jetpack_private_options', array( 'user_tokens' => $existing_tokens ) );

		$token_data = wp_json_encode(
			array(
				'user_email' => 'test@example.com',
				'secret'     => 'new.secret',
			)
		);

		// Call get_user_tokens directly
		$result = $this->provider->get_user_tokens( $token_data );

		// Should return only the new master user token (others cleared due to mismatch)
		$expected = array( $user_id => 'new.secret.' . $user_id );
		$this->assertSame( $expected, $result );

		// Database should be cleared
		$options = get_option( 'jetpack_private_options' );
		$this->assertSame( array(), $options['user_tokens'] );
	}
}
