const mockApiFetch = jest.fn();
const mockNavigate = jest.fn();
const mockRecordEvent = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( options: { path: string; method?: string } ) => mockApiFetch( options ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: () => ( { admin_url: 'https://example.com/wp-admin/', wpcom: { blog_id: 42 } } ),
	getSiteType: () => 'jetpack',
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OnboardingChecklist from '../onboarding-checklist';

const LIST_PATH = '/wpcom/v2/newsletter/task-lists/onboarding';

const STORAGE_KEY = 'jetpack-newsletter-onboarding-completed-42';

const getStored = () => JSON.parse( window.localStorage.getItem( STORAGE_KEY ) ?? 'null' );

/**
 * Build a task list response.
 *
 * @param completed - Ids of the completed tasks besides `start`.
 * @return The task list.
 */
function taskList( completed: string[] = [] ) {
	return {
		id: 'onboarding',
		tasks: [ 'start', 'subscribe_form', 'subscribers', 'send_newsletter' ].map( id => ( {
			id,
			complete: id === 'start' || completed.includes( id ),
		} ) ),
	};
}

/**
 * Render the checklist with an isolated query cache.
 */
function renderChecklist(): void {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );

	render(
		<QueryClientProvider client={ queryClient }>
			<OnboardingChecklist />
		</QueryClientProvider>
	);
}

const getStep = ( name: RegExp ) => screen.getByRole( 'button', { name } );
const findStep = ( name: RegExp ) => screen.findByRole( 'button', { name } );

beforeEach( () => {
	mockApiFetch.mockReset();
	mockNavigate.mockReset();
	mockRecordEvent.mockReset();
	mockApiFetch.mockResolvedValue( taskList() );
	window.localStorage.clear();
} );

