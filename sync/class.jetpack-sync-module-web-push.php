<?php

/**
 * logs web push subscriptions
 */
class Jetpack_Sync_Module_Web_Push extends Jetpack_Sync_Module {

	function name() {
		return 'web-push';
	}

	function init_listeners( $callback ) {
		add_action( 'jetpack_web_push_subscribe', $callback );
	}
}