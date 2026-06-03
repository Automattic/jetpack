import { render, screen, act } from '@testing-library/react';
import { VideoBlockAttributes } from '../../../types';
import Player from '../index';

// Mirror the real SandBox contract: when `allowSameOrigin` is false, the
// iframe is cross-origin and any property access on `iframe.contentWindow`
// from the parent throws SecurityError. When `allowSameOrigin` is true, the
// parent can reach into contentWindow as same-origin.
jest.mock( '@wordpress/components', () => {
	const actual = jest.requireActual( '@wordpress/components' );
	const React = jest.requireActual( 'react' );

	/**
	 * Stand-in for `@wordpress/components` SandBox that creates a real iframe
	 * child and switches its contentWindow between a same-origin Window and
	 * a cross-origin Proxy based on the `allowSameOrigin` prop.
	 *
	 * @param {object}  props                 - Props forwarded from VideoPress.
	 * @param {boolean} props.allowSameOrigin - Whether contentWindow should be same-origin.
	 * @return {ReactElement} A div hosting the simulated sandbox iframe.
	 */
	function SandBoxMock( { allowSameOrigin }: { allowSameOrigin?: boolean } ) {
		return React.createElement( 'div', {
			ref: ( host: HTMLDivElement | null ) => {
				// Direct DOM access is intentional — this mock simulates the real
				// SandBox's iframe creation, which Testing Library cannot express.
				// eslint-disable-next-line testing-library/no-node-access
				if ( ! host || host.querySelector( 'iframe.components-sandbox' ) ) {
					return;
				}
				const iframe = host.ownerDocument.createElement( 'iframe' );
				iframe.className = 'components-sandbox';

				if ( allowSameOrigin ) {
					Object.defineProperty( iframe, 'contentWindow', {
						value: globalThis,
						configurable: true,
					} );
				} else {
					// Any property read/write on a cross-origin Window throws
					// a SecurityError. The Proxy mirrors that.
					const throwSecurity = () => {
						throw new DOMException(
							'Blocked a frame with origin "https://sandbox.invalid" from accessing a cross-origin frame.',
							'SecurityError'
						);
					};
					const crossOriginWindow = new Proxy( {}, { get: throwSecurity, set: throwSecurity } );
					Object.defineProperty( iframe, 'contentWindow', {
						value: crossOriginWindow,
						configurable: true,
					} );
				}

				host.appendChild( iframe );
			},
		} );
	}

	return {
		__esModule: true,
		...actual,
		SandBox: SandBoxMock,
	};
} );

const baseAttributes: VideoBlockAttributes = {
	videoRatio: 100,
	autoplay: true,
	align: 'center',
	posterData: {
		type: 'media-library',
		id: 1,
		url: 'https://videopress.com/wp-content/uploads/2024/10/placeholder-video-1.mp4',
	},
};

const previewMock = {
	html: '',
	width: 0,
	height: 0,
	thumbnail_height: 0,
	thumbnail_width: 0,
	version: '',
	title: '',
	type: '',
	provider_name: '',
	provider_url: '',
};

const defaultProps = {
	showCaption: true,
	isSelected: false,
	attributes: baseAttributes,
	setAttributes: () => {},
	preview: previewMock,
	isRequestingEmbedPreview: false,
	html: '',
};

/**
 * Render while capturing the console.error stream. React routes errors
 * thrown inside effects through console.error instead of propagating out of
 * render(), so spying on that stream is how tests detect a SecurityError
 * thrown from the sandbox iframe.
 *
 * @param {React.ReactElement} element - The element to render.
 * @return {{ consoleErrors: unknown[][], view: ReturnType<typeof render> }} Captured console.error calls and the render result.
 */
function renderCapturingErrors( element: React.ReactElement ) {
	const consoleErrors: unknown[][] = [];
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- needed in the finally cleanup below.
	const spy = jest.spyOn( console, 'error' ).mockImplementation( ( ...args ) => {
		consoleErrors.push( args );
	} );
	try {
		const view = render( element );
		return { consoleErrors, view };
	} finally {
		spy.mockRestore();
	}
}

describe( 'Player', () => {
	it( 'should render', () => {
		render( <Player { ...defaultProps } /> );

		expect( screen.getByRole( 'figure' ) ).toBeInTheDocument();
	} );

	describe( 'setVideoPlayerTemporaryHeight null safety', () => {
		beforeEach( () => jest.useFakeTimers() );
		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'does not throw when the component unmounts before the deferred height calc runs', () => {
			// A deferred height calculation scheduled at mount dereferences the
			// wrapper ref. Unmounting before it fires must not crash.
			const { unmount } = render( <Player { ...defaultProps } /> );

			unmount();

			expect( () => jest.runAllTimers() ).not.toThrow();
		} );
	} );

	describe( 'cross-origin SandBox contract', () => {
		it( 'mounts without raising a SecurityError from the sandbox iframe', () => {
			const { consoleErrors } = renderCapturingErrors(
				<Player { ...defaultProps } html="<iframe src='https://videopress.com/e/abc' />" />
			);

			const securityErrors = consoleErrors.filter( call =>
				call.some(
					arg =>
						( arg instanceof Error && arg.name === 'SecurityError' ) ||
						( typeof arg === 'string' &&
							( arg.includes( 'SecurityError' ) || arg.includes( 'cross-origin' ) ) )
				)
			);

			expect( securityErrors ).toEqual( [] );
			expect( screen.getByRole( 'figure' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'videoPlayerEventsHandler origin check', () => {
		it( 'ignores videopress_loading_state events from untrusted origins', () => {
			render( <Player { ...defaultProps } /> );

			// Loading indicator is visible before any messages arrive.
			expect( screen.getByText( 'Loading\u2026' ) ).toBeInTheDocument();

			act( () => {
				window.dispatchEvent(
					new MessageEvent( 'message', {
						data: { event: 'videopress_loading_state', state: 'loaded' },
						origin: 'https://evil.com',
					} )
				);
			} );

			// Origin check blocked the event — loading indicator still visible.
			expect( screen.getByText( 'Loading\u2026' ) ).toBeInTheDocument();
		} );

		it( 'processes videopress_loading_state events from trusted origins', () => {
			render( <Player { ...defaultProps } /> );

			act( () => {
				window.dispatchEvent(
					new MessageEvent( 'message', {
						data: { event: 'videopress_loading_state', state: 'loaded' },
						origin: 'https://videopress.com',
					} )
				);
			} );

			// Trusted origin — handler ran and removed the loading indicator.
			expect( screen.queryByText( 'Loading\u2026' ) ).not.toBeInTheDocument();
		} );
	} );
} );
