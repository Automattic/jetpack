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
		unset( $args['default_rendering_mode'] );
		return $args;
	},
	20
);
