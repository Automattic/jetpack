import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import useFormSteps from '../../hooks/use-form-steps';
import { store as previewStore } from '../../store/preview-store';
import './editor.scss';

const FormProgressIndicatorEdit = ( { clientId } ) => {
	const { parentFormId } = useSelect(
		select => {
			const { getBlockParentsByBlockName } = select( blockEditorStore );
			return {
				parentFormId: getBlockParentsByBlockName( clientId, [ 'jetpack/contact-form' ] )[ 0 ],
			};
		},
		[ clientId ]
	);

	const { selectedStepClientId, isPreview } = useSelect(
		select => {
			const { isPreviewMode, getActivePreviewStepId } = select( previewStore );
			return {
				selectedStepClientId: getActivePreviewStepId( parentFormId ),
				isPreview: isPreviewMode( parentFormId ),
			};
		},
		[ parentFormId ]
	);

	const steps = useFormSteps( parentFormId );

	const { progress } = useSelect(
		() => {
			// So we don't devide by zero.
			const numberOfSteps = steps.length ? steps.length : 1;

			if ( ! isPreview ) {
				// In the editor, when not previewing a specific step,
				// show progress as if the first step is active.
				return {
					progress: ( 1 / numberOfSteps ) * 100,
				};
			}

			// return the index of the selected step
			const selectedStepIndex = steps.findIndex( block => block.clientId === selectedStepClientId );

			// If selectedStepClientId is null (All Steps view) or the step wasn't found, show full progress
			const stepIndex = selectedStepIndex === -1 ? numberOfSteps - 1 : selectedStepIndex;

			return {
				progress: ( ( stepIndex + 1 ) / numberOfSteps ) * 100,
			};
		},
		[ steps, selectedStepClientId, isPreview ] // steps is now a dependency
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
