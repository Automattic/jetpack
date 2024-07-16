/**
 * Internal dependencies
 */
import { getBlockContent } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import features from '../features/index.js';

// Map of types to the corresponding AI Assistant request type.
const requestTypeMap = {
	'complex-words': 'breve-phrase',
	// TODO: Return as soon start to support these features
	// 'ambiguous-words': 'breve-weasel',
	// 'long-sentence': 'breve-long-sentence',
	// adverb: 'breve-adverb',
	// adjective: 'breve-adjective',
};

export const getRequestMessages = ( { feature, target, sentence, blockId } ) => {
	const block = select( 'core/block-editor' ).getBlock( blockId );
	const html = getBlockContent( block );
	const dictionary = features?.find?.( ftr => ftr.config.name === feature )?.dictionary || {};
	const replacement = dictionary[ target.toLowerCase() ] || null;

	return [
		{
			role: 'jetpack-ai' as const,
			context: {
				type: requestTypeMap[ feature ],
				target,
				sentence,
				html,
				replacement,
			},
		},
	];
};
