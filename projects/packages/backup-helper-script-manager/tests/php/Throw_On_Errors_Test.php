<?php
/**
 * Unit tests for the Throw_On_Errors class.
 *
 * @package automattic/jetpack-backup
 */

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Backup\V0005;

use Exception;
use PHPUnit\Framework\TestCase;

class Throw_On_Errors_Test extends TestCase {

	public function testRealpath() {
		$this->assertSame( '/', Throw_On_Errors::t_realpath( '/' ) );
		$this->assertSame( '/', Throw_On_Errors::t_realpath( '/usr/../' ) );
	}

	public function testRealpathNonExistentPath() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( "Unable to realpath( '/does/not/exist' )" );
		Throw_On_Errors::t_realpath( '/does/not/exist' );
	}

	public function testRealpathNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for realpath() is unset' );
		Throw_On_Errors::t_realpath( null );
	}

	public function testRealpathEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for realpath() is unset' );
		Throw_On_Errors::t_realpath( '' );
	}

	public function testFileExists() {
		// Make sure it behaves just like the native file_exists(), e.g. returns true for directories, devices, etc.
		$this->assertTrue( Throw_On_Errors::t_file_exists( '/etc/' ) );
		$this->assertTrue( Throw_On_Errors::t_file_exists( '/etc/profile' ) );
		$this->assertTrue( Throw_On_Errors::t_file_exists( '/dev/null' ) );
	}

	public function testFileExistsNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for file_exists() is unset' );
		Throw_On_Errors::t_file_exists( null );
	}

	public function testFileExistsEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for file_exists() is unset' );
		Throw_On_Errors::t_file_exists( '' );
	}

	public function testIsReadable() {

		$temp_file = tempnam( sys_get_temp_dir(), 'test' );
		$this->assertTrue( Throw_On_Errors::t_is_readable( $temp_file ) );

		chmod( $temp_file, 0000 );
		$this->assertFalse( Throw_On_Errors::t_is_readable( $temp_file ) );

		chmod( $temp_file, 0755 );
		$this->assertTrue( Throw_On_Errors::t_is_readable( $temp_file ) );

		Throw_On_Errors::t_unlink( $temp_file );
	}

	public function testIsReadableDirectory() {

		$temp_dir = tempnam( sys_get_temp_dir(), 'test' );
		Throw_On_Errors::t_unlink( $temp_dir );
		Throw_On_Errors::t_mkdir( $temp_dir );

		$this->assertTrue( Throw_On_Errors::t_is_readable( $temp_dir ) );

		chmod( $temp_dir, 0000 );
		$this->assertFalse( Throw_On_Errors::t_is_readable( $temp_dir ) );

		chmod( $temp_dir, 0755 );
		$this->assertTrue( Throw_On_Errors::t_is_readable( $temp_dir ) );

		Throw_On_Errors::t_rmdir( $temp_dir );
	}

	public function testIsReadableNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for is_readable() is unset' );
		Throw_On_Errors::t_is_readable( null );
	}

	public function testIsReadableEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for is_readable() is unset' );
		Throw_On_Errors::t_is_readable( '' );
	}

	public function testIsWritable() {

		$temp_file = tempnam( sys_get_temp_dir(), 'test' );
		$this->assertTrue( Throw_On_Errors::t_is_writable( $temp_file ) );

		chmod( $temp_file, 0000 );
		$this->assertFalse( Throw_On_Errors::t_is_writable( $temp_file ) );

		chmod( $temp_file, 0755 );
		$this->assertTrue( Throw_On_Errors::t_is_writable( $temp_file ) );

		Throw_On_Errors::t_unlink( $temp_file );
	}

	public function testIsWritableDirectory() {

		$temp_dir = tempnam( sys_get_temp_dir(), 'test' );
		Throw_On_Errors::t_unlink( $temp_dir );
		Throw_On_Errors::t_mkdir( $temp_dir );

		$this->assertTrue( Throw_On_Errors::t_is_writable( $temp_dir ) );

		chmod( $temp_dir, 0000 );
		$this->assertFalse( Throw_On_Errors::t_is_writable( $temp_dir ) );

		chmod( $temp_dir, 0755 );
		$this->assertTrue( Throw_On_Errors::t_is_writable( $temp_dir ) );

		Throw_On_Errors::t_rmdir( $temp_dir );
	}

	public function testIsWritableNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for is_writable() is unset' );
		Throw_On_Errors::t_is_writable( null );
	}

	public function testIsWritableEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for is_writable() is unset' );
		Throw_On_Errors::t_is_writable( '' );
	}

	public function testFilesize() {
		$this->assertTrue( Throw_On_Errors::t_filesize( '/etc/profile' ) > 0 );
		$this->assertSame( 0, Throw_On_Errors::t_filesize( '/dev/null' ) );
	}

	public function testFilesizeNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for filesize() is unset' );
		Throw_On_Errors::t_filesize( null );
	}

	public function testFilesizeEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for filesize() is unset' );
		Throw_On_Errors::t_filesize( '' );
	}

	public function testFilemtime() {
		$this->assertTrue( Throw_On_Errors::t_filemtime( '/etc/profile' ) > 0 );
	}

	public function testFilemtimeNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for filemtime() is unset' );
		Throw_On_Errors::t_filemtime( null );
	}

	public function testFilemtimeEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for filemtime() is unset' );
		Throw_On_Errors::t_filemtime( '' );
	}

	public function testIsDir() {
		$this->assertTrue( Throw_On_Errors::t_is_dir( '/' ) );
		$this->assertFalse( Throw_On_Errors::t_is_dir( '/etc/profile' ) );
	}

	public function testIsDirNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for is_dir() is unset' );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_is_dir( null );
	}

	public function testIsDirEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for is_dir() is unset' );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_is_dir( '' );
	}

	public function testMkdir() {
		$temp_dir = tempnam( sys_get_temp_dir(), 'test' );
		Throw_On_Errors::t_unlink( $temp_dir );
		$this->assertFalse( Throw_On_Errors::t_is_dir( $temp_dir ) );
		Throw_On_Errors::t_mkdir( $temp_dir, 0755 );
		$this->assertTrue( Throw_On_Errors::t_is_dir( $temp_dir ) );
		Throw_On_Errors::t_rmdir( $temp_dir );
	}

	public function testMkdirNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( "mkdir( '', 0777, false ) failed" );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_mkdir( null );
	}

	public function testMkdirEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( "mkdir( '', 0777, false ) failed" );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_mkdir( '' );
	}

	public function testMkdirNullPermissions() {
		$temp_dir = tempnam( sys_get_temp_dir(), 'test' );
		Throw_On_Errors::t_unlink( $temp_dir );
		$this->assertFalse( Throw_On_Errors::t_is_dir( $temp_dir ) );

		$this->expectException( Exception::class );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_mkdir( $temp_dir, null );
		$this->assertFalse( Throw_On_Errors::t_is_dir( $temp_dir ) );
	}

	public function testMkdirExistingDir() {
		$temp_dir = tempnam( sys_get_temp_dir(), 'test' );
		Throw_On_Errors::t_unlink( $temp_dir );
		$this->assertFalse( Throw_On_Errors::t_is_dir( $temp_dir ) );
		Throw_On_Errors::t_mkdir( $temp_dir );
		$this->assertTrue( Throw_On_Errors::t_is_dir( $temp_dir ) );

		$this->expectException( Exception::class );
		$this->expectExceptionMessage( "mkdir( '$temp_dir', 0777, false ) failed: mkdir(): File exists" );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_mkdir( $temp_dir );
		$this->assertTrue( Throw_On_Errors::t_is_dir( $temp_dir ) );
		Throw_On_Errors::t_rmdir( $temp_dir );
		$this->assertFalse( Throw_On_Errors::t_is_dir( $temp_dir ) );
	}

	public function testScandir() {
		$listing = Throw_On_Errors::t_scandir( '/' );
		sort( $listing );
		$this->assertTrue( count( $listing ) > 2 );
		$this->assertSame( '.', $listing[0] );
		$this->assertSame( '..', $listing[1] );
	}

	public function testScandirNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Directory for scandir() is unset' );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_scandir( null );
	}

	public function testScandirEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Directory for scandir() is unset' );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_scandir( '' );
	}

	public function testRmdir() {
		$temp_dir = tempnam( sys_get_temp_dir(), 'test' );
		Throw_On_Errors::t_unlink( $temp_dir );
		Throw_On_Errors::t_mkdir( $temp_dir );
		$this->assertTrue( Throw_On_Errors::t_is_dir( $temp_dir ) );
		Throw_On_Errors::t_rmdir( $temp_dir );
		$this->assertFalse( Throw_On_Errors::t_is_dir( $temp_dir ) );
	}

	public function testRmdirNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Directory for mkdir() is unset' );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_rmdir( null );
	}

	public function testRmdirEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Directory for mkdir() is unset' );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_rmdir( '' );
	}

	public function testUnlink() {
		$temp_file = tempnam( sys_get_temp_dir(), 'test' );
		$this->assertTrue( Throw_On_Errors::t_file_exists( $temp_file ) );
		Throw_On_Errors::t_unlink( $temp_file );
		$this->assertFalse( Throw_On_Errors::t_file_exists( $temp_file ) );
	}

	public function testUnlinkNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( "unlink( '' ) failed" );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_unlink( null );
	}

	public function testUnlinkEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( "unlink( '' ) failed" );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_unlink( '' );
	}

	public function testFilePutContents() {
		$temp_file = tempnam( sys_get_temp_dir(), 'test' );
		Throw_On_Errors::t_unlink( $temp_file );

		$data = 'foo';
		Throw_On_Errors::t_file_put_contents( $temp_file, $data );
		$this->assertSame( strlen( $data ), Throw_On_Errors::t_filesize( $temp_file ) );

		Throw_On_Errors::t_unlink( $temp_file );
	}

	public function testFilePutContentsNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for f_p_c() is unset' );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_file_put_contents( null, null );
	}

	public function testFilePutContentsEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for f_p_c() is unset' );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_file_put_contents( '', null );
	}

	public function testFileGetContents() {
		$temp_file = tempnam( sys_get_temp_dir(), 'test' );
		Throw_On_Errors::t_unlink( $temp_file );

		$data = 'foo';
		Throw_On_Errors::t_file_put_contents( $temp_file, $data );
		$this->assertSame( $data, Throw_On_Errors::t_file_get_contents( $temp_file ) );

		Throw_On_Errors::t_unlink( $temp_file );
	}

	public function testFileGetContentsNullParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for f_g_c() is unset' );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_file_get_contents( null );
	}

	public function testFileGetContentsEmptyParams() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Filename for f_g_c() is unset' );
		/** @noinspection PhpParamsInspection */
		Throw_On_Errors::t_file_get_contents( '' );
	}
}
