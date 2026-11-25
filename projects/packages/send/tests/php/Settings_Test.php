<?php
/**
 * Tests for Settings.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Send\Settings
 */
#[CoversClass( Settings::class )]
class Settings_Test extends BaseTestCase {

	/**
	 * Forget the option.
	 */
	public function tear_down() {
		Settings::delete();
		parent::tear_down();
	}

	public function test_new_sites_keep_a_week_and_the_debug_log_is_off() {
		$settings = Settings::get();

		$this->assertSame( 7, $settings['log_retention_days'] );
		$this->assertFalse( $settings['debug_log'] );
		$this->assertSame( 7, $settings['debug_log_days'] );
	}

	public function test_saving_one_setting_never_stores_the_defaults() {
		Settings::update( array( 'fallback' => false ) );

		// Otherwise the upgrade couldn't tell a site that never chose a retention from one that chose a week.
		$this->assertSame( array( 'fallback' => false ), get_option( Settings::OPTION ) );
	}

	/**
	 * Values for the new keys, and what's stored.
	 *
	 * @return array[]
	 */
	public static function provide_values() {
		return array(
			'forever'                 => array( 'log_retention_days', 0, 0 ),
			'a year'                  => array( 'log_retention_days', '365', 365 ),
			'not a choice'            => array( 'log_retention_days', 14, null ),
			'debug log for a month'   => array( 'debug_log_days', 30, 30 ),
			'debug log for two weeks' => array( 'debug_log_days', 14, null ),
		);
	}

	/**
	 * @dataProvider provide_values
	 *
	 * @param string   $key      Setting.
	 * @param mixed    $value    Value sent.
	 * @param int|null $expected Stored value, or null when it's refused.
	 */
	#[DataProvider( 'provide_values' )]
	public function test_retention_and_debug_days_take_only_their_choices( $key, $value, $expected ) {
		Settings::update( array( $key => $value ) );

		$this->assertSame( $expected, get_option( Settings::OPTION )[ $key ] ?? null );
	}
}
