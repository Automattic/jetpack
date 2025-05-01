import {
	store as blockEditorStore,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import deepmerge from 'deepmerge';
import { isPlainObject } from 'lodash';
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

export default function useFormStyleOutlinedStyles( clientId, innerBlockName ) {
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
		const _userConfig = getEditedEntityRecord( 'root', 'globalStyles', globalStylesId );
		const _baseConfig = __experimentalGetCurrentThemeBaseGlobalStyles();
		return {
			userConfig: _userConfig,
			baseConfig: _baseConfig,
		};
	}, [] );

	const mergedStyles = useMemo(
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

	const mergedAttributes = useMemo(
		() => ( {
			...inputBlock?.attributes,
			style: {
				...inputBlock?.attributes?.style,
				...mergedStyles?.[ innerBlockName ],
			},
		} ),
		[ innerBlockName, inputBlock?.attributes, mergedStyles ]
	);

	/*
    
    All this to correctly set the values of top: calc(var(--jetpack--contact-form--border-size) * -1) for .notched-label__label and 
        --notch-width: max(var(--jetpack--contact-form--input-padding-left, 16px), var(--jetpack--contact-form--border-radius)); for .notched-label
        :(
    
    */
	console.log( 'mergedStyles', { baseConfig, userConfig, mergedStyles, mergedAttributes } );

	// TODO merge the styles from the base config with the styles from the user config

	// Access the input block's attributes
	return getBorderClassesAndStyles( mergedAttributes ?? {} );
}
