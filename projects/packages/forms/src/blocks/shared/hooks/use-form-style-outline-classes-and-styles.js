import {
	store as blockEditorStore,
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
	innerBlockName = 'jetpack/input',
	relativeTo = 'parent',
	isSynced,
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
				baseConfig?.styles?.blocks?.[ innerBlockName ],
				userConfig?.styles?.blocks?.[ innerBlockName ]
			),
		[ baseConfig?.styles?.blocks, userConfig?.styles?.blocks, innerBlockName ]
	);

	const inputBlock = useSelect(
		select => {
			const { getBlock, getBlockRootClientId /*, getBlocksByName*/ } = select( blockEditorStore );

			let parentClientId;
			if ( relativeTo === 'sibling' ) {
				// Get the parent block's clientId.
				parentClientId = getBlockRootClientId( clientId );
				if ( ! parentClientId ) {
					return [];
				}
			} else {
				parentClientId = clientId;
			}
			// Get the parent block
			const parentBlock = getBlock( parentClientId );
			if ( ! parentBlock ) {
				return [];
			}
			/*
			// Could be a path to syncing the styles with the multiple choice fields.
			if (
				isSynced &&
				( parentBlock.name === 'jetpack/field-radio' ||
					parentBlock.name === 'jetpack/field-checkbox-multiple' )
			) {
				const inputs = getBlocksByName( innerBlockName );
				if ( inputs.length === 0 ) {
					return [];
				}
				return getBlock( inputs[ 0 ] );
			}
			*/

			return parentBlock.innerBlocks.find( block => block.name === innerBlockName );
		},
		[ clientId, relativeTo, innerBlockName /*, isSynced*/ ]
	);

	return useMemo( () => {
		// Only return styles for outlined and animated forms.
		if ( formStyle !== FORM_STYLE.OUTLINED && formStyle !== FORM_STYLE.ANIMATED ) {
			return null;
		}
		// Access the input block's attributes.
		const blockBorderClassesAndStyles = getBorderClassesAndStyles( inputBlock?.attributes ?? {} );
		const globalBorderClassesAndStyles = getBorderClassesAndStyles( {
			style: mergedGlobalBlockStyles?.[ innerBlockName ],
		} );

		// Notched HTML only needs the background color and associated classes.
		const attributesWithBackgroundColor = inputBlock?.attributes
			? {
					backgroundColor: inputBlock?.attributes?.backgroundColor,
					style: {
						color: {
							background: inputBlock?.attributes?.style?.color?.background,
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
			},
		};
	}, [ inputBlock?.attributes, mergedGlobalBlockStyles, innerBlockName, formStyle ] );
}
