import { applyFilters } from '@wordpress/hooks';
import config from '../dictionaries/dictionaries-config.js';

export const sendAIRequest = async ( text, type, apiKey, parentSentenceText, blockText ) => {
	const dictConfig = config.dictionaries[ type ];
	if ( ! dictConfig || ! dictConfig.apiRequest ) {
		throw new Error( `Invalid type: ${ type } or missing apiRequest configuration.` );
	}

	let systemMessageTemplate = dictConfig.apiRequest.systemMessage;
	if ( dictConfig.type === 'key-value' ) {
		const value = dictConfig.dictionary[ text.toLowerCase() ] || '';
		systemMessageTemplate = systemMessageTemplate.replace( '{value}', value );
	}
	const systemMessage = systemMessageTemplate.replace( '{text}', text );

	const userMessage = `
    Sentence: ${ parentSentenceText }
    Paragraph: ${ blockText }
  `;

	const payload = {
		model: 'gpt-4',
		messages: [
			{
				role: 'system',
				content: systemMessage,
			},
			{
				role: 'user',
				content: userMessage,
			},
		],
	};

	const filterArgument = {
		replacementText: undefined,
		textReplaced: false,
	};
	const { replacementText: filterReplacementText, textReplaced } = await applyFilters(
		'breve-ai-request',
		filterArgument,
		payload
	);

	if ( textReplaced ) {
		return filterReplacementText;
	}

	const response = await fetch( 'https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${ apiKey }`,
		},
		body: JSON.stringify( payload ),
	} );

	const data = await response.json();
	const replacementText = data?.choices[ 0 ]?.message?.content;
	return replacementText;
};
