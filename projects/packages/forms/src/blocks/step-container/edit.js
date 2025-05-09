import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import StepControls from '../contact-form/components/step-controls';

const ALL_STEPS_VALUE = '__all__';

export default function StepContainerEdit( { clientId } ) {
	const blockProps = useBlockProps( {
		className: 'jetpack-form-step-container',
	} );

	// Get the parent form block client ID
	const { formClientId, selectedStepId } = useSelect(
		select => {
			const { getBlockParentsByBlockName, getBlockAttributes } = select( blockEditorStore );
			const parentIds = getBlockParentsByBlockName( clientId, 'jetpack/contact-form' );
			const parentId = parentIds.length ? parentIds[ 0 ] : null;
			let selectedStepClientId = ALL_STEPS_VALUE;
			if ( parentId ) {
				const attributes = getBlockAttributes( parentId );
				if ( attributes && attributes.selectedStepClientId ) {
					selectedStepClientId = attributes.selectedStepClientId;
				}
			}

			return {
				formClientId: parentIds.length ? parentIds[ 0 ] : null,
				selectedStepId: selectedStepClientId,
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	// Ensure we have at least one step if empty
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/form-step' ],
		template: [ [ 'jetpack/form-step', {} ] ],
		orientation: 'vertical',
	} );

	const updateParentAttributes = useCallback(
		attributes => {
			if ( formClientId ) {
				updateBlockAttributes( formClientId, attributes );
			}
		},
		[ formClientId, updateBlockAttributes ]
	);

	// Add a wrapper div to provide better structure for the steps container
	return (
		<>
			<div className="jetpack-form-steps-wrapper">
				<div { ...innerBlocksProps } />
			</div>
			<StepControls
				clientId={ formClientId }
				selectedStepClientId={ selectedStepId }
				setParentAttributes={ updateParentAttributes }
				onlyNav={ true }
			/>
		</>
	);
}
