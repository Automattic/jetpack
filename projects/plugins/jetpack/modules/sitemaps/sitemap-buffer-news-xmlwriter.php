<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * XMLWriter implementation of the news sitemap buffer.
 *
 * @since 14.6
 * @package automattic/jetpack
 */

/**
 * A buffer for constructing sitemap news xml files using XMLWriter.
 *
 * @since 14.6
 */
class Jetpack_Sitemap_Buffer_News_XMLWriter extends Jetpack_Sitemap_Buffer_XMLWriter {

	/**
	 * Initialize the buffer with required headers and root element.
	 */
	protected function initialize_buffer() {
		// Add generator comment
		$this->writer->writeComment( "generator='jetpack-" . JETPACK__VERSION . "'" );
		$this->writer->writeComment( 'Jetpack_Sitemap_Buffer_News_XMLWriter' );
		$this->writer->writeComment( 'TEST COMMENT - GENERATED AT: ' . gmdate( 'Y-m-d H:i:s' ) );

		// Add stylesheet
		$this->writer->writePi(
			'xml-stylesheet',
			'type="text/xsl" href="' . $this->finder->construct_sitemap_url( 'news-sitemap.xsl' ) . '"'
		);

		// Start root element with namespaces
		$this->writer->startElement( 'urlset' );

		/**
		 * Filter the attribute value pairs used for namespace and namespace URI mappings.
		 *
		 * @module sitemaps
		 *
		 * @since 4.8.0
		 *
		 * @param array $namespaces Associative array with namespaces and namespace URIs.
		 */
		$namespaces = apply_filters(
			'jetpack_sitemap_news_ns',
			array(
				'xmlns'              => 'http://www.sitemaps.org/schemas/sitemap/0.9',
				'xmlns:news'         => 'http://www.google.com/schemas/sitemap-news/0.9',
				'xmlns:xsi'          => 'http://www.w3.org/2001/XMLSchema-instance',
				'xsi:schemaLocation' => 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
			)
		);

		foreach ( $namespaces as $name => $value ) {
			$this->writer->writeAttribute( $name, $value );
		}
	}

	/**
	 * Append a URL entry with news information to the sitemap.
	 *
	 * @param array $array The URL item to append.
	 */
	protected function append_item( $array ) {
		if ( ! empty( $array['url'] ) ) {
			$this->writer->startElement( 'url' );

			// Add URL elements
			foreach ( $array['url'] as $tag => $value ) {
				if ( $tag === 'news:news' ) {
					$this->writer->startElement( 'news:news' );
					foreach ( $value as $news_tag => $news_value ) {
						if ( $news_tag === 'news:publication' ) {
							$this->writer->startElement( 'news:publication' );
							foreach ( $news_value as $pub_tag => $pub_value ) {
								$this->writer->writeElement( $pub_tag, strval( $pub_value ) );
							}
							$this->writer->endElement(); // news:publication
						} else {
							$this->writer->writeElement( $news_tag, strval( $news_value ) );
						}
					}
					$this->writer->endElement(); // news:news
				} else {
					$this->writer->writeElement( $tag, strval( $value ) );
				}
			}

			$this->writer->endElement(); // url
		}
	}
}
