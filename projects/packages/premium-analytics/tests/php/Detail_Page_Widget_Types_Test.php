<?php
/**
 * Tests for the detail page widget types.
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
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_detail_page_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_detail_page_widget_types
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_detail_page_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_detail_page_widget_types' )]
class Detail_Page_Widget_Types_Test extends BaseTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $GLOBALS['jpa_test_widget_manifest'] );

		parent::tear_down();
	}

	public function test_a_type_takes_the_implementation_and_keeps_its_own_identity() {
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

		$implementation = $registry->get_registered( 'jpa/popular-post' );
		$type           = $registry->get_registered( 'jpa/popular-post--author' );
		$this->assertInstanceOf( Widget_Type::class, $type );
		$this->assertSame( $implementation->render_module, $type->render_module );
		$this->assertSame( $implementation->widget_module, $type->widget_module );
		$this->assertSame( $implementation->attributes, $type->attributes );
		$this->assertSame( 'insights', $type->plan_feature );
		$this->assertSame( 'Popular post', $type->title );
		$this->assertSame( 'jpa/star-empty', $type->icon );
		$help = $type->help ?? array();
		$this->assertStringContainsString( 'most-viewed post', $help['content'] );
	}

	public function test_registers_only_the_types_whose_implementation_is_registered() {
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
