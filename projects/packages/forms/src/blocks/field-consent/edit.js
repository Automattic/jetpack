import {
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { BaseControl, PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import JetpackManageResponsesSettings from '../contact-form/components/jetpack-manage-responses-settings';
import JetpackFieldWidth from '../shared/components/jetpack-field-width';
import useFormWrapper from '../shared/hooks/use-form-wrapper';

export default function ConsentFieldEdit( props ) {
	const { attributes, clientId, setAttributes } = props;
	const { consentType, width, implicitConsentMessage, explicitConsentMessage } = attributes;

	useFormWrapper( props );

	const blockProps = useBlockProps( {
		className: 'jetpack-field jetpack-field-consent',
	} );

	// Memoized default label values from the block type definition.
	const defaultLabels = useMemo( () => {
		const consentBlockType = getBlockType( 'jetpack/consent' );
		const defaultAttributes = consentBlockType?.attributes || {};

		return {
			implicit: defaultAttributes.implicitConsentMessage?.default || '',
			explicit: defaultAttributes.explicitConsentMessage?.default || '',
		};
	}, [] );

	// Template is only used on initial block insertion.
	const template = useMemo(
		() => [
			[
				'jetpack/option',
				{
					label: implicitConsentMessage,
					placeholder: sprintf(
						/* translators: placeholder is a type of consent: implicit or explicit */
						__( 'Add %s consent message…', 'jetpack-forms' ),
						'implicit'
					),
					isStandalone: true,
					hideInput: true,
				},
			],
		],
		[ implicitConsentMessage ]
	);

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/option' ],
		template,
		templateLock: 'all',
	} );

	const optionBlock = useSelect(
		select => select( blockEditorStore ).getBlocks( clientId )[ 0 ],
		[ clientId ]
	);
	const { clientId: optionBlockId } = optionBlock ?? {};

	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const prevConsentType = usePrevious( consentType );
	const prevLabel = usePrevious( optionBlock?.attributes?.label );

	// Update the inner option block when the consentType changes.
	useEffect( () => {
		if ( optionBlockId && consentType !== prevConsentType ) {
			const label = consentType === 'explicit' ? explicitConsentMessage : implicitConsentMessage;

			// As this is an automated update, ensure it doesn't end up in the undo stack
			// by calling `__unstableMarkNextChangeAsNotPersistent`.
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( optionBlockId, {
				label,
				placeholder: sprintf(
					/* translators: placeholder is a type of consent: implicit or explicit */
					__( 'Add %s consent message…', 'jetpack-forms' ),
					consentType
				),
				hideInput: consentType !== 'explicit',
			} );
		}
	}, [
		optionBlockId,
		consentType,
		prevConsentType,
		explicitConsentMessage,
		implicitConsentMessage,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	// Persist user-edited labels to the correct parent attribute.
	useEffect( () => {
		if ( ! optionBlock?.attributes?.label || consentType !== prevConsentType ) {
			return;
		}

		const currentLabel = optionBlock.attributes.label;
		const defaultLabel = defaultLabels[ consentType ];

		const isNewlyTyped = prevLabel && currentLabel !== prevLabel && currentLabel !== defaultLabel;

		if ( isNewlyTyped ) {
			// As this is an automated update, ensure it doesn't end up in the undo stack
			// by calling `__unstableMarkNextChangeAsNotPersistent`.
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				[ consentType === 'explicit' ? 'explicitConsentMessage' : 'implicitConsentMessage' ]:
					currentLabel,
			} );
		}
	}, [
		optionBlock?.attributes?.label,
		prevLabel,
		consentType,
		prevConsentType,
		defaultLabels,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	const onShareFieldAttributesChange = useCallback(
		value => {
			setAttributes( { shareFieldAttributes: value } );
		},
		[ setAttributes ]
	);

	const onConsentTypeChange = useCallback(
		value => {
			setAttributes( { consentType: value } );
		},
		[ setAttributes ]
	);

	return (
		<>
			<div { ...innerBlocksProps } />
			<InspectorControls>
				<PanelBody title={ __( 'Manage responses', 'jetpack-forms' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field settings', 'jetpack-forms' ) }>
					<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />
					<ToggleControl
						label={ __( 'Sync fields style', 'jetpack-forms' ) }
						checked={ attributes.shareFieldAttributes }
						onChange={ onShareFieldAttributesChange }
						help={ __( 'Deactivate for individual styling of this block', 'jetpack-forms' ) }
						__nextHasNoMarginBottom
					/>
				</PanelBody>
				<PanelBody title={ __( 'Consent settings', 'jetpack-forms' ) }>
					<BaseControl __nextHasNoMarginBottom>
						<SelectControl
							label={ __( 'Permission to email', 'jetpack-forms' ) }
							value={ consentType }
							options={ [
								{
									label: __( 'Mention that you can email', 'jetpack-forms' ),
									value: 'implicit',
								},
								{
									label: __( 'Add a privacy checkbox', 'jetpack-forms' ),
									value: 'explicit',
								},
							] }
							onChange={ onConsentTypeChange }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
