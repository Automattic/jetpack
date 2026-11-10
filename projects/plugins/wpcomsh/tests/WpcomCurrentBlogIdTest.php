<?php
/**
 * Tests for _wpcom_get_current_blog_id().
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\External_Storage;
use Automattic\Jetpack\Connection\Storage_Provider_Interface;
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * The bootstrap defines IS_ATOMIC, so every test here runs as an Atomic site.
 *
 * @covers ::_wpcom_get_current_blog_id
 */
#[CoversFunction( '_wpcom_get_current_blog_id' )]
class WpcomCurrentBlogIdTest extends WP_UnitTestCase {
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
		parent::tear_down();
	}

	/**
	 * A migrated site: the platform's external storage has the ID, but the `jetpack_options`
	 * row came from the source site's database and has no `id`.
	 */
	public function test_reads_the_id_from_external_storage_when_the_row_has_none() {
		update_option( 'jetpack_options', array( 'version' => '14.0:1700000000' ) );
		$this->register_external_storage( array( 'id' => 258563328 ) );

		$this->assertSame( 258563328, _wpcom_get_current_blog_id() );
	}

	/**
	 * External storage is what Jetpack's connection uses, so it wins over a stale row.
	 */
	public function test_prefers_external_storage_over_the_row() {
		update_option( 'jetpack_options', array( 'id' => 11111 ) );
		$this->register_external_storage( array( 'id' => 22222 ) );

		$this->assertSame( 22222, _wpcom_get_current_blog_id() );
	}

	/**
	 * Without external storage, the ID comes from the row, as before.
	 */
	public function test_reads_the_id_from_the_row_without_external_storage() {
		update_option( 'jetpack_options', array( 'id' => 12345 ) );

		$this->assertSame( 12345, _wpcom_get_current_blog_id() );
	}

	/**
	 * With no ID anywhere, the local blog ID is still the fallback.
	 */
	public function test_falls_back_to_the_local_blog_id_without_any_id() {
		delete_option( 'jetpack_options' );

		$this->assertSame( get_current_blog_id(), _wpcom_get_current_blog_id() );
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
