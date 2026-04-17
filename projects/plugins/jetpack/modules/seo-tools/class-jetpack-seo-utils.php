<?php
/**
 * Class containing utility static methods that other SEO tools are relying on.
 *
 * @package automattic/jetpack
 */

/**
 * Class containing utility static methods that other SEO tools are relying on.
 */
class Jetpack_SEO_Utils {
	/**
	 * Site option name used to store front page meta description.
	 */
	const FRONT_PAGE_META_OPTION = 'advanced_seo_front_page_description';

	/**
	 * The LEGACY_META_OPTION is used to support legacy usage on WPcom simple sites (free or paid).
	 * For WPorg JP sites, the JP seo-tools features were made free for all sites (free or paid).
	 */
	const LEGACY_META_OPTION = 'seo_meta_description';

	/**
	 * Used to check whether SEO tools are enabled for given site.
	 *
	 * @return bool True if SEO tools are enabled, false otherwise.
	 */
	public static function is_enabled_jetpack_seo() {
		/**
		 * Can be used by SEO plugin authors to disable the conflicting output of SEO Tools.
		 *
		 * @module seo-tools
		 *
		 * @since 5.0.0
		 *
		 * @param bool True if SEO Tools should be disabled, false otherwise.
		 */
		if ( apply_filters( 'jetpack_disable_seo_tools', false ) ) {
			return false;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return wpcom_site_has_feature( 'advanced-seo', get_current_blog_id() );
		}

		return true;
	}

	/**
	 * Checks if this option was set while it was freely available to all WPcom simple sites.
	 *
	 * @return bool True if we should enable legacy usage, false otherwise.
	 */
	public static function has_legacy_front_page_meta() {
		return ! self::is_enabled_jetpack_seo() && get_option( self::LEGACY_META_OPTION );
	}

	/**
	 * Returns front page meta description for current site.
	 *
	 * @return string Front page meta description string or empty string.
	 */
	public static function get_front_page_meta_description() {
		if ( self::is_enabled_jetpack_seo() ) {
			$front_page_meta = get_option( self::FRONT_PAGE_META_OPTION );
			return $front_page_meta ? $front_page_meta : get_option( self::LEGACY_META_OPTION, '' );
		}

		// Support legacy usage for WPcom simple sites.
		return get_option( self::LEGACY_META_OPTION, '' );
	}

	/**
	 * Sanitizes the custom front page meta description input.
	 *
	 * @param string $value Front page meta string.
	 *
	 * @return string The sanitized string.
	 */
	public static function sanitize_front_page_meta_description( $value ) {
		return wp_strip_all_tags( $value );
	}

	/**
	 * Updates the site option value for front page meta description.
	 *
	 * @param string $value New value for front page meta description.
	 *
	 * @return string Saved value, or empty string if no update was performed.
	 */
	public static function update_front_page_meta_description( $value ) {
		$front_page_description = self::sanitize_front_page_meta_description( $value );

		/**
		 * Can be used to limit the length of front page meta description.
		 *
		 * @module seo-tools
		 *
		 * @since 4.4.0
		 *
		 * @param int Maximum length of front page meta description. Defaults to 300.
		 */
		$description_max_length = apply_filters( 'jetpack_seo_front_page_description_max_length', 300 );

		if ( function_exists( 'mb_substr' ) ) {
			$front_page_description = mb_substr( $front_page_description, 0, $description_max_length );
		} else {
			$front_page_description = substr( $front_page_description, 0, $description_max_length );
		}

		$can_set_meta       = self::is_enabled_jetpack_seo();
		$legacy_meta_option = get_option( self::LEGACY_META_OPTION );
		$has_old_meta       = ! empty( $legacy_meta_option );
		$option_name        = self::has_legacy_front_page_meta() ? self::LEGACY_META_OPTION : self::FRONT_PAGE_META_OPTION;

		$did_update = update_option( $option_name, $front_page_description );

		if ( $did_update && $has_old_meta && $can_set_meta ) {
			// Delete legacy option if user has switched to Business or eCommerce plan and updated the front page meta description.
			delete_option( self::LEGACY_META_OPTION );
		}

		if ( $did_update ) {
			return $front_page_description;
		}

		return '';
	}

