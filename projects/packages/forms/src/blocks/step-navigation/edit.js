import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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

	const { navigationBlocks, currentIndex, isFirstStep, isLastStep, saveAll } = useSelect(
		select => {
			const { getBlocks, getBlockParentsByBlockName } = select( blockEditorStore );

			const stepId = getBlockParentsByBlockName( clientId, [ 'jetpack/form-step' ] )[ 0 ];

			if ( ! stepId ) {
				const parentFormId = getBlockParentsByBlockName( clientId, [
					'jetpack/contact-form',
				] )[ 0 ];
				const formBlocks = parentFormId ? getBlocks( parentFormId ) : [];
				const formContainerBlocks = formBlocks.filter(
					block => block.name === 'jetpack/step-container'
				);

				if ( formContainerBlocks.length === 0 ) {
					return {
						navigationBlocks: formBlocks,
						currentIndex: 1,
						isFirstStep: false,
						isLastStep: false,
						saveAll: true,
					};
				}

				return {
					navigationBlocks: getBlocks( formContainerBlocks[ 0 ].clientId ),
					currentIndex: 1,
					isFirstStep: false,
					isLastStep: false,
					saveAll: true,
				};
			}

			let parentFormId = getBlockParentsByBlockName( clientId, [ 'jetpack/step-container' ] )[ 0 ];

			if ( ! parentFormId ) {
				parentFormId = getBlockParentsByBlockName( clientId, [ 'jetpack/contact-form' ] )[ 0 ];
			}

			const formContainerBlocks = parentFormId ? getBlocks( parentFormId ) : [];
			const formStepBlocks = formContainerBlocks.filter(
				block => block.name === 'jetpack/form-step'
			);
			const currentStepIndex = formStepBlocks.findIndex( block => block.clientId === stepId );

			return {
				navigationBlocks: getBlocks( clientId ),
				currentIndex: currentStepIndex,
				isFirstStep: currentStepIndex === 0,
				isLastStep: currentStepIndex === formStepBlocks.length - 1,
				saveAll: false,
			};
		},
		[ clientId ]
	);

	const template = useMemo( () => {
		if ( saveAll ) {
			return [ PREVIOUS_BUTTON_TEMPLATE, NEXT_BUTTON_TEMPLATE, SUBMIT_BUTTON_TEMPLATE ];
		}
		let navTemplate = [ PREVIOUS_BUTTON_TEMPLATE, NEXT_BUTTON_TEMPLATE ];
		if ( isFirstStep ) {
			navTemplate = isLastStep ? [ SUBMIT_BUTTON_TEMPLATE ] : [ NEXT_BUTTON_TEMPLATE ];
		}

		if ( isLastStep ) {
			return [ PREVIOUS_BUTTON_TEMPLATE, SUBMIT_BUTTON_TEMPLATE ];
		}
		return navTemplate;
	}, [ isFirstStep, isLastStep, saveAll ] );

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
