<?php
/**
 * Tests for the sharing services routes.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use Automattic\Jetpack\Sharing_Likes\Settings\Section_Environment;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Response;

require_once __DIR__ . '/../lib/class-sharing-service.php';
require_once __DIR__ . '/../lib/class-jetpack-likes-settings.php';
require_once __DIR__ . '/../lib/trait-section-environment.php';
require_once __DIR__ . '/../lib/trait-rest-requests.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\REST\Services_Controller
 */
#[CoversClass( Services_Controller::class )]
class Services_Controller_Test extends BaseTestCase {

	use Section_Environment;
	use REST_Requests;

	/**
	 * Start every case as an administrator on a connected site running sharing buttons.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
		$this->set_up_rest();
		$this->given_connection( true );
		$this->given_modules( array( 'sharedaddy' ) );
		$this->log_in_as( 'administrator' );

		$GLOBALS['sharing_likes_test_services'] = array( 'facebook', 'x', 'email' );
	}

	/**
	 * Leave no options or services behind.
	 */
	public function tear_down() {
		unset( $GLOBALS['sharing_likes_test_services'] );
		delete_option( 'sharing-options' );
		delete_option( 'sharing-services' );

		$this->tear_down_rest();
		$this->tear_down_site();

		parent::tear_down();
	}

	/**
	 * Create a custom service through the API.
	 *
	 * @param string $name Service name.
	 */
	private function create( string $name = 'Mastodon Deluxe' ): WP_REST_Response {
		return $this->request(
			'POST',
			'services/custom',
			array(
				'name' => $name,
				'url'  => 'https://example.com/share?u=%post_url%',
				'icon' => 'https://example.com/icon.png',
			)
		);
	}

	public function test_services_require_manage_options(): void {
		$this->log_in_as( 'editor' );

		$this->assertSame( 403, $this->request( 'GET', 'services' )->get_status() );
	}

	public function test_services_are_unavailable_while_the_sharing_section_does_not_configure(): void {
		$this->create();
		$stored = get_option( 'sharing-options' );
		$this->given_modules( array() );

		$this->assertSame( 409, $this->request( 'GET', 'services' )->get_status() );
		$this->assertSame( 409, $this->create()->get_status() );
		$this->assertSame(
			409,
			$this->request(
				'POST',
				'services',
				array(
					'visible' => array( 'x' ),
					'hidden'  => array(),
				)
			)->get_status()
		);
		$this->assertSame( 409, $this->request( 'POST', 'services/custom/custom-1000', array( 'name' => 'Renamed' ) )->get_status() );
		$this->assertSame( 409, $this->request( 'DELETE', 'services/custom/custom-1000' )->get_status() );
		$this->assertSame( $stored, get_option( 'sharing-options' ) );
		$this->assertFalse( get_option( 'sharing-services' ) );
	}

	public function test_flags_a_deprecated_service(): void {
		$GLOBALS['sharing_likes_test_services'][] = 'deprecated';

		$services = array_column( $this->request( 'GET', 'services' )->get_data()['services'], 'deprecated', 'id' );

		$this->assertTrue( $services['deprecated'] );
		$this->assertFalse( $services['x'] );
	}

	public function test_saving_services_drops_unknown_ones_and_any_listed_twice(): void {
		$data = $this->request(
			'POST',
			'services',
			array(
				'visible' => array( 'x', 'unknown' ),
				'hidden'  => array( 'x', 'email' ),
			)
		)->get_data();

		$this->assertSame( array( 'x' ), $data['visible'] );
		$this->assertSame( array( 'email' ), $data['hidden'] );
	}

	public function test_lists_the_enabled_services_and_every_available_one(): void {
		update_option(
			'sharing-services',
			array(
				'visible' => array( 'x' ),
				'hidden'  => array( 'email' ),
			)
		);

		$data = $this->request( 'GET', 'services' )->get_data();

		$this->assertSame( array( 'x' ), $data['visible'] );
		$this->assertSame( array( 'email' ), $data['hidden'] );
		$this->assertSame( array( 'facebook', 'x', 'email' ), array_column( $data['services'], 'id' ) );
		$this->assertFalse( $data['services'][0]['custom'] );
	}

