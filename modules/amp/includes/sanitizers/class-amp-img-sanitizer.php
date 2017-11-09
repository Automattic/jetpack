<?php

require_once( AMP__ROOT__ . '/includes/sanitizers/class-amp-base-sanitizer.php' );
require_once( AMP__ROOT__ . '/includes/utils/class-amp-image-dimension-extractor.php' );

/**
 * Converts <img> tags to <amp-img> or <amp-anim>
 */
class AMP_Img_Sanitizer extends AMP_Base_Sanitizer {
	const FALLBACK_WIDTH = 600;
	const FALLBACK_HEIGHT = 400;

	public static $tag = 'img';

	private static $anim_extension = '.gif';

	private static $script_slug = 'amp-anim';
	private static $script_src = 'https://cdn.ampproject.org/v0/amp-anim-0.1.js';

	public function sanitize() {
		$nodes = $this->dom->getElementsByTagName( self::$tag );
		$num_nodes = $nodes->length;
		if ( 0 === $num_nodes ) {
			return;
		}

		for ( $i = $num_nodes - 1; $i >= 0; $i-- ) {
			$node = $nodes->item( $i );
			$old_attributes = AMP_DOM_Utils::get_node_attributes_as_assoc_array( $node );

			if ( empty( $old_attributes['src'] ) ) {
				$node->parentNode->removeChild( $node );
				continue;
			}

			$new_attributes = $this->filter_attributes( $old_attributes );

			// Try to extract dimensions for the image, if not set.
			if ( ! isset( $new_attributes['width'] ) || ! isset( $new_attributes['height'] ) ) {
				$dimensions = AMP_Image_Dimension_Extractor::extract( $new_attributes['src'] );
				if ( is_array( $dimensions ) ) {
					$new_attributes['width'] = $dimensions[0];
					$new_attributes['height'] = $dimensions[1];
				}
			}

			// Final fallback when we have no dimensions.
			if ( ! isset( $new_attributes['width'] ) || ! isset( $new_attributes['height'] ) ) {
				$new_attributes['width'] = isset( $this->args['content_max_width'] ) ? $this->args['content_max_width'] : self::FALLBACK_WIDTH;
				$new_attributes['height'] = self::FALLBACK_HEIGHT;

				$this->add_or_append_attribute( $new_attributes, 'class', 'amp-wp-unknown-size' );
			}

			$new_attributes = $this->enforce_sizes_attribute( $new_attributes );

			if ( $this->is_gif_url( $new_attributes['src'] ) ) {
				$this->did_convert_elements = true;
				$new_tag = 'amp-anim';
			} else {
				$new_tag = 'amp-img';
			}

			$new_node = AMP_DOM_Utils::create_node( $this->dom, $new_tag, $new_attributes );
			$node->parentNode->replaceChild( $new_node, $node );
		}
	}

	public function get_scripts() {
		if ( ! $this->did_convert_elements ) {
			return array();
		}

		return array( self::$script_slug => self::$script_src );
	}

	private function filter_attributes( $attributes ) {
		$out = array();

		foreach ( $attributes as $name => $value ) {
			switch ( $name ) {
				case 'src':
				case 'alt':
				case 'class':
				case 'srcset':
				case 'sizes':
				case 'on':
					$out[ $name ] = $value;
					break;

				case 'width':
				case 'height':
					$out[ $name ] = $this->sanitize_dimension( $value, $name );
					break;

				default;
					break;
			}
		}

		return $out;
	}

	private function is_gif_url( $url ) {
		$ext = self::$anim_extension;
		$path = parse_url( $url, PHP_URL_PATH );
		return $ext === substr( $path, -strlen( $ext ) );
	}
}
