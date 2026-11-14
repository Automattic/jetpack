<?php
/**
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WP_REST_Request;

/** @covers \Automattic\Jetpack\SEO\Indexnow */
#[CoversClass( Indexnow::class )]
class IndexnowSettingsTest extends SeoTestCase {
	protected function setUp(): void {
		parent::setUp();
		self::set_seo_tools_active( true );
		add_filter( 'rsm_jetpack_seo', '__return_true' );
		update_option( 'blog_public', 1 );
	}

	protected function tearDown(): void {
		Indexnow_Queue::clear();
		foreach ( array( Indexnow_Client::ENABLED_OPTION, Indexnow_Client::SCOPE_OPTION, Indexnow_Client::KEY_OPTION, Indexnow_Queue::STATUS_OPTION, Indexnow_Queue::ACCEPTED_OPTION, Indexnow_Queue::GENERATION_OPTION, 'jetpack_seo_indexnow_enqueue_error' ) as $option ) {
			delete_option( $option );
		}
		remove_filter( 'rsm_jetpack_seo', '__return_true' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'jetpack_seo_indexnow_can_notify' );
		wp_set_current_user( 0 );
		remove_action( 'rest_api_init', array( Indexnow::class, 'register_routes' ) );
		parent::tearDown();
	}

	/** @dataProvider denied_requests */
	#[DataProvider( 'denied_requests' )]
	public function test_settings_cannot_be_read_or_changed_without_admin_access( $method, $role, $expected ) {
		if ( $role ) {
			wp_set_current_user(
				wp_insert_user(
					array(
						'user_login' => 'indexnow-editor-' . strtolower( $method ),
						'role'       => $role,
						'user_pass'  => 'test-only-password',
					)
				)
			);
		}
		add_action( 'rest_api_init', array( Indexnow::class, 'register_routes' ) );
		do_action( 'rest_api_init' );
		$request = new WP_REST_Request( $method, '/jetpack/v4/seo/indexnow' );
		$request->set_param( 'enabled', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( $expected, $response->get_status() );
		$this->assertFalse( (bool) get_option( Indexnow_Client::ENABLED_OPTION, false ) );
	}

	public static function denied_requests() {
		return array(
			'guest read'   => array( 'GET', null, 401 ),
			'guest write'  => array( 'POST', null, 401 ),
			'editor read'  => array( 'GET', 'editor', 403 ),
			'editor write' => array( 'POST', 'editor', 403 ),
		);
	}

	/** @dataProvider consent_values */
	#[DataProvider( 'consent_values' )]
	public function test_rest_consent_is_validated_and_sanitized( $value, $expected_status, $enabled ) {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'indexnow-consent-' . wp_generate_uuid4(),
					'role'       => 'administrator',
					'user_pass'  => 'test-only-password',
				)
			)
		);
		add_action( 'rest_api_init', array( Indexnow::class, 'register_routes' ) );
		do_action( 'rest_api_init' );
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/seo/indexnow' );
		$request->set_param( 'enabled', $value );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( $expected_status, $response->get_status() );
		$this->assertSame( $enabled, (bool) get_option( Indexnow_Client::ENABLED_OPTION, false ) );
	}

	public static function consent_values() {
		return array(
			'boolean true'   => array( true, 200, true ),
			'boolean false'  => array( false, 200, false ),
			'query false'    => array( 'false', 200, false ),
			'invalid string' => array( 'not-a-boolean', 400, false ),
			'invalid array'  => array( array( 'yes' ), 400, false ),
		);
	}

	public function test_opt_in_does_not_backfill_and_opt_out_clears_scheduled_work() {
		wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Existing public content',
			)
		);
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'enabled', true );
		$status = Indexnow::save( $request );
		$this->assertTrue( $status['enabled'] );
		$this->assertSame( home_url( '/' ), get_option( Indexnow_Client::SCOPE_OPTION ) );
		$this->assertSame( 0, $status['pending'] );
		$this->assertNotFalse( wp_next_scheduled( Indexnow_Queue::RECOVERY_HOOK ) );
		update_option( 'jetpack_seo_indexnow_enqueue_error', array( 'state' => 'queue_full_or_busy' ) );
		$request->set_param( 'enabled', false );
		$status = Indexnow::save( $request );
		$this->assertFalse( $status['enabled'] );
		$this->assertFalse( wp_next_scheduled( Indexnow_Queue::RECOVERY_HOOK ) );
		$this->assertNull( $status['enqueue_error'] );
	}
	public function test_status_counts_beyond_the_first_queue_page_without_returning_urls() {
		for ( $i = 0; $i < 301; ++$i ) {
			add_option( Indexnow_Queue::PREFIX . hash( 'sha256', (string) $i ), wp_json_encode( array( 'url' => 'https://example.com/private-test-' . $i ), JSON_UNESCAPED_SLASHES ), '', false );
		}
		$status = Indexnow::status();
		$this->assertSame( 301, $status['pending'] );
		$this->assertStringNotContainsString( 'private-test-', wp_json_encode( $status, JSON_UNESCAPED_SLASHES ) );
	}

	public function test_status_distinguishes_an_address_change_from_a_provider_pause() {
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'enabled', true );
		Indexnow::save( $request );
		update_option( Indexnow_Client::SCOPE_OPTION, 'https://previous.example/' );
		$this->assertSame( 'address_changed', Indexnow::status()['pause_reason'] );
		add_filter( 'jetpack_seo_indexnow_can_notify', '__return_false' );
		$this->assertSame( 'provider', Indexnow::status()['pause_reason'] );
		$this->assertTrue( Indexnow::status()['enabled'] );
		$this->assertFalse( Indexnow::status()['operational'] );
	}

	public function test_opt_out_remains_available_on_a_private_site_and_clears_pending_work() {
		add_option( Indexnow_Queue::PREFIX . hash( 'sha256', 'pending' ), '{}', '', false );
		update_option( 'blog_public', -1 );
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'enabled', false );
		$status = Indexnow::save( $request );
		$this->assertFalse( $status['enabled'] );
		$this->assertSame( 0, $status['pending'] );
		$this->assertSame( 'not_public', $status['pause_reason'] );
	}
	/**
	 * @dataProvider refused_preferences
	 */
	#[DataProvider( 'refused_preferences' )]
	public function test_a_refused_preference_write_returns_an_error( $enabled ) {
		update_option( Indexnow_Client::ENABLED_OPTION, ! $enabled, false );
		$filter = 'pre_update_option_' . Indexnow_Client::ENABLED_OPTION;
		$refuse = static function ( $next, $old ) {
			return $old;
		};
		add_filter( $filter, $refuse, 10, 2 );
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'enabled', $enabled );
		try {
			$response = Indexnow::save( $request );
			$this->assertInstanceOf( \WP_Error::class, $response );
			$this->assertSame( 'jetpack_seo_indexnow_save_failed', $response->get_error_code() );
			$this->assertSame( ! $enabled, (bool) get_option( Indexnow_Client::ENABLED_OPTION, false ) );
		} finally {
			remove_filter( $filter, $refuse, 10 );
		}
	}

	public static function refused_preferences() {
		return array(
			'enable'  => array( true ),
			'disable' => array( false ),
		);
	}

	public function test_vip_does_not_register_an_opt_in_endpoint() {
		$original                  = $GLOBALS['wp_rest_server'];
		$GLOBALS['wp_rest_server'] = new \WP_REST_Server(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		\Automattic\Jetpack\Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );
		try {
			Indexnow::register_routes();
			$this->assertArrayNotHasKey( '/jetpack/v4/seo/indexnow', rest_get_server()->get_routes() );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'WPCOM_IS_VIP_ENV' );
			$GLOBALS['wp_rest_server'] = $original; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}
	}
}
