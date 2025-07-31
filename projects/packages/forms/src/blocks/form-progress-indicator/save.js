import { useBlockProps } from '@wordpress/block-editor';

const FormProgressIndicatorSave = ( { attributes } ) => {
	const { showStepNames, progressColor, backgroundColor } = attributes;

	// Only set CSS vars when values are defined to avoid empty style="".
	const styleVars = {
		...( progressColor ? { '--jetpack-progress-color': progressColor } : {} ),
		...( backgroundColor ? { '--jetpack-progress-bg-color': backgroundColor } : {} ),
	};

	const blockProps = useBlockProps.save( {
		style: Object.keys( styleVars ).length ? styleVars : undefined,
	} );

	const wrapperProps = {
		className: 'jetpack-form-progress-indicator--wrapper',
		...( showStepNames ? { 'data-show-step-names': true } : {} ),
	};

	return (
		<div { ...wrapperProps }>
			<div { ...blockProps }>
				<div className="jetpack-form-progress-indicator-steps" />
			</div>
		</div>
	);
};

export default FormProgressIndicatorSave;
