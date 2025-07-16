import { useBlockProps } from '@wordpress/block-editor';

const FormProgressIndicatorSave = ( { attributes } ) => {
	const { displayStepNames = false } = attributes;
	const blockProps = useBlockProps.save( {
		role: 'progressbar',
		'aria-valuemin': 0,
		'aria-valuemax': 100,
		// Bind numeric progress value from interactivity store.
		'data-wp-bind--aria-valuenow': 'state.getStepProgressValue',
	} );

	return (
		<div className="jetpack-form-progress-indicator--wrapper">
			{ displayStepNames && <ol className="jetpack-form-progress-indicator-names"></ol> }
			<div { ...blockProps }>
				<div className="jetpack-form-progress-indicator-bar"></div>
			</div>
		</div>
	);
};

export default FormProgressIndicatorSave;
