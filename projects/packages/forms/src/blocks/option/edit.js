import {
	RichText,
	store as blockEditorStore,
	useBlockProps,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
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

const OptionEdit = ( { attributes, clientId, context, name, setAttributes, mergeBlocks } ) => {
	const {
		'jetpack/field-default-value': defaultValue,
		'jetpack/field-options-type': type = 'checkbox',
		'jetpack/field-required': required,
		'jetpack/field-share-attributes': isSynced,
	} = context;
	const { hideInput, label, isStandalone, requiredText, placeholder, isOther } = attributes;

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
	const emptyPlaceholder = isOther
		? __( 'Other', 'jetpack-forms' )
		: __( 'Add option…', 'jetpack-forms' );
	const placeholderValue = placeholder !== '' ? placeholder : emptyPlaceholder;

	// The label value to use for the RichText field must manually fall back to the
	// placeholder to be rendered in previews.
	const labelValue = isPreviewMode ? getLabelOrFallback( label, placeholderValue ) : label;

	// Some fields such as Checkbox or Consent, do not have a list of options.
	// Additionally, a checkbox field may also be flagged as required so we need
	// to allow for custom required text.
	if ( isStandalone ) {
		return (
			<>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							onClick={ () => setAttributes( { isOther: ! isOther } ) }
							className={ clsx( { 'is-pressed': isOther } ) }
						>
							{ __( 'Other', 'jetpack-forms' ) }
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>
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
			</>
		);
	}

	return (
		<li { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						onClick={ () => setAttributes( { isOther: ! isOther } ) }
						className={ isOther ? 'is-pressed' : undefined }
					>
						{ __( 'Other', 'jetpack-forms' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<input type={ type } className="jetpack-option__type" tabIndex="-1" />
			<RichText
				ref={ useEnterRef }
				identifier="label"
				tagName="div"
				className="wp-block"
				onMerge={ mergeBlocks }
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
