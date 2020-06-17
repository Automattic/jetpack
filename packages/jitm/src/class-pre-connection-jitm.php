<?php
/**
 * Jetpack's Pre-Connection JITM class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

use Automattic\Jetpack\JITMS\JITM;

/**
 * Jetpack pre-connection just in time messaging through out the admin.
 */
class Pre_Connection_JITM extends JITM {

	/**
	 * Returns all the pre-connection messages.
	 */
	private function get_raw_messages() {
		return array(
			array(
				'id'             => 'jpsetup-posts',
				'message_path'   => '/wp:edit-post:admin_notices/',
				'message'        => __( 'Do you know which of these posts gets the most traffic?', 'jetpack' ),
				'description'    => __( 'Set up Jetpack to get in-depth stats about your content and visitors.', 'jetpack' ),
				'button_link'    => \Jetpack::admin_url( '#/setup' ),
				'button_caption' => __( 'Set up Jetpack', 'jetpack' ),
			),
			array(
				'id'             => 'jpsetup-upload',
				'message_path'   => '/wp:upload:admin_notices/',
				'message'        => __( 'Do you want lightning-fast images?', 'jetpack' ),
				'description'    => __( 'Set up Jetpack, enable Site Accelerator, and start serving your images lightning fast, for free.', 'jetpack' ),
				'button_link'    => \Jetpack::admin_url( '#/setup' ),
				'button_caption' => __( 'Set up Jetpack', 'jetpack' ),
			),
			array(
				'id'             => 'jpsetup-widgets',
				'message_path'   => '/wp:widgets:admin_notices/',
				'message'        => __( 'Looking for even more widgets?', 'jetpack' ),
				'description'    => __( 'Set up Jetpack for great additional widgets that display business contact info and maps, blog stats, and top posts.', 'jetpack' ),
				'button_link'    => \Jetpack::admin_url( '#/setup' ),
				'button_caption' => __( 'Set up Jetpack', 'jetpack' ),
			),
		);
	}

	/**
	 * Filters and formats the messages for the client-side JS renderer
	 *
	 * @param string $message_path Current message path.
	 *
	 * @return array Formatted messages.
	 */
	private function filter_messages( $message_path ) {
		$messages = $this->get_raw_messages();

		$formatted_messages = array();

		foreach ( $messages as $message ) {
			if ( ! preg_match( $message['message_path'], $message_path ) ) {
				continue;
			}

			if ( 'jpsetup-posts' === $message['id'] && wp_count_posts()->publish < 5 ) {
				continue;
			}

			$obj                 = new \stdClass();
			$obj->CTA            = array( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				'message'   => $message['button_caption'],
				'newWindow' => false,
			);
			$obj->url            = $message['button_link'];
			$obj->id             = $message['id'];
			$obj->is_dismissible = true;
			$obj->content        = array(
				'message'     => $message['message'],
				'description' => $message['description'],
				'list'        => array(),
				'icon'        => 'jetpack',
			);

			$formatted_messages[] = $obj;
		}

		return $formatted_messages;
	}

	/**
	 * Retrieve the current message to display keyed on query string and message path
	 *
	 * @param string $message_path The message path to ask for.
	 * @param string $query The query string originally from the front end. Unused in this subclass.
	 * @param bool   $full_jp_logo_exists If there is a full Jetpack logo already on the page.
	 *
	 * @return array The JITMs to show, or an empty array if there is nothing to show
	 */
	public function get_messages( $message_path, $query, $full_jp_logo_exists ) {
		/** This filter is documented in  class.jetpack-connection-banner.php */
		if ( ! apply_filters( 'jetpack_pre_connection_prompt_helpers', false ) ) {
			// If filter jetpack_pre_connection_prompt_helpers is not set, return an empty array.
			return array();
		}

		if ( ! current_user_can( 'install_plugins' ) ) {
			return array();
		}

		$messages = $this->filter_messages( $message_path );

		if ( empty( $messages ) ) {
			return array();
		}

		$hidden_jitms = \Jetpack_Options::get_option( 'hide_jitm' );

		foreach ( $messages as $idx => &$envelope ) {
			$dismissed_feature = isset( $hidden_jitms[ 'pre-connection-' . $envelope->id ] ) &&
				is_array( $hidden_jitms[ 'pre-connection-' . $envelope->id ] ) ? $hidden_jitms[ 'pre-connection-' . $envelope->id ] : null;

			if ( is_array( $dismissed_feature ) ) {
				unset( $messages[ $idx ] );
				continue;
			}

			$envelope->content['icon'] = $this->generate_icon( $envelope->content['icon'], $full_jp_logo_exists );
		}

		return $messages;
	}

	/**
	 * Dismisses a JITM ID so that it will no longer be shown.
	 *
	 * @param string $id The id of the JITM that was dismissed.
	 *
	 * @return bool Always true
	 */
	public function dismiss( $id ) {
		$this->save_dismiss( 'pre-connection-' . $id );
		return true;
	}
}
