<?php

/**
 * Tests that Attachments do have VideoPress data in REST API
 * responses if the VideoPress Module is active.
 *
 * @group videopress
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Attachment_VideoPress_Field extends WP_Test_Jetpack_REST_Testcase {
	public function test_attachment_fields_videopress_get_schema() {
		$plugin = new WPCOM_REST_API_V2_Attachment_VideoPress_Field;
		$schema = $plugin->get_schema();

		$this->assertSame( array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title'   => 'jetpack_videopress',
			'type'    => 'object|null',
			'context' => array( 'view', 'edit' ),
			'default' => null,
		), $schema );
	}

	public function test_attachment_fields_videopress_get() {
		$mock = $this->getMockBuilder( 'WPCOM_REST_API_V2_Attachment_VideoPress_Field' )
		             ->setMethods( array( 'get_videopress_data' ) )
		             ->getMock();

		$mock->expects( $this->exactly( 1 ) )
		     ->method( 'get_videopress_data' )
		     ->will( $this->returnValue( array(
			     'mocked_videopress_data' => 'foo',
		     ) ) );

		$attachment_id = $this->factory->attachment->create_upload_object( JETPACK__PLUGIN_DIR . 'tests/php/jetpack-icon.jpg', 0 );
		$object        = array(
			'id' => $attachment_id,
		);
		$request       = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $attachment_id ) );

		$data = $mock->get( $object, $request );

		$this->assertSame( array(
			'mocked_videopress_data' => 'foo',
		), $data );
	}
}
