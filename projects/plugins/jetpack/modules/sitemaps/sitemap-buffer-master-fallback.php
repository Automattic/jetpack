<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
// phpcs:disable Generic.Classes.DuplicateClassName.Found -- sitemap-builder.php will require correct class file.
/**
 * Sitemaps (per the protocol) are essentially lists of XML fragments;
 * lists which are subject to size constraints. The Jetpack_Sitemap_Buffer_Master
 * extends the Jetpack_Sitemap_Buffer class to represent the master sitemap
 * buffer.
 *
 * @since 5.3.0
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * A buffer for constructing master sitemap xml files for users without libxml support.
 *
 * @since 5.3.0
 * @phan-suppress PhanRedefinedClassReference -- Don't conflict with real version.
 */
class Jetpack_Sitemap_Buffer_Master extends Jetpack_Sitemap_Buffer_Fallback {
	// @phan-suppress-previous-line UnusedSuppression -- It's used.

	/**
	 * Returns a DOM element that contains all master sitemap elements.
	 */
	protected function get_root_element() {

		if ( ! isset( $this->root ) ) {

			$stylesheet_url  = $this->finder->construct_sitemap_url( 'sitemap.css' );
			$jetpack_version = JETPACK__VERSION;

			$namespaces = Jetpack_Sitemap_Stylist::presentation_namespaces( array( 'xmlns' => 'http://www.sitemaps.org/schemas/sitemap/0.9' ), 'master' );

			$this->root = array(
				"<!-- generator='jetpack-{$jetpack_version}' -->" . PHP_EOL
				. "<?xml-stylesheet type='text/css' href='{$stylesheet_url}'?>" . PHP_EOL
				. '<sitemapindex ' . $this->array_to_xml_attr_string( $namespaces ) . '>' . PHP_EOL
				. Jetpack_Sitemap_Stylist::sitemap_title_xml( 'master' ),
				'</sitemapindex>',
			);

			$this->byte_capacity -= strlen( implode( '', $this->root ) );
		}

		return $this->root;
	}
}
