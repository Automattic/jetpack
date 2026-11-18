<?php
/**
 * Tests for wpcomsh_prevent_owner_removal().
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\External_Storage;
use Automattic\Jetpack\Connection\Storage_Provider_Interface;
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * The "wpcloud" suite excludes this file: on a real WP Cloud site, the platform's wpcomsh defines
 * wpcomsh_prevent_owner_removal() first, so the test would check that copy and not this one.
 *
 * @covers ::wpcomsh_prevent_owner_removal
 * @covers ::wpcomsh_get_connection_owner_id
 */
#[CoversFunction( 'wpcomsh_prevent_owner_removal' )]
#[CoversFunction( 'wpcomsh_get_connection_owner_id' )]
class PreventOwnerRemovalTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Remove the external storage provider and the option after each test.
	 */
	public function tear_down() {
		$provider = new ReflectionProperty( External_Storage::class, 'provider' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$provider->setAccessible( true );
		}
		$provider->setValue( null, null );
		delete_option( 'jetpack_options' );
		wpcomsh_get_connection_owner_id( true );
		parent::tear_down();
	}

	/**
	 * When external storage and the row name different owners, both stay protected.
	 */
	public function test_protects_the_owners_from_external_storage_and_from_the_row() {
		$owner = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$other = self::factory()->user->create( array( 'role' => 'administrator' ) );
		update_option( 'jetpack_options', array( 'master_user' => 7 ) );
		$allcaps = array( 'edit_users' => true );
		// Caches the owner before the provider registers, as an early capability check would.
		$this->assertSame( $allcaps, wpcomsh_prevent_owner_removal( $allcaps, array(), array( 'delete_user', 1, $owner ) ) );

		$this->register_external_storage( array( 'master_user' => $owner ) );

		$this->assertSame( array(), wpcomsh_prevent_owner_removal( $allcaps, array(), array( 'delete_user', 1, (string) $owner ) ) );
		$this->assertSame( array(), wpcomsh_prevent_owner_removal( $allcaps, array(), array( 'promote_user', 1, 7 ) ) );
		$this->assertSame( $allcaps, wpcomsh_prevent_owner_removal( $allcaps, array(), array( 'delete_user', 1, $other ) ) );
	}

	/**
	 * External storage names whoever has the owner's email, so a user who is not an administrator is not protected.
	 */
	public function test_does_not_protect_an_external_owner_who_is_not_an_administrator() {
		$user = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		$this->register_external_storage( array( 'master_user' => $user ) );
		$allcaps = array( 'edit_users' => true );

		$this->assertSame( $allcaps, wpcomsh_prevent_owner_removal( $allcaps, array(), array( 'delete_user', 1, $user ) ) );
	}

	/**
	 * Without external storage, the owner comes from the row, as before.
	 */
	public function test_protects_the_owner_from_the_row_without_external_storage() {
		update_option( 'jetpack_options', array( 'master_user' => 7 ) );
		$allcaps = array( 'edit_users' => true );

		$this->assertSame( array(), wpcomsh_prevent_owner_removal( $allcaps, array(), array( 'remove_user', 1, 7 ) ) );
		$this->assertSame( $allcaps, wpcomsh_prevent_owner_removal( $allcaps, array(), array( 'read', 1, 7 ) ) );
	}

	/**
	 * With no owner, no user is protected.
	 */
	public function test_protects_no_user_without_an_owner() {
		delete_option( 'jetpack_options' );
		$allcaps = array( 'edit_users' => true );

		$this->assertSame( $allcaps, wpcomsh_prevent_owner_removal( $allcaps, array(), array( 'delete_user', 1, 0 ) ) );
	}

	/**
	 * Registers an external storage provider that serves the given values.
	 *
	 * @param array $values Option names, without the `jetpack_` prefix, mapped to values.
	 */
	private function register_external_storage( array $values ) {
		External_Storage::register_provider(
			new class( $values ) implements Storage_Provider_Interface {
				/**
				 * The values this provider serves.
				 *
				 * @var array
				 */
				private $values;

				/**
				 * @param array $values The values this provider serves.
				 */
				public function __construct( array $values ) {
					$this->values = $values;
				}

				/**
				 * @return bool
				 */
				public function is_available() {
					return true;
				}

				/**
				 * @param string $option_name Option name.
				 * @return bool
				 */
				public function should_handle( $option_name ) {
					return array_key_exists( $option_name, $this->values );
				}

				/**
				 * @param string $option_name Option name.
				 * @return mixed
				 */
				public function get( $option_name ) {
					return $this->values[ $option_name ] ?? null;
				}

				/**
				 * @return string
				 */
				public function get_environment_id() {
					return 'test';
				}
			}
		);
	}
}
