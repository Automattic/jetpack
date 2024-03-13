<?php
/**
 * Register the Social note custom post type.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

/**
 * Register the Jetpack Social Shares Class.
 */
class Social_Shares {
	const SOCIAL_SHARES_POST_META_KEY = '_publicize_shares';

	/**
	 * Return a list of of social shares.
	 *
	 * @param int $post_id The Post ID.
	 *
	 * @return array
	 */
	public static function get_social_shares( $post_id ) {
		if ( empty( $post_id ) ) {
			return array();
		}

		$shares = get_post_meta( $post_id, self::SOCIAL_SHARES_POST_META_KEY );

		if ( empty( $shares ) ) {
			return array();
		}

		return array_filter(
			$shares[0],
			function ( $share ) {
				return isset( $share['status'] ) && $share['status'] === 'success';
			}
		);
	}

	/**
	 * Return a html to display the social shares.
	 *
	 * @param int $post_id The Post ID.
	 *
	 * @return array
	 */
	public static function get_the_social_shares( $post_id ) {
		$shares = self::get_social_shares( $post_id );

		if ( empty( $shares ) ) {
			return '<span></span>';
		}

		$shares_by_service = array();

		foreach ( $shares as $share ) {
			$service   = $share['service'];
			$timestamp = $share['timestamp'];

			// If service doesn't exist in $mostRecentItems or the current timestamp is more recent, update $mostRecentItems
			if ( ! isset( $shares_by_service[ $service ] ) || $timestamp > $shares_by_service[ $service ]['timestamp'] ) {
				$shares_by_service[ $service ] = $share;
			}
		}

		$links = array();
		foreach ( $shares_by_service as $service => $item ) {
			$links[] = '<a href="' . $item['message'] . '">' . $service . '</a>';
		}

		$text = implode( ', ', $links );
		if ( count( $links ) > 1 ) {
			$last_link = array_pop( $links );
			return 'Also on ' . implode( ', ', $links ) . " and $last_link";
		}
		return "Also on $text";
	}

	/**
	 * Echo the html of social shares.
	 *
	 * @param int $post_id The Post ID.
	 */
	public static function the_social_shares( $post_id ) {
		return self::get_the_social_shares( $post_id );
	}
}
