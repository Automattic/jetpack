<?php

namespace Automattic\Jetpack_Boost\Lib\Utils;

use enshrined\svgSanitize\data\AllowedAttributes;
use enshrined\svgSanitize\data\AllowedTags;

/**
 * Utility class to transform SVG sanitizer arrays into wp_kses compatible format.
 *
 * This utilizes the enshrined/svg-sanitize library to get the allowed tags and attributes, which is maintained by 10up.
 *
 * @package Automattic\Jetpack_Boost\Lib\Utils
 */
class SVG_Sanitizer {

	/**
	 * Transform SVG sanitizer arrays into wp_kses compatible format.
	 *
	 * @return array The wp_kses compatible array of allowed HTML tags and attributes.
	 */
	private static function get_kses_svg_rules() {
		$allowed_tags = AllowedTags::getTags();
		// Allowed tags include a few HTML ones that we don't want to allow.
		$allowed_tags       = array_diff( $allowed_tags, array( 'a', 'font', 'image', 'style' ) );
		$allowed_attributes = AllowedAttributes::getAttributes();
		$kses_rules         = array();

		// Build the wp_kses compatible array
		foreach ( $allowed_tags as $tag ) {
			$kses_rules[ $tag ] = array_fill_keys( $allowed_attributes, true );
		}

		return $kses_rules;
	}

	/**
	 * Remove any tags that are not explicitly allowed, along with their content.
	 *
	 * @param string $html        The HTML to sanitize.
	 * @param array  $allowed_html Optional. Array of allowed HTML elements and their attributes.
	 * @return string The sanitized HTML.
	 */
	public function remove_disallowed_tags_and_content( $html, $allowed_html = array() ) {
		if ( empty( $allowed_html ) ) {
			$allowed_html = self::get_kses_svg_rules();
		}

		$allowed_tags         = array_keys( $allowed_html );
		$allowed_tags_pattern = implode( '|', array_map( 'preg_quote', $allowed_tags ) );

		// Remove any disallowed tags and their content. This is using reverse lookup to find the tags that are not in the allowed list. This let's us remove a whole tag, e.g. <script>something</script> including the content.
		$html = preg_replace_callback(
			'#<((?!' . $allowed_tags_pattern . ')[a-z0-9]+)(\s[^>]*)?>(.*?)</\1>#is',
			function () {
				return '';
			},
			$html
		);

		// wp_kses the rest to clean up what's left, orphan closing or self-closing tags.
		return wp_kses( $html, $allowed_html );
	}
}
