<?php
/**
 * Module Name: Jetpack AI
 * Module Description: Add Jetpack AI to your site and post editors.
 * Sort Order: 44
 * First Introduced: 14.2.0-a.1
 * Requires Connection: Yes
 * Requires User Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Jetpack AI, AI, Writing
 * Feature: Writing
 *
 * @package automattic/jetpack
 */

add_action( 'jetpack_activate_module_ai', 'jetpack_ai_activate_module' );

/**
 * Actions needed upon activating the AI module.
 */
function jetpack_ai_activate_module() {
	// No actions needed for now.
}
