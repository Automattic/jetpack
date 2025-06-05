import { RichText, store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes';
import { ALLOWED_FORMATS } from '../shared/util/constants';
import useEnter from './use-enter';

const SYNCED_ATTRIBUTE_KEYS = [ 'textColor', 'fontFamily', 'fontSize', 'style' ];

const getLabelOrFallback = ( label, placeholder ) => {
	if ( label === '' ) {
		return placeholder;
	}

	return label ?? placeholder;
};

const OptionEdit = ( { attributes, clientId, context, name, setAttributes } ) => {
	const {
		'jetpack/field-default-value': defaultValue,
		'jetpack/field-options-type': type = 'checkbox',
		'jetpack/field-required': required,
		'jetpack/field-share-attributes': isSynced,
	} = context;
	const { hideInput, label, isStandalone, requiredText, placeholder } = attributes;

	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );

	const { removeBlock } = useDispatch( blockEditorStore );
	const siblingsCount = useSelect(
		select => {
			const { getBlockCount, getBlockRootClientId } = select( blockEditorStore );
			return getBlockCount( getBlockRootClientId( clientId ) );
		},
		[ clientId ]
	);

	const onRemove = () => {
		if ( siblingsCount <= 1 ) {
			return;
		}

		removeBlock( clientId );
	};

	const blockProps = useBlockProps( {
		className: `jetpack-field-option field-option-${ type }`,
	} );

	const useEnterRef = useEnter( { content: label, clientId, isStandalone } );
	const useEnterRequiredRef = useEnter( { content: label, clientId, isStandalone } );

	const isPreviewMode = useSelect( select => {
		return select( blockEditorStore ).getSettings().isPreviewMode;
	}, [] );
	const placeholderValue = placeholder !== '' ? placeholder : __( 'Add option…', 'jetpack-forms' );
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
						disabled
						type={ type }
					/>
				) }
				<div className="jetpack-field-option__label-wrapper">
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
		<li { ...blockProps }>
			<input type={ type } className="jetpack-option__type" tabIndex="-1" />
			<RichText
				ref={ useEnterRef }
				identifier="label"
				tagName="div"
				className="wp-block"
				value={ labelValue }
				placeholder={ __( 'Add option…', 'jetpack-forms' ) }
				__unstableDisableFormats
				onChange={ newLabel => setAttributes( { label: newLabel } ) }
				onRemove={ onRemove }
			/>
		</li>
	);
};

export default OptionEdit;
