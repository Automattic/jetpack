<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Ads Block.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */
class Jetpack_WordAds_Gutenblock {
	const BLOCK_NAME = 'jetpack/wordads';

	/**
	 * Check if site is on WP.com Simple.
	 *
	 * @return bool
	 */
	private static function is_wpcom() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM;
	}
	/**
	 * Check if the WordAds module is active.
	 *
	 * @return bool
	 */
	private static function is_jetpack_module_active() {
		return method_exists( 'Jetpack', 'is_module_active' ) && Jetpack::is_module_active( 'wordads' );
	}

	/**
	 * Check if the site is approved for ads for WP.com Simple sites.
	 *
	 * @return bool
	 */
	private static function is_available() {
		if ( self::is_wpcom() ) {
			return has_any_blog_stickers( array( 'wordads', 'wordads-approved', 'wordads-approved-misfits' ), get_current_blog_id() );
		}

		return self::is_jetpack_module_active();
	}

	/**
	 * Register the WordAds block.
	 */
	public static function register() {
		if ( self::is_available() ) {
			jetpack_register_block(
				self::BLOCK_NAME,
				array(
					'render_callback' => array( 'Jetpack_WordAds_Gutenblock', 'gutenblock_render' ),
				)
			);
		}
	}

	/**
	 * Set if the WordAds block is available.
	 */
	public static function set_availability() {
		if ( ! self::is_available() ) {
			Jetpack_Gutenberg::set_extension_unavailable( self::BLOCK_NAME, 'WordAds unavailable' );
			return;
		}
		// Make the block available. Just in case it wasn't registed before.
		Jetpack_Gutenberg::set_extension_available( self::BLOCK_NAME );
	}

	/**
	 * Renders the WordAds block.
	 *
	 * @param array $attr Block attributes.
	 *
	 * @return string Block HTML.
	 */
	public static function gutenblock_render( $attr ) {
		global $wordads;

		/** This filter is already documented in modules/wordads/wordads.php `insert_ad()` */
		if ( empty( $wordads ) || is_feed() || apply_filters( 'wordads_inpost_disable', false ) ) {
			return '';
		}

		if ( ! empty( $attr['hideMobile'] ) && $wordads->params->is_mobile() ) {
			return '';
		}

		if ( ! self::is_wpcom() && $wordads->option( 'wordads_house' ) ) {
			return $wordads->get_ad( 'inline', 'house' );
		}

		// section_id is mostly depricated at this point, but it helps us (devs) keep track of which ads end up where
		// 6 is to keep track of gutenblock ads.
		$section_id = $wordads->params->blog_id . '6';
		$align      = 'center';
		if ( isset( $attr['align'] ) && in_array( $attr['align'], array( 'left', 'center', 'right' ), true ) ) {
			$align = $attr['align'];
		}
		$align = 'align' . $align;

		$ad_tag_ids = $wordads->get_ad_tags();
		$format     = 'mrec';
		if ( isset( $attr['format'] ) && in_array( $attr['format'], array_keys( $ad_tag_ids ), true ) ) {
			$format = $attr['format'];
		}

		$height  = $ad_tag_ids[ $format ]['height'];
		$width   = $ad_tag_ids[ $format ]['width'];
		$snippet = $wordads->get_ad_snippet( $section_id, $height, $width, 'inline', $wordads->get_solo_unit_css() );
		return $wordads->get_ad_div( 'inline', $snippet, array( $align ) );
	}
}

add_action(
	'init',
	array( 'Jetpack_WordAds_Gutenblock', 'register' )
);

add_action(
	'jetpack_register_gutenberg_extensions',
	array( 'Jetpack_WordAds_Gutenblock', 'set_availability' )
);
