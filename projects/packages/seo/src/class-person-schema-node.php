<?php
/**
 * Site-level Person Schema.org node builder.
 *
 * Builds the Person JSON-LD node that represents the site as a whole when the
 * admin has declared the site represents a person (a personal site, portfolio,
 * or blog) rather than an organization. This is the site's publisher / main
 * entity — distinct from the per-author Person nodes built by
 * {@see Author_Schema_Node}, which describe the individual writers of posts.
 *
 * `name` / `description` come from the schema settings, falling back to site
 * identity (Site Title / Tagline) so the node is useful with zero configuration.
 * `image` reuses the Site Logo / Site Icon (personal sites commonly use a photo
 * there); `sameAs` comes from the settings. Values with no source are omitted, so
 * an unconfigured site still emits a valid node.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Builds the site-level Person node.
 */
class Person_Schema_Node {

	/**
	 * Build the Person node, or null when the site has no name to identify it (a
	 * Person entity with no name is not useful, so we emit nothing rather than
	 * something invalid).
	 *
	 * @param array $settings Optional schema settings: `name`, `description`,
	 *                        `sameAs` (array of URLs). Empty `name` / `description`
	 *                        fall back to site identity.
	 * @return array|null
	 */
	public static function build( array $settings = array() ) {
		$name = self::text( $settings['name'] ?? '' );
		if ( '' === $name ) {
			$name = self::text( get_bloginfo( 'name' ) );
		}
		if ( '' === $name ) {
			return null;
		}

		$node = array(
			'@type' => 'Person',
			'@id'   => Schema_Node_Ids::site_person(),
			'name'  => $name,
			'url'   => home_url( '/' ),
		);

		$description = self::text( $settings['description'] ?? '' );
		if ( '' === $description ) {
			$description = self::text( get_bloginfo( 'description' ) );
		}
		if ( '' !== $description ) {
			$node['description'] = $description;
		}

		$image = self::image();
		if ( null !== $image ) {
			$node['image'] = $image;
		}

		$same_as = Schema_Settings::sanitize_url_list( $settings['sameAs'] ?? array() );
		if ( ! empty( $same_as ) ) {
			$node['sameAs'] = $same_as;
		}

		return $node;
	}

	/**
	 * The person's image as an ImageObject: the Site Logo (Customizer) when set,
	 * otherwise the Site Icon. Null when the site has neither. Mirrors the
	 * Organization node's logo resolution so a site keeps the same image whichever
	 * entity it represents.
	 *
	 * @return array|null
	 */
	private static function image() {
		$custom_logo_id = get_theme_mod( 'custom_logo' );
		if ( $custom_logo_id ) {
			$src = wp_get_attachment_image_src( $custom_logo_id, 'full' );
			if ( is_array( $src ) && ! empty( $src[0] ) ) {
				$image = array(
					'@type' => 'ImageObject',
					'url'   => $src[0],
				);
				if ( ! empty( $src[1] ) && ! empty( $src[2] ) ) {
					$image['width']  = (int) $src[1];
					$image['height'] = (int) $src[2];
				}
				return $image;
			}
		}

		$icon_url = get_site_icon_url();
		if ( $icon_url ) {
			return array(
				'@type' => 'ImageObject',
				'url'   => $icon_url,
			);
		}

		return null;
	}

	/**
	 * Normalize a scalar setting/site value to trimmed plain text.
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
