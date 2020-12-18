<?php

require_once dirname( dirname( __DIR__ ) ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

/**
 * Tests that Attachments do have VideoPress data in REST API
 * responses if the VideoPress Module is active.
 *
 * @group videopress
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Attachment_VideoPress_Field extends WP_Test_Jetpack_REST_Testcase {
	/**
	 * Checks that the jetpack_videopress field is included in the schema
	 */
	public function test_attachment_fields_videopress_get_schema() {
		$plugin = new WPCOM_REST_API_V2_Attachment_VideoPress_Field();
		$schema = $plugin->get_schema();

		$this->assertSame(
			array(
				'$schema'     => 'http://json-schema.org/draft-04/schema#',
				'title'       => 'jetpack_videopress',
				'type'        => 'object',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
				'description' => __( 'VideoPress Data', 'jetpack' ),
			),
			$schema
		);
	}

	/**
	 * Checks that the jetpack_videopress field is filled with the VideoPress GUID
	 */
	public function test_attachment_fields_videopress_get() {
		$mock = $this->getMockBuilder( 'WPCOM_REST_API_V2_Attachment_VideoPress_Field' )
						->setMethods( array( 'get_videopress_data' ) )
						->getMock();

		$mock->expects( $this->exactly( 1 ) )
				->method( 'get_videopress_data' )
				->will(
					$this->returnValue(
						array(
							'guid'   => 'mocked_videopress_guid',
							'rating' => 'G',
						)
					)
				);

		$attachment_id = $this->factory->attachment->create_upload_object( dirname( dirname( __DIR__ ) ) . '/jetpack-icon.jpg', 0 );
		$object        = array(
			'id' => $attachment_id,
		);
		$request       = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $attachment_id ) );
		$data          = $mock->get( $object, $request );

		$this->assertSame(
			array(
				'guid'   => 'mocked_videopress_guid',
				'rating' => 'G',
			),
			$data
		);
	}

	/**
	 * Checks that the jetpack_videopress field is removed for non videos
	 */
	public function test_attachment_fields_videopress_remove_for_non_videos() {
		$plugin                     = new WPCOM_REST_API_V2_Attachment_VideoPress_Field();
		$attachment                 = new stdClass();
		$attachment->post_mime_type = 'non-video/test';
		$response                   = new stdClass();
		$response->data             = array(
			'jetpack_videopress' => array(
				'guid'   => 'my-guid',
				'rating' => 'G',
			),
		);
		$response                   = $plugin->remove_field_for_non_videos( $response, $attachment );
		$this->assertArrayNotHasKey( 'jetpack_videopress', $response->data );
	}
}
