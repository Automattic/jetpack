<?php
/**
 * Extension of the SimplePieLocator class, to detect podcast feeds
 *
 * @package jetpack
 */

/**
 * Class Jetpack_Podcast_Feed_Locator
 */
class Jetpack_Podcast_Feed_Locator extends SimplePie_Locator {
	/**
	 * Overrides the locator is_feed function to check for
	 * appropriate podcast elements.
	 *
	 * @param SimplePie_File $file The file being checked.
	 * @param boolean        $check_html Adds text/html to the mimetypes checked.
	 */
	public function is_feed( $file, $check_html = false ) {
		return parent::is_feed( $file, $check_html ) && self::is_podcast_feed( $file );
	}

	/**
	 * Checks the contents of the file for elements that make
	 * it a podcast feed.
	 *
	 * @param SimplePie_File $file The file being checked.
	 */
	private function is_podcast_feed( $file ) {
		// If we can't read the DOM assume it's a podcast feed, we'll work
		// it out later.
		if ( ! class_exists( 'DOMDocument' ) ) {
			return true;
		}
		$feed_dom = new DOMDocument();
		$feed_dom->loadXML( $file->body );

		// Do this as either/or but prioritise the itunes namespace. It's pretty likely
		// that it's a podcast feed we've found if that namespace is present.
		return $this->has_itunes_ns( $feed_dom ) || $this->has_audio_enclosures( $feed_dom );
	}

	/**
	 * Checks the RSS feed for the presence of the itunes podcast namespace.
	 * It's pretty loose and just checks the URI for itunes.com
	 *
	 * @param DOMDocument $dom The XML document to check.
	 * @return boolean Whether the itunes namespace is defined.
	 */
	private function has_itunes_ns( $dom ) {
		$xpath = new DOMXPath( $dom );
		foreach ( $xpath->query( 'namespace::*' ) as $node ) {
			// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			// nodeValue is not valid, but it's part of the DOM API that we don't control.
			if ( strstr( $node->nodeValue, 'itunes.com' ) ) {
				return true;
			}
			// phpcs:enable
		}
		return false;
	}

	/**
	 * Checks the RSS feed for the presence of enclosures with an audio mimetype.
	 *
	 * @param DOMDocument $dom The XML document to check.
	 * @return boolean Whether enclosures were found.
	 */
	private function has_audio_enclosures( $dom ) {
		$xpath = new DOMXPath( $dom );
		return count( $xpath->query( "//enclosure[starts-with(@type,'audio/')]" ) ) > 0;
	}

}

