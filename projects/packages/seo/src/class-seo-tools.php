<?php
/**
 * SEO output availability and plugin ownership.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

/**
 * Separates plugin conflicts from other reasons to disable SEO output.
 */
class Seo_Tools {
	/**
	 * Return the conflicting plugin's display name, or null when there is no conflict.
	 *
	 * @since $$next-version$$
	 * @return string|null
	 */
	public static function get_conflicting_plugin() {
		/**
		 * Filters the name of the plugin managing SEO output instead of Jetpack.
		 *
		 * @since $$next-version$$
		 * @param string|null $plugin The plugin's display name, or null for no conflict.
		 */
		$plugin = apply_filters( 'jetpack_seo_conflicting_plugin', null );
		return is_string( $plugin ) && '' !== trim( $plugin ) ? trim( $plugin ) : null;
	}

	/**
	 * Whether SEO output is disabled, defaulting to the plugin conflict state.
	 *
	 * @since $$next-version$$
	 * @return bool
	 */
	public static function is_disabled() {
		/** This filter is documented in projects/plugins/jetpack/modules/seo-tools/class-jetpack-seo-utils.php */
		return (bool) apply_filters( 'jetpack_disable_seo_tools', null !== self::get_conflicting_plugin() );
	}
}
