/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-checked, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { recordBoostEvent } from '$lib/utils/analytics';
import { ModuleSurfaceProvider } from '$features/module/surface';
import PageCacheMeta from './meta';

const mockLoggingMutate = jest.fn();
const mockClear = { mutate: jest.fn(), isPending: false };
let mockLogging = false;
jest.mock( '@automattic/jetpack-react-data-sync-client', () => ( {
	useDataSyncSubset: ( _query: unknown, key: string ) =>
		key === 'logging'
			? [ mockLogging, { mutate: mockLoggingMutate, isError: false } ]
			: [ [], { mutate: jest.fn(), isError: false } ],
} ) );
jest.mock( '$lib/stores/page-cache', () => ( {
	usePageCache: () => ( {} ),
	useClearPageCacheAction: () => [ '', mockClear ],
} ) );
jest.mock( '$features/ui', () => ( { useMutationNotice: jest.fn() } ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

const renderModern = () =>
	render(
		<ModuleSurfaceProvider value="row">
			<PageCacheMeta />
		</ModuleSurfaceProvider>
	);

beforeEach( () => {
	mockLogging = false;
	mockClear.isPending = false;
	mockClear.mutate.mockClear();
	mockLoggingMutate.mockClear();
	jest.mocked( recordBoostEvent ).mockClear();
} );

it( 'clears the cache from a visible Clear cache button', () => {
	renderModern();
	expect( screen.queryByRole( 'button', { name: 'Show Options' } ) ).toBeNull();
	fireEvent.click( screen.getByRole( 'button', { name: 'Clear cache' } ) );
	expect( mockClear.mutate ).toHaveBeenCalledTimes( 1 );
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'page_cache_clear_clicked', {} );
} );

it( 'disables Clear cache while the cache is clearing', () => {
	mockClear.isPending = true;
	renderModern();
	const button = screen.getByRole( 'button', { name: /Clear cache/ } );
	expect(
		button.hasAttribute( 'disabled' ) || button.getAttribute( 'aria-disabled' ) === 'true'
	).toBe( true );
	expect( screen.getByText( 'Clearing cache…' ) ).toBeTruthy();
} );

it( 'enables logging from the logging toggle and hides See logs until it is on', () => {
	renderModern();
	expect( screen.queryByRole( 'link', { name: 'See logs' } ) ).toBeNull();
	const toggle = screen.getByRole< HTMLInputElement >( 'checkbox', { name: 'Enable logging' } );
	expect( toggle.checked ).toBe( false );
	expect( screen.getByText( 'Track all your cache events' ) ).toBeTruthy();
	fireEvent.click( toggle );
	expect( mockLoggingMutate ).toHaveBeenCalledWith( true );
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'page_cache_toggle_logging', {} );
} );

it( 'links to the Cache Log when logging is on', () => {
	mockLogging = true;
	renderModern();
	expect(
		screen.getByRole< HTMLInputElement >( 'checkbox', { name: 'Enable logging' } ).checked
	).toBe( true );
	fireEvent.click( screen.getByRole( 'link', { name: 'See logs' } ) );
	expect( screen.getByRole( 'link', { name: 'See logs' } ).getAttribute( 'href' ) ).toBe(
		'#/cache-debug-log'
	);
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'page_cache_see_logs_clicked', {} );
} );

it( 'keeps the legacy Clear Cache link and logging checkbox', () => {
	mockLogging = true;
	render( <PageCacheMeta /> );
	expect( screen.getByText( 'Logging activated.', { exact: false } ) ).toBeTruthy();
	fireEvent.click( screen.getByRole( 'button', { name: 'Clear Cache' } ) );
	expect( mockClear.mutate ).toHaveBeenCalledTimes( 1 );
	fireEvent.click( screen.getByRole( 'button', { name: 'Show Options' } ) );
	expect(
		screen.getByRole( 'checkbox', { name: 'Activate logging to track all your cache events.' } )
	).toBeTruthy();
	expect( screen.getByRole( 'link', { name: 'See Logs' } ) ).toBeTruthy();
} );
