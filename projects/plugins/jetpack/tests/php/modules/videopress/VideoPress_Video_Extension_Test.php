<?php
/**
 * Tests for the videopress-video extended-block extension.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
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

	/**
	 * Temporary block.json written at the path register_videopress_playlist_block()
	 * reads by default.  Set to null when the build output already exists (so
	 * we don't delete a file we didn't create).
	 *
	 * @var string|null
	 */
	private $created_fixture_dir = null;

	/**
	 * Determine the path where the playlist block.json is expected.
	 *
	 * @return string Absolute path to the block.json metadata file.
	 */
	private function block_json_path() {
		$initializer_dir = dirname( ( new ReflectionClass( VideoPress_Initializer::class ) )->getFileName() );
		return $initializer_dir . '/../build/block-editor/blocks/playlist/block.json';
	}

	/**
	 * Create a minimal block.json fixture at the package build path so the
	 * registrar can succeed in a build-less test environment.
	 */
	protected function set_up() {
		parent::set_up();

		$block_json = $this->block_json_path();

		if ( ! file_exists( $block_json ) ) {
			$fixture_dir = dirname( $block_json );
			if ( ! is_dir( $fixture_dir ) ) {
				mkdir( $fixture_dir, 0755, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
				$this->created_fixture_dir = $fixture_dir;
			}
			file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
				$block_json,
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
	}

	/**
	 * Remove any fixture files and block registrations created by the test.
	 */
	protected function tear_down() {
		$registry = \WP_Block_Type_Registry::get_instance();
		if ( $registry->is_registered( 'videopress/playlist' ) ) {
			unregister_block_type( 'videopress/playlist' );
		}

		$block_json = $this->block_json_path();
		if ( $this->created_fixture_dir ) {
			if ( file_exists( $block_json ) ) {
				wp_delete_file( $block_json );
			}
			if ( is_dir( $this->created_fixture_dir ) ) {
				rmdir( $this->created_fixture_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
			}
			$this->created_fixture_dir = null;
		}

		parent::tear_down();
	}

	/**
	 * The videopress-video extension must wire up register_videopress_playlist_block()
	 * on the init hook.  With the VideoPress module active, the block should be
	 * registered — this was missing before the JETPACK-2520 fix.
	 */
	public function test_playlist_block_is_registered_when_videopress_module_active() {
		// Simulate the VideoPress module being active.
		add_filter( 'jetpack_active_modules', array( $this, 'filter_add_videopress_module' ) );

		// Re-fire the init hook so the extension's callback runs under the above filter.
		do_action( 'init' ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.NotLowercase

		remove_filter( 'jetpack_active_modules', array( $this, 'filter_add_videopress_module' ) );

		$this->assertTrue(
			\WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' ),
			'videopress/playlist must be registered when the VideoPress module is active.'
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
