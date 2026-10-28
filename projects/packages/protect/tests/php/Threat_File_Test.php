<?php
/**
 * Tests for working out what a flagged file belongs to.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Threat_File
 */
#[CoversClass( Threat_File::class )]
class Threat_File_Test extends BaseTestCase {

	/**
	 * Files written by a test, removed afterwards.
	 *
	 * @var string[]
	 */
	private $files = array();

	/**
	 * Remove the test's files and cached checksums.
	 */
	public function tear_down() {
		foreach ( $this->files as $file ) {
			wp_delete_file( $file );
		}
		delete_transient( Threat_File::CHECKSUMS_CACHE );
		parent::tear_down();
	}

	/**
	 * Write a file, creating its folder.
	 *
	 * @param string $path     The path.
	 * @param string $contents The contents.
	 * @return string The real path.
	 */
	private function write( $path, $contents = '<?php' ) {
		if ( ! is_dir( dirname( $path ) ) ) {
			mkdir( dirname( $path ), 0777, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		}
		file_put_contents( $path, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$this->files[] = $path;
		return realpath( $path );
	}

	/**
	 * Files, by where they are, with the owner type each gets and whether it may be deleted.
	 *
	 * @return array[]
	 */
	public static function provide_files() {
		return array(
			'stray code in uploads'        => array( 'uploads', 'none', true ),
			'a plugin file'                => array( 'plugin', 'plugin', false ),
			'loose file in plugins folder' => array( 'loose-plugin-file', 'none', true ),
			'unchanged core file'          => array( 'core', 'core', false ),
			'site configuration'           => array( 'wp-config', 'none', false ),
		);
	}

	/**
	 * @dataProvider provide_files
	 *
	 * @param string $where      Which file to write.
	 * @param string $owner      The owner type it should get.
	 * @param bool   $can_delete Whether the dashboard may delete it.
	 */
	#[DataProvider( 'provide_files' )]
	public function test_only_stray_files_can_be_deleted( $where, $owner, $can_delete ) {
		set_transient(
			Threat_File::CHECKSUMS_CACHE,
			array(
				'version'   => get_bloginfo( 'version' ),
				'checksums' => array( 'wp-includes/protect-test-core.php' => md5( '<?php' ) ),
			)
		);
		$paths = array(
			'uploads'           => WP_CONTENT_DIR . '/uploads/protect-test.php',
			'plugin'            => WP_PLUGIN_DIR . '/protect-test-plugin/includes/helper.php',
			'loose-plugin-file' => WP_PLUGIN_DIR . '/protect-test-loose.php',
			'core'              => ABSPATH . 'wp-includes/protect-test-core.php',
			'wp-config'         => ABSPATH . 'protect-test/wp-config.php',
		);
		if ( 'plugin' === $where ) {
			$this->write( WP_PLUGIN_DIR . '/protect-test-plugin/protect-test-plugin.php', "<?php\n/**\n * Plugin Name: Protect Test Plugin\n */\n" );
			wp_clean_plugins_cache( false );
		}
		$path = $this->write( $paths[ $where ] );

		$found = Threat_File::get_owner( $path );

		$this->assertSame( $owner, $found['type'], 'Owner' );
		$this->assertSame( $can_delete, Threat_File::can_delete( $path, $found ), 'Deletable' );
	}
}
