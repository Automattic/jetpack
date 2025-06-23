import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import AddStepControls from '../shared/components/form-add-step-controls';
import StepControls from '../shared/components/form-step-controls';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';

export default function StepContainerEdit( { clientId } ) {
	const blockProps = useBlockProps( {
		className: 'jetpack-form-step-container',
	} );

	const formClientId = useParentFormClientId( clientId );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/form-step' ],
		defaultBlock: {
			name: 'jetpack/form-step',
		},
		directInsert: true,
	} );

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
