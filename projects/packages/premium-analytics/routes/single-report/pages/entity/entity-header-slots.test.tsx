import { toLocalTZ } from '@jetpack-premium-analytics/datetime';
import { SectionHeader } from '@jetpack-premium-analytics/ui';
import { render, screen } from '@testing-library/react';
import { entityHeaderSlots } from './entity-header-slots';
import type { EntityRecordSummary } from './use-entity-summary';

const SUMMARY: EntityRecordSummary = {
	title: 'About us',
	publishedDate: '2025-08-19T10:00:00',
	imageUrl: 'https://example.com/thumb.jpg',
	url: 'https://example.com/about-us/',
	isLoading: false,
	isError: false,
	error: null,
	isNotFound: false,
	refetch: () => {},
};

const CONTEXT = { label: 'Page', title: 'About us' };

// UTC-anchored: the sentence renders in the site zone.
const PERFORMANCE_RANGE = {
	from: toLocalTZ( Date.UTC( 2026, 6, 9 ), 'UTC' ),
	to: toLocalTZ( Date.UTC( 2026, 6, 15 ), 'UTC' ),
};

/**
 * Renders the slots where they are consumed, since only the header places them.
 *
 * @param summary - The summary under test.
 * @param context - The label, the title and the window.
 * @return The render result.
 */
function renderHeader(
	summary: EntityRecordSummary,
	context: Parameters< typeof entityHeaderSlots >[ 1 ] = CONTEXT
) {
	return render( <SectionHeader { ...entityHeaderSlots( summary, context ) } /> );
}

describe( 'entityHeaderSlots', () => {
	it( 'states the record: its image, its title, its kind and publish date', () => {
		renderHeader( SUMMARY );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent( 'About us' );
		expect( screen.getByText( /^Page published on Aug 19, 2025\./ ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'entity-summary-image' ) ).toHaveAttribute(
			'src',
			'https://example.com/thumb.jpg'
		);
	} );

	it( 'leaves out the parts the record lacks', () => {
		const header = entityHeaderSlots(
			{ ...SUMMARY, publishedDate: undefined, imageUrl: undefined },
			{ ...CONTEXT, performanceRange: PERFORMANCE_RANGE }
		);

		// No visual of its own: the page's icon stands in.
		expect( header.visual ).toBeUndefined();
		expect( header.subTitle ).toBe( 'Performance from Jul 9, 2026 to Jul 15, 2026' );
	} );

	it.each( [
		[ 'missing', { isNotFound: true } ],
		[ 'failed', { isError: true } ],
	] )( 'states the page title alone for a %s entity', ( _name, state ) => {
		renderHeader(
			{ ...SUMMARY, title: undefined, ...state },
			{ label: 'Page', title: 'Page', performanceRange: PERFORMANCE_RANGE }
		);

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent( 'Page' );
		expect( screen.queryByText( /published on/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Performance from/ ) ).not.toBeInTheDocument();
	} );
} );
