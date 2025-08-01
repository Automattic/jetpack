import { useBlockProps } from '@wordpress/block-editor';
import { Icon, check } from '@wordpress/icons';
import StepControls from '../shared/components/form-step-controls';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';
import useStepNavigation from '../shared/hooks/use-step-navigation';

import './editor.scss';

const FormProgressIndicatorEdit = ( { clientId, context } ) => {
	const parentFormId = useParentFormClientId( clientId );
	const { currentStepInfo, steps } = useStepNavigation( parentFormId );

	const contextSteps = context?.[ 'jetpack/contact-form-steps' ] || [];

	const blockProps = useBlockProps();

	const isDotStyle = blockProps.className && blockProps.className.includes( 'is-style-dots' );

	let finalSteps = [ { label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' } ];
	if ( contextSteps.length > 0 ) {
		finalSteps = contextSteps;
	} else if ( steps.length > 0 ) {
		finalSteps = steps;
	}

	// Calculate progress percentage
	const completedSteps = finalSteps.filter(
		( step, index ) => index < currentStepInfo.index
	).length;
	const currentStep = currentStepInfo.index + 1;

	// For dots: completed steps / (total - 1), for line: current step / total
	let progressPercentage;
	if ( isDotStyle ) {
		progressPercentage =
			finalSteps.length > 1 ? ( completedSteps / ( finalSteps.length - 1 ) ) * 100 : 0;
	} else {
		progressPercentage = ( currentStep / finalSteps.length ) * 100;
	}

	return (
		<>
			<div className="jetpack-form-progress-indicator--wrapper">
				<div { ...blockProps }>
					<div className="jetpack-form-progress-indicator-steps">
						<div
							className="jetpack-form-progress-indicator-progress"
							style={ { width: `${ progressPercentage }%` } }
						></div>
						{ finalSteps.map( ( step, index ) => {
							const isActive = index === currentStepInfo.index;
							const isCompleted = index < currentStepInfo.index;

							return (
								<div
									key={ index }
									className={ `jetpack-form-progress-indicator-step${
										isActive ? ' is-active' : ''
									}${ isCompleted ? ' is-completed' : '' }` }
									data-step-index={ index }
								>
									<div className="jetpack-form-progress-indicator-line"></div>
									{ isDotStyle && (
										<div className="jetpack-form-progress-indicator-dot">
											<span className="jetpack-form-progress-indicator-step-number">
												{ isCompleted ? <Icon icon={ check } /> : index + 1 }
											</span>
										</div>
									) }
								</div>
							);
						} ) }
					</div>
				</div>
			</div>
			<StepControls formClientId={ parentFormId } showToggle={ false } showNavigation={ true } />
		</>
	);
};

export default FormProgressIndicatorEdit;
