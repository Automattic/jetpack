<?php
/**
 * Header Code.
 *
 * Let users insert code snippets into their site header.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Header_Code;

/**
 * Add code to the head.
 *
 * @since $$next-version$$
 */
function jetpack_insert_head_code() {
	$option = get_option( 'jetpack_header_code' );

	// Ensure no code is added on Simple sites.
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		return;
	}

	if ( ! empty( $option ) && ! is_admin() ) {
		// No escaping because it's user-inputted code intended to allow <script> tags.
		echo wp_unslash( $option, 'post' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
add_action( 'wp_head', __NAMESPACE__ . '\jetpack_insert_head_code', 999 );
