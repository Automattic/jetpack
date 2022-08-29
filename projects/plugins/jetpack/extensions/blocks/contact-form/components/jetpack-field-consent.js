import { InspectorAdvancedControls, InspectorControls } from '@wordpress/block-editor';
import { BaseControl, PanelBody, SelectControl } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import JetpackFieldCss from './jetpack-field-css';
import JetpackFieldLabel from './jetpack-field-label';
import JetpackFieldWidth from './jetpack-field-width';

const JetpackFieldConsent = ( {
	id,
	instanceId,
	width,
	consentType,
	implicitConsentMessage,
	explicitConsentMessage,
	setAttributes,
} ) => {
	return (
		<BaseControl
			id={ `jetpack-field-consent-${ instanceId }` }
			className="jetpack-field jetpack-field-consent"
			label={
				<>
					{ consentType === 'explicit' && (
						<input className="jetpack-field-consent__checkbox" type="checkbox" disabled />
					) }
					<JetpackFieldLabel
						required={ false }
						label={
							{
								implicit: implicitConsentMessage,
								explicit: explicitConsentMessage,
							}[ consentType ] ?? ''
						}
						setAttributes={ setAttributes }
						labelFieldName={ `${ consentType }ConsentMessage` }
						placeholder={ sprintf(
							/* translators: placeholder is a type of consent: implicit or explicit */
							__( 'Add %s consent message…', 'jetpack' ),
							consentType
						) }
					/>
					<InspectorControls>
						<PanelBody title={ __( 'Field Settings', 'jetpack' ) }>
							<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />
						</PanelBody>
					</InspectorControls>
					<InspectorAdvancedControls>
						<JetpackFieldCss setAttributes={ setAttributes } id={ id } />
					</InspectorAdvancedControls>
					<InspectorControls>
						<PanelBody title={ __( 'Consent Settings', 'jetpack' ) }>
							<BaseControl>
								<SelectControl
									label={ __( 'Permission to email', 'jetpack' ) }
									value={ consentType }
									options={ [
										{ label: __( 'Mention that you can email', 'jetpack' ), value: 'implicit' },
										{ label: __( 'Add a privacy checkbox', 'jetpack' ), value: 'explicit' },
									] }
									onChange={ value => setAttributes( { consentType: value } ) }
								/>
							</BaseControl>
						</PanelBody>
					</InspectorControls>
				</>
			}
		/>
	);
};

export default withInstanceId( JetpackFieldConsent );
