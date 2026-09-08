/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
/**
 * Instagram media container: aspect-ratio clamping and the loading guard.
 *
 * Instagram crops feed media into a fixed range — 4:5 (0.8) at its tallest,
 * 1.91:1 at its widest — so the preview clamps the image's natural ratio into
 * that range once it loads. The container is hidden until the ratio is known,
 * which means anything that never reports a load must not be gated on it.
 */

import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { InstagramPostPreview } from '../src/instagram-preview/post-preview';

const BASE = {
	url: 'https://wordpress.com/',
	name: 'testuser',
	profileImage: '',
	caption: 'Hello from Instagram',
};

const MEDIA_SELECTOR = '.instagram-preview__media';

/**
 * Renders the preview and fires a load event carrying the given natural size.
 *
 * @param naturalWidth  - The image's natural width.
 * @param naturalHeight - The image's natural height.
 * @return The media container element after the load event.
 */
const loadImageWithSize = ( naturalWidth: number, naturalHeight: number ) => {
	const { container } = render( <InstagramPostPreview { ...BASE } image="test.png" /> );
	const img = container.querySelector( '.instagram-preview__media--image' ) as HTMLImageElement;

	Object.defineProperty( img, 'naturalWidth', { value: naturalWidth } );
	Object.defineProperty( img, 'naturalHeight', { value: naturalHeight } );
	fireEvent.load( img );

	return container.querySelector( MEDIA_SELECTOR ) as HTMLElement;
};

describe( 'Instagram aspect ratio', () => {
	it( 'keeps a ratio that is already within range', () => {
		// Square (1:1) is inside Instagram's range, so it is used as-is.
		expect( loadImageWithSize( 600, 600 ) ).toHaveStyle( { aspectRatio: '1 / 1' } );
	} );

	it( 'clamps a too-tall image to 4:5', () => {
		// A 1:2 portrait is taller than Instagram allows; it crops to 4:5.
		expect( loadImageWithSize( 500, 1000 ) ).toHaveStyle( { aspectRatio: '0.8 / 1' } );
	} );

	it( 'clamps a too-wide image to 1.91:1', () => {
		// A 3:1 panorama is wider than Instagram allows; it crops to 1.91:1.
		expect( loadImageWithSize( 3000, 1000 ) ).toHaveStyle( { aspectRatio: '1.91 / 1' } );
	} );
} );

describe( 'Instagram loading guard', () => {
	it( 'hides the container only while an image is actually loading', () => {
		const { container } = render( <InstagramPostPreview { ...BASE } image="test.png" /> );

		expect( container.querySelector( MEDIA_SELECTOR ) ).toHaveClass( 'is-loading' );
	} );

	it( 'does not hide a video post, which never reports an image load', () => {
		const { container } = render(
			<InstagramPostPreview { ...BASE } media={ [ { type: 'video/mp4', url: 'v.mp4' } ] } />
		);

		expect( container.querySelector( MEDIA_SELECTOR ) ).not.toHaveClass( 'is-loading' );
	} );

	it( 'does not hide a post with no media at all', () => {
		const { container } = render( <InstagramPostPreview { ...BASE } /> );

		expect( container.querySelector( MEDIA_SELECTOR ) ).not.toHaveClass( 'is-loading' );
	} );
} );
