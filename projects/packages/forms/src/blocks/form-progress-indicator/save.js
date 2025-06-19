import { useBlockProps } from '@wordpress/block-editor';

const FormProgressIndicatorSave = () => {
	const blockProps = useBlockProps.save();

	return (
		<div className="jetpack-form-progress-indicator--wrapper">
			<div { ...blockProps }>
				<div className="jetpack-form-progress-indicator-bar"></div>
			</div>
		</div>
	);
};

export default FormProgressIndicatorSave;
