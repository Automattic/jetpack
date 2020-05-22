<?php
/**
 * Sitemaps (per the protocol) are essentially lists of XML fragments;
 * lists which are subject to size constraints. The Jetpack_Sitemap_Buffer_Image
 * extends the Jetpack_Sitemap_Buffer class to represent the single image sitemap
 * buffer.
 *
 * @since 5.3.0
 * @package Jetpack
 */

/**
 * A buffer for constructing sitemap image xml files for users that have no libxml support.
 *
 * @since 5.3.0
 */
class Jetpack_Sitemap_Buffer_Image extends Jetpack_Sitemap_Buffer_Fallback {

	protected function get_root_element() {
		if ( ! isset( $this->root ) ) {

			/**
			 * Filter the XML namespaces included in image sitemaps.
			 *
			 * @module sitemaps
			 *
			 * @since 4.8.0
			 *
			 * @param array $namespaces Associative array with namespaces and namespace URIs.
			 */
			$namespaces = apply_filters(
				'jetpack_sitemap_image_ns',
				array(
					'xmlns:xsi'          => 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation' => 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
					'xmlns'              => 'http://www.sitemaps.org/schemas/sitemap/0.9',
					'xmlns:image'        => 'http://www.google.com/schemas/sitemap-image/1.1',
				)
			);

			$sitemap_xsl_url = $this->finder->construct_sitemap_url( 'sitemap.xsl' );
			$jetpack_version = JETPACK__VERSION;

			$this->root = array(
				"<!-- generator='jetpack-{$jetpack_version}' -->" . PHP_EOL
				. "<?xml-stylesheet type='text/xsl' href='{$sitemap_xsl_url}'?>" . PHP_EOL
				. '<urlset ' . $this->array_to_xml_attr_string( $namespaces ) . '>' . PHP_EOL,
				'</urlset>'
			);

			$this->byte_capacity -= strlen( join( '', $this->root ) );
		}

		return $this->root;
	}
}
