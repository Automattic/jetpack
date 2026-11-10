<?php
/**
 * Tests for get_wpcom_blog_id().
 *
 * Runs in separate processes because get_wpcom_blog_id() reads IS_ATOMIC and IS_WPCOM
 * via defined(), and External_Storage keeps its provider in a static property.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\External_Storage;
use Automattic\Jetpack\Connection\Storage_Provider_Interface;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * @covers ::get_wpcom_blog_id
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversFunction( 'get_wpcom_blog_id' )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Get_Wpcom_Blog_Id_Test extends \WorDBless\BaseTestCase {

	/**
	 * A migrated Atomic site: the platform's external storage has the ID, but the
	 * `jetpack_options` row came from the source site's database and has no `id`.
	 */
	public function test_atomic_reads_the_id_from_external_storage_when_the_row_has_none() {
		define( 'IS_ATOMIC', true );
		update_option( 'jetpack_options', array( 'version' => '14.0:1700000000' ) );
		$this->register_external_storage( array( 'id' => 258563328 ) );

		$this->assertSame( 258563328, get_wpcom_blog_id() );
	}

	/**
	 * External storage is what Jetpack's connection uses, so it wins over a stale row.
	 */
	public function test_atomic_prefers_external_storage_over_the_row() {
		define( 'IS_ATOMIC', true );
		update_option( 'jetpack_options', array( 'id' => 11111 ) );
		$this->register_external_storage( array( 'id' => 22222 ) );

		$this->assertSame( 22222, get_wpcom_blog_id() );
	}

	/**
	 * Without external storage, the ID comes from the row, as before.
	 */
	public function test_atomic_reads_the_id_from_the_row_without_external_storage() {
		define( 'IS_ATOMIC', true );
		update_option( 'jetpack_options', array( 'id' => 12345 ) );

		$this->assertSame( 12345, get_wpcom_blog_id() );
	}

	/**
	 * With no ID anywhere, the local blog ID is still the fallback.
	 */
	public function test_atomic_falls_back_to_the_local_blog_id_without_any_id() {
		define( 'IS_ATOMIC', true );
		delete_option( 'jetpack_options' );

		$this->assertSame( get_current_blog_id(), get_wpcom_blog_id() );
	}

	/**
	 * On WordPress.com, the local blog ID is the WordPress.com blog ID.
	 */
	public function test_wpcom_returns_the_current_blog_id() {
		define( 'IS_WPCOM', true );
		$this->register_external_storage( array( 'id' => 22222 ) );

		$this->assertSame( get_current_blog_id(), get_wpcom_blog_id() );
	}

	/**
	 * A site that is neither on WordPress.com nor on Atomic has no WordPress.com blog ID.
	 */
	public function test_other_sites_return_false() {
		update_option( 'jetpack_options', array( 'id' => 12345 ) );

		$this->assertFalse( get_wpcom_blog_id() );
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
