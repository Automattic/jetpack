/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { BaseControl, ExternalLink, PanelBody, SelectControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';
import JetpackFieldControls from './jetpack-field-controls';

const JetpackFieldConsent = ( {
	id,
	instanceId,
	required,
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
						required={ required }
						label={
							{
								implicit: implicitConsentMessage,
								explicit: explicitConsentMessage,
							}[ consentType ] ?? ''
						}
						setAttributes={ setAttributes }
						labelFieldName={ `${ consentType }ConsentMessage` }
						placeholder={ sprintf( __( 'Add %s consent message… ', '' ), consentType ) }
					/>
					<JetpackFieldControls
						id={ id }
						required={ required }
						width={ width }
						setAttributes={ setAttributes }
					/>
					<InspectorControls>
						<PanelBody title={ __( 'Consent Settings', 'jetpack' ) }>
							<BaseControl>
								<p>
									{ __(
										'To start sending email campaigns, install the Creative Mail plugin for WordPress. ',
										'jetpack'
									) }
									<ExternalLink href="https://wordpress.org/plugins/creative-mail-by-constant-contact/">
										Get the plugin now
									</ExternalLink>
								</p>

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
