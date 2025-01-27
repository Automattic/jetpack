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

/**
 * Hotfix for a {Gutenberg 20.0.0, WP 6.7.x} bug causing the Content block to output truncated HTML.
 * See: https://github.com/WordPress/gutenberg/issues/68614
 */
if (
	// WordPress 6.7.x contains the buggy remove_serialized_parent_block() function.
	version_compare( get_bloginfo( 'version' ), '6.8', '<' ) ) {

	add_filter(
		'the_content',
		function ( $content ) {
			if ( has_filter( 'the_content', 'remove_serialized_parent_block' ) ) {
				// We will revert the content manipulation done in https://github.com/WordPress/gutenberg/pull/67272.

				// Reverts https://github.com/WordPress/gutenberg/pull/67272/files#diff-611d9e2b5a9b00eb2fbe68d044eccb195759a422e36f525186d43d752bee3d71R65-R68
				remove_filter( 'the_content', 'remove_serialized_parent_block', 8 );

				// Reverts https://github.com/WordPress/gutenberg/pull/67272/files#diff-611d9e2b5a9b00eb2fbe68d044eccb195759a422e36f525186d43d752bee3d71R57-R63
				return remove_serialized_parent_block( $content );
			}
			return $content;
		},
		1
	);
}
