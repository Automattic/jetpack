<?php

require_once( AMP__ROOT__ . '/includes/sanitizers/class-amp-base-sanitizer.php' );

/**
 * Converts <iframe> tags to <amp-iframe>
 */
class AMP_Iframe_Sanitizer extends AMP_Base_Sanitizer {
	const FALLBACK_HEIGHT = 400;
	const SANDBOX_DEFAULTS = 'allow-scripts allow-same-origin';

	public static $tag = 'iframe';

	private static $script_slug = 'amp-iframe';
	private static $script_src = 'https://cdn.ampproject.org/v0/amp-iframe-0.1.js';

	protected $DEFAULT_ARGS = array(
		'add_placeholder' => false,
	);

	public function get_scripts() {
		if ( ! $this->did_convert_elements ) {
			return array();
		}

		return array( self::$script_slug => self::$script_src );
	}

	public function sanitize() {
		$nodes = $this->dom->getElementsByTagName( self::$tag );
		$num_nodes = $nodes->length;
		if ( 0 === $num_nodes ) {
			return;
		}

		for ( $i = $num_nodes - 1; $i >= 0; $i-- ) {
			$node = $nodes->item( $i );
			$old_attributes = AMP_DOM_Utils::get_node_attributes_as_assoc_array( $node );

			$new_attributes = $this->filter_attributes( $old_attributes );

			// If the src doesn't exist, remove the node.
			// This means that it never existed or was invalidated
			// while filtering attributes above.
			//
			// TODO: add a filter to allow for a fallback element in this instance.
			// See: https://github.com/ampproject/amphtml/issues/2261
			if ( empty( $new_attributes['src'] ) ) {
				$node->parentNode->removeChild( $node );
				continue;
			}

			$this->did_convert_elements = true;

			$new_attributes = $this->enforce_fixed_height( $new_attributes );
			$new_attributes = $this->enforce_sizes_attribute( $new_attributes );

			$new_node = AMP_DOM_Utils::create_node( $this->dom, 'amp-iframe', $new_attributes );

			if ( true === $this->args['add_placeholder'] ) {
				$placeholder_node = $this->build_placeholder( $new_attributes );
				$new_node->appendChild( $placeholder_node );
			}

			$parent_node = $node->parentNode;
			if ( 'p' === strtolower( $parent_node->tagName ) ) {
				// AMP does not like iframes in p tags
				$parent_node->removeChild( $node );
				$parent_node->parentNode->insertBefore( $new_node, $parent_node->nextSibling );

				if ( AMP_DOM_Utils::is_node_empty( $parent_node ) ) {
					$parent_node->parentNode->removeChild( $parent_node );
				}
			} else {
				$parent_node->replaceChild( $new_node, $node );
			}
		}
	}

	private function filter_attributes( $attributes ) {
		$out = array();

		foreach ( $attributes as $name => $value ) {
			switch ( $name ) {
				case 'sandbox':
				case 'class':
				case 'sizes':
					$out[ $name ] = $value;
					break;

				case 'src':
					$out[ $name ] = $this->maybe_enforce_https_src( $value, true );
					break;

				case 'width':
				case 'height':
					$out[ $name ] = $this->sanitize_dimension( $value, $name );
					break;


				case 'frameborder':
					if ( '0' !== $value && '1' !== $value ) {
						$value = '0';
					}
					$out[ $name ] = $value;
					break;

				case 'allowfullscreen':
				case 'allowtransparency':
					if ( 'false' !== $value ) {
						$out[ $name ] = '';
					}
					break;

				default;
					break;
			}
		}

		if ( ! isset( $out[ 'sandbox' ] ) ) {
			$out[ 'sandbox' ] = self::SANDBOX_DEFAULTS;
		}

		return $out;
	}

	private function build_placeholder( $parent_attributes ) {
		$placeholder_node = AMP_DOM_Utils::create_node( $this->dom, 'div', array(
			'placeholder' => '',
			'class' => 'amp-wp-iframe-placeholder',
		) );

		return $placeholder_node;
	}
}
