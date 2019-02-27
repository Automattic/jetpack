<?php

/**
 * Class Jetpack_Shortcode_Unavailable
 */
class Jetpack_Shortcode_Unavailable {
	/**
	 * Set up the actions and filters for the class to listen to.
	 *
	 * @param array $shortcodes An associative array of keys being the shortcodes that are unavailable, and a string explaining why.
	 */
	public function __construct( $shortcodes ) {
		$this->shortcodes = $shortcodes;

		add_action( 'template_redirect', array( $this, 'add_shortcodes' ) );
	}

	/**
	 * For all of our defined unavailable shortcodes, if something else hasn't
	 * already claimed them, add a handler to nullify their output.
	 */
	public function add_shortcodes() {
		foreach ( $this->shortcodes as $shortcode => $message ) {
			if ( ! shortcode_exists( $shortcode ) ) {
				add_shortcode( $shortcode, array( $this, 'stub_shortcode' ) );
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
	public function stub_shortcode( $atts, $content = '', $shortcode = '' ) {
		$str = '';
		if ( current_user_can( 'edit_posts' ) && ! empty( $this->shortcodes[ $shortcode ] ) ) {
			$str = sprintf( '<div><strong>%s</strong></div>', $this->shortcodes[ $shortcode ] );
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

new Jetpack_Shortcode_Unavailable(
	array(
		'blip.tv' => __( 'The Blip.tv service has been shut down since August 20th, 2015.', 'jetpack' ),
	)
);
