/**
 * External dependencies
 */
import debugFactory from 'debug';
/*
 * Types & constants
 */
import requestJwt from '../jwt/index.js';
import { AskQuestionOptionsArgProps } from './index.js';
import type { PromptProp } from '../types.js';

/**
 * The response data from the AI assistant when doing a sync, not-streamed question.
 */
export type ResponseData = {
	choices: Array< {
		message: {
			content: string;
		};
	} >;
};

const debug = debugFactory( 'jetpack-ai-client:ask-question-sync' );

/**
 * A function that asks a question without streaming.
 *
 * @param {PromptProp} question - The question to ask. It can be a simple string or an array of PromptMessageItemProps objects.
 * @param {AskQuestionOptionsArgProps} options - An optional object for additional configuration: postId, feature, model.
 * @returns {Promise<ResponseData>} - A promise that resolves to an instance of the ResponseData
 * @example
 * const question = "What is the meaning of life?";
 * const options = {
 *   feature: 'ai-featured-image',
 *   model: 'gpt-4-turbo'
 * }
 * askQuestionSync( question, options ).then( responseData => {
 *    // access the choices array on the response data
 *    const content = responseData.choices[ 0 ].message.content;
 * } );
 */
export default async function askQuestionSync(
	question: PromptProp,
	{ postId = null, feature, model }: AskQuestionOptionsArgProps = {}
): Promise< ResponseData > {
	debug( 'Asking question with no streaming: %o. options: %o', question, {
		postId,
		feature,
		model,
	} );

	/**
	 * The URL to the AI assistant query endpoint.
	 */
	const URL = 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query';

	let token = null;

	try {
		token = ( await requestJwt() ).token;
	} catch ( error ) {
		debug( 'Error getting token: %o', error );
		return Promise.reject( error );
	}

	const body = {
		question: question,
		stream: false,
		postId,
		feature,
		model,
	};

	const headers = {
		Authorization: `Bearer ${ token }`,
		'Content-Type': 'application/json',
	};

	const data = await fetch( URL, {
		method: 'POST',
		headers,
		body: JSON.stringify( body ),
	} ).then( response => response.json() );

	if ( data?.data?.status && data?.data?.status > 200 ) {
		debug( 'Error generating prompt: %o', data );
		return Promise.reject( data );
	}

	return data as ResponseData;
}
