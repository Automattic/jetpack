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
			return null;
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
			return '<div></div>';
		}

		$html = '';
		foreach ( $shares as $share ) {
			$timestamp = gmdate( 'Y-m-d H:i:s', $share['timestamp'] );
			$html     .= '<p>';
			$html     .= 'Shared to ' . $share['service'] . ' at ' . $timestamp . ' - ';
			$html     .= '<a href="' . $share['message'] . '" target="_blank">View</a>.';
			$html     .= '</p>';
		}
		return $html;
	}

	/**
	 * Echo the html of social shares.
	 *
	 * @param int $post_id The Post ID.
	 */
	public static function the_social_shares( $post_id ) {
		echo wp_kses_post( self::get_the_social_shares( $post_id ) );
	}
}
