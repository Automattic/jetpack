<?php
/**
 * Provides AMP validation carve-outs for Jetpack features
 *
 * @see https://github.com/Automattic/amp-wp
 * @package Jetpack
 */

/**
 * This sanitizer class sets AMP devmode on the html element and each other element to be ignored (and not stripped out) for validation purposes.
 */
class Jetpack_AMP_Feature_Assets_Sanitizer extends AMP_Base_Sanitizer {
	/**
	 * List of xpaths selecting assets to be ignored
	 *
	 * @var asset_xpaths.
	 */
	private static $asset_xpaths = array(
		'//script[contains(@src,\'//www.opentable.com/widget\')]',
		'//script[contains(@src,\'//assets.pinterest.com/js/pinit.js\')]',
		'//script[ @id = \'eventbrite-widget-js\' ]',
		'//script[ @id = \'eventbrite-widget-js-after\' ]',
		'//script[ @id = \'jetpack-block-calendly-js-extra\' ]',
		'//script[ @id = \'jetpack-block-calendly-js\' ]',
		'//script[ @id = \'jetpack-calendly-external-js-js\' ]',
		'//script[ @id = \'jetpack-calendly-external-js-js-after\' ]',
	);

	/**
	 * Sanitize document for dev mode.
	 *
	 * @since 1.3
	 */
	public function sanitize() {
		$this->dom->documentElement->setAttribute( AMP_Rule_Spec::DEV_MODE_ATTRIBUTE, '' );

		$xpath = new DOMXPath( $this->dom );
		foreach ( self::$asset_xpaths as $element_xpath ) {
			foreach ( $xpath->query( $element_xpath ) as $node ) {
				if ( $node instanceof DOMElement ) {
					$node->setAttribute( AMP_Rule_Spec::DEV_MODE_ATTRIBUTE, '' );
				}
			}
		}
	}
}
