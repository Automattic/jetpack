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
		type: 'submit',
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

// Map button types to their templates
const BUTTON_TEMPLATES = {
	previous: PREVIOUS_BUTTON_TEMPLATE,
	next: NEXT_BUTTON_TEMPLATE,
	submit: SUBMIT_BUTTON_TEMPLATE,
};

/**
 * Identify the button type from a block.
 * Supports both legacy jetpack/button and new core/button formats.
 *
 * @param {object} block - The block to identify.
 * @return {string|null} Button type ('previous', 'next', 'submit') or null.
 */
export const getButtonType = block => {
	// New format: core/button with form-button-* class
	if ( block.name === 'core/button' ) {
		const className = block.attributes?.className || '';
		const classes = className.split( /\s+/ );
		if ( classes.includes( 'form-button-previous' ) ) {
			return 'previous';
		}
		if ( classes.includes( 'form-button-next' ) ) {
			return 'next';
		}
		if ( classes.includes( 'form-button-submit' ) ) {
			return 'submit';
		}
	}

	// Legacy format: jetpack/button with uniqueId matching data-id-attr values
	if ( block.name === 'jetpack/button' ) {
		const uniqueId = block.attributes?.uniqueId || '';
		if ( uniqueId === 'previous-step' ) {
			return 'previous';
		}
		if ( uniqueId === 'next-step' ) {
			return 'next';
		}
		if ( uniqueId === 'submit-step' ) {
			return 'submit';
		}
	}

	return null;
};

/**
 * Migrate a legacy jetpack/button to core/button, preserving custom text.
 *
 * @param {object} legacyBlock - The legacy jetpack/button block.
 * @param {string} buttonType  - The button type ('previous', 'next', 'submit').
 * @return {object} A new core/button block with preserved customizations.
 */
export const migrateLegacyButton = ( legacyBlock, buttonType ) => {
	const template = BUTTON_TEMPLATES[ buttonType ];
	const [ blockName, templateAttributes ] = template;

	// Preserve custom text from the legacy button
	const customText = legacyBlock.attributes?.text;

	return createBlock( blockName, {
		...templateAttributes,
		...( customText && { text: customText } ),
	} );
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

		// Identify existing buttons (supports both legacy jetpack/button and new core/button)
		const existingButtons = {
			previous: null,
			next: null,
			submit: null,
		};

		navigationBlocks.forEach( block => {
			const buttonType = getButtonType( block );
			if ( buttonType && ! existingButtons[ buttonType ] ) {
				existingButtons[ buttonType ] = block;
			}
		} );

		// Check if we need to make any changes
		const hasMissingButtons =
			! existingButtons.previous || ! existingButtons.next || ! existingButtons.submit;
		const hasLegacyButtons = navigationBlocks.some( block => block.name === 'jetpack/button' );

		// Only proceed if buttons are missing or need migration
		if ( ! hasMissingButtons && ! hasLegacyButtons ) {
			return;
		}

		// Build the button collection: preserve existing core/buttons, migrate legacy, create missing
		const replacementBlocks = [ 'previous', 'next', 'submit' ].map( buttonType => {
			const existing = existingButtons[ buttonType ];

			if ( ! existing ) {
				// Button is missing - create from template
				const [ blockName, blockAttributes ] = BUTTON_TEMPLATES[ buttonType ];
				return createBlock( blockName, blockAttributes );
			}

			if ( existing.name === 'jetpack/button' ) {
				// Legacy button - migrate to core/button preserving text
				return migrateLegacyButton( existing, buttonType );
			}

			// Existing core/button - keep as-is
			return existing;
		} );

		__unstableMarkNextChangeAsNotPersistent();
		replaceInnerBlocks( clientId, replacementBlocks, false );
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
