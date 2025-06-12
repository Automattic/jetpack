import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import AddStepControls from '../contact-form/components/add-step-controls';
import StepControls from '../contact-form/components/step-controls';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';

export default function StepContainerEdit( { clientId } ) {
	const blockProps = useBlockProps( {
		className: 'jetpack-form-step-container',
	} );

	const formClientId = useParentFormClientId( clientId );

	// Ensure we have at least one step if empty
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/form-step' ],
		orientation: 'vertical',
		defaultBlock: {
			name: 'jetpack/form-step',
		},
		directInsert: true,
	} );

	// Add a wrapper div to provide better structure for the steps container
	return (
		<>
			<div className="jetpack-form-steps-wrapper">
				<div { ...innerBlocksProps } />
			</div>
			<StepControls formClientId={ formClientId } />
			<AddStepControls formClientId={ formClientId } clientId={ clientId } />
		</>
	);
}
