<?php
/**
 * Unit tests for Response_Export_Link.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Tests for the short-lived links that download a response export.
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Response_Export_Link
 */
#[CoversClass( Response_Export_Link::class )]
class Response_Export_Link_Test extends BaseTestCase {

	/**
	 * An administrator, who can export.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * A second administrator.
	 *
	 * @var int
	 */
	private $other_admin_id;

	/**
	 * Set up users.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->admin_id       = wp_insert_user(
			array(
				'user_login' => 'export_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		$this->other_admin_id = wp_insert_user(
			array(
				'user_login' => 'other_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
	}

	/**
	 * Returns the token query arg of a download URL.
	 *
	 * @param string $url Download URL.
	 * @return string
	 */
	private static function get_token( $url ) {
		$query = array();
		wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );
		return (string) ( $query['token'] ?? '' );
	}

	public function test_create_returns_admin_post_url_that_expires_in_fifteen_minutes() {
		$before = time();
		$link   = Response_Export_Link::create( array( 'form' => 12 ), false, $this->admin_id );

		$this->assertStringStartsWith( admin_url( 'admin-post.php' ), $link['url'] );
		$this->assertStringContainsString( 'action=' . Response_Export_Link::ACTION, $link['url'] );
		$this->assertMatchesRegularExpression( '/^[A-Za-z0-9]{32}$/', self::get_token( $link['url'] ) );
		$this->assertGreaterThanOrEqual( $before + 15 * MINUTE_IN_SECONDS, $link['expires_at'] );
		$this->assertLessThanOrEqual( time() + 15 * MINUTE_IN_SECONDS, $link['expires_at'] );
	}

	public function test_resolve_returns_the_export_for_the_user_who_asked() {
		$filters = array(
			'form'   => 12,
			'status' => 'spam',
			'after'  => '2026-10-01T00:00:00',
		);
		$link    = Response_Export_Link::create( $filters, true, $this->admin_id );

		$export = Response_Export_Link::resolve( self::get_token( $link['url'] ), $this->admin_id );

		$this->assertSame(
			array(
				'filters'                => $filters,
				'include_test_responses' => true,
			),
			$export
		);
	}

	public function test_resolve_refuses_another_user() {
		$link = Response_Export_Link::create( array(), false, $this->admin_id );

		$export = Response_Export_Link::resolve( self::get_token( $link['url'] ), $this->other_admin_id );

		$this->assertInstanceOf( WP_Error::class, $export );
		$this->assertSame( 'jetpack_forms_export_link_invalid', $export->get_error_code() );
	}

	public function test_resolve_refuses_a_user_who_can_no_longer_export() {
		$link = Response_Export_Link::create( array(), false, $this->admin_id );
		( new \WP_User( $this->admin_id ) )->set_role( 'editor' );

		$export = Response_Export_Link::resolve( self::get_token( $link['url'] ), $this->admin_id );

		$this->assertInstanceOf( WP_Error::class, $export );
		$this->assertSame( 'jetpack_forms_export_link_invalid', $export->get_error_code() );
	}

	/**
	 * @dataProvider provide_bad_tokens
	 *
	 * @param mixed $token Token from the request.
	 */
	#[DataProvider( 'provide_bad_tokens' )]
	public function test_resolve_refuses_an_unknown_or_malformed_token( $token ) {
		Response_Export_Link::create( array(), false, $this->admin_id );

		$export = Response_Export_Link::resolve( $token, $this->admin_id );

		$this->assertInstanceOf( WP_Error::class, $export );
		$this->assertSame( 'jetpack_forms_export_link_invalid', $export->get_error_code() );
	}

	/**
	 * Tokens that match no link.
	 */
	public static function provide_bad_tokens() {
		return array(
			'empty'        => array( '' ),
			'wrong format' => array( 'not-a-token' ),
			'unknown'      => array( str_repeat( 'a', 32 ) ),
			'too long'     => array( str_repeat( 'a', 200 ) ),
			'not a string' => array( array( 'token' ) ),
			'null'         => array( null ),
		);
	}

	public function test_resolve_says_a_link_expired_after_fifteen_minutes() {
		$link = Response_Export_Link::create( array(), false, $this->admin_id );
		$key  = Response_Export_Link::TRANSIENT_PREFIX . hash( 'sha256', self::get_token( $link['url'] ) );
		$this->assertGreaterThan( $link['expires_at'], (int) get_option( '_transient_timeout_' . $key ), 'The record must outlive the link, or an expired link reads as invalid.' );

		set_transient( $key, array_merge( get_transient( $key ), array( 'expires_at' => time() - 1 ) ), HOUR_IN_SECONDS );
		$export = Response_Export_Link::resolve( self::get_token( $link['url'] ), $this->admin_id );

		$this->assertInstanceOf( WP_Error::class, $export );
		$this->assertSame( 'jetpack_forms_export_link_expired', $export->get_error_code() );
	}

	/**
	 * Runs isolated because it sends headers, which older PHPUnit refuses after printing output.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider provide_refused_downloads
	 *
	 * @param bool   $real_token Whether the request carries the link's own token.
	 * @param string $opener     Who opens the link: owner, other or demoted.
	 * @param int    $status     Expected HTTP status.
	 */
	#[DataProvider( 'provide_refused_downloads' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_handle_download_refuses_without_sending_the_file( $real_token, $opener, $status ) {
		$link          = Response_Export_Link::create( array(), false, $this->admin_id );
		$_GET['token'] = $real_token ? self::get_token( $link['url'] ) : str_repeat( 'a', 32 );
		wp_set_current_user( 'other' === $opener ? $this->other_admin_id : $this->admin_id );
		if ( 'demoted' === $opener ) {
			( new \WP_User( $this->admin_id ) )->set_role( 'editor' );
		}
		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) {
				return Feedback::POST_TYPE === $query->get( 'post_type' ) ? array() : $posts;
			},
			10,
			2
		);
		add_filter(
			'wp_die_ajax_handler',
			static function () {
				/** @return never */
				return static function ( $message, $title, $args ) {
					throw new \RuntimeException( (string) $args['response'] );
				};
			}
		);

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( (string) $status );
		$this->expectOutputString( '' );
		try {
			Response_Export_Link::handle_download();
		} finally {
			unset( $_GET['token'] );
		}
	}

	/**
	 * Runs isolated because it sends headers.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_redirect_to_login_returns_to_the_link_even_when_login_is_on_another_host() {
		$link                   = Response_Export_Link::create( array(), false, $this->admin_id );
		$_SERVER['HTTP_HOST']   = (string) wp_parse_url( $link['url'], PHP_URL_HOST );
		$_SERVER['REQUEST_URI'] = (string) wp_parse_url( $link['url'], PHP_URL_PATH ) . '?' . wp_parse_url( $link['url'], PHP_URL_QUERY );
		add_filter(
			'login_url',
			static function ( $login_url, $redirect ) {
				return add_query_arg( 'redirect_to', rawurlencode( $redirect ), 'https://sso.example.org/login' );
			},
			10,
			2
		);
		add_filter(
			'wp_redirect',
			/** @return never */
			static function ( $location ) {
				throw new \RuntimeException( $location );
			}
		);

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'https://sso.example.org/login?redirect_to=' . rawurlencode( set_url_scheme( $link['url'] ) ) );
		Response_Export_Link::redirect_to_login();
	}

	/**
	 * Requests the download handler must refuse, with the status it sends.
	 */
	public static function provide_refused_downloads() {
		return array(
			'unknown token'        => array( false, 'owner', 403 ),
			'another user'         => array( true, 'other', 403 ),
			'user who lost export' => array( true, 'demoted', 403 ),
			'nothing matches now'  => array( true, 'owner', 404 ),
		);
	}
}
