<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Settings;
use Automattic\Jetpack\Podcast\Settings_Endpoint;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Podcast\Settings_Endpoint
 */
#[CoversClass( Settings_Endpoint::class )]
class Settings_Endpoint_Test extends BaseTestCase {

	const ROUTE = '/wpcom/v2/podcast/settings';

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Editor user ID (no manage_options).
	 *
	 * @var int
	 */
	private $editor_id;

	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		// Register sanitizers + the endpoint, then fire rest_api_init once so
		// routes resolve under WP_REST_Server::dispatch().
		Settings::register_settings();
		add_action( 'rest_api_init', array( new Settings_Endpoint(), 'register_routes' ) );
		do_action( 'rest_api_init' );

		$this->admin_id  = wp_insert_user(
			array(
				'user_login' => 'podcast_admin',
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'podcast_editor',
				'user_pass'  => 'pw',
				'role'       => 'editor',
			)
		);

		wp_set_current_user( $this->admin_id );
	}

	public function tearDown(): void {
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Build a POST request with the given params attached via `set_param` —
	 * dodges the wp_json_encode-default-flags PHPCS warning in test code.
	 *
	 * @param array $params Params to attach.
	 * @return WP_REST_Request
	 */
	private function post_request( array $params ) {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}
		return $request;
	}

	public function test_get_returns_every_option_with_defaults_when_unset() {
		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		foreach ( Settings::OPTION_NAMES as $key ) {
			$this->assertArrayHasKey( $key, $data, "$key missing from response" );
		}

		// Defaults: numeric → 0, strings → '', booleans → false, maps → all-empty.
		$this->assertSame( 0, $data['podcasting_category_id'] );
		$this->assertSame( '', $data['podcasting_title'] );
		$this->assertFalse( $data['podcasting_explicit'] );
		$this->assertSame(
			array_fill_keys( array_keys( Settings::SHOW_URL_HOSTS ), '' ),
			$data['podcasting_show_urls']
		);
		$this->assertSame(
			array_fill_keys( array_keys( Settings::SHOW_URL_HOSTS ), '' ),
			$data['podcasting_show_states']
		);
	}

	public function test_get_reflects_stored_option_values() {
		update_option( 'podcasting_category_id', 17 );
		update_option( 'podcasting_title', 'My Show' );

		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );
		$data     = $response->get_data();

		$this->assertSame( 17, $data['podcasting_category_id'] );
		$this->assertSame( 'My Show', $data['podcasting_title'] );
	}

	public function test_post_partial_update_persists_only_supplied_keys() {
		update_option( 'podcasting_title', 'Pre-existing' );

		$response = rest_do_request( $this->post_request( array( 'podcasting_talent_name' => 'Jane Host' ) ) );
		$this->assertSame( 200, $response->get_status() );

		$this->assertSame( 'Jane Host', get_option( 'podcasting_talent_name' ) );
		// Title untouched because it wasn't in the patch.
		$this->assertSame( 'Pre-existing', get_option( 'podcasting_title' ) );

		// Response returns the full record, not just the patched key.
		$data = $response->get_data();
		$this->assertSame( 'Jane Host', $data['podcasting_talent_name'] );
		$this->assertSame( 'Pre-existing', $data['podcasting_title'] );
	}

	public function test_post_runs_explicit_sanitizer_on_write() {
		$response = rest_do_request( $this->post_request( array( 'podcasting_explicit' => 'yes' ) ) );
		$this->assertSame( 200, $response->get_status() );

		// 'yes' normalizes to boolean true via Settings::sanitize_explicit.
		$this->assertTrue( $response->get_data()['podcasting_explicit'] );
		$this->assertTrue( (bool) get_option( 'podcasting_explicit' ) );
	}

	public function test_post_show_urls_drops_invalid_hosts() {
		$response = rest_do_request(
			$this->post_request(
				array(
					'podcasting_show_urls' => array(
						'apple'       => 'https://example.com/not-apple',
						'pocketcasts' => 'https://pca.st/podcast/xyz',
					),
				)
			)
		);
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		// Bad host drops; good host keeps.
		$this->assertSame( '', $data['podcasting_show_urls']['apple'] );
		$this->assertSame( 'https://pca.st/podcast/xyz', $data['podcasting_show_urls']['pocketcasts'] );
	}

	public function test_post_show_states_enforces_enum_and_no_active_to_pending_downgrade() {
		update_option( 'podcasting_show_states', array( 'apple' => 'active' ) );

		$response = rest_do_request(
			$this->post_request(
				array(
					'podcasting_show_states' => array(
						'apple'       => 'pending',
						'spotify'     => 'banana',
						'pocketcasts' => 'pending',
					),
				)
			)
		);
		$this->assertSame( 200, $response->get_status() );

		$states = $response->get_data()['podcasting_show_states'];
		// Active state cannot be downgraded to pending by an SPA write.
		$this->assertSame( 'active', $states['apple'] );
		// Unknown enum value dropped.
		$this->assertSame( '', $states['spotify'] );
		// Valid pending state accepted.
		$this->assertSame( 'pending', $states['pocketcasts'] );
	}

	public function test_post_show_urls_merges_partial_patch_into_stored_value() {
		update_option(
			'podcasting_show_urls',
			array(
				'apple'   => 'https://podcasts.apple.com/us/podcast/example/id1',
				'spotify' => 'https://open.spotify.com/show/abc',
			)
		);

		$response = rest_do_request(
			$this->post_request(
				array(
					'podcasting_show_urls' => array( 'pocketcasts' => 'https://pca.st/podcast/xyz' ),
				)
			)
		);
		$urls     = $response->get_data()['podcasting_show_urls'];

		$this->assertSame( 'https://podcasts.apple.com/us/podcast/example/id1', $urls['apple'] );
		$this->assertSame( 'https://open.spotify.com/show/abc', $urls['spotify'] );
		$this->assertSame( 'https://pca.st/podcast/xyz', $urls['pocketcasts'] );
	}

	public function test_get_denied_for_non_admin() {
		wp_set_current_user( $this->editor_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
		$this->assertGreaterThanOrEqual( 401, $response->get_status() );
	}

	public function test_post_denied_for_non_admin() {
		wp_set_current_user( $this->editor_id );

		$response = rest_do_request( $this->post_request( array( 'podcasting_title' => 'Sneaky edit' ) ) );

		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
		$this->assertGreaterThanOrEqual( 401, $response->get_status() );
		$this->assertNotSame( 'Sneaky edit', get_option( 'podcasting_title' ) );
	}
}
