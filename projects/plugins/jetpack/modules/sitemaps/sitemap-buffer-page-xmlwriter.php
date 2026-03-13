<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * XMLWriter implementation of the page sitemap buffer.
 *
 * @since 14.6
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * A buffer for constructing sitemap page xml files using XMLWriter.
 *
 * @since 14.6
 */
class Jetpack_Sitemap_Buffer_Page_XMLWriter extends Jetpack_Sitemap_Buffer_XMLWriter {

	/**
	 * Initialize the buffer with required headers (no root element here).
	 */
	protected function initialize_buffer() {
		// Add generator comment
		$this->writer->writeComment( "generator='jetpack-" . JETPACK__VERSION . "'" );
		$this->writer->writeComment( 'Jetpack_Sitemap_Buffer_Page_XMLWriter' );

		// Add stylesheet
		$this->writer->writePi(
			'xml-stylesheet',
			'type="text/xsl" href="' . $this->finder->construct_sitemap_url( 'sitemap.xsl' ) . '"'
		);
	}

	/**
	 * Start the root element and write its namespaces.
	 */
	protected function start_root() {
		$this->writer->startElement( 'urlset' );

		/**
		 * Filter the attribute value pairs used for namespace and namespace URI mappings.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param array $namespaces Associative array with namespaces and namespace URIs.
		 */
		$namespaces = apply_filters(
			'jetpack_sitemap_ns',
			array(
				'xmlns:xsi'          => 'http://www.w3.org/2001/XMLSchema-instance',
				'xsi:schemaLocation' => 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
				'xmlns'              => 'http://www.sitemaps.org/schemas/sitemap/0.9',
			)
		);

		foreach ( $namespaces as $name => $value ) {
			$this->writer->writeAttribute( $name, $value );
		}
	}

	/**
	 * Append a URL entry to the sitemap.
	 *
	 * @param array $array The URL item to append.
	 */
	protected function append_item( $array ) {
		if ( ! empty( $array['url'] ) ) {
			$this->array_to_xml( $array );
		}
	}
}
