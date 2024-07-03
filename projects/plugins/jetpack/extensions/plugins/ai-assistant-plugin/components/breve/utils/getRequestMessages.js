/**
 * Internal dependencies
 */
import config from '../dictionaries/dictionaries-config.js';

export const getRequestMessages = ( { replacementText, type, parentSentenceText, blockText } ) => {
	const dictConfig = config.dictionaries[ type ];
	if ( ! dictConfig || ! dictConfig.apiRequest ) {
		throw new Error( `Invalid type: ${ type } or missing apiRequest configuration.` );
	}

	let systemMessageTemplate = dictConfig.apiRequest.systemMessage;
	if ( dictConfig.type === 'key-value' ) {
		const value = dictConfig.dictionary[ replacementText.toLowerCase() ] || '';
		systemMessageTemplate = systemMessageTemplate.replace( '{value}', value );
	}
	const systemMessage = systemMessageTemplate.replace( '{text}', replacementText );

	const userMessage = `
    Sentence: ${ parentSentenceText }
    Paragraph: ${ blockText }
  `;

	return [
		{
			role: 'system',
			content: systemMessage,
		},
		{
			role: 'user',
			content: userMessage,
		},
	];
};
