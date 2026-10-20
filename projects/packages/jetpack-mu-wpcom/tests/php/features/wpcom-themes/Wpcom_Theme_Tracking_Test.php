<?php
/**
 * Tests for the theme tracking origin classifier.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-themes/wpcom-theme-tracking.php';

// Loading the file hooks it globally, which breaks other tests that fire switch_theme with one argument.
remove_action( 'switch_theme', 'wpcom_themes_tracks_switch_theme', 12 );
remove_action( 'upgrader_process_complete', 'wpcom_themes_tracks_install_theme', 10 );

/**
 * Class Wpcom_Theme_Tracking_Test
 */
class Wpcom_Theme_Tracking_Test extends \WorDBless\BaseTestCase {

	/**
	 * Clear the request state each test sets.
	 */
	public function tear_down() {
		Constants::clear_constants();
		$_GET     = array();
		$_POST    = array();
		$_REQUEST = array();
		unset( $_SERVER['HTTP_REFERER'] );
		parent::tear_down();
	}

	/**
	 * The request state maps to one origin.
	 *
	 * @dataProvider provide_origin
	 * @param string   $expected  Expected origin.
	 * @param string[] $constants Constants to define.
	 * @param array    $get       $_GET.
	 * @param array    $post      $_POST.
	 * @param string   $referer   Referer URL.
	 */
	#[DataProvider( 'provide_origin' )]
	public function test_origin( $expected, $constants, $get, $post, $referer ) {
		foreach ( $constants as $name ) {
			Constants::set_constant( $name, true );
		}
		$_GET     = $get;
		$_POST    = $post;
		$_REQUEST = array_merge( $get, $post );
		if ( $referer !== '' ) {
			$_SERVER['HTTP_REFERER'] = $referer;
		}

		$this->assertSame( $expected, wpcom_themes_tracks_get_origin() );
	}

	/**
	 * Data provider for test_origin.
	 *
	 * @return array<string, array>
	 */
	public static function provide_origin() {
		$marker  = array( 'wpcom_themes_origin' => 'marketplace-tab' );
		$install = array( 'action' => 'install-theme' );
		$preview = 'https://example.com/wp-admin/theme-install.php?theme=formwork';
		$tab     = 'https://example.com/wp-admin/theme-install.php?browse=wpcom';

		return array(
			'cli install'                   => array( 'cli', array( 'WP_CLI' ), array(), $install, '' ),
			'cli with marker'               => array( 'cli', array( 'WP_CLI' ), array(), $install + $marker, '' ),
			'rest api'                      => array( 'api', array( 'REST_API_REQUEST' ), array(), array(), '' ),
			'rest api with marker'          => array( 'api', array( 'REST_API_REQUEST' ), array(), $marker, '' ),
			'ajax install with marker'      => array( 'marketplace-tab', array(), array(), $install + $marker, '' ),
			'ajax install from add themes'  => array( 'add-themes', array(), array(), $install, 'https://example.com/wp-admin/theme-install.php?browse=popular' ),
			'ajax install with bad marker'  => array( 'add-themes', array(), array(), $install + array( 'wpcom_themes_origin' => 'evil' ), '' ),
			'activate with marker'          => array( 'marketplace-tab', array(), array( 'action' => 'activate' ) + $marker, array(), $preview ),
			'activate from add themes'      => array( 'add-themes', array(), array( 'action' => 'activate' ), array(), $preview ),
			'activate from themes'          => array( 'themes', array(), array( 'action' => 'activate' ), array(), 'https://example.com/wp-admin/themes.php' ),
			'customizer save'               => array( 'customizer', array(), array(), array( 'action' => 'customize_save' ), '' ),
			'nothing set'                   => array( 'other', array(), array(), array(), '' ),
			'ajax install from tab referer' => array( 'marketplace-tab', array(), array(), $install, $tab ),
			'activate from tab referer'     => array( 'marketplace-tab', array(), array( 'action' => 'activate' ), array(), $tab ),
			'rest api from tab referer'     => array( 'api', array( 'REST_API_REQUEST' ), array(), array(), $tab ),
			'customizer flag'               => array( 'customizer', array(), array(), array( 'wp_customize' => 'on' ), '' ),
			'activate from dashboard'       => array( 'other', array(), array( 'action' => 'activate' ), array(), 'https://example.com/wp-admin/index.php' ),
		);
	}
}
