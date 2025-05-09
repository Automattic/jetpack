import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
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

	const { steps, progress } = useSelect(
		select => {
			const { getBlocks, getBlockParentsByBlockName } = select( blockEditorStore );

			const parentFormId = getBlockParentsByBlockName( clientId, [ 'jetpack/contact-form' ] )[ 0 ];
			const formContainerBlocks = parentFormId ? getBlocks( parentFormId ) : [];

			let formStepBlocks = formContainerBlocks.filter(
				block => block.name === 'jetpack/form-step'
			);

			if ( formStepBlocks.length === 0 ) {
				const formStepContainer = formContainerBlocks.filter(
					block => block.name === 'jetpack/step-container'
				)[ 0 ];

				formStepBlocks = formStepContainer ? getBlocks( formStepContainer.clientId ) : [];
			}
			// So we don't devide by zero.
			const numberOfSteps = formStepBlocks.length ? formStepBlocks.length : 1;

			if ( ! isPreview ) {
				return {
					steps: formStepBlocks,
					progress: ( 1 / numberOfSteps ) * 100,
				};
			}

			// return the index of the selected step
			const selectedStepIndex = formStepBlocks.findIndex(
				block => block.clientId === selectedStepClientId
			);

			return {
				steps: formStepBlocks,
				progress: ( ( selectedStepIndex + 1 ) / numberOfSteps ) * 100,
			};
		},
		[ clientId, selectedStepClientId, isPreview ]
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
