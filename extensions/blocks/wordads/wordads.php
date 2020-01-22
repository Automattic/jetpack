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
	 * Register the WordAds block.
	 */
	public static function register() {
		// On WordPress.com the WordAds module is always active.
		if ( self::is_jetpack_module_active() ) {
			jetpack_register_block(
				self::BLOCK_NAME,
				array(
					'render_callback' => array( 'Jetpack_WordAds_Gutenblock', 'gutenblock_render' ),
				),
				array(
					'wpcom'   => 'wordads',
					'jetpack' => 'wordads-jetpack',
				)
			);
		}
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
		if (
			empty( $wordads )
			|| empty( $wordads->params )
			|| is_feed()
			|| apply_filters( 'wordads_inpost_disable', false )
		) {
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
		$snippet = $wordads->get_ad_snippet( $section_id, $height, $width, 'gutenberg', $wordads->get_solo_unit_css() );
		return $wordads->get_ad_div( 'inline', $snippet, array( $align ) );
	}
}

add_action(
	'init',
	array( 'Jetpack_WordAds_Gutenblock', 'register' )
);
