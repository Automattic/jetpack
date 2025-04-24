<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * XMLWriter implementation of the video sitemap buffer.
 *
 * @since $$next-version$$
 * @package automattic/jetpack
 */

/**
 * A buffer for constructing sitemap video xml files using XMLWriter.
 *
 * @since $$next-version$$
 */
class Jetpack_Sitemap_Buffer_Video_XMLWriter extends Jetpack_Sitemap_Buffer_XMLWriter {

	/**
	 * Initialize the buffer with required headers and root element.
	 */
	protected function initialize_buffer() {
		// Add generator comment
		$this->writer->writeComment( "generator='jetpack-" . JETPACK__VERSION . "'" );
		$this->writer->writeComment( 'Jetpack_Sitemap_Buffer_Video_XMLWriter' );

		// Add stylesheet
		$this->writer->writePi(
			'xml-stylesheet',
			'type="text/xsl" href="' . $this->finder->construct_sitemap_url( 'video-sitemap.xsl' ) . '"'
		);

		// Start root element with namespaces
		$this->writer->startElement( 'urlset' );

		/**
		 * Filter the XML namespaces included in video sitemaps.
		 *
		 * @module sitemaps
		 *
		 * @since 4.8.0
		 *
		 * @param array $namespaces Associative array with namespaces and namespace URIs.
		 */
		$namespaces = apply_filters(
			'jetpack_sitemap_video_ns',
			array(
				'xmlns:xsi'          => 'http://www.w3.org/2001/XMLSchema-instance',
				'xsi:schemaLocation' => 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
				'xmlns'              => 'http://www.sitemaps.org/schemas/sitemap/0.9',
				'xmlns:video'        => 'http://www.google.com/schemas/sitemap-video/1.1',
			)
		);

		foreach ( $namespaces as $name => $value ) {
			$this->writer->writeAttribute( $name, $value );
		}
	}

	/**
	 * Append a URL entry with video information to the sitemap.
	 *
	 * @param array $array The URL item to append.
	 */
	protected function append_item( $array ) {
		if ( ! empty( $array['url'] ) ) {
			$this->writer->startElement( 'url' );

			// Add URL elements
			foreach ( $array['url'] as $tag => $value ) {
				if ( $tag !== 'videos' ) {
					$this->writer->writeElement( $tag, strval( $value ) );
				}
			}

			// Add video:video elements
			if ( ! empty( $array['url']['videos'] ) ) {
				foreach ( $array['url']['videos'] as $video ) {
					$this->writer->startElement( 'video:video' );
					foreach ( $video as $tag => $value ) {
						$this->writer->writeElement( "video:$tag", strval( $value ) );
					}
					$this->writer->endElement(); // video:video
				}
			}

			$this->writer->endElement(); // url
		}
	}
}
