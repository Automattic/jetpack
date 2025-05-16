import {
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { isNumber, merge } from 'lodash';
import { useFormStyle, FORM_STYLE } from '../../contact-form/util/form';

/**
 * Returns the value of the CSS var if it is a number, otherwise null.
 * Match behaviour in projects/packages/forms/src/blocks/shared/hooks/use-jetpack-field-styles.js.
 *
 * @param {*} value - A value from the legacy form block attributes.
 * @return {string|*} The value of the CSS var if it is a number, otherwise the value itself.
 */
function getIntAsPxValue( value ) {
	if ( typeof value !== 'undefined' && isNumber( value ) ) {
		return `${ value }px`;
	}
	return value;
}

/**
 * Returns the value of the CSS var for the border radius for outlined forms, taking into account
 * that the border radius might be a single or split value.
 *
 * @param {object} style - The style object.
 *
 * @return {string|undefined} The CSS var for the border radius.
 */
function getBorderRadiusCssVar( style ) {
	// A single border radius value for all for corners, this is quicker to check, so it goes first.
	if ( style?.borderRadius ) {
		return getIntAsPxValue( style?.borderRadius );
	}
	// If corner radii are set on the top-left or bottom-left of the block, take the maximum of the two.
	// We check the left side due to writing direction—this variable is used to offset text.
	// TODO: this should factor in RTL languages.
	if ( style?.borderTopLeftRadius || style?.borderBottomLeftRadius ) {
		return `max( ${ style?.borderTopLeftRadius ?? 0 }, ${ style?.borderBottomLeftRadius ?? 0 } )`;
	}
}

/**
 * Returns properties that help achieve the outlined and animated form styles.
 *
 * The outlined style in particular requires taking specific style properties (especially border and background)
 * that the user can configure on the input or options block, and applying them to the label. The label displays
 * the border rather than the input/options blocks. It requires some smoke and mirrors!
 *
 * The animated style requires the border size to calculate how much the label should be offset to give the
 * appearance that it's within the input.
 *
 * This hook first resolves the global styles for the input or options block that the label is the sibling of
 * and merges them with that block's own styles to get the final resolved style values.
 *
 * It uses WordPress core functions to get the generated classnames for those styles, and also calculates
 * some CSS Vars that are used to achieve the style variations.
 *
 * @param {object} props                      - Properties to pass to the hook.
 * @param {string} props.clientId             - The client ID of the block.
 * @param {string} props.inputBlockName       - The name of the input or options block.
 * @param {object} props.inputBlockAttributes - The attributes of the input or options block.
 * @return {object} The calculated properties that help achieve the outlined and animated form styles.
 */
export default function useVariationStyleProperties( {
	clientId,
	inputBlockName,
	inputBlockAttributes,
} ) {
	const formStyle = useFormStyle( clientId );
	const { userConfig, baseConfig } = useSelect( select => {
		const {
			__experimentalGetCurrentGlobalStylesId,
			getEditedEntityRecord,
			__experimentalGetCurrentThemeBaseGlobalStyles,
		} = select( coreStore );
		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		if ( ! globalStylesId ) {
			return null;
		}

		return {
			userConfig: getEditedEntityRecord( 'root', 'globalStyles', globalStylesId ),
			baseConfig: __experimentalGetCurrentThemeBaseGlobalStyles(),
		};
	}, [] );

	const inputBaseGlobalStyles = baseConfig?.styles?.blocks?.[ inputBlockName ];
	const inputUserGlobalStyles = userConfig?.styles?.blocks?.[ inputBlockName ];
	const mergedGlobalBlockStyles = useMemo(
		() => merge( inputBaseGlobalStyles, inputUserGlobalStyles ),
		[ inputBaseGlobalStyles, inputUserGlobalStyles ]
	);

	// Add a class to apply padding to option groups that have a border.
	const customBorderClasses = useMemo( () => {
		const hasBorder =
			inputBlockName === 'jetpack/options' &&
			( !! inputBlockAttributes?.style?.border?.width ||
				!! inputBlockAttributes?.style?.border?.left?.width ||
				!! mergedGlobalBlockStyles?.border?.width ||
				!! mergedGlobalBlockStyles?.border?.left?.width );
		return hasBorder ? 'jetpack-field-multiple__list--has-border' : '';
	}, [ inputBlockName, inputBlockAttributes, mergedGlobalBlockStyles ] );

	return useMemo( () => {
		// Only return styles for outlined and animated forms.
		if ( formStyle !== FORM_STYLE.OUTLINED && formStyle !== FORM_STYLE.ANIMATED ) {
			return {
				className: customBorderClasses,
			};
		}
		// Access the input block's attributes.
		const blockBorderClassesAndStyles = getBorderClassesAndStyles( inputBlockAttributes ?? {} );
		const globalBorderClassesAndStyles = getBorderClassesAndStyles( {
			style: mergedGlobalBlockStyles,
		} );

		// Notched HTML only needs the background color and associated classes.
		const attributesWithBackgroundColor = inputBlockAttributes
			? {
					backgroundColor: inputBlockAttributes?.backgroundColor,
					style: {
						color: {
							background: inputBlockAttributes?.style?.color?.background,
						},
					},
			  }
			: {};
		const blockColorClassesAndStyles = getColorClassesAndStyles( attributesWithBackgroundColor );

		/**
		 * Remove undefined classname values.
		 */
		const filteredBlockColorClassesAndStyles = [
			blockBorderClassesAndStyles?.className,
			blockColorClassesAndStyles?.className,
			customBorderClasses,
		]
			.filter( Boolean )
			.join( ' ' );

		let styleSpecificCssVars = {};

		if ( formStyle === FORM_STYLE.OUTLINED ) {
			styleSpecificCssVars = {
				'--jetpack--contact-form--notch-width':
					'max(var(--jetpack--contact-form--input-padding-left, 16px), var(--jetpack--contact-form--border-radius))',
			};
		}
		if ( formStyle === FORM_STYLE.ANIMATED ) {
			const borderLeftSize =
				getIntAsPxValue( blockBorderClassesAndStyles?.style?.borderWidth ) ||
				blockBorderClassesAndStyles?.style?.borderLeftWidth ||
				globalBorderClassesAndStyles?.style?.borderWidth ||
				globalBorderClassesAndStyles?.style?.borderLeftWidth ||
				'1px';
			styleSpecificCssVars = {
				'--jetpack--contact-form--left-offset': `calc(var(--jetpack--contact-form--input-padding-left, 16px) + ${ borderLeftSize })`,
				'--jetpack--contact-form--label-left':
					'max(var(--jetpack--contact-form--left-offset), var(--jetpack--contact-form--border-radius))',
				'--jetpack--contact-form--field-padding': `calc(var(--jetpack--contact-form--label-left) - ${ borderLeftSize })`,
			};
		}

		return {
			className: filteredBlockColorClassesAndStyles,
			style: {
				...blockBorderClassesAndStyles?.style,
				// Only background here.
				backgroundColor: blockColorClassesAndStyles?.style?.backgroundColor,
			},
			cssVars: {
				// Sets the value of top: calc(var(--jetpack--contact-form--border-size) * -1) for .notched-label__label.
				'--jetpack--contact-form--border-size':
					getIntAsPxValue( blockBorderClassesAndStyles?.style?.borderWidth ) ||
					blockBorderClassesAndStyles?.style?.borderTopWidth ||
					globalBorderClassesAndStyles?.style?.borderWidth ||
					globalBorderClassesAndStyles?.style?.borderTopWidth,
				// Sets the value of --notch-width: max(var(--jetpack--contact-form--input-padding-left, 16px), var(--jetpack--contact-form--border-radius)); for .notched-label.
				'--jetpack--contact-form--border-radius':
					getBorderRadiusCssVar( blockBorderClassesAndStyles.style ) ||
					getBorderRadiusCssVar( globalBorderClassesAndStyles.style ),
				...styleSpecificCssVars,
			},
		};
	}, [ inputBlockAttributes, mergedGlobalBlockStyles, formStyle, customBorderClasses ] );
}
