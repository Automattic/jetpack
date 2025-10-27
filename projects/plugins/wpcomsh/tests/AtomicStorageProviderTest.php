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
	 * Test get_master_user_id with valid email.
	 */
	public function test_get_master_user_id_valid() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'test@example.com' ) );

		$result = $this->provider->get_master_user_id( 'test@example.com' );
		$this->assertSame( $user_id, $result );
	}

	/**
	 * Test get_master_user_id with invalid user email.
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
	public function test_get_master_user_id_invalid_email_format() {
		$result = $this->provider->get_master_user_id( 'not-an-email' );
		$this->assertFalse( $result );
	}

	/**
	 * Test provider get('master_user') returns null when APD email is missing.
	 */
	public function test_get_master_user_returns_null_when_email_missing() {
		\Atomic_Persistent_Data::delete( 'JETPACK_CONNECTION_OWNER_EMAIL' );
		$this->assertNull( $this->provider->get( 'master_user' ) );
	}

	/**
	 * Test provider get('master_user') returns the user ID when email is valid.
	 */
	public function test_get_master_user_returns_user_id_when_email_valid() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'owner@example.com' ) );
		\Atomic_Persistent_Data::set( 'JETPACK_CONNECTION_OWNER_EMAIL', 'owner@example.com' );
		$this->assertSame( $user_id, $this->provider->get( 'master_user' ) );
	}

	/**
	 * Test get_user_tokens with invalid input.
	 */
	public function test_get_user_tokens_invalid_input() {
		// Empty email
		$this->assertFalse( $this->provider->get_user_tokens( '', 'token.secret' ) );

		// Empty secret
		$this->assertFalse( $this->provider->get_user_tokens( 'test@example.com', '' ) );

		// Both empty
		$this->assertFalse( $this->provider->get_user_tokens( '', '' ) );

		// Invalid email format
		$this->assertFalse( $this->provider->get_user_tokens( 'not-an-email', 'token.secret' ) );
	}

	/**
	 * Test get_user_tokens with non-existent user.
	 */
	public function test_get_user_tokens_nonexistent_user() {
		$this->assertFalse( $this->provider->get_user_tokens( 'nonexistent@example.com', 'token.secret' ) );
	}

	/**
	 * Test get_user_tokens with no existing tokens (Condition 2).
	 */
	public function test_get_user_tokens_no_existing_tokens() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'test@example.com' ) );

		// Call get_user_tokens directly
		$result = $this->provider->get_user_tokens( 'test@example.com', 'token.secret' );

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

		// Call get_user_tokens directly
		$result = $this->provider->get_user_tokens( 'test@example.com', 'token.secret' );

		// Should return merged array with both tokens
		$expected = array(
			$user_id       => 'token.secret.' . $user_id,
			$other_user_id => 'other.token.' . $other_user_id,
		);
		$this->assertSame( $expected, $result );
	}

	/**
	 * Test get_user_tokens removes conflicting token for current user.
	 */
	public function test_get_user_tokens_removes_conflicting_token() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'owner@example.com' ) );

		// Set existing token with different secret for same user
		$existing_tokens = array(
			$user_id => 'old.secret.' . $user_id,
		);
		update_option( 'jetpack_private_options', array( 'user_tokens' => $existing_tokens ) );

		// Call with new secret
		$result = $this->provider->get_user_tokens( 'owner@example.com', 'new.secret' );

		// Should have removed old token and added new one
		$expected = array(
			$user_id => 'new.secret.' . $user_id,
		);
		$this->assertSame( $expected, $result );

		// Verify it was persisted to database
		$private_options = get_option( 'jetpack_private_options' );
		$this->assertSame( $expected, $private_options['user_tokens'] );
	}

	/**
	 * Test get_user_tokens removes orphaned tokens with same secret.
	 */
	public function test_get_user_tokens_removes_orphaned_tokens() {
		$old_owner_id  = static::factory()->user->create( array( 'user_email' => 'old@example.com' ) );
		$new_owner_id  = static::factory()->user->create( array( 'user_email' => 'new@example.com' ) );
		$other_user_id = static::factory()->user->create( array( 'user_email' => 'other@example.com' ) );

		// Old owner had this secret, now new owner has same secret
		$existing_tokens = array(
			$old_owner_id  => 'shared.secret.' . $old_owner_id,
			$other_user_id => 'different.secret.' . $other_user_id,
		);
		update_option( 'jetpack_private_options', array( 'user_tokens' => $existing_tokens ) );

		// New owner connecting with same secret prefix
		$result = $this->provider->get_user_tokens( 'new@example.com', 'shared.secret' );

		// Should remove old owner's token (same secret) but keep other user's token
		$expected = array(
			$new_owner_id  => 'shared.secret.' . $new_owner_id,
			$other_user_id => 'different.secret.' . $other_user_id,
		);
		$this->assertSame( $expected, $result );
	}

	/**
	 * Test provider get('user_tokens') returns null when email missing.
	 */
	public function test_get_user_tokens_via_provider_returns_null_when_email_missing() {
		\Atomic_Persistent_Data::delete( 'JETPACK_CONNECTION_OWNER_EMAIL' );
		\Atomic_Persistent_Data::set( 'JETPACK_CONNECTION_OWNER_TOKEN_SECRET', 'token.secret' );

		$this->assertNull( $this->provider->get( 'user_tokens' ) );
	}

	/**
	 * Test provider get('user_tokens') returns null when secret missing.
	 */
	public function test_get_user_tokens_via_provider_returns_null_when_secret_missing() {
		\Atomic_Persistent_Data::set( 'JETPACK_CONNECTION_OWNER_EMAIL', 'owner@example.com' );
		\Atomic_Persistent_Data::delete( 'JETPACK_CONNECTION_OWNER_TOKEN_SECRET' );

		$this->assertNull( $this->provider->get( 'user_tokens' ) );
	}

	/**
	 * Test provider get('user_tokens') returns null when get_user_tokens returns false.
	 */
	public function test_get_user_tokens_via_provider_returns_null_for_invalid_user() {
		\Atomic_Persistent_Data::set( 'JETPACK_CONNECTION_OWNER_EMAIL', 'nonexistent@example.com' );
		\Atomic_Persistent_Data::set( 'JETPACK_CONNECTION_OWNER_TOKEN_SECRET', 'token.secret' );

		$this->assertNull( $this->provider->get( 'user_tokens' ) );
	}

	/**
	 * Test provider get('user_tokens') returns array when valid.
	 */
	public function test_get_user_tokens_via_provider_returns_array_when_valid() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'owner@example.com' ) );
		\Atomic_Persistent_Data::set( 'JETPACK_CONNECTION_OWNER_EMAIL', 'owner@example.com' );
		\Atomic_Persistent_Data::set( 'JETPACK_CONNECTION_OWNER_TOKEN_SECRET', 'token.secret' );

		$result = $this->provider->get( 'user_tokens' );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( $user_id, $result );
		$this->assertSame( 'token.secret.' . $user_id, $result[ $user_id ] );
	}

	/**
	 * Test validate_user_tokens re-reads latest state before persisting.
	 */
	public function test_validate_user_tokens_rereads_before_write() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'owner@example.com' ) );

		// Initial state: old owner token
		$initial_tokens = array(
			$user_id => 'old.secret.' . $user_id,
		);
		update_option( 'jetpack_private_options', array( 'user_tokens' => $initial_tokens ) );

		// Simulate: After reading but before validate_user_tokens persists, another user connects
		// We can't truly test the race condition without threading, but we can verify
		// that get_user_tokens returns the expected result

		$result = $this->provider->get_user_tokens( 'owner@example.com', 'new.secret' );

		// Should have new owner token
		$this->assertArrayHasKey( $user_id, $result );
		$this->assertSame( 'new.secret.' . $user_id, $result[ $user_id ] );
	}

	/**
	 * Test get('blog_token') returns null when empty.
	 */
	public function test_get_blog_token_returns_null_when_empty() {
		\Atomic_Persistent_Data::delete( 'JETPACK_BLOG_TOKEN' );
		$this->assertNull( $this->provider->get( 'blog_token' ) );
	}

	/**
	 * Test get('blog_token') returns token when set.
	 */
	public function test_get_blog_token_returns_token_when_set() {
		\Atomic_Persistent_Data::set( 'JETPACK_BLOG_TOKEN', 'blog.token.value' );
		$this->assertSame( 'blog.token.value', $this->provider->get( 'blog_token' ) );
	}

	/**
	 * Test get('id') returns null when empty.
	 */
	public function test_get_id_returns_null_when_empty() {
		\Atomic_Persistent_Data::delete( 'JETPACK_BLOG_ID' );
		$this->assertNull( $this->provider->get( 'id' ) );
	}

	/**
	 * Test get('id') returns int when set.
	 */
	public function test_get_id_returns_int_when_set() {
		\Atomic_Persistent_Data::set( 'JETPACK_BLOG_ID', '12345' );
		$this->assertSame( 12345, $this->provider->get( 'id' ) );
	}
}