	/**
	 * Canonical list of 3rd-party SEO plugins that conflict with Jetpack SEO.
	 *
	 * Exposed so the admin surfaces and the post-list table columns can
	 * consume the same source of truth. Mirrors the inline list used at
	 * runtime in modules/seo-tools.php.
	 *
	 * @return array<array{name:string, slug:string}>
	 */
	public static function get_conflicting_seo_plugins() {
		return array(
			array(
				'name' => 'Yoast SEO',
				'slug' => 'wordpress-seo/wp-seo.php',
			),
			array(
				'name' => 'Yoast SEO Premium',
				'slug' => 'wordpress-seo-premium/wp-seo-premium.php',
			),
			array(
				'name' => 'All In One SEO Pack',
				'slug' => 'all-in-one-seo-pack/all_in_one_seo_pack.php',
			),
			array(
				'name' => 'All in One SEO Pack Pro',
				'slug' => 'all-in-one-seo-pack-pro/all_in_one_seo_pack.php',
			),
			array(
				'name' => 'SEOPress',
				'slug' => 'wp-seopress/seopress.php',
			),
			array(
				'name' => 'SEOPress Pro',
				'slug' => 'wp-seopress-pro/seopress-pro.php',
			),
			array(
				'name' => 'Rank Math',
				'slug' => 'seo-by-rank-math/rank-math.php',
			),
			array(
				'name' => 'SEOKEY',
				'slug' => 'seo-key/seo-key.php',
			),
			array(
				'name' => 'SEOKEY Pro',
				'slug' => 'seo-key-pro/seo-key.php',
			),
			array(
				'name' => 'Slim SEO',
				'slug' => 'slim-seo/slim-seo.php',
			),
			array(
				'name' => 'The SEO Framework',
				'slug' => 'autodescription/autodescription.php',
			),
		);
	}

	/**
	 * Currently-active conflicting SEO plugins on this site.
	 *
	 * @return array<array{name:string, slug:string}>
	 */
	public static function get_active_conflicting_plugins() {
		$active = array();
		foreach ( self::get_conflicting_seo_plugins() as $plugin ) {
			if ( class_exists( 'Jetpack' ) && \Jetpack::is_plugin_active( $plugin['slug'] ) ) {
				$active[] = $plugin;
			}
		}
		return $active;
	}

	/**
	 * On plugin activation, auto-deactivate the Jetpack `seo-tools` module
	 * if the activated plugin conflicts with it (JETH-10045). Shows a
	 * dismissible admin notice so the user knows what happened.
	 *
	 * @param string $plugin             The plugin slug that was activated.
	 * @param bool   $network_activation Whether it was network-activated.
	 * @return void
	 */
	public static function auto_disable_on_conflict( $plugin, $network_activation ) {
		unset( $network_activation );
		$slugs = wp_list_pluck( self::get_conflicting_seo_plugins(), 'slug' );
		if ( ! in_array( $plugin, $slugs, true ) ) {
			return;
		}
		if ( class_exists( 'Jetpack' ) ) {
			\Jetpack::deactivate_module( 'seo-tools' );
		}
		set_transient( 'jetpack_seo_conflict_notice', $plugin, 30 * DAY_IN_SECONDS );
	}

	/**
	 * Remove content within wp:query blocks.
	 *
	 * @uses jetpack_og_remove_query_blocks
	 *
	 * @since 14.9
	 *
	 * @param string $content Post content.
	 *
	 * @return string Post content stripped from wp:query blocks.
	 */
	public static function remove_query_blocks( $content ) {
		if ( ! function_exists( 'jetpack_og_remove_query_blocks' ) ) {
			return $content;
		}

		return jetpack_og_remove_query_blocks( $content );
	}
}
