<?php

require_once( AMP__ROOT__ . '/includes/sanitizers/class-amp-base-sanitizer.php' );

/**
 * Strips blacklisted tags and attributes from content.
 *
 * See following for blacklist:
 *     https://github.com/ampproject/amphtml/blob/master/spec/amp-html-format.md#html-tags
 */
class AMP_Blacklist_Sanitizer extends AMP_Base_Sanitizer {
	const PATTERN_REL_WP_ATTACHMENT = '#wp-att-([\d]+)#';

	protected $DEFAULT_ARGS = array(
		'add_blacklisted_protocols' => array(),
		'add_blacklisted_tags' => array(),
		'add_blacklisted_attributes' => array(),
	);

	public function sanitize() {
		$blacklisted_tags = $this->get_blacklisted_tags();
		$blacklisted_attributes = $this->get_blacklisted_attributes();
		$blacklisted_protocols = $this->get_blacklisted_protocols();

		$body = $this->get_body_node();
		$this->strip_tags( $body, $blacklisted_tags );
		$this->strip_attributes_recursive( $body, $blacklisted_attributes, $blacklisted_protocols );
	}

	private function strip_attributes_recursive( $node, $bad_attributes, $bad_protocols ) {
		if ( $node->nodeType !== XML_ELEMENT_NODE ) {
			return;
		}

		$node_name = $node->nodeName;

		// Some nodes may contain valid content but are themselves invalid.
		// Remove the node but preserve the children.
 		if ( 'font' === $node_name ) {
			$this->replace_node_with_children( $node, $bad_attributes, $bad_protocols );
			return;
		} elseif ( 'a' === $node_name && false === $this->validate_a_node( $node ) ) {
			$this->replace_node_with_children( $node, $bad_attributes, $bad_protocols );
			return;
		}

		if ( $node->hasAttributes() ) {
			$length = $node->attributes->length;
			for ( $i = $length - 1; $i >= 0; $i-- ) {
				$attribute = $node->attributes->item( $i );
				$attribute_name = strtolower( $attribute->name );
				if ( in_array( $attribute_name, $bad_attributes ) ) {
					$node->removeAttribute( $attribute_name );
					continue;
				}

				// on* attributes (like onclick) are a special case
				if ( 0 === stripos( $attribute_name, 'on' ) && $attribute_name != 'on' ) {
					$node->removeAttribute( $attribute_name );
					continue;
				} elseif ( 'a' === $node_name ) {
					$this->sanitize_a_attribute( $node, $attribute );
				}
			}
		}

		$length = $node->childNodes->length;
		for ( $i = $length - 1; $i >= 0; $i-- ) {
			$child_node = $node->childNodes->item( $i );

			$this->strip_attributes_recursive( $child_node, $bad_attributes, $bad_protocols );
		}
	}

	private function strip_tags( $node, $tag_names ) {
		foreach ( $tag_names as $tag_name ) {
			$elements = $node->getElementsByTagName( $tag_name );
			$length = $elements->length;
			if ( 0 === $length ) {
				continue;
			}

			for ( $i = $length - 1; $i >= 0; $i-- ) {
				$element = $elements->item( $i );
				$parent_node = $element->parentNode;
				$parent_node->removeChild( $element );

				if ( 'body' !== $parent_node->nodeName && AMP_DOM_Utils::is_node_empty( $parent_node ) ) {
					$parent_node->parentNode->removeChild( $parent_node );
				}
			}
		}
	}

