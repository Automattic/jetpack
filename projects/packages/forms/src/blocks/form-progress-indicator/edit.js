import { useBlockProps } from '@wordpress/block-editor';
import { SVG, Path } from '@wordpress/components';
import clsx from 'clsx';
import { getActiveStyleName } from '../../../../../plugins/jetpack/extensions/shared/block-styles';
import StepControls from '../shared/components/form-step-controls';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';
import useStepNavigation from '../shared/hooks/use-step-navigation';
import { calculateProgressPercentage } from '../shared/util/progress-calculation';
import { settings } from './';

import './editor.scss';

const FormProgressIndicatorEdit = ( { clientId } ) => {
	const parentFormId = useParentFormClientId( clientId );
	const { currentStepInfo, steps } = useStepNavigation( parentFormId );

	const blockProps = useBlockProps();
	const activeStyleName = getActiveStyleName( settings.styles, blockProps.className );
	const isDotStyle = activeStyleName === 'dots';

	// Use shared progress calculation logic
	const currentStep = currentStepInfo.index + 1;
	let progressPercentage = calculateProgressPercentage( currentStep, steps.length, isDotStyle );

	// Show 25% progress in "All steps" view for line style to preview the bar
	if ( ! isDotStyle && currentStepInfo.index === -1 && steps.length > 0 ) {
		progressPercentage = 25;
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
						{ steps.map( ( step, index ) => {
							const isActive = index === currentStepInfo.index;
							const isCompleted = index < currentStepInfo.index;

							return (
								<div
									key={ index }
									className={ clsx( 'jetpack-form-progress-indicator-step', {
										'is-active': isActive,
										'is-completed': isCompleted,
									} ) }
									data-step-index={ index }
								>
									<div className="jetpack-form-progress-indicator-line"></div>
									{ isDotStyle && (
										<div className="jetpack-form-progress-indicator-dot">
											<span className="jetpack-form-progress-indicator-step-number">
												{ isCompleted ? (
													<SVG
														width="24"
														height="24"
														viewBox="0 0 24 24"
														xmlns="http://www.w3.org/2000/svg"
													>
														<Path
															d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z"
															fill="currentColor"
														/>
													</SVG>
												) : (
													index + 1
												) }
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
