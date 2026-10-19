<?php
/**
 * Tests for the server-side WP Consent API consent type.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent
 */
#[CoversClass( Cookie_Consent::class )]
class Server_Consent_Type_Test extends TestCase {

	public function tearDown(): void {
		remove_all_filters( 'wp_get_consent_type' );
		Cookie_Consent::deactivate();
		$this->reset_cookie_consent_config();
		parent::tearDown();
	}

	public function test_geo_off_declares_optin_on_the_server() {
		Cookie_Consent::init( array( 'features' => array( 'geo' => false ) ) );

		$this->assertSame( 20, has_filter( 'wp_get_consent_type', array( Cookie_Consent::class, 'declare_optin_consent_type' ) ) );
		$this->assertSame( 'optin', apply_filters( 'wp_get_consent_type', false ) );
	}

	public function test_footer_links_only_with_geo_off_declares_optin() {
		Cookie_Consent::init(
			array(
				'features' => array(
					'banner'       => false,
					'footer_links' => true,
					'geo'          => false,
				),
			)
		);

		$this->assertSame( 'optin', apply_filters( 'wp_get_consent_type', false ) );
	}

	public function test_type_declared_by_another_tool_is_kept() {
		add_filter(
			'wp_get_consent_type',
			static function () {
				return 'optout';
			}
		);
		Cookie_Consent::init( array( 'features' => array( 'geo' => false ) ) );

		$this->assertSame( 'optout', apply_filters( 'wp_get_consent_type', false ) );
	}

	public function test_geo_on_leaves_the_server_type_alone() {
		Cookie_Consent::init( array( 'features' => array( 'geo' => true ) ) );

		$this->assertFalse( has_filter( 'wp_get_consent_type', array( Cookie_Consent::class, 'declare_optin_consent_type' ) ) );
		$this->assertFalse( apply_filters( 'wp_get_consent_type', false ) );
	}

	public function test_no_banner_flow_leaves_the_server_type_alone() {
		// A ccpa_page-only setup assumes another CMP owns the consent defaults.
		Cookie_Consent::init(
			array(
				'features' => array(
					'banner'       => false,
					'footer_links' => false,
					'ccpa_page'    => true,
					'geo'          => false,
				),
			)
		);

		$this->assertFalse( has_filter( 'wp_get_consent_type', array( Cookie_Consent::class, 'declare_optin_consent_type' ) ) );
	}

	public function test_disabled_init_leaves_the_server_type_alone() {
		Cookie_Consent::init(
			array(
				'enabled'  => false,
				'features' => array( 'geo' => false ),
			)
		);

		$this->assertFalse( has_filter( 'wp_get_consent_type', array( Cookie_Consent::class, 'declare_optin_consent_type' ) ) );
	}

	public function test_deactivate_removes_the_filter() {
		Cookie_Consent::init( array( 'features' => array( 'geo' => false ) ) );
		Cookie_Consent::deactivate();

		$this->assertFalse( has_filter( 'wp_get_consent_type', array( Cookie_Consent::class, 'declare_optin_consent_type' ) ) );
	}

	/**
	 * @dataProvider provide_declared_types
	 *
	 * @param mixed  $declared Type declared before the package's callback.
	 * @param string $expected Type the callback returns.
	 */
	#[DataProvider( 'provide_declared_types' )]
	public function test_declare_optin_consent_type( $declared, $expected ) {
		$this->assertSame( $expected, Cookie_Consent::declare_optin_consent_type( $declared ) );
	}

	/**
	 * Data provider for test_declare_optin_consent_type.
	 *
	 * @return array
	 */
	public static function provide_declared_types() {
		return array(
			'nothing declared' => array( false, 'optin' ),
			'empty string'     => array( '', 'optin' ),
			'null'             => array( null, 'optin' ),
			'optout kept'      => array( 'optout', 'optout' ),
			'optin kept'       => array( 'optin', 'optin' ),
		);
	}
}
