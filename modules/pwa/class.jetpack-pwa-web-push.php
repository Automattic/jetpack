<?php

// TODO output web push JS from this module

class Jetpack_PWA_Web_Push {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA_Web_Push' ) ) {
			self::$__instance = new Jetpack_PWA_Web_Push();
		}

		return self::$__instance;
	}

	private function __construct() {
		if ( get_option( 'pwa_web_push' ) ) {
			add_filter( 'jetpack_published_post_flags', array( $this, 'jetpack_published_post_flags' ), 10, 2 );
		}
	}

	public function jetpack_published_post_flags( $flags, $post ) {
		if ( ! $this->post_type_is_web_pushable( $post->post_type ) ) {
			return $flags;
		}

		/**
		 * Determines whether a post being published gets sent to web push subscribers.
		 *
		 * @module pwa
		 *
		 * @since 5.6.0
		 *
		 * @param bool $should_publicize Should the post be web_pushed? Default to true.
		 * @param WP_POST $post Current Post object.
		 */
		if ( ! apply_filters( 'pwa_should_web_push_published_post', true, $post ) ) {
			return $flags;
		}

		$flags['web_push'] = true;

		return $flags;
	}

	protected function post_type_is_web_pushable( $post_type ) {
		if ( 'post' == $post_type )
			return true;

		return post_type_supports( $post_type, 'web_push' );
	}
}
