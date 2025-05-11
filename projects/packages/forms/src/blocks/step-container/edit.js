import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import useParentFormClientId from '../../hooks/useParentFormClientId';
import StepControls from '../contact-form/components/step-controls';

export default function StepContainerEdit( { clientId } ) {
	const blockProps = useBlockProps( {
		className: 'jetpack-form-step-container',
	} );

	// Find the parent form clientId using our custom hook
	const ancestorFormClientId = useParentFormClientId( clientId );

	// Ensure we have at least one step if empty
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/form-step' ],
		template: [ [ 'jetpack/form-step', {} ] ],
		orientation: 'vertical',
	} );

	// Add a wrapper div to provide better structure for the steps container
	return (
		<>
			<div className="jetpack-form-steps-wrapper">
				<div { ...innerBlocksProps } />
			</div>
			<StepControls
				formClientId={ ancestorFormClientId }
				showToggle={ false }
				showNavigation={ true }
			/>
		</>
	);
}
