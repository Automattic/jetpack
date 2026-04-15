import { render, screen, act } from '@testing-library/react';
import { VideoBlockAttributes } from '../../../types';
import Player from '../index';

// Make the Player's message listener attach to the real jsdom window so we can
// dispatch events in tests. The hook's internal calls are unaffected (same-module
// scope), keeping them inert.
jest.mock( '../../../../../hooks/use-video-player', () => {
	const actual = jest.requireActual( '../../../../../hooks/use-video-player' );
	return {
		__esModule: true,
		...actual,
		getIframeWindowFromRef: jest.fn( () => globalThis ),
	};
} );

// Stub SandBox to a plain div — the real component injects iframe scripts that
// trigger MutationObserver errors in jsdom when no actual browser context exists.
jest.mock( '@wordpress/components', () => {
	const actual = jest.requireActual( '@wordpress/components' );
	return {
		__esModule: true,
		...actual,
		SandBox: () => null,
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

describe( 'Player', () => {
	it( 'should render', () => {
		render( <Player { ...defaultProps } /> );

		expect( screen.getByRole( 'figure' ) ).toBeInTheDocument();
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
