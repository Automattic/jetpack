<?php
/**
 * Tests for the Jetpack SEO Schema_Settings_Controller REST route.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WP_REST_Request;
use WP_REST_Response;

/**
 * @covers \Automattic\Jetpack\SEO\Schema_Settings_Controller
 * @covers \Automattic\Jetpack\SEO\Author_Schema_Node
 */
#[CoversClass( Schema_Settings_Controller::class )]
#[CoversClass( Author_Schema_Node::class )]
class SchemaSettingsControllerTest extends TestCase {

	/**
	 * @dataProvider conflicted_write_requests
	 */
	#[DataProvider( 'conflicted_write_requests' )]
	public function test_disabled_seo_rejects_writes_but_keeps_saved_values_readable( $route, $method, $payload, $filter, $callback ) {
		$admin = $this->make_user( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin->ID );
		Schema_Settings::update( array( 'organization' => array( 'name' => 'Stored organization' ) ) );
		Author_Schema_Node::update_profile( $admin->ID, array( 'jobTitle' => 'Stored job title' ) );
		$schema          = Schema_Settings::get_editable();
		$profile         = Author_Schema_Node::get_profile( $admin->ID );
		$register_routes = array( Schema_Settings_Controller::class, 'register_routes' );
		add_action( 'rest_api_init', $register_routes );
		add_filter( $filter, $callback );
		try {
			do_action( 'rest_api_init' );
			$request = new WP_REST_Request( $method, '/jetpack/v4/seo/' . $route );
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $payload, JSON_UNESCAPED_SLASHES ) );
			$response = rest_get_server()->dispatch( $request );
			$this->assertSame( 409, $response->get_status() );
			$this->assertSame( 'jetpack_seo_tools_disabled', $response->get_data()['code'] );
			$this->assertSame( $schema, Schema_Settings::get_editable() );
			$this->assertSame( $profile, Author_Schema_Node::get_profile( $admin->ID ) );
			$read = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/jetpack/v4/seo/' . $route ) );
			$this->assertSame( 200, $read->get_status() );
			remove_filter( $filter, $callback );
			$this->assertSame( 200, rest_get_server()->dispatch( $request )->get_status() );
		} finally {
			remove_filter( $filter, $callback );
			remove_action( 'rest_api_init', $register_routes );
		}
	}

	public static function conflicted_write_requests() {
		$cases = array();
		foreach ( array( 'POST', 'PUT', 'PATCH' ) as $method ) {
			foreach ( array( 'general disable', 'plugin conflict' ) as $reason ) {
				$filter                            = 'general disable' === $reason ? 'jetpack_disable_seo_tools' : 'jetpack_seo_conflicting_plugin';
				$callback                          = 'general disable' === $reason ? '__return_true' : static function () {
					return 'Yoast SEO';
				};
				$cases[ "schema $method $reason" ] = array( 'schema-settings', $method, array( 'organization' => array( 'name' => 'Changed organization' ) ), $filter, $callback );
				$cases[ "author $method $reason" ] = array( 'author-profile', $method, array( 'jobTitle' => 'Changed job title' ), $filter, $callback );
			}
		}
		return $cases;
	}

	/**
	 * Users created during the test.
	 *
	 * @var int[]
	 */
	private $user_ids = array();

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
		wp_set_current_user( 0 );
		require_once ABSPATH . 'wp-admin/includes/user.php';
		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
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
		$this->assertTrue( $data['breadcrumbList']['enabled'] );
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
				'organization'   => array(
					'name'   => 'Acme Corporation',
					'sameAs' => array( 'https://twitter.com/acme', 'https://twitter.com/acme' ),
					'email'  => 'hello@acme.test',
				),
				'breadcrumbList' => array( 'enabled' => false ),
			)
		);

		$response = Schema_Settings_Controller::update_item( $request );

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertSame( 'Acme Corporation', $data['organization']['name'] );
		// Duplicate dropped by sanitization.
		$this->assertSame( array( 'https://twitter.com/acme' ), $data['organization']['sameAs'] );
		$this->assertSame( 'hello@acme.test', $data['organization']['email'] );
		$this->assertFalse( $data['breadcrumbList']['enabled'] );
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
	 * Posting only Organization preserves other stored schema settings.
	 */
	public function test_update_item_with_organization_only_preserves_local_business() {
		Schema_Settings::update(
			array(
				'localBusiness'  => array(
					'enabled' => true,
					'address' => array(
						'streetAddress' => '123 Main St',
					),
				),
				'breadcrumbList' => array( 'enabled' => false ),
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
		$this->assertFalse( $data['breadcrumbList']['enabled'] );
	}

	/**
	 * Create a WP user.
	 *
	 * @param array $overrides User field overrides.
	 * @return \WP_User
	 */
	private function make_user( array $overrides = array() ) {
		$suffix  = (string) ( count( $this->user_ids ) + 1 ) . '_' . wp_rand();
		$user_id = wp_insert_user(
			array_merge(
				array(
					'user_login'   => 'seo_author_' . $suffix,
					'user_pass'    => 'password',
					'user_email'   => 'seo_author_' . $suffix . '@example.test',
					'display_name' => 'Jane Doe',
				),
				$overrides
			)
		);

		$this->assertIsInt( $user_id );
		$this->user_ids[] = $user_id;
		return get_userdata( $user_id );
	}

	/**
	 * Dispatch a request to the author-profile route through the REST server.
	 *
	 * @param string $method HTTP method.
	 * @param array  $body   Body params.
	 * @return WP_REST_Response
	 */
	private function dispatch_author_profile( $method, array $body = array() ) {
		$callback = array( Schema_Settings_Controller::class, 'register_routes' );
		add_action( 'rest_api_init', $callback );
		try {
			do_action( 'rest_api_init' );
			$request = new WP_REST_Request( $method, '/jetpack/v4/seo/author-profile' );
			$request->set_body_params( $body );
			return rest_get_server()->dispatch( $request );
		} finally {
			remove_action( 'rest_api_init', $callback );
		}
	}

	/**
	 * A save writes every field, backslashes intact, to the signed-in user, where the front-end
	 * Person schema reads it, and never to a user named in the body.
	 */
	public function test_author_profile_route_saves_the_current_users_profile() {
		$admin = $this->make_user( array( 'role' => 'administrator' ) );
		$other = $this->make_user( array( 'display_name' => 'Other Person' ) );
		wp_set_current_user( $admin->ID );

		$response = $this->dispatch_author_profile(
			'POST',
			array(
				'id'          => $other->ID,
				'name'        => 'Jane Smith',
				'description' => 'Writes about C:\\tools.',
				'url'         => 'https://example.com/jane/',
				'jobTitle'    => ' Lead <b>Creator</b> \\ SEO ',
				'sameAs'      => array( 'https://x.com/jane', 'not a url' ),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$expected = array(
			'name'        => 'Jane Smith',
			'description' => 'Writes about C:\\tools.',
			'url'         => 'https://example.com/jane/',
			'jobTitle'    => 'Lead Creator \\ SEO',
			'sameAs'      => array( 'https://x.com/jane' ),
		);
		$this->assertSame( $expected, array_intersect_key( $response->get_data(), $expected ) );
		$this->assertSame(
			$expected,
			array_intersect_key( $this->dispatch_author_profile( 'GET' )->get_data(), $expected )
		);
		$person = Author_Schema_Node::build_person( $admin->ID );
		$this->assertSame( 'Jane Smith', $person['name'] );
		$this->assertSame( 'Writes about C:\\tools.', $person['description'] );
		$this->assertSame( 'https://example.com/jane/', $person['url'] );
		$this->assertSame( 'Lead Creator \\ SEO', $person['jobTitle'] );
		$this->assertSame( array( 'https://x.com/jane' ), $person['sameAs'] );
		$this->assertSame( 'Other Person', get_userdata( $other->ID )->display_name );
	}

	/**
	 * An empty name is rejected without touching the stored profile.
	 */
	public function test_author_profile_route_rejects_an_empty_name() {
		$admin = $this->make_user( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin->ID );

		$response = $this->dispatch_author_profile(
			'POST',
			array(
				'name'     => '  ',
				'jobTitle' => 'Editor',
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'Jane Doe', get_userdata( $admin->ID )->display_name );
		$this->assertSame( '', get_user_meta( $admin->ID, Author_Schema_Node::META_JOB_TITLE, true ) );
	}

	/**
	 * Hosts and users, with the account link and the name, bio and website a save leaves.
	 *
	 * @return array<string, array{bool, bool, bool, array<int, string>}>
	 */
	public static function provide_profile_hosts() {
		$kept   = array( 'https://my.wordpress.com/me/account', 'Jane Doe', 'Original bio.', '' );
		$edited = array( '', 'Someone Else', 'Rewritten bio.', 'https://example.com/someone/' );
		return array(
			'Simple'                          => array( true, false, false, $kept ),
			'Atomic, WordPress.com user'      => array( false, true, true, $kept ),
			'Atomic, local user'              => array( false, true, false, $edited ),
			'Self-hosted, WordPress.com user' => array( false, false, true, $edited ),
		);
	}

	/**
	 * Name, bio and website save only where WordPress.com doesn't own them; the SEO fields always save.
	 *
	 * @dataProvider provide_profile_hosts
	 * @param bool               $simple    Whether to simulate WordPress.com Simple.
	 * @param bool               $atomic    Whether to simulate WordPress.com on Atomic.
	 * @param bool               $connected Whether the user is connected to WordPress.com.
	 * @param array<int, string> $expected  Account link, then the name, bio and website after the save.
	 */
	#[DataProvider( 'provide_profile_hosts' )]
	public function test_author_profile_route_saves_account_fields_only_where_the_site_owns_them( $simple, $atomic, $connected, $expected ) {
		$admin = $this->make_user(
			array(
				'role'        => 'administrator',
				'description' => 'Original bio.',
			)
		);
		wp_set_current_user( $admin->ID );
		if ( $simple ) {
			Constants::set_constant( 'IS_WPCOM', true );
		}
		if ( $atomic ) {
			Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
			Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
			Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', true );
		}
		if ( $connected ) {
			Jetpack_Options::update_option( 'user_tokens', array( $admin->ID => 'key.secret.' . $admin->ID ) );
		}
		Status_Cache::clear();
		try {
			$response = $this->dispatch_author_profile(
				'POST',
				array(
					'name'        => 'Someone Else',
					'description' => 'Rewritten bio.',
					'url'         => 'https://example.com/someone/',
					'jobTitle'    => 'Editor',
				)
			);
		} finally {
			foreach ( array( 'IS_WPCOM', 'ATOMIC_SITE_ID', 'ATOMIC_CLIENT_ID', 'WPCOMSH__PLUGIN_FILE' ) as $constant ) {
				Constants::clear_single_constant( $constant );
			}
			Jetpack_Options::delete_option( 'user_tokens' );
			Status_Cache::clear();
		}

		$this->assertSame( 200, $response->get_status() );
		$user = get_userdata( $admin->ID );
		$this->assertSame(
			$expected,
			array( $response->get_data()['accountProfileUrl'], $user->display_name, $user->description, $user->user_url )
		);
		$this->assertSame( 'Editor', get_user_meta( $admin->ID, Author_Schema_Node::META_JOB_TITLE, true ) );
	}
}
