<?php
/**
 * Tests for the Google Analytics settings panel entry.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/stubs/class-ga-manager.php';
require_once __DIR__ . '/stubs/wpcom-site-has-feature.php';

/**
 * Tests Google_Analytics_Settings.
 */
class Google_Analytics_Settings_Test extends BaseTestCase {

	const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . Initializer::SETTINGS_CONSOLIDATION_FLAG;

	/**
	 * An administrator on a site whose plan includes Google Analytics, with the flag on.
	 */
	public function set_up() {
		parent::set_up();
		Feature_Flags::reset();
		Initializer::register_feature_flags();
		add_filter( self::FLAG_FILTER, '__return_true' );
		$GLOBALS['my_jetpack_test_site_features'] = array( 'google-analytics' );
		wp_set_current_user( $this->user( 'administrator' ) );
	}

	/**
	 * Undo the flag, the plan and the stored settings.
	 */
	public function tear_down() {
		remove_filter( self::FLAG_FILTER, '__return_true' );
		unset( $GLOBALS['my_jetpack_test_site_features'] );
		delete_option( 'jetpack_wga' );
		Feature_Flags::reset();
		parent::tear_down();
	}

	/**
	 * Create a user with a role, or reuse the one an earlier test created.
	 *
	 * @param string $role The role.
	 * @return int The user ID.
	 */
	private function user( $role ) {
		$id = wp_insert_user(
			array(
				'user_login' => "ga_$role",
				'user_pass'  => 'pass',
				'role'       => $role,
			)
		);

		return is_wp_error( $id ) ? username_exists( "ga_$role" ) : $id;
	}

	/**
	 * Each case removes one condition the panel needs.
	 *
	 * @return array
	 */
	public static function provide_missing_conditions() {
		return array(
			'plan without the feature' => array( 'feature' ),
			'editor'                   => array( 'role' ),
			'flag off'                 => array( 'flag' ),
		);
	}

	/**
	 * The entry and the route need the flag, an administrator and the plan feature.
	 *
	 * @param string $missing The condition to remove.
	 * @dataProvider provide_missing_conditions
	 */
	#[DataProvider( 'provide_missing_conditions' )]
	public function test_needs_flag_admin_and_plan_feature( $missing ) {
		$this->assertSame( array( 'google-analytics' ), array_column( Main_Features::get_settings_entries(), 'slug' ) );

		if ( 'feature' === $missing ) {
			$GLOBALS['my_jetpack_test_site_features'] = array();
		} elseif ( 'role' === $missing ) {
			wp_set_current_user( $this->user( 'editor' ) );
		} else {
			remove_filter( self::FLAG_FILTER, '__return_true' );
		}

		$this->assertFalse( Google_Analytics_Settings::is_available() );
		$this->assertSame( array(), Main_Features::get_settings_entries() );
	}

	/**
	 * Switch and ID combinations, and the row status each gives.
	 *
	 * @return array
	 */
	public static function provide_entry_statuses() {
		return array(
			'off'           => array(
				array(
					'is_active' => false,
					'code'      => 'G-X1',
				),
				'inactive',
			),
			'on with an ID' => array(
				array(
					'is_active' => true,
					'code'      => 'G-X1',
				),
				'active',
			),
			'on without ID' => array( array( 'is_active' => true ), 'needs-setup' ),
		);
	}

	/**
	 * On without a Measurement ID prints no tag, so the row must not say Active.
	 *
	 * @param array  $stored   The stored settings.
	 * @param string $expected The row status.
	 * @dataProvider provide_entry_statuses
	 */
	#[DataProvider( 'provide_entry_statuses' )]
	public function test_entry_status_needs_both_the_switch_and_an_id( $stored, $expected ) {
		update_option( 'jetpack_wga', $stored );

		$this->assertSame( $expected, Google_Analytics_Settings::get_entry()['status'] );
	}

	public function test_script_data_tells_the_settings_page_whether_the_panel_is_available() {
		$_GET['page'] = 'jetpack';
		try {
			$this->assertTrue( Initializer::add_admin_script_data( array() )['myJetpack']['googleAnalyticsPanel'] );

			$GLOBALS['my_jetpack_test_site_features'] = array();
			$this->assertFalse( Initializer::add_admin_script_data( array() )['myJetpack']['googleAnalyticsPanel'] );
		} finally {
			unset( $_GET['page'] );
		}
	}

	public function test_save_keeps_the_keys_the_panel_does_not_show_and_rejects_a_bad_id() {
		update_option(
			'jetpack_wga',
			array(
				'code'               => 'G-OLD',
				'is_active'          => true,
				'honor_dnt'          => true,
				'ec_track_purchases' => true,
			)
		);

		$this->assertTrue(
			Google_Analytics_Settings::update(
				array(
					'code'    => ' G-NEW123 ',
					'unknown' => 'x',
				)
			)
		);
		$this->assertSame(
			array(
				'code'               => 'G-NEW123',
				'is_active'          => true,
				'honor_dnt'          => true,
				'ec_track_purchases' => true,
			),
			get_option( 'jetpack_wga' )
		);

		$this->assertInstanceOf( \WP_Error::class, Google_Analytics_Settings::update( array( 'code' => 'G-NEW123 extra' ) ) );
		$this->assertSame( 'G-NEW123', get_option( 'jetpack_wga' )['code'] );
	}
}
