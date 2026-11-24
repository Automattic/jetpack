<?php
/**
 * Tests for the data views widget's variations.
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
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_data_views_widget_attributes
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_data_views_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_data_views_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_widget_type_variation
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_data_views_widget_attributes' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_data_views_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_data_views_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_widget_type_variation' )]
class Data_Views_Widget_Types_Test extends BaseTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $GLOBALS['jpa_test_widget_manifest'] );

		parent::tear_down();
	}

	public function test_a_variation_takes_the_data_views_implementation_under_its_own_identity() {
		$GLOBALS['jpa_test_widget_manifest'] = array(
			array(
				'name'          => 'jpa/data-views',
				'render_module' => 'jpa/widgets/data-views/render',
				'title'         => 'Data views',
				'description'   => 'The records of a source as a searchable, sortable table.',
				'icon'          => 'jpa/post-list',
				'presentation'  => 'full-bleed',
			),
		);
		$registry                            = new Widget_Type_Registry();

		register_widget_types( $registry );

		$implementation = $registry->get_registered( 'jpa/data-views' );
		$variation      = $registry->get_registered( 'jpa/data-views--posts' );
		$this->assertInstanceOf( Widget_Type::class, $variation );
		$this->assertSame( $implementation->render_module, $variation->render_module );
		$this->assertSame( 'full-bleed', $variation->presentation );
		$this->assertSame( 'Posts & Pages', $variation->title );
		$this->assertSame( 'Every post and page with its views in the selected period.', $variation->description );
		$this->assertSame( 'jpa/page', $variation->icon );
	}

	public function test_an_instance_starts_from_the_source_and_the_view_of_its_variation_alone() {
		$attributes = get_data_views_widget_attributes( 'jpa/data-views--posts' );

		$this->assertSame( array( 'source', 'view' ), array_keys( $attributes ) );
		$this->assertSame( 'jpa/posts', $attributes['source'] );
		$this->assertSame( array(), get_data_views_widget_attributes( 'jpa/data-views' ) );
	}
}
