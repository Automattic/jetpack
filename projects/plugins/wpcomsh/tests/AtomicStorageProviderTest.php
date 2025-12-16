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
	 * Test get_user_tokens replaces conflicting token for current user.
	 */
	public function test_get_user_tokens_replaces_conflicting_token() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'owner@example.com' ) );

		// Set existing token with different secret for same user
		update_option(
			'jetpack_private_options',
			array(
				'user_tokens' => array( $user_id => 'old.secret.' . $user_id ),
			)
		);

		// Set master_user option - should be cleared when conflict is resolved
		\Jetpack_Options::update_option( 'master_user', $user_id );

		// Call with new secret - should replace old token
		$result = $this->provider->get_user_tokens( 'owner@example.com', 'new.secret' );

		// Verify the returned array has the new token
		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertSame( 'new.secret.' . $user_id, $result[ $user_id ] );

		// Verify master_user option was cleared
		$this->assertFalse( \Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * Test get_user_tokens removes orphaned tokens with same secret.
	 */
	public function test_get_user_tokens_removes_orphaned_tokens() {
		$old_owner_id  = static::factory()->user->create( array( 'user_email' => 'old@example.com' ) );
		$new_owner_id  = static::factory()->user->create( array( 'user_email' => 'new@example.com' ) );
		$other_user_id = static::factory()->user->create( array( 'user_email' => 'other@example.com' ) );

		// Old owner had this secret, now new owner has same secret
		update_option(
			'jetpack_private_options',
			array(
				'user_tokens' => array(
					$old_owner_id  => 'shared.secret.' . $old_owner_id,
					$other_user_id => 'different.secret.' . $other_user_id,
				),
			)
		);

		// Set master_user option - should be cleared when orphaned tokens are removed
		\Jetpack_Options::update_option( 'master_user', $old_owner_id );

		// New owner connecting with same secret prefix
		$result = $this->provider->get_user_tokens( 'new@example.com', 'shared.secret' );

		// Should have new owner and other user, but not old owner
		$this->assertArrayHasKey( $new_owner_id, $result );
		$this->assertArrayHasKey( $other_user_id, $result );
		$this->assertArrayNotHasKey( $old_owner_id, $result );

		// Verify master_user option was cleared
		$this->assertFalse( \Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * Test conflict detection and resolution flow.
	 */
	public function test_conflict_resolution_flow() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'owner@example.com' ) );

		// Start with old token
		update_option(
			'jetpack_private_options',
			array( 'user_tokens' => array( $user_id => 'old.secret.' . $user_id ) )
		);

		// Get tokens with new secret
		$result = $this->provider->get_user_tokens( 'owner@example.com', 'new.secret' );

		// Should have replaced with new token
		$this->assertSame( 'new.secret.' . $user_id, $result[ $user_id ] );
	}
}
