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
	 * Initialize the buffer with required headers and root element.
	 */
	protected function initialize_buffer() {
		// Add generator comment
		$this->writer->writeComment( "generator='jetpack-" . JETPACK__VERSION . "'" );
		$this->writer->writeComment( 'Jetpack_Sitemap_Buffer_Image_XMLWriter' );

		// Add stylesheet
		$this->writer->writePi(
			'xml-stylesheet',
			'type="text/xsl" href="' . $this->finder->construct_sitemap_url( 'image-sitemap.xsl' ) . '"'
		);

		// Start root element with namespaces
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

		foreach ( $namespaces as $name => $value ) {
			$this->writer->writeAttribute( $name, $value );
		}
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

		$url = $array['url'];

		$this->writer->startElement( 'url' );

		if ( isset( $url['loc'] ) ) {
			$this->writer->writeElement( 'loc', esc_url( $url['loc'] ) );
		}

		if ( isset( $url['lastmod'] ) ) {
			$this->writer->writeElement( 'lastmod', esc_html( $url['lastmod'] ) );
		}

		if ( isset( $url['image:image'] ) && is_array( $url['image:image'] ) ) {
			$this->writer->startElement( 'image:image' );

			// Required image loc
			if ( isset( $url['image:image']['image:loc'] ) ) {
				$this->writer->writeElement( 'image:loc', esc_url( $url['image:image']['image:loc'] ) );
			}

			// Optional image title
			if ( ! empty( $url['image:image']['image:title'] ) ) {
				$this->writer->writeElement( 'image:title', esc_html( $url['image:image']['image:title'] ) );
			}

			// Optional image caption
			if ( ! empty( $url['image:image']['image:caption'] ) ) {
				$this->writer->writeElement( 'image:caption', esc_html( $url['image:image']['image:caption'] ) );
			}

			$this->writer->endElement(); // image:image
		}

		$this->writer->endElement(); // url
	}
}
