import { InspectorAdvancedControls, InspectorControls } from '@wordpress/block-editor';
import { BaseControl, PanelBody, SelectControl } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import JetpackFieldCss from './jetpack-field-css';
import JetpackFieldLabel from './jetpack-field-label';
import JetpackFieldWidth from './jetpack-field-width';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';

const JetpackFieldConsent = ( {
	id,
	instanceId,
	width,
	consentType,
	implicitConsentMessage,
	explicitConsentMessage,
	setAttributes,
	attributes,
} ) => {
	return (
		<div
			id={ `jetpack-field-consent-${ instanceId }` }
			className="jetpack-field jetpack-field-consent"
		>
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
				attributes={ attributes }
				setAttributes={ setAttributes }
				labelFieldName={ `${ consentType }ConsentMessage` }
				placeholder={ sprintf(
					/* translators: placeholder is a type of consent: implicit or explicit */
					__( 'Add %s consent message…', 'jetpack-forms' ),
					consentType
				) }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Manage Responses', 'jetpack-forms' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field Settings', 'jetpack-forms' ) }>
					<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />
				</PanelBody>
			</InspectorControls>
			<InspectorAdvancedControls>
				<JetpackFieldCss setAttributes={ setAttributes } id={ id } />
			</InspectorAdvancedControls>
			<InspectorControls>
				<PanelBody title={ __( 'Consent Settings', 'jetpack-forms' ) }>
					<BaseControl>
						<SelectControl
							label={ __( 'Permission to email', 'jetpack-forms' ) }
							value={ consentType }
							options={ [
								{ label: __( 'Mention that you can email', 'jetpack-forms' ), value: 'implicit' },
								{ label: __( 'Add a privacy checkbox', 'jetpack-forms' ), value: 'explicit' },
							] }
							onChange={ value => setAttributes( { consentType: value } ) }
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>
		</div>
	);
};

export default withInstanceId( JetpackFieldConsent );
