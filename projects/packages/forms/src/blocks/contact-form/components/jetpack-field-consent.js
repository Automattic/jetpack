import { InspectorControls, PanelColorSettings, useBlockProps } from '@wordpress/block-editor';
import { BaseControl, PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldLabel from './jetpack-field-label';
import JetpackFieldWidth from './jetpack-field-width';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';

const JetpackFieldConsent = ( {
	instanceId,
	width,
	consentType,
	implicitConsentMessage,
	explicitConsentMessage,
	setAttributes,
	attributes,
} ) => {
	const blockProps = useBlockProps( {
		id: `jetpack-field-consent-${ instanceId }`,
		className: 'jetpack-field jetpack-field-consent',
	} );

	return (
		<div { ...blockProps }>
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
					<ToggleControl
						label={ __( 'Sync fields style', 'jetpack-forms' ) }
						checked={ attributes.shareFieldAttributes }
						onChange={ value => setAttributes( { shareFieldAttributes: value } ) }
						help={ __( 'Deactivate for individual styling of this block', 'jetpack-forms' ) }
					/>
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Color', 'jetpack-forms' ) }
					initialOpen={ false }
					colorSettings={ [
						{
							value: attributes.labelColor,
							onChange: value => setAttributes( { labelColor: value } ),
							label: __( 'Label Text', 'jetpack-forms' ),
						},
					] }
				/>
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
