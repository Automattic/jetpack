import {
	InspectorControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { ToggleControl, PanelBody, VisuallyHidden } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes.js';
import { ALLOWED_FORMATS } from '../shared/util/constants.js';
import useEnter from './use-enter.js';

const SYNCED_ATTRIBUTE_KEYS = [ 'textColor', 'fontFamily', 'fontSize', 'style' ];

const noop = () => undefined;

const getLabelOrFallback = ( label, placeholder ) => {
	if ( label === '' ) {
		return placeholder;
	}

	return label ?? placeholder;
};

const OptionEdit = ( {
	attributes,
	clientId,
	context,
	isSelected,
	mergeBlocks,
	name,
	setAttributes,
} ) => {
	const {
		'jetpack/field-default-value': defaultValue,
		'jetpack/field-options-type': type = 'checkbox',
		'jetpack/field-required': required,
		'jetpack/field-share-attributes': isSynced,
	} = context;
	const { hideInput, label, isStandalone, requiredText, placeholder, isOther, otherPlaceholder } =
		attributes;

	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );

	const { removeBlock } = useDispatch( blockEditorStore );
	const siblingsCount = useSelect(
		select => {
			const { getBlockCount, getBlockRootClientId } = select( blockEditorStore );
			return getBlockCount( getBlockRootClientId( clientId ) );
		},
		[ clientId ]
	);

	const isParentSelected = useSelect(
		select => {
			const { getBlockRootClientId, getSelectedBlockClientId } = select( blockEditorStore );
			const parentClientId = getBlockRootClientId( clientId );
			if ( ! parentClientId ) {
				return false;
			}
			const selectedBlockClientId = getSelectedBlockClientId();
			return selectedBlockClientId === parentClientId;
		},
		[ clientId ]
	);

	const onRemove = () => {
		if ( siblingsCount <= 1 ) {
			return;
		}

		removeBlock( clientId );
	};

	const [ isFocusedOtherPlaceholder, setIsFocusedOtherPlaceholder ] = useState( false );

	const blockProps = useBlockProps( {
		className: `jetpack-field-option field-option-${ type }`,
	} );

	const useEnterRef = useEnter( { content: label, clientId, isStandalone } );
	const useEnterRequiredRef = useEnter( { content: label, clientId, isStandalone } );

	const isPreviewMode = useSelect( select => {
		return select( blockEditorStore ).getSettings().isPreviewMode;
	}, [] );
	const otherLabel = __( 'Other', 'jetpack-forms' );
	const addOptionLabel = __( 'Add option…', 'jetpack-forms' );
	const emptyPlaceholder = isOther ? otherLabel : addOptionLabel;
	const placeholderValue = placeholder !== '' ? placeholder : emptyPlaceholder;

	// The label value to use for the RichText field must manually fall back to the
	// placeholder to be rendered in previews.
	const labelValue = isPreviewMode ? getLabelOrFallback( label, placeholderValue ) : label;

	// Some fields such as Checkbox or Consent, do not have a list of options.
	// Additionally, a checkbox field may also be flagged as required so we need
	// to allow for custom required text.
	if ( isStandalone ) {
		return (
			<div { ...blockProps }>
				{ ! hideInput && (
					<input
						className="jetpack-field-option__checkbox"
						checked={ !! defaultValue }
						onChange={ noop }
						type={ type }
					/>
				) }

				<div className={ clsx( 'jetpack-field-option__label-wrapper', { 'is-other': isOther } ) }>
					<RichText
						ref={ useEnterRef }
						identifier="label"
						tagName="div"
						className="wp-block"
						value={ labelValue }
						placeholder={ placeholderValue }
						__unstableDisableFormats
						onChange={ newLabel => setAttributes( { label: newLabel } ) }
						onRemove={ onRemove }
					/>

					{ required && (
						<RichText
							ref={ useEnterRequiredRef }
							allowedFormats={ ALLOWED_FORMATS }
							className="required"
							onChange={ value => setAttributes( { requiredText: value } ) }
							tagName="span"
							value={ requiredText || __( '(required)', 'jetpack-forms' ) }
							withoutInteractiveFormatting
						/>
					) }
				</div>
			</div>
		);
	}

	return (
		<>
			{ type === 'radio' && (
				<InspectorControls>
					<PanelBody
						title={ __( 'Settings', 'jetpack-forms' ) }
						className="jetpack-contact-form__panel"
					>
						<ToggleControl
							label={ __( '"Other" option', 'jetpack-forms' ) }
							checked={ !! isOther }
							onChange={ value =>
								setAttributes( {
									isOther: value,
									label: value ? '' : label,
								} )
							}
							help={ __(
								'Show as "Other" option with a text input field below it.',
								'jetpack-forms'
							) }
							__nextHasNoMarginBottom={ true }
						/>
					</PanelBody>
				</InspectorControls>
			) }
			<li { ...blockProps }>
				<input type={ type } className="jetpack-option__type" tabIndex="-1" />
				<RichText
					ref={ useEnterRef }
					identifier="label"
					tagName="div"
					className="wp-block"
					value={ labelValue }
					placeholder={ placeholderValue }
					__unstableDisableFormats
					onChange={ newLabel => setAttributes( { label: newLabel } ) }
					onMerge={ mergeBlocks }
					onRemove={ onRemove }
				/>
			</li>
			{ type === 'radio' && isOther && ( isSelected || isParentSelected ) && (
				<li className="jetpack-other-text-input-wrapper is-visible">
					<VisuallyHidden as="label" htmlFor={ `${ clientId }-other-text` }>
						{ otherPlaceholder || __( 'Please specify…', 'jetpack-forms' ) }
					</VisuallyHidden>
					<input
						id={ `${ clientId }-other-text` }
						className="grunion-field jetpack-field__input"
						onChange={ event => setAttributes( { otherPlaceholder: event.target.value } ) }
						onFocus={ () => setIsFocusedOtherPlaceholder( true ) }
						onBlur={ () => setIsFocusedOtherPlaceholder( false ) }
						type="text"
						value={ isFocusedOtherPlaceholder ? otherPlaceholder : '' }
						placeholder={ otherPlaceholder }
					/>
				</li>
			) }
		</>
	);
};

export default OptionEdit;
