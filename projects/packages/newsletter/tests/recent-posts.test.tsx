import { fireEvent, render, screen } from '@testing-library/react';
import RecentPosts, { type RecentPost } from '../routes/dashboard/components/recent-posts';

const posts: RecentPost[] = [
	{
		id: 1,
		title: 'Sent newsletter',
		status: 'publish',
		date: '2026-07-23T12:00:00+00:00',
		url: 'https://example.com/sent-newsletter/',
		image: 'https://example.com/image.jpg',
		recipients: 122,
		openRatePercent: 58,
		clickRatePercent: 21,
	},
	{
		id: 2,
		title: 'Upcoming newsletter',
		status: 'draft',
		date: '2026-07-24T12:00:00+00:00',
		url: 'https://example.com/?p=2&preview=true',
		image: null,
		recipients: null,
		openRatePercent: null,
		clickRatePercent: null,
	},
];

const defaultProps = {
	posts,
	viewAllUrl: 'https://example.com/wp-admin/edit.php',
	createPostUrl: 'https://example.com/wp-admin/post-new.php',
	isLoading: false,
	isError: false,
	onRetry: jest.fn(),
};

describe( 'RecentPosts', () => {
	beforeEach( () => {
		defaultProps.onRetry.mockReset();
	} );

	it( 'renders published and draft posts with metrics only when available', () => {
		render( <RecentPosts { ...defaultProps } /> );

		expect( screen.getAllByRole( 'columnheader' ).map( cell => cell.textContent ) ).toEqual( [
			'Post',
			'Status',
			'Recipients',
			'Opens',
			'Clicks',
		] );
		expect( screen.getByRole( 'link', { name: 'Sent newsletter' } ) ).toHaveAttribute(
			'href',
			'https://example.com/sent-newsletter/'
		);
		expect( screen.getByRole( 'link', { name: 'Upcoming newsletter' } ) ).toHaveAttribute(
			'href',
			'https://example.com/?p=2&preview=true'
		);
		expect( screen.getByText( 'Published' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Draft' ) ).toBeInTheDocument();
		expect( screen.getByText( '122' ) ).toBeInTheDocument();
		expect( screen.getByText( '58%' ) ).toBeInTheDocument();
		expect( screen.getByText( '21%' ) ).toBeInTheDocument();
		expect( screen.getAllByText( '—' ) ).toHaveLength( 3 );
		expect( screen.getByTestId( 'post-image' ) ).toHaveAttribute(
			'src',
			'https://example.com/image.jpg'
		);
		expect( screen.getByTestId( 'post-image-placeholder' ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				new Intl.DateTimeFormat( undefined, { dateStyle: 'medium' } ).format(
					new Date( posts[ 0 ].date )
				)
			)
		).toBeInTheDocument();
		expect(
			screen.queryByText(
				new Intl.DateTimeFormat( undefined, { dateStyle: 'medium' } ).format(
					new Date( posts[ 1 ].date )
				)
			)
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
			'href',
			defaultProps.viewAllUrl
		);
	} );

	it( 'renders loading, empty, and error states with their actions', () => {
		const { rerender } = render( <RecentPosts { ...defaultProps } posts={ [] } isLoading /> );
		expect( screen.getByText( 'Loading recent posts…' ) ).toBeInTheDocument();

		rerender( <RecentPosts { ...defaultProps } posts={ [] } /> );
		expect( screen.getByText( 'No posts yet.' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Create a post' } ) ).toHaveAttribute(
			'href',
			defaultProps.createPostUrl
		);

		rerender( <RecentPosts { ...defaultProps } posts={ [] } isError /> );
		expect( screen.getByText( 'Recent posts could not be loaded.' ) ).toBeInTheDocument();
		// This direct callback test does not need user-event's pointer simulation.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( defaultProps.onRetry ).toHaveBeenCalledTimes( 1 );
	} );
} );
