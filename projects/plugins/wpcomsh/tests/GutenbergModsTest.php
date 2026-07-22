<?php
/**
 * Gutenberg Mods Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class GutenbergModsTest.
 */
class GutenbergModsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Original $wp_version, restored after each test.
	 *
	 * @var string
	 */
	private $original_wp_version;

	/**
	 * Stash the global WordPress version before each test.
	 */
	public function set_up() {
		parent::set_up();
		global $wp_version;
		$this->original_wp_version = $wp_version;
	}

	/**
	 * Restore the global WordPress version after each test.
	 */
	public function tear_down() {
		global $wp_version;
		$wp_version = $this->original_wp_version;
		parent::tear_down();
	}

	/**
	 * Data provider for the core-bundled Gutenberg version lookup.
	 *
	 * @return array<string, array{0: string, 1: string|null}>
	 */
	public static function provide_wp_versions() {
		return array(
			'mapped major'         => array( '7.1', '23.6' ),
			'mapped with point'    => array( '7.1.2', '23.6' ),
			'mapped beta'          => array( '7.1-beta2', '23.6' ),
			'mapped rc with build' => array( '7.1-RC1-59400', '23.6' ),
			'unmapped newer'       => array( '7.2', null ),
			'unmapped older'       => array( '6.6.1', null ),
			'empty'                => array( '', null ),
		);
	}

	/**
	 * Tests that the running WordPress version maps to the correct bundled Gutenberg version.
	 *
	 * @dataProvider provide_wp_versions
	 *
	 * @param string      $version  The WordPress version string.
	 * @param string|null $expected The expected bundled Gutenberg version.
	 */
	#[DataProvider( 'provide_wp_versions' )]
	public function test_get_core_bundled_gutenberg_version( $version, $expected ) {
		global $wp_version;
		$wp_version = $version;

		$this->assertSame( $expected, wpcomsh_get_core_bundled_gutenberg_version() );
	}

	/**
	 * Data provider for the ignore decision.
	 *
	 * @return array<string, array{0: string|null, 1: string|null, 2: bool}>
	 */
	public static function provide_ignore_decisions() {
		return array(
			'plugin older than bundle' => array( '23.0', '23.6', true ),
			'plugin much older'        => array( '19.5', '23.6', true ),
			'plugin equal to bundle'   => array( '23.6', '23.6', false ),
			'plugin newer than bundle' => array( '24.0', '23.6', false ),
			'unknown plugin version'   => array( null, '23.6', false ),
			'unknown bundled version'  => array( '23.0', null, false ),
			'both unknown'             => array( null, null, false ),
		);
	}

	/**
	 * Tests that the plugin is only ignored when it is known to be older than the core bundle.
	 *
	 * @dataProvider provide_ignore_decisions
	 *
	 * @param string|null $plugin_version  Installed Gutenberg plugin version.
	 * @param string|null $bundled_version Minimum bundled Gutenberg version.
	 * @param bool        $expected        Whether the plugin should be ignored.
	 */
	#[DataProvider( 'provide_ignore_decisions' )]
	public function test_should_ignore_gutenberg_plugin( $plugin_version, $bundled_version, $expected ) {
		$this->assertSame( $expected, wpcomsh_should_ignore_gutenberg_plugin( $plugin_version, $bundled_version ) );
	}

	/**
	 * Tests that a non-array active_plugins value is returned unchanged.
	 */
	public function test_non_array_value_passed_through() {
		$this->assertFalse( wpcomsh_ignore_outdated_gutenberg_plugin( false ) );
	}

	/**
	 * Tests that the Gutenberg plugin is left in place when the WordPress version isn't mapped.
	 *
	 * The Gutenberg plugin isn't installed in the test environment, so its version can't be read
	 * and the plugin is never ignored; an unmapped WordPress version keeps it in place regardless.
	 */
	public function test_gutenberg_kept_when_not_ignored() {
		global $wp_version;
		$wp_version = '6.6.1';

		$plugins = array( 'jetpack/jetpack.php', 'gutenberg/gutenberg.php' );

		$this->assertSame( $plugins, wpcomsh_ignore_outdated_gutenberg_plugin( $plugins ) );
	}
}
