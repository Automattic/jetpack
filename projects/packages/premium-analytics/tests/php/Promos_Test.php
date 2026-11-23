<?php
/**
 * Tests for the promos API.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once dirname( __DIR__, 2 ) . '/src/promos.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_available_promos
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_promo
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_available_promos' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_promo' )]
class Promos_Test extends BaseTestCase {

	/**
	 * Drop the flag, the filters, the registrants and the registry they hydrated.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_show_promotions' );
		remove_all_filters( 'jetpack_premium_analytics_promos' );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . PROMO_FLAG );
		remove_all_actions( Promo_Registry::REGISTER_ACTION );
		Feature_Flags::reset();

		$instance = new \ReflectionProperty( Promo_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		parent::tear_down();
	}

	/**
	 * Turns the flag on and registers one promo per args array, each keyed by its `slug`.
	 *
	 * @param array ...$promos Promo arguments, each with a `slug` key.
	 */
	private function register_fixture_promos( array ...$promos ) {
		do_action( 'init' );
		add_filter( 'jetpack_feature_flag_enabled_' . PROMO_FLAG, '__return_true' );
		add_action(
			Promo_Registry::REGISTER_ACTION,
			function () use ( $promos ) {
				foreach ( $promos as $args ) {
					$slug = $args['slug'];
					unset( $args['slug'] );
					register_promo( $slug, $args );
				}
			}
		);
	}

	/**
	 * Slugs of the available promos, in order.
	 *
	 * @return string[]
	 */
	private function available_slugs() {
		return array_map(
			static function ( Promo $promo ) {
				return $promo->slug;
			},
			get_available_promos()
		);
	}

	public function test_no_promos_while_the_flag_is_off() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'is_available' => true,
			)
		);
		remove_all_filters( 'jetpack_feature_flag_enabled_' . PROMO_FLAG );

		$this->assertSame( array(), get_available_promos() );
	}

	public function test_no_promos_when_show_promotions_is_false() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'is_available' => true,
			)
		);
		add_filter( 'jetpack_show_promotions', '__return_false' );

		$this->assertSame( array(), get_available_promos() );
	}

	public function test_show_promotions_defaults_to_true() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'is_available' => true,
			)
		);

		$this->assertSame( array( 'acme/offer' ), $this->available_slugs() );
	}

	public function test_a_promo_whose_rule_fails_is_not_returned() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/shown',
				'placement'    => 'settings',
				'is_available' => true,
			),
			array(
				'slug'         => 'acme/hidden',
				'placement'    => 'settings',
				'is_available' => '__return_false',
			),
			array(
				'slug'      => 'acme/ruleless',
				'placement' => 'settings',
			)
		);

		$this->assertSame( array( 'acme/shown' ), $this->available_slugs() );
	}

	public function test_the_runtime_filter_can_drop_a_promo() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/kept',
				'placement'    => 'settings',
				'is_available' => true,
			),
			array(
				'slug'         => 'acme/dropped',
				'placement'    => 'settings',
				'is_available' => true,
			)
		);
		add_filter(
			'jetpack_premium_analytics_promos',
			static function ( array $promos ) {
				return array_filter(
					$promos,
					static function ( Promo $promo ) {
						return 'acme/dropped' !== $promo->slug;
					}
				);
			}
		);

		$this->assertSame( array( 'acme/kept' ), $this->available_slugs() );
	}

	public function test_promos_are_sorted_by_order_then_slug() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/late',
				'placement'    => 'settings',
				'order'        => 20,
				'is_available' => true,
			),
			array(
				'slug'         => 'acme/zeta',
				'placement'    => 'settings',
				'order'        => 10,
				'is_available' => true,
			),
			array(
				'slug'         => 'acme/alpha',
				'placement'    => 'settings',
				'order'        => 10,
				'is_available' => true,
			),
			array(
				'slug'         => 'acme/zzz-first',
				'placement'    => 'settings',
				'order'        => 5,
				'is_available' => true,
			)
		);

		$this->assertSame(
			array( 'acme/zzz-first', 'acme/alpha', 'acme/zeta', 'acme/late' ),
			$this->available_slugs()
		);
	}
}
