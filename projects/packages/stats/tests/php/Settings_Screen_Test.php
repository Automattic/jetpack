<?php
/**
 * Tests the Settings_Screen class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use PHPUnit\Framework\Attributes\CoversClass;
use WP_Error;

/**
 * Tests the Settings_Screen class.
 *
 * @covers \Automattic\Jetpack\Stats\Settings_Screen
 */
#[CoversClass( Settings_Screen::class )]
class Settings_Screen_Test extends StatsBaseTestCase {
	/**
	 * Clear the `Options` cache, which outlives the options WorDBless clears.
	 */
	public function tear_down() {
		$property = ( new \ReflectionClass( Options::class ) )->getProperty( 'options' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, array() );

		parent::tear_down();
	}

	public function test_get_offers_reader_views_but_not_do_not_track() {
		$settings = Settings_Screen::get()['settings'];

		$this->assertSame( array( 'admin_bar', 'roles', 'count_roles', 'wpcom_reader_views_enabled' ), array_keys( $settings ) );
		$this->assertTrue( $settings['wpcom_reader_views_enabled'] );
	}

	public function test_get_leaves_out_roles_hidden_from_editable_roles() {
		$hide_editor = static function ( $roles ) {
			unset( $roles['editor'] );
			return $roles;
		};
		add_filter( 'editable_roles', $hide_editor );

		$roles = Settings_Screen::get()['roles'];
		remove_filter( 'editable_roles', $hide_editor );

		$this->assertContains( 'administrator', wp_list_pluck( $roles, 'slug' ) );
		$this->assertNotContains( 'editor', wp_list_pluck( $roles, 'slug' ) );
	}

	public function test_update_refuses_do_not_track_which_the_screen_does_not_offer() {
		$result = Settings_Screen::update( array( 'do_not_track' => false ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertTrue( Options::get_option( 'do_not_track' ) );
	}

	public function test_update_saves_stats_settings_and_reader_views_together() {
		$result = Settings_Screen::update(
			array(
				'roles'                      => array( 'administrator', 'editor' ),
				'wpcom_reader_views_enabled' => false,
			)
		);

		$this->assertSame( array( 'administrator', 'editor' ), $result['settings']['roles'] );
		$this->assertFalse( $result['settings']['wpcom_reader_views_enabled'] );
	}

	public function test_update_refuses_an_unknown_role_with_a_400() {
		$result = Settings_Screen::update( array( 'roles' => array( 'administrator', 'ghost' ) ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( array( 'administrator' ), Options::get_option( 'roles' ) );
	}

	public function test_update_reports_reader_views_that_did_not_persist() {
		$keep_stored = static function ( $value, $old_value ) {
			return $old_value;
		};
		add_filter( 'pre_update_option_wpcom_reader_views_enabled', $keep_stored, 10, 2 );

		$result = Settings_Screen::update( array( 'wpcom_reader_views_enabled' => false ) );
		remove_filter( 'pre_update_option_wpcom_reader_views_enabled', $keep_stored, 10 );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 400, $result->get_error_data()['status'] );
	}
}
