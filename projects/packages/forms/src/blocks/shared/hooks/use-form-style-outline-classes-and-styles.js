import {
	store as blockEditorStore,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	getTypographyClassesAndStyles,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import deepmerge from 'deepmerge';
import { isPlainObject, isNumber } from 'lodash';
// TODO probably an overkill.
function mergeBaseAndUserConfigs( base, user ) {
	if ( ! base || ! user ) {
		return null;
	}
	return deepmerge( base, user, {
		/*
		 * We only pass as arrays the presets,
		 * in which case we want the new array of values
		 * to override the old array (no merging).
		 */
		isMergeableObject: isPlainObject,
	} );
}

/**
 * Returns the value of the CSS var if it is a number, otherwise null.
 * Match behaviour in projects/packages/forms/src/blocks/shared/hooks/use-jetpack-field-styles.js.
 *
 * @param {*} value - A value from the legacy form block attributes.
 * @return {string|*} The value of the CSS var if it is a number, otherwise the value itself.
 */
function getCSSVarValue( value ) {
	if ( typeof value !== 'undefined' && isNumber( value ) ) {
		return `${ value }px`;
	}
	return value;
}

export default function useFormStyleOutlineClassesAndStyles( clientId, innerBlockName ) {
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
		() => mergeBaseAndUserConfigs( baseConfig?.styles?.blocks, userConfig?.styles?.blocks ),
		[ baseConfig?.styles?.blocks, userConfig?.styles?.blocks ]
	);

	const inputBlock = useSelect(
		select => {
			const { getBlock, getBlockRootClientId } = select( blockEditorStore );

			// Get the parent block's clientId
			const parentClientId = getBlockRootClientId( clientId );
			if ( ! parentClientId ) return [];

			// Get the parent block
			const parentBlock = getBlock( parentClientId );
			if ( ! parentBlock ) return [];

			return parentBlock.innerBlocks.find( block => block.name === innerBlockName );
		},
		[ clientId, innerBlockName ]
	);

	// Access the input block's attributes.
	const blockBorderClassesAndStyles = getBorderClassesAndStyles( inputBlock?.attributes ?? {} );
	const globalBorderClassesAndStyles = getBorderClassesAndStyles( {
		style: mergedGlobalBlockStyles?.[ innerBlockName ],
	} );

	const blockColorClassesAndStyles = getColorClassesAndStyles( inputBlock?.attributes ?? {} );
	const blockTypographyClassesAndStyles = getTypographyClassesAndStyles(
		inputBlock?.attributes ?? {}
	);

	return {
		border: {
			className:
				blockBorderClassesAndStyles?.className +
				' ' +
				blockColorClassesAndStyles?.className +
				' ' +
				blockTypographyClassesAndStyles?.className,
			style: {
				...blockBorderClassesAndStyles?.style,
				...blockColorClassesAndStyles?.style,
				...blockTypographyClassesAndStyles?.style,
			},
			cssVars: {
				// Sets the value of top: calc(var(--jetpack--contact-form--border-size) * -1) for .notched-label__label.
				'--jetpack--contact-form--border-size':
					getCSSVarValue( blockBorderClassesAndStyles?.style?.borderWidth ) ||
					blockBorderClassesAndStyles?.style?.borderTopWidth ||
					globalBorderClassesAndStyles?.style?.borderWidth ||
					globalBorderClassesAndStyles?.style?.borderTopWidth,
				// Sets the value of --notch-width: max(var(--jetpack--contact-form--input-padding-left, 16px), var(--jetpack--contact-form--border-radius)); for .notched-label.
				'--jetpack--contact-form--border-radius':
					getCSSVarValue( blockBorderClassesAndStyles?.style?.borderRadius ) ||
					blockBorderClassesAndStyles?.style?.borderLeftRadius ||
					globalBorderClassesAndStyles?.style?.borderRadius ||
					globalBorderClassesAndStyles?.style?.borderLeftRadius,
			},
		},
	};
}
