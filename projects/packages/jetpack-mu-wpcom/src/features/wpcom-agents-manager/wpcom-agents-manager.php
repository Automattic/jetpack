<?php
/**
 * Loads the Agents Manager in the block editor on WordPress.com sites with the WordPress Agent enabled.
 *
 * The Agents Manager package is a neutral loader: it only mounts in the block
 * editor when a host answers the `agents_manager_enabled_in_block_editor`
 * filter. This is the WordPress.com answer, so it no longer depends on the
 * Big Sky plugin being loaded.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Whether the WordPress Agent is enabled on this site.
 *
 * Mirrors the gate that decides whether the Big Sky plugin loads at all:
 * the site-level "Enable WordPress Agent" setting, plus the plugin's own
 * `big_sky_enable` option, which a site admin can switch off under
 * Settings > Writing. The option lives in the site database, so it stays
 * readable whether or not the plugin is loaded.
 *
 * @return bool
 */
function wpcom_agents_manager_is_wordpress_agent_enabled(): bool {
	if ( ! get_option( 'big_sky_enable', '1' ) ) {
		return false;
	}

	// On Simple sites the WordPress.com platform owns the full predicate
	// (blog sticker, Garden sites, AI-assembler onboarding).
	if ( function_exists( 'big_sky_is_enabled' ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunction -- Provided by WPCOM's Big Sky mu-plugin; guarded by function_exists() above.
		return (bool) big_sky_is_enabled();
	}

	return wpcom_has_blog_sticker( 'big-sky-enabled', get_wpcom_blog_id() );
}

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
	return (bool) $enabled || wpcom_agents_manager_is_wordpress_agent_enabled();
}
add_filter( 'agents_manager_enabled_in_block_editor', 'wpcom_agents_manager_enable_in_block_editor' );
