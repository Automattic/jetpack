import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import './editor.scss';

const FormProgressIndicatorEdit = ( { clientId } ) => {
	const { steps, progress } = useSelect(
		select => {
			const { getBlocks, getBlockParentsByBlockName, getBlockAttributes } =
				select( blockEditorStore );

			const parentFormId = getBlockParentsByBlockName( clientId, [ 'jetpack/contact-form' ] )[ 0 ];
			const formAttributes = getBlockAttributes( parentFormId );
			const selectedStepClientId = formAttributes?.selectedStepClientId;
			const formContainerBlocks = parentFormId ? getBlocks( parentFormId ) : [];
			const formStepBlocks = formContainerBlocks.filter(
				block => block.name === 'jetpack/form-step'
			);

			// return the index of the selected step
			const selectedStepIndex = formStepBlocks.findIndex(
				block => block.clientId === selectedStepClientId
			);
			if ( selectedStepIndex === -1 ) {
				return {
					steps: formStepBlocks,
					progress: 1,
				};
			}

			return {
				steps: formStepBlocks,
				progress: ( ( selectedStepIndex + 1 ) / formStepBlocks.length ) * 100,
			};
		},
		[ clientId ]
	);

	return (
		<div { ...useBlockProps() }>
			<div className="jetpack-form-progress-indicator-editor">
				{ steps.length > 0 ? (
					<div
						className="jetpack-form-progress-indicator"
						style={ { '--jp-form-progress-value': `${ progress }%` } }
					></div>
				) : (
					<p className="no-steps-message">
						{ __( 'Add steps to your form to see the progress indicator', 'jetpack-forms' ) }
					</p>
				) }
			</div>
		</div>
	);
};

export default FormProgressIndicatorEdit;
