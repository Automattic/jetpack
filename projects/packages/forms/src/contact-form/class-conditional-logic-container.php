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
 * Targets PHP 7.4: no typed class constants, no match expressions.
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
		// Nothing to stamp while the feature is off, and `core/group` is everywhere in a block
		// theme -- headers, footers, template parts, patterns. Not registering at all costs a
		// site with the feature off nothing per group per render.
		if ( ! Jetpack_Forms::is_conditional_logic_enabled() ) {
			return;
		}

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
	 * any form and carry no conditions; those return untouched on an array read, before the
	 * feature-flag lookup and before any parsing.
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
		// Cheapest test first: an array read on the block that is already in hand. The
		// overwhelming majority of groups carry no conditions and leave here, before the
		// feature-flag lookup and before any parsing.
		$logic = $block['attrs']['conditionalLogic'] ?? null;

		// `enabled` is derived in the editor from whether any rule exists, so a container the
		// author opened the panel on but wrote no conditions in adds nothing to the page.
		if ( ! is_array( $logic ) || empty( $logic['enabled'] ) ) {
			return $block_content;
		}

		// Re-checked here as well as in init(): the filter is registered once per request, but
		// the flag is filterable and a caller may change it in between.
		if ( ! Jetpack_Forms::is_conditional_logic_enabled() ) {
			return $block_content;
		}

		if ( ! is_string( $block_content ) || '' === trim( $block_content ) ) {
			return $block_content;
		}

		$processor = new \WP_HTML_Tag_Processor( $block_content );

		if ( ! $processor->next_tag() ) {
			return $block_content;
		}

		$container_id = self::next_id();

		$processor->set_attribute( 'data-jp-visibility-root', $container_id );
		$processor->set_attribute( 'data-jp-conditional', '1' );
		$processor->set_attribute( self::LOGIC_ATTRIBUTE, self::encode_logic( $logic ) );
		$processor->set_attribute( 'data-wp-interactive', 'jetpack/form' );
		// `fieldId` rather than a key of its own, so `state.isFieldHidden` resolves the
		// container through the same getter it uses for a field. Every field inside sets its
		// own `fieldId`, so inheriting this one shadows nothing.
		$processor->set_attribute( 'data-wp-context', wp_json_encode( array( 'fieldId' => $container_id ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) );
		$processor->set_attribute( 'data-wp-class--jetpack-field--conditionally-hidden', 'state.isFieldHidden' );

		/*
		 * The same watch a field wrapper carries. A group can hold focusable content that is
		 * not a field -- a link, a button, a nested block -- and that content has no wrapper of
		 * its own to restore focus from, so without this the caret falls to <body> when the
		 * group hides under the visitor.
		 */
		$processor->set_attribute( 'data-wp-watch--conditional-focus', 'callbacks.manageConditionalFocus' );

		return $processor->get_updated_html();
	}

	/**
	 * Encode a container's conditions for the attribute they travel in.
	 *
	 * A rule value is author-supplied text, and the rules are a JSON array, so the payload
	 * always contains `[` and `]`. Contact_Form runs the whole assembled body through
	 * do_shortcode() to find its fields, and do_shortcode() does not care that the brackets
	 * sit inside an HTML attribute: a value that merely looks like a shortcode is expanded
	 * there, which shatters the tag it sits in, mints a field nobody wrote, and leaves the
	 * container unreadable so its conditions are silently dropped.
	 *
	 * Numeric entities survive do_shortcode() untouched and are turned back by decode_logic().
	 * The field path guards the same payload the same way, in Contact_Form_Plugin.
	 *
	 * @param array $logic The conditions.
	 *
	 * @return string The attribute value.
	 */
	private static function encode_logic( array $logic ) {
		$json = wp_json_encode( $logic, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );

		return str_replace( array( '[', ']' ), array( '&#91;', '&#93;' ), (string) $json );
	}

	/**
	 * Read conditions back out of the attribute encode_logic() wrote.
	 *
	 * @param string $encoded The attribute value.
	 *
	 * @return array|null The conditions, or null when the value is not readable.
	 */
	private static function decode_logic( $encoded ) {
		$decoded = json_decode( html_entity_decode( $encoded, ENT_COMPAT ), true );

		return is_array( $decoded ) ? $decoded : null;
	}

	/**
	 * Read container conditions off an assembled form body.
	 *
	 * Returns the containers' logic keyed by id, and which field ids each one encloses. The
	 * containment is what lets validation treat a required field inside a hidden container as
	 * one the visitor was never shown; without it the form would refuse to submit and say
	 * nothing about why.
	 *
	 * Nesting comes from WP_HTML_Processor, which parses to the HTML5 spec and reports the
	 * depth of the element it is on. The tag processor offers no ancestry, so the first version
	 * of this counted `div` depth by hand -- which missed a group rendered as any of the other
	 * elements core/group offers, and mis-scoped containment whenever a block inside the group
	 * emitted unbalanced markup.
	 *
	 * Failure is open by design. If the body cannot be parsed, nothing is harvested: every
	 * container renders visible and every field it holds stays enforced. That is the safe
	 * direction -- a required field that refuses to hide is a support ticket, while a field
	 * wrongly attributed to a hidden container has its answer silently discarded.
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

		$processor = \WP_HTML_Processor::create_fragment( $body );

		if ( null === $processor ) {
			return $empty;
		}

		$logic       = array();
		$contains    = array();
		$open        = array();
		$root_counts = array();

		while ( $processor->next_tag() ) {
			$depth = $processor->get_current_depth();

			// Anything opened at or above this depth is a container we have now left.
			$last = end( $open );
			while ( false !== $last && $last['depth'] >= $depth ) {
				array_pop( $open );
				$last = end( $open );
			}

			$root = $processor->get_attribute( 'data-jp-visibility-root' );

			if ( ! is_string( $root ) ) {
				continue;
			}

			$root_counts[ $root ] = ( $root_counts[ $root ] ?? 0 ) + 1;

			$encoded_logic = $processor->get_attribute( self::LOGIC_ATTRIBUTE );

			if ( ! is_string( $encoded_logic ) ) {
				// A field wrapper. Attribute it to every container currently open around it, so
				// a field inside nested containers is governed by all of them.
				foreach ( $open as $entry ) {
					$contains[ $entry['id'] ][] = $root;
				}

				continue;
			}

			$decoded = self::decode_logic( $encoded_logic );

			if ( null !== $decoded ) {
				// A nested container is governed by its ancestors exactly as a field is, so it
				// is attributed to them before it starts governing anything itself. Without
				// this the visibility map reports an inner container visible while its parent
				// is hidden -- masked today only because the CSS hides it through the ancestor,
				// and wrong for anything that reads the map rather than the DOM.
				foreach ( $open as $entry ) {
					$contains[ $entry['id'] ][] = $root;
				}

				$logic[ $root ]    = $decoded;
				$contains[ $root ] = array();

				$open[] = array(
					'id'    => $root,
					'depth' => $depth,
				);
			}

			/*
			 * Removed whether or not it decoded. The form emits the whole map for the
			 * interactivity store, so a readable copy on the element is waste; an unreadable
			 * one is waste that also ships broken JSON to every visitor.
			 */
			$processor->remove_attribute( self::LOGIC_ATTRIBUTE );
		}

		if ( null !== $processor->get_last_error() ) {
			return $empty;
		}

		/*
		 * The updated body even when nothing was harvested, so a payload that could not be
		 * decoded is still stripped rather than shipped.
		 */
		return array(
			'logic'    => $logic,
			'contains' => self::drop_ambiguous_ids( $contains, $root_counts ),
			'body'     => $processor->get_updated_html(),
		);
	}

	/**
	 * Drop ids that more than one element claims from every containment list.
	 *
	 * A field id is derived from its label at render time, so two fields in one form can end
	 * up sharing one -- "Name" inside a conditional group and "Name" outside it both derive
	 * `name`. Containment keys on that id, so hiding the container would hide, and then
	 * discard the answer to, every field sharing it -- including the one still on screen.
	 * `apply_initial_field_visibility()` stamps by the same id, so it would hide both too.
	 *
	 * Ambiguity is resolved by not acting: the container still hides, but it stops claiming an
	 * id it cannot prove belongs to it. Losing a hide is visible and recoverable; discarding an
	 * answer the visitor typed is neither.
	 *
	 * The editor's duplicate-id notice is where this gets fixed properly. This is the runtime
	 * declining to do damage in the meantime.
	 *
	 * @param array $contains    Map of container id to the ids it encloses.
	 * @param array $root_counts Map of id to how many elements carried it.
	 *
	 * @return array The containment map, with ambiguous ids removed.
	 */
	private static function drop_ambiguous_ids( array $contains, array $root_counts ) {
		foreach ( $contains as $container_id => $ids ) {
			$unambiguous = array();

			foreach ( $ids as $id ) {
				if ( 1 === ( $root_counts[ $id ] ?? 0 ) ) {
					$unambiguous[] = $id;
				}
			}

			$contains[ $container_id ] = $unambiguous;
		}

		return $contains;
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
