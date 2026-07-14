<?php
/**
 * Site-level Organization Schema.org node builder.
 *
 * Builds the Organization JSON-LD node that represents the site as a publishing
 * entity. Most properties come straight from existing site identity — Site Title,
 * site URL, Site Logo / Site Icon, and Tagline — so the node is useful with zero
 * configuration. Properties with no WordPress source (social profiles `sameAs`,
 * `email`) come from the schema settings, passed in via `$settings`; they are
 * simply omitted until configured, so an unconfigured site still emits a valid
 * node.
 *
 * The `$settings` argument carries the effective values from
 * {@see Schema_Settings::get_organization()}: admin overrides for site-identity
 * fields, plus the `sameAs` / `email` values WordPress can't supply.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Builds the site-level Organization node.
 */
class Organization_Schema_Node {

	/**
	 * Build the Organization node, or null when the site has no name to identify
	 * it (an Organization entity with no name is not useful, so we emit nothing
	 * rather than something invalid).
	 *
	 * @param array $settings Optional schema settings: `name`, `description`,
	 *                        `sameAs` (array of URLs), `email`. Empty values fall
	 *                        back to site identity (or are omitted entirely).
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
			'@type' => 'Organization',
			'@id'   => Schema_Node_Ids::organization(),
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

		$logo = self::logo();
		if ( null !== $logo ) {
			$node['logo'] = $logo;
		}

		$same_as = Schema_Settings::sanitize_url_list( $settings['sameAs'] ?? array() );
		if ( ! empty( $same_as ) ) {
			$node['sameAs'] = $same_as;
		}

		$email = isset( $settings['email'] ) ? sanitize_email( (string) $settings['email'] ) : '';
		if ( '' !== $email ) {
			// Only from explicit settings — never auto-filled from admin_email.
			$node['email'] = $email;
		}

		return $node;
	}

	/**
	 * The site logo as an ImageObject: the Site Logo (Customizer) when set,
	 * otherwise the Site Icon. Null when the site has neither.
	 *
	 * @return array|null
	 */
	private static function logo() {
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
