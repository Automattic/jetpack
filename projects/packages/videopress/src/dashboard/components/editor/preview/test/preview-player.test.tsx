import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { makeLibraryItem } from '../../../../test-utils/library-item';
import { mockApiFetch } from '../../../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../../../test-utils/query-client-wrapper';
import { createEditSession } from '../../state/edit-session';
import StudioEditorPreviewPlayer from '../preview-player';
import type { StudioEditorPreviewPlayerHandle } from '../preview-player';
import type { ComponentProps } from 'react';

const VIDEO_TESTID = 'studio-editor-preview-video';

// jsdom's media element implements neither play() nor pause(); stub them to
// fire the events a real element would so the hook's state machine runs.
beforeEach( () => {
	mockApiFetch( () => ( {} ) );
	jest.spyOn( window.HTMLMediaElement.prototype, 'play' ).mockImplementation( function (
		this: HTMLMediaElement
	) {
		// Flip `paused` too: jsdom's is a constant true, which would trip the
		// hook's external-pause detection in the rAF loop.
		Object.defineProperty( this, 'paused', { configurable: true, get: () => false } );
		this.dispatchEvent( new Event( 'play' ) );
		return Promise.resolve();
	} );
	jest.spyOn( window.HTMLMediaElement.prototype, 'pause' ).mockImplementation( function (
		this: HTMLMediaElement
	) {
		Object.defineProperty( this, 'paused', { configurable: true, get: () => true } );
		this.dispatchEvent( new Event( 'pause' ) );
	} );
} );

afterEach( () => {
	jest.restoreAllMocks();
} );

const defaultProps = {
	video: makeLibraryItem( { sourceUrl: 'https://example.com/clip.mp4', durationSeconds: 60 } ),
	session: createEditSession( 60000 ),
};

/**
 * Render the player inside a QueryClient wrapper.
 *
 * @param overrides - Prop overrides for this test.
 * @return The render result.
 */
function renderPlayer(
	overrides: Partial< ComponentProps< typeof StudioEditorPreviewPlayer > > = {}
) {
	return render( <StudioEditorPreviewPlayer { ...defaultProps } { ...overrides } />, {
		wrapper: createTestWrapper(),
	} );
}

/**
 * The rendered <video> element.
 *
 * @return The video element.
 */
function getVideo(): HTMLVideoElement {
	return screen.getByTestId( VIDEO_TESTID ) as HTMLVideoElement;
}

describe( 'StudioEditorPreviewPlayer', () => {
	it( 'plays a public video straight from sourceUrl', () => {
		renderPlayer();
		expect( getVideo() ).toHaveAttribute( 'src', 'https://example.com/clip.mp4' );
	} );

	it( 'signs a private video with the playback token', async () => {
		mockApiFetch( () => ( { playback_token: 'tok123' } ) );
		renderPlayer( {
			video: makeLibraryItem( {
				sourceUrl: 'https://example.com/clip.mp4',
				isPrivate: true,
				privacy: 'private',
			} ),
		} );
		// No unsigned request while the token is in flight.
		expect( screen.queryByTestId( VIDEO_TESTID ) ).not.toBeInTheDocument();
		await waitFor( () =>
			expect( getVideo() ).toHaveAttribute(
				'src',
				'https://example.com/clip.mp4?metadata_token=tok123'
			)
		);
	} );

	it( 'explains when the item has no playable source', () => {
		renderPlayer( { video: makeLibraryItem( { sourceUrl: undefined } ) } );
		expect( screen.queryByTestId( VIDEO_TESTID ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'This video has no playable source.' ) ).toBeInTheDocument();
	} );

	it( 'shows the fallback duration in the transport row', () => {
		renderPlayer();
		expect( screen.getByText( '/ 0:01:00.0' ) ).toBeInTheDocument();
	} );

	it( 'toggles between Play and Pause', async () => {
		renderPlayer();
		await userEvent.click( screen.getByRole( 'button', { name: 'Play' } ) );
		expect( window.HTMLMediaElement.prototype.play ).toHaveBeenCalled();
		await userEvent.click( screen.getByRole( 'button', { name: 'Pause' } ) );
		expect( window.HTMLMediaElement.prototype.pause ).toHaveBeenCalled();
		expect( screen.getByRole( 'button', { name: 'Play' } ) ).toBeInTheDocument();
	} );

	it( 'renders no Preview cuts toggle (skip engine is always on)', () => {
		renderPlayer();
		expect( screen.queryByRole( 'checkbox', { name: 'Preview cuts' } ) ).not.toBeInTheDocument();
	} );

	it( 'commits a typed timecode on Enter and seeks the element', async () => {
		const onTimeUpdate = jest.fn();
		renderPlayer( { onTimeUpdate } );
		const input = screen.getByRole( 'textbox', { name: 'Current time' } );
		await userEvent.clear( input );
		await userEvent.type( input, '2{Enter}' );
		expect( getVideo().currentTime ).toBe( 2 );
		expect( input ).toHaveValue( '0:00:02.0' );
		expect( onTimeUpdate ).toHaveBeenLastCalledWith( 2000 );
	} );

	it( 'reverts a draft timecode on Escape', async () => {
		renderPlayer();
		const input = screen.getByRole( 'textbox', { name: 'Current time' } );
		await userEvent.clear( input );
		await userEvent.type( input, '5{Escape}' );
		expect( input ).toHaveValue( '0:00:00.0' );
		expect( getVideo().currentTime ).toBe( 0 );
	} );

	it( 'ignores an unparseable timecode on blur', async () => {
		renderPlayer();
		const input = screen.getByRole( 'textbox', { name: 'Current time' } );
		await userEvent.clear( input );
		await userEvent.type( input, 'not a time' );
		await userEvent.tab();
		expect( input ).toHaveValue( '0:00:00.0' );
		expect( getVideo().currentTime ).toBe( 0 );
	} );

	it( 'exposes seekTo through the imperative handle', () => {
		const ref = createRef< StudioEditorPreviewPlayerHandle >();
		render( <StudioEditorPreviewPlayer { ...defaultProps } ref={ ref } />, {
			wrapper: createTestWrapper(),
		} );
		act( () => ref.current?.seekTo( 1500 ) );
		expect( getVideo().currentTime ).toBe( 1.5 );
	} );
} );
