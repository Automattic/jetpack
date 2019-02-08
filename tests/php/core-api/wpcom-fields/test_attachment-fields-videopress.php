<?php

/**
 * Tests that Attachments do have VideoPress data in REST API
 * responses if the VideoPress Module is active.
 *
 * @group videopress
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Attachment_VideoPress_Field extends WP_Test_Jetpack_REST_Testcase {
	/**
	 * Checks that the jetpack_videopress_guid field is included in the schema
	 */
	public function test_attachment_fields_videopress_get_schema() {
		$plugin = new WPCOM_REST_API_V2_Attachment_VideoPress_Field();
		$schema = $plugin->get_schema();

		$this->assertSame(
			array(
				'$schema' => 'http://json-schema.org/draft-04/schema#',
				'title'   => 'jetpack_videopress_guid',
				'type'    => 'string|null',
				'context' => array( 'view', 'edit' ),
				'default' => null,
			),
			$schema
		);
	}

	/**
	 * Checks that the jetpack_videopress_guid field is filled with the VideoPress GUID
	 */
	public function test_attachment_fields_videopress_get() {
		$mock = $this->getMockBuilder( 'WPCOM_REST_API_V2_Attachment_VideoPress_Field' )
						->setMethods( array( 'get_videopress_guid' ) )
						->getMock();

		$mock->expects( $this->exactly( 1 ) )
				->method( 'get_videopress_guid' )
				->will(
					$this->returnValue( 'mocked_videopress_guid' )
				);

		$attachment_id = $this->factory->attachment->create_upload_object( JETPACK__PLUGIN_DIR . 'tests/php/jetpack-icon.jpg', 0 );
		$object        = array(
			'id' => $attachment_id,
		);
		$request       = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $attachment_id ) );
		$guid          = $mock->get( $object, $request );

		$this->assertSame( 'mocked_videopress_guid', $guid );
	}

	/**
	 * Checks that the jetpack_videopress_guid field is removed for non videos
	 */
	public function test_attachment_fields_videopress_remove_for_non_videos() {
		$plugin                     = new WPCOM_REST_API_V2_Attachment_VideoPress_Field();
		$attachment                 = new stdClass();
		$attachment->post_mime_type = 'non-video/test';
		$response                   = new stdClass();
		$response->data             = array(
			'jetpack_videopress_guid' => 'my-guid',
		);
		$response                   = $plugin->remove_field_for_non_videos( $response, $attachment );
		$this->assertArrayNotHasKey( 'jetpack_videopress_guid', $response->data );
	}
}
