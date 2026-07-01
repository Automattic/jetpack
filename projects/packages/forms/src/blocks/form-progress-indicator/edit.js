/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	useBlockProps,
	InspectorControls,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
/* eslint-enable @wordpress/no-unsafe-wp-apis */
import { __ } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/primitives';
import clsx from 'clsx';
import StepControls from '../shared/components/form-step-controls/index.js';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id.js';
import { calculateProgressPercentage } from '../shared/util/progress-calculation.js';

import './style.scss';

const FormProgressIndicatorEdit = ( { clientId, context, attributes, setAttributes } ) => {
	const parentFormId = useParentFormClientId( clientId );

	// Get data from context - provide mock data for previews when context is missing
	const steps = context?.[ 'jetpack/form-steps' ] || [ 1, 2, 3 ];
	const currentStepInfo = context?.[ 'jetpack/form-current-step' ] || { index: 0 };

	// Extract attributes
	const { variant = 'line', progressColor, progressBackgroundColor, textColor, style } = attributes;

	// Get WordPress color/gradient settings for the color panel
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	// Build style object with CSS custom properties for colors
	const colorStyles = {
		'--jp-progress-active-color': progressColor,
		'--jp-progress-track-color': progressBackgroundColor,
		// Text color comes from standard color support
		'--jp-progress-text-color': textColor || style?.color?.text,
	};

	const blockProps = useBlockProps( {
		style: colorStyles,
		className: `is-variant-${ variant }`,
	} );
	const isDotStyle = variant === 'dots';

	// Use shared progress calculation logic
	const currentStep = currentStepInfo.index + 1;
	let progressPercentage = calculateProgressPercentage( currentStep, steps.length, isDotStyle );

	// Show 25% progress in "All steps" view for line style to preview the bar
	if ( ! isDotStyle && currentStepInfo.index === -1 && steps.length > 0 ) {
		progressPercentage = 25;
	}

	return (
		<>
			<InspectorControls group="color">
				<ColorGradientSettingsDropdown
					panelId={ clientId }
					settings={ [
						{
							colorValue: progressColor,
							onColorChange: color => setAttributes( { progressColor: color } ),
							label: __( 'Progress color', 'jetpack-forms' ),
						},
						{
							colorValue: progressBackgroundColor,
							onColorChange: color => setAttributes( { progressBackgroundColor: color } ),
							label: __( 'Track color', 'jetpack-forms' ),
						},
					] }
					{ ...colorGradientSettings }
				/>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="jetpack-form-progress-indicator-steps">
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
					<div
						className="jetpack-form-progress-indicator-progress"
						style={ { width: `${ progressPercentage }%` } }
					></div>
				</div>
			</div>
			<StepControls formClientId={ parentFormId } showToggle={ false } showNavigation={ true } />
		</>
	);
};

export default FormProgressIndicatorEdit;
