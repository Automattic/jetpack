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
	 * Test get_master_user_id returns false for invalid input (non-existent user, empty, or malformed email).
	 */
	public function test_get_master_user_id_invalid() {
		$this->assertFalse( $this->provider->get_master_user_id( 'nonexistent@example.com' ) );
		$this->assertFalse( $this->provider->get_master_user_id( '' ) );
		$this->assertFalse( $this->provider->get_master_user_id( 'not-an-email' ) );
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

	/**
	 * Test that the Atomic_Persistent_Data instance is cached across calls.
	 */
	public function test_persistent_data_cached() {
		$reflection = new \ReflectionProperty( Atomic_Storage_Provider::class, 'persistent_data' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}

		$this->assertNull( $reflection->getValue( $this->provider ) );

		// Trigger a get() call that initializes APD
		$this->provider->get( 'blog_token' );
		$first_instance = $reflection->getValue( $this->provider );
		$this->assertNotNull( $first_instance );

		// Second call should reuse the same instance
		$this->provider->get( 'id' );
		$second_instance = $reflection->getValue( $this->provider );
		$this->assertSame( $first_instance, $second_instance );
	}

	/**
	 * Test that resolve_user_by_email caches the result across calls.
	 *
	 * Verifies that get_master_user_id and get_user_tokens can be called
	 * in sequence for the same email without redundant DB lookups.
	 */
	public function test_email_resolution_cached_across_calls() {
		$user_id = static::factory()->user->create( array( 'user_email' => 'cached@example.com' ) );

		// First call resolves the user
		$master_id = $this->provider->get_master_user_id( 'cached@example.com' );
		$this->assertSame( $user_id, $master_id );

		// Verify internal cache is set
		$reflection = new \ReflectionProperty( Atomic_Storage_Provider::class, 'resolved_email' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$this->assertSame( 'cached@example.com', $reflection->getValue( $this->provider ) );

		$user_prop = new \ReflectionProperty( Atomic_Storage_Provider::class, 'resolved_user' );
		if ( PHP_VERSION_ID < 80100 ) {
			$user_prop->setAccessible( true );
		}
		$cached_user = $user_prop->getValue( $this->provider );
		$this->assertInstanceOf( \WP_User::class, $cached_user );
		$this->assertSame( $user_id, $cached_user->ID );

		// Second call (via get_user_tokens) should use the cached user
		$tokens = $this->provider->get_user_tokens( 'cached@example.com', 'token.secret' );
		$this->assertIsArray( $tokens );
		$this->assertSame( 'token.secret.' . $user_id, $tokens[ $user_id ] );

		// Cache should still reference the same user
		$this->assertSame( $cached_user, $user_prop->getValue( $this->provider ) );
	}

	/**
	 * Test that a different email invalidates the resolution cache.
	 */
	public function test_email_resolution_cache_invalidated_on_different_email() {
		$user_a = static::factory()->user->create( array( 'user_email' => 'a@example.com' ) );
		$user_b = static::factory()->user->create( array( 'user_email' => 'b@example.com' ) );

		$this->assertSame( $user_a, $this->provider->get_master_user_id( 'a@example.com' ) );
		$this->assertSame( $user_b, $this->provider->get_master_user_id( 'b@example.com' ) );

		$reflection = new \ReflectionProperty( Atomic_Storage_Provider::class, 'resolved_email' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$this->assertSame( 'b@example.com', $reflection->getValue( $this->provider ) );
	}

	/**
	 * Test that a failed (negative) lookup is not cached, so a later successful
	 * lookup for the same email still resolves.
	 */
	public function test_email_resolution_negative_result_not_cached() {
		// First lookup fails: no user with this email exists yet.
		$this->assertFalse( $this->provider->get_master_user_id( 'late@example.com' ) );

		// User appears after the failed lookup (e.g. replicated to the local DB).
		$user_id = static::factory()->user->create( array( 'user_email' => 'late@example.com' ) );

		// Same email must now resolve instead of returning the cached failure.
		$this->assertSame( $user_id, $this->provider->get_master_user_id( 'late@example.com' ) );
	}

	/**
	 * Test handle_error_event ignores non-error event types.
	 */
	public function test_handle_error_event_ignores_non_error_events() {
		$this->provider->handle_error_event( 'empty', 'master_user', '', 'woa' );
		$this->provider->handle_error_event( 'empty', 'user_tokens', '', 'woa' );
		$this->provider->handle_error_event( 'empty', 'blog_token', '', 'woa' );

		$this->assertTrue( true );
	}

	/**
	 * Test handle_error_event logs error events.
	 */
	public function test_handle_error_event_logs_error_events() {
		$this->provider->handle_error_event( 'error', 'master_user', 'Some error', 'woa' );
		$this->provider->handle_error_event( 'error', 'user_tokens', 'Some error', 'woa' );
		$this->provider->handle_error_event( 'error', 'blog_token', '', 'woa' );
		$this->provider->handle_error_event( 'error', 'id', 'Some error', 'woa' );

		$this->assertTrue( true );
	}
}
