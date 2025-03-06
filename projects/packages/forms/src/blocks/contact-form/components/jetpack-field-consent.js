import {
	InspectorControls,
	useBlockProps,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { BaseControl, PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldDimensionControls from './jetpack-field-dimension-controls';
import JetpackFieldLabel from './jetpack-field-label';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';

const JetpackFieldConsent = ( {
	instanceId,
	clientId,
	width,
	consentType,
	implicitConsentMessage,
	explicitConsentMessage,
	setAttributes,
	attributes,
	insertBlocksAfter,
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
				insertBlocksAfter={ insertBlocksAfter }
			/>
			<JetpackFieldDimensionControls
				clientId={ clientId }
				setAttributes={ setAttributes }
				width={ width }
			/>
			<InspectorControls group="color">
				<ColorGradientSettingsDropdown
					__experimentalIsRenderedInSidebar
					panelId={ clientId }
					gradients={ [] }
					disableCustomGradients
					settings={ [
						{
							colorValue: attributes.labelColor,
							onColorChange: value => setAttributes( { labelColor: value } ),
							label: __( 'Label Text', 'jetpack-forms' ),
							resetAllFilter: () => setAttributes( { labelColor: undefined } ),
							clearable: true,
						},
					] }
				/>
			</InspectorControls>
			<InspectorControls>
				<PanelBody title={ __( 'Manage Responses', 'jetpack-forms' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field Settings', 'jetpack-forms' ) }>
					<ToggleControl
						label={ __( 'Sync fields style', 'jetpack-forms' ) }
						checked={ attributes.shareFieldAttributes }
						onChange={ value => setAttributes( { shareFieldAttributes: value } ) }
						help={ __( 'Deactivate for individual styling of this block', 'jetpack-forms' ) }
						__nextHasNoMarginBottom={ true }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Consent Settings', 'jetpack-forms' ) }>
					<BaseControl __nextHasNoMarginBottom={ true }>
						<SelectControl
							label={ __( 'Permission to email', 'jetpack-forms' ) }
							value={ consentType }
							options={ [
								{ label: __( 'Mention that you can email', 'jetpack-forms' ), value: 'implicit' },
								{ label: __( 'Add a privacy checkbox', 'jetpack-forms' ), value: 'explicit' },
							] }
							onChange={ value => setAttributes( { consentType: value } ) }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
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
