<?php
/**
 * Class Jetpack_Contact_Info_Block
 *
 * @package Jetpack
 */

/**
 * Helper class that lets us add schema attributes dynamically because they are not something that is store with the content.
 * Due to the limitations of wp_kses.
 *
 * @since 7.1.0
 */
class Jetpack_Contact_Info_Block {

	/**
	 * Adds contact info schema attributes.
	 *
	 * @param array  $attr    Array containing the contact info block attributes.
	 * @param string $content String containing the contact info block content.
	 *
	 * @return string
	 */
	public static function render( $attr, $content ) {
		Jetpack_Gutenberg::load_assets_as_required( 'contact-info' );

		return str_replace(
			'class="wp-block-jetpack-contact-info"',
			'class="wp-block-jetpack-contact-info" itemprop="location" itemscope itemtype="http://schema.org/Organization"',
			$content
		);
	}

	/**
	 * Adds address schema attributes.
	 *
	 * @param array  $attr    Array containing the address block attributes.
	 * @param string $content String containing the address block content.
	 *
	 * @return string
	 */
	public static function render_address( $attr, $content ) {
		// Returns empty content if the only attribute set is linkToGoogleMaps.
		if ( ! self::has_attributes( $attr, array( 'linkToGoogleMaps' ) ) ) {
			return '';
		}
		$find    = array(
			'class="wp-block-jetpack-address"',
			'class="jetpack-address__address',
			// Closing " left out on purpose - there are multiple address fields and they all need to be updated with the same itemprop.
			'class="jetpack-address__region"',
			'class="jetpack-address__city"',
			'class="jetpack-address__postal"',
			'class="jetpack-address__country"',
		);
		$replace = array(
			'itemprop="address" itemscope itemtype="http://schema.org/PostalAddress" class="wp-block-jetpack-address" ',
			'itemprop="streetAddress" class="jetpack-address__address', // Closing " left out on purpose.
			'itemprop="addressRegion" class="jetpack-address__region"',
			'itemprop="addressLocality" class="jetpack-address__city"',
			'itemprop="postalCode" class="jetpack-address__postal"',
			'itemprop="addressCountry" class="jetpack-address__country"',
		);

		return str_replace( $find, $replace, $content );
	}

	/**
	 * Helper function that lets us determine if a block has any valid attributes.
	 *
	 * @param array $attr Array containing the block attributes.
	 * @param array $omit Array containing the block attributes that we ignore.
	 *
	 * @return string
	 */
	public static function has_attributes( $attr, $omit = array() ) {
		foreach ( $attr as $attribute => $value ) {
			if ( ! in_array( $attribute, $omit, true ) && ! empty( $value ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Adds email schema attributes.
	 *
	 * @param array  $attr    Array containing the email block attributes.
	 * @param string $content String containing the email block content.
	 *
	 * @return string
	 */
	public static function render_email( $attr, $content ) {
		if ( ! self::has_attributes( $attr ) ) {
			return '';
		}

		return str_replace( 'href="mailto:', 'itemprop="email" href="mailto:', $content );
	}

	/**
	 * Adds phone schema attributes.
	 *
	 * @param array  $attr    Array containing the phone block attributes.
	 * @param string $content String containing the phone block content.
	 *
	 * @return string
	 */
	public static function render_phone( $attr, $content ) {
		if ( ! self::has_attributes( $attr ) ) {
			return '';
		}

		return str_replace( 'href="tel:', 'itemprop="telephone" href="tel:', $content );
	}
}
