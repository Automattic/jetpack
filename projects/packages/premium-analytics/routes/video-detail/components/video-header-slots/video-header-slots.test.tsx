import { SectionHeader } from '@jetpack-premium-analytics/ui';
import { render, screen } from '@testing-library/react';
import { videoHeaderSlots } from './video-header-slots';
import type { VideoSummary } from '../../hooks';

const SUMMARY: VideoSummary = {
	title: 'Launch recap',
	publishedDate: '2026-01-10T08:00:00',
	posterUrl: 'https://example.com/poster.jpg',
	isLoading: false,
	isError: false,
	isNotFound: false,
	refetch: () => {},
};

// UTC-anchored: the sentence renders in the site zone, so a browser-local
// `Date` would name the previous day in zones west of it.
const PERFORMANCE_RANGE = {
	from: new Date( Date.UTC( 2026, 6, 9 ) ),
	to: new Date( Date.UTC( 2026, 6, 15 ) ),
};

/**
 * Renders the slots where they are consumed, since only the header places them.
 *
 * @param args - The slot inputs under test.
 * @return The render result.
 */
function renderHeader( args: Parameters< typeof videoHeaderSlots >[ 0 ] ) {
	return render( <SectionHeader headingLevel={ 1 } { ...videoHeaderSlots( args ) } /> );
}

describe( 'videoHeaderSlots', () => {
	it( 'states the upload date and the window the widgets below report over', () => {
		renderHeader( {
			summary: SUMMARY,
			performanceRange: PERFORMANCE_RANGE,
		} );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Launch recap' );
		expect(
			screen.getByText(
				'Video uploaded on Jan 10, 2026. Performance from Jul 9, 2026 to Jul 15, 2026'
			)
		).toBeInTheDocument();
	} );

	it( 'drops the upload line when the video carries no date', () => {
		renderHeader( { summary: { ...SUMMARY, publishedDate: undefined } } );

		expect( screen.queryByText( /Video uploaded on/ ) ).not.toBeInTheDocument();
	} );

	it( 'names an untitled video rather than leaving the page without a heading', () => {
		renderHeader( { summary: { ...SUMMARY, title: '   ' } } );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Untitled video' );
	} );

	it.each( [
		[ 'isError' as const, 'Video unavailable' ],
		[ 'isNotFound' as const, 'Video not found' ],
	] )( 'names the page from %s and states no window', ( flag, heading ) => {
		renderHeader( {
			summary: { ...SUMMARY, [ flag ]: true },
			performanceRange: PERFORMANCE_RANGE,
		} );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( heading );
		expect( screen.queryByText( /Performance from/ ) ).not.toBeInTheDocument();
	} );

	it( 'holds the title and subtitle lines while the summary resolves', () => {
		renderHeader( { summary: { ...SUMMARY, title: undefined, isLoading: true } } );

		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Video uploaded on/ ) ).not.toBeInTheDocument();
	} );
} );
