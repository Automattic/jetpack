<?php

use \Automattic\Jetpack\Capabilities;

class Jetpack_Capabilities {
	static function init() {
		Capabilities::build( 'jetpack.recurring-payments.enabled' )
			->require_jetpack_is_active()
			->require_any( function( $builder ) {
				$builder
					->require_jetpack_plan_supports( 'recurring-payments' )
					->require_filter( 'jetpack_block_editor_enable_upgrade_nudge', true );
			} );
	}
}

add_action( 'init', [ 'Jetpack_Capabilities', 'init' ] );