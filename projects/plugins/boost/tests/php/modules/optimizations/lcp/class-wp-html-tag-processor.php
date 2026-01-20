<?php
/**
 * Mock WP_HTML_Tag_Processor class for unit tests.
 *
 * This mock provides a simplified implementation of WP_HTML_Tag_Processor
 * for testing without requiring WordPress. It tracks attributes and can
 * return updated HTML.
 *
 * @package automattic/jetpack-boost
 */

// Only define if WordPress's class doesn't already exist
if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {

	/**
	 * Mock WP_HTML_Tag_Processor for testing.
	 *
	 * Provides basic attribute tracking and HTML manipulation for img tags.
	 */
	class WP_HTML_Tag_Processor {

		/**
		 * The HTML being processed.
		 *
		 * @var string
		 */
		private $html;

		/**
		 * Tracked attributes.
		 *
		 * @var array
		 */
		private $attributes = array();

		/**
		 * Current tag being processed.
		 *
		 * @var string|null
		 */
		private $current_tag = null;

		/**
		 * Constructor.
		 *
		 * @param string $html The HTML to process.
		 */
		public function __construct( $html ) {
			$this->html = $html;
			// Parse existing attributes from the img tag
			if ( preg_match( '/<img[^>]*>/i', $html, $matches ) ) {
				preg_match_all( '/(\w+)=["\']([^"\']*)["\']|\s(\w+)(?=\s|>)/', $matches[0], $attr_matches, PREG_SET_ORDER );
				foreach ( $attr_matches as $match ) {
					if ( isset( $match[1] ) && $match[1] ) {
						$this->attributes[ $match[1] ] = $match[2];
					} elseif ( isset( $match[3] ) ) {
						$this->attributes[ $match[3] ] = true;
					}
				}
			}
		}

		/**
		 * Move to the next tag.
		 *
		 * @param string|null $tag The tag to find.
		 * @return bool True if found, false otherwise.
		 */
		public function next_tag( $tag = null ) {
			if ( $tag && stripos( $this->html, '<' . $tag ) !== false ) {
				$this->current_tag = $tag;
				return true;
			}
			return false;
		}

		/**
		 * Get an attribute value.
		 *
		 * @param string $name The attribute name.
		 * @return string|true|null The attribute value, true for boolean attributes, or null if not found.
		 */
		public function get_attribute( $name ) {
			return isset( $this->attributes[ $name ] ) ? $this->attributes[ $name ] : null;
		}

		/**
		 * Set an attribute value.
		 *
		 * @param string $name  The attribute name.
		 * @param string $value The attribute value.
		 */
		public function set_attribute( $name, $value ) {
			$this->attributes[ $name ] = $value;
		}

		/**
		 * Get the updated HTML with modified attributes.
		 *
		 * @return string The updated HTML.
		 */
		public function get_updated_html() {
			// Build the updated img tag
			$attrs = array();
			foreach ( $this->attributes as $name => $value ) {
				if ( true === $value ) {
					$attrs[] = $name;
				} else {
					$attrs[] = $name . '="' . htmlspecialchars( $value, ENT_QUOTES ) . '"';
				}
			}
			return preg_replace(
				'/<img[^>]*>/i',
				'<img ' . implode( ' ', $attrs ) . '>',
				$this->html
			);
		}
	}
}
