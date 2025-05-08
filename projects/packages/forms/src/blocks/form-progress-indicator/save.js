import { useBlockProps } from '@wordpress/block-editor';

const FormProgressIndicatorSave = () => {
	return (
		<div
			{ ...useBlockProps.save( {
				className: 'jetpack-form-progress-indicator',
			} ) }
			data-wp-interactive="jetpack/form"
			data-wp-style----jp-form-progress-value="state.getStepProgress"
			data-wp-init="actions.initializeProgress"
		>
			<div
				className="jetpack-form-progress-indicator-bar"
				data-wp-style="width: state.getStepProgress"
			></div>
		</div>
	);
};

export default FormProgressIndicatorSave;
