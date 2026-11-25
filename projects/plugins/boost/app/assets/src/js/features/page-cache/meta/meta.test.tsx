/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-checked, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { recordBoostEvent } from '$lib/utils/analytics';
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

beforeEach( () => {
	mockLogging = false;
	mockClear.isPending = false;
	mockClear.mutate.mockClear();
	mockLoggingMutate.mockClear();
	jest.mocked( recordBoostEvent ).mockClear();
} );

it( 'clears the cache from a visible Clear cache button', () => {
	render( <PageCacheMeta /> );
	fireEvent.click( screen.getByRole( 'button', { name: 'Clear cache' } ) );
	expect( mockClear.mutate ).toHaveBeenCalledTimes( 1 );
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'page_cache_clear_clicked', {} );
} );

it( 'disables Clear cache while the cache is clearing', () => {
	mockClear.isPending = true;
	render( <PageCacheMeta /> );
	const button = screen.getByRole( 'button', { name: /Clear cache/ } );
	expect(
		button.hasAttribute( 'disabled' ) || button.getAttribute( 'aria-disabled' ) === 'true'
	).toBe( true );
	expect( screen.getByText( 'Clearing cache…' ) ).toBeTruthy();
} );

it( 'enables logging from the logging toggle and hides See logs until it is on', () => {
	render( <PageCacheMeta /> );
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
	render( <PageCacheMeta /> );
	expect(
		screen.getByRole< HTMLInputElement >( 'checkbox', { name: 'Enable logging' } ).checked
	).toBe( true );
	fireEvent.click( screen.getByRole( 'link', { name: 'See logs' } ) );
	expect( screen.getByRole( 'link', { name: 'See logs' } ).getAttribute( 'href' ) ).toBe(
		'#/cache-debug-log'
	);
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'page_cache_see_logs_clicked', {} );
} );

const openExamples = () => {
	render( <PageCacheMeta /> );
	fireEvent.click( screen.getByRole( 'button', { name: 'Except None' } ) );
	const trigger = screen.getByRole( 'button', { name: 'See examples' } );
	fireEvent.click( trigger );
	return trigger;
};

const focusExceptions = () => {
	const exceptions = screen.getByRole( 'textbox' );
	fireEvent.pointerDown( exceptions );
	exceptions.focus();
	return exceptions;
};

describe( 'Page Cache example tooltip', () => {
	it( 'opens from the trigger and closes with Escape', () => {
		const trigger = openExamples();
		expect( screen.getByText( 'Examples:' ) ).toBeTruthy();
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
		fireEvent.keyDown( trigger, { key: 'Escape' } );
		expect( screen.queryByText( 'Examples:' ) ).toBeNull();
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
	} );

	it( 'stays open when the Exceptions field is clicked', () => {
		openExamples();
		focusExceptions();
		expect( screen.getByText( 'Examples:' ) ).toBeTruthy();
	} );

	it( 'closes when something else is clicked', () => {
		openExamples();
		const elsewhere = screen.getByRole( 'button', { name: /^Clear cache$/i } );
		fireEvent.pointerDown( elsewhere );
		elsewhere.focus();
		expect( screen.queryByText( 'Examples:' ) ).toBeNull();
	} );

	it( 'still closes with Escape once focus has moved into the Exceptions field', () => {
		openExamples();
		const exceptions = focusExceptions();
		expect( screen.getByText( 'Examples:' ) ).toBeTruthy();
		fireEvent.keyDown( exceptions, { key: 'Escape' } );
		expect( screen.queryByText( 'Examples:' ) ).toBeNull();
	} );
} );
