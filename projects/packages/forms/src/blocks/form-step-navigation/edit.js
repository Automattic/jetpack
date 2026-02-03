import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as singleStepStore } from '../../store/form-step-preview.js';
import StepControls from '../shared/components/form-step-controls/index.js';
import useFormSteps from '../shared/hooks/use-form-steps.js';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id.js';

import './editor.scss';

export const PREVIOUS_BUTTON_TEMPLATE = [
	'core/button',
	{
		tagName: 'button',
		text: __( 'Previous', 'jetpack-forms' ),
		className: 'is-style-outline form-button-previous is-previous',
		metadata: { name: __( 'Previous button', 'jetpack-forms' ) },
	},
];
export const NEXT_BUTTON_TEMPLATE = [
	'core/button',
	{
		tagName: 'button',
		text: __( 'Next', 'jetpack-forms' ),
		className: 'form-button-next is-next',
		metadata: { name: __( 'Next button', 'jetpack-forms' ) },
	},
];

const SUBMIT_BUTTON_TEMPLATE = [
	'core/button',
	{
		tagName: 'button',
		text: __( 'Submit', 'jetpack-forms' ),
		className: 'form-button-submit is-submit',
		metadata: { name: __( 'Submit button', 'jetpack-forms' ) },
	},
];

export const NAVIGATION_TEMPLATE = [
	PREVIOUS_BUTTON_TEMPLATE,
	NEXT_BUTTON_TEMPLATE,
	SUBMIT_BUTTON_TEMPLATE,
];

const ALLOWED_BLOCKS = [ 'core/button' ];

/**
 * Check if a block's className contains a specific button type class.
 *
 * @param {object} block     - The block to check.
 * @param {string} typeClass - The class to look for (e.g., 'form-button-previous').
 * @return {boolean} Whether the block has the specified class.
 */
const hasButtonTypeClass = ( block, typeClass ) => {
	const className = block?.attributes?.className || '';
	return className.split( /\s+/ ).includes( typeClass );
};

/**
 * Get the button type identifier from a template's className.
 *
 * @param {string} className - The className string from template attributes.
 * @return {string|null} The button type (e.g., 'form-button-previous') or null.
 */
const getButtonTypeFromClassName = className => {
	const classes = ( className || '' ).split( /\s+/ );
	return classes.find( cls => cls.startsWith( 'form-button-' ) ) || null;
};

export default function Edit( { clientId } ) {
	const blockProps = useBlockProps();

	const { replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const { ancestorStepClientId, navigationBlocks } = useSelect(
		select => {
			const { getBlockParentsByBlockName, getBlocks } = select( blockEditorStore );
			const stepParentArray = getBlockParentsByBlockName( clientId, [ 'jetpack/form-step' ] );
			return {
				ancestorStepClientId: stepParentArray.length > 0 ? stepParentArray[ 0 ] : null,
				navigationBlocks: getBlocks( clientId ),
			};
		},
		[ clientId ]
	);

	const formClientId = useParentFormClientId( clientId );
	const steps = useFormSteps( formClientId );

	// Get the single step mode state and active step
	const { isSingleStep, activeStepId } = useSelect(
		select => {
			if ( ! formClientId ) return { isSingleStep: false, activeStepId: null };
			const { isSingleStepMode, getActiveStepId } = select( singleStepStore );
			return {
				isSingleStep: isSingleStepMode( formClientId ),
				activeStepId: getActiveStepId( formClientId ),
			};
		},
		[ formClientId ]
	);

	// Check if we're inside a step or standalone
	const isOutsideSteps = ! ancestorStepClientId;

	// Track the current step index (used later when replacing inner blocks)
	let currentIndex = 0;

	if ( isOutsideSteps && isSingleStep && activeStepId ) {
		// When outside steps but in single step mode, show buttons based on the active step
		const activeStepIndex = steps.findIndex( block => block.clientId === activeStepId );
		if ( activeStepIndex !== -1 ) {
			currentIndex = activeStepIndex;
		}
	} else if ( ! isOutsideSteps ) {
		// Inside a step - determine position
		const stepIndex = steps.findIndex( block => block.clientId === ancestorStepClientId );
		currentIndex = stepIndex;
	}

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: NAVIGATION_TEMPLATE,
		templateLock: 'all',
		allowedBlocks: ALLOWED_BLOCKS,
		renderAppender: false,
	} );

	useEffect( () => {
		// This happens when the step block is duplicated
		if ( typeof currentIndex === 'undefined' ) {
			return;
		}
		let shouldReplaceInnerBlocks = false;

		// First identify existing buttons in the navigation by their class names
		const existingButtons = {
			'form-button-previous': navigationBlocks.find(
				block => block.name === 'core/button' && hasButtonTypeClass( block, 'form-button-previous' )
			),
			'form-button-next': navigationBlocks.find(
				block => block.name === 'core/button' && hasButtonTypeClass( block, 'form-button-next' )
			),
			'form-button-submit': navigationBlocks.find(
				block => block.name === 'core/button' && hasButtonTypeClass( block, 'form-button-submit' )
			),
		};

		// Create a map of button types to track required changes
		const buttonUpdates = {
			'form-button-previous': {
				needed: false,
				existing: existingButtons[ 'form-button-previous' ],
			},
			'form-button-next': {
				needed: false,
				existing: existingButtons[ 'form-button-next' ],
			},
			'form-button-submit': {
				needed: false,
				existing: existingButtons[ 'form-button-submit' ],
			},
		};

		// Flag needed buttons based on template
		NAVIGATION_TEMPLATE.forEach( ( [ , blockAttributes ] ) => {
			const buttonType = getButtonTypeFromClassName( blockAttributes.className );
			if ( buttonType ) {
				buttonUpdates[ buttonType ].needed = true;

				// If button doesn't exist but is needed, we'll need to replace inner blocks
				if ( ! buttonUpdates[ buttonType ].existing ) {
					shouldReplaceInnerBlocks = true;
				}
			}
		} );

		// Build the updated button collection
		const replacementInnerBlocks = NAVIGATION_TEMPLATE.map( ( [ blockName, blockAttributes ] ) => {
			const buttonType = getButtonTypeFromClassName( blockAttributes.className );
			return buttonUpdates[ buttonType ]?.existing || createBlock( blockName, blockAttributes );
		} );

		if ( shouldReplaceInnerBlocks ) {
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( clientId, replacementInnerBlocks, false );
			return;
		}

		navigationBlocks.forEach( block => {
			const buttonType = getButtonTypeFromClassName( block.attributes?.className );
			// If a button exists but isn't needed in the new template, we need to update
			if ( buttonType && ! buttonUpdates[ buttonType ]?.needed ) {
				shouldReplaceInnerBlocks = true;
			}
		} );

		// Only update blocks if needed
		if ( shouldReplaceInnerBlocks ) {
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( clientId, replacementInnerBlocks, false );
		}
	}, [
		navigationBlocks,
		replaceInnerBlocks,
		clientId,
		currentIndex,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	return (
		<>
			<div className="wp-block-jetpack-form-step-navigation__wrapper">
				<div { ...innerBlocksProps } />
			</div>
			<StepControls formClientId={ formClientId } showToggle={ false } showNavigation={ true } />
		</>
	);
}
