<?php
/**
 * Various hotfixes to WordPress.com
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Hotfix for a Gutenberg 19.8.0 bug preventing lower-capability users from editing pages.
 * See: p1734525664059729-slack-C02FMH4G8
 * See: https://github.com/WordPress/gutenberg/issues/68053#issuecomment-2550730705
 */
add_filter(
	'register_post_type_args',
	function ( $args ) {
		if ( current_user_can( 'manage_options' ) ) {
			// Admins still need default_rendering_mode for the site editor to select the correct default template.
			// See: p1736989403607879-slack-C02FMH4G8
			return $args;
		}

		unset( $args['default_rendering_mode'] );
		return $args;
	},
	20
);
