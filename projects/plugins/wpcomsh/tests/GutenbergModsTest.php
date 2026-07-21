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
	 * Data provider for beta version detection.
	 *
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public function provide_wp_versions() {
		return array(
			'stable release'    => array( '6.6.1', false ),
			'stable major'      => array( '6.7', false ),
			'alpha nightly'     => array( '6.9-alpha-59123', true ),
			'beta'              => array( '6.9-beta2', true ),
			'beta with build'   => array( '6.9-beta2-59300', true ),
			'release candidate' => array( '6.9-RC1', true ),
			'rc with build'     => array( '6.9-RC1-59400', true ),
			'empty'             => array( '', false ),
		);
	}

	/**
	 * Tests that beta/RC/alpha builds are detected as beta versions.
	 *
	 * @dataProvider provide_wp_versions
	 *
	 * @param string $version  The WordPress version string.
	 * @param bool   $expected Whether it should be treated as a beta version.
	 */
	#[DataProvider( 'provide_wp_versions' )]
	public function test_is_wp_beta_version( $version, $expected ) {
		global $wp_version;
		$wp_version = $version;

		$this->assertSame( $expected, wpcomsh_is_wp_beta_version() );
	}

	/**
	 * Tests that the Gutenberg plugin is removed from the active plugins list on beta builds.
	 */
	public function test_gutenberg_ignored_on_beta() {
		global $wp_version;
		$wp_version = '6.9-beta1';

		$plugins  = array( 'jetpack/jetpack.php', 'gutenberg/gutenberg.php', 'akismet/akismet.php' );
		$filtered = wpcomsh_ignore_gutenberg_plugin_on_wp_beta( $plugins );

		$this->assertNotContains( 'gutenberg/gutenberg.php', $filtered );
		$this->assertContains( 'jetpack/jetpack.php', $filtered );
		$this->assertContains( 'akismet/akismet.php', $filtered );
		$this->assertSame( array_values( $filtered ), $filtered, 'List should be re-indexed.' );
	}

	/**
	 * Tests that the Gutenberg plugin is left untouched on stable builds.
	 */
	public function test_gutenberg_kept_on_stable() {
		global $wp_version;
		$wp_version = '6.6.1';

		$plugins = array( 'jetpack/jetpack.php', 'gutenberg/gutenberg.php' );

		$this->assertSame( $plugins, wpcomsh_ignore_gutenberg_plugin_on_wp_beta( $plugins ) );
	}

	/**
	 * Tests that a non-array option value is returned unchanged.
	 */
	public function test_non_array_value_passed_through() {
		global $wp_version;
		$wp_version = '6.9-beta1';

		$this->assertFalse( wpcomsh_ignore_gutenberg_plugin_on_wp_beta( false ) );
	}
}
