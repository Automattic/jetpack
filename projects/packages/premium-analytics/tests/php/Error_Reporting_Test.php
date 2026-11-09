<?php
/**
 * Tests for the error reporting script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/error-reporting.php';
require_once __DIR__ . '/../../src/dashboard-layout.php';
require_once __DIR__ . '/../../src/widget-modules.php';
require_once __DIR__ . '/../../src/widget-types.php';
require_once __DIR__ . '/traits/trait-widget-manifest-fixture.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\add_error_reporting_script_data
 * @covers ::Automattic\Jetpack\PremiumAnalytics\sanitize_error_reporting_origins
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\add_error_reporting_script_data' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\sanitize_error_reporting_origins' )]
class Error_Reporting_Test extends BaseTestCase {
	use Widget_Manifest_Fixture_Trait;

	/**
	 * Reset the host and filters.
	 */
	public function tear_down() {
		Constants::clear_constants();
		Cache::clear();
		remove_all_filters( 'jetpack_premium_analytics_error_reporting_script_origins' );

		// WorDBless restores the hooks but not these two, so a failed assertion would leak them.
		unset( $GLOBALS['jpa_test_widget_manifest'] );
		$this->reset_widget_registry();

		parent::tear_down();
	}

	public function test_enabled_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$config = $this->get_config();

		$this->assertTrue( $config['enabled'] );
		$this->assert_version_and_build_origin( $config );
	}

	public function test_enabled_on_atomic() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/plugins/wpcomsh/wpcomsh.php' );

		$config = $this->get_config();

		$this->assertTrue( $config['enabled'] );
		$this->assert_version_and_build_origin( $config );
	}

	public function test_disabled_on_self_hosted() {
		$config = $this->get_config();

		$this->assertFalse( $config['enabled'] );
		$this->assert_version_and_build_origin( $config );
	}

	public function test_script_origins_filterable() {
		$this->add_origin( 'https://example.com/x/' );

		$config = $this->get_config();

		$this->assertContains( 'https://example.com/x/', $config['script_origins'] );
		$this->assert_version_and_build_origin( $config );
	}

	public function test_a_filter_returning_a_non_array_leaves_the_package_origin() {
		add_filter( 'jetpack_premium_analytics_error_reporting_script_origins', '__return_false' );

		$config = $this->get_config();

		$this->assertCount( 1, $config['script_origins'] );
		$this->assert_version_and_build_origin( $config );
	}

	public function test_an_added_origin_gains_its_trailing_slash() {
		$this->add_origin( 'https://example.com/x' );

		$config = $this->get_config();

		$this->assertContains( 'https://example.com/x/', $config['script_origins'] );
	}

	/**
	 * A bare slash matches every stack line, so every error would look like dashboard code.
	 */
	public function test_a_root_origin_is_dropped() {
		$this->add_origin( '/' );

		$config = $this->get_config();

		$this->assertNotContains( '/', $config['script_origins'] );
		$this->assert_version_and_build_origin( $config );
	}

	public function test_origins_added_while_the_widget_registry_hydrates_are_published() {
		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_absent_widget_manifest' ) );
		$GLOBALS['jpa_test_widget_manifest'] = array();
		$this->reset_widget_registry();
		add_action(
			Widget_Type_Registry::REGISTER_ACTION,
			static function () {
				add_filter(
					'jetpack_premium_analytics_error_reporting_script_origins',
					static function ( $origins ) {
						$origins[] = 'https://example.com/package/build/';
						return $origins;
					}
				);
			}
		);

		$config = $this->get_config();

		$this->assertContains( 'https://example.com/package/build/', $config['script_origins'] );
	}

	/**
	 * Appends one origin through the filter.
	 *
	 * @param string $origin The origin a package would add.
	 * @return void
	 */
	private function add_origin( string $origin ) {
		add_filter(
			'jetpack_premium_analytics_error_reporting_script_origins',
			static function ( $origins ) use ( $origin ) {
				$origins[] = $origin;
				return $origins;
			}
		);
	}

	/**
	 * Drop the hydrated widget type registry.
	 *
	 * @return void
	 */
	private function reset_widget_registry() {
		$instance = new \ReflectionProperty( Widget_Type_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
	}

	/**
	 * Runs the filter callback and returns the error reporting config.
	 *
	 * @return array
	 */
	private function get_config(): array {
		$data = add_error_reporting_script_data( array( 'premium_analytics' => array( 'has_videopress' => true ) ) );

		$this->assertTrue( $data['premium_analytics']['has_videopress'] );

		return $data['premium_analytics']['error_reporting'];
	}

	/**
	 * Asserts the version and that the first origin is the package build.
	 *
	 * @param array $config The error reporting config.
	 * @return void
	 */
	private function assert_version_and_build_origin( array $config ) {
		$this->assertSame( Analytics::PACKAGE_VERSION, $config['version'] );
		$this->assertStringEndsWith( '/build/', $config['script_origins'][0] );
	}
}
