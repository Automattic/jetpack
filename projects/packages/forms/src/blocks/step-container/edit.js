import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function StepContainerEdit() {
	const blockProps = useBlockProps( {
		className: 'jetpack-form-step-container',
	} );

	// Ensure we have at least one step if empty
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/form-step' ],
		template: [ [ 'jetpack/form-step', {} ] ],
		orientation: 'vertical',
	} );

	// Add a wrapper div to provide better structure for the steps container
	return (
		<div className="jetpack-form-steps-wrapper">
			<div { ...innerBlocksProps } />
		</div>
	);
}
