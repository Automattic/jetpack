import {
	store as blockEditorStore,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles, // eslint-disable-line @wordpress/no-unsafe-wp-apis
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

function getCSSVarValue( value ) {
	if ( isNumber( value ) ) {
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

	// Access the input block's attributes
	const blockClassesAndStyles = getBorderClassesAndStyles( inputBlock?.attributes ?? {} );
	const globalClassesAndStyles = getBorderClassesAndStyles( {
		style: mergedGlobalBlockStyles?.[ innerBlockName ],
	} );

	return {
		border: {
			className: blockClassesAndStyles?.className,
			style: blockClassesAndStyles?.style,
			cssVars: {
				// Sets the value of top: calc(var(--jetpack--contact-form--border-size) * -1) for .notched-label__label.
				'--jetpack--contact-form--border-size':
					getCSSVarValue( blockClassesAndStyles?.style?.borderWidth ) ||
					blockClassesAndStyles?.style?.borderTopWidth ||
					globalClassesAndStyles?.style?.borderWidth ||
					globalClassesAndStyles?.style?.borderTopWidth,
				// Sets the value of --notch-width: max(var(--jetpack--contact-form--input-padding-left, 16px), var(--jetpack--contact-form--border-radius)); for .notched-label.
				'--jetpack--contact-form--border-radius':
					getCSSVarValue( blockClassesAndStyles?.style?.borderRadius ) ||
					blockClassesAndStyles?.style?.borderLeftRadius ||
					globalClassesAndStyles?.style?.borderRadius ||
					globalClassesAndStyles?.style?.borderLeftRadius,
			},
		},
	};
}
