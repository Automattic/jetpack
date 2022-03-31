<?php
/**
 * The Tags class file.
 *
 * @package automattic/jetpack-meta-tags
 */

namespace Automattic\Jetpack\Meta_Tags;

/**
 * The Tags class that is used to get and render tags.
 */
class Tags {
	/**
	 * Get an array containing all meta tags.
	 *
	 * @return array
	 */
	public function get_tags() {
		// @TODO
		$tags = array();

		/**
		 * Filters the meta tags that will be rendered.
		 *
		 * @since $$next-version$$
		 * @package meta-tags
		 * @param array $tags Array of meta tags. There's two different ways to add tags:
		 *    1) Default syntax: `'og:image' => 'https://example.com/image.jpg'`
		 *    2) Nested array syntax: `array( 'og:image' => 'https://example.com/image.jpg' )`. This is useful when
		 *       adding multiple properties for the same key (e.g. multiple 'og:image' tags).
		 * @see https://ogp.me/#array
		 */
		return apply_filters( 'jetpack_meta_tags_list', $tags );
	}

	/**
	 * Take a property and content and turn it into a meta tag.
	 *
	 * @param string $property Property of the tag (eg `og:image`).
	 * @param string $content Content of the tag (eg `https://example.com/image.jpg`).
	 * @return string Empty string if invalid, meta tag otherwise (`<meta property="og:image" content="https://example.com/image.jpg" />`).
	 */
	private function convert_tag_to_html( $property, $content ) {
		// Remove empty values, but allow false-y values (false and 0).
		if ( ! isset( $content ) ) {
			return '';
		}

		/**
		 * We support the array syntax for adding meta tags, e.g.
		 * `array( 'og:image' => 'https://example.com/image.jpg' ).
		 */
		if ( is_array( $content ) ) {
			if ( count( $content ) !== 1 ) {
				return '';
			}

			$property = array_keys( $content )[0];
			$content  = $content[ $property ];
		}

		$property = (string) $property;
		$content  = (string) $content;

		if ( empty( $property ) || empty( $content ) ) {
			return '';
		}

		$tag = sprintf(
			'<meta property="%s" content="%s" />',
			esc_attr( $property ),
			filter_var( $content, FILTER_VALIDATE_URL ) ? esc_url( $content ) : esc_attr( $content )
		);

		/**
		 * Filters the HTML output of an individual meta tag.
		 *
		 * @since $$next-version$$
		 * @package meta-tags
		 * @param string $tag HTML output of the tag.
		 * @param string $property Property of the tag (e.g. "og:image").
		 * @param string $content Content of the tag (e.g. "https://example.com/image.jpg").
		 */
		return apply_filters( 'jetpack_meta_tags_tag_output', $tag, $property, $content );
	}

	/**
	 * Take an array of tags and convert to HTML.
	 *
	 * @param array $tags List of tags to convert to HTML.
	 * @return string The HTML output.
	 */
	private function convert_tags_to_html( array $tags ) {
		$tags = array_map(
			function ( $key, $value ) {
				return $this->convert_tag_to_html( $key, $value );
			},
			array_keys( $tags ),
			$tags
		);

		$tags = join( '\\n', array_filter( $tags ) );

		/**
		 * Filters the HTML output of all meta tags.
		 *
		 * @since $$next-version$$
		 * @package meta-tags
		 * @param string $tag HTML output of the tags.
		 */
		return apply_filters( 'jetpack_meta_tags_tag_output', $tags );
	}

	/**
	 * Render meta tags.
	 *
	 * @param array $tags Array of tags to render. Default empty array.
	 * @param bool  $echo Echoes the tags if true, returns them otherwise.
	 */
	public function render_tags( $tags = array(), $echo = true ) {
		if ( empty( $tags ) || ! is_array( $tags ) ) {
			$tags = $this->get_tags( $tags );
		}

		$html = $this->convert_tags_to_html( $tags );

		if ( empty( $html ) ) {
			return;
		}

		if ( ! $echo ) {
			return $html;
		}

		echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- output is already escaped and/or filtered
	}
}
