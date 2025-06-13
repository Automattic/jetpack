<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * XMLWriter implementation of the master sitemap buffer.
 *
 * @since 14.6
 * @package automattic/jetpack
 */

/**
 * A buffer for constructing master sitemap xml files using XMLWriter.
 *
 * @since 14.6
 */
class Jetpack_Sitemap_Buffer_Master_XMLWriter extends Jetpack_Sitemap_Buffer_XMLWriter {

	/**
	 * Initialize the buffer with required headers and root element.
	 */
	protected function initialize_buffer() {
		// Add generator comment
		$this->writer->writeComment( "generator='jetpack-" . JETPACK__VERSION . "'" );
		$this->writer->writeComment( 'Jetpack_Sitemap_Buffer_Master_XMLWriter' );

		// Add stylesheet
		$this->writer->writePi(
			'xml-stylesheet',
			'type="text/xsl" href="' . $this->finder->construct_sitemap_url( 'sitemap-index.xsl' ) . '"'
		);

		// Start root element with namespaces
		$this->writer->startElement( 'sitemapindex' );
		$this->writer->writeAttribute( 'xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9' );
	}

	/**
	 * Append a sitemap entry to the master sitemap.
	 *
	 * @param array $array The sitemap item to append.
	 */
	protected function append_item( $array ) {
		if ( ! empty( $array['sitemap'] ) ) {
			$this->writer->startElement( 'sitemap' );

			foreach ( $array['sitemap'] as $tag => $value ) {
				$this->writer->writeElement( $tag, strval( $value ) );
			}

			$this->writer->endElement(); // sitemap
		}
	}
}
