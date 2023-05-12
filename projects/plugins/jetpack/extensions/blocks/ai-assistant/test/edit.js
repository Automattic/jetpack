/**
 * External dependencies
 */
import { buildPromptTemplate } from '../create-prompt';

describe( 'AIAssistanceEdit', () => {
	describe( 'buildPromptTemplate', () => {
		describe( 'when there is a request without content', () => {
			it( 'should return the correct template', () => {
				const request = 'Describe a dog in 10 words or less.';
				const expectedTemplate = `You are an AI assistant block, a part of a product called Jetpack made by the company called Automattic.
Your job is to respond to the request below, under "Request". Do this by following rules set in "Rules".

Rules:
- Output the generated content in markdown format.
- Do not include a top level heading by default.
- Only output generated content ready for publishing.

Request:
Describe a dog in 10 words or less.`;

				expect( buildPromptTemplate( { request } ) ).toEqual( expectedTemplate );
			} );
		} );

		describe( 'when there is content and rules without a request', () => {
			it( 'should return the correct template', () => {
				const content = 'Writing a WordPress blog post';
				const rules = [
					'The output should be translated to Brazilian Portuguese',
					'The output should be in the caipira accent',
				];
				const expectedTemplate = `You are an AI assistant block, a part of a product called Jetpack made by the company called Automattic.
Your job is to modify the content below, under "Content". Do this by following rules set in "Rules".

Rules:
- Output the generated content in markdown format.
- Do not include a top level heading by default.
- Only output generated content ready for publishing.
- The output should be translated to Brazilian Portuguese.
- The output should be in the caipira accent.

Content:
Writing a WordPress blog post`;

				expect( buildPromptTemplate( { content, rules } ) ).toEqual( expectedTemplate );
			} );
		} );

		describe( 'when there is a different context', () => {
			it( 'should return the correct template', () => {
				const context = 'You are a WordPress blogger';
				const request = 'Describe a dog in 10 words or less.';
				const expectedTemplate = `You are a WordPress blogger.
Your job is to respond to the request below, under "Request". Do this by following rules set in "Rules".

Rules:
- Output the generated content in markdown format.
- Do not include a top level heading by default.
- Only output generated content ready for publishing.

Request:
Describe a dog in 10 words or less.`;

				expect( buildPromptTemplate( { request, context } ) ).toEqual( expectedTemplate );
			} );
		} );

		describe( 'when there is language', () => {
			it( 'should return the correct template', () => {
				const content = 'Writing a WordPress blog post';
				const language = 'pt';
				const expectedTemplate = `You are an AI assistant block, a part of a product called Jetpack made by the company called Automattic.
Your job is to modify the content below, under "Content". Do this by following rules set in "Rules".

Rules:
- Output the generated content in markdown format.
- Do not include a top level heading by default.
- Only output generated content ready for publishing.
- Write in the language: pt (Portuguese).

Content:
Writing a WordPress blog post`;

				expect( buildPromptTemplate( { content, language } ) ).toEqual( expectedTemplate );
			} );
		} );

		describe( 'when there are language and locale', () => {
			it( 'should return the correct template', () => {
				const content = 'Writing a WordPress blog post';
				const language = 'pt';
				const locale = 'BR';
				const expectedTemplate = `You are an AI assistant block, a part of a product called Jetpack made by the company called Automattic.
Your job is to modify the content below, under "Content". Do this by following rules set in "Rules".

Rules:
- Output the generated content in markdown format.
- Do not include a top level heading by default.
- Only output generated content ready for publishing.
- Write in the language: pt (Portuguese). locale: BR.

Content:
Writing a WordPress blog post`;

				expect( buildPromptTemplate( { content, language, locale } ) ).toEqual( expectedTemplate );
			} );
		} );

		describe( 'when there neither a request nor content', () => {
			it( 'should throw an error', () => {
				expect( () => buildPromptTemplate( {} ) ).toThrow(
					'You must provide either a request or content'
				);
			} );
		} );
	} );
} );
