<?php
/**
 * Module Name: Blocks
 * Module Description: Add additional blocks to your site and post editors.
 * Sort Order: 5
 * First Introduced: 13.9-a.8
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: blocks
 * Feature: Writing
 *
 * @package automattic/jetpack
 */

add_action( 'jetpack_activate_module_blocks', 'jetpack_blocks_activate_module' );

/**
 * Actions needed upon activating the blocks module.
 *
 * There is a legacy option to disable Jetpack blocks that we'll delete when this module is activated.
 * Via jetpack_get_default_modules filter, we remove blocks from the default if the option is true.
 * We'll leave that in place so _until the module is activated_ we will be sure to respect the previous
 * setting.
 *
 * @since 13.9
 * @return void
 */
function jetpack_blocks_activate_module() {
	delete_option( 'jetpack_blocks_disabled' ); // The function will check and return early if not present.
}
