<?php
/**
 * Infinite scroll sanitizer for AMP pages.
 *
 * @package    Jetpack
 * @since      9.1.0
 */

/**
 * This class makes the necessary changes to an AMP page when making an amp-next-page request.
 */
final class Jetpack_AMP_Infinite_Scroll_Sanitizer extends AMP_Base_Sanitizer {

	/**
	 * @var array {
	 *     @type string   $footer_xpaths
	 *     @type string[] $next_page_hide_xpaths
	 *     @type string[] $hidden_xpaths
	 * }
	 */
	protected $args;

	/**
	 * XPath.
	 *
	 * @var DOMXPath
	 */
	private $xpath;

	/**
	 * Sanitize.
	 */
	public function sanitize() {
		$this->xpath = new DOMXPath( $this->dom );

		// Abort if there is no amp-next-page in the document.
		$next_page_element = $this->xpath->query( '//amp-next-page[ @class = "jetpack-infinite-scroll" ]' )->item( 0 );
		if ( ! $next_page_element instanceof DOMElement ) {
			return;
		}

		// Abort amp-next-page if no footer element discovered.
		$footer_elements = array();
		if ( ! empty( $this->args['footer_xpaths'] ) ) {
			foreach ( $this->args['footer_xpaths'] as $footer_xpath ) {
				$footer_elements = array_merge( $footer_elements, iterator_to_array( $this->xpath->query( $footer_xpath ) ) );
			}
		}
		if ( empty( $footer_elements ) ) {
			return;
		}

		// Abort if the amp-next-page lacks a div[footer] element.
		$footer_container = $this->xpath->query( './div[ @footer ]', $next_page_element )->item( 0 );
		if ( ! $footer_container instanceof DOMElement ) {
			return;
		}

		// Make sure amp-next-page is at the end of the body.
		$body = $this->dom->getElementsByTagName( 'body' )->item( 0 );
		$next_page_element->parentNode->removeChild( $next_page_element );
		$body->appendChild( $next_page_element );

		// Move the footer to be inside of <amp-next-page>.
		foreach ( $footer_elements as $footer_element ) {
			$footer_element->parentNode->removeChild( $footer_element );
			$footer_container->appendChild( $footer_element );
		}

		$this->hide_next_page_elements();
		$this->hide_hidden_elements();
	}

	/**
	 * Hide next page elements.
	 */
	private function hide_next_page_elements() {
		if ( isset( $this->args['next_page_hide_xpaths'] ) && is_array( $this->args['next_page_hide_xpaths'] ) ) {
			$xpaths = $this->args['next_page_hide_xpaths'];
		} else {
			$xpaths = array();
		}
		$xpaths[] = '//div[ @id = "wpadminbar" ]';

		foreach ( $xpaths as $next_page_hide_xpath ) {
			/** @var DOMElement $element */
			foreach ( $this->xpath->query( $next_page_hide_xpath ) as $element ) {
				$element->setAttribute( 'next-page-hide', '' );
			}
		}
	}

	/**
	 * Hide elements on initial load.
	 */
	private function hide_hidden_elements() {
		if ( isset( $this->args['hidden_xpaths'] ) && is_array( $this->args['hidden_xpaths'] ) ) {
			$xpaths = $this->args['hidden_xpaths'];
		} else {
			$xpaths = array();
		}

		foreach ( $xpaths as $hidden_xpath ) {
			/** @var DOMElement $element */
			foreach ( $this->xpath->query( $hidden_xpath ) as $element ) {
				$element->setAttribute( 'hidden', '' );
			}
		}
	}
}
