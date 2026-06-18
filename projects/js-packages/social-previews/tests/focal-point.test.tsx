/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import * as React from 'react';
import {
	FacebookLinkPreview,
	TwitterPostPreview,
	ThreadsPostPreview,
	LinkedInPostPreview,
	InstagramPostPreview,
	MastodonPostPreview,
	BlueskyPostPreview,
	TumblrLinkPreview,
	NextdoorPostPreview,
} from '../src';
import { MediaImage, focalPointToObjectPosition } from '../src/shared/media-image';

// Mock @wordpress/components SandBox to avoid iframe initialization issues in tests.
// The mock prefix is required for jest to allow variable access in the factory.
const mockReact = React;
jest.mock( '@wordpress/components', () => {
	return {
		SandBox: ( { html, title }: { html: string; title: string } ) => {
			const iframeRef = mockReact.useRef< HTMLIFrameElement >( null );

			mockReact.useEffect( () => {
				if ( iframeRef.current ) {
					const doc = iframeRef.current.contentWindow?.document;
					if ( doc ) {
						doc.open();
						doc.write( html );
						doc.close();
					}
				}
			}, [ html ] );

			return mockReact.createElement( 'iframe', { ref: iframeRef, title } );
		},
	};
} );

const POST_URL = 'https://example.com/new-entry';
const POST_TITLE = 'Hello World';
const IMAGE_SRC = 'https://wordpress.com/someimagehere.png';

const FOCAL = { x: 0.25, y: 0.75 };
const FOCAL_POSITION = '25% 75%';

/**
 * Returns true when the element has an inline `object-position` style set.
 *
 * `not.toHaveStyle( 'object-position: X' )` passes even when a *different*
 * object-position is set, so for asserting absence we inspect the raw style
 * attribute directly.
 *
 * @param el - The element to inspect.
 * @return Whether the element declares an inline object-position.
 */
function hasObjectPosition( el: Element | null ): boolean {
	return !! el?.getAttribute( 'style' )?.includes( 'object-position' );
}

describe( 'MediaImage (unit)', () => {
	it( 'renders object-position from a focal point', () => {
		const { container } = render(
			<MediaImage src={ IMAGE_SRC } alt="" focalPoint={ { x: 0.25, y: 0.75 } } />
		);

		const img = container.querySelector( 'img' );

		expect( img ).toBeInTheDocument();
		expect( img ).toHaveStyle( { objectPosition: '25% 75%' } );
	} );

	it( 'renders 50% 50% for a centered focal point', () => {
		const { container } = render(
			<MediaImage src={ IMAGE_SRC } alt="" focalPoint={ { x: 0.5, y: 0.5 } } />
		);

		const img = container.querySelector( 'img' );

		expect( img ).toHaveStyle( { objectPosition: '50% 50%' } );
	} );

	it( 'emits no object-position when no focal point is given', () => {
		const { container } = render( <MediaImage src={ IMAGE_SRC } alt="" /> );

		const img = container.querySelector( 'img' );

		expect( img ).toBeInTheDocument();
		expect( hasObjectPosition( img ) ).toBe( false );
	} );

	it( 'passes through src, alt and className unchanged', () => {
		const { container } = render(
			<MediaImage src={ IMAGE_SRC } alt="my alt" className="my-class" />
		);

		const img = container.querySelector( 'img' );

		expect( img ).toHaveAttribute( 'src', IMAGE_SRC );
		expect( img ).toHaveAttribute( 'alt', 'my alt' );
		expect( img ).toHaveClass( 'my-class' );
	} );
} );

describe( 'focalPointToObjectPosition (centered-crop remap)', () => {
	// Square image in a 2:1 box → height overflows, half the image visible (ratio 0.5).
	it( 'remaps the overflowing vertical axis to center the crop on the focal point', () => {
		expect( focalPointToObjectPosition( { x: 0.5, y: 0.5 }, 1, 2 ) ).toEqual( { x: 0.5, y: 0.5 } );
		// 0.625 → (0.625 - 0.25) / 0.5 = 0.75 (a real shift, not just clamping).
		expect( focalPointToObjectPosition( { x: 0.5, y: 0.625 }, 1, 2 ) ).toEqual( {
			x: 0.5,
			y: 0.75,
		} );
		// A low focal point reaches the bottom edge sooner than raw object-position would.
		expect( focalPointToObjectPosition( { x: 0.3, y: 0.75 }, 1, 2 ) ).toEqual( { x: 0.3, y: 1 } );
		expect( focalPointToObjectPosition( { x: 0.3, y: 0.25 }, 1, 2 ) ).toEqual( { x: 0.3, y: 0 } );
	} );

	// 2:1 image in a square box → width overflows.
	it( 'remaps the overflowing horizontal axis when the image is wider than the box', () => {
		expect( focalPointToObjectPosition( { x: 0.75, y: 0.4 }, 2, 1 ) ).toEqual( { x: 1, y: 0.4 } );
		expect( focalPointToObjectPosition( { x: 0.5, y: 0.4 }, 2, 1 ) ).toEqual( { x: 0.5, y: 0.4 } );
	} );

	it( 'leaves the non-overflowing axis unchanged', () => {
		expect( focalPointToObjectPosition( { x: 0.1, y: 0.5 }, 1, 2 ).x ).toBe( 0.1 );
	} );

	it( 'passes the focal point through when image and box share an aspect ratio', () => {
		expect( focalPointToObjectPosition( { x: 0.2, y: 0.8 }, 1.5, 1.5 ) ).toEqual( {
			x: 0.2,
			y: 0.8,
		} );
	} );
} );

