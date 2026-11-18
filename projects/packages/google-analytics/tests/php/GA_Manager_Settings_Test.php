<?php
/**
 * Tests for GA_Manager's shared save path.
 *
 * @package automattic/jetpack-google-analytics
 */

use Automattic\Jetpack\Google_Analytics\GA_Manager;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/stubs/class-wpcom-json-api-site-settings-endpoint.php';

/**
 * Tests GA_Manager's settings saves.
 *
 * @covers \Automattic\Jetpack\Google_Analytics\GA_Manager::update_google_analytics_settings
 * @covers \Automattic\Jetpack\Google_Analytics\GA_Manager::site_settings_update
 */
#[CoversMethod( GA_Manager::class, 'update_google_analytics_settings' )]
#[CoversMethod( GA_Manager::class, 'site_settings_update' )]
class GA_Manager_Settings_Test extends BaseTestCase {

	/**
	 * Codes, and what each one stores (null when it is refused).
	 *
	 * @return array
	 */
	public static function provide_codes() {
		return array(
			'empty'                 => array( '', '' ),
			'GA4'                   => array( 'G-ABC123', 'G-ABC123' ),
			'Universal Analytics'   => array( 'UA-123-4', 'UA-123-4' ),
			'padded'                => array( ' G-ABC123 ', 'G-ABC123' ),
			'trailing text'         => array( 'G-ABC123 extra', null ),
			'leading text'          => array( 'extra G-ABC123', null ),
			'UA with trailing text' => array( 'UA-123-4 extra', null ),
			'not a string'          => array( array( 'G-ABC123' ), null ),
		);
	}

	/**
	 * The whole code must be empty or a Measurement ID, and a refused one leaves the stored code alone.
	 *
	 * @param mixed       $code     The code to save.
	 * @param string|null $expected The stored code, or null when the save is refused.
	 * @dataProvider provide_codes
	 */
	#[DataProvider( 'provide_codes' )]
	public function test_saves_only_valid_codes( $code, $expected ) {
		// With `is_active` stored, GA_Manager never asks the Jetpack module, which needs Jetpack_Options.
		update_option(
			'wga',
			array(
				'code'      => 'G-OLD',
				'is_active' => true,
			)
		);

		$result = GA_Manager::get_instance()->update_google_analytics_settings( array( 'code' => $code ) );

		if ( null === $expected ) {
			$this->assertInstanceOf( WP_Error::class, $result );
			$this->assertSame( 'invalid_code', $result->get_error_code() );
			$this->assertSame( 'G-OLD', get_option( 'wga' )['code'] );
		} else {
			$this->assertSame( $expected, get_option( 'wga' )['code'] );
		}
	}

	public function test_keeps_stored_keys_and_saves_only_the_listed_booleans() {
		update_option(
			'wga',
			array(
				'code'               => 'G-OLD',
				'is_active'          => true,
				'ec_track_purchases' => true,
			)
		);

		$result = GA_Manager::get_instance()->update_google_analytics_settings(
			array(
				'anonymize_ip'       => '1',
				'ec_track_purchases' => false,
				'unlisted'           => 'x',
			),
			array( 'anonymize_ip' )
		);

		$expected = array(
			'code'               => 'G-OLD',
			'is_active'          => true,
			'ec_track_purchases' => true,
			'anonymize_ip'       => true,
		);
		$this->assertSame( $expected, $result );
		$this->assertSame( $expected, get_option( 'wga' ) );
	}

	public function test_a_stored_code_the_old_check_accepted_does_not_block_other_settings() {
		update_option(
			'wga',
			array(
				'code'      => 'UA-1-2-3',
				'is_active' => true,
			)
		);

		$result = GA_Manager::get_instance()->update_google_analytics_settings(
			array(
				'code'         => 'UA-1-2-3',
				'anonymize_ip' => true,
			),
			array( 'anonymize_ip' )
		);

		$this->assertTrue( get_option( 'wga' )['anonymize_ip'] );
		$this->assertSame( 'UA-1-2-3', $result['code'] );
	}

	/**
	 * Site settings API versions, and what each one saves (null when the request is refused).
	 *
	 * @return array
	 */
	public static function provide_api_versions() {
		$value = array(
			'code'         => 'G-NEW',
			'is_active'    => false,
			'anonymize_ip' => true,
		);

		return array(
			'1.1 saves only the code' => array(
				'1.1',
				$value,
				array(
					'code'      => 'G-NEW',
					'is_active' => true,
				),
			),
			'1.3 adds its booleans'   => array(
				'1.3',
				$value,
				array(
					'code'         => 'G-NEW',
					'is_active'    => true,
					'anonymize_ip' => true,
				),
			),
			'1.4 adds is_active'      => array(
				'1.4',
				$value,
				array(
					'code'         => 'G-NEW',
					'is_active'    => false,
					'anonymize_ip' => true,
				),
			),
			'no code'                 => array( '1.4', array( 'anonymize_ip' => true ), null ),
		);
	}

	/**
	 * The endpoint needs a code and saves only the booleans its API version knows.
	 *
	 * @phan-suppress PhanUndeclaredClassMethod, PhanUndeclaredClassProperty -- The endpoint is a test stub, hidden from Phan.
	 *
	 * @param string     $version  The endpoint's API version.
	 * @param array      $value    The settings sent.
	 * @param array|null $expected The stored settings, or null when the request is refused.
	 * @dataProvider provide_api_versions
	 */
	#[DataProvider( 'provide_api_versions' )]
	public function test_endpoint_saves_the_booleans_of_its_api_version( $version, $value, $expected ) {
		update_option(
			'wga',
			array(
				'code'      => 'G-OLD',
				'is_active' => true,
			)
		);
		$endpoint              = new WPCOM_JSON_API_Site_Settings_Endpoint();
		$endpoint->min_version = $version;

		$result = GA_Manager::get_instance()->site_settings_update( $value, $endpoint );

		if ( null === $expected ) {
			$this->assertInstanceOf( WP_Error::class, $result );
		} else {
			$this->assertSame( $expected, get_option( 'wga' ) );
		}
	}

	public function test_saving_unchanged_settings_is_not_an_error() {
		$stored = array(
			'code'      => 'G-ABC123',
			'is_active' => true,
		);
		update_option( 'wga', $stored );
		$bumps = did_action( 'jetpack_bump_stats_extras' );

		$this->assertSame( $stored, GA_Manager::get_instance()->update_google_analytics_settings( array( 'code' => 'G-ABC123' ) ) );
		$this->assertSame( $bumps, did_action( 'jetpack_bump_stats_extras' ) );
	}
}
