<?php
/**
 * Tests for the videopress-video extended-block extension.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversNothing;

/**
 * Regression coverage for JETPACK-2520: the videopress/playlist block was not
 * registered by the Jetpack plugin when only the Jetpack plugin was active.
 *
 * To run: jetpack docker phpunit jetpack -- --filter=VideoPress_Video_Extension_Test
 *
 * @coversNothing
 */
#[CoversNothing]
class VideoPress_Video_Extension_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/** @var string|null Temporary block.json fixture path. */
	private $temp_fixture = null;

	/** @var string|null Temporary directory holding the fixture. */
	private $temp_dir = null;

	/**
	 * Create a minimal block.json fixture in a system temp directory.
	 */
	public function set_up() {
		parent::set_up();

		$dir = sys_get_temp_dir() . '/videopress-test-' . uniqid();
		mkdir( $dir, 0755, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		$this->temp_dir     = $dir;
		$this->temp_fixture = $dir . '/block.json';
		file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			$this->temp_fixture,
			wp_json_encode(
				array(
					'apiVersion' => 3,
					'name'       => 'videopress/playlist',
					'title'      => 'Video Playlist',
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			)
		);
	}

	/**
	 * Remove the fixture files and any registered block type.
	 */
	public function tear_down() {
		$registry = \WP_Block_Type_Registry::get_instance();
		if ( $registry->is_registered( 'videopress/playlist' ) ) {
			unregister_block_type( 'videopress/playlist' );
		}

		if ( $this->temp_fixture && file_exists( $this->temp_fixture ) ) {
			wp_delete_file( $this->temp_fixture );
		}
		if ( $this->temp_dir && is_dir( $this->temp_dir ) ) {
			rmdir( $this->temp_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
		}

		$this->temp_fixture = null;
		$this->temp_dir     = null;

		parent::tear_down();
	}

	/**
	 * The extension must attach its registration callback to the init action.
	 */
	public function test_register_videopress_blocks_is_hooked_to_init() {
		$this->assertSame(
			10,
			has_action( 'init', 'Automattic\Jetpack\Extensions\VideoPress_Video\register_videopress_blocks' )
		);
	}

	/**
	 * When the VideoPress module is active the playlist block must be registered.
	 */
	public function test_playlist_block_registered_when_videopress_module_active() {
		add_filter( 'jetpack_active_modules', array( $this, 'filter_add_videopress_module' ) );
		Automattic\Jetpack\Extensions\VideoPress_Video\register_videopress_blocks( $this->temp_fixture );
		remove_filter( 'jetpack_active_modules', array( $this, 'filter_add_videopress_module' ) );

		$this->assertTrue(
			\WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' ),
			'videopress/playlist must be registered when the VideoPress module is active.'
		);
	}

	/**
	 * When the VideoPress module is inactive the playlist block must not be registered.
	 */
	public function test_playlist_block_not_registered_when_videopress_module_inactive() {
		Automattic\Jetpack\Extensions\VideoPress_Video\register_videopress_blocks( $this->temp_fixture );

		$this->assertFalse(
			\WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' ),
			'videopress/playlist must not be registered when the VideoPress module is inactive.'
		);
	}

	/**
	 * Helper: add the videopress module to the active-modules list.
	 *
	 * @param array $modules Active module slugs.
	 * @return array
	 */
	public function filter_add_videopress_module( $modules ) {
		$modules[] = 'videopress';
		return $modules;
	}
}
