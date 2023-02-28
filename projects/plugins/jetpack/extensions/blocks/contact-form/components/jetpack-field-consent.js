import {
	InspectorAdvancedControls,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { BaseControl, PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
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
					__( 'Add %s consent message…', 'jetpack' ),
					consentType
				) }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Manage Responses', 'jetpack' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field Settings', 'jetpack' ) }>
					<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />
					<ToggleControl
						label={ __( 'Sync fields style', 'jetpack' ) }
						checked={ attributes.shareFieldAttributes }
						onChange={ value => setAttributes( { shareFieldAttributes: value } ) }
						help={ __( 'Disable to apply individual styling to this block', 'jetpack' ) }
					/>
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Color', 'jetpack' ) }
					initialOpen={ false }
					colorSettings={ [
						{
							value: attributes.labelColor,
							onChange: value => setAttributes( { labelColor: value } ),
							label: __( 'Label Text', 'jetpack' ),
						},
					] }
				/>
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
		</div>
	);
};

export default compose(
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'borderColor',
	] ),
	withInstanceId
)( JetpackFieldConsent );
