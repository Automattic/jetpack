<?php
/**
 * Stats AMP_Consent_Sanitizer
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

/**
 * Removes the Stats AMP pixel from pages that have no `amp-consent` to hold it.
 *
 * `data-block-on-consent` does nothing without an `amp-consent`, so the pixel would count visitors who were never asked.
 *
 * @since $$next-version$$
 */
class AMP_Consent_Sanitizer extends \AMP_Base_Sanitizer {

	/**
	 * Remove the Stats pixel unless the document has an `amp-consent`.
	 *
	 * @return void
	 */
	public function sanitize() {
		$dom = $this->dom;
		'@phan-var \DOMDocument $dom'; // AMP's Document subclass: the generated stub loses its `use` import.
		if ( $dom->getElementsByTagName( 'amp-consent' )->length > 0 ) {
			return;
		}

		// Copy the live list first: removing nodes while iterating it skips elements.
		foreach ( iterator_to_array( $dom->getElementsByTagName( 'amp-pixel' ) ) as $pixel ) {
			if ( str_starts_with( $pixel->getAttribute( 'src' ), Tracking_Pixel::AMP_PIXEL_URL ) ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$pixel->parentNode->removeChild( $pixel );
			}
		}
	}
}
