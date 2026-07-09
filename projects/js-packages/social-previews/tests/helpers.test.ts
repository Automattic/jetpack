import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { parseHyperlinks, preparePreviewText } from '../src/helpers';

const platformsWithHyperlinkUrls = [ 'facebook', 'linkedin', 'twitter' ] as const;

const platformsWithoutHyperlinkUrls = [ 'instagram' ] as const;

const allPlatforms = [ ...platformsWithHyperlinkUrls, ...platformsWithoutHyperlinkUrls ];

describe( 'preparePreviewText', () => {
	it( 'should do nothing if there are no hashtags, URLs or new lines', () => {
		const text = `Some text here which has no URL, no hashtag and no line break`;

		for ( const platform of allPlatforms ) {
			const { container } = render( preparePreviewText( text, { platform } ) );

			expect( container.innerHTML ).toBe(
				'Some text here which has no URL, no hashtag and no line break'
			);

			expect( render( preparePreviewText( '', { platform } ) ).container ).toBeEmptyDOMElement();
		}
	} );

	it( 'should convert new lines to `<br /> tags', () => {
		const text = `Some text with a \n here and another one here\n That is it.`;

		for ( const platform of allPlatforms ) {
			const { container } = render( preparePreviewText( text, { platform } ) );

			expect( container.innerHTML ).toBe(
				'Some text with a <br> here and another one here<br> That is it.'
			);
		}
	} );

	it( 'should limit the text to the given number of lines', () => {
		const text = `This is the first line\nThis is the second line\nthis third and\this 4th`;

		for ( const platform of allPlatforms ) {
			const { container } = render( preparePreviewText( text, { platform, maxLines: 2 } ) );

			expect( container.innerHTML ).toBe( 'This is the first line<br>This is the second line' );
		}
	} );

	it( 'should limit the text to the given number of characters', () => {
		const text = `This is the first line\nThis is the second line\nthis third and\this 4th`;

		for ( const platform of allPlatforms ) {
			const { container } = render( preparePreviewText( text, { platform, maxChars: 60 } ) );

			expect( container.innerHTML ).toBe(
				'This is the first line<br>This is the second line<br>this third an…'
			);
		}
	} );

	it( "should convert URLs to hyperlinks by default except for the platforms that don't support it", () => {
		const text = `Check out this cool site: https://wordpress.org and this one https://wordpress.com also.`;

		for ( const platform of platformsWithHyperlinkUrls ) {
			const { container } = render( preparePreviewText( text, { platform } ) );

			expect( container.innerHTML ).toBe(
				'Check out this cool site: <a href="https://wordpress.org" rel="noopener noreferrer" target="_blank">https://wordpress.org</a> and this one <a href="https://wordpress.com" rel="noopener noreferrer" target="_blank">https://wordpress.com</a> also.'
			);
		}

		for ( const platform of platformsWithoutHyperlinkUrls ) {
			const { container } = render( preparePreviewText( text, { platform } ) );

			expect( container.innerHTML ).toBe(
				'Check out this cool site: https://wordpress.org and this one https://wordpress.com also.'
			);
		}
	} );

	it( 'should NOT convert URLs to hyperlinks when `hyperlinkUrls` is `false`', () => {
		const text = `Check out this cool site: https://wordpress.org and this one https://wordpress.com also.`;

		for ( const platform of allPlatforms ) {
			const { container } = render(
				preparePreviewText( text, { platform, hyperlinkUrls: false } )
			);

			expect( container.innerHTML ).toBe(
				'Check out this cool site: https://wordpress.org and this one https://wordpress.com also.'
			);
		}
	} );

	it( 'should convert hashtags to hyperlinks by default', () => {
		const text = `#breaking text with a #hashtag on the #web\nwith a url https://github.com/Automattic/wp-calypso#security that has a hash in it\n#thisone after a new line`;

		expect(
			render( preparePreviewText( text, { platform: 'facebook' } ) ).container.innerHTML
		).toBe(
			'<a href="https://www.facebook.com/hashtag/breaking" rel="noopener noreferrer" target="_blank">#breaking</a> text with a <a href="https://www.facebook.com/hashtag/hashtag" rel="noopener noreferrer" target="_blank">#hashtag</a> on the <a href="https://www.facebook.com/hashtag/web" rel="noopener noreferrer" target="_blank">#web</a><br>with a url <a href="https://github.com/Automattic/wp-calypso#security" rel="noopener noreferrer" target="_blank">https://github.com/Automattic/wp-calypso#security</a> that has a hash in it<br><a href="https://www.facebook.com/hashtag/thisone" rel="noopener noreferrer" target="_blank">#thisone</a> after a new line'
		);

		expect(
			render( preparePreviewText( text, { platform: 'instagram' } ) ).container.innerHTML
		).toBe(
			'<a href="https://www.instagram.com/explore/tags/breaking" rel="noopener noreferrer" target="_blank">#breaking</a> text with a <a href="https://www.instagram.com/explore/tags/hashtag" rel="noopener noreferrer" target="_blank">#hashtag</a> on the <a href="https://www.instagram.com/explore/tags/web" rel="noopener noreferrer" target="_blank">#web</a><br>with a url https://github.com/Automattic/wp-calypso#security that has a hash in it<br><a href="https://www.instagram.com/explore/tags/thisone" rel="noopener noreferrer" target="_blank">#thisone</a> after a new line'
		);

		expect(
			render( preparePreviewText( text, { platform: 'linkedin' } ) ).container.innerHTML
		).toBe(
			'<a href="https://www.linkedin.com/feed/hashtag/?keywords=breaking" rel="noopener noreferrer" target="_blank">#breaking</a> text with a <a href="https://www.linkedin.com/feed/hashtag/?keywords=hashtag" rel="noopener noreferrer" target="_blank">#hashtag</a> on the <a href="https://www.linkedin.com/feed/hashtag/?keywords=web" rel="noopener noreferrer" target="_blank">#web</a><br>with a url <a href="https://github.com/Automattic/wp-calypso#security" rel="noopener noreferrer" target="_blank">https://github.com/Automattic/wp-calypso#security</a> that has a hash in it<br><a href="https://www.linkedin.com/feed/hashtag/?keywords=thisone" rel="noopener noreferrer" target="_blank">#thisone</a> after a new line'
		);

		expect(
			render( preparePreviewText( text, { platform: 'twitter' } ) ).container.innerHTML
		).toBe(
			'<a href="https://twitter.com/hashtag/breaking" rel="noopener noreferrer" target="_blank">#breaking</a> text with a <a href="https://twitter.com/hashtag/hashtag" rel="noopener noreferrer" target="_blank">#hashtag</a> on the <a href="https://twitter.com/hashtag/web" rel="noopener noreferrer" target="_blank">#web</a><br>with a url <a href="https://github.com/Automattic/wp-calypso#security" rel="noopener noreferrer" target="_blank">https://github.com/Automattic/wp-calypso#security</a> that has a hash in it<br><a href="https://twitter.com/hashtag/thisone" rel="noopener noreferrer" target="_blank">#thisone</a> after a new line'
		);
	} );

	it( 'should NOT convert hashtags to hyperlinks when `hyperlinkHashtags` is `false`', () => {
		const text = `#breaking text with a #hashtag on the #web\nwith a url https://github.com/Automattic/wp-calypso#security that has a hash in it\n#thisone after a new line`;

		for ( const platform of platformsWithHyperlinkUrls ) {
			const { container } = render(
				preparePreviewText( text, { platform, hyperlinkHashtags: false } )
			);

			expect( container.innerHTML ).toBe(
				'#breaking text with a #hashtag on the #web<br>with a url <a href="https://github.com/Automattic/wp-calypso#security" rel="noopener noreferrer" target="_blank">https://github.com/Automattic/wp-calypso#security</a> that has a hash in it<br>#thisone after a new line'
			);
		}

		for ( const platform of platformsWithoutHyperlinkUrls ) {
			const { container } = render(
				preparePreviewText( text, { platform, hyperlinkHashtags: false } )
			);

			expect( container.innerHTML ).toBe(
				'#breaking text with a #hashtag on the #web<br>with a url https://github.com/Automattic/wp-calypso#security that has a hash in it<br>#thisone after a new line'
			);
		}
	} );

	describe( 'editor hyperlinks (`hyperlinks`)', () => {
		it( 'links the matching anchor text when hyperlinks are provided', () => {
			const { container } = render(
				preparePreviewText( 'Read the launch post now.', {
					platform: 'tumblr',
					hyperlinks: [ { text: 'launch post', href: 'https://example.com/anchor' } ],
				} )
			);

			expect( container.innerHTML ).toBe(
				'Read the <a href="https://example.com/anchor" rel="noopener noreferrer" target="_blank">launch post</a> now.'
			);
		} );

		it( 'leaves the text plain when no hyperlinks are provided (default)', () => {
			for ( const platform of allPlatforms ) {
				const { container } = render(
					preparePreviewText( 'Read the launch post now.', { platform } )
				);

				expect( container.innerHTML ).toBe( 'Read the launch post now.' );
			}
		} );

		it( 'links multiple anchors independently', () => {
			const { container } = render(
				preparePreviewText( 'this has a link and also this s', {
					platform: 'bluesky',
					hyperlinks: [
						{ text: 'this', href: 'https://a.com/1' },
						{ text: 'and also this', href: 'https://b.com/2' },
					],
				} )
			);

			expect( container.innerHTML ).toBe(
				'<a href="https://a.com/1" rel="noopener noreferrer" target="_blank">this</a> has a link <a href="https://b.com/2" rel="noopener noreferrer" target="_blank">and also this</a> s'
			);
		} );

		it( 'links the occurrence the anchor covers, not the first matching text', () => {
			const { container } = render(
				preparePreviewText( 'Read this post today. Later, read this post again.', {
					platform: 'tumblr',
					hyperlinks: [ { text: 'this post', href: 'https://example.com/real', occurrence: 1 } ],
				} )
			);

			expect( container.innerHTML ).toBe(
				'Read this post today. Later, read <a href="https://example.com/real" rel="noopener noreferrer" target="_blank">this post</a> again.'
			);
		} );

		it( 'skips an anchor whose text is not present (e.g. truncated away)', () => {
			const { container } = render(
				preparePreviewText( 'short body', {
					platform: 'tumblr',
					maxChars: 10,
					hyperlinks: [ { text: 'missing phrase', href: 'https://example.com/x' } ],
				} )
			);

			// No `<a>`: the anchor text isn't in the (truncated) body, so it's skipped.
			expect( container.innerHTML ).toBe( 'short body' );
		} );
	} );

	describe( 'parseHyperlinks', () => {
		it( 'extracts (text, href) pairs from anchor tags in document order', () => {
			const html =
				'<p>Read the <a href="https://example.com/x">launch post</a> now and <a href="http://b.test" data-type="link">click here</a>.</p>';

			expect( parseHyperlinks( html ) ).toEqual( [
				{ text: 'launch post', href: 'https://example.com/x', occurrence: 0 },
				{ text: 'click here', href: 'http://b.test', occurrence: 0 },
			] );
		} );

		it( 'skips autolinks and non-http(s) hrefs', () => {
			const html =
				'<a href="https://wp.org">https://wp.org</a> <a href="mailto:a@b.com">mail</a> <a href="/relative">rel</a>';

			expect( parseHyperlinks( html ) ).toEqual( [] );
		} );

		it( 'strips nested markup and collapses whitespace in the text', () => {
			const html = '<a href="https://example.com">launch\n   <strong>post</strong></a>';

			expect( parseHyperlinks( html ) ).toEqual( [
				{ text: 'launch post', href: 'https://example.com', occurrence: 0 },
			] );
		} );

		it( 'returns an empty array for empty input', () => {
			expect( parseHyperlinks( '' ) ).toEqual( [] );
		} );

		it( 'records which occurrence of duplicated text an anchor covers', () => {
			const html =
				'<p>Read this post today. Later, read <a href="https://example.com/real">this post</a> again.</p>';

			expect( parseHyperlinks( html ) ).toEqual( [
				{ text: 'this post', href: 'https://example.com/real', occurrence: 1 },
			] );
		} );
	} );
} );
