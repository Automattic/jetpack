<?php
/**
 * Tests Settings class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class to test the Settings class.
 *
 * @covers \Automattic\Jetpack\Stats\Settings
 */
#[CoversClass( Settings::class )]
class Settings_Test extends StatsBaseTestCase {
	const READER_VIEWS_OPTION = 'wpcom_reader_views_enabled';

	/**
	 * @dataProvider provide_reader_views_saves
	 *
	 * @param mixed $stored  The stored option before the save, or null for a site that never saved it.
	 * @param bool  $enabled The value to save.
	 */
	#[DataProvider( 'provide_reader_views_saves' )]
	public function test_update_reader_views_stores_the_value( $stored, bool $enabled ) {
		if ( null !== $stored ) {
			update_option( self::READER_VIEWS_OPTION, $stored );
		}

		$result = Settings::update_reader_views( $enabled );

		$this->assertTrue( $result );
		$this->assertSame( $enabled, (bool) get_option( self::READER_VIEWS_OPTION, true ) );
	}

	/**
	 * Data provider for test_update_reader_views_stores_the_value.
	 *
	 * @return array
	 */
	public static function provide_reader_views_saves() {
		return array(
			'off on a site that never saved it' => array( null, false ),
			'on when it was off'                => array( 0, true ),
			'off when it is already off'        => array( 0, false ),
			'on when it is already on'          => array( 1, true ),
		);
	}

	public function test_update_reader_views_reports_a_save_that_did_not_persist() {
		$keep_stored = static function ( $value, $old_value ) {
			return $old_value;
		};
		add_filter( 'pre_update_option_' . self::READER_VIEWS_OPTION, $keep_stored, 10, 2 );

		$result = Settings::update_reader_views( false );
		remove_filter( 'pre_update_option_' . self::READER_VIEWS_OPTION, $keep_stored, 10 );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_save_failed', $result->get_error_code() );
		$this->assertSame( array( 'status' => 500 ), $result->get_error_data() );
	}

	public function test_update_refuses_a_role_that_is_not_a_string() {
		$result = Settings::update( array( 'count_roles' => array( array( 'editor' ) ) ), array( 'count_roles' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_invalid_role', $result->get_error_code() );
		$this->assertSame( array( 'status' => 400 ), $result->get_error_data() );
		$this->assertSame( array(), Options::get_option( 'count_roles' ) );
	}
}
