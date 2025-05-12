import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useFormSteps from '../../hooks/use-form-steps';
import useParentFormClientId from '../../hooks/useParentFormClientId';

import './editor.scss';

const PREVIOUS_BUTTON_TEMPLATE = [
	'jetpack/button',
	{
		element: 'button',
		text: __( 'Previous', 'jetpack-forms' ),
		uniqueId: 'previous-step',
		customVariant: 'previous',
		metaName: __( 'Previous Button', 'jetpack-forms' ),
	},
];
const NEXT_BUTTON_TEMPLATE = [
	'jetpack/button',
	{
		element: 'button',
		text: __( 'Next', 'jetpack-forms' ),
		uniqueId: 'next-step',
		customVariant: 'next',
		metaName: __( 'Next Button', 'jetpack-forms' ),
	},
];

const SUBMIT_BUTTON_TEMPLATE = [
	'jetpack/button',
	{
		element: 'button',
		text: __( 'Submit', 'jetpack-forms' ),
		uniqueId: 'submit-step',
		customVariant: 'submit',
		metaName: __( 'Submit Button', 'jetpack-forms' ),
	},
];

export default function Edit( { clientId } ) {
	const blockProps = useBlockProps();

	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const { ancestorStepClientId } = useSelect(
		select => {
			const { getBlockParentsByBlockName } = select( blockEditorStore );
			const stepParentArray = getBlockParentsByBlockName( clientId, [ 'jetpack/form-step' ] );
			return {
				ancestorStepClientId: stepParentArray.length > 0 ? stepParentArray[ 0 ] : null,
			};
		},
		[ clientId ]
	);

	const formClientId = useParentFormClientId( clientId );
	const allSteps = useFormSteps( formClientId );

	// Get the preview mode state and active step
	const { isPreviewMode, activePreviewStepId } = useSelect(
		select => {
			if ( ! formClientId ) return { isPreviewMode: false, activePreviewStepId: null };
			const formsPreviewStore = select( 'jetpack/forms/preview' );
			return {
				isPreviewMode: formsPreviewStore.isPreviewMode( formClientId ),
				activePreviewStepId: formsPreviewStore.getActivePreviewStepId( formClientId ),
			};
		},
		[ formClientId ]
	);

	// Check if we're inside a step or standalone
	const isOutsideSteps = ! ancestorStepClientId;

	// Calculate our current position in steps
	let isFirstStep = false;
	let isLastStep = false;
	let currentIndex = 0;

	if ( isOutsideSteps && isPreviewMode && activePreviewStepId ) {
		// When outside steps but in preview mode, show buttons based on the active preview step
		const activeStepIndex = allSteps.findIndex( block => block.clientId === activePreviewStepId );
		if ( activeStepIndex !== -1 ) {
			isFirstStep = activeStepIndex === 0;
			isLastStep = activeStepIndex === allSteps.length - 1;
			currentIndex = activeStepIndex;
		}
	} else if ( ! isOutsideSteps ) {
		// Inside a step - determine position
		const stepIndex = allSteps.findIndex( block => block.clientId === ancestorStepClientId );
		isFirstStep = stepIndex === 0;
		isLastStep = stepIndex === allSteps.length - 1;
		currentIndex = stepIndex;
	}

	const { navigationBlocks } = useSelect(
		select => {
			const { getBlocks } = select( blockEditorStore );
			const currentNavigationBlocks = getBlocks( clientId );
			return {
				navigationBlocks: currentNavigationBlocks,
			};
		},
		[ clientId ]
	);

	const template = useMemo( () => {
		// When outside steps and not in preview mode, show all buttons
		if ( isOutsideSteps ) {
			return [ PREVIOUS_BUTTON_TEMPLATE, NEXT_BUTTON_TEMPLATE, SUBMIT_BUTTON_TEMPLATE ];
		}

		if ( isFirstStep && isLastStep ) {
			// Single step in form - only show submit button
			return [ SUBMIT_BUTTON_TEMPLATE ];
		}

		if ( isFirstStep ) {
			// First step - only next button
			return [ NEXT_BUTTON_TEMPLATE ];
		}

		if ( isLastStep ) {
			// Last step - previous and submit buttons
			return [ PREVIOUS_BUTTON_TEMPLATE, SUBMIT_BUTTON_TEMPLATE ];
		}

		// Middle steps - previous and next buttons
		return [ PREVIOUS_BUTTON_TEMPLATE, NEXT_BUTTON_TEMPLATE ];
	}, [ isFirstStep, isLastStep, isOutsideSteps ] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: template,
		templateLock: 'all',
		allowedBlocks: [ 'jetpack/button' ],
		renderAppender: false,
	} );

	useEffect( () => {
		// This happends when the step block is duplilcated
		if ( typeof currentIndex === 'undefined' ) {
			return undefined;
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
		template.forEach( ( [ , blockAttributes ] ) => {
			buttonUpdates[ blockAttributes.uniqueId ].needed = true;

			// If button doesn't exist but is needed, we'll need to replace inner blocks
			if ( ! buttonUpdates[ blockAttributes.uniqueId ].existing ) {
				shouldReplaceInnerBlocks = true;
			}
		} );

		// Build the updated button collection
		const replacementInnerBlocks = template.map( ( [ blockName, blockAttributes ] ) => {
			return (
				buttonUpdates[ blockAttributes.uniqueId ].existing ||
				createBlock( blockName, {
					...blockAttributes,
					uniqueId: blockAttributes.uniqueId,
				} )
			);
		} );

		if ( shouldReplaceInnerBlocks ) {
			replaceInnerBlocks( clientId, replacementInnerBlocks, false );
			return undefined;
		}

		navigationBlocks.forEach( block => {
			// If a button exists but isn't needed in the new template, we need to update
			if ( ! buttonUpdates[ block.attributes.uniqueId ]?.needed ) {
				shouldReplaceInnerBlocks = true;
			}
		} );

		// Only update blocks if needed
		if ( shouldReplaceInnerBlocks ) {
			replaceInnerBlocks( clientId, replacementInnerBlocks, false );
			return undefined;
		}
	}, [ template, navigationBlocks, replaceInnerBlocks, clientId, currentIndex ] );

	return (
		<>
			<div { ...innerBlocksProps } />
		</>
	);
}
