<?php
/**
 * Tests for Jetpack_Memberships::get_join_others_text().
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';

/**
 * @covers Jetpack_Memberships
 */
#[CoversClass( Jetpack_Memberships::class )]
class Jetpack_Memberships_Get_Join_Others_Text_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tear down after each test.
	 *
	 * @return void
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_memberships_subscriber_count_format' );

		parent::tear_down();
	}

	/**
	 * Tests the default 'short' format without filters.
	 *
	 * @return void
	 */
	public function test_default_short_format() {
		$this->assertSame( 'Join 1 other subscriber', Jetpack_Memberships::get_join_others_text( 1 ) );
		$this->assertSame( 'Join 5 other subscribers', Jetpack_Memberships::get_join_others_text( 5 ) );
		$this->assertSame( 'Join 9,999 other subscribers', Jetpack_Memberships::get_join_others_text( 9999 ) );
		$this->assertSame( 'Join 10K other subscribers', Jetpack_Memberships::get_join_others_text( 10000 ) );
		$this->assertSame( 'Join 45.8K other subscribers', Jetpack_Memberships::get_join_others_text( 45806 ) );
		$this->assertSame( 'Join 1M other subscribers', Jetpack_Memberships::get_join_others_text( 1000000 ) );
		$this->assertSame( 'Join 1.9M other subscribers', Jetpack_Memberships::get_join_others_text( 1940000 ) );
	}

	/**
	 * Tests raw count format via filter.
	 *
	 * @return void
	 */
	public function test_raw_format_filter() {
		add_filter(
			'jetpack_memberships_subscriber_count_format',
			function () {
				return 'raw';
			}
		);

		$this->assertSame( 'Join 1 other subscriber', Jetpack_Memberships::get_join_others_text( 1 ) );
		$this->assertSame( 'Join 45,806 other subscribers', Jetpack_Memberships::get_join_others_text( 45806 ) );
		$this->assertSame( 'Join 1,234,567 other subscribers', Jetpack_Memberships::get_join_others_text( 1234567 ) );
	}

	/**
	 * Tests rounded longer format via filter.
	 *
	 * @return void
	 */
	public function test_rounded_format_filter() {
		add_filter(
			'jetpack_memberships_subscriber_count_format',
			function () {
				return 'rounded';
			}
		);

		$this->assertSame( 'Join 1 other subscriber', Jetpack_Memberships::get_join_others_text( 1 ) );
		$this->assertSame( 'Join 500 other subscribers', Jetpack_Memberships::get_join_others_text( 500 ) );
		$this->assertSame( 'Join 9,999 other subscribers', Jetpack_Memberships::get_join_others_text( 9999 ) );
		$this->assertSame( 'Join 45,800 other subscribers', Jetpack_Memberships::get_join_others_text( 45806 ) );
		$this->assertSame( 'Join 1,200,000 other subscribers', Jetpack_Memberships::get_join_others_text( 1234567 ) );
		$this->assertSame( 'Join 2,000,000 other subscribers', Jetpack_Memberships::get_join_others_text( 1950000 ) );
	}

	/**
	 * Tests that unknown format values fall back to short format.
	 *
	 * @return void
	 */
	public function test_unknown_format_fallback() {
		add_filter(
			'jetpack_memberships_subscriber_count_format',
			function () {
				return 'invalid_format';
			}
		);

		$this->assertSame( 'Join 45.8K other subscribers', Jetpack_Memberships::get_join_others_text( 45806 ) );
	}
}
