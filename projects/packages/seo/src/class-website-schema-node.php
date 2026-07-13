<?php
/**
 * Site-level WebSite Schema.org node builder.
 *
 * Builds the WebSite JSON-LD node from existing site identity: Site Title,
 * site URL, Tagline, site language, and core WordPress search.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Builds the site-level WebSite node.
 */
class Website_Schema_Node {

	/**
	 * Build the WebSite node, or null when the site has no name to identify it.
	 *
	 * @return array|null
	 */
	public static function build() {
		$name = self::text( get_bloginfo( 'name' ) );
		if ( '' === $name ) {
			return null;
		}

		$node = array(
			'@type'           => 'WebSite',
			'@id'             => Schema_Node_Ids::website(),
			'name'            => $name,
			'url'             => home_url( '/' ),
			'potentialAction' => array(
				'@type'       => 'SearchAction',
				'target'      => array(
					'@type'       => 'EntryPoint',
					'urlTemplate' => home_url( '/?s={search_term_string}' ),
				),
				'query-input' => 'required name=search_term_string',
			),
		);

		$description = self::text( get_bloginfo( 'description' ) );
		if ( '' !== $description ) {
			$node['description'] = $description;
		}

		$language = self::text( get_bloginfo( 'language' ) );
		if ( '' !== $language ) {
			$node['inLanguage'] = $language;
		}

		return $node;
	}

	/**
	 * Normalize a scalar site value to trimmed plain text.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private static function text( $value ) {
		if ( ! is_string( $value ) ) {
			return '';
		}
		return trim( wp_strip_all_tags( $value ) );
	}
}
