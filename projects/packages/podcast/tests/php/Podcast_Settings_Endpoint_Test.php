<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Podcast_Settings_Endpoint;
use Automattic\Jetpack\Podcast\Settings;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\UsesClass;
use WorDBless\BaseTestCase;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Response;

/**
 * @covers \Automattic\Jetpack\Podcast\Podcast_Settings_Endpoint
 * @uses \Automattic\Jetpack\Podcast\Settings
 */
#[CoversClass( Podcast_Settings_Endpoint::class )]
#[UsesClass( Settings::class )]
class Podcast_Settings_Endpoint_Test extends BaseTestCase {

	const ROUTE = '/wpcom/v2/podcast/settings';

	/**
	 * Admin user id (passes `manage_options`).
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * Subscriber user id (fails `manage_options`).
	 *
	 * @var int
	 */
	private static $subscriber_id;

	protected function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();
		// @phan-suppress-next-line PhanNoopNew -- constructor self-registers on rest_api_init.
		new Podcast_Settings_Endpoint();
		do_action( 'rest_api_init' );

		Settings::register_settings();

		self::$admin_id      = wp_insert_user(
			array(
				'user_login' => 'pod_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		self::$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'pod_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);

		wp_set_current_user( self::$admin_id );
	}

	protected function tearDown(): void {
		foreach ( Settings::OPTION_NAMES as $name ) {
			delete_option( $name );
		}
		wp_set_current_user( 0 );

		global $wp_rest_server;
		$wp_rest_server = null;

		WorDBless_Users::init()->clear_all_users();
		parent::tearDown();
	}

	private function get_settings(): WP_REST_Response {
		return rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );
	}

	private function put_settings( array $body ): WP_REST_Response {
		$request = new WP_REST_Request( 'PUT', self::ROUTE );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( (string) wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		return rest_do_request( $request );
	}

	public function test_get_returns_full_padded_record() {
		update_option( 'podcasting_title', 'My Show' );

		$response = $this->get_settings();
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		foreach ( Settings::OPTION_NAMES as $name ) {
			$this->assertArrayHasKey( $name, $data, "$name should be present in the response" );
		}
		$this->assertSame( 'My Show', $data['podcasting_title'] );
		$this->assertSame(
			array_keys( Settings::SHOW_URL_HOSTS ),
			array_keys( $data['podcasting_show_urls'] )
		);
	}

	public function test_put_merges_partial_patch_and_returns_full_record() {
		update_option(
			'podcasting_show_urls',
			array( 'apple' => 'https://podcasts.apple.com/show/1' )
		);

		$response = $this->put_settings(
			array( 'podcasting_show_urls' => array( 'spotify' => 'https://open.spotify.com/show/abc' ) )
		);
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'https://podcasts.apple.com/show/1', $data['podcasting_show_urls']['apple'] );
		$this->assertSame( 'https://open.spotify.com/show/abc', $data['podcasting_show_urls']['spotify'] );
	}

	public function test_put_does_not_clobber_absent_keys() {
		update_option( 'podcasting_title', 'Keep Me' );
		update_option( 'podcasting_summary', 'Keep Me Too' );

		$this->put_settings( array( 'podcasting_title' => 'Changed' ) );

		$this->assertSame( 'Changed', get_option( 'podcasting_title' ) );
		$this->assertSame( 'Keep Me Too', get_option( 'podcasting_summary' ) );
	}

	public function test_put_refuses_active_to_pending_downgrade() {
		update_option( 'podcasting_show_states', array( 'apple' => 'active' ) );

		$response = $this->put_settings(
			array( 'podcasting_show_states' => array( 'apple' => 'pending' ) )
		);

		$data = $response->get_data();
		$this->assertSame( 'active', $data['podcasting_show_states']['apple'] );
	}

	public function test_put_fires_settings_saved_action_when_an_option_is_saved() {
		$fired = 0;
		add_action(
			'jetpack_podcast_settings_saved',
			static function () use ( &$fired ) {
				++$fired;
			}
		);

		$this->put_settings( array( 'podcasting_title' => 'Hooked' ) );

		$this->assertSame( 1, $fired );
	}

	public function test_put_skips_action_when_value_unchanged() {
		update_option( 'podcasting_title', 'Same' );

		$fired = 0;
		add_action(
			'jetpack_podcast_settings_saved',
			static function () use ( &$fired ) {
				++$fired;
			}
		);

		$response = $this->put_settings( array( 'podcasting_title' => 'Same' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 0, $fired );
	}

	public function test_put_skips_action_when_no_recognized_option_present() {
		$fired = 0;
		add_action(
			'jetpack_podcast_settings_saved',
			static function () use ( &$fired ) {
				++$fired;
			}
		);

		$response = $this->put_settings( array( 'not_a_podcasting_key' => 'whatever' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 0, $fired );
	}

	public function test_get_denied_for_users_without_manage_options() {
		wp_set_current_user( self::$subscriber_id );

		$this->assertSame( 403, $this->get_settings()->get_status() );
	}

	public function test_put_denied_for_users_without_manage_options() {
		wp_set_current_user( self::$subscriber_id );

		$response = $this->put_settings( array( 'podcasting_title' => 'Nope' ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( '', get_option( 'podcasting_title', '' ) );
	}
}
