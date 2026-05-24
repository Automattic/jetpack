import { render } from '@testing-library/react';
import { VideoFramePicker } from '../index';

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

// usePreview hits the core oEmbed endpoint. Return a static preview so the
// picker settles synchronously and the SandBox receives its html.
jest.mock( '../../../../../hooks/use-preview', () => ( {
	__esModule: true,
	usePreview: () => ( {
		preview: { html: '<iframe src="https://videopress.com/e/abc" />' },
		isRequestingEmbedPreview: false,
	} ),
} ) );

/**
 * Render while capturing the console.error stream. React routes errors
 * thrown inside effects through console.error instead of propagating out of
 * render(), so spying on that stream is how tests detect a SecurityError
 * thrown from the sandbox iframe.
 *
 * @param {React.ReactElement} element - The element to render.
 * @return {{ consoleErrors: unknown[][] }} Captured console.error arguments.
 */
function renderCapturingErrors( element: React.ReactElement ) {
	const consoleErrors: unknown[][] = [];
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- needed in the finally cleanup below.
	const spy = jest
		.spyOn( console, 'error' )
		.mockImplementation( ( ...args ) => consoleErrors.push( args ) );
	try {
		render( element );
		return { consoleErrors };
	} finally {
		spy.mockRestore();
	}
}

describe( 'VideoFramePicker', () => {
	it( 'mounts without raising a SecurityError under Gutenberg 23 SandBox', () => {
		const { consoleErrors } = renderCapturingErrors(
			<VideoFramePicker
				guid="abcdef1234"
				atTime={ 0 }
				duration={ 10000 }
				onVideoFrameSelect={ () => {} }
			/>
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
	} );
} );
