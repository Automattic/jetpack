<?php
/**
 * Markdown Block.
 *
 * @since 6.8.0
 *
 * @package Jetpack
 */

/**
 * The block depends on the Markdown module to be active for now.
 * Related discussion: https://github.com/Automattic/jetpack/issues/10294
 */
if (
	( defined( 'IS_WPCOM' ) && IS_WPCOM )
	|| ( method_exists( 'Jetpack', 'is_module_active' ) && Jetpack::is_module_active( 'markdown' ) )
) {
	jetpack_register_block( 'jetpack/markdown' );
}