	private function sanitize_a_attribute( $node, $attribute ) {
		$attribute_name = strtolower( $attribute->name );

		if ( 'rel' === $attribute_name ) {
			$old_value = $attribute->value;
			$new_value = trim( preg_replace( self::PATTERN_REL_WP_ATTACHMENT, '', $old_value ) );
			if ( empty( $new_value ) ) {
				$node->removeAttribute( $attribute_name );
			} elseif ( $old_value !== $new_value ) {
				$node->setAttribute( $attribute_name, $new_value );
			}
		} elseif ( 'rev' === $attribute_name ) {
			// rev removed from HTML5 spec, which was used by Jetpack Markdown.
			$node->removeAttribute( $attribute_name );
		} elseif ( 'target' === $attribute_name ) {
			// _blank is the only allowed value and it must be lowercase.
			// replace _new with _blank and others should simply be removed.
			$old_value = strtolower( $attribute->value );
			if ( '_blank' === $old_value || '_new' === $old_value ) {
				// _new is not allowed; swap with _blank
				$node->setAttribute( $attribute_name, '_blank' );
			} else {
				// only _blank is allowed
				$node->removeAttribute( $attribute_name );
			}
		}
	}

	private function validate_a_node( $node ) {
		// Get the href attribute
		$href = $node->getAttribute( 'href' );

		// If no href is set and this isn't an anchor, it's invalid
		if ( empty( $href ) ) {
			$name_attr = $node->getAttribute( 'name' );
			if ( ! empty( $name_attr ) ) {
				// No further validation is required
				return true;
			} else {
				return false;
			}
		}

		// If this is an anchor link, just return true
		if ( 0 === strpos( $href, '#' ) ) {
			return true;
		}

		// If the href starts with a '/', append the home_url to it for validation purposes.
		if ( 0 === stripos( $href, '/' ) ) {
			$href = untrailingslashit( get_home_url() ) . $href;
		}

		$valid_protocols = array( 'http', 'https', 'mailto', 'sms', 'tel', 'viber', 'whatsapp' );
		$special_protocols = array( 'tel', 'sms' ); // these ones don't valid with `filter_var+FILTER_VALIDATE_URL`
		$protocol = strtok( $href, ':' );

		if ( false === filter_var( $href, FILTER_VALIDATE_URL )
			&& ! in_array( $protocol, $special_protocols ) ) {
			return false;
		}

		if ( ! in_array( $protocol, $valid_protocols ) ) {
			return false;
		}

		return true;
	}

	private function replace_node_with_children( $node, $bad_attributes, $bad_protocols ) {
		// If the node has children and also has a parent node,
		// clone and re-add all the children just before current node.
		if ( $node->hasChildNodes() && $node->parentNode ) {
			foreach ( $node->childNodes as $child_node ) {
				$new_child = $child_node->cloneNode( true );
				$this->strip_attributes_recursive( $new_child, $bad_attributes, $bad_protocols );
				$node->parentNode->insertBefore( $new_child, $node );
			}
		}

		// Remove the node from the parent, if defined.
		if ( $node->parentNode ) {
			$node->parentNode->removeChild( $node );
		}
	}

	private function merge_defaults_with_args( $key, $values ) {
		// Merge default values with user specified args
		if ( ! empty( $this->args[ $key ] )
			&& is_array( $this->args[ $key ] ) ) {
			$values = array_merge( $values, $this->args[ $key ] );
		}

		return $values;
	}

	private function get_blacklisted_protocols() {
		return $this->merge_defaults_with_args( 'add_blacklisted_protocols', array(
			'javascript',
		) );
	}

	private function get_blacklisted_tags() {
		return $this->merge_defaults_with_args( 'add_blacklisted_tags', array(
			'script',
			'noscript',
			'style',
			'frame',
			'frameset',
			'object',
			'param',
			'applet',
			'form',
			'label',
			'input',
			'textarea',
			'select',
			'option',
			'link',
			'picture',

			// Sanitizers run after embed handlers, so if anything wasn't matched, it needs to be removed.
			'embed',
			'embedvideo',

			// Other weird ones
			'comments-count',

			// These are converted into amp-* versions
			//'img',
			//'video',
			//'audio',
			//'iframe',
		) );
	}

	private function get_blacklisted_attributes() {
		return $this->merge_defaults_with_args( 'add_blacklisted_attributes', array(
			'style',
			'size',
			'clear',
			'align',
			'valign',
		) );
	}
}
