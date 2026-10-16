import { RichText, store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { clsx } from 'clsx';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes.jsx';
import useVariationStyleProperties from '../shared/hooks/use-variation-style-properties.js';
import { ALLOWED_FORMATS, FORM_STYLE } from '../shared/util/constants.js';
import getBlockStyle from '../shared/util/get-block-style.js';

const SYNCED_ATTRIBUTE_KEYS = [
	'textColor',
	'fontFamily',
	'fontSize',
	'style',
	'requiredIndicator',
];

const getLabelOrFallback = ( label, placeholder ) => {
	if ( label === '' ) {
		return placeholder;
	}

	return label ?? placeholder;
};

const OPTIONS_FIELDS = [ 'jetpack/field-radio', 'jetpack/field-checkbox-multiple' ];

// Field blocks whose input is not a single text-like box, so an inset
// (notched/animated) label would overlap the control rather than sit in it.
// The slider's front-end counterpart is Contact_Form_Field::TYPES_WITHOUT_INSET_LABEL.
// The rating field needs no entry there: it renders its label as a legend via
// render_legend_as_label() and never reaches render_label().
const FIELDS_WITHOUT_INSET_LABEL = [ 'jetpack/field-slider', 'jetpack/field-rating' ];

// Stable reference for "no input block found", so useSelect's shallow comparison
// does not see a new object on every store change.
const NO_INPUT_BLOCK = {};

/**
 * Resolves the field block this label belongs to, and its sibling input block.
 *
 * @param {string} clientId - The label block's client ID.
 * @return {{inputBlock: Object|undefined, parentName: string|undefined}} The sibling input block and the parent field block name.
 */
function useFieldContext( clientId ) {
	return useSelect(
		select => {
			const { getBlock, getBlockRootClientId } = select( blockEditorStore );

			// Get the parent block's clientId.
			const parentClientId = getBlockRootClientId( clientId );
			if ( ! parentClientId ) {
				return { inputBlock: NO_INPUT_BLOCK, parentName: undefined };
			}
			// Get the parent block
			const parentBlock = getBlock( parentClientId );
			if ( ! parentBlock ) {
				return { inputBlock: NO_INPUT_BLOCK, parentName: undefined };
			}

			let siblingBlockType = OPTIONS_FIELDS.includes( parentBlock.name )
				? 'jetpack/options'
				: 'jetpack/input';

			// Special case for phone field, which uses a different input block.
			if ( parentBlock.name === 'jetpack/field-telephone' ) {
				siblingBlockType = 'jetpack/phone-input';
			}

			return {
				inputBlock: parentBlock.innerBlocks.find( block => block.name === siblingBlockType ),
				parentName: parentBlock.name,
			};
		},
		[ clientId ]
	);
}

const WithNotchedWrapper = ( {
	formStyle,
	styles,
	cssVars,
	className,
	children,
	forcePlainStyle = false,
} ) => {
	if ( formStyle === FORM_STYLE.OUTLINED && ! forcePlainStyle ) {
		return (
			<div className="notched-label" style={ cssVars }>
				<div className={ clsx( 'notched-label__leading', className ) } style={ styles } />
				<div className={ clsx( 'notched-label__notch', className ) } style={ styles }>
					{ children }
				</div>
				<div className={ clsx( 'notched-label__filler', className ) } style={ styles } />
				<div className={ clsx( 'notched-label__trailing', className ) } style={ styles } />
			</div>
		);
	}

	return <>{ children }</>;
};

const LabelEdit = ( { clientId, attributes, name, setAttributes, context } ) => {
	const {
		'jetpack/form-class-name': formClassName,
		'jetpack/field-required': required,
		'jetpack/field-share-attributes': isSynced,
	} = context;
	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );

	const { label, placeholder, requiredText, requiredIndicator } = attributes;
	const placeholderValue = placeholder !== '' ? placeholder : __( 'Add label…', 'jetpack-forms' );
	const formStyle = getBlockStyle( formClassName );

	const { inputBlock, parentName } = useFieldContext( clientId );

	// Neither field is a text-like input: the slider has no empty state to rest in
	// and its range input is nested inside a wrapper, and the rating field is a group
	// of radio inputs. An inset (notched/animated) label would sit on top of the
	// control instead of animating, so keep the default label.
	// 'below' renders the label outside the field, so it still applies.
	const hasInsetLabel = ! FIELDS_WITHOUT_INSET_LABEL.includes( parentName );

	const className = clsx( 'jetpack-field-label', {
		'notched-label__label': hasInsetLabel && formStyle === FORM_STYLE.OUTLINED,
		'animated-label__label': hasInsetLabel && formStyle === FORM_STYLE.ANIMATED,
		'below-label__label': formStyle === FORM_STYLE.BELOW,
	} );

	const variationProps = useVariationStyleProperties( {
		clientId,
		inputBlockName: inputBlock?.name,
		inputBlockAttributes: inputBlock?.attributes,
	} );
	const blockProps = useBlockProps( {
		className,
		style: variationProps?.cssVars,
	} );

	// Do not allow enter key to create a new line in the label if the form style is not default.
	// Animated and Outlined styles have a notched label, so we don't want to allow new lines in the label.
	const onKeyDown = useCallback(
		event => {
			if ( event.key === 'Enter' && FORM_STYLE.DEFAULT !== formStyle ) {
				event.preventDefault();
			}
		},
		[ formStyle ]
	);

	// The label value to use for the RichText field must manually fall back to the
	// placeholder to be rendered in previews.
	const isPreviewMode = useSelect( select => {
		return select( blockEditorStore ).getSettings().isPreviewMode;
	}, [] );
	const labelValue = isPreviewMode ? getLabelOrFallback( label, placeholderValue ) : label;

	return (
		<WithNotchedWrapper
			formStyle={ formStyle }
			forcePlainStyle={ ! inputBlock || ! hasInsetLabel }
			styles={ variationProps?.style }
			cssVars={ variationProps?.cssVars }
			className={ variationProps?.className }
		>
			<div { ...blockProps }>
				<RichText
					allowedFormats={ ALLOWED_FORMATS }
					className="jetpack-field-label__input"
					onChange={ value => setAttributes( { label: value } ) }
					placeholder={ placeholderValue }
					onKeyDown={ onKeyDown }
					tagName="label"
					value={ labelValue }
					withoutInteractiveFormatting
				/>
				{ required && requiredIndicator && (
					<RichText
						allowedFormats={ ALLOWED_FORMATS }
						className="required"
						onChange={ value => setAttributes( { requiredText: value } ) }
						tagName="span"
						value={ requiredText || __( '(required)', 'jetpack-forms' ) }
						withoutInteractiveFormatting
					/>
				) }
			</div>
		</WithNotchedWrapper>
	);
};

export default LabelEdit;
