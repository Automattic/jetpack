/**
 * External dependencies
 */
import {
	MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT,
	PROMPT_SUFFIX,
	createPrompt,
	buildPromptTemplate,
} from '../create-prompt';

describe( 'AIAssistanceEdit', () => {
	test.skip( 'createPrompt', () => {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const charactersLength = characters.length;
		let longContent = '';
		for ( let i = 0; i < MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT + 10; i++ ) {
			longContent += characters.charAt( Math.floor( Math.random() * charactersLength ) );
		}

		// Test empty posts get falsy
		expect( createPrompt() ).toBeFalsy();
		expect( createPrompt( '', '', '' ) ).toBeFalsy();

		// Test Title summary - with content but no title
		expect( createPrompt( '', 'some content', '', '', '', 'titleSummary' ) ).toBeFalsy();

		// Test Title summary - no content
		expect( createPrompt( 'The story of my life', '', '', '', '', 'titleSummary' ) ).toBe(
			"Please help me write a short piece of a blog post titled 'The story of my life'" +
				PROMPT_SUFFIX
		);

		// Test `continue` preceding - with content
		expect(
			createPrompt( 'The story of my life', 'whatver the post content is', '', '', 'continue' )
		).toBe( ' Please continue from here:\n\n … whatver the post content is' + PROMPT_SUFFIX );

		// Test that <BR/> are being translated. And content trimmed
		expect(
			createPrompt( 'The story of my life', 'content<br/>content2', '', '', 'continue' )
		).toBe( ' Please continue from here:\n\n … content\ncontent2' + PROMPT_SUFFIX );

		// Generated based on `title` and `content`.
		expect( createPrompt( 'The story of my life', 'This story is obout hate and love...' ) ).toBe(
			"Please help me write a short piece of a blog post titled 'The story of my life'. Additional context:\n\n … " +
				'This story is obout hate and love...' +
				PROMPT_SUFFIX
		);

		// Generated based on `title` and (long) `content`.
		expect( createPrompt( 'The story of my life', longContent ) ).toBe(
			"Please help me write a short piece of a blog post titled 'The story of my life'. Additional context:\n\n … " +
				longContent.slice( -MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT ) +
				PROMPT_SUFFIX
		);

		// Summarize
		expect( createPrompt( '', '', longContent, '', 'summarize' ) ).toBe(
			'Summarize this:\n\n … ' +
				longContent.slice( -MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT ) +
				PROMPT_SUFFIX
		);

		/* @todo: Uncommment once tags and categories are supported

		// expect( createPrompt( 'The story of my life', [ fakeBlock, fakeBlock ], 'cat 1', '' ) ).toBe(
		// 	"Please help me write a short piece of a blog post titled 'The story of my life', published in categories 'cat 1'. Please only output generated content ready for publishing. Please continue from here:\n\n … content\ncontent"
		// );

		// Test only cats
		expect( createPrompt( '', [ fakeBlock ], 'cat1', 'tag1' ) ).toBe(
			"Please help me write a short piece of a blog post, published in categories 'cat1' and tagged 'tag1'. Please only output generated content ready for publishing. Please continue from here:\n\n … content"
		);
		expect( createPrompt( '', [ fakeBlock ], 'cat1, cat2', 'tag1' ) ).toBe(
			"Please help me write a short piece of a blog post, published in categories 'cat1, cat2' and tagged 'tag1'. Please only output generated content ready for publishing. Please continue from here:\n\n … content"
		);
		expect( createPrompt( '', [], 'cat1, cat2', 'tag1' ) ).toBe(
			"Please help me write a short piece of a blog post, published in categories 'cat1, cat2' and tagged 'tag1'. Please only output generated content ready for publishing."
		);
		expect( createPrompt( 'The story of my life', [], 'cat1, cat2', 'tag1' ) ).toBe(
			"Please help me write a short piece of a blog post titled 'The story of my life', published in categories 'cat1, cat2' and tagged 'tag1'. Please only output generated content ready for publishing."
		);
		*/
	} );

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

		describe( 'when there neither a request nor content', () => {
			it( 'should throw an error', () => {
				expect( () => buildPromptTemplate( {} ) ).toThrow(
					'You must provide either a request or content'
				);
			} );
		} );
	} );
} );
