<?php
/**
 * Tests for the Help Center Jetpack connection health endpoint.
 *
 * @package automattic/jetpack-help-center
 */

use Automattic\Jetpack\Connection\External_Storage;
use Automattic\Jetpack\Connection\Storage_Provider_Interface;
use Automattic\Jetpack\Help_Center\WP_REST_Help_Center_Jetpack_Connection_Health;

require_once __DIR__ . '/class-cta-capturing-request-client.php';

/**
 * Class Jetpack_Connection_Health_Request_Test
 */
class Jetpack_Connection_Health_Request_Test extends \WorDBless\BaseTestCase {

	/**
	 * Remove the external storage provider and the option after each test.
	 */
	public function tear_down() {
		$provider = new ReflectionProperty( External_Storage::class, 'provider' );
		if ( PHP_VERSION_ID < 80100 ) {
			$provider->setAccessible( true );
		}
		$provider->setValue( null, null );
		delete_option( 'jetpack_options' );
		parent::tear_down();
	}

	/**
	 * A migrated site: external storage has the ID, and the `jetpack_options` row has no `id`.
	 */
	public function test_requests_the_site_id_from_external_storage_when_the_row_has_none() {
		update_option( 'jetpack_options', array( 'version' => '14.0:1700000000' ) );
		$this->register_external_storage( array( 'id' => 98765432 ) );

		$this->assertSame( 'sites/98765432/jetpack-connection-health', $this->get_requested_path() );
	}

	/**
	 * Without external storage, the ID comes from the row.
	 */
	public function test_requests_the_site_id_from_the_row_without_external_storage() {
		update_option( 'jetpack_options', array( 'id' => 12345 ) );

		$this->assertSame( 'sites/12345/jetpack-connection-health', $this->get_requested_path() );
	}

	/**
	 * Calls the endpoint and returns the path of the one request that it sends to WordPress.com.
	 *
	 * @return string
	 */
	private function get_requested_path() {
		$client     = new Cta_Capturing_Request_Client( 200, '{"is_healthy":true}' );
		$controller = new WP_REST_Help_Center_Jetpack_Connection_Health( $client );
		$controller->get_connection_health();

		$this->assertCount( 1, $client->requests );
		return $client->requests[0]['path'];
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
