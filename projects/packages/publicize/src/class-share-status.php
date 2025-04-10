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
	const SHARES_META_KEY = '_publicize_shares';

	/**
	 * Gets the share status for a post.
	 *
	 * @param int  $post_id          The post ID.
	 * @param bool $filter_by_access Whether to filter the shares by access.
	 */
	public static function get_post_share_status( $post_id, $filter_by_access = true ) {

		$post = get_post( $post_id );

		if ( empty( $post ) || ! metadata_exists( 'post', $post_id, self::SHARES_META_KEY ) ) {
			return array(
				'done'   => false,
				'shares' => array(),
			);
		}

		$shares = get_post_meta( $post_id, self::SHARES_META_KEY, true );

		// If the data is in an associative array format, we fetch it without true to get all the shares.
		// This is needed to support the old WPCOM format.
		if ( isset( $shares ) && is_array( $shares ) && ! array_is_list( $shares ) ) {
			$shares = get_post_meta( $post_id, self::SHARES_META_KEY );
		}

		// Better safe than sorry.
		if ( empty( $shares ) ) {
			$shares = array();
		}

		if ( $filter_by_access ) {
			// The site could have multiple admins, editors and authors connected. Load shares information that only the current user has access to.
			$connection_ids = wp_list_pluck( Connections::get_all_for_user(), 'connection_id', 'connection_id' );

			$shares = array_filter(
				$shares,
				function ( $share ) use ( $connection_ids ) {
					return isset( $share['connection_id'] ) && isset( $connection_ids[ $share['connection_id'] ] );
				}
			);
		}

		usort(
			$shares,
			function ( $a, $b ) {
				return $b['timestamp'] - $a['timestamp'];
			}
		);

		$shares = array_values( $shares );

		return array(
			'shares' => $shares,
			'done'   => true,
		);
	}
}
