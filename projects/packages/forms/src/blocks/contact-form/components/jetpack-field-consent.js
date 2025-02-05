import { InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { createBlock, getBlockType } from '@wordpress/blocks';
import { BaseControl, PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { compose, withInstanceId, usePrevious } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { ALLOWED_INNER_BLOCKS } from '../util/constants';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldWidth from './jetpack-field-width';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';

const INPUT_ATTRIBUTES = {
	className: 'jetpack-field-consent__checkbox',
	inline: true,
	type: 'checkbox',
};

const JetpackFieldConsent = ( {
	clientId,
	instanceId,
	width,
	implicitConsentMessage,
	explicitConsentMessage,
	setAttributes,
	attributes,
} ) => {
	const { consentType, label, required, requiredText } = attributes;
	const blockProps = useBlockProps( {
		id: `jetpack-field-consent-${ instanceId }`,
		className: 'jetpack-field jetpack-field-consent',
	} );

	const labelBlockType = getBlockType( 'jetpack/field-label' );
	const defaultLabel = labelBlockType.attributes.label.default;
	const template = useMemo( () => {
		const inputTemplate = [ 'jetpack/field-input', { inline: true, type: 'checkbox' } ];
		const currentLabel =
			{
				implicit: implicitConsentMessage,
				explicit: explicitConsentMessage,
			}[ consentType ] ?? label;
		const labelTemplate = [
			'jetpack/field-label',
			{ defaultLabel, inline: true, label: currentLabel, required, requiredText },
		];

		if ( consentType === 'explicit' ) {
			return [ inputTemplate, labelTemplate ];
		}
		return [ labelTemplate ];
	}, [
		consentType,
		defaultLabel,
		explicitConsentMessage,
		implicitConsentMessage,
		label,
		required,
		requiredText,
	] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_INNER_BLOCKS,
		template,
		templateLock: 'all',
	} );

	// TODO: Replace all the uses of select( 'core/block-editor' ) to use imported name etc.
	const { insertBlocks, removeBlock, updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const innerBlocks = useSelect(
		select => select( 'core/block-editor' ).getBlocks( clientId ),
		[ clientId ]
	);
	const inputBlockId = innerBlocks.find( block => block.name === 'jetpack/field-input' )?.clientId;
	const labelBlockId = innerBlocks.find( block => block.name === 'jetpack/field-label' );

	// Wrangle inner input block depending on consentType.
	useEffect( () => {
		if ( consentType === 'explicit' && ! inputBlockId ) {
			const inputBlock = createBlock( 'jetpack/field-input', INPUT_ATTRIBUTES );
			insertBlocks( [ inputBlock ], 0, clientId );
		}

		if ( consentType === 'implicit' && inputBlockId ) {
			removeBlock( inputBlockId );
		}
	}, [ consentType, insertBlocks, removeBlock, clientId, inputBlockId ] );

	// When consentType changes, update the label's attribute to use appropriate value and default.
	// TODO: Find a way to preserve label customizations when user toggles consent type back and forth repeatedly.
	//       Should this just be updating the defaultLabel? Do we need some other placeholder behaviour in the label block?
	const prevConsentType = usePrevious( consentType );
	useEffect( () => {
		if ( consentType !== prevConsentType ) {
			const newLabel = consentType === 'explicit' ? explicitConsentMessage : implicitConsentMessage;
			updateBlockAttributes( labelBlockId, {
				label: newLabel,
				defaultLabel: sprintf(
					/* translators: placeholder is a type of consent: implicit or explicit */
					__( 'Add %s consent message…', 'jetpack-forms' ),
					consentType
				),
			} );
		}
	}, [
		consentType,
		explicitConsentMessage,
		implicitConsentMessage,
		labelBlockId,
		prevConsentType,
		updateBlockAttributes,
	] );

	const onShareFieldAttributesChange = useCallback(
		value => setAttributes( { shareFieldAttributes: value } ),
		[ setAttributes ]
	);
	const onConsentTypeChange = useCallback(
		value => setAttributes( { consentType: value } ),
		[ setAttributes ]
	);

	return (
		<>
			<div { ...innerBlocksProps } />
			<InspectorControls>
				<PanelBody title={ __( 'Manage Responses', 'jetpack-forms' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field Settings', 'jetpack-forms' ) }>
					<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />
					<ToggleControl
						label={ __( 'Sync fields style', 'jetpack-forms' ) }
						checked={ attributes.shareFieldAttributes }
						onChange={ onShareFieldAttributesChange }
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
							onChange={ onConsentTypeChange }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>
		</>
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
