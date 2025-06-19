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
		<div { ...blockProps }>
			<div className="jetpack-form-progress-indicator" style={ containerStyle }>
				<div
					className="jetpack-form-progress-indicator-bar"
					style={ { backgroundColor: progressColor || undefined } }
				></div>
			</div>
		</div>
	);
};

export default FormProgressIndicatorSave;
