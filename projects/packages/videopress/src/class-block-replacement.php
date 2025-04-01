<?php
/**
 * Media block replacement class.
 *
 * @package automattic/jetpack-videopress
 **/

namespace Automattic\Jetpack\VideoPress;

/**
 * Class Block_Replacement
 **/
class Block_Replacement {
	/**
	 * Whether the class has been initiated.
	 *
	 * @var bool
	 */
	private static $initiated = false;

	/**
	 * Initialize replacement.
	 */
	public static function init() {
		if ( self::$initiated ) {
			return;
		}
		add_filter( 'render_block', array( self::class, 'replace_media_text_with_videopress' ), 10, 2 );
	}

	/**
	 * Replace video in Media & Text block with Videopress shortcode.
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block.
	 * @return string
	 */
	public static function replace_media_text_with_videopress( $block_content, $block ) {
		if ( $block['blockName'] === 'core/media-text' ) {
			$video_info = video_get_info_by_blogpostid( get_current_blog_id(), $block['attrs']['mediaId'] ?? 0 );
			if ( $video_info && $video_info->guid ) {
				$videopress_shortcode = sprintf( '[videopress %s]', esc_attr( $video_info->guid ) );
				$block_content        = preg_replace( '/<video.*?<\/video>/is', do_shortcode( $videopress_shortcode ), $block_content );
			}
		}
		return $block_content;
	}
}
