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
			'stray code in uploads'          => array( 'uploads', 'none', true ),
			'a plugin file'                  => array( 'plugin', 'plugin', false ),
			'loose file in plugins folder'   => array( 'loose-plugin-file', 'none', true ),
			'unchanged core file'            => array( 'core', 'core', false ),
			'stray file among core files'    => array( 'stray-core', 'none', true ),
			'core file, checksums unknown'   => array( 'core', 'unknown', false, false ),
			'site configuration'             => array( 'wp-config', 'none', false ),
			'loader of a separate WP folder' => array( 'site-index', 'none', false ),
			'beside a separate WP folder'    => array( 'site-root', 'none', false ),
		);
	}

	/**
	 * @dataProvider provide_files
	 *
	 * @param string $where      Which file to write.
	 * @param string $owner      The owner type it should get.
	 * @param bool   $can_delete Whether the dashboard may delete it.
	 * @param bool   $checksums  Whether WordPress.org's checksums could be fetched.
	 */
	#[DataProvider( 'provide_files' )]
	public function test_only_stray_files_can_be_deleted( $where, $owner, $can_delete, $checksums = true ) {
		set_transient(
			Threat_File::CHECKSUMS_CACHE,
			array(
				'version'   => get_bloginfo( 'version' ),
				'locale'    => 'en_US',
				'checksums' => $checksums ? array( 'wp-includes/protect-test-core.php' => md5( '<?php' ) ) : array(),
			)
		);
		$paths = array(
			'uploads'           => WP_CONTENT_DIR . '/uploads/protect-test.php',
			'plugin'            => WP_PLUGIN_DIR . '/protect-test-plugin/includes/helper.php',
			'loose-plugin-file' => WP_PLUGIN_DIR . '/protect-test-loose.php',
			'core'              => ABSPATH . 'wp-includes/protect-test-core.php',
			'stray-core'        => ABSPATH . 'wp-includes/protect-test-stray.php',
			'wp-config'         => ABSPATH . 'protect-test/wp-config.php',
			'site-index'        => dirname( ABSPATH ) . '/protect-test-site/index.php',
			'site-root'         => dirname( ABSPATH ) . '/protect-test-site/protect-test.php',
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

	/**
	 * Restore a changed core file, with WordPress.org serving the given copy of it.
	 *
	 * @param string $download What WordPress.org serves.
	 * @return array The restore's result, and the file's path.
	 */
	private function restore_core_file( $download ) {
		set_transient(
			Threat_File::CHECKSUMS_CACHE,
			array(
				'version'   => get_bloginfo( 'version' ),
				'locale'    => 'en_US',
				'checksums' => array( 'wp-includes/protect-test-core.php' => md5( '<?php // original' ) ),
			)
		);
		$path = $this->write( ABSPATH . 'wp-includes/protect-test-core.php', '<?php // changed' );
		chmod( $path, 0640 ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_chmod
		$serve = function () use ( $download ) {
			return array(
				'headers'  => array(),
				'body'     => $download,
				'response' => array( 'code' => 200 ),
				'cookies'  => array(),
			);
		};
		add_filter( 'pre_http_request', $serve );
		$result = Threat_File::restore( $path );
		remove_filter( 'pre_http_request', $serve );
		clearstatcache();
		return array( $result, $path );
	}

	/**
	 * Files in a folder that a restore might have left behind.
	 *
	 * @param string $path A file in the folder.
	 * @return string[]
	 */
	private static function temp_files( $path ) {
		return glob( dirname( $path ) . '/*.tmp' );
	}

	public function test_restore_replaces_the_file_whole_and_keeps_its_mode() {
		list( $result, $path ) = $this->restore_core_file( '<?php // original' );

		$this->assertTrue( $result );
		$this->assertSame( '<?php // original', file_get_contents( $path ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$this->assertSame( 0640, fileperms( $path ) & 0777 );
		$this->assertSame( array(), self::temp_files( $path ) );
	}

	public function test_restore_refuses_a_download_that_fails_its_checksum_before_writing() {
		list( $result, $path ) = $this->restore_core_file( '<?php // localized' );

		$this->assertSame( 'original_mismatch', $result->get_error_code() );
		$this->assertSame( '<?php // changed', file_get_contents( $path ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$this->assertSame( array(), self::temp_files( $path ) );
	}
}
