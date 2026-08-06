import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	MAX_ERROR_MESSAGE_LENGTH,
	parsePostId,
	escapeAttr,
	rgbToHex,
	isSafePasteHref,
	getEmbedUrl,
	parseMarkdownListShortcut,
	parseMarkdownQuoteShortcut,
	describeSaveError,
} from '../text-helpers.js';

describe( 'parsePostId', () => {
	it( 'parses a bare numeric string', () => {
		assert.equal( parsePostId( '123' ), 123 );
	} );

	it( 'trims surrounding whitespace', () => {
		assert.equal( parsePostId( '  42  ' ), 42 );
	} );

	it( 'returns null for non-numeric input', () => {
		assert.equal( parsePostId( 'abc' ), null );
		assert.equal( parsePostId( '12abc' ), null );
		assert.equal( parsePostId( 'https://example.com/?p=7' ), null );
		assert.equal( parsePostId( '' ), null );
	} );
} );

describe( 'escapeAttr', () => {
	it( 'escapes ampersands and double quotes', () => {
		assert.equal( escapeAttr( 'a & b' ), 'a &amp; b' );
		assert.equal( escapeAttr( 'say "hi"' ), 'say &quot;hi&quot;' );
	} );

	it( 'escapes ampersands before quotes so entities are not double-escaped', () => {
		assert.equal( escapeAttr( '&"' ), '&amp;&quot;' );
	} );

	it( 'leaves a plain string unchanged', () => {
		assert.equal( escapeAttr( 'plain text' ), 'plain text' );
	} );
} );

describe( 'rgbToHex', () => {
	it( 'converts an rgb() string to hex', () => {
		assert.equal( rgbToHex( 'rgb(214, 54, 56)' ), '#d63638' );
	} );

	it( 'zero-pads single-digit channels', () => {
		assert.equal( rgbToHex( 'rgb(0, 0, 0)' ), '#000000' );
		assert.equal( rgbToHex( 'rgb(1, 2, 3)' ), '#010203' );
	} );

	it( 'handles white', () => {
		assert.equal( rgbToHex( 'rgb(255, 255, 255)' ), '#ffffff' );
	} );

	it( 'returns the input unchanged when not in rgb() format', () => {
		assert.equal( rgbToHex( '#abcdef' ), '#abcdef' );
		assert.equal( rgbToHex( 'red' ), 'red' );
		assert.equal( rgbToHex( 'rgba(0, 0, 0, 0)' ), 'rgba(0, 0, 0, 0)' );
	} );
} );

describe( 'isSafePasteHref', () => {
	it( 'allows http and https', () => {
		assert.equal( isSafePasteHref( 'https://example.com' ), true );
		assert.equal( isSafePasteHref( 'http://example.com' ), true );
	} );

	it( 'allows mailto and tel', () => {
		assert.equal( isSafePasteHref( 'mailto:hi@example.com' ), true );
		assert.equal( isSafePasteHref( 'tel:+15551234' ), true );
	} );

	it( 'allows relative, fragment, and query hrefs', () => {
		assert.equal( isSafePasteHref( '/about' ), true );
		assert.equal( isSafePasteHref( '#section' ), true );
		assert.equal( isSafePasteHref( '?page=2' ), true );
		assert.equal( isSafePasteHref( './local' ), true );
		assert.equal( isSafePasteHref( '../up' ), true );
	} );

	it( 'rejects script-bearing and data schemes', () => {
		assert.equal( isSafePasteHref( 'javascript:alert(1)' ), false );
		assert.equal( isSafePasteHref( 'vbscript:msgbox(1)' ), false );
		assert.equal( isSafePasteHref( 'data:text/html,<script>' ), false );
	} );

	it( 'is case-insensitive on the scheme', () => {
		assert.equal( isSafePasteHref( 'HTTPS://example.com' ), true );
	} );

	it( 'rejects empty or whitespace-only hrefs', () => {
		assert.equal( isSafePasteHref( '' ), false );
		assert.equal( isSafePasteHref( '   ' ), false );
		assert.equal( isSafePasteHref( undefined ), false );
	} );
} );

