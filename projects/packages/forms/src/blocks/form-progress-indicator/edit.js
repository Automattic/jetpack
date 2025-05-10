import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import useFormSteps from '../../hooks/use-form-steps';
import { STORE_NAME as PREVIEW_STORE_NAME } from '../../store/preview-store';
import './editor.scss';

const FormProgressIndicatorEdit = ( { clientId } ) => {
	const { selectedStepClientId, isPreview } = useSelect( select => {
		const { isPreviewMode, getActivePreviewStepId } = select( PREVIEW_STORE_NAME );
		return {
			selectedStepClientId: getActivePreviewStepId(),
			isPreview: isPreviewMode(),
		};
	}, [] );

	const { parentFormId } = useSelect(
		select => {
			const { getBlockParentsByBlockName } = select( blockEditorStore );
			return {
				parentFormId: getBlockParentsByBlockName( clientId, [ 'jetpack/contact-form' ] )[ 0 ],
			};
		},
		[ clientId ]
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

			return {
				progress: ( ( selectedStepIndex + 1 ) / numberOfSteps ) * 100,
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
