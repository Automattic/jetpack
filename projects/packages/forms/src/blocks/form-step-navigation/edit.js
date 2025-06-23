import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as singleStepStore } from '../../store/form-step-preview';
import StepControls from '../shared/components/form-step-controls';
import useFormSteps from '../shared/hooks/use-form-steps';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';

import './editor.scss';

export const PREVIOUS_BUTTON_TEMPLATE = [
	'jetpack/button',
	{
		element: 'button',
		text: __( 'Previous', 'jetpack-forms' ),
		uniqueId: 'previous-step',
		customVariant: 'previous',
		className: 'is-style-outline',
		metaName: __( 'Previous button', 'jetpack-forms' ),
	},
];
export const NEXT_BUTTON_TEMPLATE = [
	'jetpack/button',
	{
		element: 'button',
		text: __( 'Next', 'jetpack-forms' ),
		uniqueId: 'next-step',
		customVariant: 'next',
		metaName: __( 'Next button', 'jetpack-forms' ),
	},
];

const SUBMIT_BUTTON_TEMPLATE = [
	'jetpack/button',
	{
		element: 'button',
		text: __( 'Submit', 'jetpack-forms' ),
		uniqueId: 'submit-step',
		customVariant: 'submit',
		metaName: __( 'Submit button', 'jetpack-forms' ),
	},
];

export const NAVIGATION_TEMPLATE = [
	PREVIOUS_BUTTON_TEMPLATE,
	NEXT_BUTTON_TEMPLATE,
	SUBMIT_BUTTON_TEMPLATE,
];

const ALLOWED_BLOCKS = [ 'jetpack/button' ];

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

		// First identify existing buttons in the navigation
		const existingButtons = {
			previous: navigationBlocks.find(
				block => block.name === 'jetpack/button' && block.attributes.uniqueId === 'previous-step'
			),
			next: navigationBlocks.find(
				block => block.name === 'jetpack/button' && block.attributes.uniqueId === 'next-step'
			),
			submit: navigationBlocks.find(
				block => block.name === 'jetpack/button' && block.attributes.uniqueId === 'submit-step'
			),
		};

		// Create a map of button types to track required changes
		const buttonUpdates = {
			'previous-step': { needed: false, existing: existingButtons.previous },
			'next-step': { needed: false, existing: existingButtons.next },
			'submit-step': { needed: false, existing: existingButtons.submit },
		};

		// Flag needed buttons based on template
		NAVIGATION_TEMPLATE.forEach( ( [ , blockAttributes ] ) => {
			buttonUpdates[ blockAttributes.uniqueId ].needed = true;

			// If button doesn't exist but is needed, we'll need to replace inner blocks
			if ( ! buttonUpdates[ blockAttributes.uniqueId ].existing ) {
				shouldReplaceInnerBlocks = true;
			}
		} );

		// Build the updated button collection
		const replacementInnerBlocks = NAVIGATION_TEMPLATE.map( ( [ blockName, blockAttributes ] ) => {
			return (
				buttonUpdates[ blockAttributes.uniqueId ].existing ||
				createBlock( blockName, {
					...blockAttributes,
					uniqueId: blockAttributes.uniqueId,
				} )
			);
		} );

		if ( shouldReplaceInnerBlocks ) {
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( clientId, replacementInnerBlocks, false );
			return;
		}

		navigationBlocks.forEach( block => {
			// If a button exists but isn't needed in the new template, we need to update
			if ( ! buttonUpdates[ block.attributes.uniqueId ]?.needed ) {
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
