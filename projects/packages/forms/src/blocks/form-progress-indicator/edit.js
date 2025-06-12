import {
	useBlockProps,
	InspectorControls,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import StepControls from '../contact-form/components/step-controls';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';
import useStepNavigation from '../shared/hooks/use-step-navigation';

import './editor.scss';

const FormProgressIndicatorEdit = ( { attributes, setAttributes, clientId } ) => {
	const { backgroundColor, progressColor, gradient } = attributes;
	const parentFormId = useParentFormClientId( clientId );
	const { currentStepInfo, steps } = useStepNavigation( parentFormId );

	let progress = steps.length ? ( ( currentStepInfo.index + 1 ) / steps.length ) * 100 : 10;
	if ( currentStepInfo.index === -1 && steps.length > 0 ) {
		progress = ( 1 / steps.length ) * 100; // Assume the first step is active
	}

	const blockProps = useBlockProps();

	// Container style with background color or gradient
	const containerStyle = {
		backgroundColor: backgroundColor || undefined,
		backgroundImage: gradient || undefined,
	};

	// Progress bar style
	const progressBarStyle = {
		width: `${ progress }%`,
		backgroundColor: progressColor || undefined,
	};

	return (
		<>
			<InspectorControls>
				<PanelColorGradientSettings
					title={ __( 'Color settings', 'jetpack-forms' ) }
					initialOpen={ true }
					settings={ [
						{
							colorValue: backgroundColor,
							onColorChange: value => setAttributes( { backgroundColor: value } ),
							gradientValue: gradient,
							onGradientChange: value => setAttributes( { gradient: value } ),
							label: __( 'Background', 'jetpack-forms' ),
						},
						{
							colorValue: progressColor,
							onColorChange: value => setAttributes( { progressColor: value } ),
							label: __( 'Progress bar', 'jetpack-forms' ),
						},
					] }
				/>
			</InspectorControls>

			<div { ...blockProps }>
				<div className="jetpack-form-progress-indicator-editor">
					{ steps.length > 0 ? (
						<div className="jetpack-form-progress-indicator" style={ containerStyle }>
							<div className="jetpack-form-progress-indicator-bar" style={ progressBarStyle }></div>
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
