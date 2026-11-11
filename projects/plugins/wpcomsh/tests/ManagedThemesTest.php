<?php
/**
 * Managed themes test file.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Sync\Defaults;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class ManagedThemesTest.
 *
 * @covers ::wpcomsh_is_symlinked_into
 * @covers ::wpcomsh_get_managed_themes
 * @covers ::wpcomsh_update_managed_themes
 * @covers ::wpcomsh_handle_update_managed_themes_list
 * @covers ::wpcomsh_schedule_managed_themes_refresh
 * @covers ::wpcomsh_delete_symlinked_theme
 * @covers ::wpcomsh_allow_custom_wp_options
 */
#[CoversFunction( 'wpcomsh_is_symlinked_into' )]
#[CoversFunction( 'wpcomsh_get_managed_themes' )]
#[CoversFunction( 'wpcomsh_update_managed_themes' )]
#[CoversFunction( 'wpcomsh_handle_update_managed_themes_list' )]
#[CoversFunction( 'wpcomsh_schedule_managed_themes_refresh' )]
#[CoversFunction( 'wpcomsh_delete_symlinked_theme' )]
#[CoversFunction( 'wpcomsh_allow_custom_wp_options' )]
class ManagedThemesTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Managed tree as written in relative link targets, like THEMES_SYMLINK_BASE on WP Cloud.
	 */
	const RELATIVE_BASE = '../wordpress/themes';

	/**
	 * Temporary directory for the fixtures.
	 *
	 * @var string
	 */
	private $tmp;

	/**
	 * Theme directories registered before the test.
	 *
	 * @var array
	 */
	private $theme_directories;

	/**
	 * Build a fake managed tree and a themes folder that links into it, like on WP Cloud:
	 *
	 * - twentytwentyfive: relative link into the managed tree.
	 * - radcliffe-2: absolute link into the managed tree.
	 * - child: relative link to a child theme whose parent is missing (a broken theme).
	 * - blocksy: a regular, uploaded folder.
	 * - storefront: link to a sibling folder whose name only starts like the managed tree.
	 * - broken: link to a folder that doesn't exist.
	 */
	public function set_up() {
		parent::set_up();

		$this->tmp = sys_get_temp_dir() . '/wpcomsh-managed-themes-' . wp_generate_password( 8, false );

		$this->make_theme( 'wordpress/themes/pub/twentytwentyfive', 'Twenty Twenty-Five' );
		$this->make_theme( 'wordpress/themes/pub/radcliffe-2', 'Radcliffe 2' );
		$this->make_theme( 'wordpress/themes/pub/child', 'Child', 'missing-parent' );
		$this->make_theme( 'wordpress/themes-old/storefront', 'Storefront' );
		$this->make_theme( 'themes/blocksy', 'Blocksy' );

		symlink( self::RELATIVE_BASE . '/pub/twentytwentyfive', $this->tmp . '/themes/twentytwentyfive' );
		symlink( $this->tmp . '/wordpress/themes/pub/radcliffe-2', $this->tmp . '/themes/radcliffe-2' );
		symlink( self::RELATIVE_BASE . '/pub/child', $this->tmp . '/themes/child' );
		symlink( '../wordpress/themes-old/storefront', $this->tmp . '/themes/storefront' );
		symlink( self::RELATIVE_BASE . '/pub/missing', $this->tmp . '/themes/broken' );

		$this->theme_directories = $GLOBALS['wp_theme_directories'];
	}

	/**
	 * Remove the fixtures and restore the theme directories.
	 */
	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->theme_directories;
		search_theme_directories( true );

		$items = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $this->tmp, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $items as $item ) {
			if ( $item->isLink() || $item->isFile() ) {
				unlink( $item->getPathname() );
			} else {
				rmdir( $item->getPathname() );
			}
		}
		rmdir( $this->tmp );

		parent::tear_down();
	}

	/**
	 * Create a theme folder with a style.css.
	 *
	 * @param string $dir      Folder, relative to the fixtures directory.
	 * @param string $name     Theme name.
	 * @param string $template Optional. Parent theme, for a child theme.
	 */
	private function make_theme( $dir, $name, $template = '' ) {
		mkdir( $this->tmp . '/' . $dir, 0777, true );
		file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			$this->tmp . '/' . $dir . '/style.css',
			"/*\nTheme Name: $name\n" . ( $template ? "Template: $template\n" : '' ) . "*/\n"
		);
	}

	/**
	 * Data provider for test_is_symlinked_into.
	 *
	 * @return array
	 */
	public static function provide_symlinked_into_cases() {
		return array(
			'relative link into the managed tree'      => array( 'twentytwentyfive', true ),
			'absolute link into the managed tree'      => array( 'radcliffe-2', true ),
			'regular folder'                           => array( 'blocksy', false ),
			'link to a sibling with a similar name'    => array( 'storefront', false ),
			'link to a folder that does not exist'     => array( 'broken', false ),
			'folder that does not exist in the themes' => array( 'nope', false ),
		);
	}

	/**
	 * Only working links into the managed tree count as managed.
	 *
	 * @dataProvider provide_symlinked_into_cases
	 *
	 * @param string $folder   Folder in the themes directory.
	 * @param bool   $expected Whether it is managed.
	 */
	#[DataProvider( 'provide_symlinked_into_cases' )]
	public function test_is_symlinked_into( $folder, $expected ) {
		$bases = array( self::RELATIVE_BASE, $this->tmp . '/wordpress/themes' );

		$this->assertSame( $expected, wpcomsh_is_symlinked_into( $this->tmp . '/themes/' . $folder, $bases ) );
	}

	/**
	 * The list holds the managed themes, broken ones included, and leaves out the others.
	 */
	public function test_get_managed_themes() {
		register_theme_directory( $this->tmp . '/themes' );

		$managed = wpcomsh_get_managed_themes( array( self::RELATIVE_BASE, $this->tmp . '/wordpress/themes' ) );

		$this->assertSame( array( 'child', 'radcliffe-2', 'twentytwentyfive' ), $managed );
	}

	/**
	 * Data provider for test_upgrader_refreshes_list_on_theme_installs_only.
	 *
	 * @return array
	 */
	public static function provide_upgrader_cases() {
		return array(
			'theme install'  => array( 'theme', 'install', true ),
			'theme update'   => array( 'theme', 'update', false ),
			'plugin install' => array( 'plugin', 'install', false ),
			'no details'     => array( null, null, false ),
		);
	}

	/**
	 * Core's upgrader refreshes the list after theme installs only: updates don't change whether a folder is a symlink.
	 *
	 * @dataProvider provide_upgrader_cases
	 *
	 * @param string|null $type      Upgrader type.
	 * @param string|null $action    Upgrader action.
	 * @param bool        $refreshed Whether the list is refreshed.
	 */
	#[DataProvider( 'provide_upgrader_cases' )]
	public function test_upgrader_refreshes_list_on_theme_installs_only( $type, $action, $refreshed ) {
		delete_option( 'wpcomsh_at_managed_themes' );
		$hook_extra = array_filter( compact( 'type', 'action' ) );

		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		wpcomsh_handle_update_managed_themes_list( new WP_Upgrader(), $hook_extra );

		$this->assertSame( $refreshed, false !== get_option( 'wpcomsh_at_managed_themes', false ) );
	}

	/**
	 * Refreshing saves the current list.
	 */
	public function test_update_saves_managed_themes() {
		delete_option( 'wpcomsh_at_managed_themes' );

		wpcomsh_update_managed_themes();

		$this->assertSame( wpcomsh_get_managed_themes(), get_option( 'wpcomsh_at_managed_themes' ) );
	}

	/**
	 * The daily refresh is scheduled once.
	 */
	public function test_daily_refresh_is_scheduled() {
		wp_clear_scheduled_hook( 'wpcomsh_refresh_managed_themes' );

		wpcomsh_schedule_managed_themes_refresh();
		$scheduled = wp_next_scheduled( 'wpcomsh_refresh_managed_themes' );
		wpcomsh_schedule_managed_themes_refresh();

		$this->assertNotFalse( $scheduled );
		$this->assertSame( $scheduled, wp_next_scheduled( 'wpcomsh_refresh_managed_themes' ) );
		$this->assertSame( 'daily', wp_get_schedule( 'wpcomsh_refresh_managed_themes' ) );
	}

	/**
	 * The list is refreshed when wpcomsh installs or deletes a theme by symlink, which skips core's hooks,
	 * after core's upgrader installs a theme, and by the daily refresh, which is scheduled on init.
	 */
	public function test_managed_themes_list_is_refreshed() {
		$this->assertNotFalse( has_action( 'wpcomsh_wpcom_theme_installed', 'wpcomsh_update_managed_themes' ) );
		$this->assertNotFalse( has_action( 'wpcomsh_symlinked_theme_deleted', 'wpcomsh_update_managed_themes' ) );
		$this->assertNotFalse( has_action( 'deleted_theme', 'wpcomsh_update_managed_themes' ) );
		$this->assertNotFalse( has_action( 'wpcomsh_refresh_managed_themes', 'wpcomsh_update_managed_themes' ) );
		$this->assertSame( 50, has_action( 'upgrader_process_complete', 'wpcomsh_handle_update_managed_themes_list' ) );
		$this->assertSame( 10, has_action( 'init', 'wpcomsh_schedule_managed_themes_refresh' ) );
	}

	/**
	 * Deleting a symlinked theme fires the action the list refresh listens to.
	 */
	public function test_deleting_symlinked_theme_fires_action() {
		register_theme_directory( $this->tmp . '/themes' );
		add_filter( 'theme_root', array( $this, 'get_fixture_theme_root' ) );

		$fired = did_action( 'wpcomsh_symlinked_theme_deleted' );
		$this->assertTrue( wpcomsh_delete_symlinked_theme( 'twentytwentyfive' ) );

		remove_filter( 'theme_root', array( $this, 'get_fixture_theme_root' ) );

		$this->assertSame( $fired + 1, did_action( 'wpcomsh_symlinked_theme_deleted' ) );
		$this->assertFalse( is_link( $this->tmp . '/themes/twentytwentyfive' ) );
	}

	/**
	 * Theme root filter pointing at the fixtures.
	 *
	 * @return string
	 */
	public function get_fixture_theme_root() {
		return $this->tmp . '/themes';
	}

	/**
	 * The managed themes option is in the Jetpack Sync options whitelist, like the plugins one.
	 */
	public function test_managed_themes_option_is_synced() {
		$whitelist = Defaults::get_options_whitelist();

		$this->assertContains( 'wpcomsh_at_managed_themes', wpcomsh_allow_custom_wp_options( array() ) );
		$this->assertContains( 'wpcomsh_at_managed_plugins', $whitelist );
		$this->assertContains( 'wpcomsh_at_managed_themes', $whitelist );
	}
}
