import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

const StepDividerEdit = ( { clientId } ) => {
	const { getBlock, getBlockRootClientId, getBlockIndex, getBlocks } =
		useSelect( blockEditorStore );
	const { replaceInnerBlocks, insertBlock, removeBlock } = useDispatch( blockEditorStore );

	useEffect( () => {
		const parentStepClientId = getBlockRootClientId( clientId );
		if ( ! parentStepClientId ) return;

		const stepBlock = getBlock( parentStepClientId );
		if ( ! stepBlock || stepBlock.name !== 'jetpack/form-step' ) return;

		const stepInnerBlocks = getBlocks( parentStepClientId );
		const dividerIndex = stepInnerBlocks.findIndex( block => block.clientId === clientId );
		if ( dividerIndex === -1 ) return;

		const beforeBlocks = stepInnerBlocks.slice( 0, dividerIndex );
		const afterBlocks = stepInnerBlocks.slice( dividerIndex + 1 );

		// Replace the current step's inner blocks with beforeBlocks
		replaceInnerBlocks( parentStepClientId, beforeBlocks );

		// Find the parent container (step-container) and index of the current step
		const stepContainerClientId = getBlockRootClientId( parentStepClientId );
		const stepIndex = getBlockIndex( parentStepClientId, stepContainerClientId );

		// Create a new step with afterBlocks
		const newStepBlock = createBlock( 'jetpack/form-step', {}, afterBlocks );
		insertBlock( newStepBlock, stepIndex + 1, stepContainerClientId );

		removeBlock( clientId );
	}, [
		clientId,
		getBlock,
		getBlockRootClientId,
		getBlockIndex,
		getBlocks,
		replaceInnerBlocks,
		insertBlock,
		removeBlock,
	] );

	return null;
};

export default StepDividerEdit;
