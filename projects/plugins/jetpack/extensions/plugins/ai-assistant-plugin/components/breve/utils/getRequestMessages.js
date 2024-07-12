/**
 * Internal dependencies
 */
import config from '../dictionaries/dictionaries-config.js';

// Map of types to the corresponding AI Assistant request type.
const requestTypeMap = {
	phrase: 'breve-phrase',
	'long-sentence': 'breve-long-sentence',
	weasel: 'breve-weasel',
	adverb: 'breve-adverb',
	adjective: 'breve-adjective',
};

export const getRequestMessages = ( { target, type, sentence, blockText } ) => {
	const dictConfig = config.dictionaries[ type ];

	if ( ! dictConfig ) {
		throw new Error( `Invalid type: ${ type }.` );
	}

	const paragraph = blockText;
	const replacement =
		dictConfig.type === 'key-value' ? dictConfig.dictionary[ target.toLowerCase() ] || '' : null;

	return [
		{
			role: 'jetpack-ai',
			context: {
				type: requestTypeMap[ type ],
				target,
				replacement,
				sentence,
				paragraph,
			},
		},
	];
};
