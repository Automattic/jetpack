<?php
/**
 * Tests for the fixture promos.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once dirname( __DIR__, 2 ) . '/src/promos.php';
require_once dirname( __DIR__, 2 ) . '/src/promo-fixture.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_promo_fixtures
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_promo_fixtures
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_promo_fixtures' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_promo_fixtures' )]
class Promo_Fixture_Test extends BaseTestCase {

	/**
	 * Drop the filter, the registrant and the registry it hydrated.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_premium_analytics_register_promo_fixtures' );
		remove_all_actions( Promo_Registry::REGISTER_ACTION );

		$instance = new \ReflectionProperty( Promo_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		parent::tear_down();
	}

	/**
	 * Placements of the registered promos, sorted.
	 *
	 * @return string[]
	 */
	private function registered_placements() {
		do_action( 'init' );
		configure_promo_fixtures();

		$placements = array_map(
			static function ( Promo $promo ) {
				return $promo->placement;
			},
			array_values( Promo_Registry::get_instance()->get_all_registered() )
		);
		sort( $placements );

		return $placements;
	}

	public function test_no_fixture_promos_are_registered_by_default() {
		$this->assertSame( array(), $this->registered_placements() );
	}

	public function test_the_fixture_filter_registers_one_promo_per_placement() {
		add_filter( 'jetpack_premium_analytics_register_promo_fixtures', '__return_true' );

		$expected = PROMO_PLACEMENTS;
		sort( $expected );

		$this->assertSame( $expected, $this->registered_placements() );
	}
}
