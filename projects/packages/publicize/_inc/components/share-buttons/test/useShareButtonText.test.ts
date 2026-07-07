/* eslint-disable import/order */
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';

mockScriptData();

jest.mock( '@automattic/jetpack-script-data', () => {
	const actual = jest.requireActual( '@automattic/jetpack-script-data' );
	return {
		...actual,
		siteHasFeature: jest.fn(),
	};
} );

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useSelect: jest.fn(),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property as keyof typeof mocks ] ?? target[ property as keyof typeof target ];
		},
	} );
} );

jest.mock( '../../../hooks/use-manual-share-message', () => ( {
	useManualShareMessage: jest.fn(),
} ) );

jest.mock( '../../../hooks/use-post-meta', () => ( {
	usePostMeta: jest.fn(),
} ) );

import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useShareButtonText } from '../useShareButtonText';
import { useManualShareMessage } from '../../../hooks/use-manual-share-message';
import { usePostMeta } from '../../../hooks/use-post-meta';

const mockSiteHasFeature = jest.requireMock( '@automattic/jetpack-script-data' )
	.siteHasFeature as jest.Mock;
const mockUseSelect = useSelect as jest.Mock;
const mockUseManualShareMessage = useManualShareMessage as jest.Mock;
const mockUsePostMeta = usePostMeta as jest.Mock;

// Matches a single-brace token like {title} but not a double-brace {{text}} slot.
const TOKEN_RE = /\{(?!\{)(title|excerpt|url|author)\}/;

const LINK = 'https://example.com/post';

const X_TEMPLATE = 'https://x.com/intent/tweet?text={{text}}&url={{url}}';
const FACEBOOK_TEMPLATE = 'https://www.facebook.com/sharer/sharer.php?u={{url}}';
const CLIPBOARD_TEMPLATE = '{{text}}\n{{url}}';

/**
 * Set up the editor useSelect return: post link + token-free title fallback.
 *
 * @param titleFallback - The SEO/post title fallback.
 */
function mockEditor( titleFallback = 'My Post Title' ) {
	mockUseSelect.mockReturnValue( { link: LINK, titleFallback } );
}

describe( 'useShareButtonText', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUsePostMeta.mockReturnValue( { shareMessage: '' } );
		mockUseManualShareMessage.mockReturnValue( { message: null, isLoading: false } );
	} );

	afterAll( () => {
		clearMockedScriptData();
	} );

	it( 'renders the WPCOM-rendered message and leaks no template tokens (regression)', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockEditor();
		// The raw template is still in post meta; it must never reach the output.
		mockUsePostMeta.mockReturnValue( { shareMessage: '{title} {excerpt} {url} {author}' } );
		mockUseManualShareMessage.mockReturnValue( { message: 'Hello world', isLoading: false } );

		const { result } = renderHook( () => useShareButtonText() );
		const output = result.current( CLIPBOARD_TEMPLATE, false );

		expect( output ).toContain( 'Hello world' );
		expect( output ).not.toMatch( TOKEN_RE );
	} );

	it( 'passes the plain shareMessage through unchanged when templates are off', () => {
		mockSiteHasFeature.mockReturnValue( false );
		mockEditor();
		mockUsePostMeta.mockReturnValue( { shareMessage: 'Check out my post' } );

		const { result } = renderHook( () => useShareButtonText() );
		const output = result.current( X_TEMPLATE );

		// Byte-identical to the legacy output: message + separately-carried url.
		expect( output ).toBe(
			`https://x.com/intent/tweet?text=${ encodeURIComponent(
				'Check out my post'
			) }&url=${ encodeURIComponent( LINK ) }`
		);
	} );

	it( 'falls back to the token-free title while the rendered message loads', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockEditor( 'My Post Title' );
		mockUseManualShareMessage.mockReturnValue( { message: null, isLoading: true } );
		// A custom template is set, but it must NOT be used while templates are on.
		mockUsePostMeta.mockReturnValue( { shareMessage: 'Sharing {title} {url}' } );

		const { result } = renderHook( () => useShareButtonText() );
		const output = result.current( CLIPBOARD_TEMPLATE, false );

		expect( output ).toContain( 'My Post Title' );
		expect( output ).not.toMatch( TOKEN_RE );
	} );

	it( 'de-duplicates the URL when the rendered message already contains it', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockEditor();
		const rendered = `Great post\n\n${ LINK }`;
		mockUseManualShareMessage.mockReturnValue( { message: rendered, isLoading: false } );

		const { result } = renderHook( () => useShareButtonText() );
		const output = result.current( X_TEMPLATE );
		const decoded = decodeURIComponent( output );

		// The link should appear exactly once (inside the text, not also in &url=).
		const occurrences = decoded.split( LINK ).length - 1;
		expect( occurrences ).toBe( 1 );
		// The trailing url slot is emptied out.
		expect( output ).toMatch( /&url=$/ );
	} );

	it( 'keeps the URL for a url-only template (Facebook) even with templates on', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockEditor();
		const rendered = `Great post\n\n${ LINK }`;
		mockUseManualShareMessage.mockReturnValue( { message: rendered, isLoading: false } );

		const { result } = renderHook( () => useShareButtonText() );
		const output = result.current( FACEBOOK_TEMPLATE );

		expect( output ).toBe(
			`https://www.facebook.com/sharer/sharer.php?u=${ encodeURIComponent( LINK ) }`
		);
	} );
} );
