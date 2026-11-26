<?php
/**
 * ContactSpec: /.well-known/contact.vcf
 *
 * @link https://contactspec.org/
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Socialspec;

/**
 * The site as a vCard 3.0 (RFC 2426), without an email address.
 */
class Contact implements Document {

	/**
	 * The media type.
	 *
	 * @return string
	 */
	public function get_content_type() {
		return 'text/vcard';
	}

	/**
	 * The vCard: site title, URL, tagline and icon.
	 *
	 * @return string
	 */
	public function get_content() {
		$host = (string) wp_parse_url( home_url(), PHP_URL_HOST );
		$name = self::decode( get_bloginfo( 'name' ) );

		$lines = array(
			'BEGIN:VCARD',
			'VERSION:3.0',
			'FN:' . self::escape( '' !== $name ? $name : $host ),
			'N:;;;;',
			'URL:' . self::uri( home_url( '/' ) ),
		);

		$description = self::decode( get_bloginfo( 'description' ) );
		if ( '' !== $description ) {
			$lines[] = 'NOTE:' . self::escape( $description );
		}

		$icon = get_site_icon_url( 512 );
		if ( '' !== $icon ) {
			$lines[] = 'PHOTO;VALUE=uri:' . self::uri( $icon );
		}

		$lines[] = 'NICKNAME:' . self::escape( '@' . $host );
		$lines[] = 'SOURCE:' . self::uri( home_url( '/.well-known/contact.vcf' ) );
		$lines[] = 'END:VCARD';

		return implode( "\r\n", array_map( array( __CLASS__, 'fold' ), $lines ) ) . "\r\n";
	}

	/**
	 * Escapes a text value (RFC 2426, section 4).
	 *
	 * @param string $value The value.
	 * @return string
	 */
	private static function escape( $value ) {
		return str_replace(
			array( '\\', ',', ';', "\r\n", "\r", "\n" ),
			array( '\\\\', '\\,', '\\;', '\\n', '\\n', '\\n' ),
			$value
		);
	}

	/**
	 * A URI value, which is not escaped as text but must stay on its line.
	 *
	 * @param string $value The URI.
	 * @return string
	 */
	private static function uri( $value ) {
		return str_replace( array( "\r", "\n" ), '', $value );
	}

	/**
	 * Folds a content line at 75 octets without splitting multibyte characters.
	 *
	 * @param string $line The content line.
	 * @return string
	 */
	private static function fold( $line ) {
		$folded = '';
		$length = 0;

		// Split into UTF-8 characters, or bytes if the line is not valid UTF-8.
		$chars = preg_split( '//u', $line, -1, PREG_SPLIT_NO_EMPTY );
		if ( ! $chars ) {
			$chars = str_split( $line );
		}

		foreach ( $chars as $char ) {
			if ( $length + strlen( $char ) > 75 ) {
				$folded .= "\r\n ";
				$length  = 1;
			}

			$folded .= $char;
			$length += strlen( $char );
		}

		return $folded;
	}

	/**
	 * Decodes the HTML entities WordPress stores in site options.
	 *
	 * @param string $value The value.
	 * @return string
	 */
	private static function decode( $value ) {
		return html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, get_bloginfo( 'charset' ) );
	}
}
