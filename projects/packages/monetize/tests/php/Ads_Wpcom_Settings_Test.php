<?php
/**
 * Tests for the WordPress.com copy of the site's Ads settings.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize;

use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Monetize\Sections\Ads;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Monetize\Ads_Wpcom_Settings
 * @covers \Automattic\Jetpack\Monetize\Sections\Ads
 */
#[CoversClass( Ads_Wpcom_Settings::class )]
#[CoversClass( Ads::class )]
class Ads_Wpcom_Settings_Test extends BaseTestCase {

	const BLOG_ID = 999;

	const SITE_VALUES = array(
		'display_options'         => array(
			'display_front_page' => true,
			'display_post'       => true,
			'display_page'       => false,
			'display_archive'    => true,
			'enable_header_ad'   => true,
			'second_belowpost'   => true,
			'inline_enabled'     => true,
		),
		'ccpa_enabled'            => false,
		'ccpa_privacy_policy_url' => '',
	);

	/**
	 * Requests sent to WordPress.com: method, path and decoded body.
	 *
	 * @var array[]
	 */
	private $sent = array();

	/**
	 * Connected site, with an admin whose account is connected.
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'jetpack_options', array( $this, 'mock_connection_options' ), 10, 2 );
		Connection_Utils::init_default_constants();
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'monetize-admin-' . wp_rand(),
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);
		update_option( 'wordads_display_page', '' );
	}

	/**
	 * Undo set_up().
	 */
	public function tear_down() {
		remove_filter( 'jetpack_options', array( $this, 'mock_connection_options' ) );
		Constants::clear_constants();
		wp_set_current_user( 0 );
		$this->sent = array();
		parent::tear_down();
	}

	public function test_sync_sends_the_site_values_with_defaults_and_no_payout_fields() {
		$this->arrange_wpcom( array( 'paypal' => '' ) );

		$this->assertTrue( Ads_Wpcom_Settings::sync() );

		$this->assertCount( 1, $this->sent );
		$this->assertSame( 'POST', $this->sent[0]['method'] );
		$this->assertStringEndsWith( '/wpcom/v2/sites/999/wordads/settings', $this->sent[0]['path'] );
		$this->assertSame( self::SITE_VALUES, $this->sent[0]['body'] );
		$this->assertFalse( Ads_Wpcom_Settings::is_out_of_date() );
	}

	public function test_sync_sends_nothing_until_a_site_value_changes() {
		$this->arrange_wpcom( array() );
		Ads_Wpcom_Settings::sync();
		$this->sent = array();

		$this->assertTrue( Ads_Wpcom_Settings::sync() );
		$this->assertCount( 0, $this->sent );

		update_option( 'wordads_inline_enabled', '' );
		$this->assertTrue( Ads_Wpcom_Settings::is_out_of_date() );
	}

	public function test_save_payout_sends_the_payout_with_the_site_values() {
		$this->arrange_wpcom(
			array(
				'paypal' => 'new@example.com',
				'tos'    => 'signed',
			)
		);

		$payout = Ads_Wpcom_Settings::save_payout( 'new@example.com', true );

		$this->assertSame(
			array(
				'paypal'    => 'new@example.com',
				'tosSigned' => true,
			),
			$payout
		);
		$this->assertSame(
			self::SITE_VALUES + array(
				'paypal' => 'new@example.com',
				'tos'    => 'signed',
			),
			$this->sent[0]['body']
		);
		$this->assertFalse( Ads_Wpcom_Settings::is_out_of_date() );
	}

	public function test_a_refused_update_returns_the_wpcom_error_and_stays_out_of_date() {
		$this->arrange_wpcom(
			array(
				'code'    => 'invalid_tos',
				'message' => 'You must agree to the Terms of Service.',
				'data'    => array( 'status' => 400 ),
			),
			400
		);

		$result = Ads_Wpcom_Settings::save_payout( 'new@example.com', false );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_tos', $result->get_error_code() );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertTrue( Ads_Wpcom_Settings::is_out_of_date() );
	}

	/**
	 * Users who must not reach WordPress.com, and the error each gets.
	 *
	 * @return array[]
	 */
	public static function provide_refused_users() {
		return array(
			'not an admin'          => array( 'editor', true, 'rest_forbidden' ),
			'no WordPress.com user' => array( 'administrator', false, 'rest_unauthorized' ),
		);
	}

	/**
	 * @dataProvider provide_refused_users
	 *
	 * @param string $role      The current user's role.
	 * @param bool   $connected Whether the user has a WordPress.com token.
	 * @param string $code      The expected error code.
	 */
	#[DataProvider( 'provide_refused_users' )]
	public function test_routes_need_an_admin_connected_to_wpcom( $role, $connected, $code ) {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'monetize-' . $role . '-' . wp_rand(),
					'user_pass'  => 'password',
					'role'       => $role,
				)
			)
		);
		if ( ! $connected ) {
			add_filter( 'jetpack_options', array( $this, 'drop_user_tokens' ), 20, 2 );
		}

		$result = Ads::can_write_to_wpcom();
		remove_filter( 'jetpack_options', array( $this, 'drop_user_tokens' ), 20 );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( $code, $result->get_error_code() );
	}

	/**
	 * Answer every WordPress.com request with settings, or an error body, recording what was sent.
	 *
	 * @param array $body   Settings, or the error body when `$status` is an error.
	 * @param int   $status Response status.
	 */
	private function arrange_wpcom( array $body, $status = 200 ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $body, $status ) {
				$this->sent[] = array(
					'method' => $args['method'],
					'path'   => (string) wp_parse_url( (string) $url, PHP_URL_PATH ),
					'body'   => isset( $args['body'] ) ? json_decode( $args['body'], true ) : null,
				);
				return array(
					'headers'  => array(),
					'response' => array( 'code' => $status ),
					'body'     => wp_json_encode( $status >= 400 ? $body : array( 'settings' => $body ), JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * Connection options for a connected site whose current user is connected.
	 *
	 * @param mixed  $value Option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function mock_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'test.blogtoken';
			case 'id':
				return (string) self::BLOG_ID;
			case 'user_tokens':
				$user_id = get_current_user_id();
				return $user_id ? array( $user_id => sprintf( 'token%d.secret%d.%d', $user_id, $user_id, $user_id ) ) : $value;
		}
		return $value;
	}

	/**
	 * Leave the current user without a WordPress.com token.
	 *
	 * @param mixed  $value Option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function drop_user_tokens( $value, $name ) {
		return 'user_tokens' === $name ? array() : $value;
	}
}
