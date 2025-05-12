import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import useStepNavigation from '../../hooks/use-step-navigation';
import useParentFormClientId from '../../hooks/useParentFormClientId';
import './editor.scss';

const FormProgressIndicatorEdit = ( { clientId } ) => {
	const parentFormId = useParentFormClientId( clientId );
	const { currentStepInfo, steps } = useStepNavigation( parentFormId );
	const progress = steps.length ? ( ( currentStepInfo.index + 1 ) / steps.length ) * 100 : 0;

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
