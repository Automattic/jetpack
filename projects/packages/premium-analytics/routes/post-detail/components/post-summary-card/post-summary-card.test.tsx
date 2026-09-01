import { render, screen } from '@testing-library/react';
import { PostSummaryCard } from './post-summary-card';
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

describe( 'PostSummaryCard', () => {
	it( 'shows the post identity by default: thumbnail and publish wording', () => {
		render( <PostSummaryCard summary={ SUMMARY } /> );

		expect( screen.getByText( /Post published on Jan 10, 2026\./ ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'post-summary-image' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'post-summary-email-tile' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the email identity on the email variant: envelope tile and sent wording', () => {
		render( <PostSummaryCard summary={ SUMMARY } variant="email" /> );

		expect( screen.getByText( /Email sent on Jan 10, 2026\./ ) ).toBeInTheDocument();
		// The envelope tile replaces the featured image even when one exists.
		expect( screen.getByTestId( 'post-summary-email-tile' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'post-summary-image' ) ).not.toBeInTheDocument();
	} );

	it( 'holds the title and subtitle lines while the summary resolves', () => {
		render( <PostSummaryCard summary={ { ...SUMMARY, title: undefined, isLoading: true } } /> );

		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { level: 1 } ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Post published on/ ) ).not.toBeInTheDocument();
	} );

	// The state an email-tab deep link opens on: the tab fixes the identity, so
	// the envelope tile is already right while the title is still loading.
	it( 'keeps the email identity while the summary resolves', () => {
		render(
			<PostSummaryCard
				summary={ { ...SUMMARY, title: undefined, isLoading: true } }
				variant="email"
			/>
		);

		expect( screen.getByTestId( 'post-summary-email-tile' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Email sent on/ ) ).not.toBeInTheDocument();
	} );
} );
