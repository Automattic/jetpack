<?php
/**
 * Conditional logic for container blocks inside a form.
 *
 * A field carries its conditions through the `[contact-field]` shortcode and arrives here as a
 * Contact_Form_Field. A container has no shortcode and is not a field: `core/group` renders to
 * plain block markup that merely surrounds the field shortcodes. So its conditions travel a
 * different route — stamped onto the rendered element as a data attribute, then harvested off
 * the assembled form body, which is the first moment both the container and the fields it
 * holds exist in one place.
 *
 * Harvesting from the body rather than a static registry is deliberate: a page can carry
 * several forms, each parsed immediately after its own inner blocks render, and a shared
 * registry would need resetting between them. The body is already scoped to one form.
 *
 * Targets PHP 7.2: no arrow functions, no typed properties.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Forms\Jetpack_Forms;

/**
 * Renders and harvests conditional logic on container blocks.
 */
class Conditional_Logic_Container {

	/**
	 * Blocks that can be shown or hidden as a unit.
	 *
	 * Mirrors CONTAINER_BLOCK_NAMES in
	 * src/blocks/shared/conditional-logic/util/container-blocks.js. `core/row` and `core/stack`
	 * are variations of `core/group` rather than blocks of their own, so one name covers all
	 * three.
	 *
	 * @var array
	 */
	const SUPPORTED_BLOCKS = array( 'core/group' );

	/**
	 * Attribute the rendered container carries its conditions in.
	 *
	 * Removed again once the form has read it: the form emits the whole logic map for the
	 * interactivity store anyway, so leaving this on the element would ship the same JSON
	 * twice.
	 *
	 * @var string
	 */
	const LOGIC_ATTRIBUTE = 'data-jp-container-logic';

	/**
	 * Prefix for generated container ids.
	 *
	 * Prefixed so a container id can never collide with a field id, which is derived from a
	 * field's label and may be anything a label can slugify to.
	 *
	 * @var string
	 */
	const ID_PREFIX = 'jp-container-';

	/**
	 * Per-request counter behind the generated ids.
	 *
	 * @var int
	 */
	private static $sequence = 0;

	/**
	 * Register the render filter.
	 *
	 * @return void
	 */
	public static function init() {
		foreach ( self::SUPPORTED_BLOCKS as $block_name ) {
			add_filter( 'render_block_' . $block_name, array( __CLASS__, 'add_container_attributes' ), 10, 2 );
		}
	}

	/**
	 * Generate the next container id.
	 *
	 * @return string A form-unique id.
	 */
	private static function next_id() {
		++self::$sequence;

		return self::ID_PREFIX . self::$sequence;
	}