describe( 'OnboardingChecklist', () => {
	it( 'loads the onboarding task list from WP.com', async () => {
		renderChecklist();

		await findStep( /start a newsletter/i );
		expect( mockApiFetch ).toHaveBeenCalledWith( { path: LIST_PATH } );
	} );

	it( 'renders every step with the first open step expanded', async () => {
		renderChecklist();

		expect( await findStep( /start a newsletter/i ) ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( getStep( /add a subscribe form to your site/i ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect( getStep( /get your first 3 subscribers/i ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		expect( getStep( /send your first newsletter/i ) ).toHaveAttribute( 'aria-expanded', 'false' );
	} );

	it( 'marks the steps WP.com reports complete and opens the next one', async () => {
		mockApiFetch.mockResolvedValue( taskList( [ 'subscribe_form' ] ) );
		renderChecklist();

		expect( await findStep( /add a subscribe form to your site/i ) ).toHaveAccessibleName(
			'Add a subscribe form to your siteComplete'
		);
		expect( getStep( /add a subscribe form to your site/i ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		expect( getStep( /get your first 3 subscribers/i ) ).toHaveAttribute( 'aria-expanded', 'true' );
	} );

	it( 'announces the completed start step in its accessible name', async () => {
		renderChecklist();

		expect( await findStep( /start a newsletter/i ) ).toHaveAccessibleName(
			'Start a newsletterComplete'
		);
	} );

	it( 'opens no step when every step is complete', async () => {
		mockApiFetch.mockResolvedValue(
			taskList( [ 'subscribe_form', 'subscribers', 'send_newsletter' ] )
		);
		renderChecklist();

		await findStep( /start a newsletter/i );
		expect( screen.queryByRole( 'button', { expanded: true } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps every step but the first open when the task list fails to load', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'offline' ) );
		renderChecklist();

		expect( await findStep( /start a newsletter/i ) ).toHaveAccessibleName(
			'Start a newsletterComplete'
		);
		expect( getStep( /add a subscribe form to your site/i ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Skip' } ) ).toBeVisible();
	} );

	it( 'shows the subscribe form step copy and actions', async () => {
		renderChecklist();

		expect(
			await screen.findByText(
				'Give visitors a way to subscribe: a form at the end of your posts, a pop-up, or a floating button.'
			)
		).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Add a subscribe form' } ) ).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Skip' } ) ).toBeVisible();
	} );

	it.each( [
		[ 'Add a subscribe form', 'subscribe_form', 'settings' ],
		[ 'Add subscribers', 'subscribers', 'subscribers' ],
	] )( '"%s" opens the %s tab', async ( action, step, tab ) => {
		mockApiFetch.mockResolvedValue(
			taskList( step === 'subscribers' ? [ 'subscribe_form' ] : [] )
		);
		renderChecklist();

		// eslint-disable-next-line testing-library/prefer-user-event -- Avoid adding a dependency for one click.
		fireEvent.click( await screen.findByRole( 'button', { name: action } ) );

		expect( mockNavigate ).toHaveBeenCalledWith( {
			search: { tab, subscriber: undefined, u: undefined },
		} );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_overview_checklist_click', {
			site_type: 'jetpack',
			step,
			action: 'primary',
		} );
	} );

	it( '"Write a post" links to a new post in the editor', async () => {
		mockApiFetch.mockResolvedValue( taskList( [ 'subscribe_form', 'subscribers' ] ) );
		renderChecklist();

		expect( await screen.findByRole( 'link', { name: 'Write a post' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/post-new.php'
		);
	} );

	it( 'Skip completes the step on WP.com and shows it as complete', async () => {
		mockApiFetch.mockImplementation( ( { method }: { method?: string } ) =>
			Promise.resolve( method === 'POST' ? taskList( [ 'subscribe_form' ] ) : taskList() )
		);
		renderChecklist();

		// eslint-disable-next-line testing-library/prefer-user-event -- Avoid adding a dependency for one click.
		fireEvent.click( await screen.findByRole( 'button', { name: 'Skip' } ) );

		await waitFor( () =>
			expect( getStep( /add a subscribe form to your site/i ) ).toHaveAccessibleName(
				'Add a subscribe form to your siteComplete'
			)
		);
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: `${ LIST_PATH }/tasks/subscribe_form/complete`,
			method: 'POST',
		} );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_overview_checklist_click', {
			site_type: 'jetpack',
			step: 'subscribe_form',
			action: 'skip',
		} );
		expect(
			screen.queryByRole( 'button', { name: 'Add a subscribe form' } )
		).not.toBeInTheDocument();
	} );

	it( 'records a checklist action on click and not on render', async () => {
		renderChecklist();

		await findStep( /start a newsletter/i );
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );
	it( 'keeps a copy of the completed steps in localStorage', async () => {
		mockApiFetch.mockResolvedValue( taskList( [ 'subscribers' ] ) );
		renderChecklist();

		await waitFor( () => expect( getStored() ).toEqual( [ 'start', 'subscribers' ] ) );
	} );

	it( 'shows the stored completed steps before WP.com answers', async () => {
		window.localStorage.setItem( STORAGE_KEY, JSON.stringify( [ 'start', 'subscribe_form' ] ) );
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );
		renderChecklist();

		expect( getStep( /add a subscribe form to your site/i ) ).toHaveAccessibleName(
			'Add a subscribe form to your siteComplete'
		);
		expect( getStep( /get your first 3 subscribers/i ) ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( mockApiFetch ).toHaveBeenCalledWith( { path: LIST_PATH } );
	} );

	it( 'does not ask WP.com when every step is stored as complete', async () => {
		window.localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify( [ 'start', 'subscribe_form', 'subscribers', 'send_newsletter' ] )
		);
		renderChecklist();

		expect( getStep( /send your first newsletter/i ) ).toHaveAccessibleName(
			'Send your first newsletterComplete'
		);
		expect( screen.queryByRole( 'button', { expanded: true } ) ).not.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'never drops a stored completion when WP.com answers', async () => {
		window.localStorage.setItem( STORAGE_KEY, JSON.stringify( [ 'start', 'subscribe_form' ] ) );
		mockApiFetch.mockResolvedValue( taskList( [ 'subscribers' ] ) );
		renderChecklist();

		await waitFor( () =>
			expect( getStored() ).toEqual( [ 'start', 'subscribe_form', 'subscribers' ] )
		);
		expect( getStep( /add a subscribe form to your site/i ) ).toHaveAccessibleName(
			'Add a subscribe form to your siteComplete'
		);
	} );

	it( 'stores a skipped step', async () => {
		mockApiFetch.mockImplementation( ( { method }: { method?: string } ) =>
			Promise.resolve( method === 'POST' ? taskList( [ 'subscribe_form' ] ) : taskList() )
		);
		renderChecklist();

		// eslint-disable-next-line testing-library/prefer-user-event -- Avoid adding a dependency for one click.
		fireEvent.click( await screen.findByRole( 'button', { name: 'Skip' } ) );

		await waitFor( () => expect( getStored() ).toEqual( [ 'start', 'subscribe_form' ] ) );
	} );

	it( 'ignores an unreadable stored copy', async () => {
		window.localStorage.setItem( STORAGE_KEY, '{not json' );
		renderChecklist();

		expect( await findStep( /add a subscribe form to your site/i ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
	} );
} );
