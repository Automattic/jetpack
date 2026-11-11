<?php
/**
 * Managed themes test file.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Sync\Defaults;
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Class ManagedThemesTest.
 *
 * @covers ::wpcomsh_is_symlinked_into
 * @covers ::wpcomsh_is_managed_theme
 */
#[CoversFunction( 'wpcomsh_is_symlinked_into' )]
#[CoversFunction( 'wpcomsh_is_managed_theme' )]
class ManagedThemesTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Temporary directory for the fixtures.
	 *
	 * @var string
	 */
	private $tmp;

	/**
	 * Create a fake managed tree, a fake themes folder and some symlinks.
	 */
	public function set_up() {
		parent::set_up();

		$this->tmp = sys_get_temp_dir() . '/wpcomsh-managed-themes-' . wp_generate_password( 8, false );
		mkdir( $this->tmp . '/wordpress/themes/pub/twentytwentyfive', 0777, true );
		mkdir( $this->tmp . '/wordpress/themes-old/storefront', 0777, true );
		mkdir( $this->tmp . '/themes/blocksy', 0777, true );

		symlink( $this->tmp . '/wordpress/themes/pub/twentytwentyfive', $this->tmp . '/themes/twentytwentyfive' );
		symlink( $this->tmp . '/wordpress/themes-old/storefront', $this->tmp . '/themes/storefront' );
		symlink( $this->tmp . '/wordpress/themes/pub/missing', $this->tmp . '/themes/broken' );
	}

	/**
	 * Remove the fixtures.
	 */
	public function tear_down() {
		foreach ( array( 'twentytwentyfive', 'storefront', 'broken' ) as $link ) {
			unlink( $this->tmp . '/themes/' . $link );
		}
		rmdir( $this->tmp . '/themes/blocksy' );
		rmdir( $this->tmp . '/themes' );
		rmdir( $this->tmp . '/wordpress/themes-old/storefront' );
		rmdir( $this->tmp . '/wordpress/themes-old' );
		rmdir( $this->tmp . '/wordpress/themes/pub/twentytwentyfive' );
		rmdir( $this->tmp . '/wordpress/themes/pub' );
		rmdir( $this->tmp . '/wordpress/themes' );
		rmdir( $this->tmp . '/wordpress' );
		rmdir( $this->tmp );

		parent::tear_down();
	}

	/**
	 * A symlink into the managed tree counts as managed.
	 */
	public function test_symlink_into_managed_dir_is_managed() {
		$this->assertTrue( wpcomsh_is_symlinked_into( $this->tmp . '/themes/twentytwentyfive', $this->tmp . '/wordpress/themes' ) );
	}

	/**
	 * A regular folder is not managed.
	 */
	public function test_regular_folder_is_not_managed() {
		$this->assertFalse( wpcomsh_is_symlinked_into( $this->tmp . '/themes/blocksy', $this->tmp . '/wordpress/themes' ) );
	}

	/**
	 * A symlink to a sibling folder whose name only starts with the managed dir is not managed.
	 */
	public function test_symlink_outside_managed_dir_is_not_managed() {
		$this->assertFalse( wpcomsh_is_symlinked_into( $this->tmp . '/themes/storefront', $this->tmp . '/wordpress/themes' ) );
	}

	/**
	 * A broken symlink is not managed.
	 */
	public function test_broken_symlink_is_not_managed() {
		$this->assertFalse( wpcomsh_is_symlinked_into( $this->tmp . '/themes/broken', $this->tmp . '/wordpress/themes' ) );
	}

	/**
	 * Outside WP Cloud no theme is managed.
	 */
	public function test_no_managed_themes_outside_atomic() {
		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			$this->markTestSkipped( 'IS_ATOMIC is defined in this environment.' );
		}

		$this->assertFalse( wpcomsh_is_managed_theme( 'twentytwentyfive' ) );
	}

	/**
	 * The managed themes option is in the Jetpack Sync options whitelist, like the plugins one.
	 */
	public function test_managed_themes_option_is_synced() {
		$whitelist = Defaults::get_options_whitelist();

		$this->assertContains( 'wpcomsh_at_managed_plugins', $whitelist );
		$this->assertContains( 'wpcomsh_at_managed_themes', $whitelist );
	}
}
