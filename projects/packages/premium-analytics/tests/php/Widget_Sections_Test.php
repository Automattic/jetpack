<?php
/**
 * Tests for the widget type section scoping layer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/widget-sections.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_widget_type_sections
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_widget_type_sections' )]
class Widget_Sections_Test extends TestCase {

	/**
	 * The four period totals belong to the tab whose subject is the date range,
	 * so the gallery offers them on Traffic and nowhere else.
	 *
	 * @return array<string, array{string}> Widget type name, keyed by test name.
	 */
	public static function provide_traffic_only_widget_types() {
		return array(
			'total views'    => array( 'jpa/total-views' ),
			'total visitors' => array( 'jpa/total-visitors' ),
			'popular days'   => array( 'jpa/popular-days' ),
			'popular hours'  => array( 'jpa/popular-hours' ),
		);
	}

	/**
	 * @dataProvider provide_traffic_only_widget_types
	 *
	 * @param string $widget_type_name Widget type scoped to the traffic section.
	 */
	#[DataProvider( 'provide_traffic_only_widget_types' )]
	public function test_period_totals_are_scoped_to_the_traffic_section( $widget_type_name ) {
		$this->assertSame(
			array( DASHBOARD_TRAFFIC_SECTION_ID ),
			get_widget_type_sections( $widget_type_name )
		);
	}

	/**
	 * Null, not an empty array: the gallery reads absence as "every section", so
	 * an unscoped type must not be mistaken for one scoped to nothing.
	 */
	public function test_an_unscoped_widget_type_has_no_sections() {
		$this->assertNull( get_widget_type_sections( 'jpa/tags' ) );
	}

	/**
	 * The scope map and the default layouts are edited in different files with
	 * nothing tying them together, so a section could end up seeding a widget its
	 * own gallery refuses to offer. Only a brand-new user would ever see it.
	 */
	public function test_no_default_layout_places_an_out_of_scope_widget_type() {
		$layouts    = get_dashboard_default_section_layouts();
		$violations = array();

		foreach ( $layouts as $section_id => $instances ) {
			foreach ( $instances as $instance ) {
				$sections = get_widget_type_sections( $instance['type'] );

				if ( null !== $sections && ! in_array( $section_id, $sections, true ) ) {
					$violations[] = sprintf( '%s is seeded into %s but scoped away from it', $instance['type'], $section_id );
				}
			}
		}

		// Collected rather than asserted in the loop: every seeded type is
		// unscoped today, so a per-instance assertion would run zero times and
		// PHPUnit would rightly call the test risky.
		$this->assertSame( array(), $violations );
		$this->assertNotEmpty( $layouts, 'The default layouts are the input; an empty set would pass vacuously.' );
	}

	/**
	 * Section ids on the scope have to be ids the dashboard actually registers,
	 * or the gallery silently offers the type nowhere.
	 */
	public function test_every_scoped_section_is_a_real_dashboard_section() {
		// Every section the dashboard ships a default layout for, so a section
		// added later is covered without editing this test. A section registered
		// with no bundled default would not be — it would redden this instead of
		// slipping past, which is the safe direction.
		$known_sections = array_keys( get_dashboard_default_section_layouts() );
		$this->assertNotEmpty( $known_sections );

		foreach ( WIDGET_TYPE_SECTIONS as $widget_type_name => $sections ) {
			$this->assertNotEmpty( $sections, $widget_type_name );

			foreach ( $sections as $section_id ) {
				$this->assertContains( $section_id, $known_sections, $widget_type_name );
			}
		}
	}
}
