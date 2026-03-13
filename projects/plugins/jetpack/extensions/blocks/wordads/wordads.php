<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Ads Block.
 *
 * @since 7.1.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Jetpack's Ads Block class.
 *
 * @since 7.1.0
 */
class WordAds {
	/**
	 * Mapping array of gutenberg ad snippet with the WordAds_Smart formats.
	 *
	 * @var array
	 */
	private static $gutenberg_ad_snippet_x_smart_format = array(
		'gutenberg_300x250' => 'gutenberg_rectangle',
		'gutenberg_728x90'  => 'gutenberg_leaderboard',
		'gutenberg_320x50'  => 'gutenberg_mobile_leaderboard',
		'gutenberg_160x600' => 'gutenberg_skyscraper',
	);

	/**
	 * Check if site is on WP.com Simple.
	 *
	 * @return bool
	 */
	private static function is_wpcom() {
		return ( new Host() )->is_wpcom_simple();
	}

	/**
	 * Check if the WordAds module is active.
	 *
	 * @return bool
	 */
	private static function is_jetpack_module_active() {
		return ( new Modules() )->is_active( 'wordads' );
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

		return Jetpack_Plan::supports( 'wordads' );
	}

	/**
	 * Register the WordAds block.
	 */
	public static function register() {
		/*
		* The block is available even when the module is not active,
		* so we can display a nudge to activate the module instead of the block.
		* However, since non-admins cannot activate modules, we do not display the empty block for them.
		*/
		if ( ! self::is_jetpack_module_active() && ! current_user_can( 'jetpack_activate_modules' ) ) {
			return;
		}

		if ( ! self::is_available() ) {
			return;
		}

		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render' ),
			)
		);
	}

	/**
	 * Set if the WordAds block is available.
	 */
	public static function set_availability() {
		$block_name = 'wordads';

		if ( ! self::is_available() ) {
			Jetpack_Gutenberg::set_extension_unavailable( $block_name, 'WordAds unavailable' );
			return;
		}
		// Make the block available. Just in case it wasn't registered before.
		Jetpack_Gutenberg::set_extension_available( $block_name );
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

		/** If the WordAds module is not active, don't render the block. */
		if ( ! self::is_jetpack_module_active() ) {
			return '';
		}

		/** This filter is already documented in modules/wordads/class-wordads.php `insert_ad()` */
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

		// section_id is mostly deprecated at this point, but it helps us (devs) keep track of which ads end up where
		// 6 is to keep track of gutenblock ads.
		$section_id = $wordads->params->blog_id . '6';
		$align      = 'center';
		if ( isset( $attr['align'] ) && in_array( $attr['align'], array( 'left', 'center', 'right' ), true ) ) {
			$align = $attr['align'];
		}
		$align = 'align' . $align;

		$ad_tag_ids = $wordads->get_ad_tags();
		$format     = 'mrec';
		if ( isset( $attr['format'] ) && isset( $ad_tag_ids[ $attr['format'] ] ) ) {
			$format = $attr['format'];
		}

		$height   = $ad_tag_ids[ $format ]['height'];
		$width    = $ad_tag_ids[ $format ]['width'];
		$location = 'gutenberg';
		$snippet  = $wordads->get_ad_snippet( $section_id, $height, $width, $location, $wordads->get_solo_unit_css() );

		$key          = "{$location}_{$width}x{$height}";
		$smart_format = self::$gutenberg_ad_snippet_x_smart_format[ $key ] ?? null;
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$is_watl_enabled = $smart_format && ( isset( $_GET[ $smart_format ] ) && 'true' === $_GET[ $smart_format ] );
		$ad_div          = $wordads->get_ad_div( 'inline', $snippet, array( $align ) );
		// Render IPW div if WATL is not enabled.
		if ( ! $is_watl_enabled ) {
			return $ad_div;
		}

		// Remove linebreaks and sanitize.
		$snippet = esc_js( str_replace( array( "\n", "\t", "\r" ), '', $ad_div ) );

		// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
		$fallback_snippet = <<<HTML
			<script>
				var sas_fallback = sas_fallback || [];
				sas_fallback.push(
					{ tag: "$snippet", type: '$smart_format' }
				);
			</script>
HTML;

		return $fallback_snippet . $wordads->get_watl_ad_html_tag( $smart_format );
	}
}

add_action( 'init', array( 'Automattic\\Jetpack\\Extensions\\WordAds', 'register' ) );
add_action( 'jetpack_register_gutenberg_extensions', array( 'Automattic\\Jetpack\\Extensions\\WordAds', 'set_availability' ) );
