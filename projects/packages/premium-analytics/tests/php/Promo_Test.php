<?php
/**
 * Tests for the Promo model.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Tests for the Promo model.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Promo
 */
#[CoversClass( Promo::class )]
class Promo_Test extends BaseTestCase {

	/**
	 * A promo with no availability rule is not available.
	 */
	public function test_a_promo_with_no_rule_is_not_available() {
		$promo = new Promo( 'acme/offer', array( 'placement' => 'settings' ) );

		$this->assertFalse( $promo->is_available() );
	}

	/**
	 * A callable rule is called with the promo.
	 */
	public function test_a_callable_rule_receives_the_promo() {
		$seen  = null;
		$promo = new Promo(
			'acme/offer',
			array(
				'placement'    => 'settings',
				'is_available' => function ( $promo ) use ( &$seen ) {
					$seen = $promo;
					return true;
				},
			)
		);

		$this->assertTrue( $promo->is_available() );
		$this->assertSame( $promo, $seen );
	}

	/**
	 * A boolean rule is returned as is.
	 */
	public function test_a_boolean_rule_is_returned_as_is() {
		$promo = new Promo(
			'acme/offer',
			array(
				'placement'    => 'settings',
				'is_available' => false,
			)
		);

		$this->assertFalse( $promo->is_available() );
	}

	/**
	 * Defaults survive a partial args array.
	 */
	public function test_defaults_survive_a_partial_args_array() {
		$promo = new Promo( 'acme/offer', array( 'placement' => 'settings' ) );

		$this->assertSame( 10, $promo->order );
		$this->assertTrue( $promo->dismissible );
		$this->assertSame( 90, $promo->snooze_days );
	}

	/**
	 * The array form carries the registered fields and omits the server-side rule.
	 */
	public function test_to_array_carries_the_registered_fields() {
		$promo = new Promo(
			'acme/offer',
			array(
				'placement'    => 'settings',
				'order'        => 5,
				'title'        => 'Acme',
				'description'  => 'Grow with Acme.',
				'cta_label'    => 'Upgrade to Acme',
				'cta_url'      => 'https://example.com/acme',
				'dismissible'  => true,
				'snooze_days'  => 30,
				'is_available' => true,
			)
		);

		$this->assertSame(
			array(
				'slug'        => 'acme/offer',
				'placement'   => 'settings',
				'order'       => 5,
				'title'       => 'Acme',
				'description' => 'Grow with Acme.',
				'cta_label'   => 'Upgrade to Acme',
				'cta_url'     => 'https://example.com/acme',
				'dismissible' => true,
				'snooze_days' => 30,
			),
			$promo->to_array()
		);
	}
}
