import { useBlockProps } from '@wordpress/block-editor';

const FormProgressIndicatorSave = () => {
	return (
		<div
			{ ...useBlockProps.save( {
				className: 'jetpack-form-progress-indicator',
			} ) }
			data-wp-interactive="jetpack/form"
			data-wp-style----progress="state.getStepProgress"
			data-wp-init="actions.initializeProgress"
		></div>
	);
};

export default FormProgressIndicatorSave;
