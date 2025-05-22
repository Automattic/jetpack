import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import useParentFormClientId from '../../hooks/use-parent-form-client-id';
import useStepNavigation from '../../hooks/use-step-navigation';
import StepControls from '../contact-form/components/step-controls';

import './editor.scss';

const FormProgressIndicatorEdit = ( { clientId } ) => {
	const parentFormId = useParentFormClientId( clientId );
	const { currentStepInfo, steps } = useStepNavigation( parentFormId );

	let progress = steps.length ? ( ( currentStepInfo.index + 1 ) / steps.length ) * 100 : 10;
	if ( currentStepInfo.index === -1 && steps.length > 0 ) {
		progress = ( 1 / steps.length ) * 100; // Assume the first step is active
	}

	return (
		<>
			<div { ...useBlockProps() }>
				<div className="jetpack-form-progress-indicator-editor">
					{ steps.length > 0 ? (
						<div className="jetpack-form-progress-indicator">
							<div
								className="jetpack-form-progress-indicator-bar"
								style={ { width: `${ progress }%` } }
							></div>
						</div>
					) : (
						<p className="no-steps-message">
							{ __( 'Add steps to your form to see the progress indicator', 'jetpack-forms' ) }
						</p>
					) }
				</div>
			</div>
			<StepControls formClientId={ parentFormId } showToggle={ false } showNavigation={ true } />
		</>
	);
};

export default FormProgressIndicatorEdit;
