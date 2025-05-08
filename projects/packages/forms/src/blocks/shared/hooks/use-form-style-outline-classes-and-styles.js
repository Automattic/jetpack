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

export default function useFormStyleOutlineClassesAndStyles( {
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
			style: mergedGlobalBlockStyles?.[ inputBlockName ],
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
				'--jetpack--contact-form--notch-width':
					'max(var(--jetpack--contact-form--input-padding-left, 16px), var(--jetpack--contact-form--border-radius))',
			};
		}
		if ( formStyle === FORM_STYLE.ANIMATED ) {
			styleSpecificCssVars = {
				'--jetpack--contact-form--left-offset':
					'calc(var(--jetpack--contact-form--input-padding-left, 16px) + var(--jetpack--contact-form--border-size))',
				'--jetpack--contact-form--label-left':
					'max(var(--jetpack--contact-form--left-offset), var(--jetpack--contact-form--border-radius))',
				'--jetpack--contact-form--field-padding':
					'calc(var(--jetpack--contact-form--label-left) - var(--jetpack--contact-form--border-size))',
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
					getIntAsPxValue( blockBorderClassesAndStyles?.style?.borderRadius ) ||
					blockBorderClassesAndStyles?.style?.borderLeftRadius ||
					globalBorderClassesAndStyles?.style?.borderRadius ||
					globalBorderClassesAndStyles?.style?.borderLeftRadius,
				...styleSpecificCssVars,
			},
		};
	}, [ inputBlockAttributes, mergedGlobalBlockStyles, inputBlockName, formStyle ] );
}
