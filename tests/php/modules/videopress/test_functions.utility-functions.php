<?php
/**
 * Class WP_Test_Jetpack_VideoPress_Utility_Functions
 *
 * Note that modules/videopress/utility-functions.php is automatically loaded and does not need to be required in this file.
 *
 * @package Jetpack
 */

/**
 * Tests Jetpack_VideoPress_Utility_Functions
 */
class WP_Test_Jetpack_VideoPress_Utility_Functions extends WP_UnitTestCase {

	/**
	 * Tests the VideoPress Flash to oEmbedable URL filter.
	 *
	 * @author kraftbj
	 * @covers ::jetpack_videopress_flash_embed_filter
	 * @since 8.1.0
	 */
	public function test_jetpack_videopress_flash_embed_filter_flash() {
		$content  = '<p><embed src="http://v.wordpress.com/YtfS78jH" type="application/x-shockwave-flash" width="600" height="338"></embed></p>';
		$contains = 'https://videopress.com/v/YtfS78jH';

		$filtered = jetpack_videopress_flash_embed_filter( $content );

		$this->assertContains( $contains, $filtered );
	}

}
