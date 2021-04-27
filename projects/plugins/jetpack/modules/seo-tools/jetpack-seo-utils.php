<?php

/**
 * Class containing utility static methods that other SEO tools are relying on.
 */
class Jetpack_SEO_Utils {
	/**
	 * Site option name used to store front page meta description.
	 */
	const FRONT_PAGE_META_OPTION = 'advanced_seo_front_page_description';

	/**
	 * Initially setting the front page meta description was for all sites, then the feature was grouped to a paid plan.
	 * The LEGACY_META_OPTION was added at that time to support legacy usage. Later on, a decision was made to have
	 * the JP seo-tools features for all JP sites (paid plan or not).
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

		return true;
	}

	/**
	 * Returns front page meta description for current site.
	 *
	 * @return string Front page meta description string or empty string.
	 */
	public static function get_front_page_meta_description() {
		$front_page_meta = get_option( self::FRONT_PAGE_META_OPTION );

		if ( empty( $front_page_meta ) ) {
			$legacy_meta_option = get_option( self::LEGACY_META_OPTION );
			if ( ! empty( $legacy_meta_option ) ) {
				return self::update_front_page_meta_description( $legacy_meta_option, true );
			}
		}

		return $front_page_meta;
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
	 * @param string $value                     New value for front page meta description.
	 * @param bool   $delete_legacy_meta_option Delete the LEGACY_META_OPTION if true.
	 *
	 * @return string Saved value, or empty string if no update was performed.
	 */
	public static function update_front_page_meta_description( $value, $delete_legacy_meta_option = false ) {
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

		$did_update = update_option( self::FRONT_PAGE_META_OPTION, $front_page_description );

		if ( $delete_legacy_meta_option && $did_update ) {
			delete_option( 'seo_meta_description' );
		}

		if ( $did_update ) {
			return $front_page_description;
		}

		return '';
	}
}
