/**
 * Internal dependencies
 */
import { select } from '@wordpress/data';
import features from '../features/index.js';

// Map of types to the corresponding AI Assistant request type.
const requestTypeMap = {
	'complex-words': 'breve-phrase',
	'ambiguous-words': 'breve-weasel',
	// TODO: Return as soon start to support these features
	// 'long-sentence': 'breve-long-sentence',
	// adverb: 'breve-adverb',
	// adjective: 'breve-adjective',
};

export const getRequestMessages = ( { feature, sentence, blockId } ) => {
	const block = select( 'core/block-editor' ).getBlock( blockId );
	const html = block?.originalContent;
	const dictionary = features?.find?.( ftr => ftr.config.name === feature )?.dictionary || {};
	const replacement = dictionary[ sentence.toLowerCase() ] || null;

	return [
		{
			role: 'jetpack-ai' as const,
			context: {
				type: requestTypeMap[ feature ],
				sentence,
				replacement,
				html,
			},
		},
	];
};