	public function test_saves_the_enabled_services_in_order(): void {
		$response = $this->request(
			'POST',
			'services',
			array(
				'visible' => array( 'email', 'x' ),
				'hidden'  => array( 'facebook' ),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'email', 'x' ), $response->get_data()['visible'] );
		$this->assertSame(
			array(
				'visible' => array( 'email', 'x' ),
				'hidden'  => array( 'facebook' ),
			),
			get_option( 'sharing-services' )
		);
	}

	/**
	 * An absent list would read as "none", and switch off every service in it.
	 */
	public function test_saving_services_needs_both_lists(): void {
		update_option(
			'sharing-services',
			array(
				'visible' => array( 'x' ),
				'hidden'  => array( 'email' ),
			)
		);

		$response = $this->request( 'POST', 'services', array( 'visible' => array( 'x' ) ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( array( 'email' ), get_option( 'sharing-services' )['hidden'] );
	}

	public function test_creates_a_custom_service(): void {
		$response = $this->create();

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame(
			array(
				'id'         => 'custom-1000',
				'name'       => 'Mastodon Deluxe',
				'custom'     => true,
				'deprecated' => false,
				'url'        => 'https://example.com/share?u=%post_url%',
				'icon'       => 'https://example.com/icon.png',
			),
			$response->get_data()
		);
		$this->assertContains( 'custom-1000', array_column( $this->request( 'GET', 'services' )->get_data()['services'], 'id' ) );
	}

	public function test_lists_custom_service_names_decoded(): void {
		$this->create( 'Tom & Jerry' );

		$this->assertContains( 'Tom & Jerry', array_column( $this->request( 'GET', 'services' )->get_data()['services'], 'name' ) );
	}

	public function test_refuses_a_custom_service_with_missing_details(): void {
		$response = $this->request(
			'POST',
			'services/custom',
			array(
				'name' => 'No icon',
				'url'  => 'https://example.com/share',
				'icon' => '',
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_sharing_likes_invalid_service', $response->get_data()['code'] );
	}

	public function test_editing_a_custom_service_keeps_what_the_request_leaves_out(): void {
		$this->create();

		$response = $this->request( 'POST', 'services/custom/custom-1000', array( 'name' => 'Renamed' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Renamed', $response->get_data()['name'] );
		$this->assertSame( 'https://example.com/icon.png', get_option( 'sharing-options' )['custom-1000']['icon'] );
	}

	public function test_editing_a_custom_service_keeps_backslashes_in_its_name(): void {
		$this->create();

		$this->request( 'POST', 'services/custom/custom-1000', array( 'name' => 'Back\\slash' ) );

		$this->assertSame( 'Back\\slash', get_option( 'sharing-options' )['custom-1000']['name'] );
	}

	public function test_editing_an_unknown_custom_service_is_a_404(): void {
		$this->assertSame( 404, $this->request( 'POST', 'services/custom/custom-1', array( 'name' => 'Nope' ) )->get_status() );
	}

	public function test_deletes_a_custom_service(): void {
		$this->create();

		$response = $this->request( 'DELETE', 'services/custom/custom-1000' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'deleted' => true,
				'id'      => 'custom-1000',
			),
			$response->get_data()
		);
		$this->assertNotContains( 'custom-1000', array_column( $this->request( 'GET', 'services' )->get_data()['services'], 'id' ) );
	}

	public function test_deleting_an_unknown_custom_service_is_a_404(): void {
		$this->assertSame( 404, $this->request( 'DELETE', 'services/custom/custom-1' )->get_status() );
	}

	public function test_the_service_id_comes_from_the_url_alone(): void {
		$this->create();

		$this->assertSame( 404, $this->request( 'DELETE', 'services/custom/custom-1', array( 'id' => 'custom-1000' ) )->get_status() );
		$this->assertSame( 404, $this->request( 'DELETE', 'services/custom/custom-1', array( 'id' => 1000 ) )->get_status() );
		$this->assertContains( 'custom-1000', array_column( $this->request( 'GET', 'services' )->get_data()['services'], 'id' ) );
	}
}
