<?php
/**
 * Tests for the Services class.
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Constants;
use WorDBless\BaseTestCase;

/**
 * Tests for Services.
 */
class Services_Test extends BaseTestCase {

	/**
	 * A services list in the shape the `publicize/services` endpoint returns.
	 *
	 * @var array
	 */
	private const SERVICES = array(
		array(
			'id'          => 'facebook',
			'description' => 'Share to Facebook.',
			'label'       => 'Facebook',
			'status'      => 'ok',
			'supports'    => array(
				'additional_users'      => true,
				'additional_users_only' => false,
			),
			'url'         => null,
		),
	);

	/**
	 * The fields get_all() used to bolt onto every service on Jetpack sites.
	 *
	 * @var string[]
	 */
	private const LEGACY_FIELDS = array( 'ID', 'connect_URL', 'external_users_only', 'multiple_external_user_ID_support' );

	/**
	 * The connected user making the request.
	 *
	 * @var int
	 */
	private $user_id = 0;

	/**
	 * Connect a user, so a cache miss is proxied rather than refused.
	 */
	public function set_up() {
		parent::set_up();

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'dummy_editor',
				'user_pass'  => 'dummy_pass',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $this->user_id );

		\Jetpack_Options::update_option( 'id', 1234 );
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
	}

	/**
	 * Undo what BaseTestCase does not: it restores hooks, but not these.
	 */
	public function tear_down() {
		Constants::clear_single_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Services::clear_cache();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Mock the user's token.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array( $this->user_id => 'pretend_this_is_valid.secret.' . $this->user_id ),
		);
	}

	public function test_get_all_does_not_add_legacy_fields_to_cached_services() {
		set_transient( Services::SERVICES_TRANSIENT, self::SERVICES, DAY_IN_SECONDS );

		$this->assertSame( self::SERVICES, Services::get_all() );
	}

	public function test_get_all_does_not_add_legacy_fields_on_a_cache_miss() {
		$this->mock_services_response( self::SERVICES );

		$services = Services::get_all();

		$this->assertNotEmpty( $services );
		$this->assertNoLegacyFields( $services );

		// What lands in the transient is what every later request of the day serves.
		$this->assertNoLegacyFields( get_transient( Services::SERVICES_TRANSIENT ) );
	}

	public function test_get_all_applies_the_jetpack_publicize_services_filter() {
		set_transient( Services::SERVICES_TRANSIENT, self::SERVICES, DAY_IN_SECONDS );

		$filtered = array( array( 'id' => 'added-by-a-filter' ) );
		add_filter(
			'jetpack_publicize_services',
			function () use ( $filtered ) {
				return $filtered;
			}
		);

		$this->assertSame( $filtered, Services::get_all() );
	}

	/**
	 * Assert that no service in the list carries one of the legacy fields.
	 *
	 * @param mixed $services The services list to check.
	 */
	private function assertNoLegacyFields( $services ) {
		$this->assertIsArray( $services );

		foreach ( $services as $service ) {
			foreach ( self::LEGACY_FIELDS as $field ) {
				$this->assertArrayNotHasKey( $field, $service );
			}
		}
	}

	/**
	 * Answer the proxied wpcom request with a services list.
	 *
	 * @param array $services The services list to answer with.
	 */
	private function mock_services_response( array $services ) {
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		add_filter(
			'pre_http_request',
			function () use ( $services ) {
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( $services, JSON_UNESCAPED_SLASHES ),
				);
			}
		);
	}
}
