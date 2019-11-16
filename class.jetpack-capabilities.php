<?php
/**
 * Specifies named capabilities used across Jetpack
 *
 * These rules give us flexibility to determine which features are enabled, when and for whom
 *
 * @package Jetpack
 */

use \Automattic\Jetpack\Capabilities;

class Jetpack_Capabilities {
	static function init() {

		// a legacy capability.
		self::build( 'jetpack_activate_modules' )
			->require_wp_capability( 'manage_options' );

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::build( 'jetpack.recurring-payments.enabled' )
				->require_any_blog_sticker( [ 'personal-plan', 'premium-plan', 'business-plan', 'ecommerce-plan' ] );
		} else {
			self::build( 'jetpack.recurring-payments.enabled' )
				->require_jetpack_is_active()
				->require_any( function( $builder ) {
					$builder
						->require_jetpack_plan_supports( 'recurring-payments' )
						->require_filter( 'jetpack_block_editor_enable_upgrade_nudge', true );
				} );
		}

	}

	/**
	 * @param string slug The slug for the rule being built
	 */
	static function build( $slug ) {
		return Capabilities::build( $slug );
	}
}

add_action( 'init', [ 'Jetpack_Capabilities', 'init' ] );