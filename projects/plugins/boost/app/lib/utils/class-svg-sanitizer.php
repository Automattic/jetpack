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

		/*
		This regex finds and removes any HTML/XML tags that aren't in our allowed list. Here's how it works:
		 *
		 * %                   - Pattern delimiter (using % instead of / or # to avoid conflicts with HTML/CSS content)
		 * <                   - Matches literal opening bracket of a tag
		 * (                   - Start capturing the tag name
		 *   (?!               - Negative lookahead (a way to say "not followed by")
		 *     (?:             - Non-capturing group
		 *       pattern|svg   - Our allowed tags joined with | (e.g., "svg|path|circle")
		 *     )               - End non-capturing group
		 *   )                 - End negative lookahead
		 *   [a-z][a-z0-9]*+   - Match a tag name: must start with letter, then letter/number, possessive quantifier
		 * )                   - End capturing the tag name
		 * (?:\s[^>]*)?+       - Optionally match attributes: whitespace then anything but >, possessive quantifier
		 * >                   - Matches literal closing bracket of opening tag
		 * .*?                 - Matches any content inside the tag
		 * </                  - Matches literal opening of closing tag
		 * \1                  - Matches same tag name we captured earlier
		 * \s*+                - Matches optional whitespace in closing tag, possessive quantifier
		 * >                   - Matches literal closing bracket
		 * %si                 - Pattern modifiers: s=dot matches newline, i=case insensitive
		 *
		 * Example: <script>alert('xss')</script> - "script" isn't in allowed tags, so whole thing is removed
		 */
		$html = preg_replace_callback(
			'%<((?!(?:' . $allowed_tags_pattern . '))[a-z][a-z0-9]*+)(?:\s[^>]*)?+>.*?</\\1\s*+>%si',
			function ( $matches ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Keeping phan happy!
				return '';
			},
			$html
		);

		// wp_kses the rest to clean up what's left, orphan closing or self-closing tags.
		return wp_kses( $html, $allowed_html );
	}
}
