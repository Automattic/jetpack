import {
	createPrompt,
	// MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT,
	PROMPT_SUFFIX,
} from '../edit';

describe( 'AIParagraphEdit', () => {
	test( 'createPrompt', () => {
		const fakeBlock = { attributes: { content: 'content' } };
		const fakeBlockWithBr = { attributes: { content: 'content<br/>content2' } };
		// const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		// const charactersLength = characters.length;
		// let longContent = '';
		// for ( let i = 0; i < MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT + 10; i++ ) {
		// 	longContent += characters.charAt( Math.floor( Math.random() * charactersLength ) );
		// }
		// const fakeBlockWithVeryLongContent = { attributes: { content: longContent } };

		// Test empty posts get falsy
		expect( createPrompt() ).toBeFalsy();
		expect( createPrompt( '', [], '', '' ) ).toBeFalsy();

		// Test Title summary - no blocks
		expect( createPrompt( 'title', [], '', '', '', 'titleSummary' ) ).toBe(
			"Please help me write a short piece of a blog post titled 'title'" + PROMPT_SUFFIX
		);

		// Test Expand preceding - with blocks
		expect(
			createPrompt(
				'title',
				[ fakeBlock, { attributes: { whatever: 'content' } } ],
				'',
				'',
				'',
				'expandPreceding'
			)
		).toBe( ' Please continue from here:\n\n … content' + PROMPT_SUFFIX );

		// Test that <BR/> are being translated. And content trimmed
		expect( createPrompt( 'title', [ fakeBlockWithBr ], '', '', '', 'expandPreceding' ) ).toBe(
			' Please continue from here:\n\n … content\ncontent2' + PROMPT_SUFFIX
		);

		// Test MAX content length @todo: fix it!
		// expect( createPrompt( 'title', [ fakeBlockWithVeryLongContent ] ) ).toBe(
		// 	"Please help me write a short piece of a blog post titled 'title'. Please only output generated content ready for publishing. Please continue from here:\n\n … " +
		// 		longContent.slice( -MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT )
		// );

		/* @todo: Uncommment once tags and categories are supported

		// expect( createPrompt( 'title', [ fakeBlock, fakeBlock ], 'cat 1', '' ) ).toBe(
		// 	"Please help me write a short piece of a blog post titled 'title', published in categories 'cat 1'. Please only output generated content ready for publishing. Please continue from here:\n\n … content\ncontent"
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
		expect( createPrompt( 'title', [], 'cat1, cat2', 'tag1' ) ).toBe(
			"Please help me write a short piece of a blog post titled 'title', published in categories 'cat1, cat2' and tagged 'tag1'. Please only output generated content ready for publishing."
		);
		*/
	} );
} );
