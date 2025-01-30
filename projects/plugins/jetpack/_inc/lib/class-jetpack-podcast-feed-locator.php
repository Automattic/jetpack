<?php
/**
 * Extension of the SimplePie\Locator class, to detect podcast feeds
 *
 * @package automattic/jetpack
 */

// Dummy comment to make phpcs happy.
require_once __DIR__ . '/jp-simplepie-alias.php';

/**
 * Class Jetpack_Podcast_Feed_Locator
 */
class Jetpack_Podcast_Feed_Locator extends Jetpack\SimplePie\Locator {
	/**
	 * Overrides the locator is_feed function to check for
	 * appropriate podcast elements.
	 *
	 * @param Jetpack\SimplePie\File $file The file being checked.
	 * @param boolean                $check_html Adds text/html to the mimetypes checked.
	 */
	public function is_feed( $file, $check_html = false ) {
		return parent::is_feed( $file, $check_html ) && $this->is_podcast_feed( $file );
	}

	/**
	 * Checks the contents of the file for elements that make
	 * it a podcast feed.
	 *
	 * @param Jetpack\SimplePie\File $file The file being checked.
	 */
	private function is_podcast_feed( $file ) {
		// If we can't read the DOM assume it's a podcast feed, we'll work
		// it out later.
		if ( ! class_exists( 'DOMDocument' ) ) {
			return true;
		}

		$feed_dom = $this->safely_load_xml( $file->body );

		// Do this as either/or but prioritise the itunes namespace. It's pretty likely
		// that it's a podcast feed we've found if that namespace is present.
		return $feed_dom && $this->has_itunes_ns( $feed_dom ) && $this->has_audio_enclosures( $feed_dom );
	}

	/**
	 * Safely loads an XML file
	 *
	 * @param string $xml A string of XML to load.
	 * @return DOMDocument|false A restulting DOM document or `false` if there is an error.
	 */
	private function safely_load_xml( $xml ) {
		$disable_entity_loader = PHP_VERSION_ID < 80000;

		if ( $disable_entity_loader ) {
			// This function has been deprecated in PHP 8.0 because in libxml 2.9.0, external entity loading
			// is disabled by default, so this function is no longer needed to protect against XXE attacks.
			// phpcs:ignore Generic.PHP.DeprecatedFunctions.Deprecated, PHPCompatibility.FunctionUse.RemovedFunctions.libxml_disable_entity_loaderDeprecated
			$loader = libxml_disable_entity_loader( true );
		}

		$errors = libxml_use_internal_errors( true );

		$return = new DOMDocument();
		if ( ! $return->loadXML( $xml ) ) {
			return false;
		}

		libxml_use_internal_errors( $errors );

		if ( $disable_entity_loader && isset( $loader ) ) {
			// phpcs:ignore Generic.PHP.DeprecatedFunctions.Deprecated, PHPCompatibility.FunctionUse.RemovedFunctions.libxml_disable_entity_loaderDeprecated
			libxml_disable_entity_loader( $loader );
		}

		return $return;
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
		$xpath      = new DOMXPath( $dom );
		$enclosures = $xpath->query( "//enclosure[starts-with(@type,'audio/')]" );
		return ! $enclosures ? false : $enclosures->length > 0;
	}
}
