<?php
/**
 * Native Knowledge API stand-in.
 *
 * @package automattic/jetpack-knowledge
 */

if ( ! function_exists( 'wp_knowledge_types' ) ) {
	/**
	 * Declare the native API before its post type is registered.
	 *
	 * @return array Registered knowledge types.
	 */
	function wp_knowledge_types(): array {
		return array();
	}
}
