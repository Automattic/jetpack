<?php
/**
 * Class for the Social Shares.
 *
 * @package automattic/jetpack-social-plugin
 */

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

		$succesful_shares = array_filter(
			$shares[0],
			function ( $share ) {
				return isset( $share['status'] ) && $share['status'] === 'success';
			}
		);

		$shares_by_service = array();

		foreach ( $succesful_shares as $share ) {
			$service   = $share['service'];
			$timestamp = $share['timestamp'];

			if ( ! isset( $shares_by_service[ $service ] ) || $timestamp > $shares_by_service[ $service ]['timestamp'] ) {
				$shares_by_service[ $service ] = $share;
			}
		}
		return $shares_by_service;
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

		$html = '<span>';

		if ( empty( $shares ) ) {
			$html .= '</span>';
		} else {
			$html .= '<h5 style="margin: 0;font-weight: normal;font-size: inherit;">' . __( 'Also on:', 'jetpack-social' ) . '</h5><ul style="list-style-type: none;margin-top: 0px; padding-left: 10px;">';
			foreach ( $shares as $service => $item ) {
				$message = esc_url( $item['message'] );
				$html   .= '<li><a href="' . $message . '">' . self::get_service_display_name( $service ) . '</a></li>';
			}
			$html .= '</ul>';
			$html .= '</span>';
		}

		/**
		 * Apply filters to the social shares data.
		 *
		 * @param string $html The html markup to display the shares.
		 * @param array  $shares  The social shares data.
		 * @param int    $post_id The ID of the post being shared.
		 * @return array The modified $html markup.
		*/
		return apply_filters(
			'jp_social_shares',
			$html,
			$shares,
			$post_id
		);
	}

	/**
	 * Adds the shares shortcode.
	 *
	 * @param string $service The name of the social connection provider in small case.
	 * @return string The display name of the social connection provider such as LinkedIn for linkein.
	 */
	public static function get_service_display_name( $service ) {
		switch ( $service ) {
			case 'facebook':
				return 'Facebook';
			case 'linkedin':
				return 'LinkedIn ';
			case 'instagram-business':
				return 'Instagram ';
			case 'nextdoor':
				return 'Nextdoor';
			case 'mastodon':
				return 'Mastodon';
			case 'tumblr':
				return 'Tumblr';
			default:
				return $service;
		}
	}
}
