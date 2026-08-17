import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import { createHigherOrderComponent } from '@wordpress/compose';
import { lazy, Suspense } from '@wordpress/element';
import { addFilter, hasFilter } from '@wordpress/hooks';
import { getTypeKeyForBlockName } from './util/block-types.js';

/**
 * The panel UI, and everything it pulls in, in a chunk of its own.
 *
 * While the feature is off the filter below is never registered, so this component never
 * renders and the browser never requests the chunk: none of the panel, its controls, its
 * operator labels or its stylesheet is parsed or executed in the editor. That is the point of
 * splitting it — code that never reaches the editor cannot break it.
 *
 * A static import would defeat that: webpack would fold all of it into the main editor bundle
 * regardless of the flag.
 */
const ConditionalLogicPanel = lazy( () => import( './components/panel.jsx' ) );

const FIELD_BLOCK_PREFIX = 'jetpack/field-';

export const FILTER_NAMESPACE = 'jetpack/forms-conditional-logic';

// Matches Jetpack_Forms::CONDITIONAL_LOGIC_FLAG, registered with the jetpack-feature-flags
// package and bridged into the editor's feature-flag map.
export const FEATURE_FLAG = 'forms-conditional-logic';

/**
 * Whether a block should carry the conditional-logic panel.
 *
 * Guarding on the type mapping as well as the name prefix means a future `jetpack/field-*`
 * block with no comparison behavior is skipped rather than rendering a panel whose operator
 * list would be empty.
 *
 * @param {string} name - Fully qualified block name.
 * @return {boolean} True when the panel applies.
 */
export const isConditionalLogicField = name =>
	typeof name === 'string' &&
	name.startsWith( FIELD_BLOCK_PREFIX ) &&
	getTypeKeyForBlockName( name ) !== null;

/**
 * Add the conditional-logic panel to every Jetpack form field block.
 *
 * A filter rather than per-block wiring: the field blocks share no single inspector
 * component — four of them build their own — so this is the only way to cover all of them
 * without touching nineteen edit files, and new field types inherit it automatically.
 */
export const withConditionalLogic = createHigherOrderComponent(
	BlockEdit => props => {
		// Mounted only for the selected block. This filter wraps every field block, and the
		// panel's useSelect walks the whole form tree to build the subject list; mounting it
		// on all of them meant that walk ran per field on every block-editor store change,
		// so a keystroke anywhere on the page cost O(fields x blocks). The inspector only
		// ever shows the selected block's panel, so there is nothing to render otherwise.
		if ( ! props.isSelected || ! isConditionalLogicField( props.name ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />
				{ /* No fallback: the inspector should not flash a placeholder panel while the
				     chunk loads. It arrives on the first field block selected and is cached
				     from then on. */ }
				<Suspense fallback={ null }>
					<ConditionalLogicPanel
						clientId={ props.clientId }
						attributes={ props.attributes }
						setAttributes={ props.setAttributes }
					/>
				</Suspense>
			</>
		);
	},
	'withConditionalLogic'
);

/**
 * Register the panel filter, at most once.
 *
 * This module ships in two bundles that load together on the Forms editor screen:
 * `enqueue_block_editor_assets` enqueues dist/blocks/editor.js on every block editor screen,
 * and the Forms editor enqueues dist/form-editor/jetpack-form-editor.js on top of it.
 * addFilter does not de-duplicate by namespace, so an unguarded registration wraps BlockEdit
 * twice and renders the panel twice.
 *
 * @return {boolean} True when this call registered the filter, false when it was already there.
 */
export const registerConditionalLogicFilter = () => {
	// Off by default while the feature is in testing. The same switch gates the PHP runtime,
	// so the editor can never offer conditions the front end would ignore.
	if ( ! hasFeatureFlag( FEATURE_FLAG ) ) {
		return false;
	}

	if ( hasFilter( 'editor.BlockEdit', FILTER_NAMESPACE ) ) {
		return false;
	}

	addFilter( 'editor.BlockEdit', FILTER_NAMESPACE, withConditionalLogic );

	return true;
};

registerConditionalLogicFilter();
