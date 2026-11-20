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
	 * Whether the editor offers the image block, and comments draw the ones they hold.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Offer the image block in the Jetpack Comments editor. Off, comments show their images as links.
		 *
		 * @since 0.6.0
		 *
		 * @param bool $enabled Whether to offer it. Default true, wherever the block editor is on.
		 */
		return Block_Editor::is_enabled() && (bool) apply_filters( 'jetpack_comments_block_editor_images', true );
	}

	/**
	 * The image block as this package writes it: the URL in its attributes, and as the figure's text.
	 * An http image, one past the comment's limit, or any where images are off or the comment may not
	 * draw them is a paragraph holding the link. At render, the figure draws the image.
	 *
	 * @param array     $block  Parsed image block.
	 * @param bool|null $render Null while saving; at render, whether the comment may show the image.
	 * @param int       $count  Images the comment has drawn so far, counted up here.
	 * @return array|null The block to keep, if any.
	 */
	public static function block( array $block, $render, &$count ) {
		// This editor keeps the URL in the attributes; Verbum's kept it on an img.
		$tags = new \WP_HTML_Tag_Processor( $block['innerHTML'] );
		$url  = $block['attrs']['url'] ?? ( $tags->next_tag( 'img' ) ? $tags->get_attribute( 'src' ) : null );

		// kses writes & as &amp; in the block's attributes.
		$url = is_string( $url ) ? trim( html_entity_decode( $url, ENT_QUOTES ) ) : '';
		$url = strlen( $url ) > 2048 ? '' : esc_url_raw( $url, array( 'http', 'https' ) );

		if ( ! $url ) {
			return null;
		}

		$link = Block_Editor::paragraph( '<a href="' . esc_url( $url ) . '" rel="nofollow ugc">' . esc_html( $url ) . '</a>' );

		// An http image would be mixed content on the https page. Checked before the count, which only
		// images that draw use up: four a comment at most.
		if ( ! self::is_enabled() || false === $render || 'https' !== wp_parse_url( $url, PHP_URL_SCHEME ) || ++$count > 4 ) {
			return $link;
		}

		if ( null === $render ) {
			$block['attrs'] = array( 'url' => $url );
			$html           = '<figure class="wp-block-image">' . esc_html( $url ) . '</figure>';
		} else {
			wp_enqueue_style( 'wp-block-image' );

			$img = new \WP_HTML_Tag_Processor( '<img>' );
			$img->next_tag();
			$img->set_attribute( 'src', $url );
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
}
