<?php

class Jetpack_Rest_Sync {

	static $posts = array();

	static function init() {
		add_action( 'transition_post_status', array( __CLASS__, 'transition_post_status' ), 10, 3 );
	}

	static function transition_post_status( $new_status, $old_status, $post ) {
		self::$posts = array_unique( array_push( self::$posts, $post->ID ) );
	}
}

Jetpack_Rest_Sync::init();