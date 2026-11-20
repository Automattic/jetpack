<?php
/**
 * Loads the Agents Manager in the block editor on WordPress.com sites with the WordPress Agent enabled.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Enable the Agents Manager in the block editor when the WordPress Agent is on.
 *
 * Preserves an existing true so other integrations (such as the Jetpack AI
 * Sidebar) can request the shell independently.
 *
 * @param mixed $enabled Whether an earlier filter already enabled it.
 * @return bool
 */
function wpcom_agents_manager_enable_in_block_editor( $enabled ): bool {
	return (bool) $enabled || wpcom_is_wordpress_agent_enabled();
}
add_filter( 'agents_manager_enabled_in_block_editor', 'wpcom_agents_manager_enable_in_block_editor' );
