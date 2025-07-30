import { useBlockProps } from '@wordpress/block-editor';

const FormProgressIndicatorSave = ( { attributes } ) => {
	const { showStepNames, progressColor, backgroundColor } = attributes;
	const blockProps = useBlockProps.save( {
		style: {
			'--jetpack-progress-color': progressColor || undefined,
			'--jetpack-progress-bg-color': backgroundColor || undefined,
		},
	} );

	return (
		<div
			className="jetpack-form-progress-indicator--wrapper"
			data-show-step-names={ showStepNames }
		>
			<div { ...blockProps }>
				<div className="jetpack-form-progress-indicator-bar"></div>
				<div className="jetpack-form-progress-indicator-steps"></div>
			</div>
		</div>
	);
};

export default FormProgressIndicatorSave;
