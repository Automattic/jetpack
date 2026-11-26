<?php
/**
 * Unit tests for Response_Export_Link.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
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

	public function test_each_link_gets_its_own_token() {
		$first  = Response_Export_Link::create( array(), false, $this->admin_id );
		$second = Response_Export_Link::create( array(), false, $this->admin_id );

		$this->assertNotSame( self::get_token( $first['url'] ), self::get_token( $second['url'] ) );
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

	public function test_resolve_refuses_a_logged_out_visitor() {
		$link = Response_Export_Link::create( array(), false, $this->admin_id );

		$this->assertInstanceOf( WP_Error::class, Response_Export_Link::resolve( self::get_token( $link['url'] ), 0 ) );
	}

	public function test_resolve_refuses_a_user_who_can_no_longer_export() {
		$link = Response_Export_Link::create( array(), false, $this->admin_id );
		( new \WP_User( $this->admin_id ) )->set_role( 'editor' );

		$export = Response_Export_Link::resolve( self::get_token( $link['url'] ), $this->admin_id );

		$this->assertInstanceOf( WP_Error::class, $export );
		$this->assertSame( 'jetpack_forms_export_link_invalid', $export->get_error_code() );
	}

	public function test_resolve_refuses_an_unknown_or_malformed_token() {
		Response_Export_Link::create( array(), false, $this->admin_id );

		foreach ( array( '', 'not-a-token', str_repeat( 'a', 32 ), str_repeat( 'a', 200 ) ) as $token ) {
			$this->assertInstanceOf( WP_Error::class, Response_Export_Link::resolve( $token, $this->admin_id ), "Token '$token' must be refused." );
		}
	}

	public function test_resolve_refuses_an_expired_link() {
		$link = Response_Export_Link::create( array(), false, $this->admin_id );

		$export = Response_Export_Link::resolve( self::get_token( $link['url'] ), $this->admin_id, $link['expires_at'] + 1 );

		$this->assertInstanceOf( WP_Error::class, $export );
		$this->assertSame( 'jetpack_forms_export_link_expired', $export->get_error_code() );
	}
}
