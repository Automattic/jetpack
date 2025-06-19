import { useBlockProps } from '@wordpress/block-editor';

const FormProgressIndicatorSave = () => {
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<div className="jetpack-form-progress-indicator-bar"></div>
		</div>
	);
};

export default FormProgressIndicatorSave;
