import { getMediaSourceUrl, getPostImageUrl } from '../utils';
import type { Attachment } from '@wordpress/core-data';

describe( 'getMediaSourceUrl', () => {
	it( 'should return empty string for null media', () => {
		expect( getMediaSourceUrl( null ) ).toBe( '' );
	} );

	it( 'should return large size URL when available', () => {
		const media = {
			source_url: 'https://example.com/full.jpg',
			media_details: {
				sizes: {
					large: {
						source_url: 'https://example.com/large.jpg',
					},
				},
			},
		} as unknown as Attachment;

		expect( getMediaSourceUrl( media ) ).toBe( 'https://example.com/large.jpg' );
	} );

	it( 'should fall back to source_url when large size is not available', () => {
		const media = {
			source_url: 'https://example.com/full.jpg',
		} as unknown as Attachment;

		expect( getMediaSourceUrl( media ) ).toBe( 'https://example.com/full.jpg' );
	} );
} );

describe( 'getPostImageUrl', () => {
	it( 'should return null for empty content', () => {
		expect( getPostImageUrl( '' ) ).toBeNull();
	} );

	it( 'should return null when no images in content', () => {
		expect( getPostImageUrl( '<p>Some text without images</p>' ) ).toBeNull();
	} );

	it( 'should extract image URL from content', () => {
		const content = '<p>Some text</p><img src="https://example.com/image.jpg" /><p>More text</p>';
		expect( getPostImageUrl( content ) ).toBe( 'https://example.com/image.jpg' );
	} );

	it( 'should return first image when multiple images exist', () => {
		const content = `
			<img src="https://example.com/first.jpg" />
			<img src="https://example.com/second.jpg" />
		`;
		expect( getPostImageUrl( content ) ).toBe( 'https://example.com/first.jpg' );
	} );
} );
