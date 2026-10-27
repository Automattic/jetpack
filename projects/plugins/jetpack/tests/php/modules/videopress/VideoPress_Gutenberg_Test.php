<?php
/**
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Current_Plan;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/videopress/class.videopress-gutenberg.php';

/**
 * @covers VideoPress_Gutenberg
 */
#[CoversClass( VideoPress_Gutenberg::class )]
class VideoPress_Gutenberg_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @dataProvider upload_availability
	 * @param bool $available Whether the site has VideoPress.
	 */
	#[DataProvider( 'upload_availability' )]
	public function test_upload_interception_respects_entitlement_without_removing_helpers( $available ) {
		$saved_scripts         = $GLOBALS['wp_scripts'] ?? null;
		$GLOBALS['wp_scripts'] = new WP_Scripts();
		$plan                  = \Patchwork\redefine( Current_Plan::class . '::supports', \Patchwork\always( $available ) );
		$modules               = static function () {
			return array( 'videopress' );
		};

		add_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );
		add_filter( 'jetpack_active_modules', $modules );

		try {
			VideoPress_Gutenberg::init()->override_video_upload();

			$handle = 'jetpack-videopress-gutenberg-override-video-upload';
			$this->assertTrue( wp_script_is( $handle, 'enqueued' ) );
			$this->assertContains(
				'window.videoPressGutenbergUploadEnabled = ' . ( $available ? 'true' : 'false' ) . ';',
				wp_scripts()->get_data( $handle, 'before' )
			);
		} finally {
			remove_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );
			remove_filter( 'jetpack_active_modules', $modules );
			if ( $plan ) {
				\Patchwork\restore( $plan );
			}
			$GLOBALS['wp_scripts'] = $saved_scripts;
		}
	}

	/**
	 * @return array
	 */
	public static function upload_availability() {
		return array(
			'entitled'   => array( true ),
			'unentitled' => array( false ),
		);
	}
}
