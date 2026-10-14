<?php
/**
 * Images in comments.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

/**
 * The image block in a comment: a URL a commenter gave, never an upload. The stored comment holds the
 * URL as text, so nothing that prints it raw loads it.
 */
class Images {

	/**
	 * The most images one comment draws. The rest stay links.
	 */
	const PER_COMMENT = 4;

	/**
	 * Whether the editor offers the image block, and comments draw the ones they hold.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Offer the image block in the Jetpack Comments editor. Off, comments show their images as links.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether to offer it. Default true, wherever the block editor is on.
		 */
		return Block_Editor::is_enabled() && (bool) apply_filters( 'jetpack_comments_block_editor_images', true );
	}

	/**
	 * Whether the comment's author signed in: a site account, or the identity the comment form's
	 * sign-in recorded.
	 *
	 * @param \WP_Comment $comment The comment.
	 * @return bool
	 */
	public static function signed_in( \WP_Comment $comment ) {
		return (int) $comment->user_id > 0 || '' !== (string) get_comment_meta( (int) $comment->comment_ID, Checkpoint::META_ID, true );
	}

	/**
	 * The image block as this package writes it: the URL and alt text in its attributes, and the URL
	 * as the figure's text. Past the comment's limit, or where images are off, it is a paragraph
	 * holding the link. At render, the figure draws an https image, or the link where it may not.
	 *
	 * @param array     $block  Parsed image block.
	 * @param bool|null $render Null while saving; at render, whether the comment may show the image.
	 * @param int       $count  Images the comment has drawn so far, counted up here.
	 * @return array|null The block to keep, if any.
	 */
	public static function block( array $block, $render, &$count ) {
		$url = self::url( $block );

		if ( ! $url ) {
			return null;
		}

		$link = Block_Editor::paragraph( '<a href="' . esc_url( $url ) . '" rel="nofollow ugc">' . esc_html( $url ) . '</a>' );

		if ( ! self::is_enabled() || ++$count > self::PER_COMMENT ) {
			return $link;
		}

		$alt = self::alt( $block );

		if ( null === $render ) {
			$block['attrs'] = '' === $alt ? array( 'url' => $url ) : array(
				'url' => $url,
				'alt' => $alt,
			);
			$html           = '<figure class="wp-block-image">' . esc_html( $url ) . '</figure>';
		} else {
			// An http image would be mixed content on the https page.
			if ( ! $render || 'https' !== wp_parse_url( $url, PHP_URL_SCHEME ) ) {
				return $link;
			}

			wp_enqueue_style( 'wp-block-image' );

			$img = new \WP_HTML_Tag_Processor( '<img>' );
			$img->next_tag();
			$img->set_attribute( 'src', $url );
			$img->set_attribute( 'alt', $alt );
			$img->set_attribute( 'loading', 'lazy' );
			$img->set_attribute( 'decoding', 'async' );
			$img->set_attribute( 'referrerpolicy', 'no-referrer' );
			$img->set_attribute( 'style', 'max-width:100%;height:auto' );

			$block['attrs'] = array();
			$html           = '<figure class="wp-block-image">' . $img->get_updated_html() . '</figure>';
		}

		$block['innerBlocks']  = array();
		$block['innerHTML']    = $html;
		$block['innerContent'] = array( $html );

		return $block;
	}

	/**
	 * The link, where a caller runs the comment through do_blocks() before `comment_text`, as
	 * WordPress.com's notifications do: core's own render draws nothing for a figure without an img.
	 *
	 * @param string $content What core drew.
	 * @param array  $block   Parsed block.
	 * @return string
	 */
	public static function render_core( $content, $block ) {
		if ( '' !== $content || ! isset( $block['attrs']['url'] ) ) {
			return $content;
		}

		$count = 0;
		$link  = self::block( $block, false, $count );

		return $link ? $link['innerHTML'] : $content;
	}

	/**
	 * The image's URL: http or https and under 2 KB, from this package's attribute or from the src
	 * Verbum's editor saved.
	 *
	 * @param array $block Parsed image block.
	 * @return string Empty when there is none.
	 */
	private static function url( array $block ) {
		$url = isset( $block['attrs']['url'] ) && is_string( $block['attrs']['url'] ) ? $block['attrs']['url'] : null;

		if ( null === $url ) {
			$tags = new \WP_HTML_Tag_Processor( $block['innerHTML'] );
			$url  = $tags->next_tag( 'img' ) ? $tags->get_attribute( 'src' ) : null;
		}

		if ( ! is_string( $url ) ) {
			return '';
		}

		// kses writes & as &amp; in the block's attributes.
		$url = trim( html_entity_decode( $url, ENT_QUOTES ) );

		return strlen( $url ) > 2048 ? '' : esc_url_raw( $url, array( 'http', 'https' ) );
	}

	/**
	 * The image's alt text, from this package's attribute or from the img Verbum's editor saved.
	 *
	 * @param array $block Parsed image block.
	 * @return string
	 */
	private static function alt( array $block ) {
		$alt = isset( $block['attrs']['alt'] ) && is_string( $block['attrs']['alt'] ) ? $block['attrs']['alt'] : null;

		if ( null === $alt ) {
			$tags = new \WP_HTML_Tag_Processor( $block['innerHTML'] );
			$alt  = $tags->next_tag( 'img' ) ? $tags->get_attribute( 'alt' ) : null;
		}

		return is_string( $alt ) ? trim( wp_strip_all_tags( html_entity_decode( $alt, ENT_QUOTES ) ) ) : '';
	}
}