describe( 'getEmbedUrl', () => {
	it( 'converts a YouTube watch URL', () => {
		assert.equal(
			getEmbedUrl( 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' ),
			'https://www.youtube.com/embed/dQw4w9WgXcQ'
		);
	} );

	it( 'converts a youtu.be short URL', () => {
		assert.equal(
			getEmbedUrl( 'https://youtu.be/dQw4w9WgXcQ' ),
			'https://www.youtube.com/embed/dQw4w9WgXcQ'
		);
	} );

	it( 'converts an existing YouTube embed URL', () => {
		assert.equal(
			getEmbedUrl( 'https://www.youtube.com/embed/dQw4w9WgXcQ' ),
			'https://www.youtube.com/embed/dQw4w9WgXcQ'
		);
	} );

	it( 'converts a Vimeo URL', () => {
		assert.equal(
			getEmbedUrl( 'https://vimeo.com/123456789' ),
			'https://player.vimeo.com/video/123456789'
		);
	} );

	it( 'returns null for an unrecognized URL', () => {
		assert.equal( getEmbedUrl( 'https://example.com/video' ), null );
		assert.equal( getEmbedUrl( 'not a url' ), null );
	} );
} );

describe( 'parseMarkdownListShortcut', () => {
	it( 'returns ul for -, *, and + markers', () => {
		assert.equal( parseMarkdownListShortcut( '-' ), 'ul' );
		assert.equal( parseMarkdownListShortcut( '*' ), 'ul' );
		assert.equal( parseMarkdownListShortcut( '+' ), 'ul' );
	} );

	it( 'returns ol for a 1. marker', () => {
		assert.equal( parseMarkdownListShortcut( '1.' ), 'ol' );
	} );

	it( 'tolerates trailing whitespace after the marker', () => {
		assert.equal( parseMarkdownListShortcut( '- ' ), 'ul' );
		assert.equal( parseMarkdownListShortcut( '1. ' ), 'ol' );
	} );

	it( 'returns null for anything else', () => {
		assert.equal( parseMarkdownListShortcut( '- item' ), null );
		assert.equal( parseMarkdownListShortcut( '2.' ), null );
		assert.equal( parseMarkdownListShortcut( 'text' ), null );
		assert.equal( parseMarkdownListShortcut( '' ), null );
	} );
} );

describe( 'parseMarkdownQuoteShortcut', () => {
	it( 'returns true for a lone > marker', () => {
		assert.equal( parseMarkdownQuoteShortcut( '>' ), true );
		assert.equal( parseMarkdownQuoteShortcut( '> ' ), true );
	} );

	it( 'returns false for anything else', () => {
		assert.equal( parseMarkdownQuoteShortcut( '> quote' ), false );
		assert.equal( parseMarkdownQuoteShortcut( 'text' ), false );
		assert.equal( parseMarkdownQuoteShortcut( '' ), false );
	} );
} );

describe( 'describeSaveError', () => {
	it( 'handles a WP REST error shape', () => {
		const err = {
			code: 'rest_cannot_edit',
			message: 'Sorry, you are not allowed to edit this post.',
			data: { status: 403 },
		};
		assert.deepEqual( describeSaveError( err ), {
			code: 'rest_cannot_edit',
			status: 403,
			message: 'Sorry, you are not allowed to edit this post.',
		} );
	} );

	it( 'falls back to the error name when there is no string code', () => {
		const err = { name: 'AbortError', message: 'The operation was aborted.' };
		const result = describeSaveError( err );
		assert.equal( result.code, 'AbortError' );
		assert.equal( result.status, null );
		assert.equal( result.message, 'The operation was aborted.' );
	} );

	it( 'ignores a numeric DOMException-style code and uses the name', () => {
		// A DOMException carries a numeric `.code` (AbortError is 20); the name
		// must win so telemetry reports 'AbortError', not 20.
		const err = { code: 20, name: 'AbortError', message: 'aborted' };
		assert.equal( describeSaveError( err ).code, 'AbortError' );
	} );

	it( 'reports unknown for a code-less, name-less object', () => {
		assert.equal( describeSaveError( {} ).code, 'unknown' );
	} );

	it( 'handles non-object throws', () => {
		assert.deepEqual( describeSaveError( 'boom' ), {
			code: 'unknown',
			status: null,
			message: 'boom',
		} );
		assert.deepEqual( describeSaveError( undefined ), {
			code: 'unknown',
			status: null,
			message: '',
		} );
	} );

	it( 'truncates long messages to the cap', () => {
		const long = 'x'.repeat( MAX_ERROR_MESSAGE_LENGTH + 50 );
		const result = describeSaveError( { code: 'boom', message: long } );
		assert.equal( result.message.length, MAX_ERROR_MESSAGE_LENGTH );
	} );

	it( 'coerces a non-numeric status to null', () => {
		const err = { code: 'boom', message: 'x', data: { status: 'nope' } };
		assert.equal( describeSaveError( err ).status, null );
	} );
} );
