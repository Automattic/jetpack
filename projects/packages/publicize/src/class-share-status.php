<?php
/**
 * Publicize Share Status class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

/**
 * Publicize Services class.
 */
class Share_Status {
	/**
	 * Gets the share status for a post.
	 *
	 * @param int $post_id The post ID.
	 */
	public static function get_post_share_status( $post_id ) {
		$shares = get_post_meta( $post_id, REST_Controller::SOCIAL_SHARES_POST_META_KEY, true );

		// If the data is in an associative array format, we fetch it without true to get all the shares.
		// This is needed to support the old WPCOM format.
		if ( isset( $shares ) && is_array( $shares ) && ! array_is_list( $shares ) ) {
			$shares = get_post_meta( $post_id, REST_Controller::SOCIAL_SHARES_POST_META_KEY );
		}

		// If the data is not an array, it means that sharing is not done yet.
		$done = is_array( $shares );

		if ( $done ) {
			// The site could have multiple admins, editors and authors connected. Load shares information that only the current user has access to.
			$connection_ids = wp_list_pluck( Connections::get_all_for_user(), 'connection_id', 'connection_id' );

			$shares = array_filter(
				$shares,
				function ( $share ) use ( $connection_ids ) {
					return isset( $connection_ids[ $share['connection_id'] ] );
				}
			);

			usort(
				$shares,
				function ( $a, $b ) {
					return $b['timestamp'] - $a['timestamp'];
				}
			);
		}

		return array(
			'shares' => $done ? $shares : array(),
			'done'   => $done,
		);
	}
}
