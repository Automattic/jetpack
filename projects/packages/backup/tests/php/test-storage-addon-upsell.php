<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Backup\V0004;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for storage addon fetch
 *
 * @package automattic/jetpack-backup
 */
class Test_Storage_Addon_Upsell extends TestCase {
	const GB_IN_BYTES = 1024 * 1024 * 1024;
	const TB_IN_BYTES = GB_IN_BYTES * 1024;

	/**
	 * Data provider for testing
	 */
	public function storage_addon_upsell_provider() {
		$addons = array(
			'10GB'  => 'jetpack_backup_addon_storage_10gb_monthly',
			'100GB' => 'jetpack_backup_addon_storage_100gb_monthly',
			'1TB'   => 'jetpack_backup_addon_storage_1tb_monthly',
		);

		yield 'Over limit needs 1TB'   => array( self::TB_IN_BYTES * 2, self::TB_IN_BYTES, $addons['1TB'] );
		yield 'Over limit needs 100GB' => array( self::TB_IN_BYTES + self::GB_IN_BYTES * 50, self::TB_IN_BYTES, $addons['100GB'] );
		yield 'Over limit needs 10GB'  => array( self::TB_IN_BYTES + self::GB_IN_BYTES * 5, self::TB_IN_BYTES, $addons['10GB'] );
		yield 'Under limit with 1GB'   => array( self::GB_IN_BYTES / 2, self::GB_IN_BYTES, $addons['10GB'] );
		yield 'Under limit with 10GB'  => array( self::GB_IN_BYTES * 5, self::GB_IN_BYTES * 10, $addons['10GB'] );
		yield 'Under limit with 1TB'   => array( self::GB_IN_BYTES * 500, self::TB_IN_BYTES, $addons['1TB'] );
	}

	/**
	 * Test for addon storage upsell suggestion
	 *
	 * @param int    $storage_used      Used storage in bytes.
	 * @param int    $storage_limit     Storage limit in bytes.
	 * @param string $expected_addon Product slug of expected storage addon.
	 * @dataProvider storage_addon_upsell_provider
	 */
	public function test_storage_addon_upsell_offer( $storage_used, $storage_limit, $expected_addon ) {
		$this->assertEquals(
			$expected_addon,
			Jetpack_Backup::get_storage_addon_upsell_slug( $storage_used, $storage_limit )
		);
	}
}
