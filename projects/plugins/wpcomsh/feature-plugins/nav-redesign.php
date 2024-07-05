<?php
/**
 * Features related to the WordPress.com nav redesign.
 *
 * @package wpcomsh
 */

/**
 * Returns whether the current request is coming from the a8c proxy.
 */
function is_proxied() {
	return isset( $_SERVER['A8C_PROXIED_REQUEST'] )
		? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
		: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
}
