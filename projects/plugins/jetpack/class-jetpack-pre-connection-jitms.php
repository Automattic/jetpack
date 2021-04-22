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
		$messages = array(
			array(
				'id'             => 'jpsetup-upload',
				'message_path'   => '/wp:upload:admin_notices/',
				'message'        => __( 'Do you want lightning-fast images?', 'jetpack' ),
				'description'    => __( 'Set up Jetpack, enable Site Accelerator, and start serving your images lightning fast, for free.', 'jetpack' ),
				'button_caption' => __( 'Set up Jetpack', 'jetpack' ),
			),
			array(
				'id'             => 'jpsetup-widgets',
				'message_path'   => '/wp:widgets:admin_notices/',
				'message'        => __( 'Looking for even more widgets?', 'jetpack' ),
				'description'    => __( 'Set up Jetpack for great additional widgets that display business contact info and maps, blog stats, and top posts.', 'jetpack' ),
				'button_caption' => __( 'Set up Jetpack', 'jetpack' ),
			),
		);

		if ( wp_count_posts()->publish >= 5 ) {
			$messages[] = array(
				'id'             => 'jpsetup-posts',
				'message_path'   => '/wp:edit-post:admin_notices/',
				'message'        => __( 'Do you know which of these posts gets the most traffic?', 'jetpack' ),
				'description'    => __( 'Set up Jetpack to get in-depth stats about your content and visitors.', 'jetpack' ),
				'button_caption' => __( 'Set up Jetpack', 'jetpack' ),
			);
		}

		foreach ( $messages as $key => $message ) {
			/*
			 * Add Connect URL to each message, with from including jitm id.
			 */
			$jetpack_setup_url = Jetpack::init()->build_connect_url(
				true,
				false,
				sprintf( 'pre-connection-jitm-%s', $message['id'] )
			);
			// Add parameter to URL. Since we mention accepting ToS when clicking, no need to ask again on wpcom.
			$jetpack_setup_url = add_query_arg( 'auth_approved', 'true', $jetpack_setup_url );

			$messages[ $key ]['button_link'] = $jetpack_setup_url;

			/*
			 * Add ToS acceptance message to JITM description
			 */
			$messages[ $key ]['description'] .= sprintf(
				'<br /><br />%s',
				\jetpack_render_tos_blurb( false )
			);
		}

		return $messages;
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
