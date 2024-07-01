<?php
/**
 * Utility functions that should live in the global namespace.
 *
 * @package automattic/jetpack-social-plugin
 */

/**
 * A convenience function for themes, to output the social shares for the given post
 *
 * @param int $post_id The ID of the post being shared.
 */
function jp_the_social_shares( $post_id = 0 ) {
	echo Social_Shares::get_the_social_shares( $post_id ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped in Social_Shares::get_the_social_shares.
}
