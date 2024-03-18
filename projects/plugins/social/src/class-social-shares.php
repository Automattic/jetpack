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
			$links = array();
			foreach ( $shares as $service => $item ) {
				$message = esc_url( $item['message'] );
				$links[] = '<a href="' . $message . '">' . $service . '</a>';
			}

			$text         = implode( ', ', $links );
			$also_on_text = __( 'Also on', 'jetpack-social' );
			if ( count( $links ) > 1 ) {
				$last_link = array_pop( $links );
				$html     .= $also_on_text . ' ' . implode( ', ', $links ) . ' ' . __( 'and', 'jetpack-social' ) . " $last_link";
			} else {
				$html .= $also_on_text . " $text";
			}

			$html .= '</span>';
		}

		return apply_filters(
			'jp_social_shares',
			array(
				'shares' => $shares,
				'html'   => $html,
			)
		);
	}

	/**
	 * Echo the html of social shares.
	 *
	 * @param int $post_id The Post ID.
	 */
	public static function the_social_shares( $post_id ) {
		$args = self::get_the_social_shares( $post_id );
		return $args['html'];
	}
}
