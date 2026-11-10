<?php
/**
 * Tests that Attachments do have VideoPress data in REST API
 * responses if the VideoPress Module is active.
 *
 * @package automattic/jetpack
 */

/**
 * The base testcase class.
 */
require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

use Automattic\Jetpack\VideoPress\WPCOM_REST_API_V2_Attachment_VideoPress_Data;
use PHPUnit\Framework\Attributes\Group;

/**
 * VideoPress Data field tests.
 *
 * @group videopress
 * @group rest-api
 */
#[Group( 'videopress' )]
#[Group( 'rest-api' )]
class WPCOM_REST_API_V2_Attachment_VideoPress_Data_Test extends Jetpack_REST_TestCase {
	/**
	 * Checks that the jetpack_videopress field is removed for non videos
	 */
	public function test_attachment_fields_videopress_remove_for_non_videos() {
		$plugin = new WPCOM_REST_API_V2_Attachment_VideoPress_Data();

		$attachment                 = new stdClass();
		$attachment->post_mime_type = 'non-video/test';
		'@phan-var WP_Post $attachment'; // Pretend it's the right class.

		$response       = new stdClass();
		$response->data = array(
			'jetpack_videopress' => array(
				'guid'   => 'my-guid',
				'rating' => 'G',
			),
		);
		'@phan-var WP_REST_Response $response'; // Pretend it's the right class.

		$response = $plugin->remove_field_for_non_videos( $response, $attachment );
		$this->assertArrayNotHasKey( 'jetpack_videopress', $response->data );
	}
}
