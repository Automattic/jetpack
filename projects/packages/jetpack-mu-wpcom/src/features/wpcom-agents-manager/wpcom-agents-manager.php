<?php
/**
 * Loads the Agents Manager on WordPress.com sites with the WordPress Agent enabled.
 *
 * The Agents Manager package is a neutral loader: it only mounts where a host
 * asks for it, through `agents_manager_enabled_in_block_editor` in the block
 * editor and `agents_manager_should_load` elsewhere. This is the WordPress.com
 * answer, so it no longer depends on the Big Sky plugin being loaded.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Whether the WordPress Agent is enabled on this site.
 *
 * The `big_sky_enable` option is read on both platforms, but it means
 * different things. On Simple it is the admin's opt-out under Settings >
 * Writing, so it defaults to on and the platform's `big_sky_is_enabled()`
 * (blog sticker, Garden sites, AI-assembler onboarding) owns the site-level
 * setting. On Atomic it is the site-level setting itself: WordPress.com writes
 * it to the site when the WordPress Agent is switched on, and the plugin
 * clears it on deactivation. The `big-sky-enabled` blog sticker is not synced
 * to Atomic, so it cannot be used there.
 *
 * @return bool
 */
function wpcom_agents_manager_is_wordpress_agent_enabled(): bool {
	if ( function_exists( 'big_sky_is_enabled' ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunction -- Provided by WPCOM's Big Sky mu-plugin; guarded by function_exists() above.
		return (bool) get_option( 'big_sky_enable', '1' ) && (bool) big_sky_is_enabled();
	}

	return (bool) get_option( 'big_sky_enable', '0' );
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

/**
 * Request the Agents Manager shell on the wp-admin Dashboard when the WordPress Agent is on.
 *
 * Outside the block editor the package loads only when a host answers
 * `agents_manager_should_load`, so the Dashboard has to ask for it.
 */
function wpcom_agents_manager_load_on_dashboard(): void {
	if ( ! wpcom_agents_manager_is_wordpress_agent_enabled() ) {
		return;
	}

	add_filter( 'agents_manager_should_load', '__return_true' );
}
add_action( 'load-index.php', 'wpcom_agents_manager_load_on_dashboard' );
