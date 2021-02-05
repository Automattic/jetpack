<?php //phpcs:ignore Squiz.Commenting.FileComment.Missing
require_once __DIR__ . '/../../vendor/autoload.php';

// phpcs:disable

if ( ! function_exists( 'get_current_user_id' ) ) {
	/**
	 * Mocked get_current_user_id()
	 *
	 * @return int
	 */
	function get_current_user_id() {
		return 1;
	}
}

if ( ! function_exists( 'get_userdata' ) ) {
	/**
	 * Mock get_userdata()
	 *
	 * @param int $user_id User ID.
	 *
	 * @return stdClass
	 */
	function get_userdata( $user_id ) {
		$user_data                = new stdClass();
		$user_data->ID            = $user_id;
		$user_data->user_email    = 'test-user@automattic.com';
		$user_data->display_name  = 'Test User';
		$user_data->user_nicename = 'testuser';

		return $user_data;
	}
}

if ( ! function_exists( 'get_user_meta' ) ) {
	/**
	 * Mock get_user_meta()
	 *
	 * @param int    $user_id User ID.
	 * @param string $key key.
	 * @param bool   $single single.
	 *
	 * @return array|false|string
	 */
	function get_user_meta( $user_id, $key = '', $single = false ) {
		switch ( $key ) {
			case 'first_name':
				return 'Test';

			case 'last_name':
				return 'User';

			case 'nickname':
				return 'test';

			case 'password_history':
				return array();
			default:
				return false;
		}
	}
}
