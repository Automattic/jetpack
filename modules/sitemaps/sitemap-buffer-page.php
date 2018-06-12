<?php
/**
 * Sitemaps (per the protocol) are essentially lists of XML fragments;
 * lists which are subject to size constraints. The Jetpack_Sitemap_Buffer_Page
 * extends the Jetpack_Sitemap_Buffer class to represent the single page sitemap
 * buffer.
 *
 * @since 5.3.0
 * @package Jetpack
 */

/**
 * A buffer for constructing sitemap page xml files.
 *
 * @since 5.3.0
 */
class Jetpack_Sitemap_Buffer_Page extends Jetpack_Sitemap_Buffer {

	public function __construct( $item_limit, $byte_limit, $time = '1970-01-01 00:00:00' ) {
		parent::__construct( $item_limit, $byte_limit, $time );

		$this->doc->appendChild(
			$this->doc->createComment( "generator='jetpack-" . JETPACK__VERSION . "'" )
		);

		$this->doc->appendChild(
			$this->doc->createProcessingInstruction(
				'xml-stylesheet',
				'type="text/xsl" href="' . $this->finder->construct_sitemap_url( 'sitemap.xsl' ) . '"'
			)
		);
	}

	protected function get_root_element() {
		if ( ! isset( $this->root ) ) {

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

			$this->root = $this->doc->createElement( 'urlset' );

			foreach ( $namespaces as $name => $value ) {
				$this->root->setAttribute( $name, $value );
			}

			$this->doc->appendChild( $this->root );
			$this->byte_capacity -= strlen( $this->doc->saveXML( $this->root ) );
		}

		return $this->root;
	}
}
