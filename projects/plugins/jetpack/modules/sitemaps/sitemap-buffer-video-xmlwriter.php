<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * XMLWriter implementation of the video sitemap buffer.
 *
 * @since 14.6
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * A buffer for constructing sitemap video xml files using XMLWriter.
 *
 * @since 14.6
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
		// Return early if missing fundamental data.
		if ( empty( $array['url']['video:video'] ) ) {
			return;
		}

		$this->writer->startElement( 'url' );

		// Add URL elements
		foreach ( $array['url'] as $url_tag => $url_value ) {
			if ( $url_tag === 'video:video' ) {
				// Add video:video element and its children.
				$this->writer->startElement( 'video:video' );
				foreach ( $array['url']['video:video'] as $video_tag => $video_value ) {
					$this->writer->writeElement( $video_tag, strval( $video_value ) );
				}
				$this->writer->endElement(); // video
			} else {
				// Add other eleents.
				$this->writer->writeElement( $url_tag, strval( $url_value ) );
			}
		}

		$this->writer->endElement(); // url
	}
}
