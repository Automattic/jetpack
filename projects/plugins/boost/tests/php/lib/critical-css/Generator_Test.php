<?php
/**
 * Tests for the Critical CSS Generator class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Generator;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Class Generator_Test
 */
class Generator_Test extends BaseTestCase {

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		unset( $_GET[ Generator::GENERATE_QUERY_ACTION ] );
		remove_all_filters( 'wp_redirect' );
		remove_all_actions( 'wp_head' );
		remove_all_filters( 'show_admin_bar' );
		parent::tear_down();
	}

	/**
	 * Initialize the generator as it runs on a front-end request.
	 *
	 * @param bool $generating Whether the request is a Critical CSS generation request.
	 */
	private function init_request( $generating ) {
		if ( $generating ) {
			$_GET[ Generator::GENERATE_QUERY_ACTION ] = '1700000000000';
		}
		Generator::init();
	}

	/**
	 * A generation request still redirects to the login page, but without `reauth`.
	 */
	public function test_generation_request_login_redirect_drops_reauth() {
		$this->init_request( true );
		$requested = home_url( '/private-page/?' . Generator::GENERATE_QUERY_ACTION . '=1700000000000' );
		$location  = wp_login_url( $requested, true );

		$redirect = apply_filters( 'wp_redirect', $location, 302 );

		$this->assertSame( wp_login_url( $requested ), $redirect );
		$this->assertStringNotContainsString( 'reauth', $redirect );
	}

	/**
	 * Redirects that do not target the login page are left untouched.
	 *
	 * @dataProvider provide_non_login_redirects
	 *
	 * @param string $location Redirect location.
	 */
	#[DataProvider( 'provide_non_login_redirects' )]
	public function test_generation_request_other_redirects_unchanged( $location ) {
		$this->init_request( true );
		$location = str_replace( '{home}', untrailingslashit( home_url() ), $location );

		$this->assertSame( $location, apply_filters( 'wp_redirect', $location, 302 ) );
	}

	/**
	 * Data provider for test_generation_request_other_redirects_unchanged.
	 *
	 * @return array[]
	 */
	public static function provide_non_login_redirects() {
		return array(
			'trailing slash'        => array( '{home}/sample-page/' ),
			'same-site reauth arg'  => array( '{home}/members/?reauth=1' ),
			'relative reauth arg'   => array( '/members/?reauth=1' ),
			'other host login page' => array( 'https://login.example.org/wp-login.php?reauth=1' ),
			'login page, no reauth' => array( '{home}/wp-login.php?redirect_to=%2Fsample-page%2F' ),
		);
	}

	/**
	 * Ordinary front-end requests keep the login redirect exactly as issued.
	 */
	public function test_non_generation_request_login_redirect_unchanged() {
		$this->init_request( false );
		$location = wp_login_url( home_url( '/private-page/' ), true );

		$this->assertSame( $location, apply_filters( 'wp_redirect', $location, 302 ) );
	}
}
