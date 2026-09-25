import { renderToStaticMarkup } from 'react-dom/server';
import { preparePreviewText } from '../src/helpers';

// Representative payloads from Publicize\Template_Parser::parse_with_hyperlinks().
// The original cases were captured on the wpcom sandbox at commit cd3ea246b0e;
// regression cases below follow the same final-message occurrence contract.
const PHP_OUTPUT = {
	reported_figcaption: {
		message: 'Today we commemorate Blessed John Soreth. Pray with us.',
		hyperlinks: [],
	},
	literal_plus_content: {
		message: 'same phrase | same phrase first, then same phrase.',
		hyperlinks: [ { text: 'same phrase', href: 'https://example.com/real', occurrence: 2 } ],
	},
	title_plus_content: {
		message: 'ha ha\n\nRead the launch post today.',
		hyperlinks: [ { text: 'launch post', href: 'https://example.com/real', occurrence: 0 } ],
	},
	self_overlapping: {
		message: 'ha ha ha ha ha',
		hyperlinks: [ { text: 'ha ha', href: 'https://example.com/real', occurrence: 3 } ],
	},
	tokens_before_content: {
		message: 'https://example.com/post #post post later post',
		hyperlinks: [ { text: 'post', href: 'https://example.com/real', occurrence: 2 } ],
	},
};

const markupFor = ( key: keyof typeof PHP_OUTPUT ) => {
	const { message, hyperlinks } = PHP_OUTPUT[ key ];
	return renderToStaticMarkup(
		<>{ preparePreviewText( message, { hyperlinks, platform: 'bluesky' } ) }</>
	);
};

describe( 'PHP -> JS hyperlink contract', () => {
	it( 'renders no link for the reported figcaption case', () => {
		expect( markupFor( 'reported_figcaption' ) ).not.toContain( '<a' );
	} );

	it( 'links the content instance, not the literal custom text', () => {
		// Only the third "same phrase" (the anchor's own) should be wrapped.
		expect( markupFor( 'literal_plus_content' ) ).toBe(
			'same phrase | same phrase first, then <a href="https://example.com/real" rel="noopener noreferrer" target="_blank">same phrase</a>.'
		);
	} );

	it( 'links across a title segment without drifting', () => {
		expect( markupFor( 'title_plus_content' ) ).toContain(
			'Read the <a href="https://example.com/real" rel="noopener noreferrer" target="_blank">launch post</a> today.'
		);
	} );

	it( 'agrees with PHP on overlapping occurrence counting', () => {
		// PHP said occurrence 3 of "ha ha" in "ha ha ha ha ha" (overlapping count).
		// If JS counted non-overlapping it would land on index 2 -> byte 6.
		expect( markupFor( 'self_overlapping' ) ).toBe(
			'ha ha ha <a href="https://example.com/real" rel="noopener noreferrer" target="_blank">ha ha</a>'
		);
	} );

	it( 'keeps occurrences aligned when URLs and hashtags contain the anchor text', () => {
		expect( markupFor( 'tokens_before_content' ) ).toBe(
			'<a href="https://example.com/post" rel="noopener noreferrer" target="_blank">https://example.com/post</a> <a href="https://bsky.app/hashtag/post" rel="noopener noreferrer" target="_blank">#post</a> <a href="https://example.com/real" rel="noopener noreferrer" target="_blank">post</a> later post'
		);
	} );
} );
