import { InspectorControls, useBlockProps, PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import StepControls from '../shared/components/form-step-controls';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';
import useStepNavigation from '../shared/hooks/use-step-navigation';

import './editor.scss';

const FormProgressIndicatorEdit = ( {
	attributes,
	setAttributes,
	clientId,
	className,
	context,
} ) => {
	const { showStepNames, progressColor, backgroundColor } = attributes;
	const parentFormId = useParentFormClientId( clientId );
	const { currentStepInfo, steps } = useStepNavigation( parentFormId );

	// Use steps from context if available, fallback to useStepNavigation
	const contextSteps = context?.[ 'jetpack/form-steps' ] || [];
	const finalSteps = contextSteps.length > 0 ? contextSteps : steps;

	const blockProps = useBlockProps( {
		className: `${ className || '' }${ showStepNames ? ' show-step-names' : '' }`,
		style: {
			'--jetpack-progress-color': progressColor || undefined,
			'--jetpack-progress-bg-color': backgroundColor || undefined,
		},
	} );

	const isDotStyle =
		className?.includes( 'is-style-dots' ) || blockProps.className?.includes( 'is-style-dots' );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-forms' ) }>
					<ToggleControl
						label={ __( 'Show step names', 'jetpack-forms' ) }
						checked={ showStepNames }
						onChange={ value => setAttributes( { showStepNames: value } ) }
					/>
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Color settings', 'jetpack-forms' ) }
					colorSettings={ [
						{
							value: progressColor,
							onChange: value => setAttributes( { progressColor: value } ),
							label: __( 'Progress color', 'jetpack-forms' ),
						},
						{
							value: backgroundColor,
							onChange: value => setAttributes( { backgroundColor: value } ),
							label: __( 'Background color', 'jetpack-forms' ),
						},
					] }
				/>
			</InspectorControls>
			<div className="jetpack-form-progress-indicator--wrapper">
				<div { ...blockProps }>
					<div className="jetpack-form-progress-indicator-steps">
						{ finalSteps.length > 0 &&
							finalSteps.map( ( step, index ) => {
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
													{ isCompleted ? '✓' : index + 1 }
												</span>
											</div>
										) }
										{ showStepNames && (
											<div className="jetpack-form-progress-indicator-step-label">
												{ step.label }
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
