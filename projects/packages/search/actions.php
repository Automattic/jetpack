<?php
/**
 * Action Hooks for the Jetpack Search package.
 *
 * Composer's autoload.files runs before WordPress is fully loaded, so we
 * register hooks lazily. If `add_action()` is available we use it directly;
 * otherwise we drop entries into `$wp_filter` for
 * `WP_Hook::build_preinitialized_hooks()` to pick up later.
 *
 * The Search package is consumed by both `plugins/search` (standalone Jetpack
 * Search plugin) and `plugins/jetpack` (the search module). Wiring here fires
 * in both consumers without each plugin needing to call into the abilities
 * class itself.
 *
 * @package automattic/jetpack-search
 */

$jetpack_search_register_abilities = static function () {
	/**
	 * Gate Jetpack Abilities API registration. Documented in jetpack-wp-abilities.
	 *
	 * @since 0.58.0
	 *
	 * @param bool $enabled Whether to register abilities. Default false.
	 */
	if ( ! apply_filters( 'jetpack_wp_abilities_enabled', false ) ) {
		return;
	}
	if ( ! class_exists( \Automattic\Jetpack\Search\Abilities\Search_Abilities::class ) ) {
		return;
	}
	\Automattic\Jetpack\Search\Abilities\Search_Abilities::init();
};

if ( function_exists( 'add_action' ) ) {
	add_action( 'plugins_loaded', $jetpack_search_register_abilities, 20 );
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][20][] = array(
		'accepted_args' => 0,
		'function'      => $jetpack_search_register_abilities,
	);
}
