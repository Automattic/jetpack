<?php
/**
 * Tests for Store_Section_Policy.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\PremiumAnalytics\Enablement_Setting;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\WooCommerceStats\Store_Section_Policy
 */
#[CoversClass( Store_Section_Policy::class )]
class Store_Section_Policy_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		delete_option( Enablement_Setting::ENABLED_OPTION );
		\WorDBless\Options::init()->clear_options();
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Store_Section_Policy::FLAG );
		Feature_Flags::reset();
	}

	public static function provide_site_states(): array {
		return array(
			'enabled by sticker or filter, flag off' => array( false, false, true ),
			'site opt-in, flag off'                  => array( true, false, false ),
			'site opt-in, flag on'                   => array( true, true, true ),
		);
	}

	/**
	 * @dataProvider provide_site_states
	 *
	 * @param bool $opted_in Whether the site turned Stats v2 on through its own setting.
	 * @param bool $flag_on  Whether the Store flag is forced on.
	 * @param bool $expected Whether the Store section is offered.
	 */
	#[DataProvider( 'provide_site_states' )]
	public function test_store_section_is_offered_unless_the_site_opt_in_lacks_the_flag( bool $opted_in, bool $flag_on, bool $expected ) {
		if ( $opted_in ) {
			update_option( Enablement_Setting::ENABLED_OPTION, 1 );
		}
		if ( $flag_on ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Store_Section_Policy::FLAG, '__return_true' );
		}

		$this->assertSame( $expected, Store_Section_Policy::is_offered() );
	}

	/**
	 * The flag stays off until something switches it on.
	 */
	public function test_flag_registers_off_by_default() {
		Store_Section_Policy::register_flag();

		$flag = Feature_Flags::get( Store_Section_Policy::FLAG );

		$this->assertIsArray( $flag );
		$this->assertFalse( $flag['default'] );
	}
}
