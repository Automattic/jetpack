import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function StepContainerSave() {
	const blockProps = useBlockProps.save( {
		className: 'jetpack-form-step-container',
	} );

	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return (
		<div className="jetpack-form-steps-wrapper">
			<div { ...innerBlocksProps } />
		</div>
	);
}
