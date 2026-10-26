<?php
/**
 * Tests for the detail page widget variants registered as widget types.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/widget-modules.php';
require_once __DIR__ . '/../../src/widget-types.php';
require_once __DIR__ . '/fixtures/widget-modules-manifest.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_widget_type_variants
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_widget_type_variants
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_widget_type_variants' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_widget_type_variants' )]
class Widget_Type_Variants_Test extends BaseTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $GLOBALS['jpa_test_widget_manifest'] );

		parent::tear_down();
	}

	public function test_a_variant_registers_with_the_base_modules_and_its_own_identity() {
		$GLOBALS['jpa_test_widget_manifest'] = array(
			array(
				'name'          => 'jpa/popular-post',
				'render_module' => 'jpa/widgets/popular-post/render',
				'widget_module' => 'jpa/widgets/popular-post/widget',
				'title'         => 'Popular post',
				'icon'          => 'jpa/star-empty',
				'attributes'    => array(
					array(
						'id'   => 'authorScoped',
						'type' => 'boolean',
					),
				),
			),
		);
		$registry                            = new Widget_Type_Registry();

		register_widget_types( $registry );

		$base    = $registry->get_registered( 'jpa/popular-post' );
		$variant = $registry->get_registered( 'jpa/popular-post--author' );
		$this->assertInstanceOf( Widget_Type::class, $variant );
		$this->assertSame( $base->render_module, $variant->render_module );
		$this->assertSame( $base->widget_module, $variant->widget_module );
		$this->assertSame( $base->attributes, $variant->attributes );
		$this->assertSame( 'insights', $variant->plan_feature );
		$this->assertSame( 'Popular post', $variant->title );
		$this->assertSame( 'jpa/star-empty', $variant->icon );
		$help = $variant->help ?? array();
		$this->assertStringContainsString( 'most-viewed post', $help['content'] );
	}

	public function test_a_variant_without_its_base_is_not_registered() {
		$GLOBALS['jpa_test_widget_manifest'] = array(
			array(
				'name'          => 'jpa/email-time-series',
				'render_module' => 'jpa/widgets/email-time-series/render',
				'widget_module' => 'jpa/widgets/email-time-series/widget',
				'title'         => 'Email time series',
			),
		);
		$registry                            = new Widget_Type_Registry();

		register_widget_types( $registry );

		$this->assertTrue( $registry->is_registered( 'jpa/email-time-series--total-opens' ) );
		$this->assertSame( 'jpa/seen', $registry->get_registered( 'jpa/email-time-series--total-opens' )->icon );
		$this->assertFalse( $registry->is_registered( 'jpa/utm-insights--utm' ) );
		$this->assertFalse( $registry->is_registered( 'jpa/views-over-years--author' ) );
	}
}
