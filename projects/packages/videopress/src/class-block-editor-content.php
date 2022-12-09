<?php
/**
 * VideoPress Block Editor Content
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * VideoPress block editor class for content generation
 */
class Block_Editor_Content {
	/**
	 * Initializer
	 *
	 * This method should be called only once by the Initializer class. Do not call this method again.
	 */
	public static function init() {
		if ( ! Status::is_active() ) {
			return;
		}

		add_shortcode( 'jetpack_videopress', array( static::class, 'videopress_embed_shortcode' ) );
		add_filter( 'default_content', array( static::class, 'videopress_video_block_by_guid' ), 10, 2 );
	}

	/**
	 * VideoPress embed shortcode
	 *
	 * Example use:
	 * [jetpack_videopress guid=tLvEwHYZ width=560 height=315]
	 *
	 * @param array $atts Shortcode attributes.
	 *
	 * @return string html
	 */
	public static function videopress_embed_shortcode( $atts ) {
		$atts = shortcode_atts(
			array(
				'guid'   => '', // string.
				'width'  => 560, // int.
				'height' => 315, // int.
			),
			$atts,
			'jetpack_videopress'
		);

		$guid = sanitize_text_field( wp_unslash( $atts['guid'] ) );

		if ( empty( $guid ) ) {
			return '<!-- error: missing VideoPress video ID -->';
		}

		$width  = (int) $atts['width'];
		$height = (int) $atts['height'];
		$src    = esc_url( 'https://videopress.com/embed/' . $guid );

		wp_enqueue_script( 'videopress-iframe', 'https://videopress.com/videopress-iframe.js', array(), Package_Version::PACKAGE_VERSION, true );

		$block_template =
		'<figure class="wp-block-videopress-video wp-block-jetpack-videopress jetpack-videopress-player">' .
			'<div class="jetpack-videopress-player__wrapper">' .
				'<iframe ' .
					'title="' . __( 'VideoPress Video Player', 'jetpack-videopress-pkg' ) . '" ' .
					'aria-label="' . __( 'VideoPress Video Player', 'jetpack-videopress-pkg' ) . '" ' .
					'src="%s" ' .
					'width="%s"' .
					'height="%s" ' .
					'frameborder="0" ' .
					'allowfullscreen data-resize-to-parent="true" allow="clipboard-write">' .
				'</iframe>' .
			'</div>' .
		'</figure>';

		return sprintf( $block_template, $src, $width, $height );
	}

	/**
	 * Generates a VideoPress video block content with the given guid
	 *
	 * @param string  $content Post content.
	 * @param WP_Post $post Post.
	 * @return string
	 */
	public static function videopress_video_block_by_guid( $content, $post ) {
		if ( isset( $_GET['videopress_guid'], $_GET['_wpnonce'] )
			&& wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'videopress-content-nonce' )
			&& current_user_can( 'edit_post', $post->ID )
			&& '' === $content
		) {
			$guid = sanitize_text_field( wp_unslash( $_GET['videopress_guid'] ) );
			$url  = esc_url( 'https://videopress.com/v/' . $guid . '?resizeToParent=true&cover=true&preloadContent=metadata&useAverageColor=true' );

			if ( ! empty( $guid ) ) {
				// ref /client/lib/url/index.ts
				$content = '<!-- wp:videopress/video {"guid":"' . $guid . '"} -->
				<figure class="wp-block-videopress-video wp-block-jetpack-videopress jetpack-videopress-player">
					<div class="jetpack-videopress-player__wrapper">' . $url . '</div>
				</figure>
				<!-- /wp:videopress/video -->';
			}
		}

		return $content;
	}
}
