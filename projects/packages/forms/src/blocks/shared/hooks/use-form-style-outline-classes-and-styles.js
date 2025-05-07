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
import { useFormStyle, FORM_STYLE } from '../../contact-form/util/form';

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

export default function useFormStyleOutlineClassesAndStyles( {
	clientId,
	innerBlockName,
	relativeTo,
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
		() => mergeBaseAndUserConfigs( baseConfig?.styles?.blocks, userConfig?.styles?.blocks ),
		[ baseConfig?.styles?.blocks, userConfig?.styles?.blocks ]
	);

	const inputBlock = useSelect(
		select => {
			const { getBlock, getBlockRootClientId } = select( blockEditorStore );
			let parentClientId;
			if ( relativeTo === 'sibling' ) {
				// Get the parent block's clientId
				parentClientId = getBlockRootClientId( clientId );
				if ( ! parentClientId ) return [];
			} else {
				parentClientId = clientId;
			}
			// Get the parent block
			const parentBlock = getBlock( parentClientId );
			if ( ! parentBlock ) return [];
			return parentBlock.innerBlocks.find( block => block.name === innerBlockName );
		},
		[ clientId, relativeTo, innerBlockName ]
	);

	// Only return styles for outlined and animated forms.
	if ( formStyle !== FORM_STYLE.OUTLINED && formStyle !== FORM_STYLE.ANIMATED ) {
		return null;
	}

	// Access the input block's attributes.
	const blockBorderClassesAndStyles = getBorderClassesAndStyles( inputBlock?.attributes ?? {} );
	const globalBorderClassesAndStyles = getBorderClassesAndStyles( {
		style: mergedGlobalBlockStyles?.[ innerBlockName ],
	} );

	const blockColorClassesAndStyles = getColorClassesAndStyles( inputBlock?.attributes ?? {} );
	const blockTypographyClassesAndStyles = getTypographyClassesAndStyles(
		inputBlock?.attributes ?? {}
	);

	const filteredBlockColorClassesAndStyles = [
		blockBorderClassesAndStyles?.className,
		blockColorClassesAndStyles?.className,
		blockTypographyClassesAndStyles?.className,
	]
		.filter( Boolean )
		.join( ' ' );

	return {
		className: filteredBlockColorClassesAndStyles,
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
	};
}
