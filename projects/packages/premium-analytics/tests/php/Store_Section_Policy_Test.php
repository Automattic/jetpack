<?php
/**
 * Tests for Store_Section_Policy.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Store_Section_Policy
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
		remove_all_filters( 'jetpack_feature_flag_enabled' );
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
	 * Jetpack reads this before the dashboard registers its flags; an unregistered flag ignores its default.
	 */
	public function test_store_flag_is_read_with_its_registered_definition_before_the_dashboard_registers_it() {
		update_option( Enablement_Setting::ENABLED_OPTION, 1 );
		$owner = null;
		add_filter(
			'jetpack_feature_flag_enabled',
			static function ( $enabled, $name, $definition ) use ( &$owner ) {
				if ( Store_Section_Policy::FLAG === $name ) {
					$owner = $definition['owner'];
				}
				return $enabled;
			},
			10,
			3
		);

		Store_Section_Policy::is_offered();

		$this->assertSame( 'jetpack-premium-analytics', $owner );
	}
}
