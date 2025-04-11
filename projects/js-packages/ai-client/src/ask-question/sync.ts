/**
 * External dependencies
 */
import debugFactory from 'debug';
/*
 * Types & constants
 */
import requestJwt from '../jwt/index.ts';
import { AskQuestionOptionsArgProps } from './index.ts';
import type { PromptProp } from '../types.ts';

/**
 * The response data from the AI assistant when doing a sync, not-streamed question.
 */
export type ResponseData = string;

const debug = debugFactory( 'jetpack-ai-client:ask-question-sync' );

/**
 * A function that asks a question without streaming.
 *
 * @param {PromptProp}                 question - The question to ask. It can be a simple string or an array of PromptMessageItemProps objects.
 * @param {AskQuestionOptionsArgProps} options  - An optional object for additional configuration: postId, feature, model.
 * @return {Promise<ResponseData>} - A promise that resolves to an instance of the ResponseData
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
	options: AskQuestionOptionsArgProps = {}
): Promise< ResponseData > {
	debug( 'Asking question with no streaming: %o. options: %o', question, options );

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

	const messages = Array.isArray( question ) ? { messages: question } : { question: question };

	const body = {
		...messages,
		...options,
		stream: false,
	};

	const headers = {
		Authorization: `Bearer ${ token }`,
		'Content-Type': 'application/json',
	};

	try {
		const data = await fetch( URL, {
			method: 'POST',
			headers,
			body: JSON.stringify( body ),
		} ).then( response => response.json() );

		if ( data?.data?.status && data?.data?.status > 200 ) {
			debug( 'Error generating prompt: %o', data );
			return Promise.reject( data );
		}

		return data.choices?.[ 0 ]?.message?.content as string;
	} catch ( error ) {
		debug( 'Error asking question: %o', error );
		return Promise.reject( error );
	}
}
