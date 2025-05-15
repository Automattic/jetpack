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

function getBorderRadius( style ) {
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

	const mergedGlobalBlockStyles = useMemo(
		() =>
			merge(
				baseConfig?.styles?.blocks?.[ inputBlockName ],
				userConfig?.styles?.blocks?.[ inputBlockName ]
			),
		[ baseConfig?.styles?.blocks, userConfig?.styles?.blocks, inputBlockName ]
	);

	return useMemo( () => {
		// Only return styles for outlined and animated forms.
		if ( formStyle !== FORM_STYLE.OUTLINED && formStyle !== FORM_STYLE.ANIMATED ) {
			return null;
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
		]
			.filter( Boolean )
			.join( ' ' );

		let styleSpecificCssVars = {};

		if ( formStyle === FORM_STYLE.OUTLINED ) {
			styleSpecificCssVars = {
				// Set a max-width for the notch (using `min()`) to prevent it from getting too wide.
				// Users can set very high values for border radius, but css has built-in capping of the radius,
				// there's no equivalent way to do this for the width, so we choose an arbitrary value.
				//
				// To determine the actual max, we'd need to know the height of the input and divide by 2
				// to get the max border radius. Perhaps it can be a future improvement!
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
					getBorderRadius( blockBorderClassesAndStyles.style ) ||
					getBorderRadius( globalBorderClassesAndStyles.style ),
				...styleSpecificCssVars,
			},
		};
	}, [ inputBlockAttributes, mergedGlobalBlockStyles, formStyle ] );
}
