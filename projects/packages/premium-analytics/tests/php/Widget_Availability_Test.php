<?php
/**
 * Tests for widget availability helpers.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/fixtures/widget-modules-manifest.php';
require_once __DIR__ . '/../../src/widget-types.php';

/**
 * Tests for widget availability helpers.
 *
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_default_widget_type_requirements
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_widget_type_requirements
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_widget_type_available
 * @covers ::Automattic\Jetpack\PremiumAnalytics\normalize_widget_type_requirements
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_widget_type_requirement_met
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_widget_requirement_plugin_file_available
 * @covers ::Automattic\Jetpack\PremiumAnalytics\has_widget_requirement_active_signal
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_widget_requirement_active_signal_met
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_widget_requirement_plugin_active
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_widget_type
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_widget_types
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_default_widget_type_requirements' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_widget_type_requirements' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_widget_type_available' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\normalize_widget_type_requirements' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_widget_type_requirement_met' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_widget_requirement_plugin_file_available' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\has_widget_requirement_active_signal' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_widget_requirement_active_signal_met' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_widget_requirement_plugin_active' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_widget_type' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_widget_types' )]
class Widget_Availability_Test extends TestCase {
	/**
	 * Plugin file fixture paths created during a test.
	 *
	 * @var string[]
	 */
	private $created_plugin_files = array();

	/**
	 * Plugin directory fixture paths created during a test.
	 *
	 * @var string[]
	 */
	private $created_plugin_dirs = array();

	/**
	 * Remove filters/actions added by tests.
	 */
	protected function tearDown(): void {
		remove_all_filters( WIDGET_REQUIREMENTS_FILTER );
		remove_all_actions( REGISTER_WIDGET_TYPES_ACTION );

		foreach ( $this->created_plugin_files as $plugin_file ) {
			if ( file_exists( $plugin_file ) ) {
				unlink( $plugin_file );
			}
		}

		foreach ( $this->created_plugin_dirs as $plugin_dir ) {
			if ( is_dir( $plugin_dir ) ) {
				rmdir( $plugin_dir );
			}
		}

		parent::tearDown();
	}

	/**
	 * Bookings by device requires WooCommerce Bookings, with no minimum version yet.
	 */
	public function test_bookings_by_device_has_bookings_requirement() {
		$requirements = get_widget_type_requirements( 'jpa/bookings-by-device' );

		$this->assertCount( 1, $requirements );
		$this->assertSame( 'woocommerce-bookings/woocommerce-bookings.php', $requirements[0]['plugin_file'] );
		$this->assertSame( 'WC_Bookings', $requirements[0]['active_class'] );
		$this->assertSame( 'WC_BOOKINGS_VERSION', $requirements[0]['active_constant'] );
		$this->assertSame( 'WC_BOOKINGS_VERSION', $requirements[0]['version_constant'] );
		$this->assertArrayNotHasKey( 'min_version', $requirements[0] );
	}

	/**
	 * Bookings by device is unavailable when WooCommerce Bookings is not installed.
	 */
	public function test_bookings_by_device_is_unavailable_without_bookings() {
		$this->assertFalse( is_widget_type_available( 'jpa/bookings-by-device' ) );
	}

	/**
	 * Requirement normalization accepts empty, associative, and list shapes.
	 */
	public function test_normalize_widget_type_requirements() {
		$this->assertSame( array(), normalize_widget_type_requirements( null ) );
		$this->assertSame( array(), normalize_widget_type_requirements( array() ) );

		$single_requirement = array( 'active_class' => \stdClass::class );

		$this->assertSame( array( $single_requirement ), normalize_widget_type_requirements( $single_requirement ) );
		$this->assertSame(
			array( $single_requirement ),
			normalize_widget_type_requirements(
				array(
					$single_requirement,
					'not-a-requirement',
				)
			)
		);
	}

	/**
	 * Runtime active-signal helpers detect class, function, and constant signals.
	 */
	public function test_runtime_active_signal_helpers() {
		if ( ! defined( 'PREMIUM_ANALYTICS_WIDGET_AVAILABILITY_SIGNAL_TEST' ) ) {
			define( 'PREMIUM_ANALYTICS_WIDGET_AVAILABILITY_SIGNAL_TEST', true );
		}

		$this->assertFalse( has_widget_requirement_active_signal( array() ) );
		$this->assertTrue( has_widget_requirement_active_signal( array( 'active_class' => \stdClass::class ) ) );

		$this->assertTrue( is_widget_requirement_active_signal_met( array( 'active_class' => \stdClass::class ) ) );
		$this->assertTrue( is_widget_requirement_active_signal_met( array( 'active_function' => __NAMESPACE__ . '\\get_widget_type_requirements' ) ) );
		$this->assertTrue( is_widget_requirement_active_signal_met( array( 'active_constant' => 'PREMIUM_ANALYTICS_WIDGET_AVAILABILITY_SIGNAL_TEST' ) ) );
		$this->assertFalse( is_widget_requirement_active_signal_met( array( 'active_class' => 'Premium_Analytics_Missing_Class_For_Signal_Test' ) ) );
	}

	/**
	 * Plugin file helpers reject missing plugin files.
	 */
	public function test_plugin_file_helpers_reject_missing_plugin_files() {
		$this->assertFalse( is_widget_requirement_plugin_file_available( 'missing-plugin/missing-plugin.php' ) );
		$this->assertFalse( is_widget_type_requirement_met( array( 'plugin_file' => 'missing-plugin/missing-plugin.php' ) ) );
	}

	/**
	 * Plugin-file-only requirements require WordPress to report the plugin active.
	 */
	public function test_plugin_file_only_requirement_requires_active_plugin() {
		$plugin_file = $this->create_plugin_file_fixture();

		$this->assertTrue( is_widget_requirement_plugin_file_available( $plugin_file ) );
		$this->assertFalse( is_widget_requirement_plugin_active( $plugin_file ) );
		$this->assertFalse( is_widget_type_requirement_met( array( 'plugin_file' => $plugin_file ) ) );
	}

	/**
	 * Non-array requirements are not met.
	 */
	public function test_widget_type_requirement_rejects_invalid_requirement_shape() {
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Exercises the runtime guard for invalid third-party filter data.
		$this->assertFalse( is_widget_type_requirement_met( 'not-a-requirement' ) );
	}

	/**
	 * A widget with an unmet runtime signal is not registered.
	 */
	public function test_register_widget_type_returns_false_when_requirement_is_unmet() {
		$result = register_widget_type(
			'jpa/unavailable-widget-test',
			array(
				'render_module' => '@automattic/jetpack-premium-analytics/unavailable-widget-test/render',
				'requirements'  => array(
					array(
						'active_class' => 'Premium_Analytics_Missing_Class_For_Availability_Test',
					),
				),
			)
		);

		$this->assertFalse( $result );
		$this->assertFalse( Widget_Type_Registry::get_instance()->is_registered( 'jpa/unavailable-widget-test' ) );
	}

	/**
	 * A widget with a met runtime class signal is registered.
	 */
	public function test_register_widget_type_accepts_active_class_requirement() {
		$result = register_widget_type(
			'jpa/active-class-widget-test',
			array(
				'render_module' => '@automattic/jetpack-premium-analytics/active-class-widget-test/render',
				'requirements'  => array(
					array(
						'active_class' => \stdClass::class,
					),
				),
			)
		);

		$this->assertInstanceOf( Widget_Type::class, $result );
		$this->assertSame( '@automattic/jetpack-premium-analytics/active-class-widget-test/render', $result->render_module );
		$this->assertFalse( property_exists( $result, 'requirements' ) );
	}

	/**
	 * Minimum version requirements use the declared version constant.
	 */
	public function test_widget_type_availability_checks_minimum_version() {
		if ( ! defined( 'PREMIUM_ANALYTICS_WIDGET_AVAILABILITY_TEST_VERSION' ) ) {
			define( 'PREMIUM_ANALYTICS_WIDGET_AVAILABILITY_TEST_VERSION', '3.4.0' );
		}

		$this->assertTrue(
			is_widget_type_available(
				'jpa/versioned-widget-test',
				array(
					'requirements' => array(
						array(
							'active_constant'  => 'PREMIUM_ANALYTICS_WIDGET_AVAILABILITY_TEST_VERSION',
							'version_constant' => 'PREMIUM_ANALYTICS_WIDGET_AVAILABILITY_TEST_VERSION',
							'min_version'      => '3.0.0',
						),
					),
				)
			)
		);

		$this->assertFalse(
			is_widget_type_available(
				'jpa/versioned-widget-test',
				array(
					'requirements' => array(
						array(
							'active_constant'  => 'PREMIUM_ANALYTICS_WIDGET_AVAILABILITY_TEST_VERSION',
							'version_constant' => 'PREMIUM_ANALYTICS_WIDGET_AVAILABILITY_TEST_VERSION',
							'min_version'      => '4.0.0',
						),
					),
				)
			)
		);
	}

	/**
	 * The requirements filter can make any widget conditional.
	 */
	public function test_widget_requirements_filter_can_add_requirements() {
		add_filter(
			WIDGET_REQUIREMENTS_FILTER,
			static function ( $requirements, $widget_name ) {
				if ( 'jpa/filter-widget-test' !== $widget_name ) {
					return $requirements;
				}

				return array(
					array(
						'active_function' => 'premium_analytics_missing_function_for_availability_test',
					),
				);
			},
			10,
			2
		);

		$this->assertFalse( is_widget_type_available( 'jpa/filter-widget-test' ) );
	}

	/**
	 * Extensions can register their own widgets after bundled widgets are processed.
	 */
	public function test_register_widget_types_action_allows_extension_registration() {
		add_action(
			REGISTER_WIDGET_TYPES_ACTION,
			static function () {
				register_widget_type(
					'jpa/extension-action-widget-test',
					array(
						'render_module' => '@automattic/jetpack-premium-analytics/extension-action-widget-test/render',
					)
				);
			}
		);

		register_widget_types();

		$this->assertTrue( Widget_Type_Registry::get_instance()->is_registered( 'jpa/extension-action-widget-test' ) );
	}

	/**
	 * Generated manifest widgets are registered through the availability wrapper.
	 */
	public function test_register_widget_types_registers_manifest_widgets() {
		register_widget_types();

		$widget_type = Widget_Type_Registry::get_instance()->get_registered( 'jpa/manifest-widget-test' );

		$this->assertInstanceOf( Widget_Type::class, $widget_type );
		$this->assertSame( '@automattic/jetpack-premium-analytics/manifest-widget-test/render', $widget_type->render_module );
		$this->assertSame( '@automattic/jetpack-premium-analytics/manifest-widget-test/widget', $widget_type->widget_module );
		$this->assertSame( 'framed', $widget_type->presentation );
	}

	/**
	 * Creates a temporary plugin file fixture.
	 *
	 * @return string Relative plugin file path.
	 */
	private function create_plugin_file_fixture() {
		$plugin_dir  = trailingslashit( WP_PLUGIN_DIR ) . 'premium-analytics-widget-availability-test';
		$plugin_file = $plugin_dir . '/premium-analytics-widget-availability-test.php';

		if ( ! is_dir( $plugin_dir ) ) {
			mkdir( $plugin_dir );
		}

		file_put_contents( $plugin_file, "<?php\n" );

		$this->created_plugin_dirs[]  = $plugin_dir;
		$this->created_plugin_files[] = $plugin_file;

		return 'premium-analytics-widget-availability-test/premium-analytics-widget-availability-test.php';
	}
}
