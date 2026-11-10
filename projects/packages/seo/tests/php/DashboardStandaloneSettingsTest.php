<?php
/**
 * Settings behavior when the host does not load Jetpack's SEO helper.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;
use WP_REST_Request;

/**
 * @covers \Automattic\Jetpack\SEO\Dashboard_Data
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversClass( Dashboard_Data::class )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class DashboardStandaloneSettingsTest extends TestCase {

	/**
	 * Original bootstrap switch, restored when this class finishes.
	 *
	 * @var string|false
	 */
	private static $original_bootstrap_switch;

	/**
	 * Let isolated child processes bootstrap without the host helper stub.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();

		self::$original_bootstrap_switch = getenv( 'JETPACK_SEO_TEST_WITHOUT_PLUGIN_HELPER' );
		putenv( 'JETPACK_SEO_TEST_WITHOUT_PLUGIN_HELPER=1' );
	}

	/**
	 * Keep the bootstrap switch from affecting subsequent test classes.
	 */
	public static function tearDownAfterClass(): void {
		if ( false === self::$original_bootstrap_switch ) {
			putenv( 'JETPACK_SEO_TEST_WITHOUT_PLUGIN_HELPER' );
		} else {
			putenv( 'JETPACK_SEO_TEST_WITHOUT_PLUGIN_HELPER=' . self::$original_bootstrap_switch );
		}

		parent::tearDownAfterClass();
	}

	/**
	 * @dataProvider hosts
	 * @param string $host Hosting environment.
	 */
	#[DataProvider( 'hosts' )]
	public function test_settings_read_and_save_without_the_plugin_helper( $host ) {
		if ( 'simple' === $host ) {
			Constants::set_constant( 'IS_WPCOM', true );
		} elseif ( 'atomic' === $host ) {
			Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
			Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
			Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', true );
		}
		Status_Cache::clear();
		\Wpcom_Test_Features::$known    = array( 'advanced-seo' );
		\Wpcom_Test_Features::$entitled = array();

		$this->assertFalse( class_exists( 'Jetpack_SEO_Utils' ) );

		add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ), 5 );
		$GLOBALS['wp_rest_server'] = null;

		$user_id = wp_insert_user(
			array(
				'user_login' => 'standalone_seo_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		$this->assertIsInt( $user_id );
		wp_set_current_user( $user_id );
		update_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION, 'Legacy description.' );

		$settings = Dashboard_Data::get_settings_data();

		$this->assertTrue( $settings['title_formats_editable'] );
		$this->assertSame( 'Legacy description.', $settings['front_page_description'] );

		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_param( Dashboard_Data::FRONT_PAGE_META_OPTION, 'Modern description.' );
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Modern description.', Dashboard_Data::get_settings_data()['front_page_description'] );
		$this->assertFalse( get_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION ) );
	}

	/**
	 * @return array<string, array{string}>
	 */
	public static function hosts() {
		return array(
			'self-hosted' => array( 'self-hosted' ),
			'Simple'      => array( 'simple' ),
			'Atomic'      => array( 'atomic' ),
		);
	}
}
