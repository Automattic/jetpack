const mockGetScriptData = jest.fn();
const mockRecordEvent = jest.fn();
const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( options: unknown ) => mockApiFetch( options ),
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: ( ...args: unknown[] ) => mockGetScriptData( ...args ),
	getSiteData: () => ( { wpcom: { blog_id: 42 } } ),
	getSiteType: () => 'jetpack',
} ) );

jest.mock( '../../subscriber-stats-chart', () => ( {
	__esModule: true,
	default: () => <div data-testid="subscriber-stats-chart" />,
} ) );

// The checklist loads its own data; its behavior is covered in onboarding-checklist.test.tsx.
jest.mock( '../onboarding-checklist', () => ( {
	__esModule: true,
	default: () => <div data-testid="onboarding-checklist" />,
} ) );

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import OverviewBody from '..';

const STORAGE_KEY = 'jetpack-newsletter-onboarding-complete-42';

/**
 * Render the Overview tab with an isolated query cache.
 */
function renderOverview(): void {
	const queryClient = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	render(
		<QueryClientProvider client={ queryClient }>
			<OverviewBody />
		</QueryClientProvider>
	);
}

beforeEach( () => {
	mockGetScriptData.mockReset();
	mockRecordEvent.mockReset();
	mockApiFetch.mockReset();
	mockApiFetch.mockReturnValue( new Promise( () => {} ) );
	window.localStorage.clear();
	mockGetScriptData.mockReturnValue( {
		user: {
			current_user: {
				display_name: 'Ada Lovelace',
			},
		},
	} );
} );

describe( 'OverviewBody', () => {
	it( 'greets the current user and renders the introductory content', () => {
		renderOverview();

		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Welcome, Ada Lovelace' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { level: 3, name: 'Newsletters on WordPress.com' } )
		).toBeInTheDocument();
		expect(
			screen.getByText( /a newsletter lets people subscribe with their email address/i )
		).toBeInTheDocument();
	} );

	it( 'renders the fallback greeting when the display name is unavailable', () => {
		mockGetScriptData.mockReturnValue( undefined );

		renderOverview();

		expect( screen.getByRole( 'heading', { level: 2, name: 'Welcome' } ) ).toBeInTheDocument();
	} );

	it( 'renders the onboarding checklist', () => {
		renderOverview();

		expect( screen.getByTestId( 'onboarding-checklist' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'Start a newsletter', '2 min', 'https://wordpress.com/support/newsletter/' ],
		[
			'Send newsletter emails to subscribers',
			'4 min',
			'https://wordpress.com/support/newsletter/send-newsletter-emails/',
		],
		[ 'Newsletter settings', '5 min', 'https://wordpress.com/support/newsletter-settings/' ],
	] )( 'renders the %s guide as an external link', ( title, duration, href ) => {
		renderOverview();

		const link = screen.getByRole( 'link', {
			name: new RegExp( `${ title }.*opens in a new tab`, 'i' ),
		} );

		expect( link ).toHaveAttribute( 'href', href );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noreferrer' );
		expect( link ).toHaveTextContent( duration );
	} );

	it( 'records a guide click by slug', () => {
		renderOverview();

		// This direct callback test does not need user-event's pointer simulation.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click(
			screen.getByRole( 'link', { name: /send newsletter emails to subscribers/i } )
		);

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_overview_guide_click', {
			site_type: 'jetpack',
			guide: 'send_emails',
		} );
	} );

	it.each( [
		[ 'shows Stats and remembers it', true, 'subscriber-stats-chart', '1' ],
		[ 'keeps the onboarding view', false, 'onboarding-checklist', null ],
	] )( '%s when WP.com reports complete: %s', async ( _, complete, testId, stored ) => {
		mockApiFetch.mockResolvedValue( { id: 'onboarding', complete, tasks: [] } );
		renderOverview();

		await expect( screen.findByTestId( testId ) ).resolves.toBeInTheDocument();
		expect( window.localStorage.getItem( STORAGE_KEY ) ).toBe( stored );
	} );

	it( 'shows Stats without asking WP.com once onboarding is stored as done', () => {
		window.localStorage.setItem( STORAGE_KEY, '1' );
		renderOverview();

		expect( screen.getByTestId( 'subscriber-stats-chart' ) ).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
