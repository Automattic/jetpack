import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { lazy, Suspense } from '@wordpress/element';
import { addFilter, hasFilter } from '@wordpress/hooks';
import { FIELD_BLOCK_PREFIX } from '../util/constants.js';
import { DEFAULT_LOGIC } from './constants.js';
import { getTypeKeyForBlockName } from './util/block-types.js';
import { isConditionalLogicContainer } from './util/container-blocks.js';

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

export const FILTER_NAMESPACE = 'jetpack/forms-conditional-logic';

export const ATTRIBUTE_FILTER_NAMESPACE = 'jetpack/forms-conditional-logic-container-attributes';

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
 * Give container blocks somewhere to store their conditions.
 *
 * Field blocks declare `conditionalLogic` in their own shared settings, but a container is a
 * core block this package does not own, so the attribute has to be grafted on at registration
 * time. It carries no `source`, which means it serializes into the block comment delimiter and
 * leaves the saved markup untouched — so this needs no deprecation, and a group saved before
 * the feature existed still parses.
 *
 * @param {object} settings - Block settings as registered.
 * @param {string} name     - Fully qualified block name.
 * @return {object} The settings, with the attribute added for containers.
 */
export const addContainerLogicAttribute = ( settings, name ) => {
	if ( ! isConditionalLogicContainer( name ) || settings?.attributes?.conditionalLogic ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			conditionalLogic: {
				type: 'object',
				// A fresh object rather than DEFAULT_LOGIC itself: a default is shared by every
				// instance of the block, and handing them all the same array would let one
				// group's conditions surface on another if anything ever mutated it in place.
				default: { ...DEFAULT_LOGIC, groups: [] },
			},
		},
	};
};

/**
 * The panel for a container block, mounted only when the container is inside a form.
 *
 * Its own component rather than a branch inside the HOC below, because deciding this needs a
 * store subscription and the HOC returns early for the blocks it does not handle — a hook
 * before that return would run for every block in the editor.
 *
 * @param {object}   props               - Block edit props.
 * @param {string}   props.clientId      - The container's client id.
 * @param {object}   props.attributes    - The container's attributes.
 * @param {Function} props.setAttributes - The container's attribute setter.
 * @return {object|null} The panel, or null when the container is not in a form.
 */
const ContainerConditionalLogic = ( { clientId, attributes, setAttributes } ) => {
	// `core/group` is available on every editor screen, so unlike a field block its name alone
	// says nothing about whether conditions are meaningful. Only a group inside a form has
	// fields to be conditioned on.
	const isInsideForm = useSelect(
		select =>
			!! select( blockEditorStore ).getBlockParentsByBlockName( clientId, 'jetpack/contact-form' )
				?.length,
		[ clientId ]
	);

	if ( ! isInsideForm ) {
		return null;
	}

	return (
		<Suspense fallback={ null }>
			<ConditionalLogicPanel
				clientId={ clientId }
				attributes={ attributes }
				setAttributes={ setAttributes }
				isContainer={ true }
			/>
		</Suspense>
	);
};

/**
 * Add the conditional-logic panel to Jetpack form fields and to containers inside a form.
 *
 * A filter rather than per-block wiring: the field blocks share no single inspector
 * component — four of them build their own — so this is the only way to cover all of them
 * without touching nineteen edit files, and new field types inherit it automatically. A
 * container is a core block, which leaves no option but a filter in any case.
 */
export const withConditionalLogic = createHigherOrderComponent(
	BlockEdit => props => {
		// Mounted only for the selected block. This filter wraps every field block, and the
		// panel's useSelect walks the whole form tree to build the subject list; mounting it
		// on all of them meant that walk ran per field on every block-editor store change,
		// so a keystroke anywhere on the page cost O(fields x blocks). The inspector only
		// ever shows the selected block's panel, so there is nothing to render otherwise.
		if ( ! props.isSelected ) {
			return <BlockEdit { ...props } />;
		}

		if ( isConditionalLogicContainer( props.name ) ) {
			return (
				<>
					<BlockEdit { ...props } />
					<ContainerConditionalLogic { ...props } />
				</>
			);
		}

		if ( ! isConditionalLogicField( props.name ) ) {
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

/**
 * Give `core/group` its attribute, whatever else happens.
 *
 * Deliberately outside registerConditionalLogicFilter, and outside both of its guards. A
 * block's attributes are fixed when it registers, and Gutenberg's getBlockAttributes()
 * discards delimiter attributes the block type does not declare -- so any path that reaches
 * the editor without this having run drops a group's stored conditions on the next save,
 * silently and irreversibly.
 *
 * Behind the panel's own guards it was reachable two ways: a flag-off session, and anything
 * that claimed the BlockEdit namespace first, which makes that function return before it gets
 * here. Field blocks declare their attribute unconditionally in shared/settings; there is no
 * reason containers should be less safe. An unused attribute costs nothing when the feature
 * is off.
 *
 * @return {boolean} True when this call registered the filter, false when it was already there.
 */
export const registerContainerAttribute = () => {
	if ( hasFilter( 'blocks.registerBlockType', ATTRIBUTE_FILTER_NAMESPACE ) ) {
		return false;
	}

	addFilter( 'blocks.registerBlockType', ATTRIBUTE_FILTER_NAMESPACE, addContainerLogicAttribute );

	return true;
};

registerContainerAttribute();
registerConditionalLogicFilter();
