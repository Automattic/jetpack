import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
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
	const { showStepNames } = attributes;
	const parentFormId = useParentFormClientId( clientId );
	const { currentStepInfo, steps } = useStepNavigation( parentFormId );

	// Use steps from context if available, fallback to useStepNavigation
	const contextSteps = context?.[ 'jetpack/form-steps' ] || [];
	const finalSteps = contextSteps.length > 0 ? contextSteps : steps;

	let progress = finalSteps.length
		? ( ( currentStepInfo.index + 1 ) / finalSteps.length ) * 100
		: 10;
	if ( currentStepInfo.index === -1 && finalSteps.length > 0 ) {
		progress = ( 1 / finalSteps.length ) * 100; // Assume the first step is active
	}

	const blockProps = useBlockProps( {
		className: `${ className || '' }${ showStepNames ? ' show-step-names' : '' }`,
	} );

	// Only need to set width – colours come from core style engine variables.
	const progressBarStyle = {
		width: `${ progress }%`,
	};

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
			</InspectorControls>
			<div className="jetpack-form-progress-indicator--wrapper">
				<div { ...blockProps }>
					<div className="jetpack-form-progress-indicator-bar" style={ progressBarStyle }></div>
					{ ( showStepNames || className?.includes( 'is-style-dots' ) ) &&
						finalSteps.length > 0 && (
							<div className="jetpack-form-progress-indicator-steps">
								{ finalSteps.map( ( step, index ) => (
									<div
										key={ index }
										className={ `jetpack-form-progress-indicator-step${
											index <= currentStepInfo.index ? ' is-active' : ''
										}` }
										data-step-index={ index }
									>
										<span className="jetpack-form-progress-indicator-step-label">
											{ step.label }
										</span>
									</div>
								) ) }
							</div>
						) }
				</div>
			</div>
			<StepControls formClientId={ parentFormId } showToggle={ false } showNavigation={ true } />
		</>
	);
};

export default FormProgressIndicatorEdit;