/**
 * Focal point applies to the link/card (og) image only — never to user-attached
 * media, which uploads full to the network. Each entry renders a platform's
 * link-card image with `image` + `imageFocalPoint` and points at the rendered
 * <img> to inspect.
 */
type PlatformCase = {
	name: string;
	render: ( imageFocalPoint?: { x: number; y: number } ) => React.ReactElement;
	selector: string;
};

const platforms: PlatformCase[] = [
	{
		name: 'facebook',
		render: imageFocalPoint => (
			<FacebookLinkPreview
				url={ POST_URL }
				title={ POST_TITLE }
				image={ IMAGE_SRC }
				imageFocalPoint={ imageFocalPoint }
			/>
		),
		selector: `.facebook-preview__image img[src="${ IMAGE_SRC }"]`,
	},
	{
		name: 'twitter',
		// The card renders only when no media is present.
		render: imageFocalPoint => (
			<TwitterPostPreview
				url={ POST_URL }
				title={ POST_TITLE }
				image={ IMAGE_SRC }
				imageFocalPoint={ imageFocalPoint }
			/>
		),
		selector: `img.twitter-preview__card-image[src="${ IMAGE_SRC }"]`,
	},
	{
		name: 'threads',
		render: imageFocalPoint => (
			<ThreadsPostPreview
				url={ POST_URL }
				title={ POST_TITLE }
				image={ IMAGE_SRC }
				imageFocalPoint={ imageFocalPoint }
			/>
		),
		selector: `img.threads-preview__card-image[src="${ IMAGE_SRC }"]`,
	},
	{
		name: 'linkedin',
		render: imageFocalPoint => (
			<LinkedInPostPreview
				url={ POST_URL }
				title={ POST_TITLE }
				name="user"
				profileImage=""
				image={ IMAGE_SRC }
				imageFocalPoint={ imageFocalPoint }
			/>
		),
		selector: `img.linkedin-preview__image[src="${ IMAGE_SRC }"]`,
	},
	{
		name: 'instagram',
		// Instagram has no separate link card; the standalone `image`/`imageFocalPoint`
		// renders in the same media slot.
		render: imageFocalPoint => (
			<InstagramPostPreview
				url={ POST_URL }
				name="user"
				profileImage=""
				image={ IMAGE_SRC }
				imageFocalPoint={ imageFocalPoint }
			/>
		),
		selector: `img.instagram-preview__media--image[src="${ IMAGE_SRC }"]`,
	},
	{
		name: 'mastodon',
		// The card renders only when the custom text contains the post URL.
		render: imageFocalPoint => (
			<MastodonPostPreview
				url={ POST_URL }
				title={ POST_TITLE }
				customText={ POST_URL }
				image={ IMAGE_SRC }
				imageFocalPoint={ imageFocalPoint }
			/>
		),
		selector: `.mastodon-preview__card-img img[src="${ IMAGE_SRC }"]`,
	},
	{
		name: 'bluesky',
		render: imageFocalPoint => (
			<BlueskyPostPreview
				url={ POST_URL }
				title={ POST_TITLE }
				image={ IMAGE_SRC }
				imageFocalPoint={ imageFocalPoint }
			/>
		),
		selector: `.bluesky-preview__card-image img[src="${ IMAGE_SRC }"]`,
	},
	{
		name: 'tumblr',
		render: imageFocalPoint => (
			<TumblrLinkPreview
				url={ POST_URL }
				title={ POST_TITLE }
				image={ IMAGE_SRC }
				imageFocalPoint={ imageFocalPoint }
			/>
		),
		selector: `img.tumblr-preview__image[src="${ IMAGE_SRC }"]`,
	},
	{
		name: 'nextdoor',
		render: imageFocalPoint => (
			<NextdoorPostPreview
				url={ POST_URL }
				title={ POST_TITLE }
				name="user"
				profileImage=""
				image={ IMAGE_SRC }
				imageFocalPoint={ imageFocalPoint }
			/>
		),
		selector: `img.nextdoor-preview__image[src="${ IMAGE_SRC }"]`,
	},
];

describe.each( platforms )(
	'$name link-card focal point (integration)',
	( { render: renderPreview, selector } ) => {
		it( 'applies object-position from imageFocalPoint', () => {
			const { container } = render( renderPreview( FOCAL ) );

			const img = container.querySelector( selector );

			expect( img ).toBeInTheDocument();
			expect( img ).toHaveStyle( { objectPosition: FOCAL_POSITION } );
		} );
	}
);
