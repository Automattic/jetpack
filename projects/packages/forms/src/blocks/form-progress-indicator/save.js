import { useBlockProps } from '@wordpress/block-editor';

const FormProgressIndicatorSave = ( { attributes } ) => {
	const { backgroundColor, progressColor, gradient } = attributes;
	const blockProps = useBlockProps.save();

	// Apply styles
	const containerStyle = {
		backgroundColor: backgroundColor || undefined,
		backgroundImage: gradient || undefined,
	};

	return (
		<div data-wp-interactive="jetpack/form" { ...blockProps }>
			<div className="jetpack-form-progress-indicator" style={ containerStyle }>
				<div
					className="jetpack-form-progress-indicator-bar"
					style={ { backgroundColor: progressColor || undefined } }
					data-wp-style--width="state.getStepProgress"
				></div>
			</div>
		</div>
	);
};

export default FormProgressIndicatorSave;
