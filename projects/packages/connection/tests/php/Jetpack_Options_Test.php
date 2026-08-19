<?php
/**
 * Jetpack_Options storage tests.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the option registrations Jetpack_Options manages.
 */
class Jetpack_Options_Test extends TestCase {

	/**
	 * Cleans up the test environment after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		\Jetpack_Options::delete_option( array( 'protected_owner', 'videopress' ) );

		$reflection = new \ReflectionClass( External_Storage::class );

		$provider_property = $reflection->getProperty( 'provider' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$provider_property->setAccessible( true );
		}
		$provider_property->setValue( null, null );

		$init_fired_property = $reflection->getProperty( 'init_fired' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$init_fired_property->setAccessible( true );
		}
		$init_fired_property->setValue( null, false );

		remove_all_filters( 'jetpack_external_storage_init' );
		remove_all_filters( 'jetpack_external_storage_provider_registered' );
	}

	/**
	 * A representative protected owner anchor.
	 *
	 * @return array
	 */
	private static function anchor() {
		return array(
			'wpcom_user_id' => 12345,
			'email'         => 'owner@example.com',
			'local_user_id' => 7,
			'locked'        => true,
			'confirmed_at'  => '2026-08-13T12:00:00Z',
			'confirmed_by'  => 'popup',
		);
	}

	/**
	 * The anchor belongs to the compact group, which is what makes Sync propagate it for free.
	 */
	public function test_protected_owner_is_a_compact_option() {
		$this->assertTrue( \Jetpack_Options::is_valid( 'protected_owner' ) );
		$this->assertTrue( \Jetpack_Options::is_valid( 'protected_owner', 'compact' ) );
		$this->assertFalse( \Jetpack_Options::is_valid( 'protected_owner', 'non_compact' ) );
		$this->assertFalse( \Jetpack_Options::is_valid( 'protected_owner', 'private' ) );
	}

	/**
	 * The anchor survives a write/read cycle with every key intact.
	 */
	public function test_protected_owner_round_trip() {
		$this->assertFalse( \Jetpack_Options::get_option( 'protected_owner' ) );

		\Jetpack_Options::update_option( 'protected_owner', self::anchor() );

		$this->assertSame( self::anchor(), \Jetpack_Options::get_option( 'protected_owner' ) );
	}

	/**
	 * Being compact means living inside the jetpack_options row rather than a row of its own.
	 */
	public function test_protected_owner_is_stored_in_the_compact_row() {
		\Jetpack_Options::update_option( 'protected_owner', self::anchor() );

		$compact = get_option( 'jetpack_options' );

		$this->assertIsArray( $compact );
		$this->assertArrayHasKey( 'protected_owner', $compact );
		$this->assertSame( self::anchor(), $compact['protected_owner'] );
		$this->assertFalse( get_option( 'jetpack_protected_owner' ) );
	}

	/**
	 * Deleting the anchor clears it from the compact row.
	 */
	public function test_protected_owner_can_be_deleted() {
		\Jetpack_Options::update_option( 'protected_owner', self::anchor() );

		\Jetpack_Options::delete_option( 'protected_owner' );

		$this->assertFalse( \Jetpack_Options::get_option( 'protected_owner' ) );
		$this->assertArrayNotHasKey( 'protected_owner', (array) get_option( 'jetpack_options' ) );
	}

	/**
	 * The anchor is connection-critical, so the reset tooling must leave it alone.
	 *
	 * Resetting it while the connection survived would unlock ownership on a site that
	 * still has a protected owner.
	 */
	public function test_protected_owner_is_excluded_from_the_reset_list() {
		$this->assertNotContains( 'protected_owner', \Jetpack_Options::get_all_jetpack_options() );
		$this->assertContains( 'protected_owner', \Jetpack_Options::get_all_jetpack_options( false ) );
	}

	/**
	 * The anchor is on the external storage allowlist, so a registered provider answers for it.
	 */
	public function test_protected_owner_is_read_from_external_storage() {
		\Jetpack_Options::update_option( 'protected_owner', array( 'wpcom_user_id' => 1 ) );

		External_Storage::register_provider( $this->provider_serving( 'protected_owner', self::anchor() ) );

		$this->assertSame( self::anchor(), \Jetpack_Options::get_option( 'protected_owner' ) );
	}

	/**
	 * Options outside the allowlist are never routed to external storage, allowlisted or not.
	 */
	public function test_non_allowlisted_option_is_not_read_from_external_storage() {
		\Jetpack_Options::update_option( 'videopress', array( 'from' => 'database' ) );

		External_Storage::register_provider( $this->provider_serving( 'videopress', array( 'from' => 'provider' ) ) );

		$this->assertSame( array( 'from' => 'database' ), \Jetpack_Options::get_option( 'videopress' ) );
	}

	/**
	 * Builds a storage provider that answers for a single option name.
	 *
	 * @param string $handled The option name the provider serves.
	 * @param mixed  $value   The value to serve for it.
	 * @return Storage_Provider_Interface
	 */
	private function provider_serving( $handled, $value ) {
		return new class( $handled, $value ) implements Storage_Provider_Interface {
			/**
			 * The option name this provider serves.
			 *
			 * @var string
			 */
			private $handled;

			/**
			 * The value served for the handled option.
			 *
			 * @var mixed
			 */
			private $value;

			/**
			 * Constructor.
			 *
			 * @param string $handled The option name the provider serves.
			 * @param mixed  $value   The value to serve for it.
			 */
			public function __construct( $handled, $value ) {
				$this->handled = $handled;
				$this->value   = $value;
			}

			/**
			 * Whether the provider is usable in this environment.
			 *
			 * @return bool
			 */
			public function is_available() {
				return true;
			}

			/**
			 * Whether the provider serves the given option.
			 *
			 * @param string $option_name The option name.
			 * @return bool
			 */
			public function should_handle( $option_name ) {
				return $this->handled === $option_name;
			}

			/**
			 * Returns the value for the given option.
			 *
			 * @param string $option_name The option name.
			 * @return mixed
			 */
			public function get( $option_name ) {
				return $this->handled === $option_name ? $this->value : null;
			}

			/**
			 * The environment identifier used in logging.
			 *
			 * @return string
			 */
			public function get_environment_id() {
				return 'test';
			}
		};
	}
}
