import { SectionHeader } from '@jetpack-premium-analytics/ui';
import { render, screen } from '@testing-library/react';
import { postHeaderSlots } from './post-header-slots';
import type { PostSummary } from '../../hooks';

const SUMMARY: PostSummary = {
	title: 'Hello world',
	type: 'post',
	publishedDate: '2026-01-10T08:00:00',
	imageUrl: 'https://example.com/thumb.jpg',
	url: 'https://example.com/hello-world',
	isLoading: false,
	isError: false,
};

/**
 * Renders the slots where they are consumed, since only the header places them.
 *
 * @param args - The slot inputs under test.
 * @return The render result.
 */
function renderHeader( args: Parameters< typeof postHeaderSlots >[ 0 ] ) {
	return render( <SectionHeader headingLevel={ 1 } { ...postHeaderSlots( args ) } /> );
}

describe( 'postHeaderSlots', () => {
	it( 'shows the post identity by default: thumbnail and publish wording', () => {
		renderHeader( { summary: SUMMARY } );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Hello world' );
		expect( screen.getByText( /Post published on Jan 10, 2026\./ ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'post-summary-image' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'post-summary-email-tile' ) ).not.toBeInTheDocument();
	} );

	it( 'states the window the widgets below report over', () => {
		renderHeader( {
			summary: SUMMARY,
			performanceRange: { from: new Date( 2026, 6, 9 ), to: new Date( 2026, 6, 15 ) },
		} );

		expect(
			screen.getByText( /Performance from Jul 9, 2026 to Jul 15, 2026/ )
		).toBeInTheDocument();
	} );

	it( 'shows the email identity on the email variant: envelope tile and sent wording', () => {
		renderHeader( { summary: SUMMARY, variant: 'email' } );

		expect( screen.getByText( /Email sent on Jan 10, 2026\./ ) ).toBeInTheDocument();
		// The envelope tile replaces the featured image even when one exists.
		expect( screen.getByTestId( 'post-summary-email-tile' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'post-summary-image' ) ).not.toBeInTheDocument();
	} );

	it( 'holds the title and subtitle lines while the summary resolves', () => {
		renderHeader( { summary: { ...SUMMARY, title: undefined, isLoading: true } } );

		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Post published on/ ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'post', 'Untitled post' ],
		[ 'page', 'Untitled page' ],
	] )( 'names an unresolved %s so the page keeps its heading', ( type, heading ) => {
		renderHeader( { summary: { ...SUMMARY, type, title: undefined, isError: true } } );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( heading );
	} );

	it( 'marks the text cell busy only while the summary resolves', () => {
		const { rerender } = renderHeader( {
			summary: { ...SUMMARY, title: undefined, isLoading: true },
		} );

		// eslint-disable-next-line testing-library/no-node-access -- The text cell the slot fills has no accessible query target.
		expect( screen.getByRole( 'heading', { level: 1 } ).parentElement ).toHaveAttribute(
			'aria-busy',
			'true'
		);

		rerender( <SectionHeader headingLevel={ 1 } { ...postHeaderSlots( { summary: SUMMARY } ) } /> );

		// eslint-disable-next-line testing-library/no-node-access -- The text cell the slot fills has no accessible query target.
		expect( screen.getByRole( 'heading', { level: 1 } ).parentElement ).not.toHaveAttribute(
			'aria-busy'
		);
	} );

	// The state an email-tab deep link opens on: the tab fixes the identity, so
	// the envelope tile is already right while the title is still loading.
	it( 'keeps the email identity while the summary resolves', () => {
		renderHeader( {
			summary: { ...SUMMARY, title: undefined, isLoading: true },
			variant: 'email',
		} );

		expect( screen.getByTestId( 'post-summary-email-tile' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Email sent on/ ) ).not.toBeInTheDocument();
	} );
} );
