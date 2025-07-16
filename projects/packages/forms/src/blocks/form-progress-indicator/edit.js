import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import StepControls from '../shared/components/form-step-controls';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';
import useStepNavigation from '../shared/hooks/use-step-navigation';

import './editor.scss';

const FormProgressIndicatorEdit = ( { clientId, attributes, setAttributes } ) => {
	const { displayStepNames = false } = attributes;
	const parentFormId = useParentFormClientId( clientId );
	const { currentStepInfo, steps } = useStepNavigation( parentFormId );

	let progress = steps.length ? ( ( currentStepInfo.index + 1 ) / steps.length ) * 100 : 10;
	if ( currentStepInfo.index === -1 && steps.length > 0 ) {
		progress = ( 1 / steps.length ) * 100; // Assume the first step is active
	}

	const blockProps = useBlockProps();

	// Accessibility attributes for the progress bar wrapper.
	const roundedProgress = Math.round( progress );
	const progressBarWrapperProps = {
		...blockProps,
		role: 'progressbar',
		'aria-valuemin': 0,
		'aria-valuemax': 100,
		'aria-valuenow': roundedProgress,
	};

	// Only need to set width – colours come from core style engine variables.
	const progressBarStyle = {
		width: `${ progress }%`,
	};

	const namesList = displayStepNames ? (
		<ol className="jetpack-form-progress-indicator-names">
			{ steps.map( ( step, index ) => {
				let label;
				if ( step?.attributes?.stepLabel ) {
					label = step.attributes.stepLabel;
				} else {
					/* translators: %d: step number */
					label = sprintf( __( 'Step %d', 'jetpack-forms' ), index + 1 );
				}
				const isCurrent = index === currentStepInfo.index;
				return (
					<li
						key={ step.clientId }
						className={ isCurrent ? 'is-current-step' : '' }
						aria-current={ isCurrent ? 'step' : undefined }
					>
						{ label }
					</li>
				);
			} ) }
		</ol>
	) : null;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Progress Indicator', 'jetpack-forms' ) } initialOpen={ true }>
					<ToggleControl
						label={ __( 'Display step names', 'jetpack-forms' ) }
						checked={ displayStepNames }
						onChange={ value => setAttributes( { displayStepNames: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div className="jetpack-form-progress-indicator--wrapper">
				{ namesList }
				<div { ...progressBarWrapperProps }>
					<div className="jetpack-form-progress-indicator-bar" style={ progressBarStyle }></div>
				</div>
			</div>
			<StepControls formClientId={ parentFormId } showToggle={ false } showNavigation={ true } />
		</>
	);
};

export default FormProgressIndicatorEdit;
