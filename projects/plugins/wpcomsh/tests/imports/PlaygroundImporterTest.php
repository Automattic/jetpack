<?php
/**
 * PlaygroundImporterTest file.
 *
 * @package wpcomsh
 */

// Include base classes.
require_once __DIR__ . '/../../imports/playground/class-playground-importer.php';

use Imports\Playground_Importer;

/**
 * Class PlaygroundImporterTest
 */
class PlaygroundImporterTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const FIXTURE_NEW_SQLITE_PATH     = __DIR__ . '/fixtures/valid/wp-new-sqlite-path/';
	const FIXTURE_LEGACY_SQLITE_PATH  = __DIR__ . '/fixtures/valid/wp-legacy-sqlite-path/';
	const FIXTURE_INVALID_SQLITE_PATH = __DIR__ . '/fixtures/invalid/wp-invalid-sqlite-path/';

	/**
	 * Temporary folders created by a test, removed in tearDown.
	 *
	 * @var string[]
	 */
	private $temp_dirs = array();

	/**
	 * Remove temporary folders.
	 */
	public function tearDown(): void {
		foreach ( $this->temp_dirs as $dir ) {
			$this->remove_dir( $dir );
		}
		$this->temp_dirs = array();

		parent::tearDown();
	}

	/**
	 * Recursively remove a folder.
	 *
	 * @param string $dir The folder to remove.
	 */
	private function remove_dir( string $dir ) {
		foreach ( array_diff( scandir( $dir ), array( '.', '..' ) ) as $entry ) {
			$path = $dir . '/' . $entry;
			is_dir( $path ) ? $this->remove_dir( $path ) : unlink( $path );
		}
		rmdir( $dir );
	}

	/**
	 * Open an empty path.
	 */
	public function test_error_open_an_empty_file() {
		$importer = new Playground_Importer( 'rand-file', sys_get_temp_dir(), 'test_' );
		$result   = $importer->preprocess();

		$this->assertWPError( $result );
		$this->assertEquals( 'database-file-not-exists', $result->get_error_code() );
	}

	/**
	 * Test a not existing path.
	 */
	public function test_error_not_valid_backup() {
		$this->assertFalse( Playground_Importer::is_valid( '.' ) );
	}

	/**
	 * A backup with a database folder but no database file is not valid.
	 */
	public function test_is_valid_with_invalid_sqlite_path() {
		$this->assertFalse( Playground_Importer::is_valid( self::FIXTURE_INVALID_SQLITE_PATH ) );
	}

	/**
	 * No database path is resolved and preprocessing fails when the database file is missing.
	 */
	public function test_preprocess_with_invalid_sqlite_path() {
		$importer = new Playground_Importer( 'rand-file', self::FIXTURE_INVALID_SQLITE_PATH, 'test_' );

		$this->assertNull( $importer->get_sqlite_db_path() );

		$result = $importer->preprocess();
		$this->assertWPError( $result );
		$this->assertEquals( 'database-file-not-exists', $result->get_error_code() );
	}

	/**
	 * A backup storing the database in the legacy `wp-content/database/.ht.sqlite` location is valid.
	 */
	public function test_is_valid_with_legacy_sqlite_path() {
		$this->assertTrue( Playground_Importer::is_valid( self::FIXTURE_LEGACY_SQLITE_PATH ) );
	}

	/**
	 * The database path is resolved at the legacy location.
	 */
	public function test_get_sqlite_db_path_with_legacy_sqlite_path() {
		$importer = new Playground_Importer( 'rand-file', self::FIXTURE_LEGACY_SQLITE_PATH, 'test_' );

		$this->assertSame(
			self::FIXTURE_LEGACY_SQLITE_PATH . Playground_Importer::SQLITE_DB_PATH,
			$importer->get_sqlite_db_path()
		);
	}

	/**
	 * A backup storing the database in a random `.ht.<hash>` folder is valid.
	 */
	public function test_is_valid_with_random_sqlite_folder() {
		$this->assertTrue( Playground_Importer::is_valid( self::FIXTURE_NEW_SQLITE_PATH ) );
	}

	/**
	 * The database path is resolved inside the random `.ht.<hash>` folder.
	 */
	public function test_get_sqlite_db_path_with_random_sqlite_folder() {
		$importer = new Playground_Importer( 'rand-file', self::FIXTURE_NEW_SQLITE_PATH, 'test_' );

		$this->assertSame(
			self::FIXTURE_NEW_SQLITE_PATH . 'wp-content/database/.ht.545772851f3fee213914344d03a838af/.ht.sqlite',
			$importer->get_sqlite_db_path()
		);
	}

	/**
	 * The default location wins when both layouts are present.
	 */
	public function test_get_sqlite_db_path_prefers_default_location() {
		$destination = $this->create_backup_dir( true, true );
		$importer    = new Playground_Importer( 'rand-file', $destination, 'test_' );

		$this->assertSame( $destination . Playground_Importer::SQLITE_DB_PATH, $importer->get_sqlite_db_path() );
		$this->assertTrue( Playground_Importer::is_valid( $destination ) );
	}

	/**
	 * Null is returned when no database file exists.
	 */
	public function test_get_sqlite_db_path_returns_null_without_database() {
		$destination = $this->create_backup_dir( false, false );
		$importer    = new Playground_Importer( 'rand-file', $destination, 'test_' );

		$this->assertNull( $importer->get_sqlite_db_path() );
		$this->assertFalse( Playground_Importer::is_valid( $destination ) );
	}

	/**
	 * Create a temporary backup folder, optionally with a database file in each supported location.
	 *
	 * @param bool $with_default Whether to create `wp-content/database/.ht.sqlite`.
	 * @param bool $with_random  Whether to create `wp-content/database/.ht.<random>/.ht.sqlite`.
	 *
	 * @return string The trailing-slashed path to the backup folder.
	 */
	private function create_backup_dir( bool $with_default, bool $with_random ): string {
		$destination = trailingslashit( sys_get_temp_dir() ) . uniqid( 'playground-importer-test-' ) . '/';
		$database    = $destination . 'wp-content/database/';
		mkdir( $database, 0777, true );
		$this->temp_dirs[] = $destination;

		if ( $with_default ) {
			touch( $database . '.ht.sqlite' );
		}
		if ( $with_random ) {
			mkdir( $database . '.ht.abcdef0123456789' );
			touch( $database . '.ht.abcdef0123456789/.ht.sqlite' );
		}

		return $destination;
	}
}