	/**
	 * Stamp a container that carries conditions with everything the runtime needs.
	 *
	 * Runs for every `core/group` on the page, including the great majority that sit outside
	 * any form and carry no conditions; those return untouched before any parsing happens.
	 *
	 * The element is given the same visibility contract a field wrapper gets — the same root
	 * attribute, the same class binding, the same `data-jp-conditional` marker that scopes the
	 * transition — so the container hides through the code path that already hides fields
	 * rather than a second one that could disagree with it.
	 *
	 * @param string $block_content The block's rendered HTML.
	 * @param array  $block         The parsed block.
	 *
	 * @return string The HTML, stamped when the block carries conditions.
	 */
	public static function add_container_attributes( $block_content, $block ) {
		if ( ! Jetpack_Forms::is_conditional_logic_enabled() ) {
			return $block_content;
		}

		if ( ! is_string( $block_content ) || '' === trim( $block_content ) ) {
			return $block_content;
		}

		$logic = $block['attrs']['conditionalLogic'] ?? null;

		// `enabled` is derived in the editor from whether any rule exists, so a container the
		// author opened the panel on but wrote no conditions in adds nothing to the page.
		if ( ! is_array( $logic ) || empty( $logic['enabled'] ) ) {
			return $block_content;
		}

		$processor = new \WP_HTML_Tag_Processor( $block_content );

		if ( ! $processor->next_tag() ) {
			return $block_content;
		}

		$container_id = self::next_id();

		$processor->set_attribute( 'data-jp-visibility-root', $container_id );
		$processor->set_attribute( 'data-jp-conditional', '1' );
		$processor->set_attribute( self::LOGIC_ATTRIBUTE, wp_json_encode( $logic, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) );
		$processor->set_attribute( 'data-wp-interactive', 'jetpack/form' );
		// `fieldId` rather than a key of its own, so `state.isFieldHidden` resolves the
		// container through the same getter it uses for a field. Every field inside sets its
		// own `fieldId`, so inheriting this one shadows nothing.
		$processor->set_attribute( 'data-wp-context', wp_json_encode( array( 'fieldId' => $container_id ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) );
		$processor->set_attribute( 'data-wp-class--jetpack-field--conditionally-hidden', 'state.isFieldHidden' );

		return $processor->get_updated_html();
	}

	/**
	 * Read container conditions off an assembled form body.
	 *
	 * Returns the containers' logic keyed by id, and which field ids each one encloses. The
	 * containment is what lets validation treat a required field inside a hidden container as
	 * one the visitor was never shown; without it the form would refuse to submit and say
	 * nothing about why.
	 *
	 * Nesting is tracked by counting `div` depth rather than parsing a tree: containers and
	 * field wrappers are both divs, which is all the relationship needs, and the tag processor
	 * offers no ancestry of its own.
	 *
	 * @param string $body The form body HTML.
	 *
	 * @return array `array( 'logic' => array, 'contains' => array, 'body' => string )`.
	 */
	public static function harvest( $body ) {
		$empty = array(
			'logic'    => array(),
			'contains' => array(),
			'body'     => $body,
		);

		if ( ! is_string( $body ) || false === strpos( $body, self::LOGIC_ATTRIBUTE ) ) {
			return $empty;
		}

		$processor = new \WP_HTML_Tag_Processor( $body );
		$logic     = array();
		$contains  = array();
		$open      = array();
		$depth     = 0;

		while ( $processor->next_tag(
			array(
				'tag_name'    => 'DIV',
				'tag_closers' => 'visit',
			)
		) ) {
			if ( $processor->is_tag_closer() ) {
				--$depth;

				// Everything opened at or below the depth we just left is now closed.
				$last = end( $open );
				while ( false !== $last && $last['depth'] >= $depth ) {
					array_pop( $open );
					$last = end( $open );
				}

				continue;
			}

			$root           = $processor->get_attribute( 'data-jp-visibility-root' );
			$encoded_logic  = $processor->get_attribute( self::LOGIC_ATTRIBUTE );
			$is_a_container = is_string( $encoded_logic ) && is_string( $root );

			if ( $is_a_container ) {
				$decoded = json_decode( $encoded_logic, true );

				if ( is_array( $decoded ) ) {
					$logic[ $root ]    = $decoded;
					$contains[ $root ] = array();

					$open[] = array(
						'id'    => $root,
						'depth' => $depth,
					);
				}

				// The form emits the whole map for the interactivity store, so the element does
				// not need to carry its own copy as well.
				$processor->remove_attribute( self::LOGIC_ATTRIBUTE );
			} elseif ( is_string( $root ) ) {
				// A field wrapper. Attribute it to every container currently open around it, so
				// a field inside nested containers is governed by all of them.
				foreach ( $open as $entry ) {
					$contains[ $entry['id'] ][] = $root;
				}
			}

			++$depth;
		}

		if ( empty( $logic ) ) {
			return $empty;
		}

		return array(
			'logic'    => $logic,
			'contains' => $contains,
			'body'     => $processor->get_updated_html(),
		);
	}

	/**
	 * Hide every field enclosed by a hidden container.
	 *
	 * A separate pass after the evaluator rather than part of it: containment is not a
	 * condition, it is a consequence. A field inside a hidden container is hidden whatever its
	 * own rules say, and a container's own visibility is settled by the evaluator before this
	 * runs.
	 *
	 * @param array $visibility Map of id to bool, as resolved by Conditional_Logic.
	 * @param array $contains   Map of container id to the field ids it encloses.
	 *
	 * @return array The visibility map, with enclosed fields hidden.
	 */
	public static function apply_containment( array $visibility, array $contains ) {
		foreach ( $contains as $container_id => $field_ids ) {
			if ( ! isset( $visibility[ $container_id ] ) || false !== $visibility[ $container_id ] ) {
				continue;
			}

			foreach ( $field_ids as $field_id ) {
				$visibility[ $field_id ] = false;
			}
		}

		return $visibility;
	}
}
