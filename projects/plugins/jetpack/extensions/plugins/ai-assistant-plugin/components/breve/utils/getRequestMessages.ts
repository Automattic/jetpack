/**
 * Internal dependencies
 */
import features from '../features/index.js';

// Map of types to the corresponding AI Assistant request type.
const requestTypeMap = {
	'complex-words': 'breve-phrase',
	'long-sentence': 'breve-long-sentence',
	'ambiguous-words': 'breve-weasel',
	adverb: 'breve-adverb',
	adjective: 'breve-adjective',
};

export const getRequestMessages = ( { feature, sentence, paragraph } ) => {
	const dictionary = features?.find?.( ftr => ftr.config.name === feature )?.dictionary || {};
	const replacement = dictionary[ sentence.toLowerCase() ] || null;

	return [
		{
			role: 'jetpack-ai' as const,
			context: {
				type: requestTypeMap[ feature ],
				target: sentence,
				sentence: paragraph,
				replacement,
				paragraph,
			},
		},
	];
};
