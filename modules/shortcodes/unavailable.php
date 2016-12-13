<?php

/**
 * An associative array of keys being the shortcodes that are unavailable, and a string explaining why.
 */
$GLOBALS['jetpack_unavailable_shortcodes'] = array(
	'blip.tv' => __( 'The Blip.tv service has been shut down since August 20th, 2015.', 'jetpack' ),
);

/**
 * Class Shortcode_Unavailable
 */
class Shortcode_Unavailable {
	/**
	 * Set up the actions and filters for the class to listen to.
	 */
	public static function add_hooks() {
		add_action( 'init', array( __CLASS__, 'add_shortcodes' ), 99 );
	}

	/**
	 * For all of our defined unavailable shortcodes, if something else hasn't
	 * already claimed them, add a handler to nullify their output.
	 */
	public static function add_shortcodes() {
		foreach ( $GLOBALS['jetpack_unavailable_shortcodes'] as $shortcode => $message ) {
			if ( ! shortcode_exists( $shortcode ) ) {
				add_shortcode( $shortcode, array( __CLASS__, 'stub_shortcode' ) );
			}
		}
	}

	/**
	 * Nullify the output of unavailable shortcodes.  Includes a filter to make
	 * it easier to notify admins that a shortcode that they used is unavailable.
	 *
	 * @param $atts
	 * @param string $content
	 * @param string $shortcode
	 * @return mixed|void
	 */
	public static function stub_shortcode( $atts, $content = '', $shortcode = '' ) {
		$str = '';
		if ( current_user_can( 'edit_posts' ) && ! empty( $GLOBALS['jetpack_unavailable_shortcodes'][ $shortcode ] ) ) {
			$str = sprintf( '<div><strong>%s</strong></div>', $GLOBALS['jetpack_unavailable_shortcodes'][ $shortcode ] );
		}
		/**
		 * Filter the front-end output of unavailable shortcodes.
		 *
		 * @module shortcodes
		 *
		 * @since 4.5.0
		 *
		 * @param string $str The html displayed in lieu of the shortcode.
		 * @param array $atts The attributes (numeric or named) passed to the shortcode.
		 * @param string $content The content (if any) between the opening and closing tags.
		 * @param string $shortcode The shortcode tag used to invoke this.
		 */
		return apply_filters( 'jetpack_stub_shortcode', $str, $atts, $content, $shortcode );
	}
}

Shortcode_Unavailable::add_hooks();
