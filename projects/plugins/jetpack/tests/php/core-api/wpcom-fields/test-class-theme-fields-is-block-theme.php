<?php
/**
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Theme_Fields_Is_Block_Theme extends WP_Test_Jetpack_REST_Testcase {
	protected static $admin_id;

	public static function set_up_before_class() {
		self::$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
	}

	public function set_up() {
		wp_set_current_user( self::$admin_id );
	}

	public function test_theme_is_block_theme() {
		switch_theme( 'block-theme' );

		$response = self::perform_active_theme_request();
		$result   = $response->get_data();

		$this->assertTrue( isset( $result[0]['is_block_theme'] ) );
		$this->assertTrue( $result[0]['is_block_theme'] );
	}

	public function test_theme_is_not_block_theme() {
		switch_theme( 'rest-api' );

		$response = self::perform_active_theme_request();
		$result   = $response->get_data();

		$this->assertTrue( isset( $result[0]['is_block_theme'] ) );
		$this->assertFalse( $result[0]['is_block_theme'] );
	}

	/**
	 * Performs a REST API request for the active theme.
	 *
	 * @return WP_REST_Response The request's response.
	 */
	protected function perform_active_theme_request() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/themes' );
		$request->set_param( 'status', 'active' );

		return rest_get_server()->dispatch( $request );
	}
}
