<?php
/**
 * Custom Initial Block extension.
 *
 * @since 8.7.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions;

use Jetpack_Gutenberg;

const FEATURE_NAME   = 'custom-initial-block';
const EXTENSION_NAME = 'jetpack/' . FEATURE_NAME;

/**
 * Make the Custom Initial Block extension available.
 */
function set_custom_initial_block_availability() {
	Jetpack_Gutenberg::set_extension_available( EXTENSION_NAME );
}
add_action(
	'jetpack_register_gutenberg_extensions',
	'Automattic\\Jetpack\\Extensions\\set_custom_initial_block_availability'
);
