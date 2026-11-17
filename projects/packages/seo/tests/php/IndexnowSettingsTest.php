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

	/** @dataProvider historical_receipts */
	#[DataProvider( 'historical_receipts' )]
	public function test_opt_out_resets_actionable_status_and_retains_only_valid_history( $receipt_state, $address_changed ) {
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'enabled', true );
		Indexnow::save( $request );
		$receipt = array(
			'state' => $receipt_state,
			'time'  => 100,
			'count' => 1,
		);
		update_option(
			Indexnow_Queue::STATUS_OPTION,
			array(
				'state'     => 'http_403',
				'expired'   => 1,
				'exhausted' => 1,
			),
			false
		);
		update_option( Indexnow_Queue::ACCEPTED_OPTION, $receipt, false );
		update_option( 'jetpack_seo_indexnow_enqueue_error', array( 'state' => 'queue_full_or_busy' ), false );
		if ( 'before opt-out' === $address_changed ) {
			update_option( Indexnow_Client::SCOPE_OPTION, 'https://previous.example/' );
		}
		$request->set_param( 'enabled', false );
		$status = Indexnow::save( $request );
		$this->assertFalse( $status['enabled'] );
		$this->assertNull( $status['enqueue_error'] );
		$expected = array( 'state' => 'idle' );
		if ( 'accepted' === $receipt_state && 'before opt-out' !== $address_changed ) {
			$expected['accepted'] = $receipt;
		}
		$this->assertSame( $expected, $status['latest'] );
		$home = get_option( 'home' );
		if ( 'after opt-out' === $address_changed ) {
			update_option( 'home', 'https://new.example' );
			$expected = array( 'state' => 'idle' );
		}
		$request->set_param( 'enabled', true );
		try {
			$this->assertSame( $expected, Indexnow::save( $request )['latest'] );
		} finally {
			update_option( 'home', $home );
		}
	}

	public static function historical_receipts() {
		return array(
			'dated accepted batch'           => array( 'accepted', false ),
			'pending verification'           => array( 'verification_pending', false ),
			'previous site address'          => array( 'accepted', 'before opt-out' ),
			'address changes while disabled' => array( 'accepted', 'after opt-out' ),
		);
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

	public function test_request_transport_does_not_reset_consent_or_pending_work() {
		$home  = get_option( 'home' );
		$https = $_SERVER['HTTPS'] ?? null;
		try {
			update_option( 'home', 'http://example.com/blog' );
			$_SERVER['HTTPS'] = 'on';
			$request          = new WP_REST_Request( 'POST' );
			$request->set_param( 'enabled', true );
			$this->assertTrue( Indexnow::save( $request )['operational'] );
			$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/blog/removed/', 42, true ) );
			$_SERVER['HTTPS'] = 'off';
			$this->assertTrue( Indexnow::status()['operational'] );
			$this->assertTrue( Indexnow::save( $request )['operational'] );
			$this->assertSame( 1, Indexnow_Queue::size() );
			$this->assertSame( 'http://example.com/blog/', get_option( Indexnow_Client::SCOPE_OPTION ) );
		} finally {
			update_option( 'home', $home );
			if ( null === $https ) {
				unset( $_SERVER['HTTPS'] );
			} else {
				$_SERVER['HTTPS'] = $https;
			}
		}
	}

	public function test_status_uses_server_time_and_a_grace_period_for_scheduled_delivery() {
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'enabled', true );
		Indexnow::save( $request );
		$this->assertTrue( Indexnow_Queue::enqueue( home_url( '/pending' ), 42, true ) );
		wp_clear_scheduled_hook( Indexnow_Queue::HOOK );
		wp_clear_scheduled_hook( Indexnow_Queue::RECOVERY_HOOK );
		wp_schedule_single_event( time() - 600, Indexnow_Queue::HOOK );
		update_option( Indexnow_Queue::COOLDOWN_OPTION, time() + 1200, false );
		$status = Indexnow::status();
		$this->assertFalse( $status['scheduling_delayed'] );
		$this->assertTrue( $status['cooldown_active'] );
		$this->assertArrayNotHasKey( 'key_location', $status );
		wp_clear_scheduled_hook( Indexnow_Queue::HOOK );
		wp_schedule_single_event( time() - 2 * HOUR_IN_SECONDS, Indexnow_Queue::HOOK );
		$this->assertTrue( Indexnow::status()['scheduling_delayed'] );
	}

	public function test_settings_opt_out_rotates_the_queue_only_once_when_the_write_hook_is_loaded() {
		$hooks     = $GLOBALS['wp_filter'];
		$rotations = 0;
		$count     = static function () use ( &$rotations ) {
			++$rotations;
		};
		Indexnow_Queue::init();
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'enabled', true );
		Indexnow::save( $request );
		$this->assertTrue( Indexnow_Queue::enqueue( home_url( '/pending' ), 42, true ) );
		add_action( 'update_option_' . Indexnow_Queue::GENERATION_OPTION, $count );
		try {
			$request->set_param( 'enabled', false );
			Indexnow::save( $request );
			$this->assertSame( 1, $rotations );
			$this->assertSame( 0, Indexnow_Queue::size() );
		} finally {
			$GLOBALS['wp_filter'] = $hooks; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}
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

	/** @dataProvider notification_hosts */
	#[DataProvider( 'notification_hosts' )]
	public function test_notification_ui_matches_endpoint_availability( $vip ) {
		$original                  = $GLOBALS['wp_rest_server'];
		$GLOBALS['wp_rest_server'] = new \WP_REST_Server(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		\Automattic\Jetpack\Constants::set_constant( 'WPCOM_IS_VIP_ENV', $vip );
		try {
			Indexnow::register_routes();
			$data = Admin_Page::inject_script_data( array() );
			$this->assertSame( ! $vip, $data[ Initializer::SCRIPT_DATA_KEY ]['indexnow_available'] );
			$this->assertSame( ! $vip, isset( rest_get_server()->get_routes()['/jetpack/v4/seo/indexnow'] ) );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'WPCOM_IS_VIP_ENV' );
			$GLOBALS['wp_rest_server'] = $original; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}
	}

	public static function notification_hosts() {
		return array(
			'VIP'     => array( true ),
			'non-VIP' => array( false ),
		);
	}
}
