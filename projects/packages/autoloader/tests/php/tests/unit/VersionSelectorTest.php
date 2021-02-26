<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The VersionSelectorTest class file.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;

/**
 * Provides unit tests for the methods in the Version_Selector class.
 */
class VersionSelectorTest extends TestCase {

	/**
	 * This is called before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->version_selector = new Version_Selector();
	}

	/**
	 * Tests is_version_update_required().
	 *
	 * @param String $selected_version The currently selected package version.
	 * @param String $compare_version The package version that is being compared to the
	 *                                currently selected version to determine if the version
	 *                                needs to be updated.
	 * @param bool   $expected The expected Version_Selector::is_version_update_required() output.
	 *
	 * @covers Version_Selector::is_version_update_required
	 * @dataProvider is_version_update_required_provider
	 * @dataProvider is_version_update_required_without_dev_constant_provider
	 */
	public function test_is_version_update_required( $selected_version, $compare_version, $expected ) {
		$this->assertEquals( $expected, $this->version_selector->is_version_update_required( $selected_version, $compare_version ) );
	}

	/**
	 * Tests is_version_update_required() with the JETPACK_AUTOLOAD_DEV constant set to true.
	 *
	 * @param String $selected_version The currently selected package version.
	 * @param String $compare_version The package version that is being compared to the
	 *                                currently selected version to determine if the version
	 *                                needs to be updated.
	 * @param bool   $expected The expected Version_Selector::is_version_update_required() output.
	 *
	 * @covers Version_Selector::is_version_update_required
	 * @dataProvider is_version_update_required_provider
	 * @dataProvider is_version_update_required_with_dev_constant_provider
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_is_version_update_required_with_dev_constant( $selected_version, $compare_version, $expected ) {
		define( 'JETPACK_AUTOLOAD_DEV', true );
		$this->assertEquals( $expected, $this->version_selector->is_version_update_required( $selected_version, $compare_version ) );
	}

	/**
	 * Data provider for the is_version_update_required() unit tests.
	 *
	 * This data provider covers inputs that are not affected by the JETPACK_AUTOLOAD_DEV
	 * constant.
	 *
	 * @return Array The test data.
	 */
	public static function is_version_update_required_provider() {
		return array(
			'selected greater than compare' => array( '2.0', '1.0', false ),
			'compare greater than selected' => array( '1.0', '2.0', true ),
			'selected null, compare stable' => array( null, '2.0', true ),
			'selected beta, compare stable' => array( '1.0-beta', '1.0', true ),
			'selected alpha, compare beta'  => array( '2.0-alpha', '2.0-beta', true ),
			'selected beta, compare less'   => array( '2.0-beta', '1.0', false ),
			'selected and compare dev'      => array( 'dev-test', 'dev-test2', false ),
			'selected null, compare dev'    => array( null, 'dev-test', true ),
		);
	}

	/**
	 * Data provider for the is_version_update_required() unit tests.
	 *
	 * This data provider covers inputs that are affected by the JETPACK_AUTOLOAD_DEV
	 * constant. The expected outputs in this provider are for environments where the
	 * JETPACK_AUTOLOAD_DEV constant is not set.
	 *
	 * @return Array The test data.
	 */
	public static function is_version_update_required_without_dev_constant_provider() {
		return array(
			'selected dev, compare stable' => array( 'dev-test', '1.0', true ),
			'selected stable, compare dev' => array( '1.0', 'dev-test', false ),
		);
	}

	/**
	 * Data provider for the is_version_update_required() unit tests.
	 *
	 * This data provider covers inputs that are affected by the JETPACK_AUTOLOAD_DEV
	 * constant. The expected outputs in this provider are for environments where the
	 * JETPACK_AUTOLOAD_DEV constant is set to 'true'.
	 *
	 * @return Array The test data.
	 */
	public function is_version_update_required_with_dev_constant_provider() {
		return array(
			'selected dev, compare stable' => array( 'dev-test', '1.0', false ),
			'selected stable, compare dev' => array( '1.0', 'dev-test', true ),
		);
	}
}
