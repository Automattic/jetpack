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
 * Returns the border widths for the input block.
 *
 * @param {object} blockBorderStyles  - The attributes of the input block.
 * @param {object} globalBorderStyles - The global styles.
 * @return {object} The border widths.
 */
function getBorderWidths( blockBorderStyles, globalBorderStyles ) {
	/*
	 * Use `getIntAsPxValue` on the borderWidth as legacy form blocks might not have a value unit.
	 * Sides (top, right, bottom, left) are available post-upgrade.
	 */
	const borderWidth =
		getIntAsPxValue( blockBorderStyles?.borderWidth ) || globalBorderStyles?.borderWidth;

	if ( borderWidth ) {
		return {
			borderTopWidth: borderWidth,
			borderRightWidth: borderWidth,
			borderBottomWidth: borderWidth,
			borderLeftWidth: borderWidth,
		};
	}

	const borderTopWidth = blockBorderStyles?.borderTopWidth || globalBorderStyles?.borderTopWidth;
	const borderRightWidth =
		blockBorderStyles?.borderRightWidth || globalBorderStyles?.borderRightWidth;
	const borderBottomWidth =
		blockBorderStyles?.borderBottomWidth || globalBorderStyles?.borderBottomWidth;
	const borderLeftWidth = blockBorderStyles?.borderLeftWidth || globalBorderStyles?.borderLeftWidth;

	return {
		borderTopWidth,
		borderRightWidth,
		borderBottomWidth,
		borderLeftWidth,
	};
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
			return {
				userConfig: null,
				baseConfig: null,
			};
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

	return useMemo( () => {
		// Access the input block's attributes.
		const blockBorderClassesAndStyles = getBorderClassesAndStyles( inputBlockAttributes ?? {} );
		const globalBorderClassesAndStyles = getBorderClassesAndStyles( {
			style: mergedGlobalBlockStyles,
		} );
		const borderWidths = getBorderWidths(
			blockBorderClassesAndStyles?.style,
			globalBorderClassesAndStyles?.style
		);

		// Add a class to apply padding to option groups that have a border.
		const hasBorder =
			inputBlockName === 'jetpack/options' &&
			!! borderWidths?.borderLeftWidth &&
			parseInt( borderWidths?.borderLeftWidth ) > 0;

		const customBorderClasses = hasBorder ? 'jetpack-field-multiple__list--has-border' : '';

		// Only return styles for outlined and animated forms.
		if ( formStyle !== FORM_STYLE.OUTLINED && formStyle !== FORM_STYLE.ANIMATED ) {
			return {
				className: customBorderClasses,
			};
		}

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
			styleSpecificCssVars = {
				// For the animated labels.
				'--jetpack--contact-form--animated-left-offset': '16px', // Probably can be removed or we use `--jetpack--contact-form--input-padding`
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
				// Sets the value of --notch-width: max(var(--jetpack--contact-form--input-padding-left, 16px), var(--jetpack--contact-form--border-radius)); for .notched-label.
				'--jetpack--contact-form--border-radius':
					getBorderRadiusCssVar( blockBorderClassesAndStyles.style ) ||
					getBorderRadiusCssVar( globalBorderClassesAndStyles.style ),
				'--jetpack--contact-form--border-left-size': borderWidths?.borderLeftWidth,
				'--jetpack--contact-form--border-right-size': borderWidths?.borderRightWidth,
				'--jetpack--contact-form--border-top-size': borderWidths?.borderTopWidth,
				'--jetpack--contact-form--border-bottom-size': borderWidths?.borderBottomWidth,
				...styleSpecificCssVars,
			},
		};
	}, [ inputBlockAttributes, mergedGlobalBlockStyles, formStyle, inputBlockName ] );
}
