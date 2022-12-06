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

		add_filter( 'default_content', array( static::class, 'video_block_by_guid' ), 10, 2 );
	}

	/**
	 * Generates a video block content with the given guid
	 *
	 * @param string  $content Post content.
	 * @param WP_Post $post Post.
	 * @return string
	 */
	public static function video_block_by_guid( $content, $post ) {
		if ( isset( $_GET['videopress_guid'], $_GET['_wpnonce'] )
			&& wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'videopress-content-nonce' )
			&& current_user_can( 'edit_post', $post->ID )
			&& '' === $content
		) {
			$guid = sanitize_text_field( wp_unslash( $_GET['videopress_guid'] ) );

			if ( ! empty( $guid ) ) {
				// ref /client/lib/url/index.ts
				$content = '<!-- wp:videopress/video {"guid":"' . $guid . '"} -->
				<figure class="wp-block-videopress-video wp-block-jetpack-videopress jetpack-videopress-player">
					<div class="jetpack-videopress-player__wrapper">
						https://videopress.com/v/' . $guid . '?resizeToParent=true&amp;cover=true&amp;preloadContent=metadata&amp;useAverageColor=true
					</div>
				</figure>
				<!-- /wp:videopress/video -->';
			}
		}

		return $content;
	}
}
