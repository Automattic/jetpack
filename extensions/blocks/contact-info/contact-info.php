<?php
/**
 * Contact Info block and its child blocks.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/contact-info',
	array(
		'render_callback' => array( 'Jetpack_Contact_Info_Block', 'render' )
	)
);

jetpack_register_block(
	'jetpack/address',
	array(
		'parent' => array( 'jetpack/contact-info' ),
	    'render_callback' => array( 'Jetpack_Contact_Info_Block', 'render_address' )
	)
);

jetpack_register_block(
	'jetpack/email',
	array(
		'parent' => array( 'jetpack/contact-info' ),
	    'render_callback' => array( 'Jetpack_Contact_Info_Block', 'render_email' )
	)
);

jetpack_register_block(
	'jetpack/phone',
	array(
		'parent' => array( 'jetpack/contact-info' ),
		'render_callback' => array( 'Jetpack_Contact_Info_Block', 'render_phone' )
	)
);

/**
 * Class Jetpack_Contact_Info_Block
 *
 * Helper class that lets us add schema attributes dynamically because they are not something that is store with the content
 *
 */
class Jetpack_Contact_Info_Block {

	/**
	 * Adds contact info schema attributes
	 *
	 * @param array  $attr    Array containing the contact info block attributes.
	 * @param string $content String containing the contact info block content.
	 *
	 * @return string
	 */
	static function render( $attr, $content ) {
		Jetpack_Gutenberg::load_assets_as_required( 'contact-info' );
		if( $content )
		return str_replace(
			'class="wp-block-jetpack-contact-info"',
			'class="wp-block-jetpack-contact-info" itemprop="location" itemscope itemtype="http://schema.org/Organization"',
			$content );
	}

	/**
	 * Adds address schema attributes
	 *
	 * @param array  $attr    Array containing the address block attributes.
	 * @param string $content String containing the address block content.
	 *
	 * @return string
	 */
	static function render_address( $attr, $content ) {
		if ( ! self::has_attributes( $attr, array( 'linkToGoogleMaps' ) ) ) {
			return ''; // nothing to see here
		}
		$find = array(
			'class="wp-block-jetpack-address"',
			'class="jetpack-address__address',// Closing " left out on purpose
			'class="jetpack-address__region"',
			'class="jetpack-address__city"',
			'class="jetpack-address__postal"',
			'class="jetpack-address__country"',
		);
		$replace = array(
			'itemprop="address" itemscope itemtype="http://schema.org/PostalAddress" class="wp-block-jetpack-address" ',
			'itemprop="streetAddress" class="jetpack-address__address', // Closing " left out on purpose
			'itemprop="addressRegion" class="jetpack-address__region"',
			'itemprop="addressLocality" class="jetpack-address__city"',
			'itemprop="postalCode" class="jetpack-address__postal"',
			'itemprop="addressCountry" class="jetpack-address__country"',
		);
		return str_replace( $find, $replace, $content );
	}

	/**
	 * Adds email schema attributes
	 *
	 * @param array  $attr    Array containing the email block attributes.
	 * @param string $content String containing the email block content.
	 *
	 * @return string
	 */
	static function render_email( $attr, $content ) {
		if ( ! self::has_attributes( $attr ) ) {
			return ''; // nothing to see here
		}
		return str_replace( 'href="mailto:', 'itemprop="email" href="mailto:', $content );
	}

	/**
	 * Adds phone schema attributes
	 *
	 * @param array  $attr    Array containing the phone block attributes.
	 * @param string $content String containing the phone block content.
	 *
	 * @return string
	 */
	static function render_phone( $attr, $content ) {
		if ( ! self::has_attributes( $attr ) ) {
			return ''; // nothing to see here
		}
		return str_replace( 'href="tel:', 'itemprop="telephone" href="tel:', $content );
	}

	/**
	 * Helper function that lets us determine if a block has any valid attributes.
	 *
	 * @param array  $attr Array containing the block attributes.
	 * @param array $omit  Array containing the block attributes that we ignore.
	 *
	 * @return string
	 */
	static function has_attributes( $attr, $omit = array() ) {
		foreach ( $attr as $attribute => $value ) {
			if ( ! in_array( $attribute, $omit ) && ! empty( $value )  )  {
				return true;
			}
		}
		return false;
	}
}
