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

	const WPCOM_SETTINGS = array(
		'paypal'            => 'owner@example.com',
		'tos'               => 'signed',
		'show_to_logged_in' => 'no',
		'optimized_ads'     => true,
		'display_options'   => array(
			'display_post' => false,
			'sidebar'      => true,
		),
	);

	/**
	 * Requests sent to WordPress.com: method and decoded body.
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

	public function test_sync_sends_the_site_values_and_keeps_what_only_wpcom_has() {
		update_option( 'wordads_display_page', '' );
		$this->arrange_wpcom( self::WPCOM_SETTINGS );

		$this->assertTrue( Ads_Wpcom_Settings::sync() );

		$this->assertSame( array( 'GET', 'POST' ), array_column( $this->sent, 'method' ) );
		$this->assertSame(
			array(
				'paypal'                  => 'owner@example.com',
				'tos'                     => 'signed',
				'show_to_logged_in'       => 'no',
				'optimized_ads'           => true,
				'display_options'         => array(
					// Unset site options send their defaults, and the site wins over WordPress.com's display_post.
					'display_front_page' => true,
					'display_post'       => true,
					'display_page'       => false,
					'display_archive'    => true,
					'enable_header_ad'   => true,
					'second_belowpost'   => true,
					'inline_enabled'     => true,
					'sidebar'            => true,
				),
				'ccpa_enabled'            => false,
				'ccpa_privacy_policy_url' => '',
			),
			$this->sent[1]['body']
		);
		$this->assertFalse( Ads_Wpcom_Settings::is_out_of_date() );
	}

	public function test_sync_waits_for_a_paypal_address() {
		$this->arrange_wpcom( array( 'paypal' => '' ) + self::WPCOM_SETTINGS );

		$this->assertFalse( Ads_Wpcom_Settings::sync() );

		$this->assertSame( array( 'GET' ), array_column( $this->sent, 'method' ) );
		$this->assertTrue( Ads_Wpcom_Settings::is_out_of_date() );
	}

	public function test_sync_sends_nothing_until_a_site_value_changes() {
		$this->arrange_wpcom( self::WPCOM_SETTINGS );
		Ads_Wpcom_Settings::sync();
		$this->sent = array();

		$this->assertTrue( Ads_Wpcom_Settings::sync() );
		$this->assertCount( 0, $this->sent );

		update_option( 'wordads_inline_enabled', '' );
		$this->assertTrue( Ads_Wpcom_Settings::is_out_of_date() );
	}

	public function test_save_payout_signs_the_terms_and_sends_the_site_values() {
		$this->arrange_wpcom(
			array(
				'paypal' => '',
				'tos'    => '',
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
		$sent = (array) $this->sent[1]['body'];
		$this->assertSame( 'new@example.com', $sent['paypal'] );
		$this->assertSame( 'signed', $sent['tos'] );
		$this->assertArrayHasKey( 'display_options', $sent );
		$this->assertFalse( Ads_Wpcom_Settings::is_out_of_date() );
	}

	public function test_save_payout_returns_the_wpcom_error_code() {
		$this->arrange_wpcom(
			self::WPCOM_SETTINGS,
			array(
				'error'   => 'invalid_tos',
				'message' => 'Please accept the terms.',
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
	 * Answer WordPress.com's GET with settings and its POST with a body, recording what was sent.
	 *
	 * @param array $settings    Stored WordPress.com settings.
	 * @param array $post_body   POST response body.
	 * @param int   $post_status POST response status.
	 */
	private function arrange_wpcom( array $settings, array $post_body = array( 'updated' => true ), $post_status = 200 ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args ) use ( $settings, $post_body, $post_status ) {
				$this->sent[] = array(
					'method' => $args['method'],
					'body'   => isset( $args['body'] ) ? json_decode( $args['body'], true ) : null,
				);
				$is_post      = 'POST' === $args['method'];
				return array(
					'headers'  => array(),
					'response' => array( 'code' => $is_post ? $post_status : 200 ),
					'body'     => wp_json_encode( $is_post ? $post_body : array( 'settings' => $settings ), JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			2
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
