<?php
/**
 * Tests for where the Ads settings live.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Monetize\Dashboard;
use Automattic\Jetpack\My_Jetpack\Initializer;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Jetpack_Ads_Settings_Home
 */
#[CoversClass( Jetpack_Ads_Settings_Home::class )]
class Jetpack_Ads_Settings_Home_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const ATOMIC = array(
		'ATOMIC_SITE_ID'       => 1,
		'ATOMIC_CLIENT_ID'     => 2,
		'WPCOMSH__PLUGIN_FILE' => 'wpcomsh.php',
	);

	/**
	 * Active modules before the test.
	 *
	 * @var mixed
	 */
	private $active_modules;

	/**
	 * Start from a clean host cache as an admin.
	 */
	public function set_up() {
		parent::set_up();
		Cache::clear();
		$this->active_modules = Jetpack_Options::get_option( 'active_modules' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	/**
	 * Undo arrange().
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Initializer::SETTINGS_CONSOLIDATION_FLAG );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Dashboard::FEATURE_FLAG );
		remove_filter( 'jetpack_my_jetpack_modules_management_available', '__return_false' );
		remove_filter( 'jetpack_offline_mode', '__return_true' );
		Jetpack_Options::update_option( 'active_modules', $this->active_modules );
		unset( $_GET['page'] );
		Constants::clear_constants();
		Cache::clear();
		parent::tear_down();
	}

	/**
	 * Sites by what is on, and which Ads home each should get.
	 *
	 * @return array[]
	 */
	public static function provide_sites() {
		$all_on = array(
			'consolidation' => true,
			'monetize'      => true,
			'active'        => true,
		);

		return array(
			'self-hosted, all on'                    => array( $all_on, 'monetize' ),
			'self-hosted, all on, REST request'      => array( $all_on + array( 'rest' => true ), 'monetize' ),
			'consolidation off'                      => array( array( 'consolidation' => false ) + $all_on, null ),
			'Monetize flag off, module still in the active list' => array( array( 'monetize' => false ) + $all_on, null ),
			'monetize module inactive'               => array( array( 'active' => false ) + $all_on, null ),
			'offline mode, all on'                   => array( $all_on + array( 'offline' => true ), null ),
			'Atomic, consolidation on, Monetize off' => array(
				array(
					'consolidation' => true,
					'monetize'      => false,
					'active'        => false,
					'atomic'        => true,
				),
				'calypso',
			),
			'Atomic, host hides My Jetpack'          => array(
				$all_on + array(
					'atomic' => true,
					'hidden' => true,
				),
				null,
			),
		);
	}

	/**
	 * @dataProvider provide_sites
	 *
	 * @param array       $site What is on.
	 * @param string|null $home Expected home: 'monetize', 'calypso', or null.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_get_url_names_the_ads_home( $site, $home ) {
		$this->arrange( $site );

		$this->assertSame( self::expected_url( $home ), Jetpack_Ads_Settings_Home::get_url() );
	}

	/**
	 * Every configure_url reader, My Jetpack › Features included, follows the move.
	 */
	public function test_configure_url_follows_the_ads_home() {
		$this->arrange(
			array(
				'consolidation' => true,
				'monetize'      => true,
				'active'        => true,
			)
		);
		$this->assertSame( self::expected_url( 'monetize' ), Jetpack::module_configuration_url( 'wordads' ) );

		remove_all_filters( 'jetpack_feature_flag_enabled_' . Initializer::SETTINGS_CONSOLIDATION_FLAG );
		$this->assertStringEndsWith( 'page=jetpack-settings#/settings?term=wordads', Jetpack::module_configuration_url( 'wordads' ) );
	}

	/**
	 * The tab's payload is printed on the Monetize page only; the home's URL everywhere.
	 */
	public function test_dashboard_payload_only_on_the_monetize_page() {
		$this->arrange(
			array(
				'consolidation' => true,
				'monetize'      => true,
				'active'        => true,
			)
		);

		$data = Jetpack_Ads_Settings_Home::add_script_data( array() );
		$this->assertSame( self::expected_url( 'monetize' ), $data['monetize']['adsSettingsUrl'] );
		$this->assertArrayNotHasKey( 'adsSettings', $data['monetize'] );

		$_GET['page'] = 'jetpack-monetize';
		$payload      = Jetpack_Ads_Settings_Home::add_script_data( array() )['monetize']['adsSettings'];
		$this->assertSame( array( 'hasWordAds', 'hasConnectedOwner', 'upgradeUrl', 'earningsUrl', 'isSubdirectorySite' ), array_keys( $payload ) );
		$this->assertStringContainsString( 'source=calypso-stats-ads-day', $payload['earningsUrl'] );
		$this->assertStringContainsString( 'source=jetpack-creator-cta', $payload['upgradeUrl'] );
	}

	/**
	 * Turn on what a provide_sites() row names.
	 *
	 * @param array $site What is on.
	 */
	private function arrange( array $site ) {
		if ( ! empty( $site['consolidation'] ) ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Initializer::SETTINGS_CONSOLIDATION_FLAG, '__return_true' );
		}
		if ( ! empty( $site['monetize'] ) ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Dashboard::FEATURE_FLAG, '__return_true' );
		}
		if ( ! empty( $site['active'] ) ) {
			Jetpack_Options::update_option( 'active_modules', array( 'monetize', 'wordads' ) );
		}
		if ( ! empty( $site['atomic'] ) ) {
			foreach ( self::ATOMIC as $name => $value ) {
				Constants::set_constant( $name, $value );
			}
		}
		if ( ! empty( $site['hidden'] ) ) {
			add_filter( 'jetpack_my_jetpack_modules_management_available', '__return_false' );
		}
		if ( ! empty( $site['rest'] ) ) {
			Constants::set_constant( 'REST_REQUEST', true );
		}
		if ( ! empty( $site['offline'] ) ) {
			add_filter( 'jetpack_offline_mode', '__return_true' );
		}
	}

	/**
	 * The URL a home resolves to on this test site.
	 *
	 * @param string|null $home 'monetize', 'calypso', or null.
	 * @return string|null
	 */
	private static function expected_url( $home ) {
		if ( 'monetize' === $home ) {
			return admin_url( 'admin.php?page=jetpack-monetize&p=%2F%3Ftab%3Dsettings' );
		}
		if ( 'calypso' === $home ) {
			return 'https://wordpress.com/earn/ads-settings/' . ( new Status() )->get_site_suffix();
		}
		return null;
	}
}
