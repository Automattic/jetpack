import { toLocalTZ } from '@jetpack-premium-analytics/datetime';
import { SectionHeader } from '@jetpack-premium-analytics/ui';
import { render, screen } from '@testing-library/react';
import { videoHeaderSlots } from './video-header-slots';
import type { VideoSummary } from './use-video-summary';

const SUMMARY: VideoSummary = {
	title: 'Launch recap',
	publishedDate: '2026-01-10T08:00:00',
	allTimeStart: '2026-01-10T08:00:00',
	posterUrl: 'https://example.com/poster.jpg',
	isLoading: false,
	isError: false,
	error: null,
	isNotFound: false,
	refetch: () => {},
};

// UTC-anchored: the sentence renders in the site zone, so a browser-local
// `Date` would name the previous day in zones west of it.
const PERFORMANCE_RANGE = {
	from: toLocalTZ( Date.UTC( 2026, 6, 9 ), 'UTC' ),
	to: toLocalTZ( Date.UTC( 2026, 6, 15 ), 'UTC' ),
};

/**
 * Renders the slots where they are consumed, since only the header places them.
 *
 * @param summary          - The summary under test.
 * @param performanceRange - The committed report date range.
 * @return The render result.
 */
function renderHeader( summary: VideoSummary, performanceRange?: typeof PERFORMANCE_RANGE ) {
	return render(
		<SectionHeader { ...videoHeaderSlots( summary, { label: 'Video', performanceRange } ) } />
	);
}

describe( 'videoHeaderSlots', () => {
	it( 'states the upload date and the window the widgets below report over', () => {
		renderHeader( SUMMARY, PERFORMANCE_RANGE );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent( 'Launch recap' );
		expect(
			screen.getByText(
				'Video uploaded on Jan 10, 2026. Performance from Jul 9, 2026 to Jul 15, 2026'
			)
		).toBeInTheDocument();
	} );

	it( 'drops the upload line when the video carries no date', () => {
		renderHeader( { ...SUMMARY, publishedDate: undefined } );

		expect( screen.queryByText( /Video uploaded on/ ) ).not.toBeInTheDocument();
	} );

	it( 'names an untitled video rather than leaving the page without a heading', () => {
		renderHeader( { ...SUMMARY, title: '   ' } );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent( 'Untitled video' );
	} );

	it.each( [
		[ 'isError' as const, 'Video unavailable' ],
		[ 'isNotFound' as const, 'Video not found' ],
	] )( 'names the page from %s and states no window', ( flag, heading ) => {
		renderHeader( { ...SUMMARY, [ flag ]: true }, PERFORMANCE_RANGE );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent( heading );
		expect( screen.queryByText( /Performance from/ ) ).not.toBeInTheDocument();
	} );

	it( 'holds the title and subtitle lines while the summary resolves', () => {
		renderHeader( { ...SUMMARY, title: undefined, isLoading: true } );

		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Video uploaded on/ ) ).not.toBeInTheDocument();
	} );
} );
