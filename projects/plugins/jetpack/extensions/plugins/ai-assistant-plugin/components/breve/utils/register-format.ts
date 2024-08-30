/**
 * External dependencies
 */
import { getBlockContent } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import { registerFormatType, removeFormat, RichTextValue } from '@wordpress/rich-text';
import md5 from 'crypto-js/md5';
/**
 * Internal dependencies
 */
import features from '../features';
import registerEvents from '../features/events';
import highlight from '../highlight/highlight';
import {
	getBreveAvailability,
	canWriteBriefBeEnabled,
	canWriteBriefFeatureBeEnabled,
} from '../utils/get-availability';
/**
 * Types
 */
import type { BreveDispatch, BreveFeature, BreveSelect } from '../types';
import type { Block } from '@automattic/jetpack-ai-client';
import type { WPFormat } from '@wordpress/rich-text/build-types/register-format-type';
import type { RichTextFormatList } from '@wordpress/rich-text/build-types/types';

type CoreBlockEditorSelect = {
	getBlock: ( clientId: string ) => Block;
};

export function getFormatName( featureName: string ) {
	return `jetpack/ai-proofread-${ featureName }`;
}

export function registerBreveHighlight( feature: BreveFeature ) {
	if ( ! feature ) {
		return;
	}

	const { highlight: featureHighlight, config } = feature;
	const { name, ...configSettings } = config;
	const formatName = getFormatName( name );

	const settings = {
		name: formatName,
		interactive: false,

		edit: () => {},
		...configSettings,

		__experimentalGetPropsForEditableTreePreparation( _select, { blockClientId } ) {
			const {
				getIgnoredSuggestions,
				isFeatureEnabled,
				isProofreadEnabled,
				isFeatureDictionaryLoading,
				getReloadFlag,
			} = select( 'jetpack/ai-breve' ) as BreveSelect;

			const canBeEnabled = canWriteBriefBeEnabled();
			const canFeatureBeEnabled = canWriteBriefFeatureBeEnabled( config.name );

			return {
				isProofreadEnabled: canBeEnabled && isProofreadEnabled() && getBreveAvailability(),
				isFeatureEnabled: canFeatureBeEnabled && isFeatureEnabled( config.name ),
				ignored: getIgnoredSuggestions( { blockId: blockClientId } ),
				isFeatureDictionaryLoading: isFeatureDictionaryLoading( config.name ),
				reloadFlag: getReloadFlag(), // Used to force a reload of the highlights
			};
		},

		__experimentalCreatePrepareEditableTree(
			{ isProofreadEnabled, isFeatureEnabled, ignored, isFeatureDictionaryLoading },
			{ blockClientId, richTextIdentifier }
		) {
			return ( formats: Array< RichTextFormatList >, text: string ) => {
				const { getBlock } = select( 'core/block-editor' ) as CoreBlockEditorSelect;
				const { getBlockMd5 } = select( 'jetpack/ai-breve' ) as BreveSelect;
				const { invalidateSuggestions, setBlockMd5 } = dispatch(
					'jetpack/ai-breve'
				) as BreveDispatch;

				const record = { formats, text } as RichTextValue;
				const type = formatName;

				// Ignored suggestions
				let ignoredList = ignored;

				// Has to be defined here, as adding it to __experimentalGetPropsForEditableTreePreparation
				// causes an issue with the block inserter. ref p1721746774569699-slack-C054LN8RNVA
				const currentMd5 = getBlockMd5( blockClientId );

				if ( text && isProofreadEnabled && isFeatureEnabled && ! isFeatureDictionaryLoading ) {
					const block = getBlock( blockClientId );
					// Only use block content for complex blocks like tables
					const blockContent = richTextIdentifier === 'content' ? text : getBlockContent( block );
					const textMd5 = md5( blockContent ).toString();

					if ( currentMd5 !== textMd5 ) {
						ignoredList = [];
						invalidateSuggestions( blockClientId );
						setBlockMd5( blockClientId, textMd5 );
					}

					const highlights = featureHighlight( text );
					const applied = highlight( {
						ignored: ignoredList,
						content: record,
						type,
						indexes: highlights,
						attributes: {
							'data-breve-type': config.name,
							'data-identifier': richTextIdentifier ?? 'none',
							'data-block': blockClientId,
						},
					} );

					setTimeout( () => {
						registerEvents( blockClientId );
					}, 100 );

					return applied.formats;
				}

				return removeFormat( record, type, 0, record.text.length ).formats;
			};
		},
	} as WPFormat;

	registerFormatType( formatName, settings );
}

export function registerBreveHighlights() {
	features.forEach( feature => {
		registerBreveHighlight( feature );
	} );
}
