import { createPrompt, MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT } from '../edit';

describe( 'AIParagraphEdit', () => {
	test( 'createPrompt', () => {
		const fakeBlock = { attributes: { content: 'content' } };
		const fakeBlockWithBr = { attributes: { content: 'content<br/>content2' } };
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const charactersLength = characters.length;
		let longContent = '';
		for ( let i = 0; i < MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT + 10; i++ ) {
			longContent += characters.charAt( Math.floor( Math.random() * charactersLength ) );
		}
		const fakeBlockWithVeryLongContent = { attributes: { content: longContent } };

		// Test empty posts get falsy
		expect( createPrompt() ).toBeFalsy();
		expect( createPrompt( '', [], '', '' ) ).toBeFalsy();

		// Test contents
		expect( createPrompt( 'title', [], '', '' ) ).toBe(
			"Give me content for a blog post titled 'title' . Do not not include any smalltalk, just the content of a post."
		);
		expect(
			createPrompt( 'title', [ fakeBlock, { attributes: { whatever: 'content' } } ], '', '' )
		).toBe(
			"Give me content for a blog post titled 'title' :\n\n … content. Do not not include any smalltalk, just the content of a post."
		);

		// Test that <BR/> are being translated. And content trimmed
		expect( createPrompt( 'title', [ fakeBlockWithBr ], '', '' ) ).toBe(
			"Give me content for a blog post titled 'title' :\n\n … content\ncontent2. Do not not include any smalltalk, just the content of a post."
		);

		expect( createPrompt( 'title', [ fakeBlock, fakeBlock ], 'cat 1', '' ) ).toBe(
			"Give me content for a blog post titled 'title' , published in categories 'cat 1':\n\n … content\ncontent. Do not not include any smalltalk, just the content of a post."
		);

		// Test MAX content length
		expect( createPrompt( 'title', [ fakeBlockWithVeryLongContent ] ) ).toBe(
			"Give me content for a blog post titled 'title' :\n\n … . Do not not include any smalltalk, just the content of a post." +
				longContent.slice( -MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT )
		);

		// Test only cats
		expect( createPrompt( '', [ fakeBlock ], 'cat1', 'tag1' ) ).toBe(
			"Give me content for a blog post, published in categories 'cat1' and tagged 'tag1':\n\n … content. Do not not include any smalltalk, just the content of a post."
		);
		expect( createPrompt( '', [ fakeBlock ], 'cat1, cat2', 'tag1' ) ).toBe(
			"Give me content for a blog post, published in categories 'cat1, cat2' and tagged 'tag1':\n\n … content. Do not not include any smalltalk, just the content of a post."
		);
		expect( createPrompt( '', [], 'cat1, cat2', 'tag1' ) ).toBe(
			"Give me content for a blog post, published in categories 'cat1, cat2' and tagged 'tag1'. Do not not include any smalltalk, just the content of a post."
		);
		expect( createPrompt( 'title', [], 'cat1, cat2', 'tag1' ) ).toBe(
			"Give me content for a blog post titled 'title' , published in categories 'cat1, cat2' and tagged 'tag1'. Do not not include any smalltalk, just the content of a post."
		);
	} );
} );
