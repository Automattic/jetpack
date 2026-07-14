<?php
/**
 * Tests for the Jetpack SEO Schema_Settings_Controller REST route.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WP_REST_Request;
use WP_REST_Response;

/**
 * @covers \Automattic\Jetpack\SEO\Schema_Settings_Controller
 */
#[CoversClass( Schema_Settings_Controller::class )]
class SchemaSettingsControllerTest extends TestCase {

	/**
	 * Give the site a stable identity so the effective settings are deterministic.
	 *
	 * @param string $name        Site Title.
	 * @param string $description Tagline.
	 * @return void
	 */
	private function set_site_identity( $name, $description = '' ) {
		add_filter(
			'pre_option_blogname',
			static function () use ( $name ) {
				return $name;
			}
		);
		add_filter(
			'pre_option_blogdescription',
			static function () use ( $description ) {
				return $description;
			}
		);
	}

	/**
	 * Clean option between tests.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		delete_option( Schema_Settings::OPTION_NAME );
	}

	/**
	 * Remove filters and stored option so state doesn't leak.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		remove_all_filters( 'pre_option_blogname' );
		remove_all_filters( 'pre_option_blogdescription' );
		delete_option( Schema_Settings::OPTION_NAME );
		parent::tearDown();
	}

	/**
	 * The route is registered under the package's own `jetpack/v4` namespace with
	 * both a read and a write method, not on the shared `/jetpack/v4/settings` route.
	 */
	public function test_register_routes_registers_the_schema_settings_route() {
		$callback = array( Schema_Settings_Controller::class, 'register_routes' );
		// REST routes must be registered on the `rest_api_init` action; firing it here
		// keeps `doing_action()` true so register_rest_route() doesn't flag it.
		add_action( 'rest_api_init', $callback );
		try {
			do_action( 'rest_api_init' );

			$routes = rest_get_server()->get_routes();
			$route  = '/' . Schema_Settings_Controller::REST_NAMESPACE . Schema_Settings_Controller::REST_BASE;

			$this->assertArrayHasKey( $route, $routes );

			$methods = array();
			foreach ( $routes[ $route ] as $handler ) {
				$methods += $handler['methods'];
			}
			$this->assertArrayHasKey( 'GET', $methods );
			$this->assertArrayHasKey( 'POST', $methods );
		} finally {
			remove_action( 'rest_api_init', $callback );
		}
	}

	/**
	 * GET returns the editing payload: the raw stored overrides (empty when nothing
	 * is stored) plus the site-identity defaults used as field placeholders.
	 */
	public function test_get_item_returns_stored_overrides_and_defaults() {
		$this->set_site_identity( 'Acme Co', 'We make things' );

		$response = Schema_Settings_Controller::get_item();

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$data = $response->get_data();
		// Nothing stored yet → the editable overrides are empty...
		$this->assertSame( '', $data['organization']['name'] );
		$this->assertSame( '', $data['organization']['description'] );
		$this->assertSame( array(), $data['organization']['sameAs'] );
		// ...and the site identity is exposed as placeholder defaults.
		$this->assertSame( 'Acme Co', $data['defaults']['organization']['name'] );
		$this->assertSame( 'We make things', $data['defaults']['organization']['description'] );
		$this->assertArrayHasKey( 'localBusiness', $data );
		$this->assertArrayHasKey( 'localBusiness', $data['defaults'] );
		$this->assertFalse( $data['localBusiness']['enabled'] );
		$this->assertSame( '', $data['localBusiness']['address']['streetAddress'] );
	}

	/**
	 * A write sanitizes + persists the submission and returns the new editing
	 * payload; a fresh read then reflects the saved values.
	 */
	public function test_update_item_persists_and_returns_editing_payload() {
		$this->set_site_identity( 'Acme Co' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/seo/schema-settings' );
		$request->set_body_params(
			array(
				'organization' => array(
					'name'   => 'Acme Corporation',
					'sameAs' => array( 'https://twitter.com/acme', 'https://twitter.com/acme' ),
					'email'  => 'hello@acme.test',
				),
			)
		);

		$response = Schema_Settings_Controller::update_item( $request );

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertSame( 'Acme Corporation', $data['organization']['name'] );
		// Duplicate dropped by sanitization.
		$this->assertSame( array( 'https://twitter.com/acme' ), $data['organization']['sameAs'] );
		$this->assertSame( 'hello@acme.test', $data['organization']['email'] );
		// Site identity is still exposed as the placeholder default.
		$this->assertSame( 'Acme Co', $data['defaults']['organization']['name'] );

		// Persisted: the store now returns the saved override.
		$this->assertSame( 'Acme Corporation', Schema_Settings::get_organization()['name'] );
	}

	/**
	 * A LocalBusiness write sanitizes, persists, and returns the stored payload.
	 */
	public function test_update_item_round_trips_local_business_payload() {
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/seo/schema-settings' );
		$request->set_body_params(
			array(
				'localBusiness' => array(
					'enabled' => true,
					'address' => array(
						'streetAddress' => '123 Main St',
					),
					'geo'     => array(
						'latitude'  => '40.7128',
						'longitude' => '-74.0060',
					),
				),
			)
		);

		$response = Schema_Settings_Controller::update_item( $request );

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertTrue( $data['localBusiness']['enabled'] );
		$this->assertSame( '123 Main St', $data['localBusiness']['address']['streetAddress'] );
		$this->assertSame(
			array(
				'latitude'  => '40.7128',
				'longitude' => '-74.0060',
			),
			$data['localBusiness']['geo']
		);
	}

	/**
	 * Invalid LocalBusiness values are cleared in a successful REST response.
	 */
	public function test_update_item_sanitizes_invalid_local_business_values() {
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/seo/schema-settings' );
		$request->set_body_params(
			array(
				'localBusiness' => array(
					'address'    => array( 'addressCountry' => 'United States' ),
					'telephone'  => '555.123.4567',
					'priceRange' => str_repeat( '€', 100 ),
				),
			)
		);

		$response = Schema_Settings_Controller::update_item( $request );

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( '', $data['localBusiness']['address']['addressCountry'] );
		$this->assertSame( '', $data['localBusiness']['telephone'] );
		$this->assertSame( '', $data['localBusiness']['priceRange'] );
	}

	/**
	 * Posting only Organization preserves stored LocalBusiness settings.
	 */
	public function test_update_item_with_organization_only_preserves_local_business() {
		Schema_Settings::update(
			array(
				'localBusiness' => array(
					'enabled' => true,
					'address' => array(
						'streetAddress' => '123 Main St',
					),
				),
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/seo/schema-settings' );
		$request->set_body_params(
			array(
				'organization' => array(
					'name' => 'Acme Corporation',
				),
			)
		);

		$response = Schema_Settings_Controller::update_item( $request );
		$data     = $response->get_data();

		$this->assertSame( 'Acme Corporation', $data['organization']['name'] );
		$this->assertTrue( $data['localBusiness']['enabled'] );
		$this->assertSame( '123 Main St', $data['localBusiness']['address']['streetAddress'] );
	}
}
