<?php
/**
 * Jetpack's Pre-Connection JITMs class.
 *
 * @package jetpack
 */

/**
 * Jetpack's Pre-Connection JITMs. These can be displayed with the JITM package.
 */
class Jetpack_Pre_Connection_JITMs {

	/**
	 * Returns all the pre-connection messages.
	 *
	 * @return array An array containing the pre-connection JITM messages.
	 */
	private function get_raw_messages() {
		$jetpack_setup_url = $this->generate_admin_url(
			array(
				'page'    => 'jetpack',
				'#/setup' => '',
			)
		);

		$messages = array(
			array(
				'id'             => 'jpsetup-upload',
				'message_path'   => '/wp:upload:admin_notices/',
				'message'        => __( 'Do you want lightning-fast images?', 'jetpack' ),
				'description'    => __( 'Set up Jetpack, enable Site Accelerator, and start serving your images lightning fast, for free.', 'jetpack' ),
				'button_link'    => $jetpack_setup_url,
				'button_caption' => __( 'Set up Jetpack', 'jetpack' ),
			),
			array(
				'id'             => 'jpsetup-widgets',
				'message_path'   => '/wp:widgets:admin_notices/',
				'message'        => __( 'Looking for even more widgets?', 'jetpack' ),
				'description'    => __( 'Set up Jetpack for great additional widgets that display business contact info and maps, blog stats, and top posts.', 'jetpack' ),
				'button_link'    => $jetpack_setup_url,
				'button_caption' => __( 'Set up Jetpack', 'jetpack' ),
			),
		);

		if ( wp_count_posts()->publish >= 5 ) {
			$messages[] = array(
				'id'             => 'jpsetup-posts',
				'message_path'   => '/wp:edit-post:admin_notices/',
				'message'        => __( 'Do you know which of these posts gets the most traffic?', 'jetpack' ),
				'description'    => __( 'Set up Jetpack to get in-depth stats about your content and visitors.', 'jetpack' ),
				'button_link'    => $jetpack_setup_url,
				'button_caption' => __( 'Set up Jetpack', 'jetpack' ),
			);
		}

		return $messages;
	}

	/**
	 * Adds the input query arguments to the admin url.
	 *
	 * @param array $args The query arguments.
	 *
	 * @return string The admin url.
	 */
	private function generate_admin_url( $args ) {
		$url = add_query_arg( $args, admin_url( 'admin.php' ) );
		return $url;
	}

	/**
	 * Add the Jetpack pre-connection JITMs to the list of pre-connection JITM messages.
	 *
	 * @param array $pre_connection_messages An array of pre-connection JITMs.
	 *
	 * @return array The array of pre-connection JITMs.
	 */
	public function add_pre_connection_jitms( $pre_connection_messages ) {
		$jetpack_messages = $this->get_raw_messages();

		if ( ! is_array( $pre_connection_messages ) ) {
			// The incoming messages aren't an array, so just return Jetpack's messages.
			return $jetpack_messages;
		}

		return array_merge( $pre_connection_messages, $jetpack_messages );
	}
}
