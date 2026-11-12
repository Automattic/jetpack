<?php
/**
 * SEO output availability and plugin ownership.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;

/**
 * Separates plugin conflicts from other reasons to disable SEO output.
 */
class Seo_Tools {
	/**
	 * Option holding the front page meta description.
	 *
	 * @since $$next-version$$
	 */
	const FRONT_PAGE_META_OPTION = 'advanced_seo_front_page_description';

	/**
	 * Legacy option the description is stored in on WordPress.com sites that set
	 * one while SEO tools were free for every Simple site.
	 *
	 * @since $$next-version$$
	 */
	const LEGACY_FRONT_PAGE_META_OPTION = 'seo_meta_description';

	/**
	 * Return the conflicting plugin's display name, or null when there is no conflict.
	 *
	 * @since 0.10.3
	 * @return string|null
	 */
	public static function get_conflicting_plugin() {
		/**
		 * Filters the name of the plugin managing SEO output instead of Jetpack.
		 *
		 * @since 0.10.3
		 * @param string|null $plugin The plugin's display name, or null for no conflict.
		 */
		$plugin = apply_filters( 'jetpack_seo_conflicting_plugin', null );
		return is_string( $plugin ) && '' !== trim( $plugin ) ? trim( $plugin ) : null;
	}

	/**
	 * Whether SEO output is disabled, defaulting to the plugin conflict state.
	 *
	 * @since 0.10.3
	 * @return bool
	 */
	public static function is_disabled() {
		/** This filter is documented in projects/packages/seo/src/class-seo-tools.php */
		return (bool) apply_filters( 'jetpack_disable_seo_tools', null !== self::get_conflicting_plugin() );
	}

	/**
	 * Whether Jetpack's SEO output is live for this site.
	 *
	 * @since $$next-version$$
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Can be used by SEO plugin authors to disable the conflicting output of SEO Tools.
		 *
		 * @module seo-tools
		 *
		 * @since jetpack-5.0.0
		 *
		 * @param bool True if SEO Tools should be disabled, false otherwise.
		 */
		if ( apply_filters( 'jetpack_disable_seo_tools', false ) ) {
			return false;
		}

		if ( Constants::is_true( 'IS_WPCOM' ) && function_exists( 'wpcom_site_has_feature' ) ) {
			return wpcom_site_has_feature( 'advanced-seo', get_current_blog_id() );
		}

		return true;
	}

	/**
	 * Whether the front page description still lives in the legacy option.
	 *
	 * True when SEO output is off and a description was saved while SEO tools were free on WordPress.com.
	 *
	 * @since $$next-version$$
	 * @return bool
	 */
	public static function has_legacy_front_page_meta() {
		return ! self::is_enabled() && (bool) get_option( self::LEGACY_FRONT_PAGE_META_OPTION );
	}

	/**
	 * The front page meta description the front end emits.
	 *
	 * @since $$next-version$$
	 * @return string
	 */
	public static function get_front_page_meta_description() {
		if ( self::is_enabled() ) {
			$modern = get_option( self::FRONT_PAGE_META_OPTION );
			return (string) ( $modern ? $modern : get_option( self::LEGACY_FRONT_PAGE_META_OPTION, '' ) );
		}

		return (string) get_option( self::LEGACY_FRONT_PAGE_META_OPTION, '' );
	}
}
