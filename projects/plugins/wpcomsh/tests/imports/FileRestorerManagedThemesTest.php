<?php
/**
 * Tests for how FileRestorer imports themes the site already has a managed copy of.
 *
 * @package wpcomsh
 */

require_once __DIR__ . '/../../imports/utils/class-filerestorer.php';

use Imports\Utils\FileRestorer;

/**
 * FileRestorerManagedThemesTest Class.
 */
class FileRestorerManagedThemesTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Temporary root directory.
	 *
	 * @var string
	 */
	private $root;

	/**
	 * The extracted backup.
	 *
	 * @var string
	 */
	private $source;

	/**
	 * The site being imported into.
	 *
	 * @var string
	 */
	private $dest;

	/**
	 * The versions of managed themes.
	 *
	 * @var string
	 */
	private $managed;

	/**
	 * Creates the directories.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->root    = realpath( sys_get_temp_dir() ) . '/wpcomsh-file-restorer-' . wp_generate_password( 8, false );
		$this->source  = $this->root . '/source/';
		$this->dest    = $this->root . '/dest/';
		$this->managed = $this->root . '/managed/';
		$this->write( $this->source . 'wp-content/uploads/file.txt', 'upload' );
		wp_mkdir_p( $this->dest . 'wp-content/themes' );
		wp_mkdir_p( $this->managed );
	}

	/**
	 * Removes the directories.
	 */
	protected function tearDown(): void {
		$this->remove( $this->root );
		parent::tearDown();
	}

	/**
	 * An unmodified default theme keeps the site's stock copy.
	 */
	public function test_unmodified_default_theme_keeps_stock_copy() {
		$this->write_theme( $this->dest . 'wp-content/themes/twentytwentyfive', '1.0', 'stock' );
		$this->write_theme( $this->source . 'wp-content/themes/twentytwentyfive', '1.0', 'stock' );

		$restorer = $this->restore();

		$this->assertSame( array(), $restorer->get_theme_renames() );
		$this->assertFileDoesNotExist( $this->dest . 'wp-content/themes/twentytwentyfive-imported' );
		$this->assertSame( 'stock', file_get_contents( $this->dest . 'wp-content/themes/twentytwentyfive/templates/index.html' ) );
	}

	/**
	 * An edited default theme is imported under a new slug, next to the stock copy.
	 */
	public function test_edited_default_theme_is_imported_under_new_slug() {
		$this->write_theme( $this->dest . 'wp-content/themes/twentytwentyfive', '1.0', 'stock' );
		$this->write_theme( $this->source . 'wp-content/themes/twentytwentyfive', '1.0', 'edited' );
		$this->write( $this->source . 'wp-content/themes/twentytwentyfive/patterns/new.php', 'new' );

		$restorer = $this->restore();

		$this->assertSame( array( 'twentytwentyfive' => 'twentytwentyfive-imported' ), $restorer->get_theme_renames() );
		$this->assertSame( 'stock', file_get_contents( $this->dest . 'wp-content/themes/twentytwentyfive/templates/index.html' ) );
		$this->assertSame( 'edited', file_get_contents( $this->dest . 'wp-content/themes/twentytwentyfive-imported/templates/index.html' ) );
		$this->assertSame( 'new', file_get_contents( $this->dest . 'wp-content/themes/twentytwentyfive-imported/patterns/new.php' ) );
	}

	/**
	 * A default theme of another version than the stock copy can't be compared, and keeps the stock copy.
	 */
	public function test_default_theme_of_other_version_keeps_stock_copy() {
		$this->write_theme( $this->dest . 'wp-content/themes/twentytwentyfive', '1.1', 'stock' );
		$this->write_theme( $this->source . 'wp-content/themes/twentytwentyfive', '1.0', 'edited' );

		$restorer = $this->restore();

		$this->assertSame( array(), $restorer->get_theme_renames() );
		$this->assertSame( 'stock', file_get_contents( $this->dest . 'wp-content/themes/twentytwentyfive/templates/index.html' ) );
	}

	/**
	 * A theme symlinked to the managed tree is compared against the managed copy of the uploaded version.
	 */
	public function test_symlinked_theme_compares_against_managed_version() {
		$this->write_theme( $this->managed . 'pub-theme/1.0', '1.0', 'stock' );
		$this->write_theme( $this->managed . 'pub-theme/latest', '2.0', 'latest' );
		symlink( $this->managed . 'pub-theme/latest', $this->dest . 'wp-content/themes/pub-theme' );

		$this->write_theme( $this->source . 'wp-content/themes/pub-theme', '1.0', 'stock' );
		$this->assertSame( array(), $this->restore()->get_theme_renames() );

		$this->write( $this->source . 'wp-content/themes/pub-theme/templates/index.html', 'edited' );
		$restorer = $this->restore();

		$this->assertSame( array( 'pub-theme' => 'pub-theme-imported' ), $restorer->get_theme_renames() );
		$this->assertSame( 'latest', file_get_contents( $this->managed . 'pub-theme/latest/templates/index.html' ) );
		$this->assertSame( 'edited', file_get_contents( $this->dest . 'wp-content/themes/pub-theme-imported/templates/index.html' ) );
	}

	/**
	 * A child theme of a renamed theme is pointed at the new slug.
	 */
	public function test_child_theme_follows_renamed_parent() {
		$this->write_theme( $this->dest . 'wp-content/themes/twentytwentyfive', '1.0', 'stock' );
		$this->write_theme( $this->source . 'wp-content/themes/twentytwentyfive', '1.0', 'edited' );
		$this->write( $this->source . 'wp-content/themes/child/style.css', "/*\nTheme Name: Child\nTemplate: twentytwentyfive\n*/\n" );

		$this->restore();

		$this->assertStringContainsString( "Template: twentytwentyfive-imported\n", file_get_contents( $this->dest . 'wp-content/themes/child/style.css' ) );
	}

	/**
	 * A theme the site has its own copy of is overwritten, as before.
	 */
	public function test_unmanaged_theme_is_overwritten() {
		$this->write_theme( $this->dest . 'wp-content/themes/custom', '1.0', 'old' );
		$this->write_theme( $this->source . 'wp-content/themes/custom', '1.0', 'new' );

		$restorer = $this->restore();

		$this->assertSame( array(), $restorer->get_theme_renames() );
		$this->assertSame( 'new', file_get_contents( $this->dest . 'wp-content/themes/custom/templates/index.html' ) );
	}

	/**
	 * Runs the restorer.
	 *
	 * @return FileRestorer
	 */
	private function restore() {
		$restorer = new FileRestorer( $this->source, $this->dest, null, $this->managed );
		$this->assertTrue( $restorer->enqueue_files() );
		$this->assertTrue( $restorer->restore_files() );

		return $restorer;
	}

	/**
	 * Writes a theme.
	 *
	 * @param string $dir      The theme directory.
	 * @param string $version  The theme version.
	 * @param string $template The contents of templates/index.html.
	 */
	private function write_theme( $dir, $version, $template ) {
		$this->write( "$dir/style.css", "/*\nTheme Name: Theme\nVersion: $version\n*/\n" );
		$this->write( "$dir/templates/index.html", $template );
	}

	/**
	 * Writes a file, creating its directory.
	 *
	 * @param string $path     The file path.
	 * @param string $contents The file contents.
	 */
	private function write( $path, $contents ) {
		wp_mkdir_p( dirname( $path ) );
		file_put_contents( $path, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
	}

	/**
	 * Removes a directory recursively, without following symlinks.
	 *
	 * @param string $dir The directory.
	 */
	private function remove( $dir ) {
		if ( is_link( $dir ) || is_file( $dir ) ) {
			unlink( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			return;
		}
		if ( ! is_dir( $dir ) ) {
			return;
		}
		foreach ( scandir( $dir ) as $entry ) {
			if ( '.' !== $entry && '..' !== $entry ) {
				$this->remove( "$dir/$entry" );
			}
		}
		rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
	}
}
