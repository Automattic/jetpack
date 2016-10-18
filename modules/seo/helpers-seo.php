<?php

class A8C_SEO {
	/*
	 * Site option name used to store front page meta description.
	 */
	const FRONT_PAGE_META_OPTION = 'advanced_seo_front_page_description';

	/*
	 * Old version of option name for front page meta description that we use for grandfathering.
	 */
	const GRANDFATHERED_META_OPTION = 'seo_meta_description';

	/**
	 * Used to check whether advanced seo features are enabled.
	 *
	 * @param int $blog_id Optional. Defaults to current blog id if not given.
	 *
	 * @return bool True if advanced seo features are enabled, false otherwise.
	 */
	public static function is_enabled_advanced_seo( $blog_id = 0 ) {
		if ( empty( $blog_id ) ) {
			$blog_id = get_current_blog_id();
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return has_blog_sticker( 'unlimited-premium-themes', $blog_id );
		}

		// Enable for all Jetpack sites for now.
		return true;
	}

	public static function is_grandfathered_front_page_meta() {
		return ! self::is_enabled_advanced_seo() && get_option( self::GRANDFATHERED_META_OPTION );
	}

	/**
	 * Returns front page meta description for current site.
	 *
	 * Since we allowed non-business users to set Front page meta description for some time,
	 * before bundling it with other advanced SEO features that require a business plan,
	 * we are supporting grandfathering here.
	 *
	 * @return string|null Front page meta description string or null.
	 */
	public static function get_front_page_meta_description() {
		if ( self::is_enabled_advanced_seo() ) {
			return get_option( self::FRONT_PAGE_META_OPTION ) ?: get_option( self::GRANDFATHERED_META_OPTION, null );
		}

		// Support grandfathering for non-business users
		return get_option( self::GRANDFATHERED_META_OPTION, null );
	}

	public static function update_front_page_meta_description( $value ) {
		$front_page_description = sanitize_text_field( $value );

		// The seo front page meta description should be shorter than 300 characters
		$front_page_description = mb_substr( $front_page_description, 0, 300 );

		$can_set_meta = A8C_SEO::is_enabled_advanced_seo();
		$has_old_meta = ! empty( get_option( self::GRANDFATHERED_META_OPTION ) );
		$option_name = self::is_grandfathered_front_page_meta()	? self::GRANDFATHERED_META_OPTION : self::FRONT_PAGE_META_OPTION;

		$did_update = update_option( $option_name, $front_page_description );

		if ( $did_update && $has_old_meta && $can_set_meta ) {
			delete_option( self::GRANDFATHERED_META_OPTION );
		}

		if ( $did_update ) {
			return $front_page_description;
		}

		return '';
	}
}
