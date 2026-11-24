<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * XMLWriter implementation of the image sitemap buffer.
 *
 * @since 14.6
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * A buffer for constructing sitemap image xml files using XMLWriter.
 *
 * @since 14.6
 */
class Jetpack_Sitemap_Buffer_Image_XMLWriter extends Jetpack_Sitemap_Buffer_XMLWriter {
	/**
	 * Initialize the buffer with required headers (no root element here).
	 */
	protected function initialize_buffer() {
		// Add generator comment
		$this->writer->writeComment( "generator='jetpack-" . JETPACK__VERSION . "'" );
		$this->writer->writeComment( 'Jetpack_Sitemap_Buffer_Image_XMLWriter' );

		// Add stylesheet
		foreach ( Jetpack_Sitemap_Stylist::sitemap_stylesheet_urls() as $url ) {
			$this->writer->writePi( 'xml-stylesheet', 'type="text/css" href="' . esc_xml( $url ) . '"' );
		}
	}

	/**
	 * Start the root element and write its namespaces.
	 */
	protected function start_root() {
		$this->writer->startElement( 'urlset' );

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

		$namespaces = Jetpack_Sitemap_Stylist::presentation_namespaces( $namespaces, 'image' );
		foreach ( $namespaces as $name => $value ) {
			$this->writer->writeAttribute( $name, $value );
		}
		$this->writer->writeRaw( Jetpack_Sitemap_Stylist::sitemap_title_xml( 'image' ) );
	}

	/**
	 * Append a URL entry with image information to the sitemap.
	 *
	 * @param array $array The URL item to append.
	 */
	protected function append_item( $array ) {
		if ( ! isset( $array['url'] ) || ! is_array( $array['url'] ) ) {
			return;
		}

		if ( isset( $array['url']['image:image'] ) ) {
			if ( empty( $array['url']['image:image']['image:title'] ) ) {
				unset( $array['url']['image:image']['image:title'] );
			}
			if ( empty( $array['url']['image:image']['image:caption'] ) ) {
				unset( $array['url']['image:image']['image:caption'] );
			}
		}

		$this->array_to_xml( $array );
	}
}
