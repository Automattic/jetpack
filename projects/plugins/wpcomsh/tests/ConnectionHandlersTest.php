<?php
/**
 * Tests for the registration of the Atomic external storage provider.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\External_Storage;
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * The "wpcloud" suite excludes this file: on a real WP Cloud site, the platform's wpcomsh defines
 * these functions first, so the test would check that copy and not this one.
 *
 * @covers ::wpcomsh_init_connection_handlers
 * @covers ::wpcomsh_init_external_storage
 */
#[CoversFunction( 'wpcomsh_init_connection_handlers' )]
#[CoversFunction( 'wpcomsh_init_external_storage' )]
class ConnectionHandlersTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Start each test with no provider, no hook and an unfired init action.
	 */
	public function set_up() {
		parent::set_up();
		$this->reset_external_storage();
		remove_action( 'jetpack_external_storage_init', 'wpcomsh_init_external_storage' );
	}

	/**
	 * Remove the provider and the hook after each test.
	 */
	public function tear_down() {
		$this->reset_external_storage();
		remove_action( 'jetpack_external_storage_init', 'wpcomsh_init_external_storage' );
		parent::tear_down();
	}

	/**
	 * When the classes load, the provider registers at once, so connection versions that never fire
	 * `jetpack_external_storage_init` still get it. No hook is added.
	 */
	public function test_registers_the_provider_at_once_when_the_classes_load() {
		add_filter( 'wpcomsh_register_external_storage_provider', '__return_true' );

		wpcomsh_init_connection_handlers();

		$this->assertInstanceOf( Atomic_Storage_Provider::class, $this->get_provider() );
		$this->assertFalse( has_action( 'jetpack_external_storage_init', 'wpcomsh_init_external_storage' ) );
	}

	/**
	 * When the provider cannot register at load, it registers when the first read fires the init action.
	 */
	public function test_registers_the_provider_on_the_init_action_when_it_cannot_register_at_load() {
		add_filter( 'wpcomsh_register_external_storage_provider', '__return_false' );

		wpcomsh_init_connection_handlers();

		$this->assertNull( $this->get_provider() );
		$this->assertSame( 10, has_action( 'jetpack_external_storage_init', 'wpcomsh_init_external_storage' ) );

		remove_filter( 'wpcomsh_register_external_storage_provider', '__return_false' );
		add_filter( 'wpcomsh_register_external_storage_provider', '__return_true' );
		External_Storage::get_value( 'id' );

		$this->assertInstanceOf( Atomic_Storage_Provider::class, $this->get_provider() );
	}

	/**
	 * Returns the registered external storage provider.
	 *
	 * @return mixed
	 */
	private function get_provider() {
		$provider = new ReflectionProperty( External_Storage::class, 'provider' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$provider->setAccessible( true );
		}
		return $provider->getValue();
	}

	/**
	 * Removes the provider and marks the init action as not fired.
	 */
	private function reset_external_storage() {
		foreach ( array(
			'provider'   => null,
			'init_fired' => false,
		) as $name => $value ) {
			$property = new ReflectionProperty( External_Storage::class, $name );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$property->setValue( null, $value );
		}
	}
}
