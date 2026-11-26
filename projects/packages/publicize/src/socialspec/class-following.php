<?php
/**
 * FollowSpec: /.well-known/following.opml
 *
 * @link https://followspec.org/
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Socialspec;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * The followed feeds as OPML 2.0.
 */
class Following implements Document {

	/**
	 * Outline attributes that hold URLs.
	 */
	const URL_ATTRIBUTES = array( 'htmlUrl', 'xmlUrl', 'url' );

	/**
	 * The media type.
	 *
	 * @return string
	 */
	public function get_content_type() {
		return 'text/x-opml';
	}

	/**
	 * The OPML document.
	 *
	 * @return string|null Null if no feeds are followed.
	 */
	public function get_content() {
		/**
		 * Filters the feeds listed in /.well-known/following.opml.
		 *
		 * Each feed is an array of OPML outline attributes and needs an `xmlUrl`:
		 *
		 *     array(
		 *         'type'    => 'rss',
		 *         'text'    => 'Kottke',
		 *         'htmlUrl' => 'https://kottke.org/',
		 *         'xmlUrl'  => 'https://feeds.kottke.org/main',
		 *     )
		 *
		 * @since $$next-version$$
		 *
		 * @param array[] $outlines The outlines.
		 */
		$outlines = apply_filters( 'jetpack_social_following', array() );
		$outlines = array_filter( array_map( array( __CLASS__, 'sanitize_outline' ), (array) $outlines ) );

		if ( ! $outlines ) {
			return null;
		}

		$opml  = '<?xml version="1.0" encoding="' . esc_attr( get_bloginfo( 'charset' ) ) . '"?>' . "\n";
		$opml .= '<opml version="2.0">' . "\n";
		$opml .= "\t<head>\n";
		/* translators: %s: Site title. */
		$opml .= "\t\t<title>" . self::escape( sprintf( __( '%s Follows', 'jetpack-publicize-pkg' ), self::decode( get_bloginfo( 'name' ) ) ) ) . "</title>\n";
		$opml .= "\t\t<ownerId>" . self::escape( home_url( '/' ) ) . "</ownerId>\n";
		$opml .= "\t\t<docs>http://opml.org/spec2.opml</docs>\n";
		$opml .= "\t</head>\n";
		$opml .= "\t<body>\n";

		foreach ( $outlines as $outline ) {
			$opml .= "\t\t<outline";
			foreach ( $outline as $name => $value ) {
				$opml .= ' ' . $name . '="' . self::escape( $value ) . '"';
			}
			$opml .= " />\n";
		}

		$opml .= "\t</body>\n";
		$opml .= '</opml>' . "\n";

		return $opml;
	}

	/**
	 * Sanitizes the attributes of an outline.
	 *
	 * @param mixed $outline The outline attributes.
	 * @return array The attributes, or an empty array if the outline has no valid feed URL.
	 */
	private static function sanitize_outline( $outline ) {
		if ( ! is_array( $outline ) ) {
			return array();
		}

		$attributes = array();

		foreach ( $outline as $name => $value ) {
			if ( ! is_string( $name ) || ! preg_match( '/^[A-Za-z_][A-Za-z0-9_.-]*$/', $name ) || ! is_scalar( $value ) ) {
				continue;
			}

			$value = self::decode( (string) $value );

			if ( in_array( $name, self::URL_ATTRIBUTES, true ) ) {
				$value = self::sanitize_url( $value );
			}

			// Control characters are not allowed in XML 1.0.
			$value = (string) preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $value );

			if ( '' !== $value ) {
				$attributes[ $name ] = $value;
			}
		}

		if ( ! isset( $attributes['xmlUrl'] ) ) {
			return array();
		}

		// OPML 2.0 requires a text attribute.
		if ( ! isset( $attributes['text'] ) ) {
			$attributes['text'] = $attributes['title'] ?? (string) wp_parse_url( $attributes['xmlUrl'], PHP_URL_HOST );
		}

		return $attributes;
	}

	/**
	 * An absolute http(s) URL, or an empty string: an OPML file has no base URL to resolve others against.
	 *
	 * @param string $url The URL.
	 * @return string
	 */
	private static function sanitize_url( $url ) {
		$url   = esc_url_raw( $url, array( 'http', 'https' ) );
		$parts = wp_parse_url( $url );

		return ! empty( $parts['scheme'] ) && ! empty( $parts['host'] ) ? $url : '';
	}

	/**
	 * Decodes the HTML entities of stored values, like the site title, before they are escaped for XML.
	 *
	 * @param string $value The value.
	 * @return string
	 */
	private static function decode( $value ) {
		return html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, get_bloginfo( 'charset' ) );
	}

	/**
	 * Escapes text and attribute values for XML. esc_xml() would keep CDATA sections.
	 *
	 * @param string $value The value.
	 * @return string
	 */
	private static function escape( $value ) {
		return htmlspecialchars( $value, ENT_XML1 | ENT_QUOTES | ENT_SUBSTITUTE, get_bloginfo( 'charset' ) );
	}
}
